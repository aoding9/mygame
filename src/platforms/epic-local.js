import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

function resolveEpicManifestDirs() {
  const dirs = ['C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests'];

  if (process.platform === 'win32') {
    try {
      const output = execSync(
        'reg query "HKCU\\Software\\Epic Games\\EOS" /v ModSdkMetadataDir',
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      );
      const match = output.match(/ModSdkMetadataDir\s+REG_SZ\s+(.+)/i);
      const registryDir = match?.[1]?.trim();
      if (registryDir) {
        const manifests = join(registryDir.replace(/\\\\/g, '\\'), 'Manifests');
        if (!dirs.includes(manifests)) dirs.unshift(manifests);
      }
    } catch {
      /* registry optional */
    }
  }

  return dirs.filter((dir) => existsSync(dir));
}

function normalizeManifestPath(value) {
  return String(value || '').replace(/\\\\/g, '\\').trim();
}

function parseEpicItemFile(filePath) {
  try {
    const json = JSON.parse(readFileSync(filePath, 'utf-8'));
    const catalogItemId = String(json.CatalogItemId || json.catalogItemId || '').trim();
    const namespace = String(json.CatalogNamespace || json.catalogNamespace || json.NamespaceId || '').trim();
    const appName = String(json.AppName || json.MainGameAppName || json.appName || '').trim();
    const title = String(json.DisplayName || json.displayName || json.FullAppName || appName || '').trim();
    if (!catalogItemId && !appName) return null;
    return {
      catalogItemId: catalogItemId || appName,
      id: catalogItemId || appName,
      appName,
      namespace,
      title,
      metadata: { title, displayName: title },
      catalogItem: title ? { title } : undefined,
      itemType: 'MAINGAME',
      source: 'local-launcher',
    };
  } catch {
    return null;
  }
}

function scanManifestDir(dir, byKey) {
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.item')) continue;
    const record = parseEpicItemFile(join(dir, entry.name));
    if (!record) continue;
    const key = `${record.namespace}:${record.catalogItemId}`;
    if (!byKey.has(key)) byKey.set(key, record);
  }
}

function scanInstallEgstore(installLocation, byKey) {
  const base = normalizeManifestPath(installLocation);
  if (!base || !existsSync(base)) return;

  const egstore = join(base, '.egstore');
  if (!existsSync(egstore)) return;

  let entries = [];
  try {
    entries = readdirSync(egstore, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.item')) continue;
    const record = parseEpicItemFile(join(egstore, entry.name));
    if (!record) continue;
    const key = `${record.namespace}:${record.catalogItemId}`;
    if (!byKey.has(key)) byKey.set(key, record);
  }
}

export function readEpicLocalLibraryRecords(logger) {
  const log = (label, detail) => {
    if (logger) logger(label, detail);
  };

  if (process.platform !== 'win32') return [];

  const byKey = new Map();
  const installLocations = new Set();

  for (const dir of resolveEpicManifestDirs()) {
    scanManifestDir(dir, byKey);
    let entries = [];
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.item')) continue;
      try {
        const json = JSON.parse(readFileSync(join(dir, entry.name), 'utf-8'));
        const installLocation = normalizeManifestPath(json.InstallLocation);
        if (installLocation) installLocations.add(installLocation);
      } catch {
        /* ignore */
      }
    }
  }

  for (const installLocation of installLocations) {
    scanInstallEgstore(installLocation, byKey);
  }

  const records = [...byKey.values()].sort((a, b) => {
    const nameA = a.title || a.appName || a.catalogItemId;
    const nameB = b.title || b.appName || b.catalogItemId;
    return String(nameA).localeCompare(String(nameB), 'zh-CN');
  });

  if (records.length) {
    log('本地 Epic Launcher 命中', { count: records.length });
  }

  return records;
}

export function mergeEpicLibraryRecords(localRecords, remoteRecords) {
  const byKey = new Map();
  const keyOf = (record) => {
    const ns = String(record.namespace || record.catalogNamespace || record.metadata?.namespace || '').trim();
    const id = String(record.catalogItemId || record.id || record.appName || '').trim();
    return `${ns}:${id}`;
  };

  for (const record of localRecords || []) {
    const key = keyOf(record);
    if (!key || key === ':') continue;
    byKey.set(key, { ...record });
  }

  for (const record of remoteRecords || []) {
    const key = keyOf(record);
    if (!key || key === ':') continue;
    const prev = byKey.get(key);
    byKey.set(key, prev
      ? {
        ...prev,
        ...record,
        title: record.title || record.metadata?.title || prev.title,
        metadata: { ...(prev.metadata || {}), ...(record.metadata || {}) },
        catalogItem: record.catalogItem || prev.catalogItem,
      }
      : record);
  }

  return [...byKey.values()];
}
