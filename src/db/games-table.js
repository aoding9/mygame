const MEMBER_KEYS = new Set([
  'owner_ids',
  'owner_names',
  'from_family',
  'exclude_reason',
  'shareable',
]);

const GAME_COLUMN_KEYS = new Set([
  'appid',
  'id',
  'platform',
  'name',
  'name_cn',
  'img_icon_url',
  'playtime_forever',
  'rtime_last_played',
  'store_url',
]);

export function gameAppId(game) {
  return String(game?.appid ?? game?.id ?? '').trim();
}

export function splitGameRecord(platform, game) {
  const appid = gameAppId(game);
  const source = { ...game };
  delete source.appid;
  delete source.id;

  const member = {};
  for (const key of MEMBER_KEYS) {
    if (key in source) {
      member[key] = source[key];
      delete source[key];
    }
  }

  const row = {
    platform,
    appid,
    name: String(game?.name || ''),
    name_cn: String(game?.name_cn || ''),
    img_icon_url: String(game?.img_icon_url || ''),
    playtime_forever: Number(game?.playtime_forever) || 0,
    rtime_last_played: Number(game?.rtime_last_played) || 0,
    store_url: String(game?.store_url || ''),
    data_json: '{}',
    updated_at: Date.now(),
  };

  for (const key of GAME_COLUMN_KEYS) {
    delete source[key];
  }

  row.data_json = JSON.stringify(source);
  return {
    row,
    member,
  };
}

export function mergeGameRecord(row, memberJson = '{}') {
  let extra = {};
  let member = {};
  try {
    extra = JSON.parse(row?.data_json || '{}');
  } catch {
    extra = {};
  }
  try {
    member = typeof memberJson === 'string' ? JSON.parse(memberJson || '{}') : (memberJson || {});
  } catch {
    member = {};
  }

  return {
    ...extra,
    ...member,
    platform: row.platform,
    appid: row.appid,
    name: row.name || extra.name || '',
    name_cn: row.name_cn || extra.name_cn || '',
    img_icon_url: row.img_icon_url || extra.img_icon_url || '',
    playtime_forever: row.playtime_forever ?? extra.playtime_forever ?? 0,
    rtime_last_played: row.rtime_last_played ?? extra.rtime_last_played ?? 0,
    store_url: row.store_url || extra.store_url || '',
  };
}

