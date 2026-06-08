import { readEpicLocalLibraryRecords, mergeEpicLibraryRecords } from './epic-local.js';

const EPIC_LIBRARY_HOST = 'library-service.live.use1a.on.epicgames.com';
const EPIC_DEV_API_HOST = 'api.epicgames.dev';
const EPIC_LIBRARY_V1 = `https://${EPIC_DEV_API_HOST}/epic/library/v1`;
const EPIC_ACCOUNT_HOST = 'account-public-service-prod03.ol.epicgames.com';
const EPIC_CATALOG_HOST = 'catalog-public-service-prod06.ol.epicgames.com';
const EPIC_LAUNCHER_CLIENT_ID = '34a02cf8f4414e29b15921876da36f9a';
const EPIC_LAUNCHER_CLIENT_SECRET = 'daafbccc737745039dffe53d94fc76cf';
const EPIC_BROWSER_AUTH_URL = `https://www.epicgames.com/id/login?redirectUrl=${encodeURIComponent(`https://www.epicgames.com/id/api/redirect?clientId=${EPIC_LAUNCHER_CLIENT_ID}&responseType=code`)}`;
const EPIC_LAUNCHER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EpicGamesLauncher/1.0';
const EPIC_WEB_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

let epicLogger = null;

export function setEpicLogger(fn) {
  epicLogger = typeof fn === 'function' ? fn : null;
}

function logEpic(label, detail) {
  if (epicLogger) epicLogger(label, detail);
}

