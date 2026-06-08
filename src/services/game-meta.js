import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';

const STORE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  Cookie: 'birthtime=568022401; wants_mature_content=1; lastagecheckage=1-January-1988; mature_content=1',
};

const CONCURRENCY = 4;
const REQUEST_GAP_MS = 120;

/** 常见游戏社区简称，补充自动生成的别名 */
const POPULAR_ALIASES = {
  730: ['cs', 'csgo', 'cs2', '反恐', '反恐精英'],
  570: ['dota', 'dota2', '刀塔'],
  578080: ['pubg', '吃鸡'],
  1245620: ['老头环'],
  1174180: ['rdr2', '大表哥', '大表哥2'],
  1091500: ['赛博朋克', '2077', 'cyberpunk'],
  271590: ['gta5', 'gta', '侠盗猎车手'],
  892970: ['雀魂'],
  431960: ['壁纸引擎'],
  413150: ['stardew', '星露谷'],
  359550: ['r6', '彩虹六号'],
  230410: ['warframe', '星际战甲'],
  440: ['tf2', '军团要塞'],
  1938090: ['cod', '使命召唤'],
  2358720: ['黑神话', '黑猴'],
};

export function hasChineseText(text) {
  return /[\u4e00-\u9fff]/.test(String(text || ''));
}

export function normalizeMatchKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[®™©]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '')
    .trim();
}

function isUuidLike(text) {
  const value = String(text || '').trim();
  if (!value) return false;
  if (/^[0-9a-f]{32}$/i.test(value)) return true;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function epicNameNeedsCn(game) {
  if (!game?.name_cn) return true;
  if (game.name_cn === game.name) return !hasChineseText(game.name_cn);
  return isUuidLike(game.name_cn);
}

export function buildSearchAliases(nameEn, nameCn, appid) {
  const set = new Set();
  const add = (value) => {
    const s = String(value || '').trim().toLowerCase();
    if (s.length >= 2) set.add(s);
  };

  for (const extra of POPULAR_ALIASES[appid] || []) add(extra);

  for (const src of [nameEn, nameCn]) {
    if (!src) continue;
    add(src);
    add(src.replace(/[®™©]/g, ''));

    const compact = src.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, '');
    add(compact);

    const parts = src.split(/[\s\-:：®™©·・]+/).filter(Boolean);
    if (!parts.length) continue;

    let acronym = '';
    for (const part of parts) {
      if (/^\d+$/.test(part)) {
        acronym += part;
        continue;
      }
      const digitTail = part.match(/(\d+)$/);
      if (digitTail && part.length <= 4) {
        acronym += part.toLowerCase();
        continue;
      }
      if (/[a-zA-Z]/.test(part[0])) {
        acronym += part[0].toLowerCase();
        if (digitTail) acronym += digitTail[1];
      }
    }
    add(acronym);

    const num = src.match(/(\d+)/);
    if (num) {
      const word = parts.find((p) => /[a-zA-Z\u4e00-\u9fff]{2,}/.test(p));
      if (word) {
        const w = word.replace(/[^a-zA-Z\u4e00-\u9fff]/g, '').toLowerCase();
        if (w.length >= 2) add(w + num[1]);
        if (w.length >= 3) add(w.slice(0, 3) + num[1]);
      }
      if (parts.length >= 2) {
        const letters = parts
          .filter((p) => !/^\d+$/.test(p) && /[a-zA-Z]/.test(p))
          .map((p) => p[0].toLowerCase())
          .join('');
        if (letters) add(letters + num[1]);
      }
    }
  }

  return [...set];
}

