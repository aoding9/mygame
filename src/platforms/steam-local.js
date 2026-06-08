import { existsSync, readFileSync, readdirSync } from 'fs';
import { spawn } from 'child_process';
import { join } from 'path';
import {
  detectSteamInstallPaths,
  findChild,
  parseVdf,
  steamAccountId,
  walkPath,
} from '../steam/hidden-games.js';
import { getLocalPathOptions } from '../services/local-path-options.js';

function normalizeAppId(raw) {
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return 0;
  if (num > 0xffffffff) return num & 0xffffffff;
  return num;
}

function collectLibraryPaths(steamRoot) {
  const paths = [join(steamRoot, 'steamapps')];
  const vdfPath = join(steamRoot, 'steamapps', 'libraryfolders.vdf');
  if (!existsSync(vdfPath)) return paths;

  try {
    const parsed = parseVdf(readFileSync(vdfPath, 'utf-8'));
    const foldersNode = findChild(parsed, 'libraryfolders') || findChild(parsed, 'LibraryFolders');
    if (!foldersNode?.children) return paths;

    for (const folder of Object.values(foldersNode.children)) {
      const libraryPath = folder.values?.path || folder.values?.Path;
      if (libraryPath) paths.push(join(libraryPath.replace(/\\\\/g, '\\'), 'steamapps'));
    }
  } catch {
    /* ignore invalid libraryfolders */
  }

  return [...new Set(paths.filter((p) => existsSync(p)))];
}

function readAppManifestName(manifestPath) {
  try {
    const parsed = parseVdf(readFileSync(manifestPath, 'utf-8'));
    const appState = findChild(parsed, 'AppState') || parsed;
    const appid = normalizeAppId(appState.values?.appid || appState.values?.appID);
    const name = String(appState.values?.name || '').trim();
    if (!appid || !name) return null;
    return { appid, name };
  } catch {
    return null;
  }
}

function collectInstalledAppIds(steamRoot) {
  const ids = new Set();
  for (const steamapps of collectLibraryPaths(steamRoot)) {
    let files = [];
    try {
      files = readdirSync(steamapps);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!/^appmanifest_\d+\.acf$/i.test(file)) continue;
      const appid = normalizeAppId(file.match(/(\d+)/)?.[1]);
      if (appid) ids.add(appid);
    }
  }
  return ids;
}

export function readSteamInstalledAppIds() {
  const { steamPath } = getLocalPathOptions();
  const roots = detectSteamInstallPaths(steamPath);
  const ids = new Set();
  for (const root of roots) {
    for (const appid of collectInstalledAppIds(root)) ids.add(appid);
  }
  return ids;
}

export function steamStoreUrl(appid) {
  const id = normalizeAppId(appid);
  if (!id) return '';
  return `https://store.steampowered.com/app/${id}`;
}

function hasSteamClient(steamPath = '') {
  const roots = detectSteamInstallPaths(steamPath);
  return roots.some((root) => existsSync(join(root, 'steam.exe')));
}

function openSteamProtocolUrl(url) {
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], {
      detached: true,
      stdio: 'ignore',
      shell: true,
    }).unref();
    return;
  }

  spawn('steam', [url], { detached: true, stdio: 'ignore' }).unref();
}

export function openSteamInstallPage(appid, steamPath = '') {
  const id = normalizeAppId(appid);
  if (!id) throw new Error('无效的游戏 ID');

  const storeUrl = steamStoreUrl(id);
  if (!hasSteamClient(steamPath)) {
    const err = new Error('未检测到 Steam 客户端，请确认已安装 Steam');
    err.storeUrl = storeUrl;
    throw err;
  }

  openSteamProtocolUrl(`steam://install/${id}`);
  return { method: 'steam-install', appid: id, storeUrl };
}

export function launchSteamGame(appid, steamPath = '') {
  const id = normalizeAppId(appid);
  if (!id) throw new Error('无效的游戏 ID');

  if (!hasSteamClient(steamPath)) {
    throw new Error('未检测到 Steam 客户端，请确认已安装 Steam');
  }

  const roots = detectSteamInstallPaths(steamPath);
  for (const root of roots) {
    const exe = join(root, 'steam.exe');
    if (existsSync(exe)) {
      spawn(exe, ['-applaunch', String(id)], { detached: true, stdio: 'ignore' }).unref();
      return { method: 'steam.exe', appid: id };
    }
  }

  openSteamProtocolUrl(`steam://run/${id}`);
  return { method: 'steam-protocol', appid: id };
}

