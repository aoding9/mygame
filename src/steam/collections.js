import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  detectSteamInstallPaths,
  parseVdf,
  steamAccountId,
} from './hidden-games.js';
import { getLocalPathOptions } from '../services/local-path-options.js';

const COLLECTION_LABELS = {
  favorite: '收藏夹',
  hidden: '已隐藏',
};

const FILTER_EXCLUDED_IDS = new Set(['hidden']);

function walkAllValues(node, keyName, results = []) {
  if (!node) return results;
  const target = String(keyName).toLowerCase();
  for (const [key, value] of Object.entries(node.values || {})) {
    if (key.toLowerCase() === target) results.push(value);
  }
  for (const child of Object.values(node.children || {})) {
    walkAllValues(child, keyName, results);
  }
  return results;
}

function normalizeAppId(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return 0;
  if (num > 0xffffffff) return num & 0xffffffff;
  return num;
}

function resolveSteamPaths(customPath = '') {
  const manual = String(customPath || '').trim();
  if (manual) return detectSteamInstallPaths(manual);
  const { steamPath } = getLocalPathOptions();
  return detectSteamInstallPaths(steamPath);
}

function normalizeCollectionName(id, name) {
  const label = String(name || '').trim();
  if (label) return label;
  return COLLECTION_LABELS[id] || id;
}

function extractCollectionRecords(data, fallbackId = '') {
  const records = [];
  if (!data || typeof data !== 'object') return records;

  if (Array.isArray(data)) {
    for (const item of data) {
      if (item && typeof item === 'object') records.push(item);
    }
    return records;
  }

  if (Array.isArray(data.added) || Array.isArray(data.removed) || data.id) {
    records.push({ ...data, id: data.id || fallbackId });
    return records;
  }

  for (const [key, value] of Object.entries(data)) {
    if (!value || typeof value !== 'object') continue;
    records.push({ ...value, id: value.id || key });
  }
  return records;
}

function upsertCollectionEntry(map, record) {
  const id = String(record?.id || '').trim();
  if (!id) return;

  const prev = map.get(id) || {
    id,
    name: normalizeCollectionName(id, record?.name),
    added: [],
    removed: [],
  };

  prev.name = normalizeCollectionName(id, record?.name || prev.name);
  if (Array.isArray(record?.added)) prev.added.push(...record.added);
  if (Array.isArray(record?.removed)) prev.removed.push(...record.removed);
  map.set(id, prev);
}

function readCollectionEntriesFromLocalConfig(localPath) {
  const map = new Map();
  if (!existsSync(localPath)) return map;

  try {
    const parsed = parseVdf(readFileSync(localPath, 'utf-8'));
    for (const raw of walkAllValues(parsed, 'user-collections')) {
      if (!raw) continue;
      try {
        const data = JSON.parse(raw);
        for (const record of extractCollectionRecords(data)) {
          upsertCollectionEntry(map, record);
        }
      } catch {
        /* ignore invalid json */
      }
    }
  } catch {
    /* ignore invalid vdf */
  }

  return map;
}

function readCollectionEntriesFromCloudStorage(accountDir) {
  const map = new Map();
  const paths = [
    join(accountDir, 'config', 'cloudstorage', 'cloud-storage-namespace-1.json'),
    join(accountDir, 'config', 'cloudstorage', 'cloud-storage-namespace-1.modified.json'),
  ];

  for (const path of paths) {
    if (!existsSync(path)) continue;
    try {
      const entries = JSON.parse(readFileSync(path, 'utf-8'));
      if (!Array.isArray(entries)) continue;
      for (const entry of entries) {
        if (!Array.isArray(entry) || entry.length < 2) continue;
        const [key, item] = entry;
        const textKey = String(key || '');
        if (!textKey.startsWith('user-collections.') || item?.is_deleted) continue;
        const collectionId = textKey.slice('user-collections.'.length);
        try {
          const data = JSON.parse(item.value);
          for (const record of extractCollectionRecords(data, collectionId)) {
            upsertCollectionEntry(map, { ...record, id: record.id || collectionId });
          }
        } catch {
          /* ignore invalid json */
        }
      }
    } catch {
      /* ignore invalid cloud storage */
    }
  }

  return map;
}

