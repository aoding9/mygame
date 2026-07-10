import { existsSync } from 'fs';
import { join } from 'path';

function parseJsonArray(raw) {
  try {
    const value = JSON.parse(raw || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function hasOverrideContent(row) {
  if (!row) return false;
  return !!(
    row.display_name
    || row.name_cn
    || row.name_en
    || row.cover_url
    || row.cover_local
    || parseJsonArray(row.genres_json).length
    || parseJsonArray(row.tags_json).length
    || parseJsonArray(row.aliases_json).length
    || row.lock_from_refresh
  );
}

export function createGameOverrideStore(db, coversDir) {
  const selectByPlatform = db.prepare(`
    SELECT *
    FROM game_overrides
    WHERE platform = ? AND user_id = ?
  `);

  const selectOne = db.prepare(`
    SELECT *
    FROM game_overrides
    WHERE platform = ? AND appid = ? AND user_id = ?
  `);

  const upsert = db.prepare(`
    INSERT INTO game_overrides (
      platform, appid, user_id,
      display_name, name_cn, name_en,
      genres_json, tags_json, aliases_json,
      cover_url, cover_local, cover_source_url,
      lock_from_refresh, updated_at
    ) VALUES (
      @platform, @appid, @user_id,
      @display_name, @name_cn, @name_en,
      @genres_json, @tags_json, @aliases_json,
      @cover_url, @cover_local, @cover_source_url,
      @lock_from_refresh, @updated_at
    )
    ON CONFLICT(platform, appid, user_id) DO UPDATE SET
      display_name = excluded.display_name,
      name_cn = excluded.name_cn,
      name_en = excluded.name_en,
      genres_json = excluded.genres_json,
      tags_json = excluded.tags_json,
      aliases_json = excluded.aliases_json,
      cover_url = excluded.cover_url,
      cover_local = excluded.cover_local,
      cover_source_url = excluded.cover_source_url,
      lock_from_refresh = excluded.lock_from_refresh,
      updated_at = excluded.updated_at
  `);

  const removeOne = db.prepare(`
    DELETE FROM game_overrides
    WHERE platform = ? AND appid = ? AND user_id = ?
  `);

  const selectCoverLocals = db.prepare(`
    SELECT DISTINCT cover_local
    FROM game_overrides
    WHERE cover_local != ''
  `);

  function rowToOverride(row) {
    if (!row) return null;
    return {
      platform: row.platform,
      appid: row.appid,
      user_id: row.user_id,
      display_name: row.display_name || '',
      name_cn: row.name_cn || '',
      name_en: row.name_en || '',
      genres: parseJsonArray(row.genres_json),
      tags: parseJsonArray(row.tags_json),
      aliases: parseJsonArray(row.aliases_json),
      cover_url: row.cover_url || '',
      cover_local: row.cover_local || '',
      cover_source_url: row.cover_source_url || '',
      lock_from_refresh: !!row.lock_from_refresh,
      updated_at: row.updated_at,
    };
  }

  function resolveCoverUrl(override) {
    if (!override) return '';
    const coverLocal = override.cover_local || '';
    if (coverLocal) {
      if (existsSync(join(coversDir, coverLocal))) {
        return `/covers/${coverLocal.replace(/\\/g, '/')}`;
      }
      clearStaleLocalCover(override.platform, override.appid, override.user_id);
      override.cover_local = '';
    }
    return override.cover_url || '';
  }

  function clearStaleLocalCover(platform, appid, userId = '') {
    const override = get(platform, appid, userId);
    if (!override?.cover_local) return false;
    if (existsSync(join(coversDir, override.cover_local))) return false;
    save(platform, appid, userId, {
      ...override,
      cover_local: '',
    });
    return true;
  }

  function clearStaleLocalCovers(platform, userId = '') {
    let cleared = 0;
    for (const row of selectByPlatform.all(platform, userId || '')) {
      if (!row.cover_local) continue;
      if (existsSync(join(coversDir, row.cover_local))) continue;
      save(platform, row.appid, row.user_id || '', {
        ...rowToOverride(row),
        cover_local: '',
      });
      cleared += 1;
    }
    return cleared;
  }

  function get(platform, appid, userId = '') {
    const id = String(appid);
    const uid = userId || '';
    const row = selectOne.get(platform, id, uid);
    if (row) return rowToOverride(row);
    if (uid) {
      const global = selectOne.get(platform, id, '');
      return rowToOverride(global);
    }
    return null;
  }

  function isLocked(platform, appid, userId = '') {
    return !!get(platform, appid, userId)?.lock_from_refresh;
  }

  function save(platform, appid, userId, payload = {}) {
    const existing = get(platform, appid, userId);
    const merged = {
      platform,
      appid: String(appid),
      user_id: userId || '',
      display_name: payload.display_name ?? existing?.display_name ?? '',
      name_cn: payload.name_cn ?? existing?.name_cn ?? '',
      name_en: payload.name_en ?? existing?.name_en ?? '',
      genres_json: JSON.stringify(payload.genres ?? existing?.genres ?? []),
      tags_json: JSON.stringify(payload.tags ?? existing?.tags ?? []),
      aliases_json: JSON.stringify(payload.aliases ?? existing?.aliases ?? []),
      cover_url: payload.cover_url ?? existing?.cover_url ?? '',
      cover_local: payload.cover_local ?? existing?.cover_local ?? '',
      cover_source_url: payload.cover_source_url ?? existing?.cover_source_url ?? '',
      lock_from_refresh: payload.lock_from_refresh !== undefined
        ? (payload.lock_from_refresh ? 1 : 0)
        : (existing?.lock_from_refresh ? 1 : 0),
      updated_at: Date.now(),
    };

    const hasContent = !!(
      merged.display_name
      || merged.name_cn
      || merged.name_en
      || parseJsonArray(merged.genres_json).length
      || parseJsonArray(merged.tags_json).length
      || parseJsonArray(merged.aliases_json).length
      || merged.cover_url
      || merged.cover_local
    );

    if (!hasContent && !merged.lock_from_refresh) {
      removeOne.run(platform, String(appid), userId || '');
      return null;
    }

    upsert.run({
      ...merged,
      lock_from_refresh: merged.lock_from_refresh ? 1 : 0,
    });
    return get(platform, appid, userId);
  }

  function updateCoverFields(platform, appid, userId, coverPatch) {
    const existing = get(platform, appid, userId) || {
      display_name: '',
      name_cn: '',
      name_en: '',
      genres: [],
      tags: [],
      aliases: [],
      cover_url: '',
      cover_local: '',
      cover_source_url: '',
      lock_from_refresh: false,
    };
    return save(platform, appid, userId, {
      ...existing,
      ...coverPatch,
    });
  }

  function loadMap(platform, userId = '') {
    const map = new Map();
    for (const row of selectByPlatform.all(platform, '')) {
      map.set(String(row.appid), rowToOverride(row));
    }
    const uid = String(userId || '').trim();
    if (uid) {
      for (const row of selectByPlatform.all(platform, uid)) {
        map.set(String(row.appid), rowToOverride(row));
      }
    }
    return map;
  }

  function applyToGameWithMap(game, platform, overrideMap, userId = '') {
    const appid = String(game.appid ?? '');
    game.source_name = game.name || '';
    game.source_name_cn = game.name_cn || '';

    const override = overrideMap.get(appid);
    if (!override) {
      game.lock_from_refresh = false;
      return game;
    }

    game.lock_from_refresh = override.lock_from_refresh;
    game.has_override = true;

    if (override.display_name) game.display_name = override.display_name;
    if (override.name_cn) game.custom_name_cn = override.name_cn;
    if (override.name_en) game.custom_name_en = override.name_en;
    if (override.genres.length) game.genres = override.genres;
    if (override.tags.length) game.tags = override.tags;
    if (override.aliases.length) game.aliases = override.aliases;

    const cover = resolveCoverUrl(override);
    if (cover) {
      game.cover_url = cover;
      game.cover_custom = true;
      game.cover_updated_at = override.updated_at || 0;
    }

    return game;
  }

  function applyToGames(games, platform, userId = '') {
    clearStaleLocalCovers(platform, userId);
    const overrideMap = loadMap(platform, userId);
    for (const game of games || []) {
      applyToGameWithMap(game, platform, overrideMap, userId);
    }
    return games;
  }

  function shouldPreserveOnRefresh(platform, appid, userId = '') {
    return isLocked(platform, appid, userId);
  }

  function buildPublicView(game, platform, userId = '') {
    const override = get(platform, String(game.appid), userId);
    return {
      platform,
      appid: String(game.appid),
      source_name: game.source_name || game.name || '',
      source_name_cn: game.source_name_cn || game.name_cn || '',
      display_name: override?.display_name || game.display_name || '',
      name_cn: override?.name_cn || game.custom_name_cn || '',
      name_en: override?.name_en || game.custom_name_en || '',
      genres: override?.genres?.length ? override.genres : (game.genres || []),
      tags: override?.tags?.length ? override.tags : (game.tags || []),
      aliases: override?.aliases?.length ? override.aliases : (game.aliases || []),
      cover_url: resolveCoverUrl(override) || game.cover_url || '',
      lock_from_refresh: !!override?.lock_from_refresh,
      has_override: !!override && hasOverrideContent(override),
    };
  }

  function listReferencedCoverLocals() {
    const paths = new Set();
    for (const row of selectCoverLocals.all()) {
      const relative = String(row.cover_local || '').replace(/\\/g, '/').trim();
      if (relative) paths.add(relative);
    }
    return paths;
  }

  return {
    get,
    save,
    loadMap,
    updateCoverFields,
    applyToGameWithMap,
    applyToGames,
    isLocked,
    shouldPreserveOnRefresh,
    buildPublicView,
    resolveCoverUrl,
    clearStaleLocalCover,
    clearStaleLocalCovers,
    listReferencedCoverLocals,
  };
}