async function epicRequest(fetchImpl, label, url, options = {}, retries = 2) {
  const method = options.method || 'GET';
  const started = Date.now();
  logEpic('→ 请求', { label, method, url });
  try {
    const res = retries > 0
      ? await epicFetchWithRetry(fetchImpl, url, options, retries)
      : await fetchImpl(url, options);
    logEpic('← 响应', { label, status: res.status, ok: res.ok, ms: Date.now() - started });
    return res;
  } catch (err) {
    logEpic('✕ 异常', {
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

async function readEpicErrorBody(res) {
  try {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      return json.errorMessage || json.message || json.errorCode || text.slice(0, 300);
    } catch {
      return text.slice(0, 300);
    }
  } catch {
    return '';
  }
}

function wrapEpicNetworkError(err, label) {
  const code = err?.cause?.code || err?.code || '';
  const detail = err?.cause?.message || err?.message || 'fetch failed';
  if (/fetch failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|ECONNREFUSED/i.test(`${code} ${detail}`)) {
    return new Error(`${label}网络异常（${code || detail}），请检查代理/VPN 或稍后重试`);
  }
  return err instanceof Error ? err : new Error(String(err));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function epicFetchWithRetry(fetchImpl, url, options, retries = 3) {
  let lastError = null;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      return await fetchImpl(url, options);
    } catch (err) {
      lastError = err;
      if (attempt < retries - 1) {
        await sleep(400 * (attempt + 1));
      }
    }
  }
  throw lastError;
}

function epicHeaders(accessToken) {
  const token = String(accessToken || '').trim();
  const isWebToken = token.startsWith('eg1~');
  return {
    Authorization: `Bearer ${token}`,
    'User-Agent': isWebToken ? EPIC_WEB_USER_AGENT : EPIC_LAUNCHER_USER_AGENT,
    Accept: 'application/json',
  };
}

function launcherBasicAuth() {
  return Buffer.from(`${EPIC_LAUNCHER_CLIENT_ID}:${EPIC_LAUNCHER_CLIENT_SECRET}`).toString('base64');
}

function parseCookiePairs(text) {
  const map = new Map();
  for (const part of String(text || '').split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) continue;
    try {
      map.set(key, decodeURIComponent(value));
    } catch {
      map.set(key, value);
    }
  }
  return map;
}

function readCookieValue(text, name) {
  const target = String(name).toLowerCase();
  for (const [key, value] of parseCookiePairs(text)) {
    if (key.toLowerCase() === target) return value;
  }
  const inline = String(text || '').match(new RegExp(`(?:^|[;\\s])${name}=([^;\\s]+)`, 'i'));
  return inline ? decodeURIComponent(inline[1]) : '';
}

function extractFromHeaderDump(text) {
  let accessToken = '';
  let refreshToken = '';
  let accountId = '';

  for (const line of String(text || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase();
    if (lower.startsWith('cookie:') || lower === 'cookie' || lower.startsWith('cookie ')) {
      const cookiePart = trimmed.replace(/^cookie\s*:?\s*/i, '');
      accessToken = accessToken || readCookieValue(cookiePart, 'EPIC_EG1');
      refreshToken = refreshToken || readCookieValue(cookiePart, 'REFRESH_EPIC_EG1');
    }

    const refererMatch = trimmed.match(/referer\s*:?\s*https?:\/\/store\.epicgames\.com\/u\/([a-f0-9]{32})/i);
    if (refererMatch) accountId = refererMatch[1];
  }

  accessToken = accessToken || readCookieValue(text, 'EPIC_EG1');
  refreshToken = refreshToken || readCookieValue(text, 'REFRESH_EPIC_EG1');

  if (!accountId) {
    const refererInline = text.match(/store\.epicgames\.com\/u\/([a-f0-9]{32})/i);
    if (refererInline) accountId = refererInline[1];
  }

  return { accessToken, refreshToken, accountId };
}

function extractTokenFromPaste(raw) {
  const text = String(raw || '').trim();
  if (!text) return { accessToken: '', accountId: '', refreshToken: '' };

  try {
    const json = JSON.parse(text);
    return {
      accessToken: String(json.access_token || json.accessToken || json.token || json.EPIC_EG1 || '').trim(),
      accountId: String(json.account_id || json.accountId || '').trim(),
      refreshToken: String(json.refresh_token || json.refreshToken || json.REFRESH_EPIC_EG1 || '').trim(),
    };
  } catch {
    /* plain token or header dump */
  }

  const fromHeaders = extractFromHeaderDump(text);
  if (fromHeaders.accessToken) return fromHeaders;

  const eg1Match = text.match(/eg1~ey[A-Za-z0-9._-]+/);
  if (eg1Match) {
    return {
      accessToken: eg1Match[0],
      accountId: '',
      refreshToken: readCookieValue(text, 'REFRESH_EPIC_EG1'),
    };
  }

  const jwt = text.match(/ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
  return {
    accessToken: jwt ? jwt[0] : text.replace(/^Bearer\s+/i, '').trim(),
    accountId: '',
    refreshToken: '',
  };
}

function decodeJwtPayload(token) {
  try {
    const normalized = String(token).replace(/^eg1~/, '');
    const part = normalized.split('.')[1];
    if (!part) return null;
    let padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const remainder = padded.length % 4;
    if (remainder) padded += '='.repeat(4 - remainder);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

function parseExpiresAt(json) {
  if (json.expires_at) {
    const parsed = Date.parse(json.expires_at);
    if (Number.isFinite(parsed)) return parsed;
  }
  const expiresIn = Number(json.expires_in);
  if (Number.isFinite(expiresIn) && expiresIn > 0) return Date.now() + expiresIn * 1000;
  const payload = decodeJwtPayload(json.access_token || '');
  if (payload?.exp) return payload.exp * 1000;
  return Date.now() + 2 * 60 * 60 * 1000;
}

function resolveAccountId(accessToken, accountId) {
  if (accountId) return accountId;
  const payload = decodeJwtPayload(accessToken);
  return String(payload?.sub || payload?.account_id || '').trim();
}

function resolveDisplayName(accessToken, displayName) {
  if (displayName) return displayName;
  const payload = decodeJwtPayload(accessToken);
  return String(payload?.dn || payload?.displayName || '').trim();
}

function normalizePlaytimeMap(records) {
  const map = new Map();
  for (const item of records || []) {
    const id = item.artifactId || item.catalogItemId || item.id;
    if (!id) continue;
    const seconds = Number(item.totalTime || item.playtime || item.playTime || 0);
    map.set(String(id), Math.round(seconds / 60));
  }
  return map;
}

function isInternalEpicId(text) {
  const value = String(text || '').trim();
  if (!value) return false;
  if (/^[0-9a-f]{32}$/i.test(value)) return true;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function resolveEpicDisplayTitle(candidates, fallbackId) {
  for (const raw of candidates) {
    const value = String(raw || '').trim();
    if (value && !isInternalEpicId(value)) return value;
  }
  const id = String(fallbackId || '').trim();
  return id ? `Epic 游戏 ·${id.slice(-6)}` : 'Epic 游戏';
}

function sanitizeEpicGameNames(games) {
  return games.map((game) => {
    if (game.platform !== 'epic') return game;
    const title = resolveEpicDisplayTitle([game.name_cn, game.name], game.appid);
    if (title === game.name && title === game.name_cn) return game;
    return { ...game, name: title, name_cn: title };
  });
}

function readCustomAttribute(item, key) {
  const attrs = item?.customAttributes;
  if (!attrs) return '';
  if (Array.isArray(attrs)) {
    const found = attrs.find((entry) => entry.key === key);
    return found?.value || '';
  }
  const entry = attrs[key];
  if (!entry) return '';
  return typeof entry === 'string' ? entry : (entry.value || '');
}

const EPIC_STORE_BASE = 'https://store.epicgames.com';

function isEpicInternalUrlSlug(value) {
  const slug = String(value || '').trim();
  if (!slug) return true;
  if (/^[a-f0-9]{32}$/i.test(slug)) return true;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) return true;
  return false;
}

function normalizeEpicProductSlug(raw) {
  const slug = String(raw || '').trim().replace(/^\/+|\/+$/g, '');
  if (!slug || isEpicInternalUrlSlug(slug)) return '';
  return slug;
}

function catalogItemSlug(item) {
  if (!item) return '';
  const fromAttr = readCustomAttribute(item, 'com.epicgames.app.productSlug');
  if (fromAttr) return normalizeEpicProductSlug(fromAttr);
  if (item.productSlug) return normalizeEpicProductSlug(item.productSlug);
  const urlSlug = String(item.urlSlug || '').trim();
  if (urlSlug && !isEpicInternalUrlSlug(urlSlug)) return urlSlug;
  return '';
}

function buildEpicStoreProductUrl(slug) {
  const normalized = normalizeEpicProductSlug(slug);
  if (!normalized) return '';
  return `${EPIC_STORE_BASE}/p/${normalized}`;
}

function buildEpicStoreSearchUrl(name) {
  const query = String(name || '').trim();
  if (!query) return '';
  return `${EPIC_STORE_BASE}/browse?q=${encodeURIComponent(query)}`;
}

function isValidEpicProductStoreUrl(url) {
  const value = String(url || '').trim();
  if (!value) return false;
  try {
    const parsed = new URL(value);
    if (!/store\.epicgames\.com$/i.test(parsed.hostname)) return false;
    return /^\/(?:[a-z]{2}(?:-[A-Z]{2})?\/)?p\//i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function isLegacyEpicBrowseNamespaceUrl(url) {
  return /store\.epicgames\.com\/(?:[a-z]{2}(?:-[A-Z]{2})?\/)?browse\?namespace=/i.test(String(url || ''));
}

function epicStoreUrlNeedsRepair(game) {
  if (game.platform !== 'epic') return false;
  const url = String(game.store_url || '').trim();
  if (!url) return true;
  if (isLegacyEpicBrowseNamespaceUrl(url)) return true;
  if (isValidEpicProductStoreUrl(url)) return false;
  if (/store\.epicgames\.com\/(?:[a-z]{2}(?:-[A-Z]{2})?\/)?browse\?q=/i.test(url)) return false;
  return true;
}

function resolveEpicStoreUrl(slug, gameName, existingUrl = '') {
  const productUrl = buildEpicStoreProductUrl(slug);
  if (productUrl) return productUrl;

  const existing = String(existingUrl || '').trim();
  if (existing && !isLegacyEpicBrowseNamespaceUrl(existing)) {
    if (isValidEpicProductStoreUrl(existing)) return existing;
    if (/browse\?q=/i.test(existing)) return existing;
  }

  return buildEpicStoreSearchUrl(gameName);
}

function normalizeEpicSearchText(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^\w\s\u4e00-\u9fff]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function epicNamesMatch(a, b) {
  if (!a || !b) return false;
  if (a === b) return true;
  return a.includes(b) || b.includes(a);
}

function resolveEpicNamespace(record) {
  if (record?.namespace) return String(record.namespace).trim();
  if (record?.catalogItemNamespace) return String(record.catalogItemNamespace).trim();
  const metadata = record?.metadata || {};
  if (metadata.namespace) return String(metadata.namespace).trim();
  const composite = String(record?.id || record?.offerId || record?.itemId || '').trim();
  if (composite.includes(':')) return composite.split(':')[0].trim();
  return '';
}

function extractDevApiTitleMeta(record) {
  if (record?.title && typeof record.title === 'object') {
    const images = record.title.keyImages || record.title.images || [];
    return {
      title: record.title.displayName || record.title.title || record.title.name || '',
      cover: images.find((img) => img?.url)?.url || record.title.imageUrl || '',
    };
  }
  if (typeof record?.title === 'string' && record.title.trim()) {
    return { title: record.title.trim(), cover: '' };
  }
  if (Array.isArray(record?.titles)) {
    for (const item of record.titles) {
      const images = item?.keyImages || item?.images || [];
      const title = item?.displayName || item?.title || item?.localizedTitle || item?.name || '';
      const cover = images.find((img) => img?.url)?.url || item?.imageUrl || '';
      if (title || cover) return { title, cover };
    }
  }
  return null;
}

function catalogItemTitle(item) {
  if (!item) return '';
  return item.title || readCustomAttribute(item, 'com.epicgames.app.shortTitle') || '';
}

function pickCatalogCover(item) {
  const images = item?.keyImages || [];
  const preferred = images.find((img) => /thumbnail|dieselstorefrontwide|dieselstorefront|offer|gamebox|vault/i.test(img.type || ''));
  return preferred?.url || images[0]?.url || item?.url || '';
}

function extractRecordCover(record) {
  const metadata = record?.metadata || {};
  const catalogItem = record?.catalogItem || {};
  const keyImages = catalogItem.keyImages || metadata.keyImages || record.keyImages || [];
  return record.imageUrl
    || record.thumbnailUrl
    || record.coverUrl
    || keyImages.find((img) => /thumbnail|dieselstorefrontwide|dieselstorefront|offer|gamebox|vault/i.test(img.type || ''))?.url
    || keyImages[0]?.url
    || pickCatalogCover(record._catalogItem)
    || '';
}

function applyCatalogPatch(game, catalog, catalogMap) {
  const mainRef = catalog.mainGameItem;
  const mainCatalog = mainRef
    ? catalogMap.get(`${mainRef.namespace}:${mainRef.id}`)
    : null;
  const displaySource = mainCatalog || catalog;
  const title = catalogItemTitle(displaySource) || catalogItemTitle(catalog);
  const slug = catalogItemSlug(displaySource) || catalogItemSlug(catalog);
  const cover = pickCatalogCover(displaySource) || pickCatalogCover(catalog);

  return {
    ...game,
    name: title || game.name,
    name_cn: title || game.name_cn,
    cover_url: cover || game.cover_url,
    img_icon_url: cover || game.img_icon_url,
    store_url: resolveEpicStoreUrl(slug, title || game.name_cn || game.name, game.store_url),
  };
}

function buildStoreUrl(record, catalogItem) {
  const metadata = record?.metadata || {};
  const slug = normalizeEpicProductSlug(metadata.slug || metadata.pageSlug)
    || catalogItemSlug(catalogItem);
  const title = resolveEpicDisplayTitle([
    metadata.title,
    metadata.displayName,
    record.title,
    catalogItemTitle(catalogItem),
    record.appName,
  ], record.catalogItemId || record.id);
  return resolveEpicStoreUrl(slug, title);
}

async function fetchEpicStoreSlugFromOffers(namespace, gameName, fetchImpl, accessToken = '') {
  const ns = String(namespace || '').trim();
  const name = String(gameName || '').trim();
  if (!ns || !name) return '';

  const params = new URLSearchParams({
    country: 'CN',
    locale: 'zh-CN',
    keywords: name,
    count: '8',
  });
  const url = `https://${EPIC_CATALOG_HOST}/catalog/api/shared/namespace/${ns}/offers?${params}`;
  const headers = {
    Accept: 'application/json',
    'User-Agent': EPIC_WEB_USER_AGENT,
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  try {
    const res = await epicRequest(fetchImpl, `Offers search ${ns}`, url, { headers }, 1);
    if (!res.ok) return '';
    const json = await res.json().catch(() => ({}));
    const target = normalizeEpicSearchText(name);
    for (const offer of json.elements || []) {
      const offerTitle = normalizeEpicSearchText(offer.title || offer.internalName || '');
      if (!offerTitle || !epicNamesMatch(offerTitle, target)) continue;
      const slug = normalizeEpicProductSlug(
        readCustomAttribute(offer, 'com.epicgames.app.productSlug') || offer.productSlug || '',
      );
      if (slug) return slug;
    }
  } catch (err) {
    logEpic('Offers search 异常', { namespace: ns, error: err.message });
  }

  return '';
}

async function repairEpicStoreUrls(games, fetchImpl, accessToken = '') {
  const pending = games.filter((game) => game.platform === 'epic' && epicStoreUrlNeedsRepair(game));
  if (!pending.length) return games;

  logEpic('商店链接补全开始', { pending: pending.length });
  for (const game of pending) {
    const title = game.name_cn || game.name;
    let slug = '';
    if (game.namespace && title) {
      slug = await fetchEpicStoreSlugFromOffers(game.namespace, title, fetchImpl, accessToken);
    }
    game.store_url = resolveEpicStoreUrl(slug, title, game.store_url);
    await sleep(60);
  }

  return games;
}

function needsCatalogEnrichment(record) {
  const metadata = record?.metadata || {};
  const catalogItem = record?.catalogItem || {};
  const title = catalogItem.title || metadata.title || metadata.displayName || record.title || '';
  if (title && !isInternalEpicId(title)) return false;
  const appName = record.appName || title;
  return isInternalEpicId(appName) || !title;
}

async function fetchCatalogItemsForNamespace(namespace, ids, fetchImpl, accessToken = '') {
  const map = new Map();
  const batchSize = 40;
  const headers = {
    Accept: 'application/json',
    'User-Agent': EPIC_WEB_USER_AGENT,
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const params = new URLSearchParams({
      id: batch.join(','),
      includeDLCDetails: 'true',
      includeMainGameDetails: 'true',
      country: 'CN',
      locale: 'zh-CN',
    });
    const url = `https://${EPIC_CATALOG_HOST}/catalog/api/shared/namespace/${namespace}/bulk/items?${params}`;

    try {
      const res = await epicRequest(fetchImpl, `Catalog bulk ${namespace}`, url, { headers }, 2);
      if (!res.ok) {
        const detail = await readEpicErrorBody(res);
        logEpic('Catalog bulk 失败', { namespace, status: res.status, batch: batch.length, detail });
        continue;
      }

      const json = await res.json().catch(() => ({}));
      let count = 0;
      for (const [id, item] of Object.entries(json || {})) {
        if (item) {
          map.set(id, item);
          count += 1;
        }
      }
      logEpic('Catalog bulk 成功', { namespace, batch: batch.length, matched: count });
    } catch (err) {
      logEpic('Catalog bulk 异常', { namespace, batch: batch.length, error: err.message });
    }
  }

  for (const id of ids) {
    if (map.has(id)) continue;
    const url = `https://${EPIC_CATALOG_HOST}/catalog/api/shared/namespace/${namespace}/items/${id}?locale=zh-CN&country=CN`;
    try {
      const res = await epicRequest(fetchImpl, `Catalog item ${namespace}`, url, { headers }, 1);
      if (!res.ok) continue;
      const item = await res.json().catch(() => null);
      if (item?.id || item?.title) map.set(id, item);
    } catch {
      /* 单条失败忽略 */
    }
  }

  return map;
}

async function enrichEpicLibraryRecords(records, fetchImpl, accessToken = '') {
  const pending = records.filter(needsCatalogEnrichment);
  if (!pending.length) return records;

  const byNamespace = new Map();
  for (const record of pending) {
    const ns = resolveEpicNamespace(record);
    const id = record.catalogItemId || record.id;
    if (!ns || !id) continue;
    if (!byNamespace.has(ns)) byNamespace.set(ns, []);
    byNamespace.get(ns).push(String(id));
  }

  const catalogMap = new Map();
  for (const [ns, ids] of byNamespace) {
    const items = await fetchCatalogItemsForNamespace(ns, [...new Set(ids)], fetchImpl, accessToken);
    for (const [id, item] of items) {
      catalogMap.set(`${ns}:${id}`, item);
    }
  }

  return records.map((record) => {
    const ns = resolveEpicNamespace(record);
    const id = String(record.catalogItemId || record.id || '');
    const catalog = catalogMap.get(`${ns}:${id}`);
    if (!catalog) return record;

    const mainRef = catalog.mainGameItem;
    const mainCatalog = mainRef
      ? catalogMap.get(`${mainRef.namespace}:${mainRef.id}`)
      : null;
    const displaySource = mainCatalog || catalog;
    const slug = catalogItemSlug(displaySource) || catalogItemSlug(catalog);
    const title = catalogItemTitle(displaySource) || catalogItemTitle(catalog);
    const cover = pickCatalogCover(displaySource) || pickCatalogCover(catalog);

    const metadata = { ...(record.metadata || {}) };
    if (title) metadata.title = title;
    if (slug) {
      metadata.slug = slug;
      metadata.pageSlug = slug;
    }
    if (cover) {
      metadata.keyImages = metadata.keyImages?.length
        ? metadata.keyImages
        : [{ type: 'Thumbnail', url: cover }];
    }

    return {
      ...record,
      metadata,
      catalogItem: {
        ...(record.catalogItem || {}),
        title: title || record.catalogItem?.title,
        keyImages: record.catalogItem?.keyImages || metadata.keyImages,
      },
      _catalogItem: displaySource,
    };
  });
}

function epicGamesNeedingCatalog(games) {
  return games.filter((game) => {
    if (game.platform !== 'epic') return false;
    if (!game.cover_url) return true;
    if (isInternalEpicId(game.name)) return true;
    return epicStoreUrlNeedsRepair(game);
  });
}

export async function repairEpicGamesCatalogInChunks(games, fetchImpl, accessToken = '', onProgress, options = {}) {
  const { appIdFilter = null } = options;
  let pending = epicGamesNeedingCatalog(games);
  if (appIdFilter) {
    const filter = new Set([...appIdFilter].map(String));
    pending = pending.filter((game) => filter.has(String(game.appid)));
  }
  logEpic('Catalog 分块补全开始', { total: games.length, pending: pending.length, scoped: !!appIdFilter });
  if (!pending.length) {
    if (onProgress) onProgress({ current: 0, total: 0, updates: [], complete: true });
    return games;
  }

  const byNamespace = new Map();
  for (const game of pending) {
    const ns = game.namespace;
    const id = game.appid;
    if (!ns || !id) continue;
    if (!byNamespace.has(ns)) byNamespace.set(ns, new Set());
    byNamespace.get(ns).add(String(id));
  }

  const total = pending.length;
  let current = 0;

  for (const [ns, idSet] of byNamespace) {
    const ids = [...idSet];
    const batchSize = 16;
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize);
      const items = await fetchCatalogItemsForNamespace(ns, batch, fetchImpl, accessToken);
      const catalogMap = new Map();
      for (const [id, item] of items) {
        catalogMap.set(`${ns}:${id}`, item);
      }

      const updates = [];
      for (const game of games) {
        if (game.namespace !== ns || !batch.includes(String(game.appid))) continue;
        const catalog = catalogMap.get(`${ns}:${game.appid}`);
        if (!catalog) continue;
        const patched = applyCatalogPatch(game, catalog, catalogMap);
        Object.assign(game, patched);
        updates.push({
          appid: game.appid,
          name: game.name,
          name_cn: game.name_cn,
          cover_url: game.cover_url,
          store_url: game.store_url,
        });
      }

      current += batch.length;
      if (onProgress) {
        onProgress({
          current: Math.min(current, total),
          total,
          updates,
          complete: false,
        });
      }
      await sleep(120);
    }
  }

  await repairEpicStoreUrls(games, fetchImpl, accessToken);

  if (onProgress) onProgress({ current: total, total, updates: [], complete: true });
  return sanitizeEpicGameNames(games);
}

export async function repairEpicGameCoversByAppIds(games, appIds, fetchImpl, accessToken = '', onProgress) {
  const filter = new Set((appIds || []).map(String).filter(Boolean));
  if (!filter.size) {
    if (onProgress) onProgress({ current: 0, total: 0, updates: [], complete: true });
    return [];
  }
  const allUpdates = [];
  await repairEpicGamesCatalogInChunks(games, fetchImpl, accessToken, (progress) => {
    if (progress.updates?.length) allUpdates.push(...progress.updates);
    if (onProgress) onProgress(progress);
  }, { appIdFilter: filter });
  return allUpdates;
}

async function repairEpicGamesCatalog(games, fetchImpl, accessToken = '') {
  return repairEpicGamesCatalogInChunks(games, fetchImpl, accessToken);
}

function normalizeLibraryRecord(record, playtimeMap) {
  const catalogItemId = String(record.catalogItemId || record.id || record.appName || '').trim();
  const metadata = record.metadata || {};
  const catalogSource = record._catalogItem || null;
  const devMeta = extractDevApiTitleMeta(record);
  const title = resolveEpicDisplayTitle([
    devMeta?.title,
    metadata.title,
    metadata.displayName,
    record.title,
    catalogItemTitle(catalogSource),
    record.appName,
  ], catalogItemId);
  let cover = extractRecordCover(record);
  if (!cover && devMeta?.cover) cover = devMeta.cover;

  return {
    platform: 'epic',
    appid: catalogItemId,
    name: title,
    name_cn: title,
    cover_url: cover,
    img_icon_url: cover,
    playtime_forever: playtimeMap.get(catalogItemId) || 0,
    playtime_2weeks: 0,
    genres: [],
    tags: [],
    aliases: [],
    store_url: buildStoreUrl(record, catalogSource),
    namespace: resolveEpicNamespace(record),
  };
}

async function getExchangeCode(accessToken, fetchImpl) {
  const res = await fetchImpl(`https://${EPIC_ACCOUNT_HOST}/account/api/oauth/exchange`, {
    headers: epicHeaders(accessToken),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.errorMessage || json.errorCode || '无法从网页 Token 获取 exchange code');
  }
  if (!json.code) throw new Error('exchange code 为空');
  return json.code;
}

async function requestLauncherToken(bodyParams, fetchImpl) {
  const body = new URLSearchParams(bodyParams);
  body.set('token_type', 'eg1');

  const res = await fetchImpl(`https://${EPIC_ACCOUNT_HOST}/account/api/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${launcherBasicAuth()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': EPIC_LAUNCHER_USER_AGENT,
    },
    body: body.toString(),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.errorMessage || json.errorCode || 'Epic Token 交换失败');
  }

  return {
    accessToken: String(json.access_token || '').trim(),
    refreshToken: String(json.refresh_token || '').trim(),
    accountId: String(json.account_id || resolveAccountId(json.access_token, '')).trim(),
    displayName: String(json.displayName || resolveDisplayName(json.access_token, '')).trim(),
    expiresAt: parseExpiresAt(json),
  };
}

export async function exchangeWebTokenForLauncherTokens(webAccessToken, fetchImpl) {
  const code = await getExchangeCode(webAccessToken, fetchImpl);
  return requestLauncherToken({
    grant_type: 'exchange_code',
    exchange_code: code,
  }, fetchImpl);
}

export async function refreshEpicLauncherToken(refreshToken, fetchImpl) {
  if (!refreshToken) throw new Error('缺少 Epic refresh token');
  return requestLauncherToken({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  }, fetchImpl);
}

class EpicCookieJar {
  constructor(entries = []) {
    this.cookies = new Map(entries);
  }

  absorb(response) {
    const raw = typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [];
    const fallback = response.headers.get('set-cookie');
    const lines = raw.length ? raw : (fallback ? [fallback] : []);
    for (const line of lines) {
      const part = String(line || '').split(';')[0];
      const idx = part.indexOf('=');
      if (idx <= 0) continue;
      const key = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      if (key) this.cookies.set(key, value);
    }
  }

  header() {
    return [...this.cookies.entries()].map(([key, value]) => `${key}=${value}`).join('; ');
  }

  serialize() {
    return Buffer.from(JSON.stringify([...this.cookies.entries()])).toString('base64url');
  }

  static deserialize(raw) {
    try {
      const entries = JSON.parse(Buffer.from(String(raw || ''), 'base64url').toString('utf8'));
      return new EpicCookieJar(Array.isArray(entries) ? entries : []);
    } catch {
      return new EpicCookieJar();
    }
  }
}

async function epicIdRequest(jar, fetchImpl, path, init = {}) {
  const url = `https://www.epicgames.com/id/api/${path.replace(/^\//, '')}`;
  const headers = {
    Accept: 'application/json',
    ...(init.headers || {}),
    Cookie: jar.header(),
    'User-Agent': EPIC_WEB_USER_AGENT,
  };
  const res = await fetchImpl(url, { ...init, headers });
  jar.absorb(res);
  return res;
}

async function fetchEpicCsrf(jar, fetchImpl) {
  const res = await epicIdRequest(jar, fetchImpl, 'csrf', { method: 'GET' });
  if (!res.ok) throw new Error('Epic 登录初始化失败');
  const token = jar.cookies.get('XSRF-TOKEN') || '';
  if (!token) throw new Error('Epic 登录初始化失败，未获取 XSRF-TOKEN');
  return token;
}

function extractEpicTwoFactorMethod(json) {
  return String(
    json?.metadata?.twoFactorMethod
    || json?.metadata?.twoFactorAuth?.method
    || json?.twoFactorMethod
    || '',
  ).trim();
}

function throwEpicNeedVerification(jar, twoFactorMethod) {
  const err = new Error('请输入 Epic 邮箱或双重验证码');
  err.code = 'EPIC_NEED_VERIFICATION';
  err.twoFactorMethod = twoFactorMethod || 'authenticator';
  err.loginState = jar.serialize();
  throw err;
}

async function postEpicLogin(jar, fetchImpl, xsrf, email, password) {
  return epicIdRequest(jar, fetchImpl, 'login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-xsrf-token': xsrf,
    },
    body: new URLSearchParams({
      email: String(email).trim(),
      password: String(password),
      rememberMe: 'true',
    }).toString(),
  });
}

export async function loginEpic(email, password, fetchImpl, options = {}) {
  const jar = options.loginState
    ? EpicCookieJar.deserialize(options.loginState)
    : new EpicCookieJar();
  const verificationCode = String(options.verificationCode || '').trim();
  const twoFactorMethod = String(options.twoFactorMethod || '').trim();

  let xsrf = await fetchEpicCsrf(jar, fetchImpl);

  if (verificationCode && twoFactorMethod) {
    const mfaRes = await epicIdRequest(jar, fetchImpl, 'login/mfa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'x-xsrf-token': xsrf,
      },
      body: new URLSearchParams({
        code: verificationCode,
        method: twoFactorMethod,
        rememberDevice: 'false',
      }).toString(),
    });
    const mfaJson = await mfaRes.json().catch(() => ({}));
    if (!mfaRes.ok) {
      throw parseEpicLoginError(mfaJson, mfaRes.status);
    }
  } else {
    let loginRes = await postEpicLogin(jar, fetchImpl, xsrf, email, password);
    if (loginRes.status === 409) {
      xsrf = await fetchEpicCsrf(jar, fetchImpl);
      loginRes = await postEpicLogin(jar, fetchImpl, xsrf, email, password);
    }

    if (!loginRes.ok) {
      const loginJson = await loginRes.json().catch(() => ({}));
      const method = extractEpicTwoFactorMethod(loginJson);
      if (method || loginRes.status === 431) {
        throwEpicNeedVerification(jar, method);
      }
      throw parseEpicLoginError(loginJson, loginRes.status);
    }
  }

  xsrf = jar.cookies.get('XSRF-TOKEN') || xsrf;
  const exchangeRes = await epicIdRequest(jar, fetchImpl, 'exchange', {
    method: 'POST',
    headers: { 'x-xsrf-token': xsrf },
  });
  const exchangeJson = await exchangeRes.json().catch(() => ({}));
  if (!exchangeRes.ok || !exchangeJson.code) {
    throw new Error(exchangeJson.errorCode || exchangeJson.message || 'Epic 登录 exchange 失败');
  }

  const session = await requestLauncherToken({
    grant_type: 'exchange_code',
    exchange_code: exchangeJson.code,
  }, fetchImpl);
  session.tokenKind = 'launcher';
  return session;
}

export async function resolveEpicSession(parsed, fetchImpl) {
  if (!parsed.accessToken) throw new Error('请粘贴 Epic Cookie、Token 或完整 JSON');

  const accessToken = parsed.accessToken.trim();
  const tokenKind = accessToken.startsWith('eg1~') ? 'web' : 'launcher';

  const session = {
    accessToken,
    refreshToken: parsed.refreshToken || '',
    accountId: resolveAccountId(accessToken, parsed.accountId),
    displayName: resolveDisplayName(accessToken, ''),
    expiresAt: parseExpiresAt({ access_token: accessToken }),
    tokenKind,
  };

  if (!session.accountId) {
    throw new Error('无法解析 Epic 账号 ID，请粘贴包含 EPIC_EG1 的 Cookie 或完整 JSON');
  }

  if (tokenKind === 'launcher') {
    return session;
  }

  try {
    await fetchImpl(`https://${EPIC_ACCOUNT_HOST}/account/api/public/account/${session.accountId}`, {
      headers: epicHeaders(accessToken),
    });
  } catch {
    /* account endpoint failure is acceptable if JWT is still valid */
  }

  return session;
}

export async function ensureEpicAccessToken(account, fetchImpl) {
  if (!account?.accessToken) throw new Error('请先连接 Epic 账号');

  const tokenKind = account.tokenKind || (account.accessToken.startsWith('eg1~') ? 'web' : 'launcher');
  if (tokenKind === 'web') {
    const expiresAt = Number(account.expiresAt || 0);
    if (expiresAt <= Date.now()) {
      throw new Error('Epic 网页登录态已过期，请重新复制 Cookie 后连接');
    }
    return account;
  }

  const expiresAt = Number(account.expiresAt || 0);
  if (expiresAt > Date.now() + 5 * 60 * 1000) return account;
  if (!account.refreshToken) return account;

  const refreshed = await refreshEpicLauncherToken(account.refreshToken, fetchImpl);
  return {
    ...account,
    ...refreshed,
    tokenKind: 'launcher',
    displayName: refreshed.displayName || account.displayName,
  };
}

export async function fetchEpicAccount(accessToken, accountId, fetchImpl) {
  const resolvedId = resolveAccountId(accessToken, accountId);
  if (!resolvedId) throw new Error('无法解析 Epic 账号 ID');

  const res = await fetchImpl(`https://${EPIC_ACCOUNT_HOST}/account/api/public/account/${resolvedId}`, {
    headers: epicHeaders(accessToken),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const fallbackName = resolveDisplayName(accessToken, '');
    if (fallbackName) {
      return {
        accountId: resolvedId,
        displayName: fallbackName,
        expiresAt: parseExpiresAt({ access_token: accessToken }),
      };
    }
    throw new Error(json.errorMessage || json.errorCode || 'Epic Token 无效或已过期');
  }

  return {
    accountId: resolvedId,
    displayName: json.displayName || json.name || resolveDisplayName(accessToken, resolvedId),
    expiresAt: parseExpiresAt({ access_token: accessToken }),
  };
}

const EPIC_GRAPHQL_URL = 'https://graphql.epicgames.com/graphql';
const EPIC_LIBRARY_QUERY = `
query EpicLibraryQuery($locale: String, $cursor: String, $excludeNs: [String]) {
  Launcher {
    libraryItems(
      cursor: $cursor
      params: { includeMetadata: true, excludeNs: $excludeNs }
    ) {
      records {
        catalogItemId
        namespace
        appName
        metadata {
          title
          keyImages { type url }
          slug
          pageSlug
        }
        catalogItem(locale: $locale) {
          title
          keyImages { type url }
        }
      }
      responseMetadata {
        nextCursor
      }
    }
  }
}`;

function normalizeGraphqlRecord(record, playtimeMap) {
  const catalogItemId = String(record.catalogItemId || record.id || '').trim();
  const metadata = record.metadata || {};
  const catalogItem = record.catalogItem || {};
  const catalogSource = record._catalogItem || null;
  const title = resolveEpicDisplayTitle([
    catalogItem.title,
    metadata.title,
    record.title,
    catalogItemTitle(catalogSource),
    record.appName,
  ], catalogItemId);
  const cover = extractRecordCover(record);

  return {
    platform: 'epic',
    appid: catalogItemId,
    name: title,
    name_cn: title,
    cover_url: cover,
    img_icon_url: cover,
    playtime_forever: playtimeMap.get(catalogItemId) || 0,
    playtime_2weeks: 0,
    genres: [],
    tags: [],
    aliases: [],
    store_url: buildStoreUrl({ ...record, metadata }, catalogSource),
    namespace: resolveEpicNamespace(record),
  };
}

async function fetchEpicLibraryRecordsDevApi(accessToken, fetchImpl) {
  const records = [];
  let cursor = '';

  while (true) {
    const params = new URLSearchParams({
      includeTitles: 'true',
      limit: '300',
      excludeNs: 'ue',
      platform: 'Windows',
    });
    if (cursor) params.set('cursor', cursor);

    const url = `${EPIC_LIBRARY_V1}/items?${params}`;
    const res = await epicRequest(fetchImpl, 'Dev API 游戏库', url, { headers: epicHeaders(accessToken) }, 2);
    const text = await res.text();
    if (!res.ok) {
      let message = 'Epic Dev API 游戏库拉取失败';
      try {
        const json = JSON.parse(text);
        message = json.errorMessage || json.message || message;
      } catch {
        message = text.slice(0, 200) || message;
      }
      logEpic('Dev API 失败', { status: res.status, message, page: records.length });
      if (records.length) break;
      throw new Error(message);
    }

    const json = JSON.parse(text);
    const pageCount = json.records?.length || 0;
    records.push(...(json.records || []));

    cursor = '';
    const metaHeader = res.headers.get('x-epic-metadata');
    if (metaHeader) {
      try {
        const meta = JSON.parse(metaHeader);
        cursor = meta.nextCursor || '';
      } catch {
        /* ignore bad metadata */
      }
    }
    logEpic('Dev API 分页', { pageCount, hasNext: !!cursor, total: records.length });
    if (!cursor) break;
    await sleep(200);
  }

  return records;
}

async function fetchEpicLibraryRecordsGraphql(accessToken, fetchImpl) {
  const records = [];
  let cursor = '';

  while (true) {
    let res;
    try {
      res = await epicRequest(fetchImpl, 'GraphQL 游戏库', EPIC_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          ...epicHeaders(accessToken),
          'Content-Type': 'application/json',
          Origin: 'https://store.epicgames.com',
          Referer: 'https://store.epicgames.com/',
        },
        body: JSON.stringify({
          query: EPIC_LIBRARY_QUERY,
          variables: {
            locale: 'zh-CN',
            cursor,
            excludeNs: ['ue'],
          },
        }),
      }, 2);
    } catch (err) {
      if (records.length) break;
      throw wrapEpicNetworkError(err, 'Epic GraphQL 游戏库');
    }

    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.errors?.length) {
      if (records.length) break;
      const message = json.errors?.[0]?.message || json.message || 'Epic GraphQL 游戏库拉取失败';
      logEpic('GraphQL 业务错误', { status: res.status, message, errors: json.errors?.slice(0, 2) });
      throw new Error(message);
    }

    const page = json.data?.Launcher?.libraryItems;
    const pageCount = page?.records?.length || 0;
    logEpic('GraphQL 分页', { pageCount, hasNext: !!page?.responseMetadata?.nextCursor });
    records.push(...(page?.records || []));
    cursor = page?.responseMetadata?.nextCursor || '';
    if (!cursor) break;
    await sleep(200);
  }

  return records;
}

