const els = {
  btnRefresh: document.getElementById('btnRefresh'),
  btnContinueMetaEnrich: document.getElementById('btnContinueMetaEnrich'),
  btnImportHidden: document.getElementById('btnImportHidden'),
  btnImportCollections: document.getElementById('btnImportCollections'),
  btnRandom: document.getElementById('btnRandom'),
  btnTokenStatus: document.getElementById('btnTokenStatus'),
  tokenStatusDot: document.getElementById('tokenStatusDot'),
  btnSettings: document.getElementById('btnSettings'),
  btnUserMenu: document.getElementById('btnUserMenu'),
  userMenuAvatar: document.getElementById('userMenuAvatar'),
  userMenuName: document.getElementById('userMenuName'),
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
  filterInstalledOnly: document.getElementById('filterInstalledOnly'),
  filterInputMethod: document.getElementById('filterInputMethod'),
  filterInputMethodWrap: document.getElementById('filterInputMethodWrap'),
  filterFavoritesOnly: document.getElementById('filterFavoritesOnly'),
  filterHiddenOnly: document.getElementById('filterHiddenOnly'),
  statsBar: document.getElementById('statsBar'),
  libraryFooter: document.getElementById('libraryFooter'),
  gameGrid: document.getElementById('gameGrid'),
  toast: document.getElementById('toast'),
  gameActionConfirmDialog: document.getElementById('gameActionConfirmDialog'),
  gameActionConfirmTitle: document.getElementById('gameActionConfirmTitle'),
  gameActionConfirmMessage: document.getElementById('gameActionConfirmMessage'),
  btnCancelGameActionConfirm: document.getElementById('btnCancelGameActionConfirm'),
  btnConfirmGameAction: document.getElementById('btnConfirmGameAction'),
  randomDialog: document.getElementById('randomDialog'),
  randomBody: document.getElementById('randomBody'),
  btnCloseRandom: document.getElementById('btnCloseRandom'),
  btnRandomAgain: document.getElementById('btnRandomAgain'),
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
  filterChecksSteam: document.querySelector('.filter-checks-steam'),
  hiddenImportDialog: document.getElementById('hiddenImportDialog'),
  btnCloseHiddenImport: document.getElementById('btnCloseHiddenImport'),
  btnCancelHiddenImport: document.getElementById('btnCancelHiddenImport'),
  btnConfirmHiddenImport: document.getElementById('btnConfirmHiddenImport'),
  inputSteamPath: document.getElementById('inputSteamPath'),
  hiddenImportHint: document.getElementById('hiddenImportHint'),
  collectionsImportDialog: document.getElementById('collectionsImportDialog'),
  btnCloseCollectionsImport: document.getElementById('btnCloseCollectionsImport'),
  btnCancelCollectionsImport: document.getElementById('btnCancelCollectionsImport'),
  btnConfirmCollectionsImport: document.getElementById('btnConfirmCollectionsImport'),
  inputCollectionsSteamPath: document.getElementById('inputCollectionsSteamPath'),
  collectionsImportHint: document.getElementById('collectionsImportHint'),
  settingsDialog: document.getElementById('settingsDialog'),
  btnCloseSettings: document.getElementById('btnCloseSettings'),
  btnCancelSettings: document.getElementById('btnCancelSettings'),
  btnSaveSettings: document.getElementById('btnSaveSettings'),
  inputSettingsSteamPath: document.getElementById('inputSettingsSteamPath'),
  inputSettingsHttpsProxy: document.getElementById('inputSettingsHttpsProxy'),
  inputSettingsLogLevel: document.getElementById('inputSettingsLogLevel'),
  inputSettingsLogToFile: document.getElementById('inputSettingsLogToFile'),
  inputSettingsCoverOrphanTtlDays: document.getElementById('inputSettingsCoverOrphanTtlDays'),
  inputSettingsCoverCleanupIntervalHours: document.getElementById('inputSettingsCoverCleanupIntervalHours'),
  settingsSteamDetected: document.getElementById('settingsSteamDetected'),
  pagination: document.getElementById('pagination'),
  btnPagePrev: document.getElementById('btnPagePrev'),
  btnPageNext: document.getElementById('btnPageNext'),
  pageInfo: document.getElementById('pageInfo'),
  appRoot: document.getElementById('appRoot'),
  btnToggleFilters: document.getElementById('btnToggleFilters'),
  filtersBody: document.getElementById('filtersBody'),
  filtersDrawer: document.getElementById('filtersDrawer'),
  filtersBackdrop: document.getElementById('filtersBackdrop'),
  btnCloseFilters: document.getElementById('btnCloseFilters'),
  libraryMain: document.getElementById('libraryMain'),
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
  btnRefreshGameMeta: document.getElementById('btnRefreshGameMeta'),
  btnRefetchCover: document.getElementById('btnRefetchCover'),
  refreshDialog: document.getElementById('refreshDialog'),
  btnCloseRefresh: document.getElementById('btnCloseRefresh'),
  btnCancelRefresh: document.getElementById('btnCancelRefresh'),
  btnConfirmRefresh: document.getElementById('btnConfirmRefresh'),
  refreshDialogHint: document.getElementById('refreshDialogHint'),
  refreshOptLibrary: document.getElementById('refreshOptLibrary'),
  refreshOptMetaWrap: document.getElementById('refreshOptMetaWrap'),
  refreshOptMeta: document.getElementById('refreshOptMeta'),
  refreshOptMetaSubWrap: document.getElementById('refreshOptMetaSubWrap'),
  refreshOptMetaModeAll: document.getElementById('refreshOptMetaModeAll'),
  refreshOptCoversRefresh: document.getElementById('refreshOptCoversRefresh'),
  refreshOptCoversSubWrap: document.getElementById('refreshOptCoversSubWrap'),
  refreshOptCoversModeAll: document.getElementById('refreshOptCoversModeAll'),
  refreshOptCoversOverwriteLocal: document.getElementById('refreshOptCoversOverwriteLocal'),
  refreshOptCoversOverwriteLocalWrap: document.getElementById('refreshOptCoversOverwriteLocalWrap'),
  refreshOptLocalize: document.getElementById('refreshOptLocalize'),
  refreshOptLocalizeSubWrap: document.getElementById('refreshOptLocalizeSubWrap'),
  refreshOptLocalizeOverwriteLocal: document.getElementById('refreshOptLocalizeOverwriteLocal'),
  refreshOptLocalizeRetry: document.getElementById('refreshOptLocalizeRetry'),
};

let gameEditTarget = null;
let gameEditPreviewObjectUrl = '';
let currentPageGames = [];
let currentRandomGame = null;

let tokenPreviewTimer = null;
let tokenPreviewRequestId = 0;
let enrichAbortController = null;
let metaEnriching = false;
let progressHoldCount = 0;
let libraryFetchController = null;
let libraryFetchToken = 0;
const updatingCards = new Set();

const PAGE_SIZE = 48;
const GRID_ROWS = 4;
let dynamicPageSize = PAGE_SIZE;
let gridLayoutTimer = null;

let libraryLoaded = false;
let libraryGameCount = 0;
let libraryFilteredCount = 0;
let libraryMeta = {
  source: '',
  cachedAt: null,
  sessionExpired: false,
  installedCount: 0,
  metaPending: 0,
};
let libraryPagination = { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };
let filterReloadTimer = null;
let currentSteamId = '';
let activeUserId = '';
let users = [];
let includeFamilyLoaded = false;
let loadedAccountCount = 1;
let tokenDialogMode = 'add';
let gamesLoading = false;
let favoriteByPlatform = { steam: new Set() };
let hiddenByPlatform = { steam: new Set() };
let appSettings = {
  steamPath: '',
  httpsProxy: '',
  logLevel: 'info',
  logToFile: true,
  coverOrphanTtlDays: 3,
  coverCleanupIntervalHours: 24,
  detected: { steam: [] },
};

function applySettingsToForm(data = appSettings) {
  if (els.inputSettingsSteamPath) els.inputSettingsSteamPath.value = data.steamPath || '';
  if (els.inputSettingsHttpsProxy) els.inputSettingsHttpsProxy.value = data.httpsProxy || '';
  if (els.inputSettingsLogLevel) els.inputSettingsLogLevel.value = data.logLevel || 'info';
  if (els.inputSettingsLogToFile) els.inputSettingsLogToFile.checked = data.logToFile !== false;
  if (els.inputSettingsCoverOrphanTtlDays) {
    els.inputSettingsCoverOrphanTtlDays.value = String(data.coverOrphanTtlDays ?? 3);
  }
  if (els.inputSettingsCoverCleanupIntervalHours) {
    els.inputSettingsCoverCleanupIntervalHours.value = String(data.coverCleanupIntervalHours ?? 24);
  }
}

function readSettingsFromForm() {
  return {
    steamPath: els.inputSettingsSteamPath?.value.trim() || '',
    httpsProxy: els.inputSettingsHttpsProxy?.value.trim() || '',
    logLevel: els.inputSettingsLogLevel?.value || 'info',
    logToFile: !!els.inputSettingsLogToFile?.checked,
    coverOrphanTtlDays: Math.max(1, Number(els.inputSettingsCoverOrphanTtlDays?.value) || 3),
    coverCleanupIntervalHours: Math.max(1, Number(els.inputSettingsCoverCleanupIntervalHours?.value) || 24),
  };
}

function formatDetectedPaths(list, emptyText) {
  const paths = Array.isArray(list) ? list.filter(Boolean) : [];
  if (!paths.length) return emptyText || '未检测到有效路径';
  return `已检测：${paths.join('；')}`;
}

function renderSettingsDetected(data = appSettings) {
  const detected = data.detected || {};
  if (els.settingsSteamDetected) {
    els.settingsSteamDetected.textContent = formatDetectedPaths(detected.steam, '未检测到 Steam 安装目录');
  }
}

async function loadAppSettings() {
  const res = await fetch('/api/settings');
  const data = await readApiJson(res);
  if (!res.ok) throw new Error(data.error || '读取设置失败');
  appSettings = {
    steamPath: data.steamPath || '',
    httpsProxy: data.httpsProxy || '',
    logLevel: data.logLevel || 'info',
    logToFile: data.logToFile !== false,
    coverOrphanTtlDays: data.coverOrphanTtlDays ?? 3,
    coverCleanupIntervalHours: data.coverCleanupIntervalHours ?? 24,
    detected: data.detected || { steam: [] },
  };
  return appSettings;
}

async function openSettingsDialog() {
  els.settingsDialog?.showModal();
  renderSettingsDetected({ detected: { steam: [] } });
  if (els.btnSaveSettings) {
    els.btnSaveSettings.disabled = true;
    els.btnSaveSettings.textContent = '加载中...';
  }
  try {
    const data = await loadAppSettings();
    applySettingsToForm(data);
    renderSettingsDetected(data);
  } catch (err) {
    showToast(err.message, true);
    renderSettingsDetected();
  } finally {
    if (els.btnSaveSettings) {
      els.btnSaveSettings.disabled = false;
      els.btnSaveSettings.textContent = '保存';
    }
  }
}

function closeSettingsDialog() {
  els.settingsDialog?.close();
}

async function saveSettings() {
  const payload = readSettingsFromForm();
  els.btnSaveSettings.disabled = true;
  els.btnSaveSettings.textContent = '保存中...';
  try {
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || '保存失败');
    appSettings = {
      steamPath: data.steamPath || '',
      httpsProxy: data.httpsProxy || '',
      logLevel: data.logLevel || 'info',
      logToFile: data.logToFile !== false,
      coverOrphanTtlDays: data.coverOrphanTtlDays ?? 3,
      coverCleanupIntervalHours: data.coverCleanupIntervalHours ?? 24,
      detected: data.detected || { steam: [] },
    };
    renderSettingsDetected(appSettings);
    closeSettingsDialog();
    showToast('设置已保存');
  } catch (err) {
    showToast(err.message, true);
  } finally {
    els.btnSaveSettings.disabled = false;
    els.btnSaveSettings.textContent = '保存';
  }
}

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

function getActiveUser() {
  return users[0] || null;
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

function bindDialogBackdropClose(dialog, onClose) {
  if (!dialog || typeof onClose !== 'function') return;
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    onClose();
  });
}

function initDialogBackdropClose() {
  bindDialogBackdropClose(els.settingsDialog, closeSettingsDialog);
  bindDialogBackdropClose(els.gameEditDialog, closeGameEditDialog);
  bindDialogBackdropClose(els.tokenDialog, closeTokenDialog);
  bindDialogBackdropClose(els.refreshDialog, closeRefreshDialog);
  bindDialogBackdropClose(els.hiddenImportDialog, closeHiddenImportDialog);
  bindDialogBackdropClose(els.collectionsImportDialog, closeCollectionsImportDialog);
  bindDialogBackdropClose(els.randomDialog, () => els.randomDialog?.close());
  bindDialogBackdropClose(els.gameActionConfirmDialog, () => finishGameActionConfirm(false));
}

