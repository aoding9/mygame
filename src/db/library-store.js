import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

export function createLibraryStore(db) {
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

  const selectGames = db.prepare(`
    SELECT data_json FROM library_games WHERE snapshot_id = ? ORDER BY id ASC
  `);

  const deleteGames = db.prepare(`DELETE FROM library_games WHERE snapshot_id = ?`);
  const insertGame = db.prepare(`
    INSERT INTO library_games (snapshot_id, platform, appid, data_json)
    VALUES (@snapshot_id, @platform, @appid, @data_json)
  `);

  function parseGames(rows) {
    return rows.map((row) => JSON.parse(row.data_json));
  }

  function read(platform, cacheKey) {
    const snapshot = selectSnapshot.get(platform, cacheKey);
    if (!snapshot) return null;
    const games = parseGames(selectGames.all(snapshot.id));
    let extra = {};
    try {
      extra = JSON.parse(snapshot.extra_json || '{}');
    } catch {
      extra = {};
    }
    return {
      expired: false,
      data: {
        cachedAt: snapshot.cached_at,
        platform,
        cacheKey,
        gameCount: snapshot.game_count,
        games,
        ...extra,
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
      deleteGames.run(snapshot.id);
      for (const game of games) {
        const appid = String(game.appid ?? game.id ?? '');
        insertGame.run({
          snapshot_id: snapshot.id,
          platform,
          appid,
          data_json: JSON.stringify(game),
        });
      }
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

  function importLegacyJson(dataDir, debugLog = () => {}) {
    const count = db.prepare('SELECT COUNT(*) AS c FROM library_snapshots').get().c;
    if (count > 0) return { imported: 0 };

    let imported = 0;
    const cacheDir = join(dataDir, 'cache');
    if (existsSync(cacheDir)) {
      for (const name of readdirSync(cacheDir)) {
        if (!name.endsWith('.json')) continue;
        const path = join(cacheDir, name);
        try {
          const data = JSON.parse(readFileSync(path, 'utf-8'));
          if (!Array.isArray(data.games) || !data.games.length) continue;
          const cacheKey = name.replace(/\.json$/, '');
          const useFamily = cacheKey.endsWith('_family');
          const steamIds = data.steamIds || [];
          write('steam', cacheKey, data.games, {
            steamIds,
            includeFamily: useFamily,
          });
          imported += 1;
        } catch {
          /* ignore broken cache */
        }
      }
    }

    const platformDir = join(cacheDir, 'platforms');
    if (existsSync(platformDir)) {
      for (const name of readdirSync(platformDir)) {
        if (!name.endsWith('.json')) continue;
        const platform = name.replace(/\.json$/, '');
        if (!['epic', 'ubisoft'].includes(platform)) continue;
        try {
          const data = JSON.parse(readFileSync(join(platformDir, name), 'utf-8'));
          if (!Array.isArray(data.games) || !data.games.length) continue;
          const extra = {};
          if (data.accountId) extra.accountId = data.accountId;
          if (data.profileId) extra.profileId = data.profileId;
          write(platform, platform, data.games, extra);
          imported += 1;
        } catch {
          /* ignore */
        }
      }
    }

    if (imported) debugLog('已从 JSON 迁移游戏库到 SQLite', { imported });
    return { imported };
  }

  return { read, write, remove, importLegacyJson };
}
