import { hasChineseText } from '../services/game-meta.js';
import { readUbisoftLocalOwnedGames } from './ubisoft-local.js';

const UBI_BASE = 'https://public-ubiservices.ubi.com';
const UBI_CONNECT_APP_ID = 'f35adcb5-1911-440c-b1c9-48fdc1701c68';
const UBI_CONNECT_APP_ID_ALT = '314d4fef-e568-454a-ae06-43e3bece12a6';
const UBI_CLUB_APP_ID = 'b8fde481-327d-4031-85ce-7c10a202a700';
const UBI_API_BASE = 'https://api-ubiservices.ubi.com';
const UBI_STORE_BASE = 'https://store.ubisoft.com';
const UBI_WEB_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const UBI_STORE_COVER_RE = /(?:https?:\/\/store\.ubisoft\.com)?\/dw\/image\/v2\/ABBS_PRD\/on\/demandware\.static\/-\/Sites-masterCatalog\/[^"'\s>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s>]*)?/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const UBI_GRAPHQL_OWNED_GAMES = `query AllGames {
  viewer {
    id
    ...ownedGamesList
  }
}
fragment gameProps on Game {
  id
  spaceId
  name
  coverUrl
  lowBoxArtUrl
  lowThumbnailUrl
}
fragment ownedGameProps on Game {
  ...gameProps
  viewer {
    meta {
      id
      lastPlayedDate
      playTime
      ownedPlatformGroups {
        id
        name
        type
      }
    }
  }
}
fragment ownedGamesList on User {
  ownedGames: games(filterBy: {isOwned: true}) {
    totalCount
    nodes {
      ...ownedGameProps
    }
  }
}`;
const UBI_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

let ubiLogger = null;

export function setUbisoftLogger(fn) {
  ubiLogger = typeof fn === 'function' ? fn : null;
}

function logUbi(label, detail) {
  if (ubiLogger) ubiLogger(label, detail);
}

async function ubiRequest(fetchImpl, label, url, options = {}) {
  const method = options.method || 'GET';
  const quietNotFound = options.quietNotFound === true;
  const { quietNotFound: _ignored, ...fetchOptions } = options;
  const started = Date.now();
  logUbi('→ 请求', { label, method, url });
  try {
    const res = await fetchImpl(url, fetchOptions);
    logUbi('← 响应', { label, status: res.status, ok: res.ok, ms: Date.now() - started });
    if (!res.ok && !(quietNotFound && res.status === 404)) {
      const text = await res.clone().text().catch(() => '');
      let detail = text.slice(0, 300);
      try {
        const json = JSON.parse(text);
        detail = json.message || json.error || json.errorCode || detail;
      } catch {
        /* plain text */
      }
      logUbi('响应错误', { label, status: res.status, detail });
    }
    return res;
  } catch (err) {
    logUbi('✕ 异常', {
      label,
      url,
      ms: Date.now() - started,
      error: err.message,
      code: err?.cause?.code || err?.code || '',
      cause: err?.cause?.message || '',
    });
    throw err;
  }
}

function ubiLoginHeaders(appId) {
  return {
    'Content-Type': 'application/json',
    Accept: '*/*',
    'Ubi-AppId': appId,
    'Ubi-RequestedPlatformType': 'uplay',
    'Ubi-LocaleCode': 'zh-CN',
    Origin: 'https://connect.ubisoft.com',
    Referer: 'https://connect.ubisoft.com/',
    'User-Agent': UBI_USER_AGENT,
  };
}

const UBI_WEB_APP_ID = '74e71609-1ddf-47da-9073-71ac3aa8c90c';

function ubiAuthHeaders(ticket, sessionId, appId = UBI_CONNECT_APP_ID, expiration = '', options = {}) {
  const isWeb = options.tokenKind === 'web';
  const origin = isWeb ? 'https://www.ubisoft.com' : 'https://connect.ubisoft.com';
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Ubi-AppId': appId,
    Authorization: `Ubi_v1 t=${ticket}`,
    'Ubi-SessionId': sessionId,
    'Ubi-RequestedPlatformType': 'uplay',
    'Ubi-LocaleCode': 'zh-CN',
    Origin: origin,
    Referer: `${origin}/`,
    'User-Agent': UBI_USER_AGENT,
  };
  if (isWeb) {
    headers.DNT = '1';
    headers['sec-fetch-dest'] = 'empty';
    headers['sec-fetch-mode'] = 'cors';
    headers['sec-fetch-site'] = 'cross-site';
  }
  if (expiration) headers.expiration = expiration;
  return headers;
}

function withClubAuth(auth) {
  return {
    ...auth,
    appId: UBI_CLUB_APP_ID,
    tokenKind: 'connect',
  };
}

function inferUbisoftTokenKind(parsed, headerMap = {}) {
  const appId = String(parsed.appId || headerMap['ubi-appid'] || '').trim().toLowerCase();
  const origin = String(headerMap.origin || headerMap.referer || '').toLowerCase();
  if (appId === UBI_CLUB_APP_ID.toLowerCase()) return 'connect';
  if (appId === UBI_CONNECT_APP_ID.toLowerCase() || appId === UBI_CONNECT_APP_ID_ALT.toLowerCase()) {
    return 'connect';
  }
  if (origin.includes('connect.ubisoft.com')) return 'connect';
  if (appId === UBI_WEB_APP_ID.toLowerCase() || origin.includes('ubisoft.com')) return 'web';
  return 'connect';
}

function ubiAuthHeadersFromAuth(auth, options = {}) {
  const useClub = options.useClub === true;
  const base = useClub ? withClubAuth(auth) : auth;
  const appId = base.appId || (base.tokenKind === 'web' ? UBI_WEB_APP_ID : UBI_CONNECT_APP_ID);
  return ubiAuthHeaders(
    base.ticket,
    base.sessionId,
    appId,
    base.expiration || '',
    { tokenKind: useClub ? 'connect' : base.tokenKind },
  );
}

function resolveUbisoftRecordId(record) {
  if (!record) return '';
  if (typeof record === 'string') {
    const text = record.trim();
    return UUID_RE.test(text) ? text : '';
  }
  if (typeof record !== 'object') return '';

  const candidates = [
    record.spaceId,
    record.id,
    record.appId,
    record.applicationId,
    record.gameId,
    record.productId,
    record.uplayId,
    record.space_id,
    record.app_id,
    record.application_id,
    record.application?.id,
    record.application?.appId,
    record.application?.spaceId,
  ];
  for (const value of candidates) {
    const text = String(value || '').trim();
    if (UUID_RE.test(text)) return text;
  }
  return '';
}

function flattenUbisoftRecords(json) {
  if (!json) return [];
  const out = [];

  if (Array.isArray(json)) {
    for (const item of json) {
      if (item && typeof item === 'object' && Array.isArray(item.applications)) {
        out.push(...item.applications);
      } else {
        out.push(item);
      }
    }
    return out;
  }

  if (typeof json !== 'object') return [];

  for (const key of ['gamesPlayed', 'gamesplayed', 'spaces']) {
    const spaces = json[key];
    if (!Array.isArray(spaces)) continue;
    for (const space of spaces) {
      if (space?.spaceId) out.push({ ...space, spaceId: space.spaceId });
      if (Array.isArray(space?.applications)) {
        for (const app of space.applications) {
          out.push({ ...app, spaceId: app.spaceId || space.spaceId });
        }
      }
    }
  }

  for (const key of ['applications', 'games', 'items', 'data', 'ownedGames', 'entitlements', 'nodes']) {
    const val = json[key];
    if (Array.isArray(val)) out.push(...val);
    else if (val && typeof val === 'object') out.push(...Object.values(val));
  }

  return out;
}

const UBI_JUNK_NAME_PATTERNS = [
  /web\s*marketing\s*site/i,
  /marketing\s*site/i,
  /webauth/i,
  /portal\s*web/i,
  /shell\s*client/i,
  /shell\s*overlay/i,
  /app\s*auth/i,
  /standalone\s*website/i,
  /\buplay\s*client\b/i,
  /\bubi\.com\b/i,
  /ubiconnect/i,
  /account\s*management/i,
  /customer\s*support/i,
  /^epic\s*games\s*web/i,
  /\bwebsite\b/i,
];

function pickUbisoftRecordType(record) {
  return String(
    record?.type
    || record?.applicationType
    || record?.spaceType
    || record?.category
    || record?.itemType
    || record?.entitlementType
    || ''
  ).toLowerCase();
}

function isUbisoftGraphqlOwnedGame(record) {
  return !!(record?.viewer?.meta || record?.ownedGames || record?.coverUrl || record?.lowBoxArtUrl);
}

function isUbisoftJunkRecord(record) {
  if (isUbisoftGraphqlOwnedGame(record)) return false;

  const name = pickUbisoftAppName(record);
  if (!name) return true;

  for (const pattern of UBI_JUNK_NAME_PATTERNS) {
    if (pattern.test(name)) return true;
  }

  const type = pickUbisoftRecordType(record);
  if (type && /web|website|portal|auth|shell|marketing|support|tool|service/.test(type)) {
    return true;
  }

  const cover = pickUbisoftAppCover(record);
  const playtime = Number(
    record?.totalPlayTimeInMinutes
    || record?.playTimeMinutes
    || record?.viewer?.meta?.playTime
    || 0,
  );
  if (!cover && playtime <= 0 && /\b(web|site|portal|client|overlay|auth)\b/i.test(name)) {
    return true;
  }

  return false;
}

const UBI_COVER_CDN_TEMPLATES = [
  'spaceCardAsset/boxArt_mobile.jpg?imwidth=320',
  'spaceCardAsset/boxArt_mobile.jpg',
  'spaceCardAsset/lowBoxArt.jpg',
  'spaceCardAsset/lowThumbnail.jpg',
  'spaceCardAsset/standardBoxArt.jpg',
];

function buildUbisoftCoverCandidates(spaceId) {
  const id = String(spaceId || '').trim();
  if (!UUID_RE.test(id)) return [];
  return UBI_COVER_CDN_TEMPLATES.map((path) => `https://ubiservices.cdn.ubi.com/${id}/${path}`);
}