function getToastHost() {
  const dialogs = [
    els.tokenDialog,
    els.hiddenImportDialog,
    els.randomDialog,
    els.gameActionConfirmDialog,
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

function gamePlatform() {
  return 'steam';
}

function resolveCoverLookupQuery(game) {
  const candidates = [
    game.display_name,
    game.custom_name_cn,
    game.source_name_cn,
    game.custom_name_en,
    game.source_name,
    game.name_cn,
    game.name,
    ...(game.aliases || []),
  ];
  for (const raw of candidates) {
    const value = String(raw || '').trim();
    if (value) return value;
  }
  return '';
}

function gameSourceName(game) {
  const candidates = [
    game.source_name_cn,
    game.source_name,
    game.display_name,
    game.custom_name_cn,
    game.name_cn,
    game.name,
  ];
  for (const raw of candidates) {
    const value = String(raw || '').trim();
    if (value) return value;
  }
  return '';
}

function gameStoreUrl(game) {
  const url = String(game.store_url || '').trim();
  if (url && url !== '#') return url;
  return `https://store.steampowered.com/app/${game.appid}`;
}

function gameCoverImage(game) {
  if (game.cover_url) return game.cover_url;
  return coverUrl(game.appid);
}

function gameCoverFallback(game) {
  return iconUrl(game.appid, game.img_icon_url);
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

function gameCoverPlaceholderHtml(game, { fallback = false, initiallyVisible = false } = {}) {
  const title = gameTitle(game);
  const abbrev = escapeHtml(gameCoverAbbrev(title));
  const bg = gameCoverPlaceholderColor(game.appid || title);
  const hiddenClass = fallback && !initiallyVisible ? ' hidden' : '';
  const classes = fallback
    ? `game-cover game-cover-placeholder is-fallback${hiddenClass}`
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
  const wrap = img.closest('.game-cover-wrap');
  wrap?.querySelector('.game-cover-placeholder.is-fallback')?.classList.remove('hidden');
}

function handleGameCoverLoad(img) {
  const wrap = img.closest('.game-cover-wrap');
  wrap?.querySelector('.game-cover-placeholder.is-fallback')?.classList.add('hidden');
}

function finalizeCoverImage(img) {
  if (!(img instanceof HTMLImageElement)) return;
  if (img.complete && img.naturalWidth > 0) {
    handleGameCoverLoad(img);
    return;
  }
  img.addEventListener('load', () => handleGameCoverLoad(img), { once: true });
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
  parts.push(...(g.genres || []), ...(g.tags || []));
  return parts.filter(Boolean).join(' ').toLowerCase();
}

const SORT_OPTIONS_STEAM = [
  { value: 'name-asc', label: '名称 A-Z' },
  { value: 'name-desc', label: '名称 Z-A' },
  { value: 'playtime-desc', label: '游玩时长 ↓' },
  { value: 'playtime-asc', label: '游玩时长 ↑' },
  { value: 'recent', label: '最近游玩' },
];

function updateSortOptions() {
  const current = els.filterSort.value;
  els.filterSort.innerHTML = SORT_OPTIONS_STEAM
    .map((item) => `<option value="${item.value}">${item.label}</option>`)
    .join('');
  els.filterSort.value = SORT_OPTIONS_STEAM.some((item) => item.value === current) ? current : 'name-asc';
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

function sanitizeStoreGameNameClient(name) {
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

function gameTitle(g) {
  if (g.display_name) return g.display_name;
  const customCn = g.custom_name_cn || '';
  if (customCn && customCn !== g.name) return customCn;
  const cn = sanitizeStoreGameNameClient(g.name_cn || '');
  if (cn && cn !== g.name && !isPromoStoreTitle(g.name_cn)) return cn;
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
  els.filterGenre.disabled = !libraryLoaded;
  els.filterTag.disabled = !libraryLoaded;
  els.filterMinHours.disabled = !libraryLoaded;
  els.filterMaxHours.disabled = !libraryLoaded;
  els.filterUnplayed.disabled = !libraryLoaded;
  els.filterShareable.disabled = !libraryLoaded;
  els.filterNonShareable.disabled = !libraryLoaded;
  els.filterFamilyOnly.disabled = !libraryLoaded;
  els.filterInstalledOnly.disabled = !libraryLoaded;
  els.filterInputMethod.disabled = !libraryLoaded;
  els.filterFavoritesOnly.disabled = !libraryLoaded;
  els.filterHiddenOnly.disabled = !libraryLoaded;
  els.filterOwner.disabled = !libraryLoaded;
  els.filterCollection.disabled = !libraryLoaded;
  els.btnImportHidden.disabled = !activeUserId;
  els.btnImportCollections.disabled = !activeUserId;
  updateSortOptions();
}

function showGameGridLoading(text = '正在加载...') {
  if (!els.gameGrid) return;
  els.gameGrid.classList.add('is-loading');
  els.gameGrid.innerHTML = `<div class="grid-loading-state">${escapeHtml(text)}</div>`;
}

function hideGameGridLoading() {
  els.gameGrid?.classList.remove('is-loading');
}

function computeGameGridLayout() {
  if (!els.libraryMain || !els.gameGrid) {
    return { cols: 8, rows: GRID_ROWS, pageSize: PAGE_SIZE, cardH: 168, bodyH: 44, isCompactCard: true };
  }

  const styles = getComputedStyle(document.documentElement);
  const colGap = parseFloat(styles.getPropertyValue('--card-gap-x')) || 14;
  const rowGap = parseFloat(styles.getPropertyValue('--card-gap-y')) || 10;
  const gridInsetBottom = parseFloat(styles.getPropertyValue('--grid-layout-inset-bottom')) || 6;
  const mainRect = els.libraryMain.getBoundingClientRect();
  const mainGap = parseFloat(styles.getPropertyValue('--library-main-gap')) || 4;
  const footH = (els.libraryFooter?.offsetHeight || 0) + mainGap;
  const availableH = Math.max(220, mainRect.height - footH - gridInsetBottom);
  const availableW = els.gameGrid.clientWidth || mainRect.width;

  const minCardW = 168;
  const maxCols = 10;
  let cols = Math.floor((availableW + colGap) / (minCardW + colGap));
  cols = Math.max(4, Math.min(cols, maxCols));
  if (availableW >= 1360 && cols >= 9) cols = 10;

  const rows = GRID_ROWS;
  const cardH = Math.floor((availableH - rowGap * (rows - 1)) / rows);
  const bodyH = 142;

  const pageSize = cols * rows;
  const isCompactCard = false;

  return { cols, rows, pageSize, cardH, bodyH, isCompactCard };
}

function applyGameGridLayout(metrics) {
  document.documentElement.style.setProperty('--grid-cols', String(metrics.cols));
  document.documentElement.style.setProperty('--grid-rows', String(metrics.rows));
  document.documentElement.style.setProperty('--card-min-height', `${metrics.cardH}px`);
  els.gameGrid?.classList.toggle('game-grid--compact', metrics.isCompactCard);
}

function layoutGameGrid() {
  const metrics = computeGameGridLayout();
  applyGameGridLayout(metrics);
  dynamicPageSize = metrics.pageSize;
  libraryPagination.pageSize = metrics.pageSize;
  return metrics;
}

function relayoutGridIfNeeded() {
  const prevSize = dynamicPageSize;
  layoutGameGrid();
  if (libraryLoaded && !gamesLoading && dynamicPageSize !== prevSize) {
    showGameGridLoading('正在调整布局...');
    return fetchLibraryPage(false, libraryPagination.page, { quiet: true }).catch(() => {});
  }
  return Promise.resolve();
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
    requestAnimationFrame(() => relayoutGridIfNeeded());
  }
}

function toggleFilters() {
  const expanded = els.filtersDrawer?.classList.contains('collapsed');
  setFiltersExpanded(!!expanded);
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
    els.filterInstalledOnly,
    els.filterInputMethod,
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
    installedOnly: els.filterInstalledOnly.checked,
    inputMethod: els.filterInputMethod.value,
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
  params.set('page', String(page));
  params.set('pageSize', String(dynamicPageSize || PAGE_SIZE));
  params.set('sort', els.filterSort.value);

  const filters = getFilterParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.genre) params.set('genre', filters.genre);
  if (filters.tagSearch) params.set('tagSearch', filters.tagSearch);
  if (filters.unplayed) params.set('unplayed', 'true');
  if (filters.shareableOnly) params.set('shareableOnly', 'true');
  if (filters.nonShareableOnly) params.set('nonShareableOnly', 'true');
  if (filters.familyOnly) params.set('familyOnly', 'true');
  if (filters.installedOnly) params.set('installedOnly', 'true');
  if (filters.inputMethod) params.set('inputMethod', filters.inputMethod);
  if (filters.ownerSteamId) params.set('ownerSteamId', filters.ownerSteamId);
  if (filters.steamCollectionId) params.set('steamCollectionId', filters.steamCollectionId);
  if (filters.minHours > 0) params.set('minHours', String(filters.minHours));
  if (Number.isFinite(filters.maxHours)) params.set('maxHours', String(filters.maxHours));
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
  els.filterOwnerWrap?.classList.toggle('hidden', owners.length <= 1);

  const collectionVal = els.filterCollection.value;
  els.filterCollection.innerHTML = '<option value="">全部收藏夹</option>' +
    collections.map((item) => `<option value="${item.id}">${item.name} (${item.count})</option>`).join('');
  if (collectionVal && collections.some((item) => item.id === collectionVal)) {
    els.filterCollection.value = collectionVal;
  } else {
    els.filterCollection.value = '';
  }
  els.filterCollectionWrap?.classList.toggle('hidden', !collections.length);
}

function renderPagination() {
  const { page, totalPages, total } = libraryPagination;
  const show = libraryLoaded && totalPages > 1;
  els.pagination?.classList.toggle('hidden', !show);
  if (!show) {
    requestAnimationFrame(() => relayoutGridIfNeeded());
    return;
  }

  els.pageInfo.textContent = `第 ${page} / ${totalPages} 页 · 共 ${total} 款`;
  els.btnPagePrev.disabled = page <= 1 || isPaginationBlocked();
  els.btnPageNext.disabled = page >= totalPages || isPaginationBlocked();
  requestAnimationFrame(() => relayoutGridIfNeeded());
}

function gameCardGenreText(game) {
  return (game.genres || []).slice(0, 2).join(' · ');
}

function gameCardTagText(game) {
  return (game.tags || []).slice(0, 3).join(' · ');
}

const INPUT_METHOD_KM_ICON = '<svg class="input-method-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm2 4v2h2v-2H6zm3 0v2h2v-2H9zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zM6 13v2h12v-2H6z"/><path fill="currentColor" d="M10 18h4v2h-4z" opacity=".85"/></svg>';
const INPUT_METHOD_CONTROLLER_ICON = '<svg class="input-method-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M8 6a5 5 0 0 0-5 5v2a5 5 0 0 0 5 5h8a5 5 0 0 0 5-5v-2a5 5 0 0 0-5-5H8zm2.5 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM7 13.5a1 1 0 0 1 2 0 1 1 0 0 1-2 0zm8 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0z"/></svg>';

function gameInputMethodsHtml(game) {
  const methods = game.input_methods || [];
  let icon = INPUT_METHOD_KM_ICON;
  let title = '键鼠';
  if (methods.includes('controller_full')) {
    icon = INPUT_METHOD_CONTROLLER_ICON;
    title = '完全支持控制器';
  } else if (methods.includes('controller_partial') || methods.includes('controller')) {
    icon = INPUT_METHOD_CONTROLLER_ICON;
    title = '部分支持控制器';
  }
  return `<span class="game-input-methods"><span class="input-method-badge" title="${title}">${icon}</span></span>`;
}

function gameCardHtml(game, options = {}) {
  const random = options.random === true;
  const subtitle = gameSubtitle(game);
  const genreText = gameCardGenreText(game);
  const tagText = gameCardTagText(game);
  const coverMarkup = gameCoverMarkup(game);
  const cardClass = `game-card${game.installed ? ' is-installed' : ''}${random ? ' game-card--random' : ''}`;
  return `
      <article class="${cardClass}" data-appid="${game.appid}" data-platform="steam" data-source-name="${escapeHtml(game.source_name || game.name || '')}">
        <div class="game-cover-wrap">
          ${coverMarkup}
          ${game.installed ? '<span class="game-installed-badge" title="已安装">已安装</span>' : ''}
        </div>
        <div class="game-body">
          <div class="game-body-content">
            <h3 class="game-name">${gameTitle(game)}</h3>
            ${subtitle ? `<div class="game-subtitle">${subtitle}</div>` : ''}
            ${genreText ? `<div class="game-genres">${escapeHtml(genreText)}</div>` : ''}
            ${tagText ? `<div class="game-tags">${escapeHtml(tagText)}</div>` : ''}
            ${steamOwnerRowHtml(game)}
          </div>
          <div class="game-meta">
            ${gameInputMethodsHtml(game)}
            <span>${formatHours(game.playtime_forever)}</span>
            ${game.from_family ? '<span class="badge badge-family">家庭</span>' : ''}
            ${game.shareable === false ? '<span class="badge badge-warn">非共享</span>' : ''}
          </div>
        </div>
        ${gameCoverActionsHtml(game)}
      </article>`;
}

function renderGameCards(games) {
  hideGameGridLoading();
  if (!games.length) {
    els.gameGrid.innerHTML = '<div class="empty-state">没有符合筛选条件的游戏</div>';
    return;
  }

  els.gameGrid.innerHTML = games.map((g) => gameCardHtml(g)).join('');
  syncUpdatingCardOverlays();
}

function gameCardKey(appid, platform) {
  return `${platform}:${String(appid || '')}`;
}

function findGameCard(appid, platform) {
  return els.gameGrid?.querySelector(
    `.game-card[data-appid="${CSS.escape(String(appid))}"][data-platform="${platform}"]`,
  );
}

function setGameCardUpdating(appid, platform, updating = true) {
  const key = gameCardKey(appid, platform);
  if (updating) updatingCards.add(key);
  else updatingCards.delete(key);

  const card = findGameCard(appid, platform);
  if (!card) return;

  card.classList.toggle('is-updating', updating);
  let overlay = card.querySelector(':scope > .game-cover-loading');
  if (updating) {
    if (!overlay) {
      card.insertAdjacentHTML(
        'beforeend',
        '<div class="game-cover-loading" aria-hidden="true"><span class="game-cover-spinner"></span></div>',
      );
    }
  } else {
    overlay?.remove();
  }
}

function syncUpdatingCardOverlays() {
  for (const key of updatingCards) {
    const sep = key.indexOf(':');
    if (sep <= 0) continue;
    setGameCardUpdating(key.slice(sep + 1), key.slice(0, sep), true);
  }
}

function markCurrentPageCoverUpdates(platform, predicate = () => true) {
  for (const game of currentPageGames) {
    if (gamePlatform(game) !== platform) continue;
    if (!predicate(game)) continue;
    setGameCardUpdating(game.appid, platform, true);
  }
}

function clearPlatformUpdatingCards(platform) {
  for (const key of [...updatingCards]) {
    if (!key.startsWith(`${platform}:`)) continue;
    setGameCardUpdating(key.slice(platform.length + 1), platform, false);
  }
}

function releaseLibraryLoadingUi() {
  gamesLoading = false;
  els.btnRefresh.disabled = !libraryLoaded;
  els.btnRefresh.textContent = '刷新数据';
  updateMetaContinueUi();
  renderPagination();
}

function cancelPendingLibraryFetch() {
  libraryFetchToken += 1;
  if (libraryFetchController) {
    libraryFetchController.abort();
    libraryFetchController = null;
  }
  gamesLoading = false;
  updatingCards.clear();
  els.gameGrid?.querySelectorAll('.game-card.is-updating').forEach((card) => {
    card.classList.remove('is-updating');
    card.querySelector('.game-cover-loading')?.remove();
  });
}

function isStaleLibraryFetch(token) {
  return token !== libraryFetchToken;
}

function holdTopProgress() {
  progressHoldCount += 1;
}

function releaseTopProgress() {
  progressHoldCount = Math.max(0, progressHoldCount - 1);
  if (progressHoldCount === 0) hideLoadProgressInternal();
}

function resetTopProgressHold() {
  progressHoldCount = 0;
  hideLoadProgressInternal();
}

function isTopProgressHeld() {
  return progressHoldCount > 0;
}

function isPaginationBlocked() {
  return gamesLoading && !isTopProgressHeld();
}

function formatLibrarySourceText(meta) {
  if (meta.source === 'cache') {
    return meta.sessionExpired ? '来自缓存·连接已过期' : '来自本地缓存';
  }
  if (meta.source === 'remote-refresh') return '已手动更新';
  if (meta.source === 'remote') return '已从 Steam 获取';
  return '';
}

function syncLibraryMeta(data = {}) {
  if (data.source !== undefined) libraryMeta.source = data.source;
  if (data.cachedAt !== undefined) libraryMeta.cachedAt = data.cachedAt;
  if (data.sessionExpired !== undefined) libraryMeta.sessionExpired = data.sessionExpired;
  if (data.tokenExpired) libraryMeta.sessionExpired = true;
  if (data.installedCount !== undefined) libraryMeta.installedCount = data.installedCount || 0;
  if (data.metaPending !== undefined) libraryMeta.metaPending = data.metaPending || 0;
}

function updateMetaContinueUi() {
  const btn = els.btnContinueMetaEnrich;
  if (!btn) return;
  const pending = libraryMeta.metaPending || 0;
  const show = libraryLoaded && pending > 0;
  btn.classList.toggle('hidden', !show);
  btn.disabled = !libraryLoaded || gamesLoading || metaEnriching;
  if (metaEnriching) {
    btn.textContent = '补全中...';
    return;
  }
  btn.textContent = pending > 0 ? `继续补全 (${pending})` : '继续补全';
}

async function refreshMetaPendingCount() {
  if (!currentSteamId) return;
  try {
    const steamId = currentSteamId.split(',')[0].trim();
    const res = await fetch(
      `/api/games/meta-pending?steamId=${encodeURIComponent(steamId)}&includeFamily=true`,
      { headers: buildHeaders() },
    );
    if (!res.ok) return;
    const data = await res.json();
    libraryMeta.metaPending = data.pending || 0;
    updateMetaContinueUi();
  } catch (err) {
    debugLog('刷新 metaPending 失败', { message: err.message });
  }
}

async function continueMetaEnrichment() {
  if (!currentSteamId || metaEnriching || gamesLoading) return;
  const steamId = currentSteamId.split(',')[0].trim();
  await enrichGamesMeta(steamId, { forceAll: false, reloadAfter: true });
}

function updateStatsBar(overrideText = '') {
  if (overrideText) {
    els.statsBar.textContent = overrideText;
    return;
  }
  const familyText = includeFamilyLoaded ? ' · 含家庭' : '';
  const accountText = loadedAccountCount > 1 ? ` · ${loadedAccountCount} 个账号` : '';
  const favCount = favoriteByPlatform.steam?.size || 0;
  const hiddenCount = hiddenByPlatform.steam?.size || 0;
  const favText = favCount ? ` · 收藏 ${favCount}` : '';
  const hiddenText = hiddenCount ? ` · 隐藏 ${hiddenCount}` : '';
  const sourceText = formatLibrarySourceText(libraryMeta);
  const time = libraryMeta.cachedAt ? new Date(libraryMeta.cachedAt).toLocaleString('zh-CN') : '';
  const cachePart = sourceText ? ` · ${sourceText}${time ? ` · ${time}` : ''}` : '';
  const installedPart = libraryMeta.installedCount ? ` · 已安装 ${libraryMeta.installedCount}` : '';
  els.statsBar.textContent = `共 ${libraryGameCount} 款，显示 ${libraryFilteredCount} 款${cachePart}${installedPart}${accountText}${familyText}${favText}${hiddenText}`;
}

function applyLibraryResponse(data) {
  libraryLoaded = (data.gameCount || 0) > 0;
  libraryGameCount = data.gameCount || 0;
  libraryFilteredCount = data.filteredCount ?? libraryGameCount;
  libraryPagination = data.pagination || { page: 1, pageSize: PAGE_SIZE, total: libraryFilteredCount, totalPages: 1 };
  populateFilterOptionsFromServer(data.filterOptions);
  currentPageGames = data.games || [];
  renderGameCards(currentPageGames);
  syncLibraryMeta(data);
  updateStatsBar();
  updateMetaContinueUi();

  renderPagination();
  setControlsEnabled(libraryLoaded);
  updateModeUi();
}

function scheduleLibraryReload() {
  if (!libraryLoaded || isPaginationBlocked()) return;
  clearTimeout(filterReloadTimer);
  filterReloadTimer = setTimeout(() => {
    fetchLibraryPage(false, 1, { quiet: true, preserveProgress: true, nested: true })
      .catch((err) => showToast(err.message, true));
  }, 250);
}

function buildRefreshPartsParam(parts) {
  const p = parts ?? {};
  const list = [];
  if (p.library) list.push('library');
  if (p.meta) list.push('meta');
  if (p.metaAll) list.push('metaAll');
  if (p.covers || p.coversAll) list.push(p.coversAll ? 'coversAll' : 'covers');
  if (p.localizeCovers) list.push('localizeCovers');
  return list.join(',');
}

function isRefreshPartsActive(parts = {}) {
  return !!(parts.library || parts.meta || parts.metaAll || parts.covers || parts.coversAll || parts.localizeCovers);
}

function isCoversRefreshActive(parts = {}) {
  return !!(parts.covers || parts.coversAll);
}

function getLibraryApiUrl(refreshParts, page) {
  const params = buildFilterQueryParams(page);
  const refreshParam = buildRefreshPartsParam(refreshParts);
  if (refreshParam) params.set('refreshParts', refreshParam);
  if (refreshParts?.localizeRetryFailed) params.set('localizeRetryFailed', 'true');
  if (refreshParts?.coversIncludeLocal) params.set('coversIncludeLocal', 'true');
  if (refreshParts?.localizeIncludeLocal) params.set('localizeIncludeLocal', 'true');

  const user = getActiveUser();
  const steamId = (user?.steamId || '').trim();
  if (steamId) params.set('steamId', steamId);
  params.set('includeFamily', 'true');
  return `/api/games?${params.toString()}`;
}

function getLibraryStreamUrl(parts) {
  const streamParts = {
    library: true,
    localizeCovers: !!parts.localizeCovers,
  };
  const params = new URLSearchParams();
  const refreshParam = buildRefreshPartsParam(streamParts);
  if (refreshParam) params.set('refreshParts', refreshParam);
  if (parts.localizeRetryFailed) params.set('localizeRetryFailed', 'true');
  if (parts.localizeIncludeLocal) params.set('localizeIncludeLocal', 'true');

  const user = getActiveUser();
  const steamId = (user?.steamId || '').trim();
  if (steamId) params.set('steamId', steamId);
  params.set('includeFamily', 'true');
  return `/api/games/library-stream?${params.toString()}`;
}

async function readSseFetch(res, onPayload) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let lastPayload = null;

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
      lastPayload = payload;
      if (payload.error) {
        const err = new Error(payload.error);
        if (payload.needAuth) err.needAuth = true;
        throw err;
      }
      onPayload(payload);
    }
  }

  return lastPayload;
}