function collectManifestNames(steamRoot) {
  const names = new Map();
  for (const steamapps of collectLibraryPaths(steamRoot)) {
    let files = [];
    try {
      files = readdirSync(steamapps);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!/^appmanifest_\d+\.acf$/i.test(file)) continue;
      const info = readAppManifestName(join(steamapps, file));
      if (info) names.set(info.appid, info.name);
    }
  }
  return names;
}

function extractLocalLibraryApps(root) {
  const apps = new Map();
  const paths = [
    ['UserLocalConfigStore', 'Software', 'Valve', 'Steam', 'apps'],
    ['UserLocalConfigStore', 'Software', 'Valve', 'steam', 'apps'],
    ['Software', 'Valve', 'Steam', 'apps'],
    ['Software', 'Valve', 'steam', 'apps'],
  ];

  for (const pathKeys of paths) {
    const node = walkPath(root, pathKeys);
    if (!node?.children) continue;
    for (const [appKey, appNode] of Object.entries(node.children)) {
      const appid = normalizeAppId(appKey);
      if (!appid) continue;
      const playtimeRaw = Number(appNode.values?.Playtime ?? appNode.values?.playtime ?? 0);
      const playtimeForever = Number.isFinite(playtimeRaw) ? Math.max(0, Math.round(playtimeRaw)) : 0;
      const lastPlayed = Number(appNode.values?.LastPlayed ?? appNode.values?.lastplayed ?? 0) || 0;
      apps.set(appid, {
        appid,
        playtime_forever: playtimeForever,
        playtime_2weeks: 0,
        rtime_last_played: lastPlayed,
        img_icon_url: '',
      });
    }
  }

  return apps;
}

export function readSteamLocalLibraryGames(steamId, logger) {
  const log = (label, detail) => {
    if (logger) logger(label, detail);
  };

  const accountId = steamAccountId(steamId);
  if (!accountId) return [];

  const { steamPath } = getLocalPathOptions();
  const roots = detectSteamInstallPaths(steamPath);
  const byAppId = new Map();

  for (const root of roots) {
    const localPath = join(root, 'userdata', accountId, 'config', 'localconfig.vdf');
    if (existsSync(localPath)) {
      try {
        const parsed = parseVdf(readFileSync(localPath, 'utf-8'));
        for (const app of extractLocalLibraryApps(parsed).values()) {
          byAppId.set(app.appid, app);
        }
      } catch (err) {
        log('本地 localconfig 解析失败', { root, error: err.message });
      }
    }

    const manifestNames = collectManifestNames(root);
    for (const [appid, name] of manifestNames) {
      const prev = byAppId.get(appid) || {
        appid,
        playtime_forever: 0,
        playtime_2weeks: 0,
        rtime_last_played: 0,
        img_icon_url: '',
      };
      prev.name = name;
      byAppId.set(appid, prev);
    }
  }

  const installedIds = readSteamInstalledAppIds();
  const games = [...byAppId.values()]
    .map((game) => ({
      ...game,
      name: game.name || `App ${game.appid}`,
      source: 'local-steam',
      installed: installedIds.has(game.appid),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

  if (games.length) {
    log('本地 Steam 客户端 命中', { count: games.length, steamId });
  }

  return games;
}

export function mergeSteamLibraryGames(localGames, remoteGames) {
  const byId = new Map();

  for (const game of localGames || []) {
    if (!game?.appid) continue;
    byId.set(game.appid, { ...game });
  }

  for (const game of remoteGames || []) {
    if (!game?.appid) continue;
    const prev = byId.get(game.appid);
    byId.set(game.appid, prev
      ? {
        ...prev,
        ...game,
        name: game.name && !/^App \d+$/i.test(game.name) ? game.name : prev.name,
        playtime_forever: Math.max(Number(game.playtime_forever || 0), Number(prev.playtime_forever || 0)),
        rtime_last_played: Math.max(Number(game.rtime_last_played || 0), Number(prev.rtime_last_played || 0)),
        img_icon_url: game.img_icon_url || prev.img_icon_url || '',
        installed: !!(prev.installed || game.installed),
      }
      : { ...game, installed: !!game.installed });
  }

  return [...byId.values()];
}