function finalizeCollections(entryMap) {
  const collections = [];
  const byAppId = new Map();

  for (const entry of entryMap.values()) {
    const appids = new Set();
    for (const raw of entry.added || []) {
      const appid = normalizeAppId(raw);
      if (appid) appids.add(appid);
    }
    for (const raw of entry.removed || []) {
      const appid = normalizeAppId(raw);
      if (appid) appids.delete(appid);
    }

    const list = [...appids].sort((a, b) => a - b);
    collections.push({
      id: entry.id,
      name: entry.name,
      count: list.length,
      appids: list,
    });

    for (const appid of list) {
      const ids = byAppId.get(appid) || [];
      ids.push(entry.id);
      byAppId.set(appid, ids);
    }
  }

  collections.sort((a, b) => {
    if (a.id === 'favorite') return -1;
    if (b.id === 'favorite') return 1;
    return a.name.localeCompare(b.name, 'zh-CN');
  });

  return { collections, byAppId };
}

function buildByAppIdFromCollections(collections) {
  const byAppId = new Map();
  for (const entry of collections || []) {
    const collectionId = String(entry?.id || '').trim();
    if (!collectionId) continue;
    for (const raw of entry.appids || []) {
      const appid = normalizeAppId(raw);
      if (!appid) continue;
      const ids = byAppId.get(appid) || [];
      if (!ids.includes(collectionId)) ids.push(collectionId);
      byAppId.set(appid, ids);
    }
  }
  return byAppId;
}

export function readSteamCollections(steamId, options = {}) {
  const { steamPath = '', debugLog = () => {} } = options;
  const accountId = steamAccountId(steamId);
  if (!accountId) {
    return { found: false, collections: [], byAppId: new Map() };
  }

  const entryMap = new Map();
  let foundAny = false;
  const roots = resolveSteamPaths(steamPath);

  for (const root of roots) {
    if (!existsSync(root)) continue;

    const accountDir = join(root, 'userdata', accountId);
    const localPath = join(accountDir, 'config', 'localconfig.vdf');

    if (existsSync(localPath)) {
      foundAny = true;
      for (const [id, entry] of readCollectionEntriesFromLocalConfig(localPath)) {
        upsertCollectionEntry(entryMap, entry);
      }
    }

    if (existsSync(accountDir)) {
      const cloudMap = readCollectionEntriesFromCloudStorage(accountDir);
      if (cloudMap.size) foundAny = true;
      for (const [id, entry] of cloudMap) {
        upsertCollectionEntry(entryMap, entry);
      }
    }
  }

  if (!foundAny) {
    debugLog('Steam 收藏夹未找到本地配置', { steamId, accountId });
    return { found: false, collections: [], byAppId: new Map() };
  }

  const { collections, byAppId } = finalizeCollections(entryMap);
  return { found: true, collections, byAppId };
}

export function listSteamCollectionsForFilter(collections) {
  return (collections || [])
    .filter((item) => item?.id && !FILTER_EXCLUDED_IDS.has(item.id) && (item.count || 0) > 0)
    .map((item) => ({
      id: item.id,
      name: item.name,
      count: item.count,
    }));
}

export function attachSteamCollectionsToGames(games, steamId, options = {}) {
  const { steamPath = '', debugLog = () => {}, storedCollections = null } = options;
  const live = readSteamCollections(steamId, { steamPath, debugLog });

  let collections;
  let byAppId;
  let found;

  if (live.found) {
    found = true;
    collections = live.collections;
    byAppId = live.byAppId;
  } else if (Array.isArray(storedCollections) && storedCollections.length) {
    found = true;
    collections = storedCollections;
    byAppId = buildByAppIdFromCollections(storedCollections);
  } else {
    for (const game of games || []) {
      game.steam_collection_ids = [];
    }
    return {
      found: false,
      collections: [],
    };
  }

  for (const game of games || []) {
    const appid = normalizeAppId(game?.appid);
    game.steam_collection_ids = appid ? [...(byAppId.get(appid) || [])] : [];
  }
  return {
    found,
    collections: listSteamCollectionsForFilter(collections),
  };
}