async function fetchEpicLibraryRecordsRest(accessToken, fetchImpl) {
  const records = [];
  let cursor = '';

  while (true) {
    const params = new URLSearchParams({
      includeMetadata: 'true',
      platform: 'Windows',
    });
    if (cursor) params.set('cursor', cursor);

    const url = `https://${EPIC_LIBRARY_HOST}/library/api/public/items?${params}`;

    try {
      const res = await epicRequest(
        fetchImpl,
        'REST 游戏库',
        url,
        { headers: epicHeaders(accessToken) },
        3
      );
      const text = await res.text();
      if (!res.ok) {
        let message = 'Epic 游戏库拉取失败';
        try {
          const json = JSON.parse(text);
          message = json.errorMessage || json.message || message;
        } catch {
          message = text.slice(0, 200) || message;
        }
        logEpic('REST 失败', { status: res.status, message, page: records.length });
        if (records.length) break;
        throw new Error(message);
      }

      const json = JSON.parse(text);
      const pageCount = json.records?.length || 0;
      logEpic('REST 分页', { pageCount, hasNext: !!json.responseMetadata?.nextCursor });
      records.push(...(json.records || []));
      cursor = json.responseMetadata?.nextCursor || '';
      if (!cursor) break;
      await sleep(250);
    } catch (err) {
      if (records.length) break;
      throw wrapEpicNetworkError(err, 'Epic 游戏库');
    }
  }

  if (!records.length) {
    throw new Error('Epic 游戏库为空或拉取失败');
  }

  return records;
}

