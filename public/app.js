const els = {
  userCards: document.getElementById('userCards'),
  btnAddUser: document.getElementById('btnAddUser'),
  btnRefresh: document.getElementById('btnRefresh'),
  btnImportHidden: document.getElementById('btnImportHidden'),
  btnRandom: document.getElementById('btnRandom'),
  cacheInfo: document.getElementById('cacheInfo'),
  loadProgress: document.getElementById('loadProgress'),
  loadProgressFill: document.getElementById('loadProgressFill'),
  loadProgressText: document.getElementById('loadProgressText'),
  filterSearch: document.getElementById('filterSearch'),
  filterGenre: document.getElementById('filterGenre'),
  filterGenreWrap: document.getElementById('filterGenreWrap'),
  filterTag: document.getElementById('filterTag'),
  filterTagWrap: document.getElementById('filterTagWrap'),
  filterTagOptions: document.getElementById('filterTagOptions'),
  filterOwner: document.getElementById('filterOwner'),
  filterOwnerWrap: document.getElementById('filterOwnerWrap'),
  filterCollection: document.getElementById('filterCollection'),
  filterCollectionWrap: document.getElementById('filterCollectionWrap'),
  filterSort: document.getElementById('filterSort'),
  filterMinHours: document.getElementById('filterMinHours'),
  filterMinHoursWrap: document.getElementById('filterMinHoursWrap'),
  filterMaxHours: document.getElementById('filterMaxHours'),
  filterMaxHoursWrap: document.getElementById('filterMaxHoursWrap'),
  filterUnplayed: document.getElementById('filterUnplayed'),
  filterShareable: document.getElementById('filterShareable'),
  filterNonShareable: document.getElementById('filterNonShareable'),
  filterFamilyOnly: document.getElementById('filterFamilyOnly'),
  filterFavoritesOnly: document.getElementById('filterFavoritesOnly'),
  filterHiddenOnly: document.getElementById('filterHiddenOnly'),
  statsBar: document.getElementById('statsBar'),
  gameGrid: document.getElementById('gameGrid'),
  toast: document.getElementById('toast'),
  randomDialog: document.getElementById('randomDialog'),
  randomBody: document.getElementById('randomBody'),
  btnCloseRandom: document.getElementById('btnCloseRandom'),
  btnRandomAgain: document.getElementById('btnRandomAgain'),
  authSection: document.getElementById('authSection'),
  authStatus: document.getElementById('authStatus'),
  btnTokenModal: document.getElementById('btnTokenModal'),
  tokenDialog: document.getElementById('tokenDialog'),
  tokenDialogTitle: document.getElementById('tokenDialogTitle'),
  btnCloseToken: document.getElementById('btnCloseToken'),
  btnCancelToken: document.getElementById('btnCancelToken'),
  btnOpenTokenPage: document.getElementById('btnOpenTokenPage'),
  inputAccessToken: document.getElementById('inputAccessToken'),
  tokenProfilePreview: document.getElementById('tokenProfilePreview'),
  tokenPreviewAvatar: document.getElementById('tokenPreviewAvatar'),
  tokenPreviewName: document.getElementById('tokenPreviewName'),
  tokenPreviewSteamId: document.getElementById('tokenPreviewSteamId'),
  tokenPreviewHint: document.getElementById('tokenPreviewHint'),
  inputApiKey: document.getElementById('inputApiKey'),
  btnOpenApiKeyPage: document.getElementById('btnOpenApiKeyPage'),
  btnSaveToken: document.getElementById('btnSaveToken'),
  userEditDialog: document.getElementById('userEditDialog'),
  btnCloseUserEdit: document.getElementById('btnCloseUserEdit'),
  btnCancelUserEdit: document.getElementById('btnCancelUserEdit'),
  btnSaveUserEdit: document.getElementById('btnSaveUserEdit'),
  btnEditOpenApiKeyPage: document.getElementById('btnEditOpenApiKeyPage'),
  inputEditApiKey: document.getElementById('inputEditApiKey'),
  inputEditClearApiKey: document.getElementById('inputEditClearApiKey'),
  userEditAvatar: document.getElementById('userEditAvatar'),
  userEditName: document.getElementById('userEditName'),
  userEditSteamId: document.getElementById('userEditSteamId'),
  userEditKeyStatus: document.getElementById('userEditKeyStatus'),
  platformTabs: document.getElementById('platformTabs'),
  steamPanel: document.getElementById('steamPanel'),
  epicPanel: document.getElementById('epicPanel'),
  ubisoftPanel: document.getElementById('ubisoftPanel'),
  epicAuthStatus: document.getElementById('epicAuthStatus'),
  btnEpicConnect: document.getElementById('btnEpicConnect'),
  epicCacheInfo: document.getElementById('epicCacheInfo'),
  ubisoftAuthStatus: document.getElementById('ubisoftAuthStatus'),
  btnUbisoftConnect: document.getElementById('btnUbisoftConnect'),
  ubisoftCacheInfo: document.getElementById('ubisoftCacheInfo'),
  filterChecksSteam: document.querySelector('.filter-checks-steam'),
  epicDialog: document.getElementById('epicDialog'),
  btnCloseEpic: document.getElementById('btnCloseEpic'),
  btnCancelEpic: document.getElementById('btnCancelEpic'),
  btnSaveEpic: document.getElementById('btnSaveEpic'),
  inputEpicEmail: document.getElementById('inputEpicEmail'),
  inputEpicPassword: document.getElementById('inputEpicPassword'),
  inputEpicVerificationCode: document.getElementById('inputEpicVerificationCode'),
  epicVerificationField: document.getElementById('epicVerificationField'),
  epicAuthCodeField: document.getElementById('epicAuthCodeField'),
  inputEpicAuthCode: document.getElementById('inputEpicAuthCode'),
  btnSaveEpicAuthCode: document.getElementById('btnSaveEpicAuthCode'),
  ubisoftDialog: document.getElementById('ubisoftDialog'),
  btnCloseUbisoft: document.getElementById('btnCloseUbisoft'),
  btnCancelUbisoft: document.getElementById('btnCancelUbisoft'),
  btnSaveUbisoft: document.getElementById('btnSaveUbisoft'),
  inputUbisoftEmail: document.getElementById('inputUbisoftEmail'),
  inputUbisoftPassword: document.getElementById('inputUbisoftPassword'),
  inputUbisoftVerificationCode: document.getElementById('inputUbisoftVerificationCode'),
  ubisoftVerificationField: document.getElementById('ubisoftVerificationField'),
  hiddenImportDialog: document.getElementById('hiddenImportDialog'),
  btnCloseHiddenImport: document.getElementById('btnCloseHiddenImport'),
  btnCancelHiddenImport: document.getElementById('btnCancelHiddenImport'),
  btnConfirmHiddenImport: document.getElementById('btnConfirmHiddenImport'),
  inputSteamPath: document.getElementById('inputSteamPath'),
  hiddenImportHint: document.getElementById('hiddenImportHint'),
  pagination: document.getElementById('pagination'),
  btnPagePrev: document.getElementById('btnPagePrev'),
  btnPageNext: document.getElementById('btnPageNext'),
  pageInfo: document.getElementById('pageInfo'),
  appRoot: document.getElementById('appRoot'),
  appSidebar: document.getElementById('appSidebar'),
  btnToggleSidebar: document.getElementById('btnToggleSidebar'),
  btnExpandSidebar: document.getElementById('btnExpandSidebar'),
  btnToggleFilters: document.getElementById('btnToggleFilters'),
  filtersBody: document.getElementById('filtersBody'),
  filtersDrawer: document.getElementById('filtersDrawer'),
  filtersBackdrop: document.getElementById('filtersBackdrop'),
  btnCloseFilters: document.getElementById('btnCloseFilters'),
  libraryMain: document.getElementById('libraryMain'),
  topbarTitle: document.getElementById('topbarTitle'),
  gameEditDialog: document.getElementById('gameEditDialog'),
  btnCloseGameEdit: document.getElementById('btnCloseGameEdit'),
  btnCancelGameEdit: document.getElementById('btnCancelGameEdit'),
  btnSaveGameEdit: document.getElementById('btnSaveGameEdit'),
  gameEditSourceInfo: document.getElementById('gameEditSourceInfo'),
  gameEditPreview: document.getElementById('gameEditPreview'),
  inputDisplayName: document.getElementById('inputDisplayName'),
  inputNameCn: document.getElementById('inputNameCn'),
  inputNameEn: document.getElementById('inputNameEn'),
  inputGenres: document.getElementById('inputGenres'),
  inputTags: document.getElementById('inputTags'),
  inputAliases: document.getElementById('inputAliases'),
  gameEditGenresWrap: document.getElementById('gameEditGenresWrap'),
  gameEditTagsWrap: document.getElementById('gameEditTagsWrap'),
  inputCoverUrl: document.getElementById('inputCoverUrl'),
  inputCoverFile: document.getElementById('inputCoverFile'),
  inputCoverLookup: document.getElementById('inputCoverLookup'),
  btnCoverLookup: document.getElementById('btnCoverLookup'),
  coverLookupResults: document.getElementById('coverLookupResults'),
  inputCoverLocalize: document.getElementById('inputCoverLocalize'),
  inputLockFromRefresh: document.getElementById('inputLockFromRefresh'),
};

const SIDEBAR_COLLAPSED_KEY = 'sidebarCollapsed';
const PLATFORM_TITLES = {
  steam: 'MyGame · Steam',
  epic: 'MyGame · Epic',
  ubisoft: 'MyGame · 育碧',
};

let gameEditTarget = null;
let currentPageGames = [];

let editUserId = '';
let currentPlatform = 'steam';

let tokenPreviewTimer = null;
let tokenPreviewRequestId = 0;
let enrichAbortController = null;
let epicCoverRequested = new Set();

const PAGE_SIZE = 48;
let dynamicPageSize = PAGE_SIZE;
let gridLayoutTimer = null;

let libraryLoaded = false;
let libraryGameCount = 0;
let libraryFilteredCount = 0;
let libraryPagination = { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };
let filterReloadTimer = null;
let currentSteamId = '';
let envHasSteamId = false;
let activeUserId = '';
let users = [];
let includeFamilyLoaded = false;
let loadedAccountCount = 1;
let tokenDialogMode = 'add';
let gamesLoading = false;
let favoriteByPlatform = { steam: new Set(), epic: new Set(), ubisoft: new Set() };
let hiddenByPlatform = { steam: new Set(), epic: new Set(), ubisoft: new Set() };

function debugLog(label, detail = undefined) {
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  if (detail === undefined) {
    console.log(`[MyGame ${time}] ${label}`);
    return;
  }
  console.log(`[MyGame ${time}] ${label}`, detail);
}