function isUbisoftSpaceCardCdnUrl(url) {
  return /ubiservices\.cdn\.ubi\.com\/[^/]+\/spaceCardAsset\//i.test(String(url || ''));
}

function isUbisoftStoreCoverUrl(url) {
  return /store\.ubisoft\.com\/dw\/image\/v2\/ABBS_PRD\/on\/demandware\.static\/-\/Sites-masterCatalog\//i.test(String(url || ''));
}

function normalizeUbisoftStoreImageUrl(raw) {
  let url = String(raw || '').replace(/&amp;/g, '&').trim();
  if (!url) return '';
  if (url.startsWith('//')) url = `https:${url}`;
  if (url.startsWith('/')) url = `${UBI_STORE_BASE}${url}`;
  if (!/^https?:\/\//i.test(url)) url = `${UBI_STORE_BASE}/${url.replace(/^\/+/, '')}`;
  if (isUbisoftStoreCoverUrl(url)) {
    const base = url.split('?')[0];
    return `${base}?sw=300&sh=395&sm=fit`;
  }
  return url;
}

function extractUbisoftStoreCoverFromHtml(html) {
  const match = String(html || '').match(UBI_STORE_COVER_RE);
  return match ? normalizeUbisoftStoreImageUrl(match[0]) : '';
}

function normalizeUbisoftStoreSearchName(name) {
  return String(name || '')
    .replace(/[®™©]/g, '')
    .replace(/^[\s《]+|[\s》]+$/g, '')
    .trim();
}

function pickUbisoftEnglishName(app, fallback = '') {
  const candidates = [
    app?.name_en,
    app?.nameEn,
    app?.englishName,
    app?.gameIdentifier,
    app?.game_identifier,
    pickUbisoftAppName(app),
    fallback,
  ];
  for (const raw of candidates) {
    const value = normalizeUbisoftStoreSearchName(raw);
    if (!value || hasChineseText(value)) continue;
    if (/[a-z]/i.test(value)) return value;
  }
  return '';
}

function collectUbisoftStoreSearchNames(gameName, record) {
  const seen = new Set();
  const english = [];
  const other = [];
  const add = (raw, bucket) => {
    const value = normalizeUbisoftStoreSearchName(raw);
    if (!value) return;
    const key = value.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    bucket.push(value);
  };

  add(record?.name_en, english);
  add(record?.nameEn, english);
  add(record?.englishName, english);
  add(record?.gameIdentifier, english);
  add(record?.game_identifier, english);
  add(pickUbisoftEnglishName(record), english);

  const primary = normalizeUbisoftStoreSearchName(gameName || pickUbisoftAppName(record));
  if (primary) {
    if (hasChineseText(primary)) add(primary, other);
    else add(primary, english);
  }

  add(pickUbisoftAppName(record), hasChineseText(pickUbisoftAppName(record)) ? other : english);

  if (other.length) return [...english, ...other];
  return english;
}

function mergeUbisoftRecords(base, incoming) {
  const merged = { ...base, ...incoming };
  const candidates = [
    base?.name,
    incoming?.name,
    base?.name_cn,
    incoming?.name_cn,
    base?.name_en,
    incoming?.name_en,
    base?.nameEn,
    incoming?.nameEn,
    base?.gameIdentifier,
    incoming?.gameIdentifier,
    pickUbisoftAppName(base),
    pickUbisoftAppName(incoming),
  ].map((value) => String(value || '').trim()).filter(Boolean);

  let nameCn = String(base?.name_cn || incoming?.name_cn || '').trim();
  let nameEn = String(
    base?.name_en || incoming?.name_en || base?.nameEn || incoming?.nameEn || '',
  ).trim();

  for (const candidate of candidates) {
    if (hasChineseText(candidate) && !nameCn) nameCn = candidate;
    if (!hasChineseText(candidate) && /[a-z]/i.test(candidate) && !nameEn) nameEn = candidate;
  }

  if (!nameEn) nameEn = pickUbisoftEnglishName(merged, nameEn);
  if (nameCn) merged.name_cn = nameCn;
  if (nameEn) merged.name_en = nameEn;
  merged.name = nameCn || nameEn || pickUbisoftAppName(merged);
  return merged;
}

async function fetchUbisoftStoreCoverUrl(gameName, record, fetchImpl) {
  const slug = String(record?.productSlug || record?.slug || record?.storeSlug || '').trim().replace(/\.html$/i, '');
  const searchNames = collectUbisoftStoreSearchNames(gameName, record);
  const pages = [
    slug ? `${UBI_STORE_BASE}/us/${slug}.html` : '',
    ...searchNames.map((name) => `${UBI_STORE_BASE}/us/search?q=${encodeURIComponent(name)}`),
  ].filter(Boolean);

  for (const url of pages) {
    try {
      const res = await fetchImpl(url, {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'User-Agent': UBI_WEB_USER_AGENT,
        },
      });
      if (!res.ok) continue;
      const cover = extractUbisoftStoreCoverFromHtml(await res.text());
      if (cover) {
        logUbi('商店封面命中', { url: url.slice(0, 96), cover: cover.slice(0, 96) });
        return cover;
      }
    } catch (err) {
      logUbi('商店封面跳过', { url: url.slice(0, 96), error: err.message });
    }
  }

  return '';
}

