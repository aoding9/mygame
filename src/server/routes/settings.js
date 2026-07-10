import * as rt from '../runtime.js';
import { cleanLegacyBrowserProfiles } from '../../services/cache-cleanup.js';
import { getAuthState } from '../../steam/auth.js';

export function registerSettingsRoutes(app) {
  const {
  DATA_DIR,
  LOG_DIR,
  appSettingsStore,
  applyAppSettings,
  buildLocalPathDetection,
  db,
  debugLog,
  getRequestUser,
  getSteamTokenContext,
  isSteamTokenValidForRequest,
  libraryStore,
  logger,
  runCoverCleanup,
  usersStore
  } = rt;

  app.get('/api/config', async (req, res) => {
    const user = rt.getRequestUser(req);
    const { token } = rt.getSteamTokenContext(req);
    const validToken = rt.isSteamTokenValidForRequest(req);
    const userList = rt.usersStore.listUsers();

    res.json({
      appName: 'MyGame',
      cacheMode: 'manual',
      hasAccessToken: !!token,
      accessTokenValid: validToken,
      authState: getAuthState(),
      activeUserId: userList.activeUserId,
      activeUser: user ? rt.usersStore.publicUser(user) : null,
    });
  });

  app.get('/api/settings', (_req, res) => {
    const settings = rt.appSettingsStore.get();
    res.json({
      ...settings,
      detected: rt.buildLocalPathDetection(settings),
    });
  });

  app.patch('/api/settings', (req, res) => {
    try {
      const body = req.body || {};
      const current = rt.appSettingsStore.get();
      const saved = rt.appSettingsStore.update({
        steamPath: body.steamPath ?? current.steamPath,
        httpsProxy: body.httpsProxy ?? current.httpsProxy,
        logLevel: body.logLevel ?? current.logLevel,
        logToFile: 'logToFile' in body ? body.logToFile !== false : current.logToFile,
        coverOrphanTtlDays: body.coverOrphanTtlDays ?? current.coverOrphanTtlDays,
        coverCleanupIntervalHours: body.coverCleanupIntervalHours ?? current.coverCleanupIntervalHours,
      });
      rt.applyAppSettings(saved);
      res.json({
        ...saved,
        detected: rt.buildLocalPathDetection(saved),
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/logs', (req, res) => {
    try {
      const lines = Math.min(Math.max(Number(req.query.lines) || 200, 1), 2000);
      const logConfig = rt.logger.getConfig();
      res.json({
        logDir: rt.LOG_DIR,
        todayLog: rt.logger.todayLogPath(),
        level: logConfig.level,
        toFile: logConfig.toFile,
        lines: rt.logger.readTail(lines),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/storage', (_req, res) => {
    res.json({
      dataDir: rt.DATA_DIR,
      items: [
        { path: 'data/users.json', desc: 'Steam 账号配置（Steam ID、头像昵称）' },
        { path: 'data/mygame.db', desc: 'SQLite（games 游戏表、library_snapshot_games 库关联、元数据、封面覆盖）' },
        { path: 'data/covers/', desc: '本地化游戏封面图片' },
        { path: 'data/logs/', desc: '运行日志（按天滚动，默认保留 14 天）' },
        { path: 'data/hidden-<用户ID>.json', desc: '隐藏游戏列表与 Steam 路径' },
        { path: 'data/steam-token-<用户ID>.json', desc: 'Steam 登录 Token' },
        { path: 'data/app-settings.json', desc: '应用设置（代理、日志、封面清理、客户端路径）' },
        { path: 'data/cover-localize-skip.json', desc: '封面本地化失败跳过记录（30 天内不再重试）' },
        { path: 'data/favorites-<用户ID>.json', desc: '游戏收藏' },
      ],
    });
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
}