async function fetchEpicLibraryRecords(accessToken, fetchImpl) {
  const isWebToken = String(accessToken || '').startsWith('eg1~');
  let records = [];
  let devError = null;
  let restError = null;
  let graphError = null;

  try {
    records = await fetchEpicLibraryRecordsDevApi(accessToken, fetchImpl);
  } catch (err) {
    devError = err;
  }

  if (!records.length) {
    if (isWebToken) {
      try {
        records = await fetchEpicLibraryRecordsRest(accessToken, fetchImpl);
      } catch (err) {
        restError = err;
      }
    } else {
      try {
        records = await fetchEpicLibraryRecordsGraphql(accessToken, fetchImpl);
      } catch (err) {
        graphError = err;
      }
      if (!records.length) {
        try {
          records = await fetchEpicLibraryRecordsRest(accessToken, fetchImpl);
        } catch (err) {
          restError = err;
        }
      }
    }
  }

  if (!records.length) {
    const parts = [devError, restError, graphError].filter(Boolean).map((err) => err.message);
    throw new Error(parts.join('；') || 'Epic 游戏库拉取失败');
  }

  return records;
}

async function fetchEpicPlaytime(accessToken, accountId, fetchImpl) {
  const resolvedId = resolveAccountId(accessToken, accountId);
  if (!resolvedId) return new Map();

  const urls = [
    `${EPIC_LIBRARY_V1}/playtime/account/${resolvedId}/all`,
    `https://${EPIC_LIBRARY_HOST}/library/api/public/playtime/account/${resolvedId}/all`,
  ];

  for (const url of urls) {
    try {
      const res = await epicRequest(fetchImpl, '游戏时长', url, { headers: epicHeaders(accessToken) }, 1);
      if (!res.ok) continue;
      const json = await res.json();
      const list = Array.isArray(json) ? json : (json.records || json.items || []);
      const map = normalizePlaytimeMap(list);
      if (map.size) {
        logEpic('游戏时长 命中', { count: map.size, host: new URL(url).host });
        return map;
      }
    } catch (err) {
      logEpic('游戏时长 跳过', { host: new URL(url).host, error: err.message });
    }
  }

  return new Map();
}