async function pullLibraryWithProgress(parts, page, options = {}) {
  const {
    headers,
    fetchOpts,
    refreshStages = [],
    staleFetch = () => false,
  } = options;
  const libIdx = stageIndexOf(refreshStages, 'library');
  const stageTotal = refreshStages.length || 1;
  const defaultLabel = refreshStages[libIdx]?.label || '拉取游戏库';

  abortEnrichStream();
  enrichAbortController = new AbortController();
  const signal = fetchOpts?.signal || enrichAbortController.signal;
  const fetchInit = headers ? { headers, signal } : { signal };

  let localizedCovers = null;
  const streamRes = await fetch(getLibraryStreamUrl(parts), fetchInit);
  if (!streamRes.ok) {
    const data = await readApiJson(streamRes);
    const err = new Error(data.error || '拉取游戏库失败');
    if (data.needAuth) err.needAuth = true;
    throw err;
  }

  await readSseFetch(streamRes, (payload) => {
    if (staleFetch()) return;
    if (payload.complete) {
      localizedCovers = payload.localizedCovers || null;
      return;
    }
    updateTopProgress({
      label: payload.label || defaultLabel,
      current: payload.current || 0,
      total: payload.total || 0,
      stageIndex: libIdx,
      stageTotal,
      progressKind: payload.progressKind || 'count',
    });
  });

  if (staleFetch()) return null;

  const listRes = await fetch(
    getLibraryApiUrl({}, page),
    headers ? { headers, ...fetchOpts } : fetchOpts,
  );
  if (staleFetch()) return null;
  const data = await readApiJson(listRes);
  if (!listRes.ok) throw new Error(data.error || '加载失败');
  if (localizedCovers) data.localizedCovers = localizedCovers;
  return data;
}