function decodeJwtPart(part) {
  if (!part) return null;
  try {
    let padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const remainder = padded.length % 4;
    if (remainder) padded += '='.repeat(4 - remainder);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function parseSteamIdFromToken(token) {
  const parts = String(token || '').trim().split('.');
  for (const part of [parts[1], parts[0], ...parts.slice(2)]) {
    const json = decodeJwtPart(part);
    if (!json) continue;
    for (const key of ['sub', 'steamid', 'steam_id', 'steamId']) {
      const raw = String(json[key] || '').trim();
      if (/^\d{17}$/.test(raw)) return raw;
    }
    const matched = String(json.sub || '').match(/\d{17}/);
    if (matched) return matched[0];
  }
  return '';
}

function normalizeApiKeyInput(raw) {
  return String(raw || '').trim().replace(/\s+/g, '');
}

function isValidApiKeyFormat(apiKey) {
  return /^[A-Fa-f0-9]{32}$/i.test(apiKey);
}

function extractTokenFromPaste(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';

  try {
    const json = JSON.parse(text);
    if (json?.data?.webapi_token) return String(json.data.webapi_token).trim();
    if (json?.webapi_token) return String(json.webapi_token).trim();
  } catch {
    /* not json */
  }

  const quoted = text.match(/"webapi_token"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  if (quoted) return quoted[1].replace(/\\"/g, '"').trim();

  const jwt = text.match(/ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
  if (jwt) return jwt[0];

  return text.replace(/^["']|["']$/g, '').trim();
}

function applyTokenInputValue(raw, notify = false) {
  const extracted = extractTokenFromPaste(raw);
  if (!extracted) return '';
  if (extracted !== String(raw || '').trim()) {
    els.inputAccessToken.value = extracted;
    if (notify) showToast('已自动提取 Token');
  }
  return extracted;
}

function findUserBySteamId(steamId) {
  const target = String(steamId || '').trim();
  if (!target) return null;
  return users.find((u) => u.steamId === target) || null;
}

function getActiveUser() {
  return users.find((u) => u.id === activeUserId) || null;
}

function buildHeaders() {
  const headers = {};
  if (activeUserId) headers['X-User-Id'] = activeUserId;
  return headers;
}

async function readApiJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (text.trimStart().startsWith('<')) {
      throw new Error('服务未正常响应，请重新双击 mygame.bat 启动');
    }
    throw new Error('服务器返回了无效数据');
  }
}

function getToastHost() {
  const dialogs = [
    els.tokenDialog,
    els.userEditDialog,
    els.epicDialog,
    els.ubisoftDialog,
    els.hiddenImportDialog,
    els.randomDialog,
  ];
  return dialogs.find((dialog) => dialog?.open) || document.body;
}

function showToast(message, isError = false) {
  const host = getToastHost();
  if (els.toast.parentElement !== host) {
    host.appendChild(els.toast);
  }

  els.toast.textContent = message;
  els.toast.classList.toggle('error', isError);
  els.toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.add('hidden'), 3200);
}

function formatHours(minutes) {
  const hours = minutes / 60;
  if (hours < 1) return `${minutes} 分钟`;
  return `${hours.toFixed(1)} 小时`;
}

function coverUrl(appid) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
}

function iconUrl(appid, hash) {
  if (hash) {
    return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${hash}.jpg`;
  }
  return coverUrl(appid);
}

function gamePlatform(game) {
  return game.platform || 'steam';
}

function gameSourceName(game) {
  return game.source_name_cn || game.source_name || game.name_cn || game.name || '';
}

function gameStoreUrl(game) {
  const url = String(game.store_url || '').trim();
  if (url && url !== '#') {
    if (gamePlatform(game) === 'epic' && /browse\?namespace=/i.test(url)) {
      const name = gameSourceName(game);
      if (name) return `https://store.epicgames.com/browse?q=${encodeURIComponent(name)}`;
    }
    return url;
  }
  if (gamePlatform(game) === 'steam') {
    return `https://store.steampowered.com/app/${game.appid}`;
  }
  if (gamePlatform(game) === 'epic') {
    const name = gameSourceName(game);
    if (name) return `https://store.epicgames.com/browse?q=${encodeURIComponent(name)}`;
  }
  return '#';
}

function gameCoverImage(game) {
  if (game.cover_url) return game.cover_url;
  if (gamePlatform(game) === 'steam') return coverUrl(game.appid);
  return '';
}

function gameCoverFallback(game) {
  if (gamePlatform(game) === 'steam') return iconUrl(game.appid, game.img_icon_url);
  return '';
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function gameCoverAbbrev(title) {
  const text = String(title || '').replace(/[®™©《》「」【】]/g, '').trim();
  if (!text) return '?';
  if (/[\u4e00-\u9fff]/.test(text)) {
    const parts = text.split(/[：:·\s\-—]+/).filter(Boolean);
    if (parts.length >= 2) {
      return parts.slice(0, 2).map((part) => part[0]).join('').slice(0, 3);
    }
    const chinese = text.replace(/[^\u4e00-\u9fff]/g, '');
    return chinese.slice(0, 2) || text.slice(0, 2);
  }
  const words = text.split(/[\s:：\-–—]+/).filter((word) => /[a-z0-9]/i.test(word));
  if (words.length >= 2) {
    return words.slice(0, 3).map((word) => word[0]?.toUpperCase() || '').join('');
  }
  return text.slice(0, 3).toUpperCase();
}

function gameCoverPlaceholderColor(seed) {
  let hash = 0;
  const value = String(seed || '0');
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return `hsl(${hash % 360} 42% 32%)`;
}

function gameCoverPlaceholderHtml(game, { fallback = false } = {}) {
  const title = gameTitle(game);
  const abbrev = escapeHtml(gameCoverAbbrev(title));
  const bg = gameCoverPlaceholderColor(game.appid || title);
  const classes = fallback
    ? 'game-cover game-cover-placeholder is-fallback hidden'
    : 'game-cover game-cover-placeholder';
  return `<div class="${classes}" style="background:${bg}" aria-hidden="true"><span class="game-cover-abbrev">${abbrev}</span></div>`;
}

function gameCoverMarkup(game) {
  const cover = gameCoverImage(game);
  const fallback = gameCoverFallback(game);
  const placeholder = gameCoverPlaceholderHtml(game, { fallback: !!cover });
  if (!cover) return placeholder;
  const alt = escapeHtml(gameTitle(game));
  const fallbackAttr = fallback ? ` data-fallback="${escapeHtml(fallback)}"` : '';
  return `<img class="game-cover" src="${escapeHtml(cover)}" alt="${alt}" loading="lazy"${fallbackAttr}>${placeholder}`;
}

function handleGameCoverError(img) {
  const fallback = img.dataset.fallback;
  if (fallback && !img.dataset.fallbackTried) {
    img.dataset.fallbackTried = '1';
    img.src = fallback;
    return;
  }
  img.classList.add('is-hidden');
  const wrap = img.closest('.game-cover-wrap, .random-cover-wrap');
  wrap?.querySelector('.game-cover-placeholder.is-fallback')?.classList.remove('hidden');
}

function gameSearchText(g) {
  const parts = [
    g.display_name,
    g.custom_name_cn,
    g.custom_name_en,
    g.name,
    g.name_cn,
    g.source_name,
    g.source_name_cn,
    ...(g.aliases || []),
  ];
  if (currentPlatform === 'steam') {
    parts.push(...(g.genres || []), ...(g.tags || []));
  }
  return parts.filter(Boolean).join(' ').toLowerCase();
}

const SORT_OPTIONS_STEAM = [
  { value: 'name-asc', label: '名称 A-Z' },
  { value: 'name-desc', label: '名称 Z-A' },
  { value: 'playtime-desc', label: '游玩时长 ↓' },
  { value: 'playtime-asc', label: '游玩时长 ↑' },
  { value: 'recent', label: '最近游玩' },
];

const SORT_OPTIONS_COMMON = [
  { value: 'name-asc', label: '名称 A-Z' },
  { value: 'name-desc', label: '名称 Z-A' },
];

function updateSortOptionsForPlatform() {
  const isSteam = currentPlatform === 'steam';
  const options = isSteam ? SORT_OPTIONS_STEAM : SORT_OPTIONS_COMMON;
  const current = els.filterSort.value;
  els.filterSort.innerHTML = options
    .map((item) => `<option value="${item.value}">${item.label}</option>`)
    .join('');
  els.filterSort.value = options.some((item) => item.value === current) ? current : 'name-asc';
}

function clearSteamOnlyFilterValues() {
  els.filterGenre.value = '';
  els.filterTag.value = '';
  els.filterMinHours.value = '0';
  els.filterMaxHours.value = '';
  els.filterUnplayed.checked = false;
  els.filterShareable.checked = false;
  els.filterNonShareable.checked = false;
  els.filterFamilyOnly.checked = false;
  els.filterOwner.value = '';
  els.filterCollection.value = '';
  if (!SORT_OPTIONS_COMMON.some((item) => item.value === els.filterSort.value)) {
    els.filterSort.value = 'name-asc';
  }
}

function gameMatchesSearch(g, search) {
  if (!search) return true;
  const q = search.toLowerCase();
  const text = gameSearchText(g);
  if (text.includes(q)) return true;
  const qCompact = q.replace(/\s+/g, '');
  if (qCompact.length >= 2 && text.replace(/\s+/g, '').includes(qCompact)) return true;
  return false;
}

function gameTitle(g) {
  if (g.display_name) return g.display_name;
  const customCn = g.custom_name_cn || '';
  if (customCn && customCn !== g.name) return customCn;
  if (g.name_cn && g.name_cn !== g.name) return g.name_cn;
  return g.name || '';
}

function gameSubtitle(g) {
  const customEn = g.custom_name_en || '';
  if (customEn && customEn !== gameTitle(g)) return customEn;
  if (g.source_name && g.source_name !== gameTitle(g)) return g.source_name;
  if (g.name_cn && g.name && g.name_cn !== g.name && g.name_cn !== gameTitle(g)) return g.name;
  return '';
}

function updateModeUi() {
  const isSteam = currentPlatform === 'steam';
  els.filterChecksSteam?.classList.toggle('hidden', !isSteam);
  els.filterGenreWrap?.classList.toggle('hidden', !isSteam);
  els.filterTagWrap?.classList.toggle('hidden', !isSteam);
  els.filterMinHoursWrap?.classList.toggle('hidden', !isSteam);
  els.filterMaxHoursWrap?.classList.toggle('hidden', !isSteam);
  els.filterOwnerWrap?.classList.toggle('hidden', !isSteam);
  els.filterCollectionWrap?.classList.toggle('hidden', !isSteam);
  els.filterGenre.disabled = !isSteam || !libraryLoaded;
  els.filterTag.disabled = !isSteam || !libraryLoaded;
  els.filterMinHours.disabled = !isSteam || !libraryLoaded;
  els.filterMaxHours.disabled = !isSteam || !libraryLoaded;
  els.filterUnplayed.disabled = !isSteam || !libraryLoaded;
  els.filterShareable.disabled = !isSteam || !libraryLoaded;
  els.filterNonShareable.disabled = !isSteam || !libraryLoaded;
  els.filterFamilyOnly.disabled = !isSteam || !libraryLoaded;
  els.filterFavoritesOnly.disabled = !libraryLoaded;
  els.filterHiddenOnly.disabled = !libraryLoaded;
  els.filterOwner.disabled = !isSteam || !libraryLoaded;
  els.filterCollection.disabled = !isSteam || !libraryLoaded;
  els.btnImportHidden.disabled = !isSteam || !activeUserId;
  els.btnImportHidden?.classList.toggle('hidden', !isSteam);
  updateSortOptionsForPlatform();
  if (els.topbarTitle) {
    els.topbarTitle.textContent = PLATFORM_TITLES[currentPlatform] || '游戏库';
  }
}

function setSidebarCollapsed(collapsed) {
  els.appRoot?.classList.toggle('sidebar-collapsed', collapsed);
  els.btnToggleSidebar?.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
  } catch {
    /* ignore */
  }
  requestAnimationFrame(() => layoutGameGrid({ reload: true }));
}

function toggleSidebar() {
  setSidebarCollapsed(!els.appRoot?.classList.contains('sidebar-collapsed'));
}

function initSidebarState() {
  let collapsed = false;
  try {
    collapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    /* ignore */
  }
  setSidebarCollapsed(collapsed);
}

function setFiltersExpanded(expanded) {
  els.filtersDrawer?.classList.toggle('collapsed', !expanded);
  els.filtersDrawer?.setAttribute('aria-hidden', expanded ? 'false' : 'true');
  els.filtersBackdrop?.classList.toggle('hidden', !expanded);
  els.btnToggleFilters?.setAttribute('aria-expanded', expanded ? 'true' : 'false');
  if (els.btnToggleFilters) {
    els.btnToggleFilters.textContent = expanded ? '收起筛选' : '筛选';
  }
  if (!expanded) {
    requestAnimationFrame(() => layoutGameGrid());
  }
}

function toggleFilters() {
  const expanded = els.filtersDrawer?.classList.contains('collapsed');
  setFiltersExpanded(!!expanded);
}

function layoutGameGrid(options = {}) {
  const { reload = false } = options;
  if (!els.libraryMain || !els.gameGrid) return;

  const styles = getComputedStyle(document.documentElement);
  const gap = parseFloat(styles.getPropertyValue('--card-gap')) || 10;
  const mainRect = els.libraryMain.getBoundingClientRect();
  const paginationH = els.pagination ? els.pagination.offsetHeight + 6 : 36;
  const availableH = Math.max(220, mainRect.height - paginationH);
  const availableW = els.gameGrid.clientWidth || mainRect.width;

  const minCardW = 162;
  let cols = Math.floor((availableW + gap) / (minCardW + gap));
  cols = Math.max(4, Math.min(cols, 12));

  const cardW = cols > 0 ? (availableW - gap * Math.max(cols - 1, 0)) / cols : availableW;
  const coverRatio = 215 / 460;
  const coverH = cardW * coverRatio;
  const bodyH = 64;
  const cardH = coverH + bodyH;
  let rows = Math.floor((availableH + gap) / (cardH + gap));
  rows = Math.max(2, rows - 1);

  const pageSize = Math.max(cols * rows, cols * 2);

  document.documentElement.style.setProperty('--grid-cols', String(cols));
  document.documentElement.style.setProperty('--grid-rows', String(rows));
  document.documentElement.style.setProperty('--card-min-height', `${Math.ceil(cardH)}px`);

  const sizeChanged = pageSize !== dynamicPageSize;
  dynamicPageSize = pageSize;
  libraryPagination.pageSize = pageSize;

  if ((reload || sizeChanged) && libraryLoaded && !gamesLoading) {
    clearTimeout(gridLayoutTimer);
    gridLayoutTimer = setTimeout(() => {
      fetchLibraryPage(false, 1, { quiet: true }).catch(() => {});
    }, 120);
  }
}

function setControlsEnabled(enabled) {
  [
    els.btnRefresh,
    els.btnRandom,
    els.filterSearch,
    els.filterGenre,
    els.filterTag,
    els.filterOwner,
    els.filterCollection,
    els.filterSort,
    els.filterMinHours,
    els.filterMaxHours,
    els.filterUnplayed,
    els.filterShareable,
    els.filterNonShareable,
    els.filterFamilyOnly,
    els.filterFavoritesOnly,
    els.filterHiddenOnly,
  ].forEach((el) => {
    el.disabled = !enabled;
  });
}

function getFilterParams() {
  return {
    search: els.filterSearch.value.trim(),
    genre: els.filterGenre.value,
    tagSearch: els.filterTag.value.trim(),
    unplayed: els.filterUnplayed.checked,
    shareableOnly: els.filterShareable.checked,
    nonShareableOnly: els.filterNonShareable.checked,
    familyOnly: els.filterFamilyOnly.checked,
    favoritesOnly: els.filterFavoritesOnly.checked,
    hiddenOnly: els.filterHiddenOnly.checked,
    ownerSteamId: els.filterOwner.value,
    steamCollectionId: els.filterCollection.value,
    minHours: Number(els.filterMinHours.value) || 0,
    maxHours: els.filterMaxHours.value ? Number(els.filterMaxHours.value) : Infinity,
  };
}

function buildFilterQueryParams(page = libraryPagination.page) {
  const params = new URLSearchParams();
  const isSteam = currentPlatform === 'steam';
  params.set('page', String(page));
  params.set('pageSize', String(dynamicPageSize || PAGE_SIZE));
  params.set('sort', els.filterSort.value);

  const filters = getFilterParams();
  if (filters.search) params.set('search', filters.search);
  if (isSteam) {
    if (filters.genre) params.set('genre', filters.genre);
    if (filters.tagSearch) params.set('tagSearch', filters.tagSearch);
    if (filters.unplayed) params.set('unplayed', 'true');
    if (filters.shareableOnly) params.set('shareableOnly', 'true');
    if (filters.nonShareableOnly) params.set('nonShareableOnly', 'true');
    if (filters.familyOnly) params.set('familyOnly', 'true');
    if (filters.ownerSteamId) params.set('ownerSteamId', filters.ownerSteamId);
    if (filters.steamCollectionId) params.set('steamCollectionId', filters.steamCollectionId);
    if (filters.minHours > 0) params.set('minHours', String(filters.minHours));
    if (Number.isFinite(filters.maxHours)) params.set('maxHours', String(filters.maxHours));
  }
  if (filters.favoritesOnly) params.set('favoritesOnly', 'true');
  if (filters.hiddenOnly) params.set('hiddenOnly', 'true');
  return params;
}

function populateFilterOptionsFromServer(filterOptions = {}) {
  const genres = filterOptions.genres || [];
  const tags = filterOptions.tags || [];
  const owners = filterOptions.owners || [];
  const collections = filterOptions.collections || [];

  const genreVal = els.filterGenre.value;
  els.filterGenre.innerHTML = '<option value="">全部类型</option>' +
    genres.map((item) => `<option value="${item}">${item}</option>`).join('');
  if (genreVal && genres.includes(genreVal)) {
    els.filterGenre.value = genreVal;
  } else {
    els.filterGenre.value = '';
  }

  const tagVal = els.filterTag.value;
  const tagOptions = [...new Set(tags)].sort((a, b) => a.localeCompare(b, 'zh-CN'));
  els.filterTagOptions.innerHTML = tagOptions.map((item) => `<option value="${escapeHtml(item)}"></option>`).join('');
  if (tagVal && tagOptions.includes(tagVal)) {
    els.filterTag.value = tagVal;
  }

  const ownerVal = els.filterOwner.value;
  els.filterOwner.innerHTML = '<option value="">全部所有者</option>' +
    owners.map((item) => `<option value="${item.id}">${item.name}</option>`).join('');
  if (ownerVal && owners.some((item) => item.id === ownerVal)) {
    els.filterOwner.value = ownerVal;
  } else {
    els.filterOwner.value = '';
  }
  els.filterOwnerWrap?.classList.toggle('hidden', currentPlatform !== 'steam' || owners.length <= 1);

  const collectionVal = els.filterCollection.value;
  els.filterCollection.innerHTML = '<option value="">全部收藏夹</option>' +
    collections.map((item) => `<option value="${item.id}">${item.name} (${item.count})</option>`).join('');
  if (collectionVal && collections.some((item) => item.id === collectionVal)) {
    els.filterCollection.value = collectionVal;
  } else {
    els.filterCollection.value = '';
  }
  els.filterCollectionWrap?.classList.toggle('hidden', currentPlatform !== 'steam' || !collections.length);
}

function renderPagination() {
  const { page, totalPages, total } = libraryPagination;
  const show = libraryLoaded && totalPages > 1;
  els.pagination?.classList.toggle('hidden', !show);
  if (!show) return;

  els.pageInfo.textContent = `第 ${page} / ${totalPages} 页 · 共 ${total} 款`;
  els.btnPagePrev.disabled = page <= 1 || gamesLoading;
  els.btnPageNext.disabled = page >= totalPages || gamesLoading;
}

function renderGameCards(games) {
  if (!games.length) {
    els.gameGrid.innerHTML = '<div class="empty-state">没有符合筛选条件的游戏</div>';
    return;
  }

  els.gameGrid.innerHTML = games
    .map((g) => {
      const subtitle = gameSubtitle(g);
      const genreText = (g.genres || []).slice(0, 2).join(' · ');
      const coverMarkup = gameCoverMarkup(g);
      const isSteam = gamePlatform(g) === 'steam';
      return `
      <article class="game-card" data-appid="${g.appid}" data-platform="${gamePlatform(g)}" data-source-name="${escapeHtml(g.source_name || g.name || '')}">
        <div class="game-cover-wrap">
          ${coverMarkup}
          ${gameCoverActionsHtml(g)}
        </div>
        <div class="game-body">
          <h3 class="game-name">${gameTitle(g)}</h3>
          ${subtitle ? `<div class="game-subtitle">${subtitle}</div>` : ''}
          ${isSteam && genreText ? `<div class="game-genres">${genreText}</div>` : ''}
          ${isSteam ? steamOwnerRowHtml(g) : ''}
          ${isSteam ? `<div class="game-meta">
            <span>${formatHours(g.playtime_forever)}</span>
            ${g.from_family ? '<span class="badge badge-family">家庭库</span>' : ''}
            ${g.shareable === false ? '<span class="badge badge-warn">不可共享</span>' : ''}
            ${g.playtime_forever === 0 ? '<span class="badge">未游玩</span>' : ''}
          </div>` : ''}
        </div>
      </article>`;
    })
    .join('');
}

function applyLibraryResponse(data) {
  libraryLoaded = (data.gameCount || 0) > 0;
  libraryGameCount = data.gameCount || 0;
  libraryFilteredCount = data.filteredCount ?? libraryGameCount;
  libraryPagination = data.pagination || { page: 1, pageSize: PAGE_SIZE, total: libraryFilteredCount, totalPages: 1 };
  populateFilterOptionsFromServer(data.filterOptions);
  currentPageGames = data.games || [];
  renderGameCards(currentPageGames);
  if (currentPlatform === 'epic') {
    loadEpicPageCovers(data.games || []).catch(() => {});
  }

  const familyText = currentPlatform === 'steam' && includeFamilyLoaded ? ' · 含家庭库' : '';
  const accountText = currentPlatform === 'steam' && loadedAccountCount > 1 ? ` · ${loadedAccountCount} 个账号` : '';
  const favCount = favoriteByPlatform[currentPlatform]?.size || 0;
  const hiddenCount = hiddenByPlatform[currentPlatform]?.size || 0;
  const favText = favCount ? ` · 收藏 ${favCount}` : '';
  const hiddenText = hiddenCount ? ` · 隐藏 ${hiddenCount}` : '';
  els.statsBar.textContent = `共 ${libraryGameCount} 款，显示 ${libraryFilteredCount} 款${accountText}${familyText}${favText}${hiddenText}`;

  renderPagination();
  setControlsEnabled(libraryLoaded);
  updateModeUi();
  requestAnimationFrame(() => layoutGameGrid());
}

function scheduleLibraryReload() {
  if (!libraryLoaded || gamesLoading) return;
  clearTimeout(filterReloadTimer);
  filterReloadTimer = setTimeout(() => {
    fetchLibraryPage(false, 1, { quiet: true }).catch((err) => showToast(err.message, true));
  }, 250);
}

function getLibraryApiUrl(refresh, page) {
  const params = buildFilterQueryParams(page);
  if (refresh) params.set('refresh', 'true');

  if (currentPlatform === 'steam') {
    const user = getActiveUser();
    const steamId = (user?.steamId || '').trim();
    if (steamId) params.set('steamId', steamId);
    params.set('includeFamily', 'true');
    return `/api/games?${params.toString()}`;
  }
  if (currentPlatform === 'epic') {
    return `/api/epic/games?${params.toString()}`;
  }
  return `/api/ubisoft/games?${params.toString()}`;
}

async function fetchLibraryPage(refresh = false, page = 1, options = {}) {
  const { quiet = false, autoFetchIfNoCache = false } = options;

  if (currentPlatform === 'steam') {
    const user = getActiveUser();
    const steamId = (user?.steamId || '').trim();
    if (!steamId && !envHasSteamId) {
      if (!quiet) showToast('请先添加用户', true);
      return;
    }
    if (refresh) await ensureTokenReady();
  } else if (currentPlatform === 'epic') {
    if (refresh) {
      const valid = await refreshEpicAuthStatus();
      if (!valid) {
        openEpicDialog();
        throw new Error('Epic 连接已过期，请重新连接后再刷新');
      }
    } else {
      await refreshEpicAuthStatus();
    }
  } else if (currentPlatform === 'ubisoft') {
    if (refresh) {
      const valid = await refreshUbisoftAuthStatus();
      if (!valid) {
        openUbisoftDialog();
        throw new Error('育碧连接已过期，请重新登录后再刷新');
      }
    } else {
      await refreshUbisoftAuthStatus();
    }
  }

  if (gamesLoading) return;
  if (refresh) {
    abortEnrichStream();
    resetEpicCoverState();
  }
  gamesLoading = true;
  els.btnRefresh.disabled = true;
  els.btnRefresh.textContent = refresh ? '更新中...' : '加载中...';
  renderPagination();

  const cacheInfoEl = currentPlatform === 'steam'
    ? els.cacheInfo
    : currentPlatform === 'epic'
      ? els.epicCacheInfo
      : els.ubisoftCacheInfo;
  cacheInfoEl.textContent = refresh ? '正在拉取最新数据...' : '正在加载...';

  try {
    const headers = currentPlatform === 'steam' ? buildHeaders() : undefined;
    const startedAt = performance.now();
    let res = await fetch(getLibraryApiUrl(refresh, page), headers ? { headers } : undefined);
    let data = await readApiJson(res);

    if (res.status === 401 && data.needAuth) {
      if (currentPlatform === 'steam') openTokenDialog('update');
      if (currentPlatform === 'epic') openEpicDialog();
      if (currentPlatform === 'ubisoft') openUbisoftDialog();
      throw new Error(data.error || '请先完成账号连接');
    }
    if (!res.ok) throw new Error(data.error || '加载失败');

    if (autoFetchIfNoCache && !refresh && data.fromCache === true && data.gameCount === 0) {
      if (currentPlatform === 'steam') await ensureTokenReady();
      cacheInfoEl.textContent = '缓存为空，正在拉取...';
      res = await fetch(getLibraryApiUrl(true, page), headers ? { headers } : undefined);
      data = await readApiJson(res);
      if (!res.ok) throw new Error(data.error || '加载失败');
    }

    if (currentPlatform === 'steam') {
      currentSteamId = data.steamId || currentSteamId;
      includeFamilyLoaded = !!data.includeFamily;
      loadedAccountCount = data.accountCount || 1;
      await loadSteamUserPrefs();
      if (data.tokenExpired) {
        els.authStatus.className = 'auth-status warn';
        els.authStatus.textContent = 'Token 已过期 · 显示缓存';
      }
    } else {
      includeFamilyLoaded = false;
      loadedAccountCount = 1;
      if (currentPlatform === 'ubisoft' && data.sessionExpired) {
        els.ubisoftAuthStatus.className = 'auth-status warn';
        els.ubisoftAuthStatus.textContent = '育碧连接已过期 · 显示缓存';
      }
    }

    applyLibraryResponse(data);

    const time = data.cachedAt ? new Date(data.cachedAt).toLocaleString('zh-CN') : '';
    const sourceText = data.source === 'cache'
      ? (data.sessionExpired ? '来自缓存 · 连接已过期' : '来自本地缓存')
      : data.source === 'remote-refresh'
        ? '已手动更新'
        : `已从 ${currentPlatform === 'steam' ? 'Steam' : currentPlatform === 'epic' ? 'Epic' : '育碧'} 获取`;
    cacheInfoEl.textContent = `${sourceText}${time ? ` · ${time}` : ''} · ${data.gameCount} 款`;
    if (currentPlatform === 'ubisoft' && data.fromCache && els.ubisoftAuthStatus.classList.contains('warn')) {
      els.ubisoftAuthStatus.textContent = '育碧连接已过期 · 显示缓存';
      if (!data.sessionExpired) {
        cacheInfoEl.textContent = `来自缓存 · 连接已过期${time ? ` · ${time}` : ''} · ${data.gameCount} 款`;
      }
    }

    debugLog('游戏库分页加载', {
      platform: currentPlatform,
      page: data.pagination?.page,
      ms: Math.round(performance.now() - startedAt),
      gameCount: data.gameCount,
      filteredCount: data.filteredCount,
    });

    if (!quiet) {
      showToast(data.fromCache ? '已加载缓存' : '游戏库已更新');
    }

    if (currentPlatform === 'steam' && (data.metaPending || 0) > 0) {
      enrichGamesMeta((data.steamId || currentSteamId).split(',')[0].trim()).catch(() => {});
    }
  } catch (err) {
    debugLog('游戏库加载失败', { message: err.message });
    if (!quiet && ![
      'Epic 连接已过期，请重新连接后再刷新',
      '育碧连接已过期，请重新登录后再刷新',
    ].includes(err.message)) {
      showToast(err.message, true);
    }
    if (!libraryLoaded) {
      els.statsBar.textContent = err.message.includes('Token') ? err.message : '加载失败';
      els.gameGrid.innerHTML = `<div class="empty-state">${err.message || '加载失败'}</div>`;
      els.pagination?.classList.add('hidden');
    }
    throw err;
  } finally {
    gamesLoading = false;
    els.btnRefresh.disabled = !libraryLoaded;
    els.btnRefresh.textContent = '刷新数据';
    renderPagination();
  }
}

function resolveOwnerName(steamId) {
  const id = String(steamId || '').trim();
  if (!id) return '';
  const user = users.find((u) => u.steamId === id);
  if (user) return userCardLabel(user);
  return `用户 …${id.slice(-4)}`;
}

function ownerNames(game) {
  if (Array.isArray(game.owner_names) && game.owner_names.length) {
    return game.owner_names.filter(Boolean);
  }
  return (game.owner_ids || []).map((id) => resolveOwnerName(id)).filter(Boolean);
}

function ownerLabel(game) {
  return ownerNames(game).join(' · ');
}

function ownerBadgesHtml(game) {
  const names = ownerNames(game);
  if (!names.length) return '';
  return names.map((name) => `<span class="badge badge-owner">${escapeHtml(name)}</span>`).join('');
}

function steamOwnerRowHtml(game) {
  let badges = ownerBadgesHtml(game);
  if (!badges) {
    const user = getActiveUser();
    if (user?.steamId) {
      badges = `<span class="badge badge-owner">${escapeHtml(userCardLabel(user))}</span>`;
    }
  }
  if (!badges) return '';
  return `<div class="game-owners">${badges}</div>`;
}

function createEmptyPlatformSets() {
  return { steam: new Set(), epic: new Set(), ubisoft: new Set() };
}

function normalizePrefPlatform(platform) {
  const value = String(platform || currentPlatform || 'steam').trim().toLowerCase();
  return ['steam', 'epic', 'ubisoft'].includes(value) ? value : 'steam';
}

function normalizePrefAppId(platform, appid) {
  const p = normalizePrefPlatform(platform);
  const raw = String(appid ?? '').trim();
  if (!raw) return '';
  if (p === 'steam') {
    const id = Number(raw);
    return id > 0 ? String(Math.trunc(id)) : '';
  }
  return raw;
}

function applyPlatformPrefSets(target, platforms) {
  if (!platforms) return;
  target.steam = new Set((platforms.steam || []).map((id) => String(Number(id))).filter(Boolean));
  target.epic = new Set(platforms.epic || []);
  target.ubisoft = new Set(platforms.ubisoft || []);
}

function isFavorite(appid, platform = currentPlatform) {
  const p = normalizePrefPlatform(platform);
  const id = normalizePrefAppId(p, appid);
  return id ? favoriteByPlatform[p]?.has(id) : false;
}

function favoriteButtonHtml(appid, platform = currentPlatform, extraClass = '') {
  const p = normalizePrefPlatform(platform);
  const id = normalizePrefAppId(p, appid);
  const active = isFavorite(id, p);
  const cls = `btn-favorite${active ? ' is-favorite' : ''}${extraClass ? ` ${extraClass}` : ''}`;
  const label = active ? '取消收藏' : '收藏';
  return `<button type="button" class="${cls}" data-appid="${escapeHtml(id)}" data-platform="${p}" aria-label="${label}" title="${label}">${active ? '★' : '☆'}</button>`;
}

function isHidden(appid, platform = currentPlatform) {
  const p = normalizePrefPlatform(platform);
  const id = normalizePrefAppId(p, appid);
  return id ? hiddenByPlatform[p]?.has(id) : false;
}

function hiddenButtonHtml(appid, platform = currentPlatform, extraClass = '') {
  const p = normalizePrefPlatform(platform);
  const id = normalizePrefAppId(p, appid);
  const active = isHidden(id, p);
  const cls = `btn-hidden${active ? ' is-hidden' : ''}${extraClass ? ` ${extraClass}` : ''}`;
  const label = active ? '取消隐藏' : '隐藏';
  return `<button type="button" class="${cls}" data-appid="${escapeHtml(id)}" data-platform="${p}" aria-label="${label}" title="${label}">${active ? '🙈' : '👁'}</button>`;
}

const STEAM_ICON_SVG = `<svg class="btn-steam-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 2a9.99 9.99 0 0 0-9.91 8.68l5.66 2.34a2.89 2.89 0 0 1 1.64-.51c.08 0 .16.01.24.02l2.53-3.67V9.9c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4h-.09l-3.67 2.53c.01.08.02.16.02.24 0 .58-.18 1.12-.51 1.64l2.34 5.66A9.99 9.99 0 1 0 12 2zm-1.18 14.58l-1.47-3.55 2.12-1.54.9 2.17-1.55 2.92zm7.06-2.65a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>`;
const EPIC_ICON_SVG = `<svg class="btn-steam-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M4 4h16v16H4V4zm3.2 4.8v6.4h2.4l1.6-4 1.6 4h2.4V8.8H12l-1.4 3.6L9.2 8.8H7.2z"/></svg>`;
const UBI_ICON_SVG = `<svg class="btn-steam-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M8 12h8v2H8z"/></svg>`;

function storeButtonHtml(game) {
  const platform = gamePlatform(game);
  const url = gameStoreUrl(game);
  const labels = { steam: 'Steam', epic: 'Epic', ubisoft: '育碧' };
  const icons = { steam: STEAM_ICON_SVG, epic: EPIC_ICON_SVG, ubisoft: UBI_ICON_SVG };
  const label = labels[platform] || '商店';
  return `<button type="button" class="btn-platform-store btn-platform-store-${platform}" data-store-url="${url}" aria-label="在 ${label} 商店查看" title="${label} 商店">${icons[platform] || ''}</button>`;
}

function gameCoverActionsHtml(game) {
  const platform = gamePlatform(game);
  return `<div class="game-cover-actions">${gameEditButtonHtml(game)}${storeButtonHtml(game)}${hiddenButtonHtml(game.appid, platform)}${favoriteButtonHtml(game.appid, platform)}</div>`;
}

function gameEditButtonHtml(game) {
  const platform = gamePlatform(game);
  const locked = game.lock_from_refresh ? ' is-locked' : '';
  return `<button type="button" class="btn-game-edit${locked}" data-appid="${escapeHtml(game.appid)}" data-platform="${platform}" title="编辑资料" aria-label="编辑资料">✎</button>`;
}

function listToInputValue(list) {
  return Array.isArray(list) ? list.filter(Boolean).join(', ') : '';
}

function setGameEditPreview(url) {
  els.gameEditPreview.innerHTML = url
    ? `<img src="${escapeHtml(url)}" alt="封面预览">`
    : '<div class="empty-state">暂无封面</div>';
}

async function openGameEditDialog(game) {
  const platform = gamePlatform(game);
  gameEditTarget = {
    appid: game.appid,
    platform,
    source_name: game.source_name || game.name || '',
    source_name_cn: game.source_name_cn || game.name_cn || '',
  };

  const isSteam = platform === 'steam';
  els.gameEditGenresWrap?.classList.toggle('hidden', !isSteam);
  els.gameEditTagsWrap?.classList.toggle('hidden', !isSteam);

  els.gameEditSourceInfo.textContent = `平台原名：${gameEditTarget.source_name_cn || gameEditTarget.source_name || '—'} · ${platform}`;
  els.inputDisplayName.value = game.display_name || '';
  els.inputNameCn.value = game.custom_name_cn || game.name_cn || '';
  els.inputNameEn.value = game.custom_name_en || game.source_name || game.name || '';
  els.inputGenres.value = listToInputValue(game.genres);
  els.inputTags.value = listToInputValue(game.tags);
  els.inputAliases.value = listToInputValue(game.aliases);
  els.inputCoverUrl.value = game.cover_url?.startsWith('http') ? game.cover_url : '';
  els.inputCoverFile.value = '';
  els.inputCoverLookup.value = game.custom_name_cn || game.name_cn || game.name || '';
  els.coverLookupResults.innerHTML = '';
  els.inputCoverLocalize.checked = true;
  els.inputLockFromRefresh.checked = !!game.lock_from_refresh;

  try {
    const res = await fetch(
      `/api/games/${platform}/${encodeURIComponent(game.appid)}/override`,
      { headers: buildHeaders() },
    );
    const data = await readApiJson(res);
    if (res.ok && data.override) {
      const o = data.override;
      els.inputDisplayName.value = o.display_name || els.inputDisplayName.value;
      els.inputNameCn.value = o.name_cn || els.inputNameCn.value;
      els.inputNameEn.value = o.name_en || els.inputNameEn.value;
      els.inputGenres.value = listToInputValue(o.genres);
      els.inputTags.value = listToInputValue(o.tags);
      els.inputAliases.value = listToInputValue(o.aliases);
      els.inputLockFromRefresh.checked = !!o.lock_from_refresh;
      if (o.cover_url && o.cover_url.startsWith('http')) {
        els.inputCoverUrl.value = o.cover_url;
      }
      if (o.resolved_cover_url) setGameEditPreview(o.resolved_cover_url);
    }
  } catch {
    /* ignore */
  }

  if (!els.gameEditPreview.querySelector('img')) {
    setGameEditPreview(gameCoverImage(game));
  }
  els.gameEditDialog?.showModal();
}

function closeGameEditDialog() {
  els.gameEditDialog?.close();
  gameEditTarget = null;
}

function renderCoverLookupResults(results) {
  if (!results.length) {
    els.coverLookupResults.innerHTML = '<div class="empty-state">未找到匹配游戏</div>';
    return;
  }
  els.coverLookupResults.innerHTML = results.map((item) => `
    <button type="button" class="cover-lookup-item"
      data-url="${escapeHtml(item.cover_url || '')}"
      data-name="${escapeHtml(item.name || '')}"
      data-name-cn="${escapeHtml(item.name_cn || item.name || '')}"
      data-genres="${escapeHtml((item.genres || []).join(', '))}">
      ${item.cover_url ? `<img src="${escapeHtml(item.cover_url)}" alt="">` : '<span class="cover-lookup-placeholder">无图</span>'}
      <span class="cover-lookup-name">${escapeHtml(item.name_cn || item.name || '')}</span>
      <span class="cover-lookup-source">${escapeHtml(item.source || '')}</span>
    </button>
  `).join('');
}

async function lookupCoverCandidates() {
  const q = els.inputCoverLookup.value.trim();
  if (q.length < 2) {
    showToast('请至少输入 2 个字符', true);
    return;
  }
  els.btnCoverLookup.disabled = true;
  els.btnCoverLookup.textContent = '搜索中...';
  try {
    const res = await fetch(`/api/games/lookup?q=${encodeURIComponent(q)}`);
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || '搜索失败');
    renderCoverLookupResults(data.results || []);
  } catch (err) {
    showToast(err.message, true);
  } finally {
    els.btnCoverLookup.disabled = false;
    els.btnCoverLookup.textContent = '搜索';
  }
}

function applyGameEditToCard(appid, platform, patch = {}) {
  const selector = `.game-card[data-appid="${CSS.escape(String(appid))}"][data-platform="${platform}"]`;
  const card = document.querySelector(selector);
  if (!card) return;

  if (patch.cover_url) {
    const img = card.querySelector('.game-cover');
    if (img) {
      img.src = patch.cover_url;
      img.classList.remove('is-hidden');
      img.dataset.fallbackTried = '';
      const wrap = img.closest('.game-cover-wrap');
      wrap?.querySelector('.game-cover-placeholder.is-fallback')?.classList.add('hidden');
    }
  }

  const titleEl = card.querySelector('.game-name');
  if (titleEl && patch.title) titleEl.textContent = patch.title;

  const subtitleEl = card.querySelector('.game-subtitle');
  if (patch.subtitle) {
    if (subtitleEl) subtitleEl.textContent = patch.subtitle;
    else if (titleEl) {
      const sub = document.createElement('div');
      sub.className = 'game-subtitle';
      sub.textContent = patch.subtitle;
      titleEl.insertAdjacentElement('afterend', sub);
    }
  } else if (subtitleEl && patch.subtitle === '') {
    subtitleEl.remove();
  }

  const editBtn = card.querySelector('.btn-game-edit');
  if (editBtn) editBtn.classList.toggle('is-locked', !!patch.lock_from_refresh);
}

async function saveGameEditDialog() {
  if (!gameEditTarget) return;
  const { appid, platform } = gameEditTarget;
  const file = els.inputCoverFile.files?.[0];

  els.btnSaveGameEdit.disabled = true;
  els.btnSaveGameEdit.textContent = '保存中...';
  try {
    if (file) {
      const form = new FormData();
      form.append('cover', file);
      const uploadRes = await fetch(`/api/games/${platform}/${encodeURIComponent(appid)}/cover/upload`, {
        method: 'POST',
        headers: buildHeaders(),
        body: form,
      });
      const uploadData = await readApiJson(uploadRes);
      if (!uploadRes.ok) throw new Error(uploadData.error || '上传失败');
    }

    const body = {
      display_name: els.inputDisplayName.value.trim(),
      name_cn: els.inputNameCn.value.trim(),
      name_en: els.inputNameEn.value.trim(),
      genres: els.inputGenres.value.trim(),
      tags: els.inputTags.value.trim(),
      aliases: els.inputAliases.value.trim(),
      cover_url: file ? '' : els.inputCoverUrl.value.trim(),
      localize_cover: !!els.inputCoverLocalize?.checked,
      lock_from_refresh: !!els.inputLockFromRefresh?.checked,
    };

    const res = await fetch(`/api/games/${platform}/${encodeURIComponent(appid)}/override`, {
      method: 'PUT',
      headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || '保存失败');

    const coverUrl = data.override?.resolved_cover_url
      || data.override?.cover_url
      || els.inputCoverUrl.value.trim();

    const merged = {
      display_name: body.display_name,
      custom_name_cn: body.name_cn,
      custom_name_en: body.name_en,
      name_cn: body.name_cn,
      name: gameEditTarget.source_name,
      source_name: gameEditTarget.source_name,
      source_name_cn: gameEditTarget.source_name_cn,
      lock_from_refresh: body.lock_from_refresh,
      genres: body.genres.split(/[,，;；\n]+/).map((s) => s.trim()).filter(Boolean),
      aliases: body.aliases.split(/[,，;；\n]+/).map((s) => s.trim()).filter(Boolean),
      cover_url: coverUrl,
    };

    const pageIdx = currentPageGames.findIndex(
      (item) => String(item.appid) === String(appid) && gamePlatform(item) === platform,
    );
    if (pageIdx >= 0) {
      currentPageGames[pageIdx] = { ...currentPageGames[pageIdx], ...merged };
    }

    applyGameEditToCard(appid, platform, {
      cover_url: coverUrl,
      title: gameTitle(merged),
      subtitle: gameSubtitle(merged),
      lock_from_refresh: merged.lock_from_refresh,
    });
    closeGameEditDialog();
    showToast(body.lock_from_refresh ? '已保存并锁定' : '游戏资料已更新');
  } catch (err) {
    showToast(err.message, true);
  } finally {
    els.btnSaveGameEdit.disabled = false;
    els.btnSaveGameEdit.textContent = '保存';
  }
}

async function loadSteamUserPrefs() {
  await Promise.all([loadFavorites(), loadHidden()]);
}

async function loadFavorites() {
  favoriteByPlatform = createEmptyPlatformSets();
  if (!activeUserId) return;
  try {
    const res = await fetch('/api/favorites', { headers: buildHeaders() });
    const data = await readApiJson(res);
    if (res.ok) {
      if (data.platforms) applyPlatformPrefSets(favoriteByPlatform, data.platforms);
      else if (data.appids) favoriteByPlatform.steam = new Set(data.appids.map((id) => String(Number(id))));
    }
  } catch {
    /* ignore */
  }
}

async function loadHidden() {
  hiddenByPlatform = createEmptyPlatformSets();
  if (!activeUserId) return;
  try {
    const res = await fetch('/api/hidden', { headers: buildHeaders() });
    const data = await readApiJson(res);
    if (res.ok) {
      if (data.platforms) applyPlatformPrefSets(hiddenByPlatform, data.platforms);
      else if (data.appids) hiddenByPlatform.steam = new Set(data.appids.map((id) => String(Number(id))));
      if (els.inputSteamPath) {
        els.inputSteamPath.dataset.savedPath = data.steamPath || '';
      }
    }
  } catch {
    /* ignore */
  }
}

function syncHiddenButton(appid, platform, hidden) {
  const p = normalizePrefPlatform(platform);
  const id = normalizePrefAppId(p, appid);
  document.querySelectorAll(`.btn-hidden[data-appid="${CSS.escape(id)}"][data-platform="${p}"]`).forEach((btn) => {
    btn.classList.toggle('is-hidden', hidden);
    btn.textContent = hidden ? '🙈' : '👁';
    btn.title = hidden ? '取消隐藏' : '隐藏';
    btn.setAttribute('aria-label', hidden ? '取消隐藏' : '隐藏');
  });
}

async function toggleHidden(appid, platform = currentPlatform) {
  if (!activeUserId) {
    showToast('请先添加用户', true);
    return;
  }
  const res = await fetch('/api/hidden/toggle', {
    method: 'POST',
    headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ appid, platform: normalizePrefPlatform(platform) }),
  });
  const data = await readApiJson(res);
  if (!res.ok) throw new Error(data.error || '操作失败');

  applyPlatformPrefSets(hiddenByPlatform, data.platforms);
  syncHiddenButton(appid, platform, data.hidden);
  await fetchLibraryPage(false, libraryPagination.page, { quiet: true });
}

