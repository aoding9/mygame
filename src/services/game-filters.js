export function parseGameFilters(query = {}) {
  const maxHoursRaw = query.maxHours;
  return {
    search: String(query.search || '').trim(),
    genre: String(query.genre || '').trim(),
    tagSearch: String(query.tagSearch || query.tag || '').trim(),
    unplayed: query.unplayed === 'true',
    shareableOnly: query.shareableOnly === 'true',
    nonShareableOnly: query.nonShareableOnly === 'true',
    familyOnly: query.familyOnly === 'true',
    favoritesOnly: query.favoritesOnly === 'true',
    hiddenOnly: query.hiddenOnly === 'true',
    ownerSteamId: String(query.ownerSteamId || query.owner || '').trim(),
    steamCollectionId: String(query.steamCollectionId || query.collectionId || '').trim(),
    minHours: Number(query.minHours) || 0,
    maxHours: maxHoursRaw !== undefined && maxHoursRaw !== '' ? Number(maxHoursRaw) : Infinity,
    sort: String(query.sort || 'name-asc'),
    page: Math.max(1, Number(query.page) || 1),
    pageSize: Math.min(100, Math.max(12, Number(query.pageSize) || 48)),
  };
}

export function gameTitle(game) {
  if (game.display_name) return game.display_name;
  const customCn = game.custom_name_cn || '';
  if (customCn && customCn !== game.name) return customCn;
  if (game.name_cn && game.name_cn !== game.name) return game.name_cn;
  return game.name || '';
}

export function gameSearchText(game, platform = 'steam') {
  const parts = [
    game.display_name,
    game.custom_name_cn,
    game.custom_name_en,
    game.name,
    game.name_cn,
    game.source_name,
    game.source_name_cn,
    ...(game.aliases || []),
  ];
  if (platform === 'steam') {
    parts.push(...(game.genres || []), ...(game.tags || []));
  }
  return parts.filter(Boolean).join(' ').toLowerCase();
}

const TAG_QUERY_EXPANSIONS = {
  rogue: ['rogue', 'roguelike', 'roguelite', '类 rogue', '轻度 rogue', '牌组构建式类 rogue'],
  rouge: ['rogue', 'roguelike', 'roguelite', '类 rogue', '轻度 rogue'],
  roguelike: ['roguelike', 'roguelite', '类 rogue', '轻度 rogue'],
  roguelite: ['roguelite', '轻度 rogue', '类 rogue'],
  自走棋: ['自走棋', 'auto battler', 'autobattler', 'auto chess', '自动战斗'],
  类rogue: ['类 rogue', 'roguelike', 'roguelite', '轻度 rogue'],
};

function expandTagQuery(query) {
  const raw = String(query || '').trim().toLowerCase();
  if (!raw) return [];
  const terms = new Set([raw, raw.replace(/\s+/g, '')]);
  for (const extra of TAG_QUERY_EXPANSIONS[raw] || []) {
    terms.add(String(extra).toLowerCase());
    terms.add(String(extra).toLowerCase().replace(/\s+/g, ''));
  }
  return [...terms].filter((item) => item.length >= 2);
}