async function fetchLibraryPage(refreshParts = null, page = 1, options = {}) {
  const {
    quiet = false,
    autoFetchIfNoCache = false,
    suppressProgress = false,
    nested = false,
    preserveProgress = false,
  } = options;
  const parts = refreshParts || {
    library: false,
    meta: false,
    metaAll: false,
    covers: false,
    coversAll: false,
    coversIncludeLocal: false,
    localizeCovers: false,
  };
  const refreshActive = isRefreshPartsActive(parts);
  const refreshStages = refreshActive && !suppressProgress
    ? buildRefreshStages(parts)
    : [];

  const user = getActiveUser();
  const steamId = (user?.steamId || '').trim();
  if (!steamId) {
    if (!quiet) showToast('请先连接 Steam 账号', true);
    return;
  }
  if (parts.library) await ensureTokenReady();

  if (!nested) {
    if (refreshActive) {
      abortEnrichStream();
      resetTopProgressHold();
    }
    cancelPendingLibraryFetch();
    libraryFetchController = new AbortController();
    gamesLoading = true;
    layoutGameGrid();
    els.btnRefresh.disabled = true;
    els.btnRefresh.textContent = refreshActive ? '更新中...' : '加载中...';
    updateMetaContinueUi();
    const skipGridLoading = preserveProgress && isTopProgressHeld();
    if (!refreshStages.length && !skipGridLoading) {
      showGameGridLoading(refreshActive ? '正在更新...' : '正在加载...');
    }
    renderPagination();
  }

  const fetchToken = nested ? null : libraryFetchToken;
  const fetchSignal = nested ? undefined : libraryFetchController?.signal;
  const staleFetch = () => !nested && isStaleLibraryFetch(fetchToken);

  if (!nested) {
    updateStatsBar(refreshActive ? '正在拉取最新数据...' : '正在加载...');
  }

  if (refreshStages.length) {
    holdTopProgress();
    renderPagination();
    updateTopProgress({
      label: refreshStages[0].label,
      indeterminate: true,
      stageIndex: 0,
      stageTotal: refreshStages.length,
    });
  }

  try {
    const headers = buildHeaders();
    const startedAt = performance.now();
    const fetchOpts = fetchSignal ? { signal: fetchSignal } : undefined;
    let data;

    if (parts.library) {
      data = await pullLibraryWithProgress(parts, page, {
        headers,
        fetchOpts,
        refreshStages,
        staleFetch,
      });
      if (staleFetch() || !data) return;
    } else {
      let res = await fetch(
        getLibraryApiUrl(parts, page),
        headers ? { headers, ...fetchOpts } : fetchOpts,
      );
      if (staleFetch()) return;
      data = await readApiJson(res);

      if (res.status === 401 && data.needAuth) {
        openTokenDialog('update');
        throw new Error(data.error || '请先完成账号连接');
      }
      if (!res.ok) throw new Error(data.error || '加载失败');

      if (autoFetchIfNoCache && !refreshActive && data.fromCache === true && data.gameCount === 0) {
        await ensureTokenReady();
        updateStatsBar('缓存为空，正在拉取...');
        data = await pullLibraryWithProgress({
          library: true,
          meta: false,
          covers: false,
          localizeCovers: false,
        }, page, {
          headers,
          fetchOpts,
          refreshStages: [{ id: 'library', label: '拉取 Steam 游戏库' }],
          staleFetch,
        });
        if (staleFetch() || !data) return;
      }
    }

    currentSteamId = data.steamId || currentSteamId;
    includeFamilyLoaded = !!data.includeFamily;
    loadedAccountCount = data.accountCount || 1;
    await loadSteamUserPrefs();
    if (data.tokenExpired) {
      refreshAuthStatus();
    }

    applyLibraryResponse(data);
    if (staleFetch()) return;
    if (!nested) releaseLibraryLoadingUi();

    debugLog('游戏库分页加载', {
      page: data.pagination?.page,
      ms: Math.round(performance.now() - startedAt),
      gameCount: data.gameCount,
      filteredCount: data.filteredCount,
    });

    if (!quiet && !parts.localizeCovers && !staleFetch()) {
      showToast(data.fromCache ? '已加载缓存' : '游戏库已更新');
    }

    if (staleFetch()) return;

    if (parts.meta || parts.metaAll) {
      const forceAll = !!parts.metaAll;
      const pending = data.metaPending || 0;
      if (forceAll || pending > 0) {
        await enrichGamesMeta((data.steamId || currentSteamId).split(',')[0].trim(), {
          forceAll,
          stageIndex: stageIndexOf(refreshStages, 'meta'),
          stageTotal: refreshStages.length || 1,
          keepProgress: refreshStages.length > 0,
        });
      }
    }

    if (staleFetch()) return;

    if (parts.localizeCovers && data.localizedCovers) {
      activeLocalizeRefreshOpts = {
        retryFailed: !!parts.localizeRetryFailed,
        overwriteLocal: !!parts.localizeIncludeLocal,
      };
      if (refreshStages.length) {
        updateLocalizeCoverProgress(data.localizedCovers, refreshStages);
      }
      if (data.localizedCovers.remaining > 0) {
        data = await runCoverLocalizationBatches(page, refreshStages, data, { suppressProgress });
      } else {
        try {
          const reloaded = await reloadLibraryPageAfterLocalize(page, headers);
          if (reloaded) {
            data = { ...reloaded, localizedCovers: data.localizedCovers };
          }
        } catch (err) {
          debugLog('本地化后刷新列表失败', { message: err.message });
        }
      }
      if (!quiet && data?.localizedCovers) {
        const stats = summarizeLocalizedCovers(data.localizedCovers);
        if (stats.total > 0 || stats.processed > 0) {
          showToast(formatLocalizeCoverToast(stats), stats.failed > 0 && stats.processed === stats.failed);
        } else {
          showToast('没有需要本地化的封面', true);
        }
      }
    }

    if (staleFetch()) return;

    if (isCoversRefreshActive(parts)) {
      const covIdx = stageIndexOf(refreshStages, 'covers');
      await refetchCoversStream({
        forceAll: !!parts.coversAll,
        includeLocal: !!parts.coversIncludeLocal,
        stageIndex: covIdx,
        stageTotal: refreshStages.length || 1,
        keepProgress: refreshStages.length > 0,
      });
    }

    if (staleFetch()) return;

    if (refreshStages.length) {
      updateTopProgress({
        label: '刷新完成',
        current: 1,
        total: 1,
        stageIndex: refreshStages.length - 1,
        stageTotal: refreshStages.length,
      });
      releaseTopProgress();
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError' || staleFetch()) return;
    if (refreshStages.length) resetTopProgressHold();
    debugLog('游戏库加载失败', { message: err.message });
    if (err.needAuth) {
      openTokenDialog('update');
    }
    if (!quiet) {
      showToast(err.message, true);
    }
    if (!libraryLoaded) {
      els.statsBar.textContent = err.message.includes('Token') ? err.message : '加载失败';
      els.gameGrid.innerHTML = `<div class="empty-state">${err.message || '加载失败'}</div>`;
      els.pagination?.classList.add('hidden');
    }
    throw err;
  } finally {
    if (!nested && fetchToken === libraryFetchToken) {
      gamesLoading = false;
      els.btnRefresh.disabled = !libraryLoaded;
      els.btnRefresh.textContent = '刷新数据';
      updateMetaContinueUi();
      renderPagination();
      if (libraryFetchController?.signal?.aborted) libraryFetchController = null;
    }
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
  return { steam: new Set() };
}

function normalizePrefAppId(appid) {
  const raw = String(appid ?? '').trim();
  if (!raw) return '';
  const id = Number(raw);
  return id > 0 ? String(Math.trunc(id)) : '';
}

function applyPlatformPrefSets(target, platforms) {
  if (!platforms) return;
  target.steam = new Set((platforms.steam || []).map((id) => String(Number(id))).filter(Boolean));
}

function isFavorite(appid) {
  const id = normalizePrefAppId(appid);
  return id ? favoriteByPlatform.steam.has(id) : false;
}

function favoriteButtonHtml(appid, extraClass = '') {
  const id = normalizePrefAppId(appid);
  const active = isFavorite(id);
  const cls = `btn-favorite${active ? ' is-favorite' : ''}${extraClass ? ` ${extraClass}` : ''}`;
  const label = active ? '取消收藏' : '收藏';
  return `<button type="button" class="${cls}" data-appid="${escapeHtml(id)}" data-platform="steam" aria-label="${label}" title="${label}">${active ? '★' : '☆'}</button>`;
}

function isHidden(appid) {
  const id = normalizePrefAppId(appid);
  return id ? hiddenByPlatform.steam.has(id) : false;
}

function hiddenButtonHtml(appid, extraClass = '') {
  const id = normalizePrefAppId(appid);
  const active = isHidden(id);
  const cls = `btn-hidden${active ? ' is-hidden' : ''}${extraClass ? ` ${extraClass}` : ''}`;
  const label = active ? '取消隐藏' : '隐藏';
  return `<button type="button" class="${cls}" data-appid="${escapeHtml(id)}" data-platform="steam" aria-label="${label}" title="${label}">${active ? '🙈' : '👁'}</button>`;
}

const STEAM_ICON_SVG = `<svg class="btn-steam-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 2a9.99 9.99 0 0 0-9.91 8.68l5.66 2.34a2.89 2.89 0 0 1 1.64-.51c.08 0 .16.01.24.02l2.53-3.67V9.9c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4h-.09l-3.67 2.53c.01.08.02.16.02.24 0 .58-.18 1.12-.51 1.64l2.34 5.66A9.99 9.99 0 1 0 12 2zm-1.18 14.58l-1.47-3.55 2.12-1.54.9 2.17-1.55 2.92zm7.06-2.65a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>`;

function storeButtonHtml(game) {
  const url = gameStoreUrl(game);
  return `<button type="button" class="btn-platform-store btn-platform-store-steam" data-store-url="${url}" aria-label="在 Steam 商店查看" title="Steam 商店">${STEAM_ICON_SVG}</button>`;
}

const PLAY_ICON_SVG = '<svg class="btn-play-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';
const DOWNLOAD_ICON_SVG = '<svg class="btn-download-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zm-14 9v2h14v-2H5z"/></svg>';

function launchButtonHtml(game) {
  if (!game.installed) return '';
  return `<button type="button" class="btn-game-launch" data-appid="${escapeHtml(game.appid)}" data-platform="steam" title="启动游戏" aria-label="启动游戏">${PLAY_ICON_SVG}</button>`;
}

function downloadButtonHtml(game) {
  if (game.installed) return '';
  return `<button type="button" class="btn-game-download" data-appid="${escapeHtml(game.appid)}" data-platform="steam" title="下载游戏" aria-label="下载游戏">${DOWNLOAD_ICON_SVG}</button>`;
}

function centerActionButtonHtml(game) {
  return game.installed ? launchButtonHtml(game) : downloadButtonHtml(game);
}

function gameCoverActionsHtml(game) {
  const center = centerActionButtonHtml(game);
  const title = escapeHtml(gameTitle(game));
  return `<div class="game-cover-actions">
    <div class="game-cover-actions-corner">
      ${gameEditButtonHtml(game)}${hiddenButtonHtml(game.appid)}${favoriteButtonHtml(game.appid)}
    </div>
    <div class="game-cover-actions-store-tl">${storeButtonHtml(game)}</div>
    <div class="game-cover-actions-primary">
      <div class="game-cover-actions-icon">${center}</div>
      <div class="game-cover-actions-title-wrap">
        <span class="game-cover-actions-title">${title}</span>
      </div>
    </div>
  </div>`;
}

function blurGameCardFocus() {
  const active = document.activeElement;
  if (active instanceof HTMLElement && active.closest('.game-card')) {
    active.blur();
  }
}

function gameNameForAction(appid, platform) {
  const game = findGameForCardAction(appid, platform);
  if (game) return gameTitle(game);
  const card = document.querySelector(
    `.game-card[data-appid="${CSS.escape(String(appid))}"][data-platform="${platform}"]`,
  );
  const fromDom = card?.querySelector('.game-name')?.textContent?.trim();
  return fromDom || `App ${appid}`;
}

let gameActionConfirmResolve = null;

function finishGameActionConfirm(confirmed) {
  const resolve = gameActionConfirmResolve;
  if (!resolve) return;
  gameActionConfirmResolve = null;
  els.gameActionConfirmDialog?.close();
  resolve(confirmed);
}

function showGameActionConfirm({ title, message, confirmText = '确定', confirmClass = 'btn-primary' }) {
  return new Promise((resolve) => {
    gameActionConfirmResolve = resolve;
    els.gameActionConfirmTitle.textContent = title;
    els.gameActionConfirmMessage.textContent = message;
    els.btnConfirmGameAction.textContent = confirmText;
    els.btnConfirmGameAction.className = `btn ${confirmClass}`;
    els.gameActionConfirmDialog.showModal();
    els.btnConfirmGameAction.focus();
  });
}

function confirmLaunchGame(appid, platform = 'steam') {
  const name = gameNameForAction(appid, platform);
  return showGameActionConfirm({
    title: '启动游戏',
    message: `确定启动「${name}」？`,
    confirmText: '启动',
    confirmClass: 'btn-confirm-launch',
  });
}

function confirmDownloadGame(appid, platform = 'steam') {
  const name = gameNameForAction(appid, platform);
  return showGameActionConfirm({
    title: '安装游戏',
    message: `确定安装「${name}」？将打开 Steam 客户端。`,
    confirmText: '安装',
    confirmClass: 'btn-confirm-download',
  });
}

async function launchGame(appid, platform = 'steam') {
  const res = await fetch(`/api/games/${platform}/${encodeURIComponent(appid)}/launch`, {
    method: 'POST',
    headers: buildHeaders(),
  });
  const data = await readApiJson(res);
  if (!res.ok) throw new Error(data.error || '启动失败');
  showToast('正在启动游戏');
}

async function downloadGame(appid, platform = 'steam') {
  const res = await fetch(`/api/games/${platform}/${encodeURIComponent(appid)}/install`, {
    method: 'POST',
    headers: buildHeaders(),
  });
  const data = await readApiJson(res);
  if (!res.ok) {
    const storeUrl = String(data.storeUrl || '').trim();
    if (storeUrl) {
      window.open(storeUrl, '_blank', 'noopener');
      throw new Error(`${data.error || '无法打开 Steam'}，已在浏览器打开商店页`);
    }
    throw new Error(data.error || '无法打开 Steam 下载页');
  }
  showToast('正在打开 Steam 下载…');
}

function gameEditButtonHtml(game) {
  const locked = game.lock_from_refresh ? ' is-locked' : '';
  return `<button type="button" class="btn-game-edit${locked}" data-appid="${escapeHtml(game.appid)}" data-platform="steam" title="编辑资料" aria-label="编辑资料">✎</button>`;
}

function listToInputValue(list) {
  return Array.isArray(list) ? list.filter(Boolean).join(', ') : '';
}

function revokeGameEditPreviewObjectUrl() {
  if (!gameEditPreviewObjectUrl) return;
  URL.revokeObjectURL(gameEditPreviewObjectUrl);
  gameEditPreviewObjectUrl = '';
}

function renderGameEditPreview(src) {
  if (!src) {
    els.gameEditPreview.innerHTML = '<div class="empty-state">暂无封面</div>';
    return;
  }
  els.gameEditPreview.innerHTML = `<img src="${escapeHtml(src)}" alt="封面预览">`;
  const img = els.gameEditPreview.querySelector('img');
  if (!img) return;
  img.addEventListener('error', () => {
    els.gameEditPreview.innerHTML = '<div class="empty-state">封面无法加载</div>';
  }, { once: true });
}

function setGameEditPreview(url, bustCache = false) {
  revokeGameEditPreviewObjectUrl();
  const src = url && bustCache
    ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`
    : url;
  renderGameEditPreview(src);
}

function setGameEditPreviewFromFile(file) {
  revokeGameEditPreviewObjectUrl();
  if (!file) {
    renderGameEditPreview('');
    return;
  }
  gameEditPreviewObjectUrl = URL.createObjectURL(file);
  renderGameEditPreview(gameEditPreviewObjectUrl);
}

function updateGameEditCoverPreview() {
  const file = els.inputCoverFile.files?.[0];
  if (file) {
    setGameEditPreviewFromFile(file);
    return;
  }
  const url = els.inputCoverUrl.value.trim();
  if (url) {
    setGameEditPreview(url);
    return;
  }
  renderGameEditPreview('');
}

function applyMetaToGameEditForm(meta = {}, options = {}) {
  const { onlyEmpty = false } = options;
  const setValue = (input, value) => {
    if (!input) return;
    if (onlyEmpty && input.value.trim()) return;
    input.value = value || '';
  };
  setValue(els.inputNameCn, meta.name_cn);
  setValue(els.inputNameEn, meta.name_en);
  setValue(els.inputGenres, listToInputValue(meta.genres));
  setValue(els.inputTags, listToInputValue(meta.tags));
  setValue(els.inputAliases, listToInputValue(meta.aliases));
}

async function refreshGameEditMeta() {
  if (!gameEditTarget) return;
  const { appid, platform } = gameEditTarget;
  els.btnRefreshGameMeta.disabled = true;
  els.btnRefreshGameMeta.textContent = '刷新中...';
  try {
    const res = await fetch(
      `/api/games/${platform}/${encodeURIComponent(appid)}/refresh-meta`,
      { method: 'POST', headers: { ...buildHeaders(), 'Content-Type': 'application/json' }, body: '{}' },
    );
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || '刷新失败');
    if (data.meta) applyMetaToGameEditForm(data.meta);
    if (data.cover_url) {
      els.inputCoverUrl.value = data.cover_url.startsWith('http') ? data.cover_url : els.inputCoverUrl.value;
      setGameEditPreview(data.cover_url);
    }
    showToast(platform === 'steam' ? '已从 Steam 拉取最新资料' : '已从平台拉取最新资料');
  } catch (err) {
    showToast(err.message, true);
  } finally {
    els.btnRefreshGameMeta.disabled = false;
    els.btnRefreshGameMeta.textContent = '从平台刷新资料';
  }
}

async function refetchGameEditCover() {
  if (!gameEditTarget) return;
  const { appid, platform } = gameEditTarget;
  els.btnRefetchCover.disabled = true;
  els.btnRefetchCover.textContent = '获取中...';
  try {
    const res = await fetch(
      `/api/games/${platform}/${encodeURIComponent(appid)}/cover/refetch`,
      {
        method: 'POST',
        headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ localize: !!els.inputCoverLocalize?.checked }),
      },
    );
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || '获取封面失败');
    const coverUrl = data.resolved_cover_url || data.cover_url || '';
    if (coverUrl.startsWith('http')) els.inputCoverUrl.value = coverUrl;
    else els.inputCoverUrl.value = '';
    els.inputCoverFile.value = '';
    setGameEditPreview(coverUrl, true);
    applyGameEditToCard(appid, platform, { cover_url: coverUrl });
    const pageIdx = currentPageGames.findIndex(
      (item) => String(item.appid) === String(appid) && gamePlatform(item) === platform,
    );
    if (pageIdx >= 0) {
      currentPageGames[pageIdx] = { ...currentPageGames[pageIdx], cover_url: coverUrl, cover_custom: true };
    }
    showToast(data.cover_local ? '已替换为平台封面并保存到本地' : '已替换为平台封面');
  } catch (err) {
    showToast(err.message, true);
  } finally {
    els.btnRefetchCover.disabled = false;
    els.btnRefetchCover.textContent = '重新获取封面';
  }
}

function resolveGameEditPreviewUrl(game) {
  return gameCoverImage(game) || gameCoverFallback(game) || '';
}

async function openGameEditDialog(game) {
  const platform = gamePlatform(game);
  const targetAppid = String(game.appid);
  gameEditTarget = {
    appid: game.appid,
    platform,
    source_name: game.source_name || game.name || '',
    source_name_cn: game.source_name_cn || game.name_cn || '',
  };

  setGameEditPreview(resolveGameEditPreviewUrl(game), true);

  const isSteam = platform === 'steam';
  els.gameEditGenresWrap?.classList.toggle('hidden', !isSteam);
  els.gameEditTagsWrap?.classList.toggle('hidden', !isSteam);

  els.gameEditSourceInfo.textContent = `平台原名：${gameEditTarget.source_name_cn || gameEditTarget.source_name || '—'} · ${platform}`;
  els.inputDisplayName.value = game.display_name || '';
  els.inputNameCn.value = game.custom_name_cn || game.name_cn || '';
  els.inputNameEn.value = game.custom_name_en || gameSourceName(game) || game.name || '';
  els.inputGenres.value = listToInputValue(game.genres);
  els.inputTags.value = listToInputValue(game.tags);
  els.inputAliases.value = listToInputValue(game.aliases);
  els.inputCoverUrl.value = game.cover_url?.startsWith('http') ? game.cover_url : '';
  els.inputCoverFile.value = '';
  els.inputCoverLookup.value = resolveCoverLookupQuery(game);
  els.coverLookupResults.innerHTML = '';
  els.inputCoverLocalize.checked = true;
  els.inputLockFromRefresh.checked = !!game.lock_from_refresh;

  try {
    const res = await fetch(
      `/api/games/${platform}/${encodeURIComponent(game.appid)}/override`,
      { headers: buildHeaders() },
    );
    const data = await readApiJson(res);
    if (
      gameEditTarget
      && String(gameEditTarget.appid) === targetAppid
      && gameEditTarget.platform === platform
      && res.ok
      && data.override
    ) {
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
      if (o.resolved_cover_url) setGameEditPreview(o.resolved_cover_url, true);
      else setGameEditPreview(resolveGameEditPreviewUrl(game), true);
    }
  } catch {
    /* ignore */
  }

  els.gameEditDialog?.showModal();
}

function closeGameEditDialog() {
  els.gameEditDialog?.close();
  gameEditTarget = null;
  revokeGameEditPreviewObjectUrl();
  els.gameEditPreview.innerHTML = '<div class="empty-state">暂无封面</div>';
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

function withCacheBust(url) {
  if (!url) return url;
  return `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
}

function applyGameEditToCard(appid, platform, patch = {}) {
  const selector = `.game-card[data-appid="${CSS.escape(String(appid))}"][data-platform="${platform}"]`;
  const card = document.querySelector(selector);
  if (!card) return false;

  if (patch.cover_url) {
    const img = card.querySelector('img.game-cover');
    if (img) {
      img.src = withCacheBust(patch.cover_url);
      img.classList.remove('is-hidden');
      img.dataset.fallbackTried = '';
      const wrap = img.closest('.game-cover-wrap');
      wrap?.querySelector('.game-cover-placeholder.is-fallback')?.classList.add('hidden');
    }
  }

  const titleEl = card.querySelector('.game-name');
  if (titleEl && patch.title !== undefined) titleEl.textContent = patch.title;

  const subtitleEl = card.querySelector('.game-subtitle');
  if (patch.subtitle !== undefined) {
    if (patch.subtitle) {
      if (subtitleEl) subtitleEl.textContent = patch.subtitle;
      else if (titleEl) {
        const sub = document.createElement('div');
        sub.className = 'game-subtitle';
        sub.textContent = patch.subtitle;
        titleEl.insertAdjacentElement('afterend', sub);
      }
    } else if (subtitleEl) {
      subtitleEl.remove();
    }
  }

  const genreEl = card.querySelector('.game-genres');
  if (patch.genres !== undefined) {
    const genreText = gameCardGenreText({ genres: patch.genres });
    if (genreEl) {
      genreEl.textContent = genreText;
      genreEl.classList.toggle('hidden', !genreText);
    } else if (genreText && titleEl) {
      const el = document.createElement('div');
      el.className = 'game-genres';
      el.textContent = genreText;
      titleEl.insertAdjacentElement('afterend', el);
    }
  }

  const tagEl = card.querySelector('.game-tags');
  if (patch.tags !== undefined) {
    const tagText = gameCardTagText({ tags: patch.tags });
    if (tagEl) {
      tagEl.textContent = tagText;
      tagEl.classList.toggle('hidden', !tagText);
    } else if (tagText) {
      const anchor = card.querySelector('.game-genres') || titleEl;
      if (anchor) {
        const el = document.createElement('div');
        el.className = 'game-tags';
        el.textContent = tagText;
        anchor.insertAdjacentElement('afterend', el);
      }
    }
  }

  const editBtn = card.querySelector('.btn-game-edit');
  if (editBtn) editBtn.classList.toggle('is-locked', !!patch.lock_from_refresh);
  return true;
}

async function saveGameEditDialog() {
  if (!gameEditTarget) return;
  const { appid, platform } = gameEditTarget;
  const file = els.inputCoverFile.files?.[0];

  els.btnSaveGameEdit.disabled = true;
  els.btnSaveGameEdit.textContent = '保存中...';
  try {
    let uploadedCoverUrl = '';
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
      uploadedCoverUrl = uploadData.cover_url || '';
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

    const coverUrl = uploadedCoverUrl || data.override?.resolved_cover_url || '';

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
      tags: body.tags.split(/[,，;；\n]+/).map((s) => s.trim()).filter(Boolean),
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
      genres: merged.genres,
      tags: merged.tags,
      lock_from_refresh: merged.lock_from_refresh,
    });
    closeGameEditDialog();
    await fetchLibraryPage(null, libraryPagination.page, { quiet: true });
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

function syncHiddenButton(appid, hidden) {
  const id = normalizePrefAppId(appid);
  document.querySelectorAll(`.btn-hidden[data-appid="${CSS.escape(id)}"][data-platform="steam"]`).forEach((btn) => {
    btn.classList.toggle('is-hidden', hidden);
    btn.textContent = hidden ? '🙈' : '👁';
    btn.title = hidden ? '取消隐藏' : '隐藏';
    btn.setAttribute('aria-label', hidden ? '取消隐藏' : '隐藏');
  });
}

async function toggleHidden(appid) {
  if (!activeUserId) {
    showToast('请先连接 Steam 账号', true);
    return;
  }
  const res = await fetch('/api/hidden/toggle', {
    method: 'POST',
    headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ appid, platform: 'steam' }),
  });
  const data = await readApiJson(res);
  if (!res.ok) throw new Error(data.error || '操作失败');

  applyPlatformPrefSets(hiddenByPlatform, data.platforms);
  syncHiddenButton(appid, data.hidden);
  await fetchLibraryPage(false, libraryPagination.page, { quiet: true });
}

