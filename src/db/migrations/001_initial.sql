CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS library_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  cached_at INTEGER NOT NULL,
  game_count INTEGER NOT NULL DEFAULT 0,
  extra_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE(platform, cache_key)
);

CREATE TABLE IF NOT EXISTS library_games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  snapshot_id INTEGER NOT NULL REFERENCES library_snapshots(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  appid TEXT NOT NULL,
  data_json TEXT NOT NULL,
  UNIQUE(snapshot_id, appid)
);

CREATE INDEX IF NOT EXISTS idx_library_games_snapshot ON library_games(snapshot_id);

CREATE TABLE IF NOT EXISTS game_meta (
  platform TEXT NOT NULL DEFAULT 'steam',
  appid TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  name_cn TEXT NOT NULL DEFAULT '',
  genres_json TEXT NOT NULL DEFAULT '[]',
  tags_json TEXT NOT NULL DEFAULT '[]',
  aliases_json TEXT NOT NULL DEFAULT '[]',
  cover_url TEXT NOT NULL DEFAULT '',
  permanent INTEGER NOT NULL DEFAULT 0,
  cached_at INTEGER NOT NULL,
  PRIMARY KEY (platform, appid)
);

CREATE TABLE IF NOT EXISTS game_covers (
  platform TEXT NOT NULL,
  appid TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT '',
  cover_url TEXT NOT NULL DEFAULT '',
  cover_local TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (platform, appid, user_id)
);
