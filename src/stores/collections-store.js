import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { listSteamCollectionsForFilter } from '../steam/collections.js';
import { createKeyedTinyCache } from '../services/tiny-cache.js';

const EXCLUDED_IDS = new Set(['hidden']);

function normalizeCollections(collections) {
  const list = [];
  for (const item of collections || []) {
    const id = String(item?.id || '').trim();
    if (!id || EXCLUDED_IDS.has(id)) continue;
    const appids = [...new Set(
      (item.appids || [])
        .map((raw) => Number(raw))
        .filter((id) => Number.isFinite(id) && id > 0),
    )].sort((a, b) => a - b);
    list.push({
      id,
      name: String(item.name || id).trim() || id,
      count: appids.length,
      appids,
    });
  }
  list.sort((a, b) => {
    if (a.id === 'favorite') return -1;
    if (b.id === 'favorite') return 1;
    return a.name.localeCompare(b.name, 'zh-CN');
  });
  return list;
}

export function createCollectionsStore(dataDir) {
  const dataCache = createKeyedTinyCache();

  function ensureDir() {
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  }

  function storePath(userId) {
    return join(dataDir, `collections-${userId}.json`);
  }

  function readData(userId) {
    if (!userId) {
      return { collections: [], steamPath: '', updatedAt: 0 };
    }
    const cached = dataCache.get(userId);
    if (cached) return cached;

    ensureDir();
    const path = storePath(userId);
    if (!existsSync(path)) {
      const empty = { collections: [], steamPath: '', updatedAt: 0 };
      dataCache.set(userId, empty);
      return empty;
    }

    try {
      const raw = JSON.parse(readFileSync(path, 'utf-8'));
      const data = {
        collections: normalizeCollections(raw.collections),
        steamPath: String(raw.steamPath || '').trim(),
        updatedAt: Number(raw.updatedAt) || 0,
      };
      dataCache.set(userId, data);
      return data;
    } catch {
      const empty = { collections: [], steamPath: '', updatedAt: 0 };
      dataCache.set(userId, empty);
      return empty;
    }
  }

  function writeData(userId, data) {
    ensureDir();
    const payload = {
      collections: normalizeCollections(data.collections),
      steamPath: String(data.steamPath || '').trim(),
      updatedAt: Date.now(),
    };
    writeFileSync(storePath(userId), JSON.stringify(payload, null, 2), 'utf-8');
    dataCache.set(userId, payload);
    return payload;
  }

  function getSettings(userId) {
    const data = readData(userId);
    return {
      collections: data.collections,
      filterCollections: listSteamCollectionsForFilter(data.collections),
      steamPath: data.steamPath,
      updatedAt: data.updatedAt,
    };
  }

  function getCollections(userId) {
    return readData(userId).collections;
  }

  function importCollections(userId, collections, steamPath = '') {
    const data = readData(userId);
    data.collections = normalizeCollections(collections);
    if (steamPath) data.steamPath = String(steamPath).trim();
    return writeData(userId, data);
  }

  return {
    getSettings,
    getCollections,
    importCollections,
  };
}
