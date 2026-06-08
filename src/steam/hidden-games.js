import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const STEAM_ID64_BASE = 76561197960265728n;

export function parseVdf(text) {
  const empty = { values: {}, children: {} };
  if (text == null || typeof text !== 'string' || !text.trim()) return empty;

  let i = 0;
  const len = text.length;

  function charAt(idx) {
    return idx >= 0 && idx < len ? text[idx] : '';
  }

  function skipWhitespace() {
    while (i < len && /\s/.test(charAt(i))) i += 1;
  }

  function readQuotedString() {
    if (charAt(i) !== '"') return null;
    i += 1;
    let value = '';
    while (i < len) {
      if (charAt(i) === '\\' && i + 1 < len) {
        value += charAt(i + 1);
        i += 2;
        continue;
      }
      if (charAt(i) === '"') {
        i += 1;
        return value;
      }
      value += charAt(i);
      i += 1;
    }
    return value;
  }

  function parseBlock() {
    const block = { values: {}, children: {} };
    while (i < len) {
      skipWhitespace();
      if (charAt(i) === '}') {
        i += 1;
        break;
      }
      const key = readQuotedString();
      if (key === null) break;
      skipWhitespace();
      if (charAt(i) === '{') {
        i += 1;
        block.children[key] = parseBlock();
      } else {
        const value = readQuotedString();
        if (value !== null) block.values[key] = value;
      }
    }
    return block;
  }

  try {
    const root = { values: {}, children: {} };
    while (i < len) {
      skipWhitespace();
      if (i >= len) break;
      const key = readQuotedString();
      if (key === null) break;
      skipWhitespace();
      if (charAt(i) === '{') {
        i += 1;
        root.children[key] = parseBlock();
      }
    }
    return root;
  } catch {
    return empty;
  }
}

export function findChild(node, name) {
  if (!node?.children) return null;
  const target = String(name).toLowerCase();
  for (const [key, value] of Object.entries(node.children)) {
    if (key.toLowerCase() === target) return value;
  }
  return null;
}

export function walkPath(node, keys) {
  let current = node;
  for (const key of keys) {
    current = findChild(current, key);
    if (!current) return null;
  }
  return current;
}

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

function isHiddenFlag(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === '1' || normalized === 'true';
}

function normalizeAppId(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return 0;
  if (num > 0xffffffff) return num & 0xffffffff;
  return num;
}

function normalizeApiKey(apiKey) {
  return String(apiKey || '').trim().replace(/\s+/g, '');
}

export function isValidApiKey(apiKey) {
  return /^[A-Fa-f0-9]{32}$/i.test(normalizeApiKey(apiKey));
}

export function steamAccountId(steamId) {
  try {
    return String(BigInt(steamId) - STEAM_ID64_BASE);
  } catch {
    return '';
  }
}