async function pickWorkingUbisoftCoverUrl(spaceId, fetchImpl, options = {}) {
  const { gameName = '', record = null } = options;

  if (gameName || record?.productSlug || record?.slug) {
    const storeCover = await fetchUbisoftStoreCoverUrl(gameName, record, fetchImpl);
    if (storeCover) return storeCover;
  }

  const candidates = buildUbisoftCoverCandidates(spaceId);
  for (const url of candidates) {
    try {
      const res = await fetchImpl(url, { method: 'HEAD' });
      if (res.ok) return url;
    } catch {
      /* try next CDN path */
    }
  }

  return '';
}

function buildUbisoftCoverUrl(record, id = '') {
  const direct = pickUbisoftAppCover(record);
  if (direct) return direct;
  return '';
}

export function ubisoftCoverNeedsRepair(url) {
  const value = String(url || '').trim();
  if (!value) return true;
  if (isUbisoftStoreCoverUrl(value)) return false;
  if (isUbisoftSpaceCardCdnUrl(value)) return true;
  return false;
}

export function ubisoftGamesNeedCoverRepair(games) {
  return (games || []).some((game) => game?.platform === 'ubisoft' && ubisoftCoverNeedsRepair(game.cover_url));
}

function buildUbisoftStoreUrl(name, record) {
  const slug = String(record?.productSlug || record?.slug || '').trim();
  if (slug) return `https://store.ubisoft.com/us/${slug}.html`;
  if (name) return `https://store.ubisoft.com/us/search?q=${encodeURIComponent(name)}`;
  return 'https://store.ubisoft.com/';
}

function pickUbisoftAppName(app) {
  return String(
    app?.name
    || app?.displayName
    || app?.title
    || app?.applicationName
    || app?.application?.name
    || app?.game?.name
    || ''
  ).trim();
}

