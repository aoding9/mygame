import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import express from 'express';
import {
  app,
  PORT,
  ROOT_DIR,
  DATA_DIR,
  COVERS_DIR,
  LOG_DIR,
  appSettingsStore,
  logger,
  debugLog,
  runCoverCleanup,
} from './server/runtime.js';
import { registerSettingsRoutes } from './server/routes/settings.js';
import { registerAuthRoutes } from './server/routes/auth.js';
import { registerPrefsRoutes } from './server/routes/prefs.js';
import { registerGamesRoutes } from './server/routes/games.js';
import { cleanLegacyBrowserProfiles } from './services/cache-cleanup.js';

registerSettingsRoutes(app);
registerAuthRoutes(app);
registerPrefsRoutes(app);
registerGamesRoutes(app);

if (!existsSync(COVERS_DIR)) mkdirSync(COVERS_DIR, { recursive: true });
app.use('/covers', express.static(COVERS_DIR));
app.use(express.static(join(ROOT_DIR, 'public')));

const server = app.listen(PORT, () => {
  cleanLegacyBrowserProfiles(DATA_DIR, debugLog);
  setTimeout(() => {
    try {
      runCoverCleanup();
    } catch (err) {
      logger.warn('封面清理失败', { message: err.message });
    }
  }, 30_000);
  const settings = appSettingsStore.get();
  logger.info('MyGame 已启动', { url: `http://localhost:${PORT}`, port: PORT });
  logger.info('封面清理策略', {
    orphanTtlDays: settings.coverOrphanTtlDays,
    intervalHours: settings.coverCleanupIntervalHours,
  });
  logger.info('游戏库缓存策略', { mode: '仅手动刷新时更新远程数据' });
  if (settings.httpsProxy) logger.info('已启用代理', { proxy: settings.httpsProxy });
  if (settings.logToFile) logger.info('运行日志已启用', { logDir: LOG_DIR, level: settings.logLevel });
  logger.info('按 Ctrl+C 可关闭服务');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.error('端口被占用，无法启动', {
      port: PORT,
      hint: '在项目根目录 .env 中设置 PORT=3001',
    });
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

function shutdown() {
  logger.info('收到退出信号，正在关闭服务');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
