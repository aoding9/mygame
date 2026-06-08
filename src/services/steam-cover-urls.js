const STEAM_SKIP_LOCALIZE_APPIDS = new Set([
  '7',
  '10',
  '760',
  '228980',
]);

export function isSteamLocalizeCandidate(appid) {
  const id = String(appid || '').trim();
  if (!/^\d+$/.test(id)) return false;
  if (STEAM_SKIP_LOCALIZE_APPIDS.has(id)) return false;
  return Number(id) > 0;
}

export function steamIconUrl(appid, hash) {
  const value = String(hash || '').trim();
  if (!value || value === '0' || value.length < 4) return '';
  if (value.startsWith('http')) return value;
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${value}.jpg`;
}

function steamLandscapeCoverUrls(appid) {
  return [
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`,
    `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`,
    `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/header.jpg`,
    `https://steamcdn-a.akamaihd.net/steam/apps/${appid}/header.jpg`,
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_616x353.jpg`,
    `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/capsule_616x353.jpg`,
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_231x87.jpg`,
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_hero.jpg`,
  ];
}

function steamPortraitFallbackUrls(appid) {
  return [
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/library_600x900.jpg`,
    `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/library_600x900.jpg`,
    `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${appid}/library_600x900.jpg`,
    `https://steamcdn-a.akamaihd.net/steam/apps/${appid}/library_600x900.jpg`,
  ];
}

export function resolveSteamCoverCandidates(game) {
  const appid = String(game?.appid || '').trim();
  if (!isSteamLocalizeCandidate(appid)) return [];

  const urls = [
    ...steamLandscapeCoverUrls(appid),
    ...steamPortraitFallbackUrls(appid),
  ];

  const icon = steamIconUrl(appid, game?.img_icon_url);
  if (icon) urls.push(icon);
  if (game?.cover_url?.startsWith('http')) urls.unshift(game.cover_url);

  return [...new Set(urls)];
}

export function isPortraitSteamCoverSource(url) {
  return /library_600x900/i.test(String(url || ''));
}

export function isPermanentCoverDownloadError(err) {
  return /下载封面失败 \((404|403|410)\)/.test(String(err?.message || ''));
}
