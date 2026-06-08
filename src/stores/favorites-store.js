import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  buildPlatformPrefsResponse,
  createEmptyPlatformAppIds,
  listPlatformAppIds,
  normalizeGamePrefPlatform,
  readPlatformAppIds,
  togglePlatformAppId,
} from './game-prefs-store.js';
import { createKeyedTinyCache } from '../services/tiny-cache.js';

function writePlatformAppIdsToFile(path, platforms) {
  writeFileSync(
    path,
    JSON.stringify({ platforms, updatedAt: Date.now() }, null, 2),
    'utf-8',
  );
}

export function createFavoritesStore(dataDir) {
  const platformsCache = createKeyedTinyCache();

  function ensureDir() {
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  }

  function storePath(userId) {
    return join(dataDir, `favorites-${userId}.json`);
  }

  function readPlatforms(userId) {
    if (!userId) return createEmptyPlatformAppIds();
    const cached = platformsCache.get(userId);
    if (cached) return cached;

    ensureDir();
    const path = storePath(userId);
    if (!existsSync(path)) {
      const empty = createEmptyPlatformAppIds();
      platformsCache.set(userId, empty);
      return empty;
    }

    try {
      const platforms = readPlatformAppIds(JSON.parse(readFileSync(path, 'utf-8')));
      platformsCache.set(userId, platforms);
      return platforms;
    } catch {
      const empty = createEmptyPlatformAppIds();
      platformsCache.set(userId, empty);
      return empty;
    }
  }

  function writePlatforms(userId, platforms) {
    ensureDir();
    writePlatformAppIdsToFile(storePath(userId), platforms);
    platformsCache.set(userId, platforms);
  }

  function list(userId) {
    return listPlatformAppIds(readPlatforms(userId), 'steam').map((id) => Number(id));
  }

  function listAll(userId) {
    return readPlatforms(userId);
  }

  function listForPlatform(userId, platform) {
    return listPlatformAppIds(readPlatforms(userId), platform);
  }

  function toggle(userId, appid, platform = 'steam') {
    if (!userId) throw new Error('请先选择用户');
    const platforms = readPlatforms(userId);
    const result = togglePlatformAppId(platforms, platform, appid);
    writePlatforms(userId, platforms);
    return buildPlatformPrefsResponse(platforms, {
      appid: normalizeGamePrefPlatform(platform) === 'steam' ? Number(result.appid) : result.appid,
      platform: result.platform,
      favorited: result.active,
    });
  }

  return { list, listAll, listForPlatform, toggle };
}