function pickUbisoftAppCover(app) {
  const candidates = [
    app?.thumbnailUrl,
    app?.imageUrl,
    app?.coverUrl,
    app?.thumbImageUrl,
    app?.backgroundUrl,
    app?.boxArtUrl,
    app?.image,
    app?.lowBoxArtUrl,
    app?.lowThumbnailUrl,
  ];
  for (const raw of candidates) {
    const value = String(raw || '').trim();
    if (!value) continue;
    if (isUbisoftStoreCoverUrl(value)) return normalizeUbisoftStoreImageUrl(value);
    if (isUbisoftSpaceCardCdnUrl(value)) continue;
    return value;
  }
  return '';
}

function isUbisoftIdLikeName(name, id) {
  const text = String(name || '').trim();
  if (!text) return true;
  if (text === id) return true;
  return UUID_RE.test(text);
}

function collectUbisoftLookupIds(record) {
  const ids = new Set();
  const primary = resolveUbisoftRecordId(record);
  if (primary) ids.add(primary);
  for (const key of ['spaceId', 'space_id', 'applicationId', 'application_id', 'productId', 'gameId']) {
    const val = String(record?.[key] || '').trim();
    if (UUID_RE.test(val)) ids.add(val);
  }
  return [...ids];
}

function normalizeUbisoftGame(app, fallbackId = '', metaMap = null) {
  const id = resolveUbisoftRecordId(app) || String(fallbackId || '').trim();
  const meta = metaMap?.get(id) || null;
  const rawName = pickUbisoftAppName(app);
  const metaName = meta?.name && !isUbisoftIdLikeName(meta.name, id) ? meta.name : '';
  const fallbackName = !isUbisoftIdLikeName(rawName, id) ? rawName : (metaName || rawName || id);
  const nameEn = pickUbisoftEnglishName(app, metaName || fallbackName);
  const nameCn = [app?.name_cn, metaName, rawName].find((value) => hasChineseText(String(value || ''))) || '';
  const displayName = nameCn || nameEn || fallbackName;
  const lastPlayed = app.lastPlayedAt || app.lastDatePlayed || app.lastPlayedDate
    || app.viewer?.meta?.lastPlayedDate || '';
  const cover = meta?.cover || buildUbisoftCoverUrl(app, id) || '';

  return {
    platform: 'ubisoft',
    appid: id,
    name: nameEn || displayName,
    name_cn: nameCn || displayName,
    name_en: nameEn || (!hasChineseText(displayName) ? displayName : ''),
    cover_url: cover,
    img_icon_url: cover,
    playtime_forever: Number(
      app.totalPlayTimeInMinutes || app.playTimeMinutes || app.playtimeMinutes
      || app.viewer?.meta?.playTime || 0,
    ),
    playtime_2weeks: 0,
    rtime_last_played: lastPlayed ? Math.floor(new Date(lastPlayed).getTime() / 1000) : 0,
    genres: [],
    tags: [],
    aliases: [],
    store_url: buildUbisoftStoreUrl(nameEn || displayName, app),
    slug: String(app?.slug || app?.storeSlug || app?.productSlug || '').trim(),
    productSlug: String(app?.productSlug || app?.storeSlug || app?.slug || '').trim(),
    sessions_played: Number(app.sessionsPlayed || 0),
    days_played: Number(app.daysPlayed || 0),
  };
}

function parseExpirationAt(value, fallbackMs = 6 * 60 * 60 * 1000) {
  if (value) {
    const parsed = Date.parse(String(value));
    if (Number.isFinite(parsed)) return parsed;
  }
  return Date.now() + fallbackMs;
}

function readHeaderValue(text, name) {
  const target = String(name).toLowerCase();
  for (const line of String(text || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(':');
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim().toLowerCase();
    if (key === target) return trimmed.slice(idx + 1).trim();
  }
  return '';
}

function extractTicketFromAuthorization(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const prefixed = text.match(/Ubi_v1\s+t=(.+)/is);
  if (prefixed?.[1]) return prefixed[1].trim();
  if (/^Ubi_v1\s+t=/i.test(text)) {
    return text.replace(/^Ubi_v1\s+t=/i, '').trim();
  }
  return '';
}

function parseHeaderDump(text) {
  const map = {};
  const lines = String(text || '').split(/\r?\n/).map((line) => line.trim());

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line) continue;

    const idx = line.indexOf(':');
    if (idx > 0) {
      const key = line.slice(0, idx).trim().toLowerCase();
      map[key] = line.slice(idx + 1).trim();
      continue;
    }

    const key = line.toLowerCase();
    if (!/^[a-z0-9-]+$/.test(key)) continue;
    let j = i + 1;
    while (j < lines.length && !lines[j]) j += 1;
    if (j >= lines.length) continue;
    if (lines[j].includes(':') && /^[a-z0-9-]+:/i.test(lines[j])) continue;
    map[key] = lines[j];
    i = j;
  }

  return map;
}

function extractFromHeaderDump(text) {
  const headers = parseHeaderDump(text);
  const authorization = headers.authorization || '';
  return {
    ticket: extractTicketFromAuthorization(authorization) || extractTicketFromAuthorization(text),
    sessionId: headers['ubi-sessionid'] || '',
    appId: headers['ubi-appid'] || '',
    expiration: headers.expiration || '',
    profileId: '',
  };
}

