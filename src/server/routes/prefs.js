import * as rt from '../runtime.js';
import { listSteamCollectionsForFilter, readSteamCollections } from '../../steam/collections.js';
import { detectSteamInstallPaths, importHiddenFromLocalSteam } from '../../steam/hidden-games.js';

export function registerPrefsRoutes(app) {
  const {
  collectionsStore,
  debugLog,
  favoritesStore,
  getRequestUser,
  hiddenStore,
  resolveEffectiveSteamPath
  } = rt;

  app.get('/api/favorites', (req, res) => {
    try {
      const user = rt.getRequestUser(req);
      if (!user?.id) {
        res.status(400).json({ error: '请先选择用户' });
        return;
      }
      res.json({ appids: rt.favoritesStore.list(user.id), platforms: rt.favoritesStore.listAll(user.id) });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/favorites/toggle', (req, res) => {
    try {
      const user = rt.getRequestUser(req);
      if (!user?.id) {
        res.status(400).json({ error: '请先选择用户' });
        return;
      }
      const result = rt.favoritesStore.toggle(user.id, req.body?.appid, req.body?.platform);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/hidden', (req, res) => {
    try {
      const user = rt.getRequestUser(req);
      if (!user?.id) {
        res.status(400).json({ error: '请先选择用户' });
        return;
      }
      const settings = rt.hiddenStore.getSettings(user.id);
      const effectiveSteamPath = rt.resolveEffectiveSteamPath(user.id);
      res.json({
        appids: settings.appids,
        platforms: settings.platforms,
        steamPath: effectiveSteamPath,
        detectedPaths: detectSteamInstallPaths(effectiveSteamPath),
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/hidden/toggle', (req, res) => {
    try {
      const user = rt.getRequestUser(req);
      if (!user?.id) {
        res.status(400).json({ error: '请先选择用户' });
        return;
      }
      const result = rt.hiddenStore.toggle(user.id, req.body?.appid, req.body?.platform);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.patch('/api/hidden/settings', (req, res) => {
    try {
      const user = rt.getRequestUser(req);
      if (!user?.id) {
        res.status(400).json({ error: '请先选择用户' });
        return;
      }
      const saved = rt.hiddenStore.setSteamPath(user.id, req.body?.steamPath || '');
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
      const user = rt.getRequestUser(req);
      if (!user?.id) {
        res.status(400).json({ error: '请先选择用户' });
        return;
      }
      if (!user.steamId) {
        res.status(400).json({ error: '当前用户缺少 Steam ID' });
        return;
      }

      const inputPath = String(req.body?.steamPath || '').trim();
      const steamPath = inputPath || rt.resolveEffectiveSteamPath(user.id);
      const imported = importHiddenFromLocalSteam(user.steamId, steamPath, debugLog);

      if (!imported.found) {
        res.status(400).json({
          error: '未找到 Steam 客户端配置，请填写 Steam 安装路径后重试',
          detectedPaths: detectSteamInstallPaths(steamPath),
          triedPaths: imported.triedPaths,
          steamPath,
        });
        return;
      }

      const merged = rt.hiddenStore.merge(user.id, imported.appids, imported.usedPath || steamPath);
      rt.debugLog('已从本地 Steam 导入隐藏游戏', {
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

  app.get('/api/collections', (req, res) => {
    try {
      const user = rt.getRequestUser(req);
      if (!user?.id) {
        res.status(400).json({ error: '请先选择用户' });
        return;
      }
      const settings = rt.collectionsStore.getSettings(user.id);
      const effectiveSteamPath = rt.resolveEffectiveSteamPath(user.id);
      res.json({
        collections: settings.filterCollections,
        steamPath: effectiveSteamPath,
        detectedPaths: detectSteamInstallPaths(effectiveSteamPath),
        updatedAt: settings.updatedAt,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/collections/import-local', (req, res) => {
    try {
      const user = rt.getRequestUser(req);
      if (!user?.id) {
        res.status(400).json({ error: '请先选择用户' });
        return;
      }
      if (!user.steamId) {
        res.status(400).json({ error: '当前用户缺少 Steam ID' });
        return;
      }

      const inputPath = String(req.body?.steamPath || '').trim();
      const steamPath = inputPath || rt.resolveEffectiveSteamPath(user.id);
      const imported = readSteamCollections(user.steamId, { steamPath, debugLog });

      if (!imported.found) {
        res.status(400).json({
          error: '未找到 Steam 客户端收藏夹配置，请填写 Steam 安装路径后重试',
          detectedPaths: detectSteamInstallPaths(steamPath),
          steamPath,
        });
        return;
      }

      const saved = rt.collectionsStore.importCollections(user.id, imported.collections, steamPath);
      if (steamPath) rt.hiddenStore.setSteamPath(user.id, steamPath);

      rt.debugLog('已从本地 Steam 导入收藏夹', {
        userId: user.id,
        steamId: user.steamId,
        collections: saved.collections.length,
        steamPath: saved.steamPath,
      });

      res.json({
        imported: saved.collections.length,
        collections: listSteamCollectionsForFilter(saved.collections),
        steamPath: saved.steamPath,
        updatedAt: saved.updatedAt,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
}
