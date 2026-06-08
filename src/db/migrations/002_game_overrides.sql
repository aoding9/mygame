CREATE TABLE IF NOT EXISTS game_overrides (
  platform TEXT NOT NULL,
  appid TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT '',
  display_name TEXT NOT NULL DEFAULT '',
  name_cn TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '',
  genres_json TEXT NOT NULL DEFAULT '[]',
  tags_json TEXT NOT NULL DEFAULT '[]',
  aliases_json TEXT NOT NULL DEFAULT '[]',
  cover_url TEXT NOT NULL DEFAULT '',
  cover_local TEXT NOT NULL DEFAULT '',
  cover_source_url TEXT NOT NULL DEFAULT '',
  lock_from_refresh INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (platform, appid, user_id)
);

INSERT OR IGNORE INTO game_overrides (
  platform, appid, user_id, cover_url, cover_local, cover_source_url, updated_at
)
SELECT
  platform, appid, user_id, cover_url, cover_local, source_url, updated_at
FROM game_covers
WHERE cover_url != '' OR cover_local != '';
