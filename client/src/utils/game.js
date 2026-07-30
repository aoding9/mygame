import { coverSrcForDisplay, coverUrl, escapeHtml, iconUrl } from './format.js';

export function gamePlatform(game) {
  return game?.platform || 'steam';
}

export function sanitizeStoreGameNameClient(name) {
  let s = String(name || '').trim();
  if (!s) return '';
  s = s
    .replace(/^Steam 上的\s+/i, '')
    .replace(/\s+on Steam$/i, '')
    .replace(/\s*\/\s*Steam\s*$/i, '')
    .trim();
  if (/在\s*Steam\s*上购买/i.test(s) || (/立省/.test(s) && /购买|Buy/i.test(s))) {
    const fromBook = s.match(/《([^》]+)》/);
    if (fromBook?.[1]) return fromBook[1].trim();
    const fromQuote = s.match(/[“"]([^”"]+)[”"]/);
    if (fromQuote?.[1]) return fromQuote[1].trim();
    return '';
  }
  return s;
}

function isPromoStoreTitle(name) {
  const s = sanitizeStoreGameNameClient(name);
  return !s && /在\s*Steam\s*上购买|立省/.test(String(name || ''));
}

export function gameTitle(g) {
  if (g.display_name) return g.display_name;
  const customCn = g.custom_name_cn || '';
  if (customCn && customCn !== g.name) return customCn;
  const cn = sanitizeStoreGameNameClient(g.name_cn || '');
  if (cn && cn !== g.name && !isPromoStoreTitle(g.name_cn)) return cn;
  return g.name || '';
}

export function gameSubtitle(g) {
  const customEn = g.custom_name_en || '';
  if (customEn && customEn !== gameTitle(g)) return customEn;
  if (g.source_name && g.source_name !== gameTitle(g)) return g.source_name;
  if (g.name_cn && g.name && g.name_cn !== g.name && g.name_cn !== gameTitle(g)) return g.name;
  return '';
}

export function gameSourceName(game) {
  if (game.source_name_cn) return game.source_name_cn;
  if (game.source_name) return game.source_name;
  return game.name_cn || game.name || '';
}

export function hasChineseTextClient(text) {
  return /[\u4e00-\u9fff]/.test(String(text || ''));
}

/** Prefer English / original Steam name, never Chinese store title. */
export function resolveGameEnglishName(game) {
  const cn = String(
    game.custom_name_cn || game.name_cn || game.source_name_cn || '',
  ).trim();
  const candidates = [
    game.custom_name_en,
    game.name_en,
    game.source_name,
    game.name,
  ]
    .map((s) => String(s || '').trim())
    .filter(Boolean);

  for (const name of candidates) {
    if (name !== cn && !hasChineseTextClient(name)) return name;
  }
  for (const name of candidates) {
    if (name !== cn) return name;
  }
  return candidates[0] || '';
}

export function gameStoreUrl(game) {
  if (game.store_url) return game.store_url;
  return `https://store.steampowered.com/app/${game.appid}`;
}

export function gameCoverImage(game) {
  const url = game.cover_url || game.img_icon_url || '';
  return coverSrcForDisplay(url, game.cover_updated_at);
}

export function gameCoverFallback(game) {
  return iconUrl(game.appid, game.img_icon_url_hash) || coverUrl(game.appid);
}

export function gameCoverAbbrev(title) {
  const t = String(title || '').trim();
  if (!t) return '?';
  const cjk = t.match(/[\u4e00-\u9fff]/);
  if (cjk) return cjk[0];
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return t.slice(0, 2).toUpperCase();
}

export function gameCoverPlaceholderColor(seed) {
  const s = String(seed || '0');
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `hsl(${hue} 45% 28%)`;
}

export function gameCardGenreText(game) {
  return (game.genres || []).slice(0, 3).join(' · ');
}

export function gameCardTagText(game) {
  const tags = game.tags || [];
  if (!tags.length) return '';
  return tags.slice(0, 4).join(' · ');
}

export function resolveCoverLookupQuery(game) {
  const cn = game.custom_name_cn || game.name_cn || '';
  const title = gameTitle(game);
  if (cn && cn !== title) return cn;
  if (title) return title;
  return gameSourceName(game) || '';
}

export function resolveOwnerName(steamId, users) {
  const id = String(steamId || '').trim();
  if (!id) return '';
  const user = users.find((u) => u.steamId === id);
  if (user) return userCardLabel(user);
  return `…${id.slice(-4)}`;
}

export function userCardLabel(user) {
  if (user.personaName) return user.personaName;
  if (user.steamId) return `…${user.steamId.slice(-4)}`;
  return user.name || '未命名';
}

export function formatOwnerBadge(labelOrId, users) {
  const raw = String(labelOrId || '').trim();
  if (!raw) return '';
  if (/^\d{10,}$/.test(raw)) return resolveOwnerName(raw, users);
  return raw.replace(/^用户\s*/, '');
}

export function ownerNames(game) {
  if (Array.isArray(game.owner_names) && game.owner_names.length) {
    return game.owner_names.filter(Boolean);
  }
  if (game.owner_steam_id) return [game.owner_steam_id];
  return [];
}

export function ownerLabel(game, users) {
  const names = ownerNames(game);
  if (names.length === 1) return resolveOwnerName(names[0], users);
  if (names.length > 1) return `${names.length} 人共有`;
  return '';
}

export function normalizePrefAppId(appid) {
  const n = Number(appid);
  return Number.isFinite(n) ? String(n) : String(appid || '');
}

export function gameCardKey(appid, platform) {
  return `${platform}:${String(appid || '')}`;
}

export function formatLibrarySourceText(meta) {
  if (!meta?.source) return '';
  const parts = [meta.source];
  if (meta.cachedAt) {
    parts.push(`缓存于 ${new Date(meta.cachedAt).toLocaleString()}`);
  }
  if (meta.sessionExpired) parts.push('会话已过期');
  return parts.join(' · ');
}

export function getInputMethodInfo(game) {
  const methods = game.input_methods || [];
  if (methods.includes('controller_full')) {
    return { title: '完全支持控制器', type: 'controller' };
  }
  if (methods.includes('controller_partial') || methods.includes('controller')) {
    return { title: '部分支持控制器', type: 'controller' };
  }
  return { title: '键鼠', type: 'keyboard' };
}

export function escapeAttr(text) {
  return escapeHtml(text);
}