export function createGamesTableAccess(db) {
  const upsertGame = db.prepare(`
    INSERT INTO games (
      platform, appid, name, name_cn, img_icon_url,
      playtime_forever, rtime_last_played, store_url, data_json, updated_at
    ) VALUES (
      @platform, @appid, @name, @name_cn, @img_icon_url,
      @playtime_forever, @rtime_last_played, @store_url, @data_json, @updated_at
    )
    ON CONFLICT(platform, appid) DO UPDATE SET
      name = excluded.name,
      name_cn = CASE WHEN excluded.name_cn != '' THEN excluded.name_cn ELSE games.name_cn END,
      img_icon_url = CASE WHEN excluded.img_icon_url != '' THEN excluded.img_icon_url ELSE games.img_icon_url END,
      playtime_forever = MAX(excluded.playtime_forever, games.playtime_forever),
      rtime_last_played = MAX(excluded.rtime_last_played, games.rtime_last_played),
      store_url = CASE WHEN excluded.store_url != '' THEN excluded.store_url ELSE games.store_url END,
      data_json = excluded.data_json,
      updated_at = excluded.updated_at
  `);

  const insertSnapshotGame = db.prepare(`
    INSERT INTO library_snapshot_games (snapshot_id, platform, appid, member_json)
    VALUES (@snapshot_id, @platform, @appid, @member_json)
  `);

  const deleteSnapshotGames = db.prepare(`
    DELETE FROM library_snapshot_games WHERE snapshot_id = ?
  `);

  const selectSnapshotLibrary = db.prepare(`
    SELECT
      s.cached_at,
      s.game_count,
      s.extra_json,
      g.platform,
      g.appid,
      g.name,
      g.name_cn,
      g.img_icon_url,
      g.playtime_forever,
      g.rtime_last_played,
      g.store_url,
      g.data_json,
      sg.member_json
    FROM library_snapshots s
    LEFT JOIN library_snapshot_games sg ON sg.snapshot_id = s.id
    LEFT JOIN games g ON g.platform = sg.platform AND g.appid = sg.appid
    WHERE s.platform = ? AND s.cache_key = ?
    ORDER BY sg.rowid ASC
  `);

  const selectLatestGame = db.prepare(`
    SELECT
      g.platform,
      g.appid,
      g.name,
      g.name_cn,
      g.img_icon_url,
      g.playtime_forever,
      g.rtime_last_played,
      g.store_url,
      g.data_json,
      sg.member_json,
      s.id AS snapshot_id,
      s.platform AS snapshot_platform,
      s.cache_key,
      s.extra_json
    FROM library_snapshot_games sg
    JOIN games g ON g.platform = sg.platform AND g.appid = sg.appid
    JOIN library_snapshots s ON s.id = sg.snapshot_id
    WHERE sg.platform = ? AND sg.appid = ?
    ORDER BY s.cached_at DESC
    LIMIT 1
  `);

  const selectSnapshotGames = db.prepare(`
    SELECT
      g.platform,
      g.appid,
      g.name,
      g.name_cn,
      g.img_icon_url,
      g.playtime_forever,
      g.rtime_last_played,
      g.store_url,
      g.data_json,
      sg.member_json
    FROM library_snapshot_games sg
    JOIN games g ON g.platform = sg.platform AND g.appid = sg.appid
    WHERE sg.snapshot_id = ?
    ORDER BY sg.rowid ASC
  `);

  const countSnapshotGames = db.prepare(`
    SELECT COUNT(*) AS c FROM library_snapshot_games
  `);

  const selectLegacyLibraryGames = db.prepare(`
    SELECT snapshot_id, platform, appid, data_json
    FROM library_games
    ORDER BY snapshot_id, id ASC
  `);

  function saveSnapshotGames(snapshotId, platform, games) {
    deleteSnapshotGames.run(snapshotId);
    for (const game of games || []) {
      const { row, member } = splitGameRecord(platform, game);
      if (!row.appid) continue;
      upsertGame.run(row);
      insertSnapshotGame.run({
        snapshot_id: snapshotId,
        platform: row.platform,
        appid: row.appid,
        member_json: JSON.stringify(member),
      });
    }
  }

  function rowsToGames(rows) {
    return rows
      .filter((row) => row?.appid)
      .map((row) => mergeGameRecord(row, row.member_json));
  }

  function readSnapshotLibrary(platform, cacheKey) {
    const rows = selectSnapshotLibrary.all(platform, cacheKey);
    if (!rows.length) return null;
    const snapshot = rows[0];
    const games = rowsToGames(rows);
    let extra = {};
    try {
      extra = JSON.parse(snapshot.extra_json || '{}');
    } catch {
      extra = {};
    }
    return {
      cachedAt: snapshot.cached_at,
      platform,
      cacheKey,
      gameCount: snapshot.game_count,
      games,
      extra,
    };
  }

  function findLatestGame(platform, appid) {
    const row = selectLatestGame.get(platform, String(appid));
    if (!row) return null;
    return {
      game: mergeGameRecord(row, row.member_json),
      snapshot: {
        id: row.snapshot_id,
        platform: row.snapshot_platform,
        cache_key: row.cache_key,
        extra_json: row.extra_json,
      },
    };
  }

  function readSnapshotGames(snapshotId) {
    return rowsToGames(selectSnapshotGames.all(snapshotId));
  }

  function migrateLegacyLibraryGames() {
    if (countSnapshotGames.get().c > 0) return { migrated: 0 };

    const legacyRows = selectLegacyLibraryGames.all();
    if (!legacyRows.length) return { migrated: 0 };

    db.exec('BEGIN IMMEDIATE');
    try {
      let currentSnapshotId = null;
      let batch = [];
      let migrated = 0;

      const flush = () => {
        if (!currentSnapshotId || !batch.length) return;
        saveSnapshotGames(currentSnapshotId, batch[0].platform, batch.map((item) => item.game));
        migrated += batch.length;
        batch = [];
      };

      for (const row of legacyRows) {
        let game;
        try {
          game = JSON.parse(row.data_json);
        } catch {
          continue;
        }
        if (currentSnapshotId !== row.snapshot_id) {
          flush();
          currentSnapshotId = row.snapshot_id;
        }
        batch.push({ platform: row.platform, game });
      }
      flush();
      db.exec('COMMIT');
      return { migrated };
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  return {
    saveSnapshotGames,
    readSnapshotLibrary,
    findLatestGame,
    readSnapshotGames,
    migrateLegacyLibraryGames,
    mergeGameRecord,
  };
}