export function createGameMetaStore(metaDir, metaTtlMs = 7 * 24 * 60 * 60 * 1000) {
  const META_TTL_MS = metaTtlMs;

  function ensureDir() {
    if (!existsSync(metaDir)) mkdirSync(metaDir, { recursive: true });
  }

  function metaPath(appid) {
    return join(metaDir, `${appid}.json`);
  }

  function isUsableMeta(data) {
    if (!data) return false;
    if (data.name_cn) return true;
    if (Array.isArray(data.genres) && data.genres.length) return true;
    if (Array.isArray(data.tags) && data.tags.length) return true;
    return false;
  }

  function isLongTermMeta(data) {
    return !!data.permanent || hasChineseText(data.name_cn);
  }

  function finalizeMeta(meta, nameEn, appid) {
    const nameCn = meta.name_cn || '';
    const permanent = hasChineseText(nameCn) && nameCn.trim() !== String(nameEn || '').trim();
    return {
      ...meta,
      name_en: String(nameEn || '').trim(),
      aliases: buildSearchAliases(nameEn, nameCn, appid),
      permanent,
    };
  }

  function readMeta(appid) {
    const path = metaPath(appid);
    if (!existsSync(path)) return null;
    try {
      const data = JSON.parse(readFileSync(path, 'utf-8'));
      if (!isUsableMeta(data)) {
        try {
          unlinkSync(path);
        } catch {
          /* ignore */
        }
        return null;
      }
      if (!isLongTermMeta(data) && Date.now() - data.cachedAt > META_TTL_MS) {
        try {
          unlinkSync(path);
        } catch {
          /* ignore */
        }
        return null;
      }
      if (!Array.isArray(data.aliases)) {
        data.aliases = buildSearchAliases(data.name_en || '', data.name_cn, appid);
      }
      return data;
    } catch {
      try {
        unlinkSync(path);
      } catch {
        /* ignore */
      }
      return null;
    }
  }

  function writeMeta(appid, payload, nameEn = '') {
    const finalPayload = payload.aliases
      ? payload
      : finalizeMeta(payload, nameEn || payload.name_en, appid);
    if (!isUsableMeta(finalPayload)) return;
    ensureDir();
    writeFileSync(
      metaPath(appid),
      JSON.stringify({ cachedAt: Date.now(), ...finalPayload }, null, 2),
      'utf-8'
    );
  }

  async function storeFetch(url, steamFetch) {
    const res = await steamFetch(url, { headers: STORE_HEADERS });
    return res.text();
  }

  function extractStoreTagsFromHtml(html) {
    const tags = [];
    const seen = new Set();
    for (const match of String(html || '').matchAll(/class="app_tag[^"]*"[^>]*>([^<]+)</g)) {
      const tag = match[1].replace(/&amp;/g, '&').trim();
      if (!tag || tag === '+' || seen.has(tag)) continue;
      seen.add(tag);
      tags.push(tag);
    }
    return tags;
  }

  function parseStorePageTitle(html) {
    const og = String(html || '').match(/property="og:title"\s+content="([^"]+)"/);
    if (!og?.[1]) return '';

    let title = og[1]
      .replace(/^Steam 上的\s+/i, '')
      .replace(/\s+on Steam$/i, '')
      .replace(/\s*\/\s*Steam\s*$/i, '')
      .trim();
    if (!title || /^Steam$/i.test(title)) return '';
    return title;
  }

  async function fetchOneAppDetails(appid, steamFetch) {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appid}&l=schinese&cc=cn`;
    const text = await storeFetch(url, steamFetch);
    if (!text || text.trim() === 'null') return null;

    let json;
    try {
      json = JSON.parse(text);
    } catch {
      return null;
    }

    const entry = json?.[String(appid)];
    if (!entry?.success || !entry.data) return null;

    const data = entry.data;
    return {
      name_cn: data.name || '',
      genres: (data.genres || []).map((g) => g.description).filter(Boolean),
      tags: [],
    };
  }

  async function fetchOneStorePage(appid, steamFetch) {
    const url = `https://store.steampowered.com/app/${appid}/?l=schinese&cc=cn`;
    const html = await storeFetch(url, steamFetch);
    if (!html || !html.trimStart().startsWith('<')) return null;

    const title = parseStorePageTitle(html);
    if (!title) return null;

    return {
      name_cn: title,
      genres: [],
      tags: extractStoreTagsFromHtml(html),
    };
  }

  async function fetchOne(appid, steamFetch) {
    const pageUrl = `https://store.steampowered.com/app/${appid}/?l=schinese&cc=cn`;
    const [fromApi, html] = await Promise.all([
      fetchOneAppDetails(appid, steamFetch),
      storeFetch(pageUrl, steamFetch).catch(() => ''),
    ]);
    const storeTags = extractStoreTagsFromHtml(html);

    if (fromApi) {
      return {
        ...fromApi,
        tags: storeTags.length ? storeTags : fromApi.tags,
      };
    }

    const title = parseStorePageTitle(html);
    if (!title) return null;
    return {
      name_cn: title,
      genres: [],
      tags: storeTags,
    };
  }

  async function fetchMany(appids, steamFetch) {
    const result = {};
    for (let i = 0; i < appids.length; i += CONCURRENCY) {
      const slice = appids.slice(i, i + CONCURRENCY);
      const entries = await Promise.all(
        slice.map(async (appid) => {
          try {
            const meta = await fetchOne(appid, steamFetch);
            return [appid, meta];
          } catch {
            return [appid, null];
          }
        })
      );
      for (const [appid, meta] of entries) {
        if (meta) result[appid] = meta;
      }
      if (i + CONCURRENCY < appids.length) {
        await new Promise((r) => setTimeout(r, REQUEST_GAP_MS));
      }
    }
    return result;
  }

  function applyCachedMeta(games) {
    return applyCachedMetaWithStats(games).games;
  }

  function applyCachedMetaWithStats(games) {
    let metaPending = 0;
    const mapped = games.map((game) => {
      const cached = readMeta(game.appid);
      if (!cached) metaPending += 1;
      return {
        ...game,
        name_cn: cached?.name_cn || game.name_cn || '',
        aliases: cached?.aliases || game.aliases || [],
        genres: cached?.genres || game.genres || [],
        tags: cached?.tags || game.tags || [],
      };
    });
    return { games: mapped, metaPending };
  }

  function countMissingMeta(games) {
    return games.filter((game) => !readMeta(game.appid)).length;
  }

  async function enrichGamesMissing(games, steamFetch, onProgress) {
    const missingGames = games.filter((game) => !readMeta(game.appid));
    const total = missingGames.length;
    if (!total) {
      onProgress?.({ complete: true, current: 0, total: 0, updates: [] });
      return;
    }

    let current = 0;
    for (let i = 0; i < missingGames.length; i += CONCURRENCY) {
      const batch = missingGames.slice(i, i + CONCURRENCY);
      const fetched = await fetchMany(
        batch.map((game) => game.appid),
        steamFetch
      );
      const updates = [];
      for (const game of batch) {
        const meta = fetched[game.appid];
        if (meta) {
          const payload = finalizeMeta(meta, game.name, game.appid);
          writeMeta(game.appid, payload);
          updates.push({ appid: game.appid, ...payload });
        }
      }
      current += batch.length;
      onProgress?.({ current, total, updates });
      if (i + CONCURRENCY < missingGames.length) {
        await new Promise((r) => setTimeout(r, REQUEST_GAP_MS));
      }
    }
    onProgress?.({ complete: true, current: total, total, updates: [] });
  }

  async function enrichGames(games, steamFetch) {
    const enriched = applyCachedMeta(games);
    await enrichGamesMissing(enriched, steamFetch);
    return applyCachedMeta(enriched);
  }

  function buildEnglishNameIndex() {
    const map = new Map();
    ensureDir();
    let files = [];
    try {
      files = readdirSync(metaDir).filter((file) => file.endsWith('.json'));
    } catch {
      return map;
    }
    for (const file of files) {
      try {
        const data = JSON.parse(readFileSync(join(metaDir, file), 'utf-8'));
        const nameEn = data.name_en || '';
        const nameCn = data.name_cn || '';
        if (!hasChineseText(nameCn)) continue;
        const key = normalizeMatchKey(nameEn);
        if (key.length >= 3 && !map.has(key)) map.set(key, nameCn);
      } catch {
        /* ignore broken meta */
      }
    }
    return map;
  }

  function applyEpicNameMatchFromSteam(epicGames, steamGames = []) {
    const index = buildEnglishNameIndex();
    for (const game of steamGames) {
      const key = normalizeMatchKey(game.name);
      if (key.length >= 3 && hasChineseText(game.name_cn) && !index.has(key)) {
        index.set(key, game.name_cn);
      }
    }

    return epicGames.map((game) => {
      if (!epicNameNeedsCn(game)) return game;
      const key = normalizeMatchKey(game.name);
      const nameCn = index.get(key);
      if (!nameCn) return game;
      return {
        ...game,
        name_cn: nameCn,
        aliases: game.aliases?.length ? game.aliases : buildSearchAliases(game.name, nameCn, game.appid),
      };
    });
  }

  return {
    enrichGames,
    applyCachedMeta,
    applyCachedMetaWithStats,
    applyEpicNameMatchFromSteam,
    buildEnglishNameIndex,
    countMissingMeta,
    enrichGamesMissing,
    readMeta,
    writeMeta,
  };
}
