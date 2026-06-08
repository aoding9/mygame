import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import {
  buildSearchAliases,
  createGameMetaStore,
  hasChineseText,
  normalizeMatchKey,
} from '../services/game-meta.js';

function parseJsonArray(raw, fallback = []) {
  try {
    const value = JSON.parse(raw || '[]');
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function epicNameNeedsCn(game) {
  if (!game?.name_cn) return true;
  if (game.name_cn === game.name) return !hasChineseText(game.name_cn);
  const value = String(game.name_cn || '').trim();
  if (!value) return true;
  if (/^[0-9a-f]{32}$/i.test(value)) return true;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function createMetaStore(db, dataDir, debugLog = () => {}) {
  const metaDir = join(dataDir, 'meta');
  const fileEnricher = createGameMetaStore(metaDir, Number.MAX_SAFE_INTEGER);

  const selectMeta = db.prepare(`
    SELECT platform, appid, name_en, name_cn, genres_json, tags_json, aliases_json, cover_url, permanent, cached_at
    FROM game_meta
    WHERE platform = ? AND appid = ?
  `);

  const upsertMeta = db.prepare(`
    INSERT INTO game_meta (platform, appid, name_en, name_cn, genres_json, tags_json, aliases_json, cover_url, permanent, cached_at)
    VALUES (@platform, @appid, @name_en, @name_cn, @genres_json, @tags_json, @aliases_json, @cover_url, @permanent, @cached_at)
    ON CONFLICT(platform, appid) DO UPDATE SET
      name_en = excluded.name_en,
      name_cn = excluded.name_cn,
      genres_json = excluded.genres_json,
      tags_json = excluded.tags_json,
      aliases_json = excluded.aliases_json,
      cover_url = CASE WHEN excluded.cover_url != '' THEN excluded.cover_url ELSE game_meta.cover_url END,
      permanent = excluded.permanent,
      cached_at = excluded.cached_at
  `);

  function rowToMeta(row) {
    if (!row) return null;
    return {
      name_en: row.name_en || '',
      name_cn: row.name_cn || '',
      genres: parseJsonArray(row.genres_json),
      tags: parseJsonArray(row.tags_json),
      aliases: parseJsonArray(row.aliases_json),
      cover_url: row.cover_url || '',
      permanent: !!row.permanent,
      cached_at: row.cached_at,
    };
  }

  function isUsableMeta(data) {
    if (!data) return false;
    if (data.name_cn) return true;
    if (Array.isArray(data.genres) && data.genres.length) return true;
    if (Array.isArray(data.tags) && data.tags.length) return true;
    return false;
  }

  function finalizeMeta(meta, nameEn, appid) {
    const nameCn = meta.name_cn || '';
    const permanent = hasChineseText(nameCn) && nameCn.trim() !== String(nameEn || '').trim();
    return {
      ...meta,
      name_en: String(nameEn || meta.name_en || '').trim(),
      aliases: meta.aliases?.length ? meta.aliases : buildSearchAliases(nameEn, nameCn, appid),
      permanent,
    };
  }

  function readMeta(appid, platform = 'steam') {
    const row = selectMeta.get(platform, String(appid));
    const data = rowToMeta(row);
    if (!isUsableMeta(data)) return null;
    if (!Array.isArray(data.aliases) || !data.aliases.length) {
      data.aliases = buildSearchAliases(data.name_en, data.name_cn, appid);
    }
    return data;
  }

  function writeMeta(appid, payload, nameEn = '', platform = 'steam') {
    const finalPayload = payload.aliases
      ? { ...payload }
      : finalizeMeta(payload, nameEn || payload.name_en, appid);
    if (!isUsableMeta(finalPayload)) return;

    upsertMeta.run({
      platform,
      appid: String(appid),
      name_en: finalPayload.name_en || '',
      name_cn: finalPayload.name_cn || '',
      genres_json: JSON.stringify(finalPayload.genres || []),
      tags_json: JSON.stringify(finalPayload.tags || []),
      aliases_json: JSON.stringify(finalPayload.aliases || []),
      cover_url: finalPayload.cover_url || '',
      permanent: finalPayload.permanent ? 1 : 0,
      cached_at: Date.now(),
    });
  }

  function applyCachedMetaWithStats(games, platform = 'steam') {
    let metaPending = 0;
    const mapped = games.map((game) => {
      const cached = readMeta(game.appid, platform);
      if (!cached) metaPending += 1;
      return {
        ...game,
        name_cn: cached?.name_cn || game.name_cn || '',
        aliases: cached?.aliases || game.aliases || [],
        genres: cached?.genres || game.genres || [],
        tags: cached?.tags || game.tags || [],
      };
    });
    return { games: mapped, metaPending };
  }

  function applyCachedMeta(games, platform = 'steam') {
    return applyCachedMetaWithStats(games, platform).games;
  }

  function countMissingMeta(games, platform = 'steam') {
    return games.filter((game) => !readMeta(game.appid, platform)).length;
  }

  function buildEnglishNameIndex() {
    const map = new Map();
    const rows = db.prepare(`
      SELECT name_en, name_cn FROM game_meta
      WHERE name_cn != ''
    `).all();
    for (const row of rows) {
      const key = normalizeMatchKey(row.name_en);
      if (key.length >= 3 && hasChineseText(row.name_cn) && !map.has(key)) {
        map.set(key, row.name_cn);
      }
    }
    return map;
  }

  function applyEpicNameMatchFromSteam(epicGames, steamGames = []) {
    const index = buildEnglishNameIndex();
    for (const game of steamGames) {
      const key = normalizeMatchKey(game.name);
      if (key.length >= 3 && hasChineseText(game.name_cn) && !index.has(key)) {
        index.set(key, game.name_cn);
      }
    }

    return epicGames.map((game) => {
      if (!epicNameNeedsCn(game)) return game;
      const key = normalizeMatchKey(game.name);
      const nameCn = index.get(key);
      if (!nameCn) return game;
      return {
        ...game,
        name_cn: nameCn,
        aliases: game.aliases?.length ? game.aliases : buildSearchAliases(game.name, nameCn, game.appid),
      };
    });
  }

  async function enrichGamesMissing(games, steamFetch, onProgress, options = {}) {
    const skipAppId = options.skipAppId || (() => false);
    await fileEnricher.enrichGamesMissing(games, steamFetch, (progress) => {
      const updates = [];
      for (const update of progress.updates || []) {
        if (skipAppId(update.appid)) continue;
        writeMeta(update.appid, update, update.name_en || update.name_en);
        updates.push(update);
      }
      onProgress?.({
        ...progress,
        updates: progress.updates ? updates : progress.updates,
      });
    });
  }

  async function enrichGames(games, steamFetch) {
    const enriched = applyCachedMeta(games);
    await enrichGamesMissing(enriched, steamFetch);
    return applyCachedMeta(enriched);
  }

  function importLegacyMeta(metaDir) {
    const count = db.prepare('SELECT COUNT(*) AS c FROM game_meta').get().c;
    if (count > 0 || !existsSync(metaDir)) return { imported: 0 };

    let imported = 0;
    for (const file of readdirSync(metaDir)) {
      if (!file.endsWith('.json')) continue;
      const appid = file.replace(/\.json$/, '');
      try {
        const data = JSON.parse(readFileSync(join(metaDir, file), 'utf-8'));
        writeMeta(appid, data, data.name_en || '', 'steam');
        imported += 1;
      } catch {
        /* ignore */
      }
    }
    if (imported) debugLog('已从 JSON 迁移元数据到 SQLite', { imported });
    return { imported };
  }

  return {
    readMeta,
    writeMeta,
    applyCachedMeta,
    applyCachedMetaWithStats,
    applyEpicNameMatchFromSteam,
    buildEnglishNameIndex,
    countMissingMeta,
    enrichGamesMissing,
    enrichGames,
    importLegacyMeta,
  };
}