export async function fetchEpicGames(accessToken, accountId, fetchImpl) {
  logEpic('开始拉取游戏库', { accountId, tokenKind: accessToken.startsWith('eg1~') ? 'web' : 'launcher' });
  const started = Date.now();
  const localRecords = readEpicLocalLibraryRecords(logEpic);

  let records = [];
  let playtimeMap = new Map();
  try {
    [records, playtimeMap] = await Promise.all([
      fetchEpicLibraryRecords(accessToken, fetchImpl),
      fetchEpicPlaytime(accessToken, accountId, fetchImpl),
    ]);
  } catch (err) {
    logEpic('远程库拉取失败', { error: err.message, local: localRecords.length });
    if (!localRecords.length) throw err;
  }

  records = mergeEpicLibraryRecords(localRecords, records);
  logEpic('库记录已获取', {
    records: records.length,
    local: localRecords.length,
    ms: Date.now() - started,
  });

  const games = records
    .filter((record) => {
      const type = String(record.itemType || record.type || '').toUpperCase();
      if (type && type !== 'MAINGAME') return false;
      return record.catalogItemId || record.id || record.appName;
    })
    .map((record) => (
      record.catalogItem?.title || record.metadata?.title || record.title
        ? normalizeGraphqlRecord(record, playtimeMap)
        : normalizeLibraryRecord(record, playtimeMap)
    ))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));

  const sanitized = sanitizeEpicGameNames(games);
  try {
    await repairEpicGamesCatalog(sanitized, fetchImpl, accessToken);
  } catch (err) {
    logEpic('Catalog 补全失败', { error: err.message });
    try {
      await repairEpicStoreUrls(sanitized, fetchImpl, accessToken);
    } catch (storeErr) {
      logEpic('商店链接补全失败', { error: storeErr.message });
    }
  }
  logEpic('游戏库处理完成', { count: sanitized.length, ms: Date.now() - started });
  return sanitized;
}

