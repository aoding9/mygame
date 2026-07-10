import express from 'express';
import multer from 'multer';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { initDatabase } from '../db/db.js';
import { createLibraryStore } from '../db/library-store.js';
import { createMetaStore } from '../db/meta-store.js';
import { createGameOverrideStore } from '../db/game-override-store.js';
import { createCoverService } from '../services/cover-service.js';
import { searchGamesByName } from '../services/game-lookup.js';
import {
  getAuthState,
  loadStoredToken,
  readStoredTokenMeta,
  saveStoredToken,
  validateAccessToken,
  parseTokenExpiry,
  parseSteamIdFromToken,
  extractWebApiToken,
} from '../steam/auth.js';
import { createUsersStore } from '../stores/users-store.js';
import { createFavoritesStore } from '../stores/favorites-store.js';
import { createHiddenStore } from '../stores/hidden-store.js';
import { createAppSettingsStore } from '../stores/app-settings-store.js';
import { setLocalPathOptions } from '../services/local-path-options.js';
import { detectSteamInstallPaths, importHiddenFromLocalSteam } from '../steam/hidden-games.js';
import { attachSteamCollectionsToGames, listSteamCollectionsForFilter, readSteamCollections } from '../steam/collections.js';
import { createCollectionsStore } from '../stores/collections-store.js';
import { cleanLegacyBrowserProfiles, cleanOrphanCovers } from '../services/cache-cleanup.js';
import { isSteamTokenLocallyValid } from '../services/token-validity.js';
import { mergeSteamLibraryGames, readSteamLocalLibraryGames, readSteamInstalledAppIds, launchSteamGame, openSteamInstallPage } from '../platforms/steam-local.js';
import {
  buildGameListResponse,
  parseGameFilters,
  pickRandomFromGames,
} from '../services/game-filters.js';
import { createCoverLocalizeSkipStore } from '../stores/cover-localize-skip-store.js';
import {
  resolveSteamCoverCandidates,
} from '../services/steam-cover-urls.js';
import { createRuntimeLogger } from '../services/runtime-logger.js';
import { resolvePort } from '../../scripts/resolve-port.js';

export const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = join(__dirname, '../..');
export const DATA_DIR = join(ROOT_DIR, 'data');
export const PORT = resolvePort(ROOT_DIR);
export const META_DIR = join(DATA_DIR, 'meta');
export const COVERS_DIR = join(DATA_DIR, 'covers');
export const LOG_DIR = join(DATA_DIR, 'logs');

const appSettingsStore = createAppSettingsStore(DATA_DIR);
const coverLocalizeSkipStore = createCoverLocalizeSkipStore(DATA_DIR);

function syncLocalPathOptions() {
  const settings = appSettingsStore.get();
  setLocalPathOptions(settings);
  return settings;
}

const initialSettings = syncLocalPathOptions();
const logger = createRuntimeLogger({
  logDir: LOG_DIR,
  level: initialSettings.logLevel,
  toFile: initialSettings.logToFile,
});

let steamDispatcher = initialSettings.httpsProxy
  ? new ProxyAgent(initialSettings.httpsProxy)
  : undefined;
let coverCleanupTimer = null;

const db = initDatabase(DATA_DIR);
const libraryStore = createLibraryStore(db);
const overrideStore = createGameOverrideStore(db, COVERS_DIR);
const gameMetaStore = createMetaStore(db, DATA_DIR, (label, detail) => logger.info(label, detail));
const usersStore = createUsersStore(DATA_DIR);
const favoritesStore = createFavoritesStore(DATA_DIR);
const hiddenStore = createHiddenStore(DATA_DIR);
const collectionsStore = createCollectionsStore(DATA_DIR);

function resolveEffectiveSteamPath(userId = '') {
  const appSteamPath = appSettingsStore.get().steamPath;
  if (appSteamPath) return appSteamPath;
  if (userId) {
    const userSteamPath = hiddenStore.getSettings(userId).steamPath;
    if (userSteamPath) return userSteamPath;
    const collectionsSteamPath = collectionsStore.getSettings(userId).steamPath;
    if (collectionsSteamPath) return collectionsSteamPath;
  }
  return '';
}

function buildLocalPathDetection(settings = appSettingsStore.get()) {
  return {
    steam: detectSteamInstallPaths(settings.steamPath),
  };
}

function updateSteamProxy(httpsProxy = '') {
  const url = String(httpsProxy || '').trim();
  steamDispatcher = url ? new ProxyAgent(url) : undefined;
}

function debugLog(label, detail) {
  logger.info(label, detail);
}

function runCoverCleanup() {
  const settings = appSettingsStore.get();
  return cleanOrphanCovers({
    coversDir: COVERS_DIR,
    referencedPaths: overrideStore.listReferencedCoverLocals(),
    ttlMs: settings.coverOrphanTtlDays * 24 * 60 * 60 * 1000,
    debugLog,
  });
}

function scheduleCoverCleanup(intervalHours) {
  if (coverCleanupTimer) clearInterval(coverCleanupTimer);
  const hours = Math.max(1, Number(intervalHours) || 24);
  coverCleanupTimer = setInterval(() => {
    try {
      runCoverCleanup();
    } catch (err) {
      logger.warn('封面清理失败', { message: err.message });
    }
  }, hours * 60 * 60 * 1000);
}

function applyAppSettings(settings = appSettingsStore.get()) {
  syncLocalPathOptions();
  logger.configure({
    level: settings.logLevel,
    toFile: settings.logToFile,
  });
  updateSteamProxy(settings.httpsProxy);
  scheduleCoverCleanup(settings.coverCleanupIntervalHours);
}