function syncFavoriteButton(appid, favorited) {
  const id = normalizePrefAppId(appid);
  document.querySelectorAll(`.btn-favorite[data-appid="${CSS.escape(id)}"][data-platform="steam"]`).forEach((btn) => {
    btn.classList.toggle('is-favorite', favorited);
    btn.textContent = favorited ? '★' : '☆';
    btn.title = favorited ? '取消收藏' : '收藏';
    btn.setAttribute('aria-label', favorited ? '取消收藏' : '收藏');
  });
}

async function toggleFavorite(appid) {
  if (!activeUserId) {
    showToast('请先连接 Steam 账号', true);
    return;
  }
  const res = await fetch('/api/favorites/toggle', {
    method: 'POST',
    headers: { ...buildHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ appid, platform: 'steam' }),
  });
  const data = await readApiJson(res);
  if (!res.ok) throw new Error(data.error || '操作失败');

  applyPlatformPrefSets(favoriteByPlatform, data.platforms);
  syncFavoriteButton(appid, data.favorited);
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

function setUserMenuTriggerAvatar(el, user, isAddOnly) {
  if (!el) return;
  el.replaceChildren();
  if (isAddOnly) {
    el.className = 'user-menu-avatar user-menu-avatar-add';
    el.textContent = '+';
    return;
  }
  const avatar = (user?.avatar || '').trim();
  if (avatar) {
    el.className = 'user-menu-avatar';
    const img = document.createElement('img');
    img.src = avatar;
    img.alt = '';
    img.draggable = false;
    el.appendChild(img);
    return;
  }
  el.className = 'user-menu-avatar user-menu-avatar-default';
}