function syncFavoriteButton(appid, platform, favorited) {
  const p = normalizePrefPlatform(platform);
  const id = normalizePrefAppId(p, appid);
  document.querySelectorAll(`.btn-favorite[data-appid="${CSS.escape(id)}"][data-platform="${p}"]`).forEach((btn) => {
    btn.classList.toggle('is-favorite', favorited);
    btn.textContent = favorited ? '★' : '☆';
    btn.title = favorited ? '取消收藏' : '收藏';
    btn.setAttribute('aria-label', favorited ? '取消收藏' : '收藏');
  });
}

async function toggleFavorite(appid, platform = currentPlatform) {
  if (!activeUserId) {
    showToast('请先添加用户', true);
    return;
  }
  const res = await fetch('/api/favorites/toggle', {
    method: 'POST',
    headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ appid, platform: normalizePrefPlatform(platform) }),
  });
  const data = await readApiJson(res);
  if (!res.ok) throw new Error(data.error || '操作失败');

  applyPlatformPrefSets(favoriteByPlatform, data.platforms);
  syncFavoriteButton(appid, platform, data.favorited);
  if (els.filterFavoritesOnly.checked) {
    await fetchLibraryPage(false, libraryPagination.page, { quiet: true });
  }
}

function openGameStore(url) {
  if (!url || url === '#') return;
  window.open(url, '_blank', 'noopener');
}