applyAppSettings(initialSettings);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

function wrapSteamNetworkError(err, label = 'Steam') {
  const code = err?.cause?.code || err?.code || '';
  const detail = err?.cause?.message || err?.message || 'fetch failed';
  if (/fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|ECONNREFUSED|UND_ERR/i.test(`${code} ${detail}`)) {
    return new Error(`${label}网络异常（${code || detail}），请检查代理/VPN 或在设置中填写 HTTPS 代理`);
  }
  return err instanceof Error ? err : new Error(String(err));
}

let coverService;

function platformLog(platform, label, detail) {
  debugLog(`[${platform}] ${label}`, detail);
}

const app = express();
app.use(express.json());
app.use(logger.requestMiddleware());

function normalizeApiKey(key) {
  return String(key || '').trim().replace(/\s+/g, '');
}

function isValidApiKey(apiKey) {
  return /^[A-Fa-f0-9]{32}$/.test(normalizeApiKey(apiKey));
}

function assertApiKeyFormat(apiKey) {
  if (!isValidApiKey(apiKey)) {
    if (!apiKey) throw new Error('请先连接 Steam 并填写 API Key');
    throw new Error('API Key 格式不正确，应为 32 位字母和数字');
  }
}

function applySteamAuthParams(params, apiKey, accessToken) {
  if (isValidApiKey(apiKey)) {
    params.set('key', normalizeApiKey(apiKey));
    return;
  }
  if (accessToken) {
    params.set('access_token', accessToken);
    return;
  }
  throw new Error('请先连接 Steam 并保存 Token');
}

function ensureGamesAuth(apiKey, accessToken) {
  if (isValidApiKey(apiKey) || accessToken) return;
  throw new Error('请先连接 Steam 并保存 Token');
}

async function steamFetch(url, options = {}) {
  try {
    if (steamDispatcher) {
      return await undiciFetch(url, { ...options, dispatcher: steamDispatcher });
    }
    return await fetch(url, options);
  } catch (err) {
    throw wrapSteamNetworkError(err);
  }
}

coverService = createCoverService(DATA_DIR, steamFetch, overrideStore);

function explainHtmlError(text) {
  const lower = text.toLowerCase();
  if (lower.includes('unauthorized') || lower.includes('access is denied')) {
    return 'API Key 无效，请到 https://steamcommunity.com/dev/apikey 重新申请并完整复制 32 位 Key';
  }
  if (lower.includes('403') || lower.includes('forbidden') || lower.includes('blocked')) {
    return '网络无法访问 Steam，请在侧边栏「设置」中填写 HTTPS 代理，如 http://127.0.0.1:7890';
  }
  return 'Steam 返回了异常网页，请检查 API Key 是否正确，或配置代理/VPN 后再试';
}

async function parseJsonResponse(res, label) {
  const text = await res.text();
  const contentType = res.headers.get('content-type') || '';

  if (!contentType.includes('application/json') && text.trimStart().startsWith('<')) {
    throw new Error(`${label}：${explainHtmlError(text)}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} 响应格式异常，请稍后重试`);
  }
}

function readCache(cacheKey) {
  return libraryStore.read('steam', cacheKey);
}

function writeCache(cacheKey, games, steamIds = []) {
  return libraryStore.write('steam', cacheKey, games, { steamIds });
}

function defaultSteamCoverUrl(game) {
  const candidates = resolveSteamCoverCandidates(game);
  return candidates[0] || '';
}

function resolveGameDefaultCover(game, platform) {
  if (platform === 'steam') {
    const candidates = resolveSteamCoverCandidates(game);
    return candidates[0] || '';
  }
  if (game?.cover_url?.startsWith('http')) return game.cover_url;
  if (game?.img_icon_url?.startsWith('http')) return game.img_icon_url;
  return '';
}

async function runCoverLocalization(games, platform, options = {}) {
  if (!games?.length || !coverService) {
    return { done: 0, failed: 0, pending: 0, remaining: 0, skipped: 0 };
  }

  let retryCleared = 0;
  if (options.retryFailed) {
    retryCleared = coverLocalizeSkipStore.clearPlatform(platform);
    if (retryCleared > 0) {
      logger.info('已清除封面本地化失败记录', { platform, cleared: retryCleared });
    }
  }

  const skippedAppIds = options.retryFailed
    ? new Set()
    : coverLocalizeSkipStore.loadSkippedSet(platform);

  const result = await coverService.localizeDefaultCovers(
    games,
    platform,
    (game) => (platform === 'steam'
      ? resolveSteamCoverCandidates(game)
      : [resolveGameDefaultCover(game, platform)].filter(Boolean)),
    (game) => {
      if (overrideStore.isLocked(platform, game.appid, '')) return true;
      if (!options.overwriteLocal && coverService?.hasProtectedLocalCover(platform, game.appid, '')) return true;
      return false;
    },
    {
      batchSize: options.batchSize || 80,
      concurrency: options.concurrency || 10,
      skippedAppIds,
      overwriteLocal: !!options.overwriteLocal,
      onFail: (appid) => coverLocalizeSkipStore.mark(platform, appid),
      onError: (appid, err) => {
        logger.debug('封面本地化失败', { platform, appid, message: err.message });
      },
    },
  );

  if (result.done > 0 || result.failed > 0) {
    logger.info('封面本地化批次', {
      platform,
      done: result.done,
      failed: result.failed,
      pending: result.pending,
      remaining: result.remaining,
      skipped: result.skipped,
    });
  }

  return result;
}

