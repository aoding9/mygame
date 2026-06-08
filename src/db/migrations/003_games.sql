CREATE TABLE IF NOT EXISTS games (
  platform TEXT NOT NULL,
  appid TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  name_cn TEXT NOT NULL DEFAULT '',
  img_icon_url TEXT NOT NULL DEFAULT '',
  playtime_forever INTEGER NOT NULL DEFAULT 0,
  rtime_last_played INTEGER NOT NULL DEFAULT 0,
  store_url TEXT NOT NULL DEFAULT '',
  data_json TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (platform, appid)
);

CREATE TABLE IF NOT EXISTS library_snapshot_games (
  snapshot_id INTEGER NOT NULL REFERENCES library_snapshots(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  appid TEXT NOT NULL,
  member_json TEXT NOT NULL DEFAULT '{}',
  PRIMARY KEY (snapshot_id, platform, appid),
  FOREIGN KEY (platform, appid) REFERENCES games(platform, appid)
);

CREATE INDEX IF NOT EXISTS idx_library_snapshot_games_snapshot
  ON library_snapshot_games(snapshot_id);

CREATE INDEX IF NOT EXISTS idx_library_snapshot_games_app
  ON library_snapshot_games(platform, appid);