function userCardLabel(user) {
  if (user.personaName) return user.personaName;
  if (user.steamId) return `用户 ${user.steamId.slice(-4)}`;
  return user.name || '未命名';
}

function userAvatarMarkup(user) {
  const avatar = (user.avatar || '').trim();
  if (avatar) {
    return `<img class="user-card-avatar" src="${avatar}" alt="">`;
  }
  return '<div class="user-card-avatar user-card-avatar-default" aria-hidden="true"></div>';
}

function renderUserCards() {
  if (!users.length) {
    els.userCards.innerHTML = '<div class="user-cards-empty">暂无用户，请添加</div>';
    return;
  }

  els.userCards.innerHTML = users
    .map((u) => {
      const active = u.id === activeUserId ? ' active' : '';
      return `
        <div class="user-card-wrap">
          <button type="button" class="user-card${active}" data-user-id="${u.id}">
            ${userAvatarMarkup(u)}
            <span class="user-card-name">${userCardLabel(u)}</span>
          </button>
          <button type="button" class="user-card-delete" data-user-id="${u.id}" title="删除用户" aria-label="删除用户">×</button>
          <button type="button" class="user-card-edit" data-user-id="${u.id}" title="编辑用户" aria-label="编辑用户">✎</button>
        </div>`;
    })
    .join('');
}