async function loadCachedGamesForCoverLocalization(platform, req) {
  if (platform === 'steam') {
    const apiKey = getApiKey(req);
    const steamIds = await resolveSteamIds(getSteamIdInput(req), apiKey);
    const includeFamily = req.query.includeFamily !== 'false';
    const cacheKey = cacheKeyForSteamIds(steamIds, includeFamily);
    const hit = findValidGamesCache(steamIds, includeFamily) || (() => {
      const primary = readCache(cacheKey);
      return primary?.data?.games
        ? { cached: primary, cacheKey, includeFamily }
        : null;
    })();
    if (!hit?.cached?.data?.games?.length) {
      throw new Error('无本地缓存，请先刷新游戏库列表');
    }
    return hit.cached.data.games;
  }

  throw new Error('不支持的平台');
}

function findCachedGame(platform, appid) {
  return libraryStore.findCachedGame(platform, appid);
}

function updateCachedGameFields(platform, appid, patch = {}) {
  return libraryStore.updateCachedGameFields(platform, appid, patch);
}

function applyGameOverrides(games, platform, userId = '') {
  overrideStore.applyToGames(games, platform, userId);
  for (const game of games) {
    if (!game.cover_url) {
      const fallback = resolveGameDefaultCover(game, platform);
      if (fallback) game.cover_url = fallback;
    }
  }
  return games;
}

function shouldSkipCoverOverwrite(platform, appid, userId = '') {
  if (overrideStore.shouldPreserveOnRefresh(platform, appid, userId)) return true;
  return coverService?.hasProtectedLocalCover(platform, appid, userId);
}

function scheduleCoverLocalization(games, platform) {
  if (!games?.length || !coverService) return;
  setImmediate(async () => {
    try {
      const result = await runCoverLocalization(games, platform);
      if (result.done) debugLog('封面本地化完成', { platform, ...result });
    } catch (err) {
      debugLog('封面本地化批次失败', { platform, message: err.message });
    }
  });
}

function defaultRefreshParts(platform) {
  if (platform === 'steam') {
    return { library: true, meta: false, covers: false, localizeCovers: false };
  }
  return { library: true, meta: false, covers: false, localizeCovers: false };
}

function parseRefreshParts(query, platform) {
  const legacy = query.refresh === 'true';
  const raw = String(query.refreshParts || '').trim();
  if (!raw && !legacy) {
    return { library: false, meta: false, metaAll: false, covers: false, coversAll: false, localizeCovers: false };
  }
  if (!raw && legacy) return defaultRefreshParts(platform);
  const parts = new Set(raw.split(',').map((item) => item.trim()).filter(Boolean));
  return {
    library: parts.has('library'),
    meta: parts.has('meta'),
    metaAll: parts.has('metaAll'),
    covers: parts.has('covers'),
    coversAll: parts.has('coversAll'),
    coversIncludeLocal: query.coversIncludeLocal === 'true' || query.coversIncludeLocal === '1',
    localizeCovers: parts.has('localizeCovers'),
    localizeRetryFailed: query.localizeRetryFailed === 'true' || query.localizeRetryFailed === '1',
    localizeIncludeLocal: query.localizeIncludeLocal === 'true' || query.localizeIncludeLocal === '1',
  };
}

function localizeOptionsFromRefreshParts(refreshParts) {
  return {
    retryFailed: !!refreshParts?.localizeRetryFailed,
    overwriteLocal: !!refreshParts?.localizeIncludeLocal,
  };
}

function isRefreshActive(parts) {
  return !!(parts.library || parts.meta || parts.metaAll || parts.covers || parts.coversAll || parts.localizeCovers);
}

function getRequestUserId(req) {
  return String(req.headers['x-user-id'] || req.query.userId || '').trim();
}

function getRequestUser(req) {
  const userId = getRequestUserId(req);
  if (userId) {
    const store = usersStore.readStore();
    const found = store.users.find((u) => u.id === userId);
    if (found) return usersStore.sanitizeUser(found);
  }
  return usersStore.getActiveUser();
}

function buildFilterContext(req, platform) {
  const user = getRequestUser(req);
  const favoriteAppIds = new Set(
    user?.id ? favoritesStore.listForPlatform(user.id, platform) : [],
  );
  const hiddenAppIds = new Set(
    user?.id ? hiddenStore.listForPlatform(user.id, platform) : [],
  );

  const resolveOwnerName = (steamId) => {
    const id = String(steamId || '').trim();
    if (!id) return '';
    const store = usersStore.readStore();
    const found = store.users.find((item) => item.steamId === id);
    if (found?.personaName) return found.personaName;
    if (found?.name) return found.name;
    return `用户 …${id.slice(-4)}`;
  };

  return { platform, favoriteAppIds, hiddenAppIds, resolveOwnerName };
}

function annotateInstalledGames(games) {
  const installedIds = readSteamInstalledAppIds();
  let installedCount = 0;
  for (const game of games) {
    const installed = installedIds.has(Number(game.appid));
    game.installed = installed;
    if (installed) installedCount += 1;
  }
  return installedCount;
}

function buildSteamFilterContext(req, games, extra = {}) {
  const context = buildFilterContext(req, 'steam');
  const user = getRequestUser(req);
  const steamId = String(user?.steamId || extra.steamIds?.[0] || '').trim();
  if (!steamId || !Array.isArray(games)) {
    return { ...context, steamCollections: [] };
  }
  const steamPath = resolveEffectiveSteamPath(user?.id);
  const storedCollections = user?.id ? collectionsStore.getCollections(user.id) : [];
  const { collections } = attachSteamCollectionsToGames(games, steamId, {
    steamPath,
    debugLog,
    storedCollections,
  });
  return { ...context, steamCollections: collections };
}

