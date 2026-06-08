import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  buildPlatformPrefsResponse,
  createEmptyPlatformAppIds,
  listPlatformAppIds,
  mergePlatformAppIds,
  normalizeGamePrefPlatform,
  readPlatformAppIds,
  togglePlatformAppId,
} from './game-prefs-store.js';
import { createKeyedTinyCache } from '../services/tiny-cache.js';

export function createHiddenStore(dataDir) {
  const dataCache = createKeyedTinyCache();

  function ensureDir() {
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  }

  function storePath(userId) {
    return join(dataDir, `hidden-${userId}.json`);
  }

  function readData(userId) {
    if (!userId) {
      return { platforms: createEmptyPlatformAppIds(), steamPath: '', updatedAt: 0 };
    }
    const cached = dataCache.get(userId);
    if (cached) return cached;

    ensureDir();
    const path = storePath(userId);
    if (!existsSync(path)) {
      const empty = { platforms: createEmptyPlatformAppIds(), steamPath: '', updatedAt: 0 };
      dataCache.set(userId, empty);
      return empty;
    }

    try {
      const raw = JSON.parse(readFileSync(path, 'utf-8'));
      const data = {
        platforms: readPlatformAppIds(raw),
        steamPath: String(raw.steamPath || '').trim(),
        updatedAt: Number(raw.updatedAt) || 0,
      };
      dataCache.set(userId, data);
      return data;
    } catch {
      const empty = { platforms: createEmptyPlatformAppIds(), steamPath: '', updatedAt: 0 };
      dataCache.set(userId, empty);
      return empty;
    }
  }

  function writeData(userId, data) {
    ensureDir();
    const payload = {
      platforms: data.platforms || createEmptyPlatformAppIds(),
      steamPath: String(data.steamPath || '').trim(),
      updatedAt: Date.now(),
    };
    writeFileSync(storePath(userId), JSON.stringify(payload, null, 2), 'utf-8');
    dataCache.set(userId, payload);
    return payload;
  }

  function list(userId) {
    return listPlatformAppIds(readData(userId).platforms, 'steam').map((id) => Number(id));
  }

  function listForPlatform(userId, platform) {
    return listPlatformAppIds(readData(userId).platforms, platform);
  }

  function getSettings(userId) {
    const data = readData(userId);
    return {
      platforms: data.platforms,
      appids: list(userId),
      steamPath: data.steamPath,
      updatedAt: data.updatedAt,
    };
  }

  function setSteamPath(userId, steamPath) {
    const data = readData(userId);
    data.steamPath = String(steamPath || '').trim();
    writeData(userId, data);
    return getSettings(userId);
  }

  function toggle(userId, appid, platform = 'steam') {
    if (!userId) throw new Error('请先选择用户');
    const data = readData(userId);
    const result = togglePlatformAppId(data.platforms, platform, appid);
    writeData(userId, data);
    return buildPlatformPrefsResponse(data.platforms, {
      appid: normalizeGamePrefPlatform(platform) === 'steam' ? Number(result.appid) : result.appid,
      platform: result.platform,
      hidden: result.active,
    });
  }

  function merge(userId, appids, steamPath = '') {
    const data = readData(userId);
    const before = (data.platforms.steam || []).length;
    mergePlatformAppIds(data.platforms, 'steam', appids);
    if (steamPath) data.steamPath = String(steamPath).trim();
    writeData(userId, data);
    return {
      ...buildPlatformPrefsResponse(data.platforms),
      added: data.platforms.steam.length - before,
      steamPath: data.steamPath,
    };
  }

  return {
    list,
    listForPlatform,
    getSettings,
    setSteamPath,
    toggle,
    merge,
  };
}
