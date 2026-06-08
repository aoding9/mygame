import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createTinyCache } from '../services/tiny-cache.js';

const SKIP_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function emptyStore() {
  return { steam: {} };
}

export function createCoverLocalizeSkipStore(dataDir) {
  const storePath = join(dataDir, 'cover-localize-skip.json');
  const storeCache = createTinyCache();

  function ensureDir() {
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  }

  function readStore() {
    const cached = storeCache.get();
    if (cached) return cached;

    ensureDir();
    if (!existsSync(storePath)) {
      const empty = emptyStore();
      storeCache.set(empty);
      return empty;
    }

    try {
      const raw = JSON.parse(readFileSync(storePath, 'utf-8'));
      const store = emptyStore();
      for (const platform of Object.keys(store)) {
        const bucket = raw?.[platform];
        if (bucket && typeof bucket === 'object') {
          store[platform] = { ...bucket };
        }
      }
      storeCache.set(store);
      return store;
    } catch {
      const empty = emptyStore();
      storeCache.set(empty);
      return empty;
    }
  }

  function writeStore(store) {
    ensureDir();
    writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf-8');
    storeCache.set(store);
    return store;
  }

  function normalizePlatform(platform) {
    return 'steam';
  }

  function isSkipped(platform, appid, now = Date.now()) {
    const p = normalizePlatform(platform);
    const id = String(appid || '').trim();
    if (!id) return false;
    const markedAt = Number(readStore()[p]?.[id] || 0);
    if (!markedAt) return false;
    if (now - markedAt > SKIP_TTL_MS) {
      unmark(platform, appid);
      return false;
    }
    return true;
  }

  function mark(platform, appid, at = Date.now()) {
    const p = normalizePlatform(platform);
    const id = String(appid || '').trim();
    if (!id) return;
    const store = readStore();
    if (!store[p]) store[p] = {};
    store[p][id] = at;
    writeStore(store);
  }

  function unmark(platform, appid) {
    const p = normalizePlatform(platform);
    const id = String(appid || '').trim();
    if (!id) return;
    const store = readStore();
    if (!store[p]?.[id]) return;
    delete store[p][id];
    writeStore(store);
  }

  function countSkipped(platform, appids = []) {
    let count = 0;
    for (const appid of appids) {
      if (isSkipped(platform, appid)) count += 1;
    }
    return count;
  }

  function loadSkippedSet(platform, now = Date.now()) {
    const p = normalizePlatform(platform);
    const set = new Set();
    const bucket = readStore()[p] || {};
    for (const [id, markedAt] of Object.entries(bucket)) {
      if (now - Number(markedAt) <= SKIP_TTL_MS) set.add(String(id));
    }
    return set;
  }

  function clearPlatform(platform, now = Date.now()) {
    const p = normalizePlatform(platform);
    const store = readStore();
    const bucket = store[p] || {};
    let cleared = 0;
    for (const [id, markedAt] of Object.entries(bucket)) {
      if (now - Number(markedAt) <= SKIP_TTL_MS) cleared += 1;
      delete bucket[id];
    }
    store[p] = bucket;
    writeStore(store);
    return cleared;
  }

  function countPlatform(platform, now = Date.now()) {
    return loadSkippedSet(platform, now).size;
  }

  return {
    isSkipped,
    mark,
    unmark,
    countSkipped,
    loadSkippedSet,
    clearPlatform,
    countPlatform,
  };
}