function sendPagedGameResponse(res, games, req, platform, extra = {}) {
  const filters = parseGameFilters(req.query);
  const sourceGames = games;
  const user = getRequestUser(req);
  applyGameOverrides(sourceGames, platform, user?.id || '');
  let installedCount = 0;
  if (platform === 'steam') {
    installedCount = annotateInstalledGames(sourceGames);
  }
  const context = platform === 'steam'
    ? buildSteamFilterContext(req, sourceGames, extra)
    : buildFilterContext(req, platform);
  const result = buildGameListResponse(sourceGames, filters, context);
  applyGameOverrides(result.games, platform, user?.id || '');
  res.json({
    ...extra,
    platform,
    games: result.games,
    gameCount: result.gameCount,
    filteredCount: result.filteredCount,
    installedCount,
    pagination: result.pagination,
    filterOptions: result.filterOptions,
  });
}

const platformRefreshState = {
  steam: new Map(),
};

function startSteamBackgroundRefresh(cacheKey, steamIds, apiKey, accessToken, includeFamily) {
  if (platformRefreshState.steam.has(cacheKey)) {
    return platformRefreshState.steam.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const entries = [];
      for (const steamId of steamIds) {
        const localGames = readSteamLocalLibraryGames(steamId, (label, detail) => {
          platformLog('Steam', label, detail);
        });
        let remoteGames = [];
        try {
          remoteGames = await fetchGamesFromSteam(steamId, apiKey, accessToken);
        } catch (err) {
          if (!localGames.length) throw err;
        }
        entries.push({ steamId, games: mergeSteamLibraryGames(localGames, remoteGames) });
      }
      let games = mergeGameLists(entries);
      if (includeFamily) {
        const familyGames = await fetchFamilyLibrary(accessToken, steamIds[0]);
        games = mergeFamilyIntoGames(games, familyGames);
      }
      games = await enrichOwnerNames(games, apiKey, steamIds);
      const metaApplied = gameMetaStore.applyCachedMetaWithStats(games);
      games = metaApplied.games;
      writeCache(cacheKey, games, steamIds);
      debugLog('Steam 后台刷新完成', { cacheKey, count: games.length });
    } catch (err) {
      debugLog('Steam 后台刷新失败', { cacheKey, message: err.message });
    } finally {
      platformRefreshState.steam.delete(cacheKey);
    }
  })();

  platformRefreshState.steam.set(cacheKey, promise);
  return promise;
}

function getUserAuthPaths(user) {
  if (!user) {
    return {
      tokenPath: join(DATA_DIR, 'steam-token.json'),
    };
  }
  return usersStore.getUserPaths(user.id);
}

function getApiKey(req) {
  const user = getRequestUser(req);
  if (!user?.id) return '';
  return usersStore.getUserApiKey(user.id);
}

function normalizeAccessToken(token) {
  return extractWebApiToken(token);
}

function getAccessToken(req) {
  const headerToken = normalizeAccessToken(req.headers['x-steam-access-token'] || '');
  if (headerToken) return headerToken;
  const user = getRequestUser(req);
  const { tokenPath } = getUserAuthPaths(user);
  return loadStoredToken(tokenPath) || '';
}

function getSteamTokenContext(req) {
  const headerToken = normalizeAccessToken(req.headers['x-steam-access-token'] || '');
  if (headerToken) {
    return { token: headerToken, storedExpiresAt: 0 };
  }
  const user = getRequestUser(req);
  const { tokenPath } = getUserAuthPaths(user);
  const meta = readStoredTokenMeta(tokenPath);
  return { token: meta.token, storedExpiresAt: meta.expiresAt };
}

function isSteamTokenValidForRequest(req) {
  const { token, storedExpiresAt } = getSteamTokenContext(req);
  return isSteamTokenLocallyValid(token, storedExpiresAt);
}

function parseSteamIdList(raw) {
  return [...new Set(
    String(raw || '')
      .split(/[,;\n\r]+/)
      .map((part) => part.trim())
      .filter(Boolean)
  )];
}

function getSteamIdInput(req) {
  const queryInput = String(req.query.steamId || '').trim();
  if (queryInput) return queryInput;
  const user = getRequestUser(req);
  return String(user?.steamId || '').trim();
}

function cacheKeyForSteamIds(steamIds, useFamily) {
  const base = steamIds.slice().sort().join('_');
  return useFamily ? `${base}_family` : base;
}

function findValidGamesCache(steamIds, preferFamily = true) {
  const order = preferFamily ? [true, false] : [false, true];
  for (const useFamily of order) {
    const cacheKey = cacheKeyForSteamIds(steamIds, useFamily);
    const cached = readCache(cacheKey);
    if (cached?.data?.games) {
      return { cached, cacheKey, includeFamily: useFamily };
    }
  }
  return null;
}

async function buildGamesFromCacheHit(hit, steamIds, apiKey) {
  const cachedAt = hit.cached.data.cachedAt;
  let games = hit.cached.data.games;
  const contextSteamIds = hit.cached.data.steamIds || steamIds;
  games = await enrichOwnerNames(games, apiKey, contextSteamIds);
  const metaApplied = gameMetaStore.applyCachedMetaWithStats(games);
  games = metaApplied.games;

  return {
    source: 'cache',
    fromCache: true,
    cachedAt,
    steamIds: contextSteamIds,
    games,
    includeFamily: hit.includeFamily,
    metaPending: metaApplied.metaPending,
    cacheKey: hit.cacheKey,
  };
}

