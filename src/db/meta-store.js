import { join } from 'path';
import {
  buildSearchAliases,
  createGameMetaStore,
  hasChineseText,
  isInvalidStoreName,
  normalizeMatchKey,
} from '../services/game-meta.js';
import { normalizeInputMethods } from '../services/input-methods.js';

function parseJsonArray(raw, fallback = []) {
  try {
    const value = JSON.parse(raw || '[]');
    return Array.isArray(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function createMetaStore(db, dataDir, debugLog = () => {}) {
  const metaDir = join(dataDir, 'meta');
  const fileEnricher = createGameMetaStore(metaDir, Number.MAX_SAFE_INTEGER);

  const selectMeta = db.prepare(`
    SELECT platform, appid, name_en, name_cn, genres_json, tags_json, aliases_json, input_methods_json, cover_url, permanent, cached_at
    FROM game_meta
    WHERE platform = ? AND appid = ?
  `);

  const upsertMeta = db.prepare(`
    INSERT INTO game_meta (platform, appid, name_en, name_cn, genres_json, tags_json, aliases_json, input_methods_json, cover_url, permanent, cached_at)
    VALUES (@platform, @appid, @name_en, @name_cn, @genres_json, @tags_json, @aliases_json, @input_methods_json, @cover_url, @permanent, @cached_at)
    ON CONFLICT(platform, appid) DO UPDATE SET
      name_en = excluded.name_en,
      name_cn = excluded.name_cn,
      genres_json = excluded.genres_json,
      tags_json = excluded.tags_json,
      aliases_json = excluded.aliases_json,
      input_methods_json = excluded.input_methods_json,
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
      input_methods: normalizeInputMethods(parseJsonArray(row.input_methods_json)),
      cover_url: row.cover_url || '',
      permanent: !!row.permanent,
      cached_at: row.cached_at,
    };
  }

  function isUsableMeta(data) {
    if (!data) return false;
    if (data.name_cn && isInvalidStoreName(data.name_cn)) return false;
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

  function finalizeMetaRow(row) {
    const data = rowToMeta(row);
    if (!isUsableMeta(data)) return null;
    if (!Array.isArray(data.aliases) || !data.aliases.length) {
      data.aliases = buildSearchAliases(data.name_en, data.name_cn, row.appid);
    }
    return data;
  }

  function readMeta(appid, platform = 'steam') {
    return finalizeMetaRow(selectMeta.get(platform, String(appid)));
  }

  function readMetaMap(appids, platform = 'steam') {
    const map = new Map();
    const ids = [...new Set(appids.map((id) => String(id)).filter(Boolean))];
    if (!ids.length) return map;

    const chunkSize = 400;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const placeholders = chunk.map(() => '?').join(',');
      const rows = db.prepare(`
        SELECT platform, appid, name_en, name_cn, genres_json, tags_json, aliases_json, input_methods_json, cover_url, permanent, cached_at
        FROM game_meta
        WHERE platform = ? AND appid IN (${placeholders})
      `).all(platform, ...chunk);
      for (const row of rows) {
        const data = finalizeMetaRow(row);
        if (data) map.set(row.appid, data);
      }
    }
    return map;
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
      input_methods_json: JSON.stringify(normalizeInputMethods(finalPayload.input_methods)),
      cover_url: finalPayload.cover_url || '',
      permanent: finalPayload.permanent ? 1 : 0,
      cached_at: Date.now(),
    });
  }

  function hasGenreOrTagMeta(data) {
    if (!data) return false;
    return !!(data.genres?.length || data.tags?.length);
  }

  function steamMetaNeedsEnrichment(appid, platform = 'steam') {
    const cached = readMeta(appid, platform);
    if (!cached) return true;
    return !hasGenreOrTagMeta(cached);
  }

  function applyCachedMetaWithStats(games, platform = 'steam') {
    const metaMap = readMetaMap(games.map((game) => game.appid), platform);
    let metaPending = 0;
    const mapped = games.map((game) => {
      const cached = metaMap.get(String(game.appid));
      if (!cached || !hasGenreOrTagMeta(cached)) metaPending += 1;
      return {
        ...game,
        name_cn: cached?.name_cn || game.name_cn || '',
        aliases: cached?.aliases || game.aliases || [],
        genres: cached?.genres || game.genres || [],
        tags: cached?.tags || game.tags || [],
        input_methods: cached?.input_methods?.length
          ? cached.input_methods
          : (game.input_methods || []),
      };
    });
    return { games: mapped, metaPending };
  }

  function applyCachedMeta(games, platform = 'steam') {
    return applyCachedMetaWithStats(games, platform).games;
  }

  function countMissingMeta(games, platform = 'steam') {
    return games.filter((game) => steamMetaNeedsEnrichment(game.appid, platform)).length;
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

  async function enrichGamesMissing(games, steamFetch, onProgress, options = {}) {
    const skipAppId = options.skipAppId || (() => false);
    const forceAll = !!options.forceAll;
    const pending = games.filter(
      (game) => !skipAppId(game.appid) && (forceAll || steamMetaNeedsEnrichment(game.appid)),
    );
    const total = pending.length;
    if (!total) {
      onProgress?.({ complete: true, current: 0, total: 0, updates: [] });
      return;
    }

    const batchSize = 8;
    let current = 0;
    for (let i = 0; i < pending.length; i += batchSize) {
      if (options.shouldAbort?.()) break;
      const batch = pending.slice(i, i + batchSize);
      const fetched = await fileEnricher.fetchMany(batch.map((game) => game.appid), steamFetch);
      const updates = [];
      for (const game of batch) {
        const meta = fetched[game.appid] || fetched[String(game.appid)];
        if (!meta) continue;
        writeMeta(game.appid, meta, meta.name_en || game.name);
        updates.push({ appid: game.appid, ...meta });
      }
      current += batch.length;
      onProgress?.({ current, total, updates });
    }
    onProgress?.({ complete: true, current: total, total, updates: [] });
  }

  async function enrichGames(games, steamFetch) {
    const enriched = applyCachedMeta(games);
    await enrichGamesMissing(enriched, steamFetch);
    return applyCachedMeta(enriched);
  }

  async function refreshSingleGameMeta(appid, steamFetch, nameEn = '') {
    const meta = await fileEnricher.fetchOneGameMeta(appid, steamFetch, nameEn);
    if (!meta) throw new Error('未能从 Steam 获取游戏资料');
    writeMeta(appid, meta, meta.name_en || nameEn, 'steam');
    return { appid: String(appid), ...meta };
  }

  return {
    readMeta,
    writeMeta,
    refreshSingleGameMeta,
    applyCachedMeta,
    applyCachedMetaWithStats,
    buildEnglishNameIndex,
    countMissingMeta,
    enrichGamesMissing,
    enrichGames,
  };
}
