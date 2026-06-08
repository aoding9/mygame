import { existsSync, readdirSync, readFileSync, rmSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';

function dirSize(root) {
  let bytes = 0;
  for (const name of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, name.name);
    if (name.isDirectory()) {
      bytes += dirSize(path);
      continue;
    }
    try {
      bytes += statSync(path).size;
    } catch {
      /* ignore */
    }
  }
  return bytes;
}

export function cleanLegacyBrowserProfiles(dataDir, debugLog = () => {}) {
  if (!existsSync(dataDir)) return { removed: 0, bytes: 0 };

  const removed = { profiles: 0, bytes: 0 };
  for (const name of readdirSync(dataDir)) {
    if (!name.startsWith('browser-profile-') && name !== 'steam-browser-profile') continue;
    const path = join(dataDir, name);
    try {
      removed.bytes += dirSize(path);
      rmSync(path, { recursive: true, force: true });
      removed.profiles += 1;
    } catch {
      /* ignore */
    }
  }

  if (removed.profiles) {
    debugLog('已清理 Playwright 浏览器配置', removed);
  }

  return removed;
}

function readCachedAt(filePath) {
  try {
    const raw = readFileSync(filePath, 'utf-8').trim();
    if (!raw) return 0;
    const data = JSON.parse(raw);
    return Number(data.cachedAt) || 0;
  } catch {
    return 0;
  }
}

function fileExpired(cachedAt, ttlMs, filePath) {
  if (cachedAt > 0) {
    return Date.now() - cachedAt > ttlMs;
  }
  try {
    return Date.now() - statSync(filePath).mtimeMs > ttlMs;
  } catch {
    return true;
  }
}

function removeFile(path, removed, bucket) {
  try {
    const size = statSync(path).size;
    unlinkSync(path);
    removed[bucket] += 1;
    removed.bytes += size;
    return true;
  } catch {
    return false;
  }
}

export function cleanExpiredCache({
  dataDir,
  cacheDir,
  metaDir,
  ttlMs,
  debugLog = () => {},
}) {
  const legacy = cleanLegacyBrowserProfiles(dataDir, debugLog);
  const removed = { games: 0, meta: 0, profiles: legacy.profiles, bytes: legacy.bytes };

  if (existsSync(cacheDir)) {
    for (const name of readdirSync(cacheDir)) {
      if (!name.endsWith('.json')) continue;
      const path = join(cacheDir, name);
      if (fileExpired(readCachedAt(path), ttlMs, path)) {
        removeFile(path, removed, 'games');
      }
    }
  }

  if (existsSync(metaDir)) {
    for (const name of readdirSync(metaDir)) {
      if (!name.endsWith('.json')) continue;
      const path = join(metaDir, name);
      if (fileExpired(readCachedAt(path), ttlMs, path)) {
        removeFile(path, removed, 'meta');
      }
    }
  }

  const total = removed.games + removed.meta + removed.profiles;
  if (total) {
    debugLog('已清理本地缓存', {
      ...removed,
      ttlDays: Math.round(ttlMs / (24 * 60 * 60 * 1000)),
    });
  }

  return removed;
}

export function deleteCacheFile(filePath) {
  if (!existsSync(filePath)) return false;
  unlinkSync(filePath);
  return true;
}