async function fetchFamilyLibrary(accessToken, primarySteamId) {
  const params = new URLSearchParams({
    access_token: accessToken,
    family_groupid: '0',
    include_own: 'true',
    include_excluded: 'true',
    include_free: 'true',
    include_non_games: 'false',
    format: 'json',
  });

  const res = await steamFetch(
    `https://api.steampowered.com/IFamilyGroupsService/GetSharedLibraryApps/v1/?${params}`
  );
  const json = await parseJsonResponse(res, 'Steam 家庭库');
  const apps = json.response?.apps || [];
  const ownerSteamId = String(json.response?.owner_steamid || primarySteamId);

  return apps
    .filter((app) => (app.app_type ?? 1) <= 2)
    .map((app) => {
      const ownerIds = [...new Set(
        (Array.isArray(app.owner_steamids) ? app.owner_steamids : [])
          .map(String)
          .filter(Boolean)
      )];
      if (!ownerIds.length) ownerIds.push(ownerSteamId);
      const isOwn = ownerIds.includes(ownerSteamId);
      const excludeReason = app.exclude_reason ?? 0;

      return {
        appid: app.appid,
        name: app.name || `App ${app.appid}`,
        playtime_forever: app.rt_playtime || 0,
        playtime_2weeks: 0,
        img_icon_url: app.img_icon_hash || '',
        rtime_last_played: app.rt_last_played || 0,
        owner_ids: ownerIds,
        exclude_reason: excludeReason,
        shareable: excludeReason === 0,
        from_family: !isOwn,
      };
    });
}

function buildOwnerNameMap() {
  const map = {};
  for (const user of usersStore.readStore().users) {
    const steamId = String(user.steamId || '').trim();
    if (!steamId) continue;
    map[steamId] = String(user.personaName || user.name || '').trim() || `用户 …${steamId.slice(-4)}`;
  }
  return map;
}

function ensureOwnerFields(games, contextSteamIds = [], nameMap = buildOwnerNameMap()) {
  const fallbackIds = contextSteamIds.filter(Boolean);

  for (const game of games) {
    if (!Array.isArray(game.owner_ids) || !game.owner_ids.length) {
      game.owner_ids = fallbackIds.length ? [...fallbackIds] : [];
    }
    if (!Array.isArray(game.owner_names) || !game.owner_names.length) {
      game.owner_names = game.owner_ids.map((id) => nameMap[id] || `…${String(id).slice(-4)}`);
    }
  }
  return games;
}