export function parseUbisoftAuthInput(raw) {
  const text = String(raw || '').trim();
  if (!text) {
    return { ticket: '', sessionId: '', appId: '', expiration: '', profileId: '' };
  }

  try {
    const json = JSON.parse(text);
    const ticket = String(
      json.ticket
      || extractTicketFromAuthorization(json.authorization || json.Authorization || '')
      || json.accessToken
      || ''
    ).trim();
    return {
      ticket,
      sessionId: String(json.sessionId || json.session_id || '').trim(),
      appId: String(json.appId || json.app_id || json['Ubi-AppId'] || '').trim(),
      expiration: String(json.expiration || json.expiresAt || '').trim(),
      profileId: String(json.profileId || json.profile_id || json.userId || '').trim(),
      tokenKind: inferUbisoftTokenKind({
        appId: json.appId || json.app_id || json['Ubi-AppId'] || '',
      }),
    };
  } catch {
    /* plain headers or ticket */
  }

  const fromHeaders = extractFromHeaderDump(text);
  if (fromHeaders.ticket) {
    const headerMap = parseHeaderDump(text);
    return {
      ...fromHeaders,
      tokenKind: inferUbisoftTokenKind(fromHeaders, headerMap),
    };
  }

  if (/^Ubi_v1\s+t=/i.test(text)) {
    return {
      ticket: extractTicketFromAuthorization(text),
      sessionId: '',
      appId: '',
      expiration: '',
      profileId: '',
    };
  }

  if (/^[A-Za-z0-9._-]{40,}$/.test(text) && !text.includes(' ')) {
    return {
      ticket: text.replace(/^Bearer\s+/i, '').trim(),
      sessionId: '',
      appId: '',
      expiration: '',
      profileId: '',
    };
  }

  return fromHeaders;
}

export async function resolveUbisoftSession(parsed, fetchImpl) {
  const ticket = String(parsed.ticket || '').trim();
  const sessionId = String(parsed.sessionId || '').trim();
  if (!ticket) {
    throw new Error('未找到育碧 ticket，请粘贴包含 Authorization: Ubi_v1 t=... 的请求头');
  }
  if (!sessionId) {
    throw new Error('未找到 Ubi-SessionId，请在 Network 里复制完整请求头（需含 ubi-sessionid）');
  }

  const appId = String(parsed.appId || UBI_CONNECT_APP_ID).trim() || UBI_CONNECT_APP_ID;
  const expiration = String(parsed.expiration || '').trim();
  const tokenKind = parsed.tokenKind || inferUbisoftTokenKind(parsed);
  const auth = {
    ticket,
    sessionId,
    appId,
    expiration,
    profileId: String(parsed.profileId || '').trim(),
    expiresAt: parseExpirationAt(expiration),
    tokenKind,
  };

  const profileRes = await ubiRequest(fetchImpl, '验证 Token', `${UBI_BASE}/v1/profiles/me`, {
    headers: ubiAuthHeadersFromAuth(auth, { useClub: tokenKind !== 'web' }),
  });
  const profileJson = await profileRes.json().catch(() => ({}));
  if (!profileRes.ok) {
    throw new Error(parseUbisoftError(profileJson, profileRes.status) || '育碧 Token 无效或已过期');
  }

  auth.profileId = auth.profileId || String(profileJson.profileId || profileJson.userId || '').trim();
  auth.userId = String(profileJson.userId || auth.profileId || '').trim();
  auth.displayName = profileJson.nameOnPlatform || profileJson.displayName || auth.profileId;
  if (profileJson.expiration) {
    auth.expiration = profileJson.expiration;
    auth.expiresAt = parseExpirationAt(profileJson.expiration);
  }

  if (!auth.profileId) {
    throw new Error('无法解析育碧账号 ID，请确认已粘贴 Connect / ubiservices 请求头');
  }

  await ensureUbisoftConnectSession(auth, fetchImpl);
  return auth;
}

function applyUbisoftSessionRefresh(auth, json) {
  if (json.ticket) auth.ticket = json.ticket;
  if (json.sessionId) auth.sessionId = json.sessionId;
  if (json.expiration) {
    auth.expiration = json.expiration;
    auth.expiresAt = parseExpirationAt(json.expiration);
  }
  if (json.profileId) {
    auth.profileId = auth.profileId || String(json.profileId || '').trim();
  }
  if (json.userId) auth.userId = String(json.userId || auth.profileId || '').trim();
}

async function promoteUbisoftSessionToClub(auth, fetchImpl) {
  if (String(auth.appId || '').toLowerCase() === UBI_CLUB_APP_ID.toLowerCase()) {
    auth.tokenKind = 'connect';
    return auth;
  }

  try {
    const res = await ubiRequest(fetchImpl, '切换 Club 会话', `${UBI_BASE}/v3/profiles/sessions`, {
      method: 'PUT',
      headers: {
        ...ubiAuthHeaders(auth.ticket, auth.sessionId, UBI_CLUB_APP_ID, auth.expiration || '', {
          tokenKind: 'connect',
        }),
        Accept: '*/*',
      },
    });
    if (!res.ok) {
      logUbi('Club 会话 切换失败', { status: res.status, fromAppId: auth.appId });
      return auth;
    }
    const json = await res.json().catch(() => ({}));
    applyUbisoftSessionRefresh(auth, json);
    auth.appId = UBI_CLUB_APP_ID;
    auth.tokenKind = 'connect';
    logUbi('Club 会话 已切换', { profileId: auth.profileId });
  } catch (err) {
    logUbi('Club 会话 切换跳过', { error: err.message });
  }
  return auth;
}

