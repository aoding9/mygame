import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createTinyCache } from '../services/tiny-cache.js';

export const APP_SETTINGS_DEFAULTS = {
  steamPath: '',
  httpsProxy: '',
  logLevel: 'info',
  logToFile: true,
  coverOrphanTtlDays: 3,
  coverCleanupIntervalHours: 24,
  updatedAt: 0,
};

const LOG_LEVELS = new Set(['debug', 'info', 'warn', 'error']);

export function normalizeAppSettings(raw = {}) {
  const logLevel = String(raw.logLevel || APP_SETTINGS_DEFAULTS.logLevel).trim().toLowerCase();
  return {
    steamPath: String(raw.steamPath || '').trim(),
    httpsProxy: String(raw.httpsProxy || '').trim(),
    logLevel: LOG_LEVELS.has(logLevel) ? logLevel : APP_SETTINGS_DEFAULTS.logLevel,
    logToFile: raw.logToFile !== false,
    coverOrphanTtlDays: Math.max(1, Number(raw.coverOrphanTtlDays) || APP_SETTINGS_DEFAULTS.coverOrphanTtlDays),
    coverCleanupIntervalHours: Math.max(
      1,
      Number(raw.coverCleanupIntervalHours) || APP_SETTINGS_DEFAULTS.coverCleanupIntervalHours,
    ),
    updatedAt: Number(raw.updatedAt) || 0,
  };
}

export function createAppSettingsStore(dataDir) {
  const storePath = join(dataDir, 'app-settings.json');
  const storeCache = createTinyCache();

  function ensureDir() {
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  }

  function readStore() {
    const cached = storeCache.get();
    if (cached) return cached;

    ensureDir();
    if (!existsSync(storePath)) {
      const empty = normalizeAppSettings(APP_SETTINGS_DEFAULTS);
      storeCache.set(empty);
      return empty;
    }

    try {
      const data = normalizeAppSettings(JSON.parse(readFileSync(storePath, 'utf-8')));
      storeCache.set(data);
      return data;
    } catch {
      const empty = normalizeAppSettings(APP_SETTINGS_DEFAULTS);
      storeCache.set(empty);
      return empty;
    }
  }

  function writeStore(data) {
    ensureDir();
    const payload = {
      ...normalizeAppSettings(data),
      updatedAt: Date.now(),
    };
    writeFileSync(storePath, JSON.stringify(payload, null, 2), 'utf-8');
    storeCache.set(payload);
    return payload;
  }

  function get() {
    return { ...readStore() };
  }

  function update(partial = {}) {
    const current = readStore();
    const next = normalizeAppSettings({ ...current, ...partial });
    return writeStore(next);
  }

  return {
    get,
    update,
  };
}