function refreshUserUi() {
  renderUserCards();
  els.btnTokenModal.disabled = !getActiveUser();
  updateModeUi();
}

async function refreshMissingUserProfiles() {
  const targets = users.filter((u) => u.steamId && (!u.personaName || !u.avatar));
  if (!targets.length) return;

  for (const user of targets) {
    try {
      const res = await fetch('/api/users/refresh-profile', {
        method: 'POST',
        headers: { ...buildHeaders(), 'X-User-Id': user.id },
      });
      const data = await readApiJson(res);
      if (!res.ok) continue;
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx >= 0) users[idx] = data;
      debugLog('用户资料已补全', { userId: user.id, name: data.personaName || data.name });
    } catch {
      /* ignore */
    }
  }
  refreshUserUi();
}

async function loadUsers() {
  const res = await fetch('/api/users');
  const data = await readApiJson(res);
  users = data.users || [];
  activeUserId = data.activeUserId || users[0]?.id || '';
  debugLog('用户列表已加载', { count: users.length, activeUserId });
  refreshUserUi();
  await refreshMissingUserProfiles();
}

function openUserEditDialog(userId) {
  const user = users.find((u) => u.id === userId);
  if (!user) return;

  editUserId = userId;
  const avatar = (user.avatar || '').trim();
  if (avatar) {
    els.userEditAvatar.src = avatar;
    els.userEditAvatar.classList.remove('hidden');
  } else {
    els.userEditAvatar.removeAttribute('src');
    els.userEditAvatar.classList.add('hidden');
  }
  els.userEditName.textContent = userCardLabel(user);
  els.userEditSteamId.textContent = user.steamId ? `Steam ID: ${user.steamId}` : '';
  els.userEditKeyStatus.textContent = user.hasApiKey
    ? '已保存 API Key'
    : '未配置 API Key（可选）';
  els.inputEditApiKey.value = '';
  els.inputEditClearApiKey.checked = false;
  els.userEditDialog.showModal();
}

function closeUserEditDialog() {
  editUserId = '';
  els.userEditDialog.close();
}

