import { createGamesTableAccess } from './games-table.js';

export function createLibraryStore(db) {
  const gamesTable = createGamesTableAccess(db);
  gamesTable.migrateLegacyLibraryGames();

  const insertSnapshot = db.prepare(`
    INSERT INTO library_snapshots (platform, cache_key, cached_at, game_count, extra_json)
    VALUES (@platform, @cache_key, @cached_at, @game_count, @extra_json)
    ON CONFLICT(platform, cache_key) DO UPDATE SET
      cached_at = excluded.cached_at,
      game_count = excluded.game_count,
      extra_json = excluded.extra_json
  `);

  const selectSnapshot = db.prepare(`
    SELECT id, platform, cache_key, cached_at, game_count, extra_json
    FROM library_snapshots
    WHERE platform = ? AND cache_key = ?
  `);

  const deleteSnapshot = db.prepare(`
    DELETE FROM library_snapshots WHERE platform = ? AND cache_key = ?
  `);

  function read(platform, cacheKey) {
    const data = gamesTable.readSnapshotLibrary(platform, cacheKey);
    if (!data) return null;

    return {
      expired: false,
      data: {
        cachedAt: data.cachedAt,
        platform,
        cacheKey,
        gameCount: data.gameCount,
        games: data.games,
        ...data.extra,
      },
    };
  }

  function write(platform, cacheKey, games, extra = {}) {
    const cachedAt = Date.now();
    const extraJson = JSON.stringify(extra);
    db.exec('BEGIN IMMEDIATE');
    try {
      insertSnapshot.run({
        platform,
        cache_key: cacheKey,
        cached_at: cachedAt,
        game_count: games.length,
        extra_json: extraJson,
      });
      const snapshot = selectSnapshot.get(platform, cacheKey);
      gamesTable.saveSnapshotGames(snapshot.id, platform, games);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
    return {
      cachedAt,
      platform,
      cacheKey,
      gameCount: games.length,
      games,
      ...extra,
    };
  }

  function remove(platform, cacheKey) {
    deleteSnapshot.run(platform, cacheKey);
  }

  function findCachedGame(platform, appid) {
    const hit = gamesTable.findLatestGame(platform, appid);
    return hit?.game || null;
  }

  function updateCachedGameFields(platform, appid, patch = {}) {
    const hit = gamesTable.findLatestGame(platform, appid);
    if (!hit?.game) return null;

    const snapshotPlatform = hit.snapshot.platform || platform;
    const merged = { ...hit.game, ...patch, appid: hit.game.appid || appid };
    const games = gamesTable.readSnapshotGames(hit.snapshot.id);
    const idx = games.findIndex((item) => String(item.appid) === String(appid));
    if (idx < 0) return merged;
    games[idx] = merged;

    db.exec('BEGIN IMMEDIATE');
    try {
      gamesTable.saveSnapshotGames(hit.snapshot.id, snapshotPlatform, games);
      db.prepare(`
        UPDATE library_snapshots
        SET cached_at = ?, game_count = ?
        WHERE id = ?
      `).run(Date.now(), games.length, hit.snapshot.id);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    return merged;
  }

  return {
    read,
    write,
    remove,
    findCachedGame,
    updateCachedGameFields,
  };
}