export async function repairCachedEpicGames(games, fetchImpl, accessToken = '') {
  const repaired = await repairEpicGamesCatalog(games, fetchImpl, accessToken);
  return sanitizeEpicGameNames(repaired);
}

function parseEpicLoginError(json, status) {
  const code = String(json?.errorCode || json?.error || '').trim();
  const message = String(json?.message || json?.errorMessage || '').trim();
  if (/captcha/i.test(code) || /captcha/i.test(message)) {
    const err = new Error('Epic 要求人机验证，程序内密码登录不可用，请使用下方「浏览器授权码」');
    err.code = 'EPIC_NEED_CAPTCHA';
    return err;
  }
  if (/session_invalidated/i.test(code)) {
    return new Error('Epic 登录会话失效，请重试');
  }
  return new Error(code || message || `Epic 登录失败 (${status || 'unknown'})`);
}

export function parseEpicAuthCodeInput(raw) {
  const text = String(raw || '').trim().replace(/^\uFEFF/, '');
  if (!text) return '';

  const patterns = [
    /"authorizationCode"\s*:\s*"([^"\\]+)"/i,
    /"authorization_code"\s*:\s*"([^"\\]+)"/i,
    /"exchangeCode"\s*:\s*"([^"\\]+)"/i,
    /"exchange_code"\s*:\s*"([^"\\]+)"/i,
    /'authorizationCode'\s*:\s*'([^'\\]+)'/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  const jsonChunks = [text, text.match(/\{[\s\S]*\}/)?.[0], text.match(/\[[\s\S]*\]/)?.[0]].filter(Boolean);
  for (const chunk of jsonChunks) {
    try {
      const json = JSON.parse(chunk);
      const code = String(
        json.authorizationCode
        || json.authorization_code
        || json.exchangeCode
        || json.exchange_code
        || json.code
        || '',
      ).trim();
      if (code) return code;
    } catch {
      /* try next chunk */
    }
  }

  const urlMatch = text.match(/[?&]code=([^&\s"'<>]+)/i);
  if (urlMatch?.[1]) {
    try {
      return decodeURIComponent(urlMatch[1]).trim();
    } catch {
      return urlMatch[1].trim();
    }
  }

  if (/^[a-f0-9]{32}$/i.test(text)) return text;
  return text.replace(/^Bearer\s+/i, '').trim();
}

export async function connectEpicWithAuthCode(rawCode, fetchImpl) {
  const code = parseEpicAuthCodeInput(rawCode);
  if (!code) throw new Error('请粘贴浏览器返回的 authorizationCode');

  const attempts = [
    { grant_type: 'authorization_code', code },
    { grant_type: 'exchange_code', exchange_code: code },
  ];
  let lastError = null;

  for (const bodyParams of attempts) {
    try {
      const session = await requestLauncherToken(bodyParams, fetchImpl);
      session.tokenKind = 'launcher';
      return session;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('授权码无效或已过期，请重新在浏览器获取');
}

export { sanitizeEpicGameNames, EPIC_BROWSER_AUTH_URL };

export function parseEpicAuthInput(raw) {
  return extractTokenFromPaste(raw);
}