export function gameTagSearchText(game) {
  return [
    game.name,
    game.name_cn,
    ...(game.aliases || []),
    ...(game.genres || []),
    ...(game.tags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function gameMatchesTagSearch(game, query) {
  const terms = expandTagQuery(query);
  if (!terms.length) return true;

  const text = gameTagSearchText(game);
  const compact = text.replace(/\s+/g, '');
  for (const term of terms) {
    if (text.includes(term)) return true;
    const termCompact = term.replace(/\s+/g, '');
    if (termCompact.length >= 2 && compact.includes(termCompact)) return true;
  }
  return false;
}

export function gameMatchesSearch(game, search, platform = 'steam') {
  if (!search) return true;
  const q = search.toLowerCase();
  const text = gameSearchText(game, platform);
  if (text.includes(q)) return true;
  const qCompact = q.replace(/\s+/g, '');
  if (qCompact.length >= 2 && text.replace(/\s+/g, '').includes(qCompact)) return true;
  return false;
}

const STEAM_ONLY_SORTS = new Set(['playtime-desc', 'playtime-asc', 'recent']);

export function sanitizeFiltersForPlatform(filters, platform) {
  if (platform === 'steam') return filters;
  return {
    ...filters,
    genre: '',
    tagSearch: '',
    unplayed: false,
    minHours: 0,
    maxHours: Infinity,
    ownerSteamId: '',
    steamCollectionId: '',
    shareableOnly: false,
    nonShareableOnly: false,
    familyOnly: false,
    sort: STEAM_ONLY_SORTS.has(filters.sort) ? 'name-asc' : filters.sort,
  };
}

export function filterGames(games, filters, context = {}) {
  const {
    platform = 'steam',
    favoriteAppIds = new Set(),
    hiddenAppIds = new Set(),
  } = context;
  const isSteam = platform === 'steam';

  const gameIdKey = (game) => (
    platform === 'steam' ? String(Number(game.appid)) : String(game.appid || '')
  );
  const inSet = (game, idSet) => idSet.has(gameIdKey(game));

  return games.filter((game) => {
    if (filters.search && !gameMatchesSearch(game, filters.search, platform)) return false;
    if (isSteam && filters.genre && !(game.genres || []).includes(filters.genre)) return false;
    if (isSteam && filters.tagSearch && !gameMatchesTagSearch(game, filters.tagSearch)) return false;
    if (filters.favoritesOnly && !inSet(game, favoriteAppIds)) return false;
    if (filters.hiddenOnly && !inSet(game, hiddenAppIds)) return false;
    if (!filters.hiddenOnly && inSet(game, hiddenAppIds)) return false;
    if (isSteam && filters.ownerSteamId && !(game.owner_ids || []).includes(filters.ownerSteamId)) return false;
    if (isSteam && filters.steamCollectionId) {
      const collectionIds = game.steam_collection_ids || [];
      if (!collectionIds.includes(filters.steamCollectionId)) return false;
    }
    if (isSteam && filters.unplayed && game.playtime_forever > 0) return false;
    if (isSteam && filters.shareableOnly && game.shareable === false) return false;
    if (isSteam && filters.nonShareableOnly && game.shareable !== false) return false;
    if (isSteam && filters.familyOnly && !game.from_family) return false;
    if (isSteam) {
      const hours = game.playtime_forever / 60;
      if (hours < filters.minHours || hours > filters.maxHours) return false;
    }
    return true;
  });
}

export function sortGames(games, sort, platform = 'steam') {
  const effectiveSort = platform === 'steam' || !STEAM_ONLY_SORTS.has(sort) ? sort : 'name-asc';
  const list = [...games];
  list.sort((a, b) => {
    switch (effectiveSort) {
      case 'name-desc':
        return gameTitle(b).localeCompare(gameTitle(a), 'zh-CN');
      case 'playtime-desc':
        return b.playtime_forever - a.playtime_forever;
      case 'playtime-asc':
        return a.playtime_forever - b.playtime_forever;
      case 'recent':
        return (b.rtime_last_played || 0) - (a.rtime_last_played || 0);
      default:
        return gameTitle(a).localeCompare(gameTitle(b), 'zh-CN');
    }
  });
  return list;
}

export function paginateGames(games, filters) {
  const total = games.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const start = (page - 1) * filters.pageSize;

  return {
    games: games.slice(start, start + filters.pageSize),
    pagination: {
      page,
      pageSize: filters.pageSize,
      total,
      totalPages,
    },
  };
}

export function collectFilterOptions(games, platform, resolveOwnerName, steamCollections = []) {
  const genres = new Set();
  const tags = new Set();
  const owners = new Map();

  for (const game of games) {
    if (platform === 'steam') {
      (game.genres || []).forEach((item) => genres.add(item));
      (game.tags || []).forEach((item) => tags.add(item));
    }
    if (platform !== 'steam') continue;
    (game.owner_ids || []).forEach((steamId, index) => {
      const id = String(steamId || '').trim();
      if (!id || owners.has(id)) return;
      const name = (game.owner_names || [])[index] || (resolveOwnerName ? resolveOwnerName(id) : id);
      owners.set(id, name);
    });
  }

  return {
    genres: [...genres].sort((a, b) => a.localeCompare(b, 'zh-CN')),
    tags: [...tags].sort((a, b) => a.localeCompare(b, 'zh-CN')),
    owners: [...owners.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
    collections: platform === 'steam' ? (steamCollections || []) : [],
  };
}

export function buildGameListResponse(games, filters, context = {}) {
  const platform = context.platform || 'steam';
  const activeFilters = sanitizeFiltersForPlatform(filters, platform);
  const filtered = filterGames(games, activeFilters, context);
  const sorted = sortGames(filtered, activeFilters.sort, platform);
  const { games: pageGames, pagination } = paginateGames(sorted, filters);

  return {
    games: pageGames,
    filteredCount: pagination.total,
    gameCount: games.length,
    pagination,
    filterOptions: collectFilterOptions(
      games,
      context.platform || 'steam',
      context.resolveOwnerName,
      context.steamCollections,
    ),
  };
}

export function pickRandomFromGames(games, filters, context = {}) {
  const platform = context.platform || 'steam';
  const activeFilters = sanitizeFiltersForPlatform(filters, platform);
  const filtered = sortGames(filterGames(games, activeFilters, context), activeFilters.sort, platform);
  if (!filtered.length) return null;
  return {
    game: filtered[Math.floor(Math.random() * filtered.length)],
    poolSize: filtered.length,
  };
}
