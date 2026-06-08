import { searchSteamStoreByName } from './game-lookup.js';

const STEAM_MATCH_MIN_SCORE = 0.55;

export function steamHeaderCoverUrl(appid) {
  const id = String(appid || '').trim();
  if (!/^\d+$/.test(id)) return '';
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${id}/header.jpg`;
}

export function isSteamCoverUrl(url) {
  const value = String(url || '').trim();
  if (!value) return false;
  return /(?:steamstatic|steampowered|akamai\.steamstatic)/i.test(value)
    && /\/steam\/apps\/\d+\//i.test(value);
}

export function normalizeCoverSearchName(name, platform = '') {
  return String(name || '')
    .replace(/[®™©]/g, '')
    .replace(/^[\s《]+|[\s》]+$/g, '')
    .trim();
}

function normalizeMatchText(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[®™©《》「」【】]/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\bpc\b/gi, ' ')
    .replace(/[^\w\s\u4e00-\u9fff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function scoreCoverNameMatch(query, candidate) {
  const a = normalizeMatchText(query);
  const b = normalizeMatchText(candidate);
  if (!a || !b) return 0;
  if (a === b) return 1;

  const shorter = a.length <= b.length ? a : b;
  const longer = a.length > b.length ? a : b;
  if (longer.includes(shorter)) {
    return 0.85 + 0.15 * (shorter.length / longer.length);
  }

  const wordsA = a.split(' ').filter((word) => word.length >= 2);
  const wordsB = b.split(' ').filter((word) => word.length >= 2);
  if (!wordsA.length || !wordsB.length) return 0;

  let matched = 0;
  for (const word of wordsA) {
    if (wordsB.includes(word)) {
      matched += 1;
      continue;
    }
    if (wordsB.some((other) => other.includes(word) || word.includes(other))) {
      matched += 0.7;
    }
  }

  const recall = matched / wordsA.length;
  const precision = matched / Math.max(wordsB.length, 1);
  if (recall === 0 && precision === 0) return 0;
  return (2 * recall * precision) / (recall + precision);
}

export function buildCoverSearchQueries(rawName, platform = '') {
  const name = normalizeCoverSearchName(rawName, platform);
  const queries = [];
  const seen = new Set();
  const add = (raw) => {
    const value = normalizeCoverSearchName(raw, platform);
    if (!value || value.length < 2) return;
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    queries.push(value);
  };

  add(name);

  const acMatch = name.match(/Assassin['']s?\s+Creed\s+(.+)/i);
  if (acMatch?.[1]) {
    const subtitle = acMatch[1].trim();
    add(subtitle);
    const parts = subtitle.split(/\s+/).filter(Boolean);
    if (parts.length > 1) add(parts[parts.length - 1]);
  }

  const acCnMatch = name.match(/刺客信条[：:\s·•.\-]*(.+)/);
  if (acCnMatch?.[1]) {
    const subtitle = acCnMatch[1].trim();
    add(subtitle);
    const parts = subtitle.split(/\s+/).filter(Boolean);
    if (parts.length > 1) add(parts[parts.length - 1]);
  }

  return queries;
}

async function findBestSteamCoverMatch(gameName, fetchImpl, options = {}) {
  const platform = String(options.platform || 'steam').trim().toLowerCase();
  const minScore = Number.isFinite(options.minScore) ? options.minScore : STEAM_MATCH_MIN_SCORE;
  const queries = buildCoverSearchQueries(gameName, platform);
  if (!queries.length) return null;

  let best = null;

  for (const query of queries) {
    const results = await searchSteamStoreByName(query, fetchImpl, 8);
    for (const item of results) {
      const candidateName = item.name || item.name_cn || '';
      const score = scoreCoverNameMatch(gameName, candidateName);
      if (score < minScore) continue;

      const appid = String(item.steamAppId || item.id || '').trim();
      const cover = steamHeaderCoverUrl(appid) || item.cover_url || '';
      if (!cover) continue;

      if (!best || score > best.score) {
        best = { cover_url: cover, name: candidateName, score, steamAppId: appid };
      }
    }

    if (best?.score >= 0.95 && query === queries[0]) break;
  }

  return best;
}

export async function findSteamCoverByGameName(gameName, fetchImpl, options = {}) {
  const match = await findBestSteamCoverMatch(gameName, fetchImpl, options);
  return match?.cover_url || '';
}

export async function resolveCoverSteamFirst(gameName, fetchImpl, options = {}) {
  const steamCover = await findSteamCoverByGameName(gameName, fetchImpl, options);
  if (steamCover) return steamCover;

  if (typeof options.platformFallback === 'function') {
    return options.platformFallback();
  }
  return '';
}