async function saveUserEdit() {
  if (!editUserId) return;

  const clearKey = els.inputEditClearApiKey.checked;
  const apiKey = normalizeApiKeyInput(els.inputEditApiKey.value);
  if (!clearKey && apiKey && !isValidApiKeyFormat(apiKey)) {
    showToast('API Key 应为 32 位字母和数字', true);
    return;
  }
  if (!clearKey && !apiKey) {
    showToast('请输入 API Key，或勾选清除', true);
    return;
  }

  const body = clearKey ? { clearApiKey: true } : { apiKey };
  els.btnSaveUserEdit.disabled = true;
  els.btnSaveUserEdit.textContent = '保存中...';

  try {
    const res = await fetch(`/api/users/${encodeURIComponent(editUserId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || '保存失败');

    closeUserEditDialog();
    await loadUsers();
    await refreshAuthStatus();
    showToast(clearKey ? 'API Key 已清除' : 'API Key 已保存');
  } finally {
    els.btnSaveUserEdit.disabled = false;
    els.btnSaveUserEdit.textContent = '保存';
  }
}

async function deleteUser(userId) {
  const user = users.find((u) => u.id === userId);
  if (!user) return;
  const label = userCardLabel(user);
  if (!window.confirm(`确定删除用户「${label}」？\n将同时清除该用户的 Token 和收藏。`)) return;

  debugLog('删除用户', { userId, steamId: user.steamId, label });
  const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, { method: 'DELETE' });
  const data = await readApiJson(res);
  if (!res.ok) throw new Error(data.error || '删除失败');

  users = data.users || [];
  activeUserId = data.activeUserId || users[0]?.id || '';
  refreshUserUi();
  libraryLoaded = false;
  await loadSteamUserPrefs();

  if (activeUserId) {
    await refreshAuthStatus();
    await fetchSteamGames(false, { quiet: false });
    showToast('用户已删除');
  } else {
    resetGamesView();
    els.cacheInfo.textContent = '暂无用户，请添加';
    await refreshAuthStatus();
    showToast('用户已删除');
  }
}

function hideLoadProgress() {
  els.loadProgress.classList.add('hidden');
  els.loadProgressFill.style.width = '0%';
  els.loadProgressText.textContent = '';
}

function showLoadProgress(current, total, label = '正在补全中文信息') {
  els.loadProgress.classList.remove('hidden');
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  els.loadProgressFill.style.width = `${pct}%`;
  els.loadProgressText.textContent = total > 0 ? `${label} ${current}/${total}` : label;
}

function applyGameCardPatches(updates, platform = currentPlatform) {
  if (!updates?.length) return;
  for (const item of updates) {
    const appid = String(item.appid || '');
    if (!appid) continue;
    const card = els.gameGrid.querySelector(
      `.game-card[data-appid="${CSS.escape(appid)}"][data-platform="${item.platform || platform}"]`,
    );
    if (!card) continue;

    if (item.cover_url) {
      const wrap = card.querySelector('.game-cover-wrap');
      const actions = wrap?.querySelector('.game-cover-actions');
      let img = wrap?.querySelector('img.game-cover');
      if (img) {
        img.classList.remove('is-hidden');
        img.removeAttribute('data-fallback-tried');
        img.src = item.cover_url;
      } else if (wrap) {
        img = document.createElement('img');
        img.className = 'game-cover';
        img.src = item.cover_url;
        img.alt = item.name_cn || item.name || '';
        img.loading = 'lazy';
        wrap.insertBefore(img, actions || null);
      }
      wrap?.querySelector('.game-cover-placeholder:not(.is-fallback)')?.remove();
      if (img && !wrap?.querySelector('.game-cover-placeholder.is-fallback')) {
        wrap.insertAdjacentHTML(
          'beforeend',
          gameCoverPlaceholderHtml({
            appid: item.appid,
            name: item.name,
            name_cn: item.name_cn,
            name_en: item.name_en,
          }, { fallback: true }),
        );
      }
    }

    const title = item.name_cn || item.name;
    if (title) {
      const nameEl = card.querySelector('.game-name');
      if (nameEl) nameEl.textContent = title;
    }
  }
}

function applyMetaUpdates(updates) {
  if (!updates?.length) return;
  fetchLibraryPage(false, libraryPagination.page, { quiet: true }).catch(() => {});
}

function resetEpicCoverState() {
  epicCoverRequested.clear();
}

async function loadEpicPageCovers(games) {
  if (currentPlatform !== 'epic' || !games?.length) return;

  const pending = games.filter((game) => {
    const id = String(game.appid || '');
    if (!id || game.cover_url) return false;
    return !epicCoverRequested.has(id);
  });
  if (!pending.length) return;

  for (const game of pending) {
    epicCoverRequested.add(String(game.appid));
  }

  try {
    const res = await fetch('/api/epic/games/covers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appids: pending.map((game) => game.appid) }),
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || '封面加载失败');
    if (data.updates?.length) applyGameCardPatches(data.updates, 'epic');
    const updatedIds = new Set(
      (data.updates || []).filter((item) => item.cover_url).map((item) => String(item.appid)),
    );
    for (const game of pending) {
      if (!updatedIds.has(String(game.appid))) {
        epicCoverRequested.delete(String(game.appid));
      }
    }
  } catch (err) {
    for (const game of pending) {
      epicCoverRequested.delete(String(game.appid));
    }
    debugLog('Epic 页封面加载失败', { message: err.message });
  }
}

function abortEnrichStream() {
  if (enrichAbortController) {
    enrichAbortController.abort();
    enrichAbortController = null;
  }
  hideLoadProgress();
}

async function enrichGamesMeta(steamId) {
  abortEnrichStream();
  enrichAbortController = new AbortController();
  const { signal } = enrichAbortController;

  const url = `/api/games/enrich-stream?steamId=${encodeURIComponent(steamId)}&includeFamily=true`;
  debugLog('开始补全游戏中文信息', { steamId });

  try {
    const res = await fetch(url, { headers: buildHeaders(), signal });
    if (!res.ok) {
      const data = await readApiJson(res);
      throw new Error(data.error || '补全失败');
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split('\n\n');
      buffer = chunks.pop() || '';

      for (const chunk of chunks) {
        const line = chunk.split('\n').find((row) => row.startsWith('data: '));
        if (!line) continue;
        const payload = JSON.parse(line.slice(6));
        if (payload.error) throw new Error(payload.error);
        if (payload.updates?.length) applyMetaUpdates(payload.updates);
        if (payload.total > 0) {
          showLoadProgress(payload.current || 0, payload.total, '正在补全中文信息');
        }
        if (payload.complete) {
          debugLog('游戏中文信息补全完成', { total: payload.total });
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
    debugLog('补全中文信息失败', { message: err.message });
  } finally {
    if (enrichAbortController?.signal === signal) {
      enrichAbortController = null;
    }
    hideLoadProgress();
  }
}

function clearTokenPreview() {
  clearTimeout(tokenPreviewTimer);
  tokenPreviewRequestId += 1;
  els.tokenProfilePreview.classList.add('hidden');
  els.tokenProfilePreview.classList.remove('loading');
  els.tokenPreviewAvatar.removeAttribute('src');
  els.tokenPreviewName.textContent = '';
  els.tokenPreviewSteamId.textContent = '';
  els.tokenPreviewHint.textContent = '';
  els.tokenPreviewHint.classList.remove('warn');
}

function renderTokenPreview(data) {
  els.tokenProfilePreview.classList.remove('hidden', 'loading');
  if (data.avatar) {
    els.tokenPreviewAvatar.src = data.avatar;
    els.tokenPreviewAvatar.style.display = '';
  } else {
    els.tokenPreviewAvatar.removeAttribute('src');
    els.tokenPreviewAvatar.style.display = 'none';
  }
  els.tokenPreviewName.textContent = data.personaName || `Steam 用户 ${String(data.steamId || '').slice(-4)}`;
  els.tokenPreviewSteamId.textContent = data.steamId || '';
  if (data.duplicate) {
    els.tokenPreviewHint.textContent = `该账号已添加：${data.existingUserName || data.steamId}`;
    els.tokenPreviewHint.classList.add('warn');
  } else {
    els.tokenPreviewHint.textContent = 'Token 有效，保存后将使用该账号';
    els.tokenPreviewHint.classList.remove('warn');
  }
}

function renderTokenPreviewError(message) {
  els.tokenProfilePreview.classList.remove('hidden');
  els.tokenProfilePreview.classList.remove('loading');
  els.tokenPreviewAvatar.removeAttribute('src');
  els.tokenPreviewAvatar.style.display = 'none';
  els.tokenPreviewName.textContent = '无法识别账号';
  els.tokenPreviewSteamId.textContent = '';
  els.tokenPreviewHint.textContent = message;
  els.tokenPreviewHint.classList.add('warn');
}

function scheduleTokenPreview() {
  clearTimeout(tokenPreviewTimer);
  tokenPreviewTimer = setTimeout(() => {
    previewTokenProfile().catch(() => {});
  }, 350);
}

async function previewTokenProfile() {
  const token = applyTokenInputValue(els.inputAccessToken.value, false);
  if (!token) {
    clearTokenPreview();
    return;
  }

  const apiKey = normalizeApiKeyInput(els.inputApiKey.value);
  if (apiKey && !isValidApiKeyFormat(apiKey)) {
    renderTokenPreviewError('API Key 应为 32 位字母和数字');
    return;
  }

  const requestId = ++tokenPreviewRequestId;
  els.tokenProfilePreview.classList.remove('hidden');
  els.tokenProfilePreview.classList.add('loading');
  els.tokenPreviewName.textContent = '正在获取资料...';
  els.tokenPreviewSteamId.textContent = '';
  els.tokenPreviewHint.textContent = '';
  els.tokenPreviewHint.classList.remove('warn');

  try {
    const res = await fetch('/api/auth/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, apiKey: apiKey || undefined }),
    });
    const data = await readApiJson(res);
    if (requestId !== tokenPreviewRequestId) return;
    if (!res.ok) throw new Error(data.error || '获取资料失败');
    renderTokenPreview(data);
    debugLog('Token 资料预览', { steamId: data.steamId, name: data.personaName });
  } catch (err) {
    if (requestId !== tokenPreviewRequestId) return;
    renderTokenPreviewError(err.message);
  } finally {
    if (requestId === tokenPreviewRequestId) {
      els.tokenProfilePreview.classList.remove('loading');
    }
  }
}

function openTokenDialog(mode) {
  tokenDialogMode = mode;
  els.tokenDialogTitle.textContent = mode === 'add' ? '添加用户' : '更新 Token';
  els.inputAccessToken.value = '';
  els.inputApiKey.value = '';
  clearTokenPreview();
  const active = getActiveUser();
  if (mode === 'update' && active?.hasApiKey) {
    els.inputApiKey.placeholder = '已配置 Key，留空则不修改';
  } else {
    els.inputApiKey.placeholder = '32 位 Key（可选）';
  }
  els.tokenDialog.showModal();
  els.inputAccessToken.focus();
}

function closeTokenDialog() {
  els.tokenDialog.close();
  els.inputAccessToken.value = '';
  els.inputApiKey.value = '';
  clearTokenPreview();
}

async function saveTokenFromDialog() {
  const token = applyTokenInputValue(els.inputAccessToken.value, false);
  if (!token) {
    showToast('请粘贴 webapi_token 或整页 JSON', true);
    return;
  }
  els.inputAccessToken.value = token;

  const isAdd = tokenDialogMode === 'add';
  if (isAdd) {
    const steamId = parseSteamIdFromToken(token);
    const existing = findUserBySteamId(steamId);
    if (existing) {
      showToast(`该 Steam 账号已添加：${userCardLabel(existing)}`, true);
      debugLog('阻止重复添加用户', { steamId, existingUserId: existing.id });
      return;
    }
  }

  const apiKey = normalizeApiKeyInput(els.inputApiKey.value);
  if (apiKey && !isValidApiKeyFormat(apiKey)) {
    showToast('API Key 应为 32 位字母和数字', true);
    return;
  }

  const url = isAdd ? '/api/users/add-token' : '/api/auth/token';
  const headers = { 'Content-Type': 'application/json', ...buildHeaders() };
  const body = { token };
  if (isAdd) {
    body.apiKey = apiKey;
  } else if (els.inputApiKey.value.trim() !== '') {
    body.apiKey = apiKey;
  }

  debugLog(isAdd ? '添加用户' : '更新 Token', { mode: tokenDialogMode, hasApiKey: !!apiKey });
  els.btnSaveToken.disabled = true;
  els.btnSaveToken.textContent = '保存中...';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || '保存失败');

    if (isAdd) activeUserId = data.id;
    closeTokenDialog();

    const profileName = data.personaName || data.name || data.user?.personaName || data.user?.name || '';
    debugLog(isAdd ? '用户已保存' : 'Token 已保存', {
      userId: data.id || data.user?.id,
      steamId: data.steamId || data.user?.steamId,
      name: profileName,
    });

    await loadUsers();
    await refreshAuthStatus();
    await loadSteamUserPrefs();
    showToast(profileName ? `${isAdd ? '用户已添加' : 'Token 已更新'}：${profileName}` : (isAdd ? '用户已添加' : 'Token 已更新'));

    els.gameGrid.innerHTML = '<div class="empty-state">正在加载游戏库...</div>';
    els.statsBar.textContent = '正在加载游戏库...';
    await fetchSteamGames(false, { quiet: false, autoFetchIfNoCache: true });
  } finally {
    els.btnSaveToken.disabled = false;
    els.btnSaveToken.textContent = '保存';
  }
}

async function switchUser(userId, options = {}) {
  const { loadGames = true, refresh = false, quiet = true } = options;

  if (userId !== activeUserId) {
    abortEnrichStream();
    debugLog('切换用户', { from: activeUserId, to: userId, refresh });
    const res = await fetch('/api/users/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || '切换失败');
    activeUserId = data.id;
    refreshUserUi();
    libraryLoaded = false;
    setControlsEnabled(false);
    els.gameGrid.innerHTML = '<div class="empty-state">正在加载...</div>';
    els.statsBar.textContent = '正在加载游戏库...';
    await refreshAuthStatus();
    await loadSteamUserPrefs();
  }

  if (loadGames && currentPlatform === 'steam') {
    await fetchSteamGames(refresh, { quiet });
  }
}

async function refreshAuthStatus() {
  try {
    const res = await fetch('/api/auth/status', { headers: buildHeaders() });
    const status = await readApiJson(res);
    els.authStatus.className = 'auth-status';

    if (status.valid) {
      els.authStatus.classList.add('ok');
      els.authStatus.textContent = 'Token 有效';
      return true;
    }

    els.authStatus.classList.add('warn');
    if (status.hasToken) {
      els.authStatus.textContent = 'Token 已过期';
    } else {
      els.authStatus.textContent = 'Token 未配置';
    }
    return false;
  } catch {
    els.authStatus.textContent = 'Token 状态未知';
    return false;
  }
}

async function ensureTokenReady() {
  const valid = await refreshAuthStatus();
  if (valid) return true;
  openTokenDialog(getActiveUser() ? 'update' : 'add');
  throw new Error('请先配置 Steam Token');
}

function renderRandomGame(game) {
  const subtitle = gameSubtitle(game);
  const platform = gamePlatform(game);
  const storeLabel = platform === 'epic' ? 'Epic 商店' : platform === 'ubisoft' ? 'Ubisoft 商店' : 'Steam 商店';
  const cover = gameCoverImage(game) || (platform === 'steam' ? coverUrl(game.appid) : '');
  const fallback = gameCoverFallback(game);
  const coverMarkup = cover
    ? `<img class="random-cover" src="${escapeHtml(cover)}" alt="${escapeHtml(gameTitle(game))}"${fallback ? ` data-fallback="${escapeHtml(fallback)}"` : ''}>${gameCoverPlaceholderHtml(game, { fallback: true })}`
    : `<div class="random-cover-wrap">${gameCoverPlaceholderHtml(game)}</div>`;
  els.randomBody.innerHTML = `
    <div class="random-cover-wrap">${coverMarkup}</div>
    <h2 class="random-title">${gameTitle(game)}</h2>
    ${subtitle ? `<div class="random-subtitle">${subtitle}</div>` : ''}
    ${platform === 'steam' ? `<div class="random-meta">累计游玩：${formatHours(game.playtime_forever)}</div>` : ''}
    <div class="random-actions">
      ${hiddenButtonHtml(game.appid, platform, 'btn-hidden-lg')}${favoriteButtonHtml(game.appid, platform, 'btn-favorite-lg')}
      <a class="btn btn-primary" href="${gameStoreUrl(game)}" target="_blank" rel="noopener">
        在 ${storeLabel} 查看
      </a>
    </div>
  `;
  els.randomDialog.showModal();
}

async function openHiddenImportDialog() {
  if (!activeUserId) {
    showToast('请先添加用户', true);
    return;
  }
  els.hiddenImportHint.textContent = '正在检测本机 Steam 路径...';
  els.inputSteamPath.value = els.inputSteamPath.dataset.savedPath || '';
  els.hiddenImportDialog.showModal();
  try {
    const res = await fetch('/api/hidden', { headers: buildHeaders() });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || '读取配置失败');
    if (!els.inputSteamPath.value && data.steamPath) {
      els.inputSteamPath.value = data.steamPath;
    }
    const detected = (data.detectedPaths || []).join('；');
    els.hiddenImportHint.textContent = detected
      ? `已检测到：${detected}`
      : '未自动检测到 Steam 安装路径，请手动填写。';
  } catch (err) {
    els.hiddenImportHint.textContent = err.message;
  }
}

function closeHiddenImportDialog() {
  els.hiddenImportDialog.close();
}

async function confirmHiddenImport() {
  const steamPath = els.inputSteamPath.value.trim();
  els.btnConfirmHiddenImport.disabled = true;
  els.btnConfirmHiddenImport.textContent = '导入中...';
  try {
    const res = await fetch('/api/hidden/import-local', {
      method: 'POST',
      headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ steamPath }),
    });
    const data = await readApiJson(res);
    if (!res.ok) {
      const detected = (data.detectedPaths || []).join('；');
      const extra = detected ? ` 已检测：${detected}` : '';
      throw new Error((data.error || '导入失败') + extra);
    }
    applyPlatformPrefSets(hiddenByPlatform, data.platforms);
    if (!data.platforms && data.appids) {
      hiddenByPlatform.steam = new Set(data.appids.map((id) => String(Number(id))));
    }
    if (steamPath || data.steamPath) {
      els.inputSteamPath.dataset.savedPath = data.steamPath || steamPath;
    }
    closeHiddenImportDialog();
    await fetchLibraryPage(false, libraryPagination.page, { quiet: true });
    showToast(`已导入 ${data.imported} 款隐藏，新增 ${data.added} 款`);
  } catch (err) {
    els.hiddenImportHint.textContent = err.message;
    showToast(err.message, true);
  } finally {
    els.btnConfirmHiddenImport.disabled = false;
    els.btnConfirmHiddenImport.textContent = '开始导入';
  }
}

async function pickRandomGame() {
  if (!libraryLoaded) {
    showToast('请先加载游戏库', true);
    return;
  }
  try {
    const params = buildFilterQueryParams(1);
    params.set('platform', currentPlatform);
    if (currentPlatform === 'steam') {
      const user = getActiveUser();
      if (user?.steamId) params.set('steamId', user.steamId);
      params.set('includeFamily', 'true');
    }
    const res = await fetch(`/api/random?${params.toString()}`, { headers: buildHeaders() });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || '随机抽取失败');
    renderRandomGame(data.game);
  } catch (err) {
    showToast(err.message, true);
  }
}

function resetGamesView(message = '请先加载游戏库') {
  libraryLoaded = false;
  libraryGameCount = 0;
  libraryFilteredCount = 0;
  libraryPagination = { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };
  favoriteByPlatform = createEmptyPlatformSets();
  hiddenByPlatform = createEmptyPlatformSets();
  setControlsEnabled(false);
  els.statsBar.textContent = message;
  els.gameGrid.innerHTML = '';
  els.pagination?.classList.add('hidden');
  updateModeUi();
}

function updatePlatformPanels() {
  for (const panel of [els.steamPanel, els.epicPanel, els.ubisoftPanel]) {
    if (!panel) continue;
    panel.classList.toggle('hidden', panel.dataset.platform !== currentPlatform);
  }
  els.platformTabs?.querySelectorAll('.platform-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.platform === currentPlatform);
  });
  updateModeUi();
}

async function refreshEpicAuthStatus() {
  try {
    const res = await fetch('/api/epic/auth/status');
    const status = await readApiJson(res);
    els.epicAuthStatus.className = 'auth-status';
    if (status.valid && status.account) {
      els.epicAuthStatus.classList.add('ok');
      els.epicAuthStatus.textContent = `已连接 · ${status.account.displayName || status.account.accountId}`;
      els.btnEpicConnect.textContent = '更新 Token';
      return true;
    }
    els.epicAuthStatus.classList.add('warn');
    els.epicAuthStatus.textContent = status.account ? 'Epic Token 可能已过期' : '未连接 Epic';
    els.btnEpicConnect.textContent = '连接 Epic';
    return false;
  } catch {
    els.epicAuthStatus.textContent = 'Epic 状态未知';
    return false;
  }
}

async function refreshUbisoftAuthStatus() {
  try {
    const res = await fetch('/api/ubisoft/auth/status');
    const status = await readApiJson(res);
    els.ubisoftAuthStatus.className = 'auth-status';
    if (status.valid && status.account) {
      els.ubisoftAuthStatus.classList.add('ok');
      els.ubisoftAuthStatus.textContent = `已连接 · ${status.account.displayName || status.account.email || status.account.profileId}`;
      els.btnUbisoftConnect.textContent = '更新连接';
      return true;
    }
    els.ubisoftAuthStatus.classList.add('warn');
    els.ubisoftAuthStatus.textContent = status.expired ? '育碧连接已过期' : '未连接育碧';
    els.btnUbisoftConnect.textContent = '连接育碧';
    return false;
  } catch {
    els.ubisoftAuthStatus.textContent = '育碧状态未知';
    return false;
  }
}

let epicLoginState = '';
let epicTwoFactorMethod = '';

function resetEpicVerificationUi() {
  epicLoginState = '';
  epicTwoFactorMethod = '';
  if (els.inputEpicVerificationCode) els.inputEpicVerificationCode.value = '';
  els.epicVerificationField?.classList.add('hidden');
}

function showEpicVerificationUi(loginState, twoFactorMethod) {
  epicLoginState = loginState || '';
  epicTwoFactorMethod = twoFactorMethod || '';
  els.epicVerificationField?.classList.remove('hidden');
  els.inputEpicVerificationCode?.focus();
  showToast('Epic 需要验证码，请查收邮件或验证器');
}

function openEpicDialog() {
  if (els.inputEpicPassword) els.inputEpicPassword.value = '';
  resetEpicVerificationUi();
  els.epicDialog.showModal();
}

function closeEpicDialog() {
  if (els.inputEpicPassword) els.inputEpicPassword.value = '';
  resetEpicVerificationUi();
  els.epicDialog.close();
}

function showEpicCaptchaUi() {
  els.epicAuthCodeField?.setAttribute('open', '');
  els.inputEpicAuthCode?.focus();
  showToast('Epic 要求人机验证，请使用浏览器授权码连接', true);
}

function extractEpicAuthCodeFromPaste(text) {
  const raw = String(text || '').trim().replace(/^\uFEFF/, '');
  if (!raw) return '';

  const patterns = [
    /"authorizationCode"\s*:\s*"([^"\\]+)"/i,
    /"authorization_code"\s*:\s*"([^"\\]+)"/i,
    /"exchangeCode"\s*:\s*"([^"\\]+)"/i,
  ];
  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  try {
    const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || raw);
    return String(json.authorizationCode || json.exchangeCode || json.code || '').trim();
  } catch {
    return raw;
  }
}

async function saveEpicAuthCode(rawInput) {
  const code = extractEpicAuthCodeFromPaste(rawInput ?? els.inputEpicAuthCode?.value ?? '');
  if (!code) {
    showToast('请粘贴 authorizationCode 或整段 JSON', true);
    return;
  }
  if (els.inputEpicAuthCode) els.inputEpicAuthCode.value = code;
  els.btnSaveEpicAuthCode.disabled = true;
  els.btnSaveEpicAuthCode.textContent = '连接中...';
  try {
    const res = await fetch('/api/epic/auth/code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || '连接失败');
    closeEpicDialog();
    await refreshEpicAuthStatus();
    showToast(`Epic 已连接：${data.displayName || data.accountId}`);
    if (currentPlatform === 'epic') {
      await fetchEpicGames(false, { quiet: false, autoFetchIfNoCache: true });
    }
  } finally {
    els.btnSaveEpicAuthCode.disabled = false;
    els.btnSaveEpicAuthCode.textContent = '使用授权码连接';
  }
}

async function saveEpicLogin() {
  const email = els.inputEpicEmail?.value.trim() || '';
  const password = els.inputEpicPassword?.value || '';
  const verificationCode = els.inputEpicVerificationCode?.value.trim() || '';
  if (!email || !password) {
    showToast('请填写邮箱和密码', true);
    return;
  }
  if (epicLoginState && !verificationCode) {
    showToast('请填写验证码', true);
    els.inputEpicVerificationCode?.focus();
    return;
  }
  els.btnSaveEpic.disabled = true;
  els.btnSaveEpic.textContent = '登录中...';
  try {
    const body = { email, password };
    if (verificationCode && epicLoginState) {
      body.verificationCode = verificationCode;
      body.loginState = epicLoginState;
      body.twoFactorMethod = epicTwoFactorMethod;
    }
    const res = await fetch('/api/epic/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await readApiJson(res);
    if (res.status === 428 && data.needVerification) {
      showEpicVerificationUi(data.loginState, data.twoFactorMethod);
      throw new Error(data.error || '需要验证码');
    }
    if (res.status === 429 && data.needCaptcha) {
      showEpicCaptchaUi();
      throw new Error(data.error || '需要人机验证');
    }
    if (!res.ok) throw new Error(data.error || '登录失败');
    closeEpicDialog();
    await refreshEpicAuthStatus();
    showToast(`Epic 已连接：${data.displayName || email}`);
    if (currentPlatform === 'epic') {
      await fetchEpicGames(false, { quiet: false, autoFetchIfNoCache: true });
    }
  } catch (err) {
    if (/captcha/i.test(err.message)) {
      showEpicCaptchaUi();
    }
    if (err.message !== '需要验证码'
      && err.message !== '请输入 Epic 邮箱或双重验证码'
      && err.message !== '需要人机验证'
      && !/captcha/i.test(err.message)) {
      throw err;
    }
  } finally {
    els.btnSaveEpic.disabled = false;
    els.btnSaveEpic.textContent = epicLoginState ? '提交验证码' : '登录';
  }
}

let ubisoftTwoFactorTicket = '';

function resetUbisoftVerificationUi() {
  ubisoftTwoFactorTicket = '';
  if (els.inputUbisoftVerificationCode) els.inputUbisoftVerificationCode.value = '';
  els.ubisoftVerificationField?.classList.add('hidden');
}

function showUbisoftVerificationUi(ticket) {
  ubisoftTwoFactorTicket = ticket || '';
  els.ubisoftVerificationField?.classList.remove('hidden');
  els.inputUbisoftVerificationCode?.focus();
  showToast('育碧需要验证码，请查收邮件或验证器');
}

function openUbisoftDialog() {
  els.inputUbisoftPassword.value = '';
  resetUbisoftVerificationUi();
  els.ubisoftDialog.showModal();
}

function closeUbisoftDialog() {
  els.inputUbisoftPassword.value = '';
  resetUbisoftVerificationUi();
  els.ubisoftDialog.close();
}

async function saveUbisoftLogin() {
  const email = els.inputUbisoftEmail.value.trim();
  const password = els.inputUbisoftPassword.value;
  const verificationCode = els.inputUbisoftVerificationCode?.value.trim() || '';
  if (!email || !password) {
    showToast('请填写邮箱和密码', true);
    return;
  }
  if (ubisoftTwoFactorTicket && !verificationCode) {
    showToast('请填写验证码', true);
    els.inputUbisoftVerificationCode?.focus();
    return;
  }
  els.btnSaveUbisoft.disabled = true;
  els.btnSaveUbisoft.textContent = '登录中...';
  try {
    const body = { email, password };
    if (verificationCode && ubisoftTwoFactorTicket) {
      body.verificationCode = verificationCode;
      body.twoFactorAuthenticationTicket = ubisoftTwoFactorTicket;
    }
    const res = await fetch('/api/ubisoft/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await readApiJson(res);
    if (res.status === 428 && data.needVerification) {
      showUbisoftVerificationUi(data.twoFactorAuthenticationTicket);
      throw new Error(data.error || '需要验证码');
    }
    if (!res.ok) throw new Error(data.error || '登录失败');
    closeUbisoftDialog();
    await refreshUbisoftAuthStatus();
    showToast(`育碧已连接：${data.displayName || email}`);
    if (currentPlatform === 'ubisoft') {
      await fetchUbisoftGames(false, { quiet: false, autoFetchIfNoCache: true });
    }
  } catch (err) {
    if (err.message !== '需要验证码' && err.message !== '请输入邮箱或双重验证码') {
      throw err;
    }
  } finally {
    els.btnSaveUbisoft.disabled = false;
    els.btnSaveUbisoft.textContent = ubisoftTwoFactorTicket ? '提交验证码' : '登录';
  }
}

async function fetchEpicGames(refresh = false, options = {}) {
  return fetchLibraryPage(refresh, 1, options);
}

async function fetchUbisoftGames(refresh = false, options = {}) {
  return fetchLibraryPage(refresh, 1, options);
}

async function fetchCurrentPlatformGames(refresh = false, options = {}) {
  const page = refresh ? 1 : libraryPagination.page || 1;
  return fetchLibraryPage(refresh, page, options);
}

async function switchPlatform(platform) {
  if (platform === currentPlatform) return;
  if (platform !== 'steam') clearSteamOnlyFilterValues();
  abortEnrichStream();
  resetEpicCoverState();
  currentPlatform = platform;
  updatePlatformPanels();
  libraryLoaded = false;
  setControlsEnabled(false);
  els.gameGrid.innerHTML = '<div class="empty-state">正在加载...</div>';
  els.statsBar.textContent = '正在加载游戏库...';
  els.pagination?.classList.add('hidden');

  if (platform === 'steam') {
    els.cacheInfo.textContent = '正在加载...';
    if (!activeUserId) {
      resetGamesView('请先添加 Steam 用户');
      return;
    }
    await refreshAuthStatus();
    await loadSteamUserPrefs();
    await fetchSteamGames(false, { quiet: false, autoFetchIfNoCache: true });
    return;
  }

  if (platform === 'epic') {
    els.epicCacheInfo.textContent = '正在加载...';
    await fetchEpicGames(false, { quiet: false, autoFetchIfNoCache: true });
    return;
  }

  if (platform === 'ubisoft') {
    els.ubisoftCacheInfo.textContent = '正在加载...';
    await fetchUbisoftGames(false, { quiet: false, autoFetchIfNoCache: true });
  }
}

async function loadEnvConfig() {
  try {
    const res = await fetch('/api/config');
    const config = await readApiJson(res);
    envHasSteamId = !!config.hasEnvSteamId;
  } catch {
    /* ignore */
  }
  updatePlatformPanels();
  await refreshEpicAuthStatus();
  await refreshUbisoftAuthStatus();
  await loadUsers();
  await loadSteamUserPrefs();

  if (!activeUserId) {
    resetGamesView('请先添加 Steam 用户');
    return;
  }

  setControlsEnabled(false);
  els.gameGrid.innerHTML = '<div class="empty-state">正在加载游戏库...</div>';
  els.statsBar.textContent = '正在加载游戏库...';
  els.cacheInfo.textContent = '正在加载...';
  await refreshAuthStatus();
  await fetchSteamGames(false, { quiet: false, autoFetchIfNoCache: true });
}

async function fetchSteamGames(refresh = false, options = {}) {
  return fetchLibraryPage(refresh, 1, options);
}

els.userCards.addEventListener('click', (e) => {
  const deleteBtn = e.target.closest('.user-card-delete');
  if (deleteBtn) {
    e.preventDefault();
    e.stopPropagation();
    deleteUser(deleteBtn.dataset.userId).catch((err) => showToast(err.message, true));
    return;
  }
  const editBtn = e.target.closest('.user-card-edit');
  if (editBtn) {
    e.preventDefault();
    e.stopPropagation();
    openUserEditDialog(editBtn.dataset.userId);
    return;
  }
  const favBtn = e.target.closest('.btn-favorite');
  if (favBtn) return;
  const card = e.target.closest('.user-card');
  if (!card) return;
  const userId = card.dataset.userId;
  if (!userId) return;
  switchUser(userId, { loadGames: true, refresh: false, quiet: userId === activeUserId })
    .catch((err) => showToast(err.message, true));
});

els.btnAddUser.addEventListener('click', () => openTokenDialog('add'));
els.btnTokenModal.addEventListener('click', () => openTokenDialog('update'));
els.btnCloseToken.addEventListener('click', closeTokenDialog);
els.btnCancelToken.addEventListener('click', closeTokenDialog);
els.btnOpenTokenPage.addEventListener('click', () => {
  window.open('https://store.steampowered.com/pointssummary/ajaxgetasyncconfig', '_blank');
});
els.btnOpenApiKeyPage.addEventListener('click', () => {
  window.open('https://steamcommunity.com/dev/apikey', '_blank');
});
els.inputAccessToken.addEventListener('paste', () => {
  setTimeout(() => {
    applyTokenInputValue(els.inputAccessToken.value, true);
    scheduleTokenPreview();
  }, 0);
});
els.inputAccessToken.addEventListener('input', () => {
  scheduleTokenPreview();
});
els.inputAccessToken.addEventListener('focus', () => {
  if (els.inputAccessToken.value) els.inputAccessToken.select();
});
els.btnSaveToken.addEventListener('click', () => {
  saveTokenFromDialog().catch((err) => showToast(err.message, true));
});

els.btnCloseUserEdit.addEventListener('click', closeUserEditDialog);
els.btnCancelUserEdit.addEventListener('click', closeUserEditDialog);
els.btnSaveUserEdit.addEventListener('click', () => {
  saveUserEdit().catch((err) => showToast(err.message, true));
});
els.btnEditOpenApiKeyPage.addEventListener('click', () => {
  window.open('https://steamcommunity.com/dev/apikey', '_blank');
});

els.platformTabs?.addEventListener('click', (e) => {
  const tab = e.target.closest('.platform-tab');
  if (!tab?.dataset.platform) return;
  switchPlatform(tab.dataset.platform).catch((err) => showToast(err.message, true));
});

els.btnEpicConnect.addEventListener('click', () => openEpicDialog());
els.btnCloseEpic.addEventListener('click', closeEpicDialog);
els.btnCancelEpic.addEventListener('click', closeEpicDialog);
els.btnSaveEpic.addEventListener('click', () => {
  saveEpicLogin().catch((err) => showToast(err.message, true));
});
els.btnSaveEpicAuthCode?.addEventListener('click', () => {
  saveEpicAuthCode().catch((err) => showToast(err.message, true));
});
els.inputEpicAuthCode?.addEventListener('paste', (event) => {
  const text = event.clipboardData?.getData('text') || '';
  const code = extractEpicAuthCodeFromPaste(text);
  if (!code || code === text.trim()) return;
  event.preventDefault();
  if (els.inputEpicAuthCode) els.inputEpicAuthCode.value = code;
  saveEpicAuthCode(code).catch((err) => showToast(err.message, true));
});

els.btnUbisoftConnect.addEventListener('click', () => openUbisoftDialog());
els.btnCloseUbisoft.addEventListener('click', closeUbisoftDialog);
els.btnCancelUbisoft.addEventListener('click', closeUbisoftDialog);
els.btnSaveUbisoft.addEventListener('click', () => {
  saveUbisoftLogin().catch((err) => showToast(err.message, true));
});

function confirmRefreshLibrary() {
  const label = PLATFORM_TITLES[currentPlatform] || '游戏库';
  return window.confirm(`确定刷新${label}吗？\n将从远程重新拉取数据，可能需要一些时间。`);
}

els.btnRefresh.addEventListener('click', () => {
  if (currentPlatform === 'steam' && !activeUserId) {
    showToast('请先添加 Steam 用户', true);
    return;
  }
  if (!confirmRefreshLibrary()) return;
  fetchCurrentPlatformGames(true, { quiet: false }).catch((err) => showToast(err.message, true));
});

els.btnRandom.addEventListener('click', () => {
  pickRandomGame().catch((err) => showToast(err.message, true));
});
els.btnRandomAgain.addEventListener('click', () => {
  pickRandomGame().catch((err) => showToast(err.message, true));
});
els.btnCloseRandom.addEventListener('click', () => els.randomDialog.close());

els.gameGrid.addEventListener('error', (event) => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement) || !img.classList.contains('game-cover')) return;
  handleGameCoverError(img);
}, true);

els.randomBody?.addEventListener('error', (event) => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement) || !img.classList.contains('random-cover')) return;
  handleGameCoverError(img);
}, true);

els.gameGrid.addEventListener('click', (e) => {
  const storeBtn = e.target.closest('.btn-platform-store');
  if (storeBtn) {
    e.preventDefault();
    e.stopPropagation();
    openGameStore(storeBtn.dataset.storeUrl);
    return;
  }
  const editBtn = e.target.closest('.btn-game-edit');
  if (editBtn) {
    e.preventDefault();
    e.stopPropagation();
    const appid = editBtn.dataset.appid;
    const platform = editBtn.dataset.platform;
    const game = currentPageGames.find(
      (item) => String(item.appid) === String(appid) && gamePlatform(item) === platform,
    );
    if (game) openGameEditDialog(game);
    return;
  }
  const favBtn = e.target.closest('.btn-favorite');
  if (favBtn) {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(favBtn.dataset.appid, favBtn.dataset.platform).catch((err) => showToast(err.message, true));
    return;
  }
  const hideBtn = e.target.closest('.btn-hidden');
  if (!hideBtn) return;
  e.preventDefault();
  e.stopPropagation();
  toggleHidden(hideBtn.dataset.appid, hideBtn.dataset.platform).catch((err) => showToast(err.message, true));
});

els.randomBody.addEventListener('click', (e) => {
  const favBtn = e.target.closest('.btn-favorite');
  if (favBtn) {
    e.preventDefault();
    toggleFavorite(favBtn.dataset.appid, favBtn.dataset.platform).catch((err) => showToast(err.message, true));
    return;
  }
  const hideBtn = e.target.closest('.btn-hidden');
  if (!hideBtn) return;
  e.preventDefault();
  toggleHidden(hideBtn.dataset.appid, hideBtn.dataset.platform).catch((err) => showToast(err.message, true));
});

els.btnCloseGameEdit?.addEventListener('click', closeGameEditDialog);
els.btnCancelGameEdit?.addEventListener('click', closeGameEditDialog);
els.btnSaveGameEdit?.addEventListener('click', () => saveGameEditDialog().catch((err) => showToast(err.message, true)));
els.btnCoverLookup?.addEventListener('click', () => lookupCoverCandidates().catch((err) => showToast(err.message, true)));
els.coverLookupResults?.addEventListener('click', (e) => {
  const item = e.target.closest('.cover-lookup-item');
  if (!item) return;
  const url = item.dataset.url || '';
  const name = item.dataset.name || '';
  const nameCn = item.dataset.nameCn || name;
  const genres = item.dataset.genres || '';
  if (url) els.inputCoverUrl.value = url;
  if (nameCn) {
    els.inputNameCn.value = nameCn;
    els.inputCoverLookup.value = nameCn;
  }
  if (name && !els.inputNameEn.value.trim()) els.inputNameEn.value = name;
  if (genres && !els.inputGenres.value.trim()) els.inputGenres.value = genres;
  if (url) setGameEditPreview(url);
});
els.inputCoverUrl?.addEventListener('input', () => {
  const url = els.inputCoverUrl.value.trim();
  if (url) setGameEditPreview(url);
});

els.btnImportHidden?.addEventListener('click', () => openHiddenImportDialog());
els.btnCloseHiddenImport?.addEventListener('click', closeHiddenImportDialog);
els.btnCancelHiddenImport?.addEventListener('click', closeHiddenImportDialog);
els.btnConfirmHiddenImport?.addEventListener('click', () => {
  confirmHiddenImport().catch((err) => showToast(err.message, true));
});

[
  els.filterSearch,
  els.filterGenre,
  els.filterTag,
  els.filterOwner,
  els.filterCollection,
  els.filterSort,
  els.filterMinHours,
  els.filterMaxHours,
  els.filterUnplayed,
  els.filterShareable,
  els.filterNonShareable,
  els.filterFamilyOnly,
  els.filterFavoritesOnly,
  els.filterHiddenOnly,
].forEach((el) => {
  el.addEventListener('input', scheduleLibraryReload);
  el.addEventListener('change', scheduleLibraryReload);
});

els.btnPagePrev?.addEventListener('click', () => {
  if (libraryPagination.page <= 1 || gamesLoading) return;
  fetchLibraryPage(false, libraryPagination.page - 1, { quiet: true })
    .catch((err) => showToast(err.message, true));
});

els.btnPageNext?.addEventListener('click', () => {
  if (libraryPagination.page >= libraryPagination.totalPages || gamesLoading) return;
  fetchLibraryPage(false, libraryPagination.page + 1, { quiet: true })
    .catch((err) => showToast(err.message, true));
});

els.btnToggleSidebar?.addEventListener('click', toggleSidebar);
els.btnExpandSidebar?.addEventListener('click', toggleSidebar);
els.btnToggleFilters?.addEventListener('click', toggleFilters);
els.btnCloseFilters?.addEventListener('click', () => setFiltersExpanded(false));
els.filtersBackdrop?.addEventListener('click', () => setFiltersExpanded(false));

window.addEventListener('resize', () => {
  clearTimeout(gridLayoutTimer);
  gridLayoutTimer = setTimeout(() => layoutGameGrid(), 100);
});

initSidebarState();
layoutGameGrid();
loadEnvConfig();