function readWindowsSteamPath() {
  if (process.platform !== 'win32') return '';
  try {
    const out = execSync('reg query "HKCU\\Software\\Valve\\Steam" /v SteamPath', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const match = out.match(/SteamPath\s+REG_SZ\s+(.+)/i);
    return match ? match[1].trim().replace(/\\/g, '\\') : '';
  } catch {
    return '';
  }
}

function defaultSteamInstallPaths() {
  const paths = [];
  const registryPath = readWindowsSteamPath();
  if (registryPath) paths.push(registryPath);
  if (process.platform === 'win32') {
    paths.push('C:\\Program Files (x86)\\Steam', 'C:\\Program Files\\Steam');
  } else if (process.platform === 'darwin') {
    paths.push(`${process.env.HOME || ''}/Library/Application Support/Steam`);
  } else {
    paths.push(`${process.env.HOME || ''}/.local/share/Steam`, `${process.env.HOME || ''}/.steam/steam`);
  }
  return [...new Set(paths.filter(Boolean))];
}

function extractHiddenFromAppsNode(appsNode, hidden) {
  if (!appsNode?.children) return;
  for (const [appKey, appNode] of Object.entries(appsNode.children)) {
    const appid = normalizeAppId(appKey);
    if (!appid) continue;
    const hiddenValue = appNode.values?.hidden ?? appNode.values?.Hidden;
    if (isHiddenFlag(hiddenValue)) hidden.add(appid);
  }
}

function extractHiddenFromSharedConfig(root) {
  const hidden = new Set();
  const paths = [
    ['UserRoamingConfigStore', 'Software', 'Valve', 'Steam', 'Apps'],
    ['UserRoamingConfigStore', 'Software', 'Valve', 'steam', 'apps'],
  ];
  for (const path of paths) {
    extractHiddenFromAppsNode(walkPath(root, path), hidden);
  }
  return hidden;
}

function extractHiddenFromLocalConfigApps(root) {
  const hidden = new Set();
  const paths = [
    ['UserLocalConfigStore', 'Software', 'Valve', 'Steam', 'Apps'],
    ['UserLocalConfigStore', 'Software', 'Valve', 'steam', 'apps'],
    ['Software', 'Valve', 'Steam', 'Apps'],
    ['Software', 'Valve', 'steam', 'apps'],
  ];
  for (const path of paths) {
    extractHiddenFromAppsNode(walkPath(root, path), hidden);
  }
  return hidden;
}

function applyCollectionDelta(hidden, removed, collection) {
  if (!collection || typeof collection !== 'object') return;
  for (const appid of collection.added || []) {
    const normalized = normalizeAppId(appid);
    if (normalized) hidden.add(normalized);
  }
  for (const appid of collection.removed || []) {
    const normalized = normalizeAppId(appid);
    if (normalized) removed.add(normalized);
  }
}

function extractHiddenFromUserCollections(root) {
  const hidden = new Set();
  const removed = new Set();

  for (const raw of walkAllValues(root, 'user-collections')) {
    if (!raw) continue;
    try {
      const data = JSON.parse(raw);
      if (data?.hidden) {
        applyCollectionDelta(hidden, removed, data.hidden);
        continue;
      }
      if (data?.id === 'hidden') {
        applyCollectionDelta(hidden, removed, data);
        continue;
      }
      for (const collection of Object.values(data)) {
        if (collection?.id === 'hidden') applyCollectionDelta(hidden, removed, collection);
      }
    } catch {
      /* ignore invalid json */
    }
  }

  for (const appid of removed) hidden.delete(appid);
  return hidden;
}

function extractHiddenFromCloudStorage(accountDir) {
  const hidden = new Set();
  const removed = new Set();
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
        if (key !== 'user-collections.hidden' || !item?.value || item.is_deleted) continue;
        const data = JSON.parse(item.value);
        applyCollectionDelta(hidden, removed, data);
      }
    } catch {
      /* ignore invalid cloud storage */
    }
  }

  for (const appid of removed) hidden.delete(appid);
  return hidden;
}

export function resolveSteamInstallPaths(customPath = '') {
  const paths = [];
  const manual = String(customPath || '').trim();
  if (manual) paths.push(manual);
  paths.push(...defaultSteamInstallPaths());
  return [...new Set(paths.filter(Boolean))];
}

export function detectSteamInstallPaths(customPath = '') {
  return resolveSteamInstallPaths(customPath).filter((path) => existsSync(path));
}

function readHiddenFromLocalSteam(steamId, options = {}) {
  const { steamPaths = [], debugLog = () => {} } = options;
  const accountId = steamAccountId(steamId);
  if (!accountId) return null;

  const hidden = new Set();
  let foundAny = false;
  const roots = steamPaths.length ? steamPaths : defaultSteamInstallPaths();

  for (const root of roots) {
    if (!existsSync(root)) continue;

    const sharedPath = join(root, 'userdata', accountId, '7', 'remote', 'sharedconfig.vdf');
    const localPath = join(root, 'userdata', accountId, 'config', 'localconfig.vdf');

    if (existsSync(sharedPath)) {
      foundAny = true;
      try {
        const text = readFileSync(sharedPath, 'utf-8');
        const parsed = parseVdf(text);
        for (const appid of extractHiddenFromSharedConfig(parsed)) hidden.add(appid);
      } catch (err) {
        debugLog('本地 sharedconfig 解析失败', { message: err.message });
      }
    }

    if (existsSync(localPath)) {
      foundAny = true;
      try {
        const text = readFileSync(localPath, 'utf-8');
        const parsed = parseVdf(text);
        for (const appid of extractHiddenFromUserCollections(parsed)) hidden.add(appid);
        for (const appid of extractHiddenFromLocalConfigApps(parsed)) hidden.add(appid);
      } catch (err) {
        debugLog('本地 localconfig 解析失败', { message: err.message });
      }
    }

    const accountDir = join(root, 'userdata', accountId);
    for (const appid of extractHiddenFromCloudStorage(accountDir)) {
      hidden.add(appid);
      foundAny = true;
    }
  }

  if (!foundAny) return null;
  return hidden;
}

export function importHiddenFromLocalSteam(steamId, steamPath = '', debugLog = () => {}) {
  const paths = resolveSteamInstallPaths(steamPath);
  const hidden = readHiddenFromLocalSteam(steamId, { steamPaths: paths, debugLog });
  if (!hidden) {
    return { found: false, appids: [], triedPaths: paths };
  }
  return {
    found: true,
    appids: [...hidden].sort((a, b) => a - b),
    triedPaths: paths,
    usedPath: paths.find((path) => existsSync(join(path, 'userdata', steamAccountId(steamId)))) || paths[0] || '',
  };
}