function updateUserMenuTrigger() {
  const user = getActiveUser();
  const isAddOnly = !user;
  els.btnUserMenu?.classList.toggle('is-add-only', isAddOnly);
  setUserMenuTriggerAvatar(els.userMenuAvatar, user, isAddOnly);
  if (els.userMenuName) {
    if (isAddOnly) {
      els.userMenuName.textContent = '';
      els.userMenuName.classList.add('hidden');
    } else {
      els.userMenuName.textContent = userCardLabel(user);
      els.userMenuName.classList.remove('hidden');
    }
  }
}

function refreshUserUi() {
  updateUserMenuTrigger();
  updateModeUi();
}

async function refreshMissingUserProfiles() {
  const user = getActiveUser();
  if (!user?.steamId || (user.personaName && user.avatar)) return;

  try {
    const res = await fetch('/api/users/refresh-profile', {
      method: 'POST',
      headers: buildHeaders(),
    });
    const data = await readApiJson(res);
    if (!res.ok) return;
    users = [data];
    activeUserId = data.id;
    debugLog('用户资料已补全', { userId: user.id, name: data.personaName || data.name });
    refreshUserUi();
  } catch {
    /* ignore */
  }
}

async function loadUsers() {
  const res = await fetch('/api/users');
  const data = await readApiJson(res);
  users = data.users || [];
  activeUserId = data.activeUserId || users[0]?.id || '';
  debugLog('用户已加载', { activeUserId });
  refreshUserUi();
  await refreshMissingUserProfiles();
}

function buildRefreshStages(parts) {
  const stages = [];
  if (parts.library) {
    stages.push({ id: 'library', label: '拉取 Steam 游戏库' });
  }
  if (parts.meta || parts.metaAll) {
    stages.push({
      id: 'meta',
      label: parts.metaAll ? '全部更新分类 / 标签' : '获取分类标签',
    });
  }
  if (parts.covers || parts.coversAll) {
    stages.push({
      id: 'covers',
      label: parts.coversAll ? '全部刷新封面' : '补全封面',
    });
  }
  if (parts.localizeCovers) stages.push({ id: 'localize', label: '本地化封面' });
  return stages;
}

function stageIndexOf(stages, id) {
  const idx = stages.findIndex((item) => item.id === id);
  return idx >= 0 ? idx : 0;
}

function formatProgressCountText(current, total, progressKind = 'count') {
  if (total <= 0) return '';
  if (progressKind === 'step') return ` · ${current}/${total}`;
  return ` · ${current}/${total}`;
}

function updateTopProgress(options = {}) {
  const {
    label = '处理中',
    current = 0,
    total = 0,
    failed = null,
    indeterminate = false,
    stageIndex = 0,
    stageTotal = 1,
    progressKind = 'count',
  } = options;
  const track = els.loadProgress?.querySelector('.load-progress-track');

  els.loadProgress?.classList.remove('hidden');
  els.loadProgressFill?.classList.toggle('is-indeterminate', indeterminate);
  track?.classList.toggle('is-indeterminate', indeterminate);

  const stageHint = stageTotal > 1 ? `（${stageIndex + 1}/${stageTotal}）` : '';
  const showCoverStats = failed !== null && failed !== undefined;

  if (indeterminate) {
    els.loadProgressFill.style.width = '';
    const statsText = showCoverStats
      ? ` · ${current}/${total} · 失败 ${failed}`
      : formatProgressCountText(current, total, progressKind);
    els.loadProgressText.textContent = `${label}${stageHint}${statsText}`;
    return;
  }

  let pct = 0;
  if (stageTotal > 0) {
    const slice = 100 / stageTotal;
    const inner = total > 0 ? (current / total) * slice : slice * 0.5;
    pct = stageIndex * slice + inner;
  } else if (total > 0) {
    pct = (current / total) * 100;
  }
  els.loadProgressFill.style.width = `${Math.min(100, Math.round(pct))}%`;

  if (showCoverStats) {
    els.loadProgressText.textContent = `${label}${stageHint} · ${current}/${total} · 失败 ${failed}`;
    return;
  }

  const countText = formatProgressCountText(current, total, progressKind);
  els.loadProgressText.textContent = `${label}${stageHint}${countText}`;
}

function summarizeLocalizedCovers(localizedCovers, cumulative = {}) {
  const total = Number(cumulative.total ?? localizedCovers?.pending ?? 0) || 0;
  const done = Number(cumulative.done ?? localizedCovers?.done ?? 0) || 0;
  const failed = Number(cumulative.failed ?? localizedCovers?.failed ?? 0) || 0;
  const processed = done + failed;
  return { total, failed, processed };
}

function updateLocalizeCoverProgress(localizedCovers, refreshStages, cumulative = {}) {
  const stats = summarizeLocalizedCovers(localizedCovers, cumulative);
  const locIdx = stageIndexOf(refreshStages, 'localize');
  updateTopProgress({
    label: '本地化封面',
    current: stats.processed,
    total: stats.total,
    failed: stats.failed,
    stageIndex: refreshStages.length ? locIdx : 0,
    stageTotal: refreshStages.length || 1,
    indeterminate: stats.total === 0 && stats.processed === 0,
  });
}

function formatLocalizeCoverToast(stats) {
  return `封面本地化 · 已处理 ${stats.processed} · 全部 ${stats.total} · 失败 ${stats.failed}`;
}

function hideLoadProgressInternal() {
  const track = els.loadProgress?.querySelector('.load-progress-track');
  els.loadProgress?.classList.add('hidden');
  els.loadProgressFill?.classList.remove('is-indeterminate');
  track?.classList.remove('is-indeterminate');
  els.loadProgressFill.style.width = '0%';
  els.loadProgressText.textContent = '';
}

function hideLoadProgress() {
  if (progressHoldCount > 0) return;
  hideLoadProgressInternal();
}

function showLoadProgress(current, total, label = '正在补全中文信息', progressOptions = {}) {
  updateTopProgress({
    label,
    current,
    total,
    stageIndex: progressOptions.stageIndex ?? 0,
    stageTotal: progressOptions.stageTotal ?? 1,
  });
}

let activeLocalizeRefreshOpts = { retryFailed: false, overwriteLocal: false };

function getCoverLocalizeApiUrl(opts = activeLocalizeRefreshOpts) {
  const params = new URLSearchParams();
  params.set('platform', 'steam');
  const user = getActiveUser();
  const steamId = (user?.steamId || '').trim();
  if (steamId) params.set('steamId', steamId);
  params.set('includeFamily', 'true');
  if (opts.retryFailed) params.set('localizeRetryFailed', 'true');
  if (opts.overwriteLocal) params.set('localizeIncludeLocal', 'true');
  return `/api/covers/localize?${params.toString()}`;
}

async function fetchCoverLocalizeBatch() {
  const headers = buildHeaders();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const res = await fetch(getCoverLocalizeApiUrl(), {
      method: 'POST',
      headers,
      signal: controller.signal,
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || '封面本地化失败');
    return data;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('封面本地化超时，请稍后重试');
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function reloadLibraryPageAfterLocalize(page, headers) {
  const res = await fetch(getLibraryApiUrl({
    library: false,
    meta: false,
    covers: false,
    localizeCovers: false,
  }, page), headers ? { headers } : undefined);
  const data = await readApiJson(res);
  if (!res.ok) throw new Error(data.error || '刷新游戏列表失败');
  applyLibraryResponse(data);
  return data;
}

async function runCoverLocalizationBatches(page, refreshStages, firstData, options = {}) {
  let data = firstData;
  if (!data?.localizedCovers) return data;

  const totalPending = data.localizedCovers.pending || 0;
  let cumulativeDone = data.localizedCovers.done || 0;
  let cumulativeFailed = data.localizedCovers.failed || 0;
  const headers = buildHeaders();
  const maxIterations = Math.max(1, Math.ceil(totalPending / 80) + 3);
  let iterations = 0;
  let lastRemaining = Infinity;

  while (data.localizedCovers.remaining > 0 && iterations < maxIterations) {
    iterations += 1;
    if (!options.suppressProgress) {
      updateLocalizeCoverProgress(data.localizedCovers, refreshStages, {
        total: totalPending,
        done: cumulativeDone,
        failed: cumulativeFailed,
      });
    }

    const batchData = await fetchCoverLocalizeBatch();
    if (!batchData?.localizedCovers) break;
    data = { ...data, localizedCovers: batchData.localizedCovers };

    const batchDone = batchData.localizedCovers.done || 0;
    const batchFailed = batchData.localizedCovers.failed || 0;
    if (batchDone === 0 && batchFailed === 0) break;

    cumulativeDone += batchDone;
    cumulativeFailed += batchFailed;

    if (batchData.localizedCovers.remaining >= lastRemaining) break;
    lastRemaining = batchData.localizedCovers.remaining;
  }

  if (data?.localizedCovers) {
    data.localizedCovers = {
      ...data.localizedCovers,
      pending: totalPending,
      done: cumulativeDone,
      failed: cumulativeFailed,
      remaining: data.localizedCovers.remaining || 0,
    };
  }

  try {
    const reloaded = await reloadLibraryPageAfterLocalize(page, headers);
    if (reloaded) {
      data = { ...reloaded, localizedCovers: data.localizedCovers };
    }
  } catch (err) {
    debugLog('本地化后刷新列表失败', { message: err.message });
  }

  if (!options.suppressProgress && data?.localizedCovers) {
    updateLocalizeCoverProgress(data.localizedCovers, refreshStages, {
      total: totalPending,
      done: cumulativeDone,
      failed: cumulativeFailed,
    });
  }

  return data;
}

function applyGameCardPatches(updates, platform = 'steam') {
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
        wrap.insertBefore(img, wrap.firstChild);
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
      const idx = currentPageGames.findIndex(
        (game) => String(game.appid) === appid && gamePlatform(game) === (item.platform || platform),
      );
      if (idx >= 0) {
        currentPageGames[idx] = {
          ...currentPageGames[idx],
          name: item.name || currentPageGames[idx].name,
          name_cn: item.name_cn || currentPageGames[idx].name_cn,
          store_url: item.store_url || currentPageGames[idx].store_url,
        };
      }
      if (item.store_url) {
        card.dataset.sourceName = item.name || item.name_cn || card.dataset.sourceName || '';
      }
    }

    if (item.genres?.length) {
      const genreText = gameCardGenreText(item);
      let genreEl = card.querySelector('.game-genres');
      if (genreText) {
        if (!genreEl) {
          genreEl = document.createElement('div');
          genreEl.className = 'game-genres';
          card.querySelector('.game-name')?.insertAdjacentElement('afterend', genreEl);
        }
        genreEl.textContent = genreText;
        genreEl.classList.remove('hidden');
      } else if (genreEl) {
        genreEl.remove();
      }
    }

    if (item.tags?.length) {
      const tagText = gameCardTagText(item);
      let tagEl = card.querySelector('.game-tags');
      if (tagText) {
        if (!tagEl) {
          tagEl = document.createElement('div');
          tagEl.className = 'game-tags';
          const anchor = card.querySelector('.game-genres') || card.querySelector('.game-name');
          anchor?.insertAdjacentElement('afterend', tagEl);
        }
        tagEl.textContent = tagText;
        tagEl.classList.remove('hidden');
      } else if (tagEl) {
        tagEl.remove();
      }
    }

    if (item.cover_url) {
      const idx = currentPageGames.findIndex(
        (game) => String(game.appid) === appid && gamePlatform(game) === (item.platform || platform),
      );
      if (idx >= 0) {
        currentPageGames[idx] = {
          ...currentPageGames[idx],
          cover_url: item.cover_url,
          img_icon_url: item.cover_url,
        };
      }
    }

    setGameCardUpdating(appid, item.platform || platform, false);
  }
}

