import * as rt from '../runtime.js';
import { cleanLegacyBrowserProfiles } from '../../services/cache-cleanup.js';
import {
  buildGameListResponse,
  parseGameFilters,
  pickRandomFromGames,
} from '../../services/game-filters.js';
import { searchGamesByName } from '../../services/game-lookup.js';
import { resolveSteamCoverCandidates } from '../../services/steam-cover-urls.js';
import {
  launchSteamGame,
  openSteamInstallPage,
  readSteamInstalledAppIds,
} from '../../platforms/steam-local.js';

export function registerGamesRoutes(app) {
  const {
  DATA_DIR,
  annotateInstalledGames,
  applyGameOverrides,
  buildSteamFilterContext,
  coverLocalizeSkipStore,
  coverService,
  debugLog,
  ensureGamesAuth,
  findCachedGame,
  findValidGamesCache,
  gameMetaStore,
  getAccessToken,
  getApiKey,
  getRequestUser,
  getRequestUserId,
  getSteamIdInput,
  isRefreshActive,
  libraryStore,
  loadCachedGamesForCoverLocalization,
  loadGamesForSteamIds,
  overrideStore,
  parseRefreshParts,
  resolveAccessTokenForGames,
  resolveEffectiveSteamPath,
  resolveGameDefaultCover,
  resolveSteamIds,
  runCoverCleanup,
  runCoverLocalization,
  sendPagedGameResponse,
  steamFetch,
  upload
  } = rt;

  app.post('/api/games/:platform/:appid/launch', (req, res) => {
    try {
      const platform = String(req.params.platform || '').trim().toLowerCase();
      const appid = String(req.params.appid || '').trim();
      if (platform !== 'steam') {
        res.status(400).json({ error: '仅支持 Steam 游戏' });
        return;
      }
      if (!appid) {
        res.status(400).json({ error: '缺少游戏 ID' });
        return;
      }

      const installedIds = readSteamInstalledAppIds();
      const numericId = Number(appid);
      if (!installedIds.has(numericId)) {
        res.status(400).json({ error: '该游戏未在本机安装' });
        return;
      }

      const user = rt.getRequestUser(req);
      const steamPath = rt.resolveEffectiveSteamPath(user?.id);
      const result = launchSteamGame(appid, steamPath);
      rt.debugLog('启动 Steam 游戏', { appid, userId: user?.id, method: result.method });
      res.json({ ok: true, appid: result.appid, method: result.method });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/games/:platform/:appid/install', (req, res) => {
    try {
      const platform = String(req.params.platform || '').trim().toLowerCase();
      const appid = String(req.params.appid || '').trim();
      if (platform !== 'steam') {
        res.status(400).json({ error: '仅支持 Steam 游戏' });
        return;
      }
      if (!appid) {
        res.status(400).json({ error: '缺少游戏 ID' });
        return;
      }

      const installedIds = readSteamInstalledAppIds();
      const numericId = Number(appid);
      if (installedIds.has(numericId)) {
        res.status(400).json({ error: '游戏已安装，可直接启动' });
        return;
      }

      const user = rt.getRequestUser(req);
      const steamPath = rt.resolveEffectiveSteamPath(user?.id);
      const result = openSteamInstallPage(appid, steamPath);
      rt.debugLog('打开 Steam 下载页', { appid, userId: user?.id, method: result.method });
      res.json({ ok: true, appid: result.appid, method: result.method, storeUrl: result.storeUrl });
    } catch (err) {
      res.status(400).json({
        error: err.message,
        storeUrl: err.storeUrl || `https://store.steampowered.com/app/${String(req.params.appid || '').trim()}`,
      });
    }
  });

  app.post('/api/covers/localize', async (req, res) => {
    try {
      const platform = String(req.query.platform || req.body?.platform || 'steam').trim().toLowerCase();
      const games = await rt.loadCachedGamesForCoverLocalization(platform, req);
      const retryFailed = req.query.localizeRetryFailed === 'true' || req.query.localizeRetryFailed === '1';
      const overwriteLocal = req.query.localizeIncludeLocal === 'true' || req.query.localizeIncludeLocal === '1';
      const localizedCovers = await rt.runCoverLocalization(games, platform, { retryFailed, overwriteLocal });
      res.json({ ok: true, localizedCovers });
    } catch (err) {
      res.status(err.status || 400).json({ error: err.message });
    }
  });

  app.get('/api/games', async (req, res) => {
    try {
      const rawToken = rt.getAccessToken(req);
      const refreshParts = rt.parseRefreshParts(req.query, 'steam');
      const refreshActive = rt.isRefreshActive(refreshParts);
      const { accessToken, tokenExpired } = await rt.resolveAccessTokenForGames(rawToken, refreshParts.library);
      const apiKey = rt.getApiKey(req);
      const includeFamily = req.query.includeFamily !== 'false';
      const steamIds = await rt.resolveSteamIds(rt.getSteamIdInput(req), apiKey);

      if (refreshParts.library) {
        if (!accessToken) {
          res.status(401).json({
            error: tokenExpired ? 'Token 已过期，请更新后再刷新数据' : '需要 Steam 登录 Token 才能更新游戏库',
            needAuth: true,
            tokenExpired,
          });
          return;
        }
        rt.ensureGamesAuth(apiKey, accessToken);
      } else if (accessToken) { ensureGamesAuth(apiKey, accessToken);
      }

      if (!refreshActive && !accessToken) {
        const result = await rt.loadGamesForSteamIds(steamIds, apiKey, refreshParts, {
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
        const installedCount = rt.annotateInstalledGames(result.games);
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
          refreshParts,
          tokenExpired,
          installedCount,
          ...buildGameListResponse(
            result.games,
            parseGameFilters(req.query), buildSteamFilterContext(req, result.games, { steamIds }),
          ),
        });
        return;
      }

      const result = await rt.loadGamesForSteamIds(steamIds, apiKey, refreshParts, {
        accessToken,
        includeFamily,
      });

      rt.sendPagedGameResponse(res, result.games, req, 'steam', {
        source: result.source,
        fromCache: !!result.fromCache,
        cachedAt: result.cachedAt,
        steamId: steamIds.join(', '),
        steamIds,
        accountCount: steamIds.length,
        includeFamily: result.includeFamily,
        metaPending: result.metaPending || 0,
        refreshParts,
        localizedCovers: result.localizedCovers || null,
        tokenExpired: false,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  function parseLibraryStreamRefreshParts(query, platform) {
    const parts = rt.parseRefreshParts(query, platform);
    return {
      library: true,
      meta: false,
      metaAll: false,
      covers: false,
      coversAll: false,
      localizeCovers: !!parts.localizeCovers,
      localizeRetryFailed: !!parts.localizeRetryFailed,
      localizeIncludeLocal: !!parts.localizeIncludeLocal,
    };
  }

  function createSseStream(res, req) {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    let clientClosed = false;
    req.on('close', () => {
      clientClosed = true;
    });

    const send = (payload) => {
      if (clientClosed || res.writableEnded || res.destroyed) return false;
      try {
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
        return true;
      } catch {
        return false;
      }
    };

    return { send, get clientClosed() { return clientClosed; } };
  }

  app.get('/api/games/library-stream', async (req, res) => {
    const { send, clientClosed } = createSseStream(res, req);

    try {
      const rawToken = rt.getAccessToken(req);
      const refreshParts = parseLibraryStreamRefreshParts(req.query, 'steam');
      const { accessToken, tokenExpired } = await rt.resolveAccessTokenForGames(rawToken, true);
      const apiKey = rt.getApiKey(req);
      const includeFamily = req.query.includeFamily !== 'false';
      const steamIds = await rt.resolveSteamIds(rt.getSteamIdInput(req), apiKey);

      if (!accessToken) {
        send({
          error: tokenExpired ? 'Token 已过期，请更新后再刷新数据' : '需要 Steam 登录 Token 才能更新游戏库',
          needAuth: true,
          tokenExpired,
        });
        res.end();
        return;
      }
      rt.ensureGamesAuth(apiKey, accessToken);

      send({ stage: 'library', label: '拉取 Steam 游戏库', current: 0, total: 0 });

      const result = await rt.loadGamesForSteamIds(steamIds, apiKey, refreshParts, {
        accessToken,
        includeFamily,
        onProgress: (progress) => {
          if (clientClosed) return;
          send(progress);
        },
      });

      if (!clientClosed) {
        send({
          complete: true,
          stage: 'library',
          current: 1,
          total: 1,
          localizedCovers: result.localizedCovers || null,
        });
      }
      if (!clientClosed && !res.writableEnded) res.end();
    } catch (err) {
      if (!clientClosed) send({ error: err.message });
      if (!res.writableEnded) res.end();
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
      const apiKey = rt.getApiKey(req);
      const steamIds = await rt.resolveSteamIds(rt.getSteamIdInput(req), apiKey);
      const includeFamily = req.query.includeFamily !== 'false';
      const hit = rt.findValidGamesCache(steamIds, includeFamily);
      if (!hit?.cached?.data?.games?.length) {
        send({ complete: true, current: 0, total: 0, updates: [] });
        res.end();
        return;
      }

      const games = hit.cached.data.games;
      const forceAll = req.query.forceAll === 'true' || req.query.forceAll === '1';
      const userId = rt.getRequestUserId(req);
      const skipAppId = (appid) => rt.overrideStore.isLocked('steam', appid, userId);

      let total;
      if (forceAll) {
        total = games.filter((game) => !skipAppId(game.appid)).length;
      } else {
        total = rt.gameMetaStore.applyCachedMetaWithStats(games).metaPending;
      }
      if (!total) {
        send({ complete: true, current: 0, total: 0, updates: [] });
        res.end();
        return;
      }

      send({ stage: 'meta', current: 0, total, updates: [] });
      await rt.gameMetaStore.enrichGamesMissing(games, steamFetch, (progress) => {
        if (clientClosed) return;
        if (progress.complete) {
          send({ complete: true, current: progress.current, total: progress.total, updates: [] });
          return;
        }
        const updates = (progress.updates || []).filter(
          (item) => !rt.overrideStore.isLocked('steam', item.appid, userId),
        );
        send({
          stage: 'meta',
          current: progress.current,
          total: progress.total,
          updates,
        });
      }, {
        skipAppId,
        forceAll,
        shouldAbort: () => clientClosed,
      });
      if (!clientClosed && !res.writableEnded) res.end();
    } catch (err) {
      if (!clientClosed) send({ error: err.message });
      if (!res.writableEnded) res.end();
    }
  });

  app.get('/api/games/meta-pending', async (req, res) => {
    try {
      const apiKey = rt.getApiKey(req);
      const steamIds = await rt.resolveSteamIds(rt.getSteamIdInput(req), apiKey);
      const includeFamily = req.query.includeFamily !== 'false';
      const hit = rt.findValidGamesCache(steamIds, includeFamily);
      if (!hit?.cached?.data?.games?.length) {
        res.json({ pending: 0, total: 0 });
        return;
      }
      const games = hit.cached.data.games;
      const stats = rt.gameMetaStore.applyCachedMetaWithStats(games);
      res.json({ pending: stats.metaPending, total: games.length });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/games/covers/refetch-stream', async (req, res) => {
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
      const userId = rt.getRequestUserId(req);
      const includeLocal = req.query.includeLocal === 'true'
        || req.query.coversIncludeLocal === 'true'
        || req.query.coversIncludeLocal === '1';
      const forceAll = req.query.forceAll === 'true' || req.query.forceAll === '1'
        || req.query.coversAll === 'true' || req.query.coversAll === '1';
      const apiKey = rt.getApiKey(req);
      const steamIds = await rt.resolveSteamIds(rt.getSteamIdInput(req), apiKey);
      const includeFamily = req.query.includeFamily !== 'false';
      const hit = rt.findValidGamesCache(steamIds, includeFamily);
      if (!hit?.cached?.data?.games?.length) {
        send({ complete: true, current: 0, total: 0, updates: [] });
        res.end();
        return;
      }

      const games = hit.cached.data.games;
      rt.applyGameOverrides(games, 'steam', userId);
      send({ stage: 'covers', current: 0, total: 0, updates: [] });
      await rt.coverService.refetchAllCovers(
        games,
        'steam',
        (game) => resolveSteamCoverCandidates(game),
        {
          userId,
          includeLocal,
          fillOnly: !forceAll,
          shouldSkipAppId: (appid) => rt.overrideStore.isLocked('steam', appid, userId),
          onProgress: (progress) => {
            if (clientClosed) return;
            if (progress.complete) {
              send({
                complete: true,
                current: progress.current,
                total: progress.total,
                failed: progress.failed || 0,
                updates: [],
              });
              return;
            }
            send({
              stage: 'covers',
              current: progress.current,
              total: progress.total,
              failed: progress.failed || 0,
              updates: progress.updates || [],
            });
          },
        },
      );
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
        rt.libraryStore.remove('steam', steamId);
        rt.libraryStore.remove('steam', `${steamId}_family`);
      } else { libraryStore.remove(platform, platform);
      }
      res.json({ ok: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/cache/cleanup', (_req, res) => {
    try {
      const legacy = cleanLegacyBrowserProfiles(rt.DATA_DIR, debugLog);
      const covers = rt.runCoverCleanup();
      res.json({
        ok: true,
        removed: {
          profiles: legacy.profiles || 0,
          bytes: (legacy.bytes || 0) + (covers.bytes || 0),
          covers: covers.covers || 0,
          coverBytes: covers.bytes || 0,
        },
      });
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
        fetchImpl: rt.steamFetch,
        limit: Number(req.query.limit) || 12,
      });
      res.json({ query: q, results, source: 'steam' });
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
      const user = rt.getRequestUser(req);
      const result = await rt.coverService.setCoverUrl(platform, appid, user?.id || '', url, localize);
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/games/:platform/:appid/cover/rt.upload', (req, res) => { upload.single('cover')(req, res, async (err) => {
      try {
        if (err) { debugLog('封面上传解析失败', { message: err.message });
          res.status(400).json({ error: err.message || '上传解析失败' });
          return;
        }
        const platform = String(req.params.platform || '').trim().toLowerCase();
        const appid = String(req.params.appid || '').trim();
        if (!req.file?.buffer?.length) {
          res.status(400).json({ error: '请上传图片文件' });
          return;
        }
        const user = rt.getRequestUser(req);
        const result = await rt.coverService.saveUploadedFile(
          platform,
          appid,
          user?.id || '',
          req.file.buffer,
          req.file.originalname,
        );
        res.json({ ok: true, ...result });
      } catch (uploadErr) { debugLog('封面上传失败', { platform: req.params.platform, appid: req.params.appid, message: uploadErr.message });
        res.status(400).json({ error: uploadErr.message });
      }
    });
  });

  app.post('/api/games/:platform/:appid/refresh-meta', async (req, res) => {
    try {
      const platform = String(req.params.platform || '').trim().toLowerCase();
      const appid = String(req.params.appid || '').trim();
      const game = rt.findCachedGame(platform, appid) || { appid, name: '', platform };
      const sourceName = game.source_name || game.name || '';

      if (platform === 'steam') {
        const meta = await rt.gameMetaStore.refreshSingleGameMeta(appid, steamFetch, sourceName);
        res.json({
          ok: true,
          platform,
          appid,
          meta: {
            name_cn: meta.name_cn || '',
            name_en: meta.name_en || sourceName,
            genres: meta.genres || [],
            tags: meta.tags || [],
            aliases: meta.aliases || [],
          },
        });
        return;
      }

      res.status(400).json({ error: `不支持的平台: ${platform}` });
    } catch (err) { debugLog('单游戏资料刷新失败', { message: err.message, platform: req.params.platform, appid: req.params.appid });
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/games/:platform/:appid/cover/refetch', async (req, res) => {
    try {
      const platform = String(req.params.platform || '').trim().toLowerCase();
      const appid = String(req.params.appid || '').trim();
      const user = rt.getRequestUser(req);
      const userId = user?.id || '';
      const localize = req.body?.localize === true;
      const game = rt.findCachedGame(platform, appid) || { appid, platform };

      const remoteUrls = platform === 'steam'
        ? resolveSteamCoverCandidates({ appid, img_icon_url: game.img_icon_url, cover_url: game.cover_url })
        : [rt.resolveGameDefaultCover(game, platform)].filter(Boolean);
      if (!remoteUrls.length) {
        res.status(400).json({ error: '未能获取默认封面链接' });
        return;
      }

      const result = await rt.coverService.refetchCover(platform, appid, userId, remoteUrls, localize);
      rt.coverLocalizeSkipStore.unmark(platform, appid);
      res.json({
        ok: true,
        cover_url: result.cover_url,
        cover_local: result.cover_local || '',
        source_url: result.source_url,
        resolved_cover_url: result.cover_url,
      });
    } catch (err) { debugLog('重新获取封面失败', { message: err.message, platform: req.params.platform, appid: req.params.appid });
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/games/:platform/:appid/cover/localize', async (req, res) => {
    try {
      const platform = String(req.params.platform || '').trim().toLowerCase();
      const appid = String(req.params.appid || '').trim();
      const remote = String(req.body?.url || '').trim();
      const url = remote || rt.resolveGameDefaultCover({ appid, platform }, platform);
      if (!url) {
        res.status(400).json({ error: '没有可本地化的封面链接' });
        return;
      }
      const result = await rt.coverService.downloadToLocal(platform, appid, url);
      rt.coverLocalizeSkipStore.unmark(platform, appid);
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
      const user = rt.getRequestUser(req);
      const userId = user?.id || '';
      const override = rt.overrideStore.get(platform, appid, userId);
      const resolvedCover = override ? rt.overrideStore.resolveCoverUrl(override) : '';
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
      const user = rt.getRequestUser(req);
      const userId = user?.id || '';
      const body = req.body || {};

      let coverPatch = null;
      const coverUrl = String(body.cover_url || '').trim();
      const localizeCover = body.localize_cover === true;

      if (coverUrl) {
        coverPatch = await rt.coverService.setCoverUrl(platform, appid, userId, coverUrl, localizeCover);
      }

      const saved = rt.overrideStore.save(platform, appid, userId, {
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
        if (saved.name_cn && !rt.overrideStore.isLocked(platform, appid, userId)) { gameMetaStore.writeMeta(appid, {
            name_cn: saved.name_cn,
            name_en: saved.name_en,
            genres: saved.genres,
            tags: saved.tags,
            aliases: saved.aliases,
          }, saved.name_en, platform);
        }
      }

      const resolvedCover = saved ? rt.overrideStore.resolveCoverUrl(saved) : '';
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
      const userId = rt.getRequestUser(req)?.id || '';
      const saved = rt.overrideStore.save(platform, appid, userId, {
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
      ],
    });
  });

  app.get('/api/random', async (req, res) => {
    try {
      const platform = String(req.query.platform || 'steam').trim().toLowerCase();
      const filters = parseGameFilters(req.query);
      if (platform !== 'steam') {
        res.status(400).json({ error: `不支持的平台: ${platform}` });
        return;
      }

      const rawToken = rt.getAccessToken(req);
      const { accessToken } = await rt.resolveAccessTokenForGames(rawToken, false);
      const apiKey = rt.getApiKey(req);
      const steamIds = await rt.resolveSteamIds(rt.getSteamIdInput(req), apiKey);

      let result;
      if (accessToken) { ensureGamesAuth(apiKey, accessToken);
        result = await rt.loadGamesForSteamIds(steamIds, apiKey, false, {
          accessToken,
          includeFamily: req.query.includeFamily !== 'false',
        });
      } else {
        result = await rt.loadGamesForSteamIds(steamIds, apiKey, false, {
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
      const games = result.games;
      if (platform === 'steam') { annotateInstalledGames(games);
      }
      const context = rt.buildSteamFilterContext(req, games, { steamIds });

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
}
