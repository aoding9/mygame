import express from 'express';
import multer from 'multer';
import { config } from 'dotenv';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { initDatabase } from './db/db.js';
import { createLibraryStore } from './db/library-store.js';
import { createMetaStore } from './db/meta-store.js';
import { createGameOverrideStore } from './db/game-override-store.js';
import { createCoverService } from './services/cover-service.js';
import { searchGamesByName } from './services/game-lookup.js';
import {
  getAuthState,
  loadStoredToken,
  saveStoredToken,
  validateAccessToken,
  parseTokenExpiry,
  parseSteamIdFromToken,
  extractWebApiToken,
} from './steam/auth.js';
import { createUsersStore } from './stores/users-store.js';
import { createFavoritesStore } from './stores/favorites-store.js';
import { createHiddenStore } from './stores/hidden-store.js';
import { detectSteamInstallPaths, importHiddenFromLocalSteam } from './steam/hidden-games.js';
import { attachSteamCollectionsToGames } from './steam/collections.js';
import { cleanLegacyBrowserProfiles } from './services/cache-cleanup.js';
import { createPlatformAccountsStore } from './stores/platform-accounts-store.js';
import {
  ensureEpicAccessToken,
  exchangeWebTokenForLauncherTokens,
  fetchEpicAccount,
  fetchEpicGames,
  loginEpic,
  connectEpicWithAuthCode,
  parseEpicAuthInput,
  repairEpicGamesCatalogInChunks,
  repairEpicGameCoversByAppIds,
  resolveEpicSession,
  sanitizeEpicGameNames,
  setEpicLogger,
} from './platforms/epic.js';
import { mergeSteamLibraryGames, readSteamLocalLibraryGames } from './platforms/steam-local.js';
import {
  fetchUbisoftGames,
  loginUbisoft,
  parseUbisoftAuthInput,
  repairUbisoftGameCovers,
  resolveUbisoftSession,
  sanitizeUbisoftGameList,
  setUbisoftLogger,
  ubisoftGamesNeedCoverRepair,
  validateUbisoftSession,
} from './platforms/ubisoft.js';
import {
  buildGameListResponse,
  parseGameFilters,
  pickRandomFromGames,
} from './services/game-filters.js';
import { createRuntimeLogger } from './services/runtime-logger.js';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..');
const DATA_DIR = join(ROOT_DIR, 'data');
const PORT = Number(process.env.PORT) || 3000;
const META_DIR = join(DATA_DIR, 'meta');
const COVERS_DIR = join(DATA_DIR, 'covers');
const LOG_DIR = join(DATA_DIR, 'logs');
const LOG_LEVEL = String(process.env.LOG_LEVEL || 'info').trim().toLowerCase();
const LOG_TO_FILE = process.env.LOG_TO_FILE !== 'false';
const RAWG_API_KEY = String(process.env.RAWG_API_KEY || '').trim();
const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.PROXY_URL || '';
const logger = createRuntimeLogger({
  logDir: LOG_DIR,
  level: LOG_LEVEL,
  toFile: LOG_TO_FILE,
});
const steamDispatcher = PROXY_URL ? new ProxyAgent(PROXY_URL) : undefined;
const db = initDatabase(DATA_DIR);
const libraryStore = createLibraryStore(db);
const overrideStore = createGameOverrideStore(db, COVERS_DIR);
const gameMetaStore = createMetaStore(db, DATA_DIR, (label, detail) => logger.info(label, detail));
const usersStore = createUsersStore(DATA_DIR);
const favoritesStore = createFavoritesStore(DATA_DIR);
const hiddenStore = createHiddenStore(DATA_DIR);
const platformAccountsStore = createPlatformAccountsStore(DATA_DIR);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});
usersStore.initFromEnv(process.env);

const loadedGamesCache = new Map();

function wrapSteamNetworkError(err, label = 'Steam') {
  const code = err?.cause?.code || err?.code || '';
  const detail = err?.cause?.message || err?.message || 'fetch failed';
  if (/fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|ECONNREFUSED|UND_ERR/i.test(`${code} ${detail}`)) {
    return new Error(`${label}网络异常（${code || detail}），请检查代理/VPN 或在 .env 设置 HTTPS_PROXY`);
  }
  return err instanceof Error ? err : new Error(String(err));
}

function debugLog(label, detail) {
  logger.info(label, detail);
}

let coverService;

function platformLog(platform, label, detail) {
  debugLog(`[${platform}] ${label}`, detail);
}

setEpicLogger((label, detail) => platformLog('Epic', label, detail));
setUbisoftLogger((label, detail) => platformLog('Ubisoft', label, detail));

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
    if (!apiKey) throw new Error('请先在添加用户时填写 API Key');
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
  throw new Error('请先添加用户并保存 Steam Token');
}

function ensureGamesAuth(apiKey, accessToken) {
  if (isValidApiKey(apiKey) || accessToken) return;
  throw new Error('请先添加用户并保存 Steam Token');
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
    return '网络无法访问 Steam，请在项目目录创建 .env 文件并设置 HTTPS_PROXY=http://127.0.0.1:端口';
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
  loadedGamesCache.delete(cacheKey);
  return libraryStore.write('steam', cacheKey, games, { steamIds });
}

function readPlatformCache(platform) {
  return libraryStore.read(platform, platform);
}

function writePlatformCache(platform, games, extra = {}) {
  return libraryStore.write(platform, platform, games, extra);
}