function applyMetaUpdates(updates) {
  if (!updates?.length) return;
  for (const item of updates) {
    const appid = String(item.appid || '');
    if (!appid) continue;
    const idx = currentPageGames.findIndex(
      (game) => String(game.appid) === appid && gamePlatform(game) === 'steam',
    );
    if (idx >= 0) {
      currentPageGames[idx] = {
        ...currentPageGames[idx],
        name_cn: item.name_cn || currentPageGames[idx].name_cn,
        genres: item.genres?.length ? item.genres : currentPageGames[idx].genres,
        tags: item.tags?.length ? item.tags : currentPageGames[idx].tags,
        aliases: item.aliases?.length ? item.aliases : currentPageGames[idx].aliases,
        input_methods: item.input_methods?.length ? item.input_methods : currentPageGames[idx].input_methods,
      };
    }
    applyGameEditToCard(appid, 'steam', {
      genres: item.genres || [],
      tags: item.tags || [],
    });
  }
  scheduleFilterOptionsReload();
}

let filterOptionsReloadTimer = null;
function scheduleFilterOptionsReload() {
  clearTimeout(filterOptionsReloadTimer);
  filterOptionsReloadTimer = setTimeout(() => {
    fetchLibraryPage(false, libraryPagination.page, { quiet: true, suppressProgress: true, nested: true }).catch(() => {});
  }, 2000);
}

async function refetchCoversStream(options = {}) {
  const forceAll = !!options.forceAll;
  abortEnrichStream();
  enrichAbortController = new AbortController();
  const { signal } = enrichAbortController;
  const platform = 'steam';
  const progressOptions = {
    stageIndex: options.stageIndex ?? 0,
    stageTotal: options.stageTotal ?? 1,
  };
  const progressLabel = forceAll ? '全部刷新封面' : '补全封面';

  const user = getActiveUser();
  const steamId = (user?.steamId || '').trim();
  const params = new URLSearchParams();
  if (steamId) params.set('steamId', steamId);
  params.set('includeFamily', 'true');
  if (forceAll) params.set('forceAll', '1');
  if (options.includeLocal) params.set('includeLocal', 'true');
  const url = `/api/games/covers/refetch-stream?${params.toString()}`;

  markCurrentPageCoverUpdates(platform, forceAll ? () => true : (game) => !game.cover_url);

  try {
    const res = await fetch(url, { headers: buildHeaders(), signal });
    if (!res.ok) {
      const data = await readApiJson(res);
      throw new Error(data.error || '封面刷新失败');
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
        if (payload.updates?.length) applyGameCardPatches(payload.updates, platform);
        if (payload.total > 0) {
          showLoadProgress(
            payload.current || 0,
            payload.total,
            progressLabel,
            { ...progressOptions, failed: payload.failed ?? null },
          );
        }
      }
    }
    await fetchLibraryPage(null, libraryPagination.page, { quiet: true, suppressProgress: true, nested: true, preserveProgress: true });
  } catch (err) {
    if (err.name !== 'AbortError') debugLog('刷新封面失败', { message: err.message });
  } finally {
    clearPlatformUpdatingCards(platform);
    if (enrichAbortController?.signal === signal) enrichAbortController = null;
    if (!options.keepProgress) releaseTopProgress();
  }
}

function abortEnrichStream() {
  if (enrichAbortController) {
    enrichAbortController.abort();
    enrichAbortController = null;
  }
}

async function enrichGamesMeta(steamId, options = {}) {
  abortEnrichStream();
  enrichAbortController = new AbortController();
  const { signal } = enrichAbortController;
  const silent = !!options.silent;
  const progressOptions = {
    stageIndex: options.stageIndex ?? 0,
    stageTotal: options.stageTotal ?? 1,
  };

  const forceAll = !!options.forceAll;
  const progressLabel = forceAll ? '全部更新分类 / 标签' : '获取分类标签';
  const url = `/api/games/enrich-stream?steamId=${encodeURIComponent(steamId)}&includeFamily=true${forceAll ? '&forceAll=true' : ''}`;
  debugLog('开始获取游戏分类标签', { steamId, forceAll });

  metaEnriching = true;
  updateMetaContinueUi();
  let streamCompleted = false;
  let interrupted = false;

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
        if (!silent && payload.total > 0) {
          showLoadProgress(payload.current || 0, payload.total, progressLabel, progressOptions);
        }
        if (payload.total > 0 && payload.current !== undefined) {
          libraryMeta.metaPending = Math.max(0, payload.total - payload.current);
          updateMetaContinueUi();
        }
        if (payload.complete) {
          streamCompleted = true;
          debugLog('游戏分类标签获取完成', { total: payload.total, forceAll });
        }
      }
    }
    if (!streamCompleted && !signal.aborted) interrupted = true;
  } catch (err) {
    if (err.name === 'AbortError') {
      interrupted = true;
    } else {
      debugLog('补全中文信息失败', { message: err.message });
    }
  } finally {
    metaEnriching = false;
    if (enrichAbortController?.signal === signal) {
      enrichAbortController = null;
    }
    if (!options.keepProgress) releaseTopProgress();
    await refreshMetaPendingCount();
    if (interrupted && libraryMeta.metaPending > 0 && !silent && !gamesLoading) {
      showToast(`标签补全已暂停，还有 ${libraryMeta.metaPending} 款未完成，可点「继续补全」`);
    } else if (streamCompleted && !silent && !options.keepProgress && libraryMeta.metaPending === 0) {
      showToast('分类标签补全完成');
    } else if (streamCompleted && !silent && !options.keepProgress && libraryMeta.metaPending > 0) {
      showToast(`本轮已处理，还有 ${libraryMeta.metaPending} 款未能获取，可点「继续补全」`);
    }
    if (streamCompleted && options.reloadAfter) {
      fetchLibraryPage(false, libraryPagination.page, { quiet: true, preserveProgress: true, nested: true })
        .catch((err) => debugLog('补全后刷新列表失败', { message: err.message }));
    }
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
  els.tokenPreviewHint.textContent = tokenDialogMode === 'add'
    ? 'Token 有效，保存后将连接该账号'
    : 'Token 有效，保存后将更新账号';
  els.tokenPreviewHint.classList.remove('warn');
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
  els.tokenDialogTitle.textContent = mode === 'add' ? '连接 Steam' : '更新 Token';
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
  if (isAdd && getActiveUser()) {
    showToast('已配置 Steam 账号，请使用更新 Token', true);
    return;
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

  debugLog(isAdd ? '连接 Steam' : '更新 Token', { mode: tokenDialogMode, hasApiKey: !!apiKey });
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
    showToast(profileName ? `${isAdd ? 'Steam 已连接' : 'Token 已更新'}：${profileName}` : (isAdd ? 'Steam 已连接' : 'Token 已更新'));

    showGameGridLoading('正在加载游戏库...');
    els.statsBar.textContent = '正在加载游戏库...';
    await fetchSteamGames(false, { quiet: false, autoFetchIfNoCache: true });
  } finally {
    els.btnSaveToken.disabled = false;
    els.btnSaveToken.textContent = '保存';
  }
}

