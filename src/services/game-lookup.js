const STEAM_STORE_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept-Language': 'zh-CN,zh;q=0.9',
};

function isExcludedSteamLookupItem(data) {
  const type = String(data?.type || '').toLowerCase();
  if (type === 'dlc' || type === 'bundle') return true;
  if (data?.fullgame?.appid) return true;
  return false;
}

function mapSteamStoreItem(item) {
  return {
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
  };
}

async function fetchSteamAppBasicMeta(appid, fetchImpl) {
  const id = String(appid || '').trim();
  if (!id) return null;
  const url = `https://store.steampowered.com/api/appdetails?appids=${id}&filters=basic`;
  try {
    const res = await fetchImpl(url, { headers: STEAM_STORE_HEADERS });
    if (!res.ok) return null;
    const json = await res.json();
    const entry = json?.[id];
    if (!entry?.success || !entry.data) return null;
    return entry.data;
  } catch {
    return null;
  }
}

async function filterSteamStoreSearchItems(items, fetchImpl, limit) {
  const out = [];
  const batchSize = 6;
  for (let i = 0; i < items.length && out.length < limit; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const checked = await Promise.all(batch.map(async (item) => {
      const meta = await fetchSteamAppBasicMeta(item.id, fetchImpl);
      if (isExcludedSteamLookupItem(meta)) return null;
      return item;
    }));
    for (const item of checked) {
      if (item && out.length < limit) out.push(mapSteamStoreItem(item));
    }
  }
  return out;
}

export async function searchGamesByName(query, options = {}) {
  const { fetchImpl = fetch, limit = 12 } = options;
  const q = String(query || '').trim();
  if (q.length < 2) return [];
  return searchSteamStoreByName(q, fetchImpl, limit);
}

export async function searchSteamStoreByName(query, fetchImpl, limit) {
  const url = `https://store.steampowered.com/api/storesearch/?term=${encodeURIComponent(query)}&l=schinese&cc=cn`;
  const fetchLimit = Math.min(Math.max(Number(limit) * 4, 24), 40);
  try {
    const res = await fetchImpl(url, { headers: STEAM_STORE_HEADERS });
    if (!res.ok) return [];
    const json = await res.json();
    const items = (json.items || []).slice(0, fetchLimit);
    if (!items.length) return [];
    return filterSteamStoreSearchItems(items, fetchImpl, limit);
  } catch {
    return [];
  }
}