async function enrichOwnerNames(games, apiKey, contextSteamIds = []) {
  const nameMap = buildOwnerNameMap();
  ensureOwnerFields(games, contextSteamIds, nameMap);
  if (!isValidApiKey(apiKey)) return games;

  const ids = [...new Set(games.flatMap((g) => g.owner_ids || []))];
  if (!ids.length) return games;

  const missingIds = ids.filter((id) => !nameMap[id]);
  if (!missingIds.length) {
    for (const game of games) {
      game.owner_names = (game.owner_ids || []).map((id, i) => nameMap[id] || game.owner_names?.[i] || `…${id.slice(-4)}`);
    }
    return games;
  }

  try {
    const params = new URLSearchParams({
      key: apiKey,
      steamids: missingIds.slice(0, 100).join(','),
    });
    const res = await steamFetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?${params}`);
    const json = await parseJsonResponse(res, 'Steam 用户信息');
    for (const player of json.response?.players || []) {
      nameMap[String(player.steamid)] = player.personaname;
    }
  } catch (err) {
    debugLog('所有者昵称拉取失败，使用本地缓存名称', { message: err.message });
  }

  for (const game of games) {
    game.owner_names = (game.owner_ids || []).map((id, i) => nameMap[id] || game.owner_names?.[i] || `…${id.slice(-4)}`);
  }
  return games;
}

function mergeFamilyIntoGames(ownedGames, familyGames) {
  const map = new Map(ownedGames.map((g) => [g.appid, { ...g }]));

  for (const fg of familyGames) {
    const existing = map.get(fg.appid);
    if (existing) {
      existing.owner_ids = [...new Set([...(existing.owner_ids || []), ...(fg.owner_ids || [])])];
      existing.exclude_reason = fg.exclude_reason;
      existing.shareable = fg.shareable;
      existing.from_family = existing.from_family || fg.from_family;
      existing.playtime_forever = Math.max(existing.playtime_forever || 0, fg.playtime_forever || 0);
      existing.rtime_last_played = Math.max(existing.rtime_last_played || 0, fg.rtime_last_played || 0);
      continue;
    }
    map.set(fg.appid, { ...fg });
  }

  return Array.from(map.values());
}

async function verifyApiKey(apiKey) {
  assertApiKeyFormat(apiKey);
  const url = `https://api.steampowered.com/ISteamWebAPIUtil/GetSupportedAPIList/v0001/?key=${apiKey}&format=json`;
  const res = await steamFetch(url);
  const json = await parseJsonResponse(res, 'Steam API Key 验证');
  if (!json.apilist?.interfaces?.length) {
    throw new Error('API Key 验证失败，请重新申请');
  }
  return true;
}

async function resolveSteamIds(input, apiKey) {
  const parts = parseSteamIdList(input);
  if (!parts.length) throw new Error('请填写 Steam ID');

  const steamIds = [];
  for (const part of parts) {
    steamIds.push(await resolveSteamId(part, apiKey));
  }
  return [...new Set(steamIds)];
}

function mergeGameLists(entries) {
  const map = new Map();

  for (const { steamId, games } of entries) {
    for (const game of games) {
      const existing = map.get(game.appid);
      if (!existing) {
        map.set(game.appid, {
          ...game,
          owner_ids: [steamId],
        });
        continue;
      }

      existing.playtime_forever = Math.max(existing.playtime_forever, game.playtime_forever);
      existing.playtime_2weeks = Math.max(existing.playtime_2weeks || 0, game.playtime_2weeks || 0);
      existing.rtime_last_played = Math.max(existing.rtime_last_played || 0, game.rtime_last_played || 0);
      if (!existing.owner_ids.includes(steamId)) {
        existing.owner_ids.push(steamId);
      }
    }
  }

  return Array.from(map.values());
}

async function loadGamesForSteamIds(steamIds, apiKey, refreshParts, options = {}) {
  const { accessToken = '', includeFamily = false, cacheOnly = false, onProgress } = options;
  const useFamily = includeFamily && !!accessToken;
  const cacheKey = cacheKeyForSteamIds(steamIds, useFamily);
  const refreshLibrary = !!refreshParts?.library;
  const localizeCovers = !!refreshParts?.localizeCovers;

  const reportProgress = (label, current, total) => {
    if (refreshLibrary && onProgress) {
      onProgress({ stage: 'library', label, current, total });
    }
  };

  debugLog('加载游戏库', { steamIds, refreshParts, includeFamily: useFamily, cacheOnly });

  if (!refreshLibrary && !localizeCovers) {
    const primary = readCache(cacheKey);
    let hit = primary?.data?.games
      ? { cached: primary, cacheKey, includeFamily: useFamily }
      : null;
    if (!hit) {
      hit = findValidGamesCache(steamIds, includeFamily);
    }
    if (hit) {
      const result = await buildGamesFromCacheHit(hit, steamIds, apiKey);
      debugLog('命中游戏缓存', {
        cacheKey: hit.cacheKey,
        rawCount: hit.cached.data.games.length,
        visibleCount: result.games.length,
        metaPending: result.metaPending,
        cachedAt: new Date(hit.cached.data.cachedAt).toLocaleString('zh-CN'),
      });
      return result;
    }
    if (cacheOnly) return null;
  }

  if (!refreshLibrary && localizeCovers) {
    const primary = readCache(cacheKey);
    const hit = findValidGamesCache(steamIds, includeFamily) || (primary?.data?.games
      ? { cached: primary, cacheKey, includeFamily: useFamily }
      : null);
    if (!hit) throw new Error('无本地缓存，请先刷新游戏库列表');
    const games = hit.cached.data.games;
    const localizedCovers = await runCoverLocalization(games, 'steam', localizeOptionsFromRefreshParts(refreshParts));
    return {
      source: 'cache',
      fromCache: true,
      cachedAt: hit.cached.data.cachedAt,
      steamIds: hit.cached.data.steamIds || steamIds,
      games,
      includeFamily: hit.includeFamily,
      metaPending: 0,
      cacheKey: hit.cacheKey,
      localizedCovers,
    };
  }

  if (!accessToken) {
    const entries = [];
    const totalSteps = refreshLibrary ? steamIds.length + 1 : 0;
    let step = 0;
    for (const steamId of steamIds) {
      step += 1;
      if (refreshLibrary) {
        reportProgress(
          steamIds.length > 1 ? `读取本地 Steam 库 (${step}/${steamIds.length})` : '读取本地 Steam 库',
          step,
          totalSteps,
        );
      }
      const localGames = readSteamLocalLibraryGames(steamId, (label, detail) => {
        platformLog('Steam', label, detail);
      });
      if (localGames.length) entries.push({ steamId, games: localGames });
    }
    if (entries.length) {
      if (refreshLibrary) {
        reportProgress('合并并保存', totalSteps, totalSteps);
      }
      let games = mergeGameLists(entries);
      games = await enrichOwnerNames(games, apiKey, steamIds);
      const metaApplied = gameMetaStore.applyCachedMetaWithStats(games);
      games = metaApplied.games;
      const saved = writeCache(cacheKey, games, steamIds);
      return {
        games,
        fromCache: false,
        source: 'local-steam',
        cachedAt: saved.cachedAt,
        steamIds,
        includeFamily: useFamily,
        metaPending: metaApplied.metaPending,
        cacheKey,
      };
    }
    throw new Error('需要有效的 Steam Token 才能从 Steam 拉取游戏库');
  }

  const totalSteps = steamIds.length + (useFamily ? 1 : 0) + 1 + (localizeCovers ? 1 : 0);
  let step = 0;
  const entries = [];
  for (const steamId of steamIds) {
    step += 1;
    reportProgress(
      steamIds.length > 1 ? `拉取 Steam 游戏库 (${step}/${steamIds.length})` : '拉取 Steam 游戏库',
      step,
      totalSteps,
    );
    debugLog('拉取 Steam 游戏库', { steamId });
    const localGames = readSteamLocalLibraryGames(steamId, (label, detail) => {
      platformLog('Steam', label, detail);
    });
    let remoteGames = [];
    try {
      remoteGames = await fetchGamesFromSteam(steamId, apiKey, accessToken);
    } catch (err) {
      if (localGames.length) {
        platformLog('Steam', '远程拉库失败，使用本地客户端数据', { steamId, local: localGames.length, error: err.message });
      } else {
        throw err;
      }
    }
    const games = mergeSteamLibraryGames(localGames, remoteGames);
    debugLog('Steam 游戏库返回', { steamId, count: games.length, local: localGames.length, remote: remoteGames.length });
    entries.push({ steamId, games });
  }

  let games = mergeGameLists(entries);

  if (useFamily) {
    step += 1;
    reportProgress('拉取家庭共享库', step, totalSteps);
    debugLog('拉取家庭库');
    const familyGames = await fetchFamilyLibrary(accessToken, steamIds[0]);
    debugLog('家庭库返回', { count: familyGames.length });
    games = mergeFamilyIntoGames(games, familyGames);
  }

  step += 1;
  reportProgress('合并并保存', step, totalSteps);
  games = await enrichOwnerNames(games, apiKey, steamIds);
  const metaApplied = gameMetaStore.applyCachedMetaWithStats(games);
  games = metaApplied.games;
  const saved = writeCache(cacheKey, games, steamIds);
  const metaPending = metaApplied.metaPending;

  debugLog('游戏库加载完成', {
    source: refreshLibrary ? 'remote-refresh' : 'remote',
    cacheKey,
    rawCount: games.length,
    metaPending,
  });

  let localizedCovers = null;
  if (localizeCovers) {
    step += 1;
    reportProgress('本地化封面', step, totalSteps);
    localizedCovers = await runCoverLocalization(games, 'steam', localizeOptionsFromRefreshParts(refreshParts));
  }

  return {
    source: refreshLibrary ? 'remote-refresh' : 'remote',
    fromCache: false,
    cachedAt: saved.cachedAt,
    steamIds,
    games,
    includeFamily: useFamily,
    metaPending,
    cacheKey,
    localizedCovers,
  };
}

async function resolveAccessTokenForGames(rawToken, refresh) {
  if (!rawToken) return { accessToken: '', tokenExpired: false };
  const expiresAt = parseTokenExpiry(rawToken);
  if (!refresh && expiresAt && Date.now() < expiresAt - 60000) {
    return { accessToken: rawToken, tokenExpired: false };
  }
  const valid = await validateAccessToken(rawToken, steamFetch);
  return {
    accessToken: valid ? rawToken : '',
    tokenExpired: !!rawToken && !valid,
  };
}

async function resolveSteamId(input, apiKey) {
  const trimmed = String(input || '').trim();
  if (!trimmed) throw new Error('请填写 Steam ID');

  if (/^\d{17}$/.test(trimmed)) return trimmed;

  const vanityMatch = trimmed.match(/(?:steamcommunity\.com\/id\/|\/id\/)([^/?#]+)/i);
  const vanity = vanityMatch?.[1];
  if (vanity) {
    if (!isValidApiKey(apiKey)) {
      throw new Error('解析 Steam 自定义 URL 需要 API Key，请在连接 Steam 时填写');
    }
    const url = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=${normalizeApiKey(apiKey)}&vanityurl=${encodeURIComponent(vanity)}`;
    const res = await steamFetch(url);
    const json = await parseJsonResponse(res, 'Steam 用户解析接口');
    if (json.response?.success === 1) return json.response.steamid;
    throw new Error('无法解析 Steam 自定义 URL，请改用 17 位 Steam ID');
  }

  const profileMatch = trimmed.match(/profiles\/(\d{17})/);
  if (profileMatch) return profileMatch[1];

  throw new Error('Steam ID 格式不正确，请填写 17 位 ID 或个人主页链接');
}

function extractXmlCdata(xml, tag) {
  const re = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i');
  const matched = String(xml || '').match(re);
  return matched ? matched[1].trim() : '';
}

async function fetchSteamProfileFromCommunity(steamId) {
  const res = await steamFetch(`https://steamcommunity.com/profiles/${steamId}/?xml=1`);
  const text = await res.text();
  if (!res.ok || !text.includes('<profile>')) return null;

  const personaName = extractXmlCdata(text, 'steamID');
  const avatar = extractXmlCdata(text, 'avatarFull')
    || extractXmlCdata(text, 'avatarMedium')
    || extractXmlCdata(text, 'avatarIcon');
  if (!personaName && !avatar) return null;

  return { steamId, personaName, avatar };
}

async function fetchSteamProfile(steamId, apiKey, accessToken = '') {
  if (!/^\d{17}$/.test(steamId)) return null;

  if (isValidApiKey(apiKey)) {
    try {
      const params = new URLSearchParams({ steamids: steamId, format: 'json' });
      applySteamAuthParams(params, apiKey, accessToken);
      const res = await steamFetch(`https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?${params}`);
      const json = await parseJsonResponse(res, 'Steam 用户信息');
      const player = json.response?.players?.[0];
      if (player) {
        return {
          steamId: String(player.steamid),
          personaName: player.personaname || '',
          avatar: player.avatarfull || player.avatarmedium || player.avatar || '',
        };
      }
    } catch (err) {
      debugLog('Web API 资料拉取失败，改用社区资料', { steamId, message: err.message });
    }
  }

  try {
    return await fetchSteamProfileFromCommunity(steamId);
  } catch (err) {
    debugLog('社区资料拉取失败', { steamId, message: err.message });
    return null;
  }
}

function extractRgGamesJson(text) {
  const variable = 'var rgGames =';
  const start = String(text || '').indexOf(variable);
  if (start < 0) return null;

  const arrayStart = start + variable.length;
  let arrayEnd = text.indexOf(';\r\n', arrayStart);
  if (arrayEnd < 0) arrayEnd = text.indexOf(';\n', arrayStart);
  if (arrayEnd < 0) arrayEnd = text.indexOf(';', arrayStart);
  const slice = text.slice(arrayStart, arrayEnd > arrayStart ? arrayEnd : undefined).trim();
  if (!slice) return null;

  try {
    return JSON.parse(slice);
  } catch {
    return null;
  }
}

async function fetchGamesFromSteamCommunity(steamId) {
  const res = await steamFetch(`https://steamcommunity.com/profiles/${steamId}/games/?tab=all`);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Steam 社区页返回 ${res.status}`);
  }

  const games = extractRgGamesJson(text);
  if (!Array.isArray(games)) {
    throw new Error('无法从 Steam 社区页解析游戏列表，请确认游戏库隐私为公开');
  }

  return games
    .filter((game) => game?.appid)
    .map((game) => ({
      appid: game.appid,
      name: game.name || `App ${game.appid}`,
      playtime_forever: Math.round(Number(game.hours_forever || game.hours || 0) * 60) || 0,
      playtime_2weeks: Math.round(Number(game.hours_2weeks || 0) * 60) || 0,
      img_icon_url: game.logo || '',
      rtime_last_played: 0,
      from_community: true,
    }));
}

async function fetchGamesFromSteam(steamId, apiKey, accessToken = '') {
  let apiError = null;

  try {
    const params = new URLSearchParams({
      steamid: steamId,
      include_appinfo: '1',
      include_played_free_games: '1',
      format: 'json',
    });
    applySteamAuthParams(params, apiKey, accessToken);

    const res = await steamFetch(`https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?${params}`);
    const json = await parseJsonResponse(res, 'Steam 游戏库接口');

    if (json.response?.games) {
      return json.response.games.map((g) => ({
        appid: g.appid,
        name: g.name || `App ${g.appid}`,
        playtime_forever: g.playtime_forever || 0,
        playtime_2weeks: g.playtime_2weeks || 0,
        img_icon_url: g.img_icon_url || '',
        rtime_last_played: g.rtime_last_played || 0,
      }));
    }

    if (json.response?.game_count === 0) return [];

    if (json.response?.game_count === undefined && !json.response?.games) {
      apiError = new Error('Steam 未返回游戏数据，请确认 API Key 有效且游戏库隐私为公开');
    } else {
      apiError = new Error('获取游戏库失败，请检查 API Key、Steam ID 及游戏库隐私设置');
    }
  } catch (err) {
    apiError = err instanceof Error ? err : new Error(String(err));
  }

  try {
    const communityGames = await fetchGamesFromSteamCommunity(steamId);
    if (communityGames.length) {
      debugLog('Steam 社区公开页拉库成功', { steamId, count: communityGames.length });
      return communityGames;
    }
  } catch (err) {
    debugLog('Steam 社区公开页拉库失败', { steamId, message: err.message });
  }

  throw apiError || new Error('获取 Steam 游戏库失败');
}

export {
  appSettingsStore,
  coverLocalizeSkipStore,
  syncLocalPathOptions,
  initialSettings,
  logger,
  steamDispatcher,
  coverCleanupTimer,
  db,
  libraryStore,
  overrideStore,
  gameMetaStore,
  usersStore,
  favoritesStore,
  hiddenStore,
  collectionsStore,
  resolveEffectiveSteamPath,
  buildLocalPathDetection,
  updateSteamProxy,
  debugLog,
  runCoverCleanup,
  scheduleCoverCleanup,
  applyAppSettings,
  upload,
  wrapSteamNetworkError,
  coverService,
  platformLog,
  app,
  normalizeApiKey,
  isValidApiKey,
  assertApiKeyFormat,
  applySteamAuthParams,
  ensureGamesAuth,
  steamFetch,
  explainHtmlError,
  parseJsonResponse,
  readCache,
  writeCache,
  defaultSteamCoverUrl,
  resolveGameDefaultCover,
  runCoverLocalization,
  loadCachedGamesForCoverLocalization,
  findCachedGame,
  updateCachedGameFields,
  applyGameOverrides,
  shouldSkipCoverOverwrite,
  scheduleCoverLocalization,
  defaultRefreshParts,
  parseRefreshParts,
  localizeOptionsFromRefreshParts,
  isRefreshActive,
  getRequestUserId,
  getRequestUser,
  buildFilterContext,
  annotateInstalledGames,
  buildSteamFilterContext,
  sendPagedGameResponse,
  platformRefreshState,
  startSteamBackgroundRefresh,
  getUserAuthPaths,
  getApiKey,
  normalizeAccessToken,
  getAccessToken,
  getSteamTokenContext,
  isSteamTokenValidForRequest,
  parseSteamIdList,
  getSteamIdInput,
  cacheKeyForSteamIds,
  findValidGamesCache,
  buildGamesFromCacheHit,
  fetchFamilyLibrary,
  buildOwnerNameMap,
  ensureOwnerFields,
  enrichOwnerNames,
  mergeFamilyIntoGames,
  verifyApiKey,
  resolveSteamIds,
  mergeGameLists,
  loadGamesForSteamIds,
  resolveAccessTokenForGames,
  resolveSteamId,
  extractXmlCdata,
  fetchSteamProfileFromCommunity,
  fetchSteamProfile,
  extractRgGamesJson,
  fetchGamesFromSteamCommunity,
  fetchGamesFromSteam
};