async function refreshAuthStatus() {
  try {
    const res = await fetch('/api/auth/status', { headers: buildHeaders() });
    const status = await readApiJson(res);
    let title = 'Token 未配置';
    let isOk = false;

    if (status.valid) {
      title = 'Token 有效';
      isOk = true;
    } else if (status.hasToken) {
      title = 'Token 已过期';
    }

    if (els.tokenStatusDot) {
      els.tokenStatusDot.classList.toggle('ok', isOk);
      els.tokenStatusDot.classList.toggle('warn', !isOk);
    }
    if (els.btnTokenStatus) {
      els.btnTokenStatus.title = title;
    }
    return isOk;
  } catch {
    if (els.tokenStatusDot) {
      els.tokenStatusDot.classList.remove('ok');
      els.tokenStatusDot.classList.add('warn');
    }
    if (els.btnTokenStatus) {
      els.btnTokenStatus.title = 'Token 状态未知';
    }
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
  currentRandomGame = game;
  els.randomBody.innerHTML = gameCardHtml(game, { random: true });
  finalizeCoverImage(els.randomBody.querySelector('img.game-cover'));
  els.randomDialog.showModal();
}

async function openHiddenImportDialog() {
  if (!activeUserId) {
    showToast('请先连接 Steam 账号', true);
    return;
  }
  els.hiddenImportHint.textContent = '正在检测本机 Steam 路径...';
  els.inputSteamPath.value = els.inputSteamPath.dataset.savedPath || appSettings.steamPath || '';
  els.hiddenImportDialog.showModal();
  try {
    await loadAppSettings().catch(() => appSettings);
    if (!els.inputSteamPath.value && appSettings.steamPath) {
      els.inputSteamPath.value = appSettings.steamPath;
    }
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

async function openCollectionsImportDialog() {
  if (!activeUserId) {
    showToast('请先连接 Steam 账号', true);
    return;
  }
  els.collectionsImportHint.textContent = '正在检测本机 Steam 路径...';
  els.inputCollectionsSteamPath.value = els.inputCollectionsSteamPath.dataset.savedPath || appSettings.steamPath || '';
  els.collectionsImportDialog.showModal();
  try {
    await loadAppSettings().catch(() => appSettings);
    if (!els.inputCollectionsSteamPath.value && appSettings.steamPath) {
      els.inputCollectionsSteamPath.value = appSettings.steamPath;
    }
    const res = await fetch('/api/collections', { headers: buildHeaders() });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || '读取配置失败');
    if (!els.inputCollectionsSteamPath.value && data.steamPath) {
      els.inputCollectionsSteamPath.value = data.steamPath;
    }
    const detected = (data.detectedPaths || []).join('；');
    const updatedAt = data.updatedAt
      ? `上次更新：${new Date(data.updatedAt).toLocaleString()}`
      : '尚未导入收藏夹';
    els.collectionsImportHint.textContent = detected
      ? `${updatedAt}。已检测到：${detected}`
      : `${updatedAt}。未自动检测到 Steam 安装路径，请手动填写。`;
  } catch (err) {
    els.collectionsImportHint.textContent = err.message;
  }
}

function closeCollectionsImportDialog() {
  els.collectionsImportDialog.close();
}

async function confirmCollectionsImport() {
  const steamPath = els.inputCollectionsSteamPath.value.trim();
  els.btnConfirmCollectionsImport.disabled = true;
  els.btnConfirmCollectionsImport.textContent = '更新中...';
  try {
    const res = await fetch('/api/collections/import-local', {
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
    if (steamPath || data.steamPath) {
      els.inputCollectionsSteamPath.dataset.savedPath = data.steamPath || steamPath;
    }
    closeCollectionsImportDialog();
    if (libraryLoaded) {
      await fetchLibraryPage(false, libraryPagination.page, { quiet: true });
    }
    showToast(`已更新 ${data.imported} 个收藏夹`);
  } catch (err) {
    els.collectionsImportHint.textContent = err.message;
    showToast(err.message, true);
  } finally {
    els.btnConfirmCollectionsImport.disabled = false;
    els.btnConfirmCollectionsImport.textContent = '更新收藏夹';
  }
}

async function pickRandomGame() {
  if (!libraryLoaded) {
    showToast('请先加载游戏库', true);
    return;
  }
  try {
    const params = buildFilterQueryParams(1);
    params.set('platform', 'steam');
    const user = getActiveUser();
    if (user?.steamId) params.set('steamId', user.steamId);
    params.set('includeFamily', 'true');
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
  libraryMeta = { source: '', cachedAt: null, sessionExpired: false, installedCount: 0 };
  libraryPagination = { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };
  favoriteByPlatform = createEmptyPlatformSets();
  hiddenByPlatform = createEmptyPlatformSets();
  setControlsEnabled(false);
  updateStatsBar(message);
  els.gameGrid.innerHTML = '';
  els.pagination?.classList.add('hidden');
  updateModeUi();
}

function updateRefreshSubOptions() {
  const metaShow = !!els.refreshOptMeta?.checked;
  els.refreshOptMetaSubWrap?.classList.toggle('hidden', !metaShow);
  if (!metaShow && els.refreshOptMetaModeAll) {
    els.refreshOptMetaModeAll.checked = false;
  }

  const coversShow = !!els.refreshOptCoversRefresh?.checked;
  els.refreshOptCoversSubWrap?.classList.toggle('hidden', !coversShow);
  if (!coversShow) {
    if (els.refreshOptCoversModeAll) els.refreshOptCoversModeAll.checked = false;
    if (els.refreshOptCoversOverwriteLocal) els.refreshOptCoversOverwriteLocal.checked = false;
  }

  const localizeShow = !!els.refreshOptLocalize?.checked;
  els.refreshOptLocalizeSubWrap?.classList.toggle('hidden', !localizeShow);
  if (!localizeShow) {
    if (els.refreshOptLocalizeOverwriteLocal) els.refreshOptLocalizeOverwriteLocal.checked = false;
    if (els.refreshOptLocalizeRetry) els.refreshOptLocalizeRetry.checked = false;
  }
}

function openRefreshDialog() {
  if (els.refreshOptLibrary) els.refreshOptLibrary.checked = false;
  if (els.refreshOptMeta) els.refreshOptMeta.checked = false;
  if (els.refreshOptMetaModeAll) els.refreshOptMetaModeAll.checked = false;
  if (els.refreshOptCoversRefresh) els.refreshOptCoversRefresh.checked = false;
  if (els.refreshOptCoversModeAll) els.refreshOptCoversModeAll.checked = false;
  if (els.refreshOptCoversOverwriteLocal) els.refreshOptCoversOverwriteLocal.checked = false;
  if (els.refreshOptLocalize) els.refreshOptLocalize.checked = false;
  if (els.refreshOptLocalizeOverwriteLocal) els.refreshOptLocalizeOverwriteLocal.checked = false;
  if (els.refreshOptLocalizeRetry) els.refreshOptLocalizeRetry.checked = false;
  updateRefreshSubOptions();
  const pending = libraryMeta.metaPending || 0;
  if (els.refreshDialogHint) {
    const base = '选择要从 Steam 远程更新的内容（未勾选项保持本地缓存不变）';
    els.refreshDialogHint.textContent = pending > 0
      ? `${base}。尚有 ${pending} 款标签未补全；勾选「获取分类标签」将只处理未完成项（勾选「全部刷新」才会重来）。也可直接点顶栏「继续补全」。`
      : base;
  }
  els.refreshDialog?.showModal();
}

function closeRefreshDialog() {
  els.refreshDialog?.close();
}

function getRefreshPartsFromDialog() {
  const localizeCovers = !!els.refreshOptLocalize?.checked;
  const coversRefresh = !!els.refreshOptCoversRefresh?.checked;
  const coversAll = coversRefresh && !!els.refreshOptCoversModeAll?.checked;
  const metaRefresh = !!els.refreshOptMeta?.checked;
  const metaAll = metaRefresh && !!els.refreshOptMetaModeAll?.checked;
  return {
    library: !!els.refreshOptLibrary?.checked,
    meta: metaRefresh && !metaAll,
    metaAll: metaRefresh && metaAll,
    covers: coversRefresh && !coversAll,
    coversAll: coversRefresh && coversAll,
    coversIncludeLocal: coversRefresh && !!els.refreshOptCoversOverwriteLocal?.checked,
    localizeCovers,
    localizeIncludeLocal: localizeCovers && !!els.refreshOptLocalizeOverwriteLocal?.checked,
    localizeRetryFailed: localizeCovers && !!els.refreshOptLocalizeRetry?.checked,
  };
}

async function confirmRefreshDialog() {
  const parts = getRefreshPartsFromDialog();
  if (!isRefreshPartsActive(parts)) {
    showToast('请至少选择一项要刷新的内容', true);
    return;
  }
  closeRefreshDialog();
  const page = isRefreshPartsActive(parts) ? 1 : libraryPagination.page || 1;
  await fetchLibraryPage(parts, page, { quiet: false });
}

async function loadEnvConfig() {
  await loadAppSettings().catch(() => {});
  await loadUsers();
  await refreshAuthStatus();

  if (!activeUserId) {
    resetGamesView('请先连接 Steam 账号');
    return;
  }

  await loadSteamUserPrefs();
  setControlsEnabled(false);
  showGameGridLoading('正在加载游戏库...');
  updateStatsBar('正在加载游戏库...');
  await fetchSteamGames(false, { quiet: false, autoFetchIfNoCache: true });
}

async function fetchSteamGames(refresh = false, options = {}) {
  const parts = refresh
    ? { library: true, meta: false, covers: false, localizeCovers: false }
    : null;
  return fetchLibraryPage(parts, 1, options);
}

els.btnUserMenu?.addEventListener('click', () => {
  openTokenDialog(getActiveUser() ? 'update' : 'add');
});

els.btnTokenStatus?.addEventListener('click', () => {
  openTokenDialog(getActiveUser() ? 'update' : 'add');
});

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

els.btnRefresh.addEventListener('click', () => {
  if (!activeUserId) {
    showToast('请先连接 Steam 账号', true);
    return;
  }
  openRefreshDialog();
});

els.btnContinueMetaEnrich?.addEventListener('click', () => {
  continueMetaEnrichment().catch((err) => showToast(err.message, true));
});

els.refreshOptCoversRefresh?.addEventListener('change', updateRefreshSubOptions);
els.refreshOptMeta?.addEventListener('change', updateRefreshSubOptions);
els.refreshOptLocalize?.addEventListener('change', updateRefreshSubOptions);

els.btnCloseRefresh?.addEventListener('click', closeRefreshDialog);
els.btnCancelRefresh?.addEventListener('click', closeRefreshDialog);
els.btnConfirmRefresh?.addEventListener('click', () => {
  confirmRefreshDialog().catch((err) => showToast(err.message, true));
});

els.btnRandom.addEventListener('click', () => {
  pickRandomGame().catch((err) => showToast(err.message, true));
});
els.btnRandomAgain.addEventListener('click', () => {
  pickRandomGame().catch((err) => showToast(err.message, true));
});
els.btnCloseRandom.addEventListener('click', () => els.randomDialog.close());

els.btnCancelGameActionConfirm?.addEventListener('click', () => finishGameActionConfirm(false));
els.btnConfirmGameAction?.addEventListener('click', () => finishGameActionConfirm(true));
els.gameActionConfirmDialog?.addEventListener('cancel', (e) => {
  e.preventDefault();
  finishGameActionConfirm(false);
});

els.gameGrid.addEventListener('load', (event) => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement) || !img.classList.contains('game-cover') || img.classList.contains('game-cover-placeholder')) return;
  handleGameCoverLoad(img);
}, true);

els.gameGrid.addEventListener('error', (event) => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement) || !img.classList.contains('game-cover')) return;
  handleGameCoverError(img);
}, true);

els.randomBody?.addEventListener('load', (event) => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement) || !img.classList.contains('game-cover') || img.classList.contains('game-cover-placeholder')) return;
  handleGameCoverLoad(img);
}, true);

els.randomBody?.addEventListener('error', (event) => {
  const img = event.target;
  if (!(img instanceof HTMLImageElement) || !img.classList.contains('game-cover')) return;
  handleGameCoverError(img);
}, true);

function findGameForCardAction(appid, platform) {
  const fromPage = currentPageGames.find(
    (item) => String(item.appid) === String(appid) && gamePlatform(item) === platform,
  );
  if (fromPage) return fromPage;
  if (
    currentRandomGame
    && String(currentRandomGame.appid) === String(appid)
    && gamePlatform(currentRandomGame) === platform
  ) {
    return currentRandomGame;
  }
  return null;
}

async function handleGameCardClick(e) {
  const launchBtn = e.target.closest('.btn-game-launch');
  if (launchBtn) {
    e.preventDefault();
    e.stopPropagation();
    const appid = launchBtn.dataset.appid;
    const platform = launchBtn.dataset.platform;
    blurGameCardFocus();
    if (!(await confirmLaunchGame(appid, platform))) return;
    launchGame(appid, platform).catch((err) => showToast(err.message, true));
    return;
  }
  const downloadBtn = e.target.closest('.btn-game-download');
  if (downloadBtn) {
    e.preventDefault();
    e.stopPropagation();
    const appid = downloadBtn.dataset.appid;
    const platform = downloadBtn.dataset.platform;
    blurGameCardFocus();
    if (!(await confirmDownloadGame(appid, platform))) return;
    downloadGame(appid, platform).catch((err) => showToast(err.message, true));
    return;
  }
  const storeBtn = e.target.closest('.btn-platform-store');
  if (storeBtn) {
    e.preventDefault();
    e.stopPropagation();
    openGameStore(storeBtn.dataset.storeUrl);
    blurGameCardFocus();
    return;
  }
  const editBtn = e.target.closest('.btn-game-edit');
  if (editBtn) {
    e.preventDefault();
    e.stopPropagation();
    const game = findGameForCardAction(editBtn.dataset.appid, editBtn.dataset.platform);
    if (game) openGameEditDialog(game);
    blurGameCardFocus();
    return;
  }
  const favBtn = e.target.closest('.btn-favorite');
  if (favBtn) {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(favBtn.dataset.appid).catch((err) => showToast(err.message, true));
    blurGameCardFocus();
    return;
  }
  const hideBtn = e.target.closest('.btn-hidden');
  if (!hideBtn) return;
  e.preventDefault();
  e.stopPropagation();
  toggleHidden(hideBtn.dataset.appid).catch((err) => showToast(err.message, true));
  blurGameCardFocus();
}

els.gameGrid.addEventListener('click', handleGameCardClick);

window.addEventListener('blur', blurGameCardFocus);

els.randomBody?.addEventListener('click', handleGameCardClick);

els.btnCloseGameEdit?.addEventListener('click', closeGameEditDialog);
els.btnCancelGameEdit?.addEventListener('click', closeGameEditDialog);
els.btnSaveGameEdit?.addEventListener('click', () => saveGameEditDialog().catch((err) => showToast(err.message, true)));
els.btnRefreshGameMeta?.addEventListener('click', () => refreshGameEditMeta().catch((err) => showToast(err.message, true)));
els.btnRefetchCover?.addEventListener('click', () => refetchGameEditCover().catch((err) => showToast(err.message, true)));
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
  if (url) {
    els.inputCoverFile.value = '';
    setGameEditPreview(url);
  }
});
els.inputCoverUrl?.addEventListener('input', () => {
  const url = els.inputCoverUrl.value.trim();
  if (url) {
    els.inputCoverFile.value = '';
    setGameEditPreview(url);
  } else {
    updateGameEditCoverPreview();
  }
});
els.inputCoverUrl?.addEventListener('change', () => {
  const url = els.inputCoverUrl.value.trim();
  if (url) {
    els.inputCoverFile.value = '';
    setGameEditPreview(url);
  } else {
    updateGameEditCoverPreview();
  }
});
els.inputCoverFile?.addEventListener('change', () => {
  const file = els.inputCoverFile.files?.[0];
  if (file) {
    els.inputCoverUrl.value = '';
    setGameEditPreviewFromFile(file);
    return;
  }
  updateGameEditCoverPreview();
});

els.btnImportHidden?.addEventListener('click', () => openHiddenImportDialog());
els.btnCloseHiddenImport?.addEventListener('click', closeHiddenImportDialog);
els.btnCancelHiddenImport?.addEventListener('click', closeHiddenImportDialog);
els.btnConfirmHiddenImport?.addEventListener('click', () => {
  confirmHiddenImport().catch((err) => showToast(err.message, true));
});

els.btnImportCollections?.addEventListener('click', () => openCollectionsImportDialog());
els.btnCloseCollectionsImport?.addEventListener('click', closeCollectionsImportDialog);
els.btnCancelCollectionsImport?.addEventListener('click', closeCollectionsImportDialog);
els.btnConfirmCollectionsImport?.addEventListener('click', () => {
  confirmCollectionsImport().catch((err) => showToast(err.message, true));
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
  els.filterInstalledOnly,
  els.filterInputMethod,
  els.filterFavoritesOnly,
  els.filterHiddenOnly,
].forEach((el) => {
  el.addEventListener('input', scheduleLibraryReload);
  el.addEventListener('change', scheduleLibraryReload);
});

els.btnPagePrev?.addEventListener('click', () => {
  if (libraryPagination.page <= 1 || isPaginationBlocked()) return;
  fetchLibraryPage(false, libraryPagination.page - 1, { quiet: true, preserveProgress: true, nested: true })
    .catch((err) => showToast(err.message, true));
});

els.btnPageNext?.addEventListener('click', () => {
  if (libraryPagination.page >= libraryPagination.totalPages || isPaginationBlocked()) return;
  fetchLibraryPage(false, libraryPagination.page + 1, { quiet: true, preserveProgress: true, nested: true })
    .catch((err) => showToast(err.message, true));
});

els.btnSettings?.addEventListener('click', () => openSettingsDialog());
els.btnCloseSettings?.addEventListener('click', closeSettingsDialog);
els.btnCancelSettings?.addEventListener('click', closeSettingsDialog);
els.btnSaveSettings?.addEventListener('click', () => saveSettings().catch((err) => showToast(err.message, true)));
els.btnToggleFilters?.addEventListener('click', toggleFilters);
els.btnCloseFilters?.addEventListener('click', () => setFiltersExpanded(false));
els.filtersBackdrop?.addEventListener('click', () => setFiltersExpanded(false));

window.addEventListener('resize', () => {
  clearTimeout(gridLayoutTimer);
  gridLayoutTimer = setTimeout(() => relayoutGridIfNeeded(), 100);
});

initDialogBackdropClose();
layoutGameGrid();
loadEnvConfig();