async function ensureUbisoftConnectSession(auth, fetchImpl) {
  await promoteUbisoftSessionToClub(auth, fetchImpl);

  try {
    const res = await ubiRequest(fetchImpl, 'Connect 会话', `${UBI_BASE}/v2/profiles/sessions`, {
      method: 'POST',
      headers: ubiAuthHeadersFromAuth(auth),
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const json = await res.json().catch(() => ({}));
      applyUbisoftSessionRefresh(auth, json);
      auth.appId = UBI_CLUB_APP_ID;
      auth.tokenKind = 'connect';
      logUbi('Connect 会话 已刷新', { profileId: auth.profileId });
    }
  } catch (err) {
    logUbi('Connect 会话 跳过', { error: err.message });
  }
  return auth;
}

function ubisoftGraphqlRecordHasPcPlatform(record) {
  const groups = record?.viewer?.meta?.ownedPlatformGroups;
  if (!Array.isArray(groups) || !groups.length) return true;
  for (const group of groups) {
    const items = Array.isArray(group) ? group : [group];
    for (const platform of items) {
      const type = String(platform?.type || platform?.name || '').toUpperCase();
      if (type === 'PC' || type.includes('PC')) return true;
    }
  }
  return false;
}

function parseUbisoftError(json, status) {
  const msg = json.message || json.error || json.errorCode || '';
  if (/two.?step|2fa|verification|challenge|mfa/i.test(msg)) {
    return '需要邮箱或双重验证码';
  }
  if (/not allowed|forbidden|403/i.test(msg) || status === 403) {
    return '育碧拒绝了登录请求，请稍后再试或使用网页连接';
  }
  if (/too many|429/i.test(msg) || status === 429) {
    return '育碧登录请求过于频繁，请稍后再试';
  }
  return msg || '育碧登录失败';
}

function buildUbisoftSession(json, email, appId) {
  const ticket = json.ticket;
  const sessionId = json.sessionId;
  const profileId = json.profileId || json.userId;
  if (!ticket || !sessionId || !profileId) {
    throw new Error('育碧登录响应异常');
  }

  return {
    ticket,
    sessionId,
    profileId,
    userId: json.userId || profileId,
    displayName: json.nameOnPlatform || json.displayName || email,
    email: String(email || '').trim(),
    appId,
    expiration: json.expiration || '',
    expiresAt: parseExpirationAt(json.expiration),
    tokenKind: 'password',
  };
}

function throwUbisoftNeedVerification(twoFactorAuthenticationTicket) {
  const err = new Error('请输入邮箱或双重验证码');
  err.code = 'UBISOFT_NEED_VERIFICATION';
  err.twoFactorAuthenticationTicket = twoFactorAuthenticationTicket;
  throw err;
}

async function completeUbisoftVerification(twoFactorTicket, verificationCode, appId, fetchImpl, email) {
  const code = String(verificationCode || '').trim();
  if (!code) throw new Error('请填写验证码');
  if (!twoFactorTicket) throw new Error('验证码会话已失效，请重新输入密码');

  const res = await ubiRequest(fetchImpl, '2FA 验证', `${UBI_BASE}/v3/profiles/sessions`, {
    method: 'POST',
    headers: {
      ...ubiLoginHeaders(appId),
      Authorization: `ubi_2fa_v1 t=${twoFactorTicket}`,
      'Ubi-2FACode': code,
    },
    body: JSON.stringify({ trustedDevice: null, rememberMe: true }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(parseUbisoftError(json, res.status));
  }

  if (json.twoFactorAuthenticationTicket && !json.ticket) {
    throwUbisoftNeedVerification(json.twoFactorAuthenticationTicket);
  }

  return buildUbisoftSession(json, email, appId);
}

async function tryUbisoftLogin(email, password, appId, fetchImpl, options = {}) {
  const verificationCode = String(options.verificationCode || '').trim();
  const twoFactorTicket = String(options.twoFactorAuthenticationTicket || '').trim();

  if (verificationCode && twoFactorTicket) {
    return completeUbisoftVerification(twoFactorTicket, verificationCode, appId, fetchImpl, email);
  }

  const cred = Buffer.from(`${String(email).trim()}:${String(password)}`, 'utf8').toString('base64');
  const res = await ubiRequest(fetchImpl, '密码登录', `${UBI_BASE}/v3/profiles/sessions`, {
    method: 'POST',
    headers: {
      ...ubiLoginHeaders(appId),
      Authorization: `Basic ${cred}`,
    },
    body: JSON.stringify({ rememberMe: true }),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (json.twoFactorAuthenticationTicket) {
      throwUbisoftNeedVerification(json.twoFactorAuthenticationTicket);
    }
    throw new Error(parseUbisoftError(json, res.status));
  }

  if (json.twoFactorAuthenticationTicket && !json.ticket) {
    throwUbisoftNeedVerification(json.twoFactorAuthenticationTicket);
  }

  return buildUbisoftSession(json, email, appId);
}

export async function loginUbisoft(email, password, fetchImpl, options = {}) {
  let lastError = null;
  for (const appId of [UBI_CLUB_APP_ID, UBI_CONNECT_APP_ID, UBI_CONNECT_APP_ID_ALT]) {
    try {
      const session = await tryUbisoftLogin(email, password, appId, fetchImpl, options);
      await ensureUbisoftConnectSession(session, fetchImpl);
      return session;
    } catch (err) {
      if (err.code === 'UBISOFT_NEED_VERIFICATION') throw err;
      lastError = err;
    }
  }
  throw lastError || new Error('育碧登录失败');
}

function ubiGraphqlHeaders(auth, appId, tokenKind = 'connect') {
  const origin = tokenKind === 'web' ? 'https://www.ubisoft.com' : 'https://connect.ubisoft.com';
  return {
    ...ubiAuthHeaders(auth.ticket, auth.sessionId, appId, auth.expiration || '', { tokenKind }),
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Origin: origin,
    Referer: `${origin}/`,
  };
}

async function fetchUbisoftGraphQLGames(auth, fetchImpl) {
  const attempts = [
    { appId: UBI_CLUB_APP_ID, tokenKind: 'connect' },
    { appId: UBI_CONNECT_APP_ID, tokenKind: 'connect' },
    { appId: UBI_CONNECT_APP_ID_ALT, tokenKind: 'connect' },
    { appId: UBI_WEB_APP_ID, tokenKind: 'web' },
  ];
  const byId = new Map();

  for (const attempt of attempts) {
    const label = `GraphQL 已拥有游戏 (${attempt.appId.slice(0, 8)})`;
    try {
      const res = await ubiRequest(fetchImpl, label, `${UBI_BASE}/v1/profiles/me/uplay/graphql`, {
        method: 'POST',
        headers: ubiGraphqlHeaders(auth, attempt.appId, attempt.tokenKind),
        body: JSON.stringify({
          operationName: 'AllGames',
          variables: { owned: true },
          query: UBI_GRAPHQL_OWNED_GAMES,
        }),
      });
      if (!res.ok) continue;
      const json = await res.json();
      const nodes = json?.data?.viewer?.ownedGames?.nodes || [];
      const totalCount = json?.data?.viewer?.ownedGames?.totalCount || nodes.length;
      logUbi('GraphQL 已拥有游戏 响应', { appId: attempt.appId, nodes: nodes.length, totalCount });
      for (const node of nodes) {
        if (!ubisoftGraphqlRecordHasPcPlatform(node)) continue;
        const id = resolveUbisoftRecordId(node);
        if (!id || byId.has(id)) continue;
        byId.set(id, node);
      }
    } catch (err) {
      logUbi(`${label} 跳过`, { error: err.message });
    }
  }

  const games = [...byId.values()];
  if (games.length) {
    logUbi('GraphQL 已拥有游戏 合并完成', { count: games.length });
  }
  return games;
}

async function fetchUbisoftEntitlements(auth, fetchImpl) {
  const appIds = [...new Set([
    auth.appId,
    UBI_CONNECT_APP_ID,
    UBI_CLUB_APP_ID,
    UBI_CONNECT_APP_ID_ALT,
  ].filter(Boolean).map(String))];

  for (const appId of appIds) {
    const headers = ubiAuthHeaders(
      auth.ticket,
      auth.sessionId,
      appId,
      auth.expiration || '',
      { tokenKind: 'connect' },
    );
    const res = await ubiRequest(
      fetchImpl,
      `Ubisoft Connect 权益 (${appId.slice(0, 8)})`,
      `${UBI_API_BASE}/v1/profiles/me/global/ubiconnect/entitlement/api/entitlements`,
      { headers },
    );
    if (!res.ok) continue;
    const json = await res.json();
    const records = flattenUbisoftRecords(json);
    const games = records.filter((item) => {
      if (isUbisoftJunkRecord(item)) return false;
      const type = pickUbisoftRecordType(item);
      return !type || type.includes('game') || type.includes('product');
    });
    logUbi('Ubisoft Connect 权益 命中', { count: games.length, appId });
    return games;
  }

  return [];
}

async function fetchUbisoftPlayedGames(profileId, auth, fetchImpl) {
  const headers = ubiAuthHeadersFromAuth(auth);
  const endpoints = [
    { label: '已玩游戏', url: `${UBI_BASE}/v1/profiles/${profileId}/gamesplayed` },
    { label: '已玩游戏批量', url: `${UBI_BASE}/v1/profiles/gamesplayed?profileIds=${profileId}` },
  ];

  const all = [];
  await Promise.all(endpoints.map(async ({ label, url }) => {
    try {
      const res = await ubiRequest(fetchImpl, label, url, { headers });
      if (!res.ok) return;
      const json = await res.json();
      const records = flattenUbisoftRecords(json);
      const filtered = records.filter((item) => !isUbisoftJunkRecord(item));
      if (filtered.length) {
        logUbi(`${label} 命中`, { count: filtered.length, raw: records.length, url });
        all.push(...filtered);
      }
    } catch (err) {
      logUbi(`${label} 跳过`, { url, error: err.message });
    }
  }));

  return all;
}

async function fetchUbisoftApplicationsBatch(batch, auth, fetchImpl, paramName) {
  const headers = ubiAuthHeadersFromAuth(auth);
  const urls = [
    `${UBI_API_BASE}/v2/applications?${paramName}=${batch.join(',')}`,
    `${UBI_BASE}/v2/applications?${paramName}=${batch.join(',')}`,
  ];
  for (const url of urls) {
    try {
      const res = await ubiRequest(fetchImpl, `应用元数据 ${paramName}`, url, {
        headers,
        quietNotFound: true,
      });
      if (!res.ok) continue;
      const json = await res.json();
      const apps = Array.isArray(json) ? json : flattenUbisoftRecords(json);
      if (apps.length) return apps;
    } catch (err) {
      logUbi('应用元数据 跳过', { paramName, error: err.message });
    }
  }
  return [];
}

function mergeUbisoftAppMeta(metaMap, app, idAliases) {
  const name = pickUbisoftAppName(app);
  const cover = pickUbisoftAppCover(app);
  if (!name && !cover) return;
  for (const lookupId of collectUbisoftLookupIds(app)) {
    const canonical = idAliases.get(lookupId) || lookupId;
    const prev = metaMap.get(canonical) || {};
    metaMap.set(canonical, {
      name: (!isUbisoftIdLikeName(name, canonical) ? name : prev.name) || prev.name,
      cover: cover
        || (prev.cover && !ubisoftCoverNeedsRepair(prev.cover) ? prev.cover : ''),
    });
  }
}

async function enrichUbisoftApplicationMeta(records, auth, fetchImpl) {
  const idsNeedingMeta = new Set();
  const idAliases = new Map();
  const metaMap = new Map();

  for (const record of records) {
    const canonical = resolveUbisoftRecordId(record);
    if (!canonical || isUbisoftJunkRecord(record)) continue;

    const name = pickUbisoftAppName(record);
    const directCover = pickUbisoftAppCover(record);
    const needsName = isUbisoftIdLikeName(name, canonical);
    const needsCover = !directCover;
    if (!needsName && !needsCover) continue;

    for (const lookupId of collectUbisoftLookupIds(record)) {
      idsNeedingMeta.add(lookupId);
      idAliases.set(lookupId, canonical);
    }
  }

  if (!idsNeedingMeta.size) return metaMap;

  const idList = [...idsNeedingMeta];
  for (let i = 0; i < idList.length; i += 20) {
    const batch = idList.slice(i, i + 20);
    for (const paramName of ['spaceIds', 'applicationIds']) {
      const apps = await fetchUbisoftApplicationsBatch(batch, auth, fetchImpl, paramName);
      for (const app of apps) {
        mergeUbisoftAppMeta(metaMap, app, idAliases);
      }
    }
  }

  const stillMissing = [...new Set([...idAliases.values()])].filter((id) => {
    const meta = metaMap.get(id);
    return !meta?.name || isUbisoftIdLikeName(meta.name, id) || !meta?.cover;
  });

  for (const lookupId of stillMissing.slice(0, 24)) {
    const apps = await fetchUbisoftApplicationsBatch([lookupId], auth, fetchImpl, 'spaceIds');
    for (const app of apps) {
      mergeUbisoftAppMeta(metaMap, app, idAliases);
    }
  }

  const coverIds = [...new Set([...idAliases.values(), ...records.map((r) => resolveUbisoftRecordId(r)).filter(Boolean)])];
  const recordById = new Map();
  for (const record of records) {
    const id = resolveUbisoftRecordId(record);
    if (id) recordById.set(id, record);
  }

  for (const id of coverIds) {
    const prev = metaMap.get(id) || {};
    if (prev.cover && !ubisoftCoverNeedsRepair(prev.cover)) {
      metaMap.set(id, { ...prev, cover: normalizeUbisoftStoreImageUrl(prev.cover) || prev.cover });
      continue;
    }

    const source = recordById.get(id) || {};
    const gameName = prev.name && !isUbisoftIdLikeName(prev.name, id)
      ? prev.name
      : pickUbisoftAppName(source);
    const working = await pickWorkingUbisoftCoverUrl(id, fetchImpl, {
      gameName,
      record: source,
    });
    if (working) {
      metaMap.set(id, {
        name: prev.name || gameName || '',
        cover: working,
      });
    }
    await sleep(120);
  }

  return metaMap;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function repairUbisoftGameCovers(games, fetchImpl) {
  const pending = (games || []).filter((game) => game?.platform === 'ubisoft' && ubisoftCoverNeedsRepair(game.cover_url));
  if (!pending.length) return games;

  logUbi('封面补全开始', { pending: pending.length });
  for (const game of pending) {
    const cover = await pickWorkingUbisoftCoverUrl(game.appid, fetchImpl, {
      gameName: game.name_cn || game.name,
      record: {
        productSlug: game.productSlug,
        slug: game.slug,
        storeSlug: game.productSlug || game.slug,
        name_en: game.name_en,
        nameEn: game.name_en,
      },
    });
    if (cover) {
      game.cover_url = cover;
      game.img_icon_url = cover;
    }
    await sleep(120);
  }

  return games;
}

export async function fetchUbisoftGames(auth, fetchImpl) {
  logUbi('开始拉取游戏库', { profileId: auth.profileId });
  const started = Date.now();

  await ensureUbisoftConnectSession(auth, fetchImpl);

  const localGames = readUbisoftLocalOwnedGames(auth.profileId, logUbi);
  const [graphqlGames, entitlementGames, playedGames] = await Promise.all([
    fetchUbisoftGraphQLGames(auth, fetchImpl),
    fetchUbisoftEntitlements(auth, fetchImpl),
    fetchUbisoftPlayedGames(auth.profileId, auth, fetchImpl),
  ]);

  const byId = new Map();
  for (const record of [...localGames, ...graphqlGames]) {
    const id = resolveUbisoftRecordId(record);
    if (!id) continue;
    const prev = byId.get(id);
    byId.set(id, prev ? mergeUbisoftRecords(prev, record) : record);
  }

  for (const record of [...entitlementGames, ...playedGames]) {
    const id = resolveUbisoftRecordId(record);
    if (!id || byId.has(id) || isUbisoftJunkRecord(record)) continue;
    byId.set(id, record);
  }

  const merged = [...byId.values()];
  const metaMap = await enrichUbisoftApplicationMeta(merged, auth, fetchImpl);
  const games = [];

  for (const app of merged) {
    const id = resolveUbisoftRecordId(app);
    if (!id) continue;

    const meta = metaMap.get(id);
    const enriched = meta
      ? {
        ...app,
        name: meta.name || app.name,
        coverUrl: meta.cover || app.coverUrl,
        thumbnailUrl: meta.cover || app.thumbnailUrl,
      }
      : app;
    const game = normalizeUbisoftGame(enriched, id, metaMap);
    if (isUbisoftJunkRecord({ ...app, name: game.name })) continue;
    games.push(game);
  }

  games.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
  logUbi('游戏库合并完成', {
    count: games.length,
    local: localGames.length,
    graphql: graphqlGames.length,
    entitlements: entitlementGames.length,
    played: playedGames.length,
    merged: merged.length,
    ms: Date.now() - started,
  });

  if (!games.length && merged.length) {
    const sample = merged[0];
    logUbi('解析失败样本', {
      type: typeof sample,
      keys: sample && typeof sample === 'object' ? Object.keys(sample).slice(0, 12) : [],
    });
  }

  if (!games.length) {
    throw new Error('未获取到育碧游戏列表，请确认账号已拥有游戏或重新连接');
  }

  await repairUbisoftGameCovers(games, fetchImpl);
  return games;
}

export function sanitizeUbisoftGameList(games) {
  return (games || []).filter((game) => {
    if (!game) return false;
    return !isUbisoftJunkRecord({
      name: game.name,
      coverUrl: game.cover_url,
      spaceId: game.appid,
    });
  });
}

export async function validateUbisoftSession(auth, fetchImpl) {
  const url = auth.profileId
    ? `${UBI_BASE}/v1/profiles/${auth.profileId}`
    : `${UBI_BASE}/v1/profiles/me`;
  const res = await ubiRequest(fetchImpl, '验证会话', url, {
    headers: ubiAuthHeadersFromAuth(auth),
  });
  if (!res.ok) throw new Error('育碧会话已过期，请重新登录');
  const json = await res.json();
  return {
    profileId: auth.profileId,
    displayName: json.nameOnPlatform || json.displayName || auth.displayName,
  };
}
