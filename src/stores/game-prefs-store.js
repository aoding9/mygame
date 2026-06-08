export const GAME_PREF_PLATFORMS = ['steam', 'epic', 'ubisoft'];

export function normalizeGamePrefPlatform(platform) {
  const value = String(platform || 'steam').trim().toLowerCase();
  return GAME_PREF_PLATFORMS.includes(value) ? value : 'steam';
}

export function normalizeGamePrefAppId(platform, appid) {
  const p = normalizeGamePrefPlatform(platform);
  const raw = String(appid ?? '').trim();
  if (!raw) return '';
  if (p === 'steam') {
    const id = Number(raw);
    return Number.isFinite(id) && id > 0 ? String(Math.trunc(id)) : '';
  }
  return raw;
}

export function createEmptyPlatformAppIds() {
  return { steam: [], epic: [], ubisoft: [] };
}

export function readPlatformAppIds(data) {
  const platforms = createEmptyPlatformAppIds();
  if (data?.platforms && typeof data.platforms === 'object') {
    for (const platform of GAME_PREF_PLATFORMS) {
      const list = data.platforms[platform];
      if (!Array.isArray(list)) continue;
      platforms[platform] = [...new Set(
        list.map((id) => normalizeGamePrefAppId(platform, id)).filter(Boolean),
      )];
    }
    return platforms;
  }

  if (Array.isArray(data?.appids)) {
    platforms.steam = [...new Set(
      data.appids.map((id) => normalizeGamePrefAppId('steam', id)).filter(Boolean),
    )];
  }
  return platforms;
}

export function listPlatformAppIds(platforms, platform) {
  const p = normalizeGamePrefPlatform(platform);
  return [...(platforms[p] || [])];
}

export function togglePlatformAppId(platforms, platform, appid) {
  const p = normalizeGamePrefPlatform(platform);
  const id = normalizeGamePrefAppId(p, appid);
  if (!id) throw new Error('无效的游戏 ID');

  const list = [...(platforms[p] || [])];
  const index = list.indexOf(id);
  const active = index < 0;
  if (index >= 0) list.splice(index, 1);
  else list.push(id);

  platforms[p] = list;
  return { appid: id, platform: p, active, platforms };
}

export function mergePlatformAppIds(platforms, platform, appids) {
  const p = normalizeGamePrefPlatform(platform);
  const set = new Set(platforms[p] || []);
  for (const raw of appids || []) {
    const id = normalizeGamePrefAppId(p, raw);
    if (id) set.add(id);
  }
  platforms[p] = [...set];
  return platforms;
}

export function legacySteamAppIds(platforms) {
  return (platforms.steam || []).map((id) => Number(id)).filter((id) => id > 0);
}

export function buildPlatformPrefsResponse(platforms, extra = {}) {
  return {
    platforms,
    appids: legacySteamAppIds(platforms),
    ...extra,
  };
}
