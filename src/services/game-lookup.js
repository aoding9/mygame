const RAWG_BASE = 'https://api.rawg.io/api';

export async function searchGamesByName(query, options = {}) {
  const { rawgKey = '', fetchImpl = fetch, limit = 12 } = options;
  const q = String(query || '').trim();
  if (q.length < 2) return [];

  if (!rawgKey) {
    return searchSteamStoreByName(q, fetchImpl, limit);
  }

  const params = new URLSearchParams({
    search: q,
    page_size: String(Math.min(limit, 20)),
    key: rawgKey,
  });

  const res = await fetchImpl(`${RAWG_BASE}/games?${params}`);
  if (!res.ok) {
    const fallback = await searchSteamStoreByName(q, fetchImpl, limit);
    if (fallback.length) return fallback;
    throw new Error(`RAWG 查询失败 (${res.status})`);
  }

  const json = await res.json();
  return (json.results || []).map((item) => ({
    source: 'rawg',
    id: item.id,
    slug: item.slug,
    name: item.name || '',
    name_cn: '',
    cover_url: item.background_image || '',
    released: item.released || '',
    platforms: (item.platforms || []).map((p) => p.platform?.name).filter(Boolean),
    metacritic: item.metacritic || null,
    steamAppId: extractSteamAppId(item),
  }));
}

function extractSteamAppId(item) {
  const stores = item.stores || [];
  for (const store of stores) {
    const url = store.store?.slug === 'steam' ? store.url : '';
    const match = String(url || '').match(/\/app\/(\d+)/);
    if (match) return match[1];
  }
  return '';
}

async function searchSteamStoreByName(query, fetchImpl, limit) {
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=schinese&cc=cn`;
  try {
    const res = await fetchImpl(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.items || []).slice(0, limit).map((item) => ({
      source: 'steam',
      id: item.id,
      slug: '',
      name: item.name || '',
      name_cn: item.name || '',
      cover_url: item.tiny_image || item.small_image || item.medium_image || '',
      released: '',
      platforms: ['Steam'],
      metacritic: null,
      steamAppId: String(item.id || ''),
    }));
  } catch {
    return [];
  }
}

export async function fetchGameDetail(rawgKey, rawgId, fetchImpl = fetch) {
  if (!rawgKey || !rawgId) return null;
  const res = await fetchImpl(`${RAWG_BASE}/games/${rawgId}?key=${rawgKey}`);
  if (!res.ok) return null;
  const item = await res.json();
  return {
    source: 'rawg',
    id: item.id,
    slug: item.slug,
    name: item.name || '',
    name_cn: '',
    cover_url: item.background_image_additional || item.background_image || '',
    released: item.released || '',
    platforms: (item.platforms || []).map((p) => p.platform?.name).filter(Boolean),
    metacritic: item.metacritic || null,
    steamAppId: extractSteamAppId(item),
    genres: (item.genres || []).map((g) => g.name).filter(Boolean),
    tags: (item.tags || []).slice(0, 12).map((t) => t.name).filter(Boolean),
  };
}