function defaultSteamCoverUrl(game) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appid}/header.jpg`;
}

function resolveGameDefaultCover(game, platform) {
  if (game.cover_url) return game.cover_url;
  if (platform === 'steam') return defaultSteamCoverUrl(game);
  return '';
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

function scheduleCoverLocalization(games, platform) {
  if (!games?.length) return;
  setImmediate(async () => {
    try {
      const count = await coverService.localizeDefaultCovers(
        games,
        platform,
        (game) => resolveGameDefaultCover(game, platform),
        (game) => overrideStore.shouldPreserveOnRefresh(platform, game.appid, ''),
      );
      if (count) debugLog('封面本地化完成', { platform, count });
    } catch (err) {
      debugLog('封面本地化失败', { platform, message: err.message });
    }
  });
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

function loadSteamGamesForNameMatch(req) {
  try {
    const user = getRequestUser(req);
    const steamId = String(user?.steamId || '').trim();
    if (!steamId) return [];
    const cacheKey = cacheKeyForSteamIds([steamId], false);
    const primary = readCache(cacheKey);
    if (primary?.data?.games?.length) return primary.data.games;
    const hit = findValidGamesCache([steamId], false);
    return hit?.cached?.data?.games || [];
  } catch {
    return [];
  }
}

function buildSteamFilterContext(req, games, extra = {}) {
  const context = buildFilterContext(req, 'steam');
  const user = getRequestUser(req);
  const steamId = String(user?.steamId || extra.steamIds?.[0] || '').trim();
  if (!steamId || !Array.isArray(games)) {
    return { ...context, steamCollections: [] };
  }
  const steamPath = user?.id ? hiddenStore.getSettings(user.id).steamPath : '';
  const { collections } = attachSteamCollectionsToGames(games, steamId, { steamPath });
  return { ...context, steamCollections: collections };
}

function sendPagedGameResponse(res, games, req, platform, extra = {}) {
  const filters = parseGameFilters(req.query);
  let sourceGames = games;
  if (platform === 'epic') {
    sourceGames = gameMetaStore.applyEpicNameMatchFromSteam(games, loadSteamGamesForNameMatch(req));
  }
  const user = getRequestUser(req);
  applyGameOverrides(sourceGames, platform, user?.id || '');
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
    pagination: result.pagination,
    filterOptions: result.filterOptions,
  });
}

const platformRefreshState = {
  epic: { running: false, promise: null },
  ubisoft: { running: false, promise: null },
  steam: new Map(),
};

function startEpicBackgroundRefresh() {
  if (platformRefreshState.epic.running) return platformRefreshState.epic.promise;

  platformRefreshState.epic.running = true;
  platformRefreshState.epic.promise = (async () => {
    try {
      let account = platformAccountsStore.getEpic();
      if (!account?.accessToken) return;
      account = await ensureEpicAccessToken(account, steamFetch);
      if (account.accessToken !== platformAccountsStore.getEpic()?.accessToken) {
        platformAccountsStore.saveEpic(account);
      }
      const games = await fetchEpicGames(account.accessToken, account.accountId, steamFetch);
      writePlatformCache('epic', games, { accountId: account.accountId });
      platformLog('Epic', '后台刷新完成', { count: games.length });
    } catch (err) {
      platformLog('Epic', '后台刷新失败', { error: err.message });
    } finally {
      platformRefreshState.epic.running = false;
    }
  })();

  return platformRefreshState.epic.promise;
}

function startUbisoftBackgroundRefresh() {
  if (platformRefreshState.ubisoft.running) return platformRefreshState.ubisoft.promise;

  platformRefreshState.ubisoft.running = true;
  platformRefreshState.ubisoft.promise = (async () => {
    try {
      const account = platformAccountsStore.getUbisoft();
      if (!account?.ticket) return;
      await validateUbisoftSession(account, steamFetch);
      const games = await fetchUbisoftGames(account, steamFetch);
      platformAccountsStore.saveUbisoft(account);
      writePlatformCache('ubisoft', games, { profileId: account.profileId });
      platformLog('Ubisoft', '后台刷新完成', { count: games.length });
    } catch (err) {
      platformLog('Ubisoft', '后台刷新失败', { error: err.message });
    } finally {
      platformRefreshState.ubisoft.running = false;
    }
  })();

  return platformRefreshState.ubisoft.promise;
}

let ubisoftCoverRepairPromise = null;

function startUbisoftCoverRepair(games, profileId) {
  if (!ubisoftGamesNeedCoverRepair(games)) return null;
  if (ubisoftCoverRepairPromise) return ubisoftCoverRepairPromise;

  ubisoftCoverRepairPromise = (async () => {
    const pendingCount = (games || []).filter((game) => game?.platform === 'ubisoft' && ubisoftGamesNeedCoverRepair([game])).length;
    try {
      const repaired = await repairUbisoftGameCovers([...(games || [])], steamFetch);
      writePlatformCache('ubisoft', repaired, { profileId });
      platformLog('Ubisoft', '封面补全完成', { pending: pendingCount });
    } catch (err) {
      platformLog('Ubisoft', '封面补全失败', { error: err.message });
    } finally {
      ubisoftCoverRepairPromise = null;
    }
  })();

  return ubisoftCoverRepairPromise;
}

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
      loadedGamesCache.set(cacheKey, { games, cachedAt: Date.now() });
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

async function loadEpicGamesForApi(refresh) {
  let account = platformAccountsStore.getEpic();
  if (!account?.accessToken) {
    const err = new Error('请先连接 Epic 账号');
    err.status = 401;
    err.needAuth = true;
    throw err;
  }

  platformLog('Epic', '加载游戏库', { refresh, accountId: account.accountId });

  const cached = readPlatformCache('epic');
  if (!refresh && cached?.data?.games?.length) {
    const games = sanitizeEpicGameNames(cached.data.games || []);
    platformLog('Epic', '命中缓存', { count: games.length, cachedAt: cached.data.cachedAt });
    return {
      games,
      fromCache: true,
      source: 'cache',
      cachedAt: cached.data.cachedAt,
      accountId: cached.data.accountId || account.accountId,
    };
  }

  account = await ensureEpicAccessToken(account, steamFetch);
  if (account.accessToken !== platformAccountsStore.getEpic()?.accessToken) {
    platformAccountsStore.saveEpic(account);
  }

  const games = await fetchEpicGames(account.accessToken, account.accountId, steamFetch);
  const saved = writePlatformCache('epic', games, { accountId: account.accountId });
  platformLog('Epic', '远程加载完成', { count: games.length, refresh });
  scheduleCoverLocalization(games, 'epic');
  return {
    games,
    fromCache: false,
    source: refresh ? 'remote-refresh' : 'remote',
    cachedAt: saved.cachedAt,
    accountId: account.accountId,
  };
}

async function loadUbisoftGamesForApi(refresh) {
  const account = platformAccountsStore.getUbisoft();
  const cached = readPlatformCache('ubisoft');
  const cachedGames = sanitizeUbisoftGameList(cached?.data?.games || []);
  const cachedProfileId = cached?.data?.profileId || account?.profileId;
  const hasCache = cachedGames.length > 0;

  platformLog('Ubisoft', '加载游戏库', {
    refresh,
    profileId: account?.profileId,
    hasCache,
    cacheExpired: !!cached?.expired,
  });

  if (!account?.ticket) {
    if (hasCache) {
      platformLog('Ubisoft', '无会话，返回缓存', { count: cachedGames.length });
      return {
        games: cachedGames,
        fromCache: true,
        source: 'cache',
        cachedAt: cached.data.cachedAt,
        profileId: cachedProfileId,
        sessionExpired: true,
      };
    }
    const err = new Error('请先登录育碧账号');
    err.status = 401;
    err.needAuth = true;
    throw err;
  }

  if (!refresh && hasCache) {
    platformLog('Ubisoft', '命中缓存', {
      count: cachedGames.length,
      cachedAt: cached.data.cachedAt,
    });
    return {
      games: cachedGames,
      fromCache: true,
      source: 'cache',
      cachedAt: cached.data.cachedAt,
      profileId: cachedProfileId,
    };
  }

  try {
    await validateUbisoftSession(account, steamFetch);
    const games = await fetchUbisoftGames(account, steamFetch);
    platformAccountsStore.saveUbisoft(account);
    const saved = writePlatformCache('ubisoft', games, { profileId: account.profileId });
    platformLog('Ubisoft', '远程加载完成', { count: games.length, refresh });
    scheduleCoverLocalization(games, 'ubisoft');
    return {
      games,
      fromCache: false,
      source: refresh ? 'remote-refresh' : 'remote',
      cachedAt: saved.cachedAt,
      profileId: account.profileId,
    };
  } catch (err) {
    if (hasCache) {
      platformLog('Ubisoft', '远程失败，回退缓存', { error: err.message, count: cachedGames.length });
      return {
        games: cachedGames,
        fromCache: true,
        source: 'cache',
        cachedAt: cached.data.cachedAt,
        profileId: cachedProfileId,
        sessionExpired: true,
      };
    }
    const wrapped = new Error(err.message || '育碧会话已过期，请重新登录');
    wrapped.status = 401;
    wrapped.needAuth = true;
    throw wrapped;
  }
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
  const envToken = normalizeAccessToken(process.env.STEAM_ACCESS_TOKEN || '');
  if (envToken) return envToken;
  const user = getRequestUser(req);
  const { tokenPath } = getUserAuthPaths(user);
  return loadStoredToken(tokenPath) || '';
}

async function resolveAccessToken(req) {
  const token = getAccessToken(req);
  if (!token) return '';
  const valid = await validateAccessToken(token, steamFetch);
  return valid ? token : '';
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
  if (user?.steamId) return user.steamId;
  return String(process.env.STEAM_ID || '').trim();
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
  const cacheKey = hit.cacheKey;
  const cachedAt = hit.cached.data.cachedAt;

  const mem = loadedGamesCache.get(cacheKey);
  if (mem && mem.cachedAt === cachedAt) {
    return {
      ...mem.result,
      source: 'cache',
      fromCache: true,
    };
  }

  let games = hit.cached.data.games;
  const contextSteamIds = hit.cached.data.steamIds || steamIds;
  games = await enrichOwnerNames(games, apiKey, contextSteamIds);
  const metaApplied = gameMetaStore.applyCachedMetaWithStats(games);
  games = metaApplied.games;
  const metaPending = metaApplied.metaPending;

  const result = {
    source: 'cache',
    fromCache: true,
    cachedAt,
    steamIds: contextSteamIds,
    games,
    includeFamily: hit.includeFamily,
    metaPending,
    cacheKey: hit.cacheKey,
  };

  loadedGamesCache.set(cacheKey, { cachedAt, result });
  return result;
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

function ensureOwnerFields(games, contextSteamIds = []) {
  const nameMap = buildOwnerNameMap();
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
  ensureOwnerFields(games, contextSteamIds);
  if (!isValidApiKey(apiKey)) return games;

  const nameMap = buildOwnerNameMap();
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
  if (!parts.length) throw new Error('请填写 Steam ID，或在 .env 中配置 STEAM_ID');

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

async function loadGamesForSteamIds(steamIds, apiKey, refresh, options = {}) {
  const { accessToken = '', includeFamily = false, cacheOnly = false } = options;
  const useFamily = includeFamily && !!accessToken;
  const cacheKey = cacheKeyForSteamIds(steamIds, useFamily);

  debugLog('加载游戏库', { steamIds, refresh, includeFamily: useFamily, cacheOnly });

  if (!refresh) {
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

  if (!accessToken) {
    const entries = [];
    for (const steamId of steamIds) {
      const localGames = readSteamLocalLibraryGames(steamId, (label, detail) => {
        platformLog('Steam', label, detail);
      });
      if (localGames.length) entries.push({ steamId, games: localGames });
    }
    if (entries.length) {
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
        metaPending: metaApplied.metaPending,
      };
    }
    throw new Error('需要有效的 Steam Token 才能从 Steam 拉取游戏库');
  }

  const entries = [];
  for (const steamId of steamIds) {
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
    debugLog('拉取家庭库');
    const familyGames = await fetchFamilyLibrary(accessToken, steamIds[0]);
    debugLog('家庭库返回', { count: familyGames.length });
    games = mergeFamilyIntoGames(games, familyGames);
  }

  games = await enrichOwnerNames(games, apiKey, steamIds);
  const metaApplied = gameMetaStore.applyCachedMetaWithStats(games);
  games = metaApplied.games;
  const saved = writeCache(cacheKey, games, steamIds);
  const metaPending = metaApplied.metaPending;

  debugLog('游戏库加载完成', {
    source: refresh ? 'remote-refresh' : 'remote',
    cacheKey,
    rawCount: games.length,
    metaPending,
  });

  scheduleCoverLocalization(games, 'steam');

  return {
    source: refresh ? 'remote-refresh' : 'remote',
    fromCache: false,
    cachedAt: saved.cachedAt,
    steamIds,
    games,
    includeFamily: useFamily,
    metaPending,
    cacheKey,
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
      throw new Error('解析 Steam 自定义 URL 需要 API Key，请在添加用户时填写');
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

app.get('/api/config', async (req, res) => {
  const envSteamIds = parseSteamIdList(process.env.STEAM_ID || '');
  const user = getRequestUser(req);
  const token = getAccessToken(req);
  const validToken = token ? await validateAccessToken(token, steamFetch) : false;
  const userList = usersStore.listUsers();

  res.json({
    hasEnvSteamId: envSteamIds.length > 0,
    appName: 'MyGame',
    cacheMode: 'manual',
    hasRawgKey: !!RAWG_API_KEY,
    steamId: envSteamIds.join(', '),
    steamIdCount: envSteamIds.length,
    hasAccessToken: !!token,
    accessTokenValid: validToken,
    authState: getAuthState(),
    activeUserId: userList.activeUserId,
    activeUser: user ? usersStore.publicUser(user) : null,
    users: userList.users,
  });
});

app.get('/api/users', (_req, res) => {
  res.json(usersStore.listUsers());
});

app.post('/api/users', async (req, res) => {
  try {
    let body = { ...(req.body || {}) };
    const apiKey = getApiKey(req);
    if (body.steamId && apiKey) {
      try {
        const resolved = await resolveSteamId(body.steamId, apiKey);
        body.steamId = resolved;
        const profile = await fetchSteamProfile(resolved, apiKey);
        if (profile) {
          body.personaName = profile.personaName;
          body.avatar = profile.avatar;
          body.name = profile.personaName;
        }
      } catch {
        /* keep manual input */
      }
    }
    const saved = usersStore.saveUser(body);
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/steam/profile', async (req, res) => {
  try {
    const apiKey = getApiKey(req);
    await verifyApiKey(apiKey);
    const steamId = await resolveSteamId(getSteamIdInput(req), apiKey);
    const profile = await fetchSteamProfile(steamId, apiKey);
    if (!profile) {
      res.status(404).json({ error: '未找到该 Steam 用户' });
      return;
    }
    res.json(profile);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/users/switch', (req, res) => {
  try {
    const user = usersStore.switchUser(String(req.body?.userId || '').trim());
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/users/refresh-profile', async (req, res) => {
  try {
    const user = getRequestUser(req);
    if (!user?.id || !user.steamId) {
      res.status(400).json({ error: '请先选择用户' });
      return;
    }

    const token = getAccessToken(req);
    if (!token) {
      res.status(401).json({ error: '需要 Steam Token', needAuth: true });
      return;
    }

    const existing = usersStore.readStore().users.find((u) => u.id === user.id);
    const profile = await fetchSteamProfile(user.steamId, getApiKey(req), token);
    if (!profile?.personaName && !profile?.avatar) {
      res.status(404).json({ error: '无法获取用户资料，请确认 Steam 社区资料为公开' });
      return;
    }

    const saved = usersStore.saveUser({
      id: user.id,
      steamId: user.steamId,
      apiKey: existing?.apiKey,
      personaName: profile.personaName,
      avatar: profile.avatar,
      name: profile.personaName || user.name,
    });
    debugLog('用户资料已更新', { userId: saved.id, steamId: saved.steamId, name: saved.personaName });
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/users/:id', (req, res) => {
  try {
    const userId = String(req.params.id || '').trim();
    const store = usersStore.readStore();
    const existing = store.users.find((u) => u.id === userId);
    if (!existing) {
      res.status(404).json({ error: '用户不存在' });
      return;
    }

    const body = req.body || {};
    let apiKey = existing.apiKey;

    if (body.clearApiKey) {
      apiKey = '';
    } else if (body.apiKey !== undefined) {
      apiKey = String(body.apiKey || '').trim().replace(/\s+/g, '');
      if (apiKey && !/^[A-Fa-f0-9]{32}$/i.test(apiKey)) {
        res.status(400).json({ error: 'API Key 应为 32 位字母和数字' });
        return;
      }
    } else {
      res.status(400).json({ error: '请提供 apiKey 或 clearApiKey' });
      return;
    }

    const saved = usersStore.saveUser({
      id: userId,
      apiKey,
    });
    debugLog('用户 API Key 已更新', { userId, hasApiKey: saved.hasApiKey });
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/users/:id', (req, res) => {
  try {
    const userId = String(req.params.id || '').trim();
    const existing = usersStore.readStore().users.find((u) => u.id === userId);
    const data = usersStore.deleteUser(userId);
    debugLog('用户已删除', {
      userId,
      steamId: existing?.steamId || '',
      remaining: data.users.length,
      activeUserId: data.activeUserId,
    });
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/logs', (req, res) => {
  try {
    const lines = Math.min(Math.max(Number(req.query.lines) || 200, 1), 2000);
    res.json({
      logDir: LOG_DIR,
      todayLog: logger.todayLogPath(),
      level: LOG_LEVEL,
      toFile: LOG_TO_FILE,
      lines: logger.readTail(lines),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/storage', (_req, res) => {
  res.json({
    dataDir: DATA_DIR,
    items: [
      { path: 'data/users.json', desc: '用户配置（Steam ID、头像昵称）' },
      { path: 'data/mygame.db', desc: 'SQLite 数据库（游戏库、元数据、封面记录）' },
      { path: 'data/covers/', desc: '本地化游戏封面图片' },
      { path: 'data/logs/', desc: '运行日志（按天滚动，默认保留 14 天）' },
      { path: 'data/platform-accounts.json', desc: 'Epic Token 与育碧会话（本机保存）' },
      { path: 'data/hidden-<用户ID>.json', desc: '各用户的隐藏游戏列表与 Steam 路径' },
      { path: 'data/steam-token-<用户ID>.json', desc: '各用户的 Steam 登录 Token' },
      { path: 'data/favorites-<用户ID>.json', desc: '各用户的游戏收藏' },
      { path: '.env', desc: 'PORT / RAWG_API_KEY / HTTPS_PROXY 等服务端配置' },
    ],
  });
});

app.get('/api/auth/status', async (req, res) => {
  const token = getAccessToken(req);
  const valid = token ? await validateAccessToken(token, steamFetch) : false;
  const user = getRequestUser(req);
  res.json({
    ...getAuthState(),
    hasToken: !!token,
    valid,
    userId: user?.id || '',
  });
});

app.post('/api/auth/preview', async (req, res) => {
  try {
    const token = normalizeAccessToken(req.body?.token || '');
    if (!token) {
      res.status(400).json({ error: '请粘贴 webapi_token' });
      return;
    }

    const apiKeyInput = normalizeApiKey(req.body?.apiKey || '');
    if (apiKeyInput && !isValidApiKey(apiKeyInput)) {
      res.status(400).json({ error: 'API Key 格式不正确，应为 32 位字母和数字' });
      return;
    }

    const valid = await validateAccessToken(token, steamFetch);
    if (!valid) {
      res.status(400).json({ error: 'Token 无效或已过期，请重新获取' });
      return;
    }

    const steamId = parseSteamIdFromToken(token);
    if (!steamId) {
      res.status(400).json({ error: '无法从 Token 解析 Steam ID' });
      return;
    }

    const existingUser = usersStore.findUserBySteamId(steamId);
    let profile = null;
    try {
      profile = await fetchSteamProfile(steamId, apiKeyInput, token);
    } catch {
      profile = null;
    }

    res.json({
      steamId,
      personaName: profile?.personaName || '',
      avatar: profile?.avatar || '',
      duplicate: !!existingUser,
      existingUserId: existingUser?.id || '',
      existingUserName: existingUser?.personaName || existingUser?.name || '',
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/users/add-token', async (req, res) => {
  try {
    const token = normalizeAccessToken(req.body?.token || '');
    if (!token) {
      res.status(400).json({ error: '请粘贴 webapi_token' });
      return;
    }

    const apiKeyInput = normalizeApiKey(req.body?.apiKey || '');
    if (apiKeyInput && !isValidApiKey(apiKeyInput)) {
      res.status(400).json({ error: 'API Key 格式不正确，应为 32 位字母和数字' });
      return;
    }

    const valid = await validateAccessToken(token, steamFetch);
    if (!valid) {
      res.status(400).json({ error: 'Token 无效或已过期，请在已登录 Steam 的浏览器中重新获取' });
      return;
    }

    const steamId = parseSteamIdFromToken(token);
    if (!steamId) {
      res.status(400).json({ error: '无法从 Token 解析 Steam ID' });
      return;
    }

    const existingUser = usersStore.findUserBySteamId(steamId);
    if (existingUser) {
      debugLog('阻止重复添加用户', { steamId, existingUserId: existingUser.id });
      res.status(409).json({
        error: `该 Steam 账号已添加：${existingUser.personaName || existingUser.name}`,
        userId: existingUser.id,
        steamId,
      });
      return;
    }

    let body = { steamId, apiKey: apiKeyInput };
    try {
      const profile = await fetchSteamProfile(steamId, apiKeyInput, token);
      if (profile) {
        body.personaName = profile.personaName;
        body.avatar = profile.avatar;
        body.name = profile.personaName;
      }
    } catch {
      /* keep steam id only */
    }

    const saved = usersStore.saveUser(body);
    const { tokenPath } = usersStore.getUserPaths(saved.id);
    const expiresAt = saveStoredToken(tokenPath, token);
    debugLog('用户已添加', { userId: saved.id, steamId: saved.steamId, name: saved.name });
    res.json({ ...saved, expiresAt, message: '用户已添加' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/token', async (req, res) => {
  try {
    const token = normalizeAccessToken(req.body?.token || '');
    if (!token) {
      res.status(400).json({ error: '请粘贴 webapi_token' });
      return;
    }

    const apiKeyInput = req.body?.apiKey !== undefined
      ? normalizeApiKey(req.body.apiKey || '')
      : undefined;
    if (apiKeyInput && !isValidApiKey(apiKeyInput)) {
      res.status(400).json({ error: 'API Key 格式不正确，应为 32 位字母和数字' });
      return;
    }

    const valid = await validateAccessToken(token, steamFetch);
    if (!valid) {
      res.status(400).json({ error: 'Token 无效或已过期，请在已登录 Steam 的 Edge 中重新打开 Token 页' });
      return;
    }

    const user = getRequestUser(req);
    const { tokenPath } = getUserAuthPaths(user);
    const expiresAt = saveStoredToken(tokenPath, token);

    const steamId = parseSteamIdFromToken(token);
    let savedUser = user ? usersStore.publicUser(user) : null;
    if (user && steamId) {
      let profileBody = { id: user.id, steamId };
      if (apiKeyInput !== undefined) profileBody.apiKey = apiKeyInput;
      const profileKey = apiKeyInput !== undefined ? apiKeyInput : getApiKey(req);
      try {
        const profile = await fetchSteamProfile(steamId, profileKey, token);
        if (profile) {
          profileBody.personaName = profile.personaName;
          profileBody.avatar = profile.avatar;
          profileBody.name = profile.personaName;
        }
      } catch {
        /* ignore */
      }
      savedUser = usersStore.saveUser(profileBody);
      debugLog('Token 已保存并更新资料', { userId: savedUser.id, steamId: savedUser.steamId, name: savedUser.name });
    }

    res.json({
      ok: true,
      expiresAt,
      message: 'Token 已保存',
      user: savedUser,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/favorites', (req, res) => {
  try {
    const user = getRequestUser(req);
    if (!user?.id) {
      res.status(400).json({ error: '请先选择用户' });
      return;
    }
    res.json({ appids: favoritesStore.list(user.id), platforms: favoritesStore.listAll(user.id) });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/favorites/toggle', (req, res) => {
  try {
    const user = getRequestUser(req);
    if (!user?.id) {
      res.status(400).json({ error: '请先选择用户' });
      return;
    }
    const result = favoritesStore.toggle(user.id, req.body?.appid, req.body?.platform);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/hidden', (req, res) => {
  try {
    const user = getRequestUser(req);
    if (!user?.id) {
      res.status(400).json({ error: '请先选择用户' });
      return;
    }
    const settings = hiddenStore.getSettings(user.id);
    res.json({
      appids: settings.appids,
      platforms: settings.platforms,
      steamPath: settings.steamPath,
      detectedPaths: detectSteamInstallPaths(),
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/hidden/toggle', (req, res) => {
  try {
    const user = getRequestUser(req);
    if (!user?.id) {
      res.status(400).json({ error: '请先选择用户' });
      return;
    }
    const result = hiddenStore.toggle(user.id, req.body?.appid, req.body?.platform);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/hidden/settings', (req, res) => {
  try {
    const user = getRequestUser(req);
    if (!user?.id) {
      res.status(400).json({ error: '请先选择用户' });
      return;
    }
    const saved = hiddenStore.setSteamPath(user.id, req.body?.steamPath || '');
    res.json({
      steamPath: saved.steamPath,
      appids: saved.appids,
      platforms: saved.platforms,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/hidden/import-local', (req, res) => {
  try {
    const user = getRequestUser(req);
    if (!user?.id) {
      res.status(400).json({ error: '请先选择用户' });
      return;
    }
    if (!user.steamId) {
      res.status(400).json({ error: '当前用户缺少 Steam ID' });
      return;
    }

    const inputPath = String(req.body?.steamPath || '').trim();
    const savedPath = hiddenStore.getSettings(user.id).steamPath;
    const steamPath = inputPath || savedPath;
    const imported = importHiddenFromLocalSteam(user.steamId, steamPath, debugLog);

    if (!imported.found) {
      res.status(400).json({
        error: '未找到 Steam 客户端配置，请填写 Steam 安装路径后重试',
        detectedPaths: detectSteamInstallPaths(),
        triedPaths: imported.triedPaths,
        steamPath,
      });
      return;
    }

    const merged = hiddenStore.merge(user.id, imported.appids, imported.usedPath || steamPath);
    debugLog('已从本地 Steam 导入隐藏游戏', {
      userId: user.id,
      steamId: user.steamId,
      imported: imported.appids.length,
      added: merged.added,
      total: merged.appids.length,
    });

    res.json({
      imported: imported.appids.length,
      added: merged.added,
      appids: merged.appids,
      platforms: merged.platforms,
      steamPath: merged.steamPath,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/games', async (req, res) => {
  try {
    const rawToken = getAccessToken(req);
    const refresh = req.query.refresh === 'true';
    const { accessToken, tokenExpired } = await resolveAccessTokenForGames(rawToken, refresh);
    const apiKey = getApiKey(req);
    const includeFamily = req.query.includeFamily !== 'false';
    const steamIds = await resolveSteamIds(getSteamIdInput(req), apiKey);

    if (refresh) {
      if (!accessToken) {
        res.status(401).json({
          error: tokenExpired ? 'Token 已过期，请更新后再刷新数据' : '需要 Steam 登录 Token 才能更新游戏库',
          needAuth: true,
          tokenExpired,
        });
        return;
      }
      ensureGamesAuth(apiKey, accessToken);
    } else if (accessToken) {
      ensureGamesAuth(apiKey, accessToken);
    }

    if (!refresh && !accessToken) {
      const result = await loadGamesForSteamIds(steamIds, apiKey, false, {
        accessToken: '',
        includeFamily,
        cacheOnly: true,
      });
      if (!result) {
        res.status(401).json({
          error: tokenExpired
            ? 'Token 已过期且无本地缓存，请先更新 Token'
            : '无本地缓存，请先配置 Steam Token',
          needAuth: true,
          tokenExpired,
        });
        return;
      }
      res.json({
        source: result.source,
        fromCache: true,
        cachedAt: result.cachedAt,
        steamId: steamIds.join(', '),
        steamIds,
        accountCount: steamIds.length,
        gameCount: result.games.length,
        includeFamily: result.includeFamily,
        metaPending: result.metaPending || 0,
        tokenExpired,
        ...buildGameListResponse(
          result.games,
          parseGameFilters(req.query),
          buildSteamFilterContext(req, result.games, { steamIds }),
        ),
      });
      return;
    }

    const result = await loadGamesForSteamIds(steamIds, apiKey, refresh, {
      accessToken,
      includeFamily,
    });

    sendPagedGameResponse(res, result.games, req, 'steam', {
      source: result.source,
      fromCache: !!result.fromCache,
      cachedAt: result.cachedAt,
      steamId: steamIds.join(', '),
      steamIds,
      accountCount: steamIds.length,
      includeFamily: result.includeFamily,
      metaPending: result.metaPending || 0,
      tokenExpired: false,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/games/enrich-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (payload) => {
    if (res.writableEnded || res.destroyed) return false;
    try {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
      return true;
    } catch {
      return false;
    }
  };

  let clientClosed = false;
  req.on('close', () => {
    clientClosed = true;
  });

  try {
    const apiKey = getApiKey(req);
    const steamIds = await resolveSteamIds(getSteamIdInput(req), apiKey);
    const includeFamily = req.query.includeFamily !== 'false';
    const hit = findValidGamesCache(steamIds, includeFamily);
    if (!hit?.cached?.data?.games?.length) {
      send({ complete: true, current: 0, total: 0, updates: [] });
      res.end();
      return;
    }

    let games = hit.cached.data.games;
    games = gameMetaStore.applyCachedMeta(games);
    const total = gameMetaStore.countMissingMeta(games);
    if (!total) {
      send({ complete: true, current: 0, total: 0, updates: [] });
      res.end();
      return;
    }

    const userId = getRequestUserId(req);
    send({ stage: 'meta', current: 0, total, updates: [] });
    await gameMetaStore.enrichGamesMissing(games, steamFetch, (progress) => {
      if (clientClosed) return;
      if (progress.complete) {
        send({ complete: true, current: progress.current, total: progress.total, updates: [] });
        return;
      }
      const updates = (progress.updates || []).filter(
        (item) => !overrideStore.isLocked('steam', item.appid, userId),
      );
      send({
        stage: 'meta',
        current: progress.current,
        total: progress.total,
        updates,
      });
    }, {
      skipAppId: (appid) => overrideStore.isLocked('steam', appid, userId),
    });
    if (!clientClosed && !res.writableEnded) res.end();
  } catch (err) {
    if (!clientClosed) send({ error: err.message });
    if (!res.writableEnded) res.end();
  }
});

app.delete('/api/cache', (req, res) => {
  try {
    const steamId = String(req.query.steamId || '').trim();
    const platform = String(req.query.platform || 'steam').trim().toLowerCase();
    if (platform === 'steam') {
      if (!steamId) {
        res.status(400).json({ error: '缺少 steamId' });
        return;
      }
      libraryStore.remove('steam', steamId);
      libraryStore.remove('steam', `${steamId}_family`);
      loadedGamesCache.delete(steamId);
      loadedGamesCache.delete(`${steamId}_family`);
    } else {
      libraryStore.remove(platform, platform);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/cache/cleanup', (_req, res) => {
  try {
    const removed = cleanLegacyBrowserProfiles(DATA_DIR, debugLog);
    res.json({ ok: true, removed });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/games/lookup', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) {
      res.status(400).json({ error: '请至少输入 2 个字符' });
      return;
    }
    const results = await searchGamesByName(q, {
      rawgKey: RAWG_API_KEY,
      fetchImpl: steamFetch,
      limit: Number(req.query.limit) || 12,
    });
    res.json({ query: q, results, source: RAWG_API_KEY ? 'rawg+steam-fallback' : 'steam' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/games/:platform/:appid/cover', async (req, res) => {
  try {
    const platform = String(req.params.platform || '').trim().toLowerCase();
    const appid = String(req.params.appid || '').trim();
    const url = String(req.body?.url || '').trim();
    const localize = req.body?.localize === true;
    const user = getRequestUser(req);
    const result = await coverService.setCoverUrl(platform, appid, user?.id || '', url, localize);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/games/:platform/:appid/cover/upload', upload.single('cover'), async (req, res) => {
  try {
    const platform = String(req.params.platform || '').trim().toLowerCase();
    const appid = String(req.params.appid || '').trim();
    if (!req.file?.buffer?.length) {
      res.status(400).json({ error: '请上传图片文件' });
      return;
    }
    const user = getRequestUser(req);
    const result = await coverService.saveUploadedFile(
      platform,
      appid,
      user?.id || '',
      req.file.buffer,
      req.file.originalname,
    );
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/games/:platform/:appid/cover/localize', async (req, res) => {
  try {
    const platform = String(req.params.platform || '').trim().toLowerCase();
    const appid = String(req.params.appid || '').trim();
    const remote = String(req.body?.url || '').trim();
    const url = remote || resolveGameDefaultCover({ appid, platform }, platform);
    if (!url) {
      res.status(400).json({ error: '没有可本地化的封面链接' });
      return;
    }
    const result = await coverService.downloadToLocal(platform, appid, url);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

function parseListInput(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean);
  }
  return String(value || '')
    .split(/[,，;；\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

app.get('/api/games/:platform/:appid/override', (req, res) => {
  try {
    const platform = String(req.params.platform || '').trim().toLowerCase();
    const appid = String(req.params.appid || '').trim();
    const user = getRequestUser(req);
    const userId = user?.id || '';
    const override = overrideStore.get(platform, appid, userId);
    const resolvedCover = override ? overrideStore.resolveCoverUrl(override) : '';
    res.json({
      platform,
      appid,
      override: override ? { ...override, resolved_cover_url: resolvedCover } : null,
      lock_from_refresh: !!override?.lock_from_refresh,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/games/:platform/:appid/override', async (req, res) => {
  try {
    const platform = String(req.params.platform || '').trim().toLowerCase();
    const appid = String(req.params.appid || '').trim();
    const user = getRequestUser(req);
    const userId = user?.id || '';
    const body = req.body || {};

    let coverPatch = null;
    const coverUrl = String(body.cover_url || '').trim();
    const localizeCover = body.localize_cover === true;

    if (coverUrl) {
      coverPatch = await coverService.setCoverUrl(platform, appid, userId, coverUrl, localizeCover);
    }

    const saved = overrideStore.save(platform, appid, userId, {
      display_name: String(body.display_name || '').trim(),
      name_cn: String(body.name_cn || '').trim(),
      name_en: String(body.name_en || '').trim(),
      genres: parseListInput(body.genres),
      tags: parseListInput(body.tags),
      aliases: parseListInput(body.aliases),
      lock_from_refresh: body.lock_from_refresh === true,
      ...(coverPatch ? {
        cover_url: coverPatch.cover_url?.startsWith('/covers/') ? '' : (coverPatch.cover_url || ''),
        cover_local: coverPatch.cover_local || '',
        cover_source_url: coverPatch.source_url || '',
      } : {}),
    });

    if (!body.lock_from_refresh && saved && platform === 'steam') {
      if (saved.name_cn && !overrideStore.isLocked(platform, appid, userId)) {
        gameMetaStore.writeMeta(appid, {
          name_cn: saved.name_cn,
          name_en: saved.name_en,
          genres: saved.genres,
          tags: saved.tags,
          aliases: saved.aliases,
        }, saved.name_en, platform);
      }
    }

    const resolvedCover = saved ? overrideStore.resolveCoverUrl(saved) : '';
    res.json({
      ok: true,
      override: saved ? { ...saved, resolved_cover_url: resolvedCover } : null,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/games/:platform/:appid/meta', async (req, res) => {
  try {
    const platform = String(req.params.platform || '').trim().toLowerCase();
    const appid = String(req.params.appid || '').trim();
    const userId = getRequestUser(req)?.id || '';
    const saved = overrideStore.save(platform, appid, userId, {
      name_cn: String(req.body?.name_cn || '').trim(),
      name_en: String(req.body?.name || req.body?.name_en || '').trim(),
      genres: req.body?.genres || [],
      tags: req.body?.tags || [],
      aliases: req.body?.aliases || [],
      lock_from_refresh: req.body?.lock_from_refresh === true,
    });
    res.json({ ok: true, override: saved });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/platforms', (_req, res) => {
  res.json({
    platforms: [
      { id: 'steam', name: 'Steam' },
      { id: 'epic', name: 'Epic' },
      { id: 'ubisoft', name: '育碧' },
    ],
    accounts: platformAccountsStore.listPublic(),
  });
});

app.get('/api/epic/auth/status', (_req, res) => {
  const account = platformAccountsStore.getEpic();
  if (!account?.accessToken) {
    res.json({ valid: false, account: null });
    return;
  }
  res.json({
    valid: true,
    account: platformAccountsStore.listPublic().epic,
  });
});

app.post('/api/epic/auth/token', async (req, res) => {
  try {
    const parsed = parseEpicAuthInput(req.body?.token || req.body?.accessToken || '');
    const session = await resolveEpicSession(parsed, steamFetch);
    const profile = await fetchEpicAccount(session.accessToken, session.accountId, steamFetch);
    const saved = platformAccountsStore.saveEpic({
      accountId: session.accountId || profile.accountId,
      displayName: profile.displayName || session.displayName || session.accountId,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken || '',
      expiresAt: session.expiresAt || profile.expiresAt,
      tokenKind: session.tokenKind || 'web',
    });
    debugLog('Epic 账号已连接', { accountId: saved.accountId, name: saved.displayName });
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/epic/auth/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim();
    const password = String(req.body?.password || '');
    const verificationCode = String(req.body?.verificationCode || req.body?.code || '').trim();
    const twoFactorMethod = String(req.body?.twoFactorMethod || '').trim();
    const loginState = String(req.body?.loginState || req.body?.epicLoginState || '').trim();
    if (!email || !password) throw new Error('请填写 Epic 邮箱和密码');

    const session = await loginEpic(email, password, steamFetch, {
      verificationCode,
      twoFactorMethod,
      loginState,
    });
    const profile = await fetchEpicAccount(session.accessToken, session.accountId, steamFetch);
    const saved = platformAccountsStore.saveEpic({
      accountId: session.accountId || profile.accountId,
      displayName: profile.displayName || session.displayName || session.accountId,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken || '',
      expiresAt: session.expiresAt || profile.expiresAt,
      tokenKind: session.tokenKind || 'launcher',
    });
    debugLog('Epic 账号已连接（密码）', { accountId: saved.accountId, name: saved.displayName });
    res.json(saved);
  } catch (err) {
    if (err.code === 'EPIC_NEED_VERIFICATION') {
      res.status(428).json({
        error: err.message,
        needVerification: true,
        twoFactorMethod: err.twoFactorMethod,
        loginState: err.loginState,
      });
      return;
    }
    if (err.code === 'EPIC_NEED_CAPTCHA') {
      res.status(429).json({
        error: err.message,
        needCaptcha: true,
      });
      return;
    }
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/epic/auth/code', async (req, res) => {
  try {
    const code = String(req.body?.code || req.body?.authorizationCode || req.body?.authCode || '').trim();
    if (!code) throw new Error('请粘贴浏览器返回的 authorizationCode');

    const session = await connectEpicWithAuthCode(code, steamFetch);
    const profile = await fetchEpicAccount(session.accessToken, session.accountId, steamFetch);
    const saved = platformAccountsStore.saveEpic({
      accountId: session.accountId || profile.accountId,
      displayName: profile.displayName || session.displayName || session.accountId,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken || '',
      expiresAt: session.expiresAt || profile.expiresAt,
      tokenKind: session.tokenKind || 'launcher',
    });
    debugLog('Epic 账号已连接（授权码）', { accountId: saved.accountId, name: saved.displayName });
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/epic/auth', (_req, res) => {
  platformAccountsStore.clearEpic();
  res.json({ ok: true });
});

app.get('/api/epic/games', async (req, res) => {
  try {
    const refresh = req.query.refresh === 'true';
    const loaded = await loadEpicGamesForApi(refresh);
    debugLog('Epic 游戏库已加载', { count: loaded.games.length, refresh, fromCache: loaded.fromCache });
    sendPagedGameResponse(res, loaded.games, req, 'epic', {
      fromCache: loaded.fromCache,
      source: loaded.source,
      cachedAt: loaded.cachedAt,
      accountId: loaded.accountId,
      syncInProgress: !!loaded.syncInProgress,
    });
  } catch (err) {
    platformLog('Epic', '游戏库接口失败', { error: err.message, status: err.status || 400 });
    res.status(err.status || 400).json({
      error: err.message,
      needAuth: !!err.needAuth,
    });
  }
});

app.post('/api/epic/games/covers', async (req, res) => {
  try {
    const raw = req.body?.appids ?? req.query.appids ?? req.query.appid ?? '';
    const appids = String(raw).split(',').map((item) => item.trim()).filter(Boolean);
    if (!appids.length) {
      res.json({ updates: [], complete: true });
      return;
    }

    const cached = readPlatformCache('epic');
    if (!cached?.data?.games?.length) {
      res.json({ updates: [], complete: true });
      return;
    }

    let account = platformAccountsStore.getEpic();
    if (!account?.accessToken) {
      res.status(401).json({ error: '请先连接 Epic', needAuth: true });
      return;
    }

    account = await ensureEpicAccessToken(account, steamFetch);
    let catalogToken = account.accessToken;
    if (account.tokenKind === 'web' || catalogToken.startsWith('eg1~')) {
      try {
        const launcher = await exchangeWebTokenForLauncherTokens(catalogToken, steamFetch);
        catalogToken = launcher.accessToken || catalogToken;
      } catch (err) {
        debugLog('Epic launcher 交换失败，继续使用网页 Token', { message: err.message });
      }
    }

    const games = sanitizeEpicGameNames([...(cached.data.games || [])]);
    const updates = await repairEpicGameCoversByAppIds(games, appids, steamFetch, catalogToken, (progress) => {
      if (progress.updates?.length) {
        writePlatformCache('epic', games, { accountId: account.accountId || cached.data.accountId });
      }
    });
    writePlatformCache('epic', games, { accountId: account.accountId || cached.data.accountId });
    res.json({ updates, complete: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/epic/games/enrich-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (payload) => {
    if (res.writableEnded || res.destroyed) return false;
    try {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
      return true;
    } catch {
      return false;
    }
  };

  let clientClosed = false;
  req.on('close', () => {
    clientClosed = true;
  });

  try {
    const cached = readPlatformCache('epic');
    if (!cached?.data?.games?.length) {
      send({ complete: true, current: 0, total: 0, updates: [] });
      res.end();
      return;
    }

    let account = platformAccountsStore.getEpic();
    if (!account?.accessToken) {
      send({ error: '请先连接 Epic' });
      res.end();
      return;
    }

    account = await ensureEpicAccessToken(account, steamFetch);
    let catalogToken = account.accessToken;
    if (account.tokenKind === 'web' || catalogToken.startsWith('eg1~')) {
      try {
        const launcher = await exchangeWebTokenForLauncherTokens(catalogToken, steamFetch);
        catalogToken = launcher.accessToken || catalogToken;
      } catch (err) {
        debugLog('Epic launcher 交换失败，继续使用网页 Token', { message: err.message });
      }
    }

    const games = sanitizeEpicGameNames([...(cached.data.games || [])]);
    const pending = games.filter((game) => !game.cover_url).length;

    send({ stage: 'catalog', current: 0, total: pending, updates: [] });
    await repairEpicGamesCatalogInChunks(games, steamFetch, catalogToken, (progress) => {
      if (clientClosed) return;
      if (progress.updates?.length) {
        writePlatformCache('epic', games, { accountId: account.accountId });
      }
      if (progress.complete) {
        send({ complete: true, current: progress.current, total: progress.total, updates: [] });
        return;
      }
      send({
        stage: 'catalog',
        current: progress.current,
        total: progress.total,
        updates: progress.updates || [],
      });
    });

    if (!clientClosed) {
      writePlatformCache('epic', games, { accountId: account.accountId });
    }
    if (!clientClosed && !res.writableEnded) res.end();
  } catch (err) {
    if (!clientClosed) send({ error: err.message });
    if (!res.writableEnded) res.end();
  }
});

app.get('/api/ubisoft/auth/status', async (_req, res) => {
  const account = platformAccountsStore.getUbisoft();
  if (!account?.ticket) {
    res.json({ valid: false, account: null });
    return;
  }
  try {
    await validateUbisoftSession(account, steamFetch);
    res.json({ valid: true, account: platformAccountsStore.listPublic().ubisoft });
  } catch {
    res.json({ valid: false, account: platformAccountsStore.listPublic().ubisoft, expired: true });
  }
});

app.post('/api/ubisoft/auth/token', async (req, res) => {
  try {
    const parsed = parseUbisoftAuthInput(req.body?.token || req.body?.headers || '');
    const session = await resolveUbisoftSession(parsed, steamFetch);
    const saved = platformAccountsStore.saveUbisoft(session);
    debugLog('育碧账号已连接（网页）', { profileId: saved.profileId, name: saved.displayName });
    res.json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/ubisoft/auth/login', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim();
    const password = String(req.body?.password || '');
    const verificationCode = String(req.body?.verificationCode || req.body?.code || '').trim();
    const twoFactorAuthenticationTicket = String(
      req.body?.twoFactorAuthenticationTicket || req.body?.twoFactorTicket || ''
    ).trim();
    if (!email || !password) throw new Error('请填写育碧邮箱和密码');

    const session = await loginUbisoft(email, password, steamFetch, {
      verificationCode,
      twoFactorAuthenticationTicket,
    });
    const saved = platformAccountsStore.saveUbisoft(session);
    debugLog('育碧账号已连接', { profileId: saved.profileId, name: saved.displayName });
    res.json(saved);
  } catch (err) {
    if (err.code === 'UBISOFT_NEED_VERIFICATION') {
      res.status(428).json({
        error: err.message,
        needVerification: true,
        twoFactorAuthenticationTicket: err.twoFactorAuthenticationTicket,
      });
      return;
    }
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/ubisoft/auth', (_req, res) => {
  platformAccountsStore.clearUbisoft();
  res.json({ ok: true });
});

app.get('/api/ubisoft/games', async (req, res) => {
  try {
    const refresh = req.query.refresh === 'true';
    const loaded = await loadUbisoftGamesForApi(refresh);
    debugLog('育碧游戏库已加载', { count: loaded.games.length, refresh, fromCache: loaded.fromCache });
    sendPagedGameResponse(res, loaded.games, req, 'ubisoft', {
      fromCache: loaded.fromCache,
      source: loaded.source,
      cachedAt: loaded.cachedAt,
      profileId: loaded.profileId,
      sessionExpired: !!loaded.sessionExpired,
      syncInProgress: !!loaded.syncInProgress,
    });
  } catch (err) {
    platformLog('Ubisoft', '游戏库接口失败', { error: err.message, status: err.status || 400 });
    res.status(err.status || 400).json({
      error: err.message,
      needAuth: !!err.needAuth,
    });
  }
});

app.get('/api/random', async (req, res) => {
  try {
    const platform = String(req.query.platform || 'steam').trim().toLowerCase();
    const filters = parseGameFilters(req.query);
    let context = buildFilterContext(req, platform);
    let games = [];

    if (platform === 'epic') {
      const loaded = await loadEpicGamesForApi(false);
      games = loaded.games;
    } else if (platform === 'ubisoft') {
      const loaded = await loadUbisoftGamesForApi(false);
      games = loaded.games;
    } else {
      const rawToken = getAccessToken(req);
      const accessToken = rawToken ? await validateAccessToken(rawToken, steamFetch) : '';
      const apiKey = getApiKey(req);
      const steamIds = await resolveSteamIds(getSteamIdInput(req), apiKey);

      let result;
      if (accessToken) {
        ensureGamesAuth(apiKey, accessToken);
        result = await loadGamesForSteamIds(steamIds, apiKey, false, {
          accessToken,
          includeFamily: req.query.includeFamily !== 'false',
        });
      } else {
        result = await loadGamesForSteamIds(steamIds, apiKey, false, {
          accessToken: '',
          includeFamily: req.query.includeFamily !== 'false',
          cacheOnly: true,
        });
        if (!result) {
          res.status(401).json({
            error: '无本地缓存，请先配置 Steam Token',
            needAuth: true,
            tokenExpired: !!rawToken,
          });
          return;
        }
      }
      games = result.games;
      context = buildSteamFilterContext(req, games, { steamIds });
    }

    const picked = pickRandomFromGames(games, filters, context);
    if (!picked) {
      res.status(404).json({ error: '当前筛选条件下没有游戏' });
      return;
    }

    res.json({ ...picked, platform });
  } catch (err) {
    res.status(err.status || 400).json({
      error: err.message,
      needAuth: !!err.needAuth,
    });
  }
});

if (!existsSync(COVERS_DIR)) mkdirSync(COVERS_DIR, { recursive: true });
app.use('/covers', express.static(COVERS_DIR));
app.use(express.static(join(ROOT_DIR, 'public')));

libraryStore.importLegacyJson(DATA_DIR, debugLog);
gameMetaStore.importLegacyMeta(META_DIR);

const server = app.listen(PORT, () => {
  cleanLegacyBrowserProfiles(DATA_DIR, debugLog);
  logger.info('MyGame 已启动', { url: `http://localhost:${PORT}`, port: PORT });
  logger.info('游戏库缓存策略', { mode: '仅手动刷新时更新远程数据' });
  if (RAWG_API_KEY) logger.info('已配置 RAWG API');
  if (PROXY_URL) logger.info('已启用代理', { proxy: PROXY_URL });
  if (LOG_TO_FILE) logger.info('运行日志已启用', { logDir: LOG_DIR, level: LOG_LEVEL });
  logger.info('按 Ctrl+C 可关闭服务');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error('端口被占用，无法启动', { port: PORT });
  } else {
    logger.error('MyGame 启动失败', err);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('未处理的 Promise 拒绝', reason instanceof Error ? reason : { reason: String(reason) });
});

process.on('uncaughtException', (err) => {
  logger.error('未捕获的异常', err);
});

process.on('SIGINT', () => {
  logger.info('收到退出信号，正在关闭服务');
  server.close(() => process.exit(0));
});
