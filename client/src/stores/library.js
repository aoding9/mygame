import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { readSseFetch } from '../api/sse.js';
import {
  formatLibrarySourceText,
  gameCardKey,
  gameCoverFallback,
  gameCoverImage,
  gamePlatform,
  gameSubtitle,
  gameTitle,
  normalizePrefAppId,
  resolveCoverLookupQuery,
  resolveGameEnglishName,
  hasChineseTextClient,
} from '../utils/game.js';
import {
  debugLog,
  formatHours,
  listToInputValue,
  readApiJson,
} from '../utils/format.js';
import { useAuthStore } from './auth.js';
import { useSettingsStore } from './settings.js';
import { useUiStore } from './ui.js';

const PAGE_SIZE = 48;
const GRID_ROWS = 4;

function createEmptyPlatformSets() {
  return { steam: new Set() };
}

function applyPlatformPrefSets(target, platforms) {
  if (!platforms) return;
  for (const [platform, ids] of Object.entries(platforms)) {
    target[platform] = new Set((ids || []).map((id) => normalizePrefAppId(id)));
  }
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

function buildRefreshStages(parts) {
  const stages = [];
  if (parts.library) stages.push({ id: 'library', label: '拉取 Steam 游戏库' });
  if (parts.meta || parts.metaAll) {
    stages.push({ id: 'meta', label: parts.metaAll ? '全部更新分类 / 标签' : '获取分类标签' });
  }
  if (parts.covers || parts.coversAll) {
    stages.push({ id: 'covers', label: parts.coversAll ? '全部刷新封面' : '补全封面' });
  }
  if (parts.localizeCovers) stages.push({ id: 'localize', label: '本地化封面' });
  return stages;
}

function stageIndexOf(stages, id) {
  const idx = stages.findIndex((item) => item.id === id);
  return idx >= 0 ? idx : 0;
}

function summarizeLocalizedCovers(localizedCovers, cumulative = {}) {
  const total = Number(cumulative.total ?? localizedCovers?.pending ?? 0) || 0;
  const done = Number(cumulative.done ?? localizedCovers?.done ?? 0) || 0;
  const failed = Number(cumulative.failed ?? localizedCovers?.failed ?? 0) || 0;
  return { total, failed, processed: done + failed };
}

function formatLocalizeCoverToast(stats) {
  return `封面本地化 · 已处理 ${stats.processed} · 全部 ${stats.total} · 失败 ${stats.failed}`;
}

export const useLibraryStore = defineStore('library', () => {
  const auth = useAuthStore();
  const ui = useUiStore();
  const settings = useSettingsStore();

  const games = ref([]);
  const gridLoading = ref(false);
  const gridLoadingText = ref('');
  const gamesLoading = ref(false);
  const libraryLoaded = ref(false);
  const libraryGameCount = ref(0);
  const libraryFilteredCount = ref(0);
  const statsOverride = ref('');
  const currentSteamId = ref('');
  const includeFamilyLoaded = ref(false);
  const loadedAccountCount = ref(1);
  const dynamicPageSize = ref(PAGE_SIZE);
  const updatingCards = ref(new Set());

  const libraryMeta = ref({
    source: '',
    cachedAt: null,
    sessionExpired: false,
    installedCount: 0,
    metaPending: 0,
  });

  const pagination = ref({ page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 });

  const filters = ref({
    search: '',
    genre: '',
    tagSearch: '',
    sort: 'name-asc',
    ownerSteamId: '',
    steamCollectionId: '',
    minHours: 0,
    maxHours: '',
    unplayed: false,
    shareableOnly: false,
    nonShareableOnly: false,
    familyOnly: false,
    installedOnly: false,
    inputMethod: '',
    favoritesOnly: false,
    hiddenOnly: false,
  });

  const filterOptions = ref({
    genres: [],
    tags: [],
    owners: [],
    collections: [],
  });

  const favoriteByPlatform = ref(createEmptyPlatformSets());
  const hiddenByPlatform = ref(createEmptyPlatformSets());
  const savedSteamPath = ref('');

  let libraryFetchController = null;
  let libraryFetchToken = 0;
  let enrichAbortController = null;
  let metaEnriching = ref(false);
  let filterReloadTimer = null;
  let filterOptionsReloadTimer = null;
  let activeLocalizeRefreshOpts = { retryFailed: false, overwriteLocal: false };
  let gridLayoutTimer = null;

  const refreshDialogOpen = ref(false);
  const refreshOptions = ref({
    library: false,
    meta: false,
    metaAll: false,
    covers: false,
    coversAll: false,
    coversIncludeLocal: false,
    localizeCovers: false,
    localizeIncludeLocal: false,
    localizeRetryFailed: false,
  });

  const randomDialogOpen = ref(false);
  const randomGame = ref(null);

  const gameEditOpen = ref(false);
  const gameEditTarget = ref(null);
  const gameEditForm = ref({
    displayName: '',
    nameCn: '',
    nameEn: '',
    genres: '',
    tags: '',
    aliases: '',
    coverUrl: '',
    coverLocalize: true,
    lockFromRefresh: false,
    lookupQuery: '',
  });
  const gameEditPreview = ref('');
  const gameEditPreviewFile = ref(null);
  const gameEditSourceInfo = ref('');
  const gameEditShowGenres = ref(true);
  const coverLookupResults = ref([]);
  const gameEditBusy = ref('');
  let gameEditPreviewObjectUrl = '';

  const hiddenImportOpen = ref(false);
  const hiddenImportPath = ref('');
  const hiddenImportHint = ref('');
  const hiddenImportBusy = ref(false);

  const collectionsImportOpen = ref(false);
  const collectionsImportPath = ref('');
  const collectionsImportHint = ref('');
  const collectionsImportBusy = ref(false);

  const libraryMainRef = ref(null);
  const gameGridRef = ref(null);
  const libraryFooterRef = ref(null);

  const controlsEnabled = computed(() => libraryLoaded.value);
  const showMetaContinue = computed(() => libraryLoaded.value && (libraryMeta.value.metaPending || 0) > 0 && !metaEnriching.value && !gamesLoading.value);
  const paginationVisible = computed(() => libraryLoaded.value && pagination.value.totalPages > 1);
  const pageInfoText = computed(() => {
    const p = pagination.value;
    return `第 ${p.page} / ${p.totalPages} 页 · 共 ${libraryFilteredCount.value} 款`;
  });
  const statsBarText = computed(() => {
    if (statsOverride.value) return statsOverride.value;
    if (!libraryLoaded.value) return '请先加载游戏库';
    const meta = libraryMeta.value;
    const source = formatLibrarySourceText(meta);
    const count = `${libraryFilteredCount.value} / ${libraryGameCount.value} 款`;
    const installed = meta.installedCount ? ` · 已安装 ${meta.installedCount}` : '';
    return `${count}${installed}${source ? ` · ${source}` : ''}`;
  });
  const refreshDialogHint = computed(() => {
    const base = '选择要从 Steam 远程更新的内容（未勾选项保持本地缓存不变）';
    const pending = libraryMeta.value.metaPending || 0;
    return pending > 0
      ? `${base}。尚有 ${pending} 款标签未补全；勾选「获取分类标签」将只处理未完成项（勾选「全部刷新」才会重来）。也可直接点顶栏「继续补全」。`
      : base;
  });

  function isFavorite(appid) {
    return favoriteByPlatform.value.steam?.has(normalizePrefAppId(appid));
  }

  function isHidden(appid) {
    return hiddenByPlatform.value.steam?.has(normalizePrefAppId(appid));
  }

  function isCardUpdating(appid, platform = 'steam') {
    return updatingCards.value.has(gameCardKey(appid, platform));
  }

  function setCardUpdating(appid, platform, updating = true) {
    const key = gameCardKey(appid, platform);
    const next = new Set(updatingCards.value);
    if (updating) next.add(key);
    else next.delete(key);
    updatingCards.value = next;
  }

  function buildFilterQueryParams(page = pagination.value.page) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(dynamicPageSize.value || PAGE_SIZE));
    params.set('sort', filters.value.sort);

    const f = filters.value;
    if (f.search) params.set('search', f.search);
    if (f.genre) params.set('genre', f.genre);
    if (f.tagSearch) params.set('tagSearch', f.tagSearch);
    if (f.unplayed) params.set('unplayed', 'true');
    if (f.shareableOnly) params.set('shareableOnly', 'true');
    if (f.nonShareableOnly) params.set('nonShareableOnly', 'true');
    if (f.familyOnly) params.set('familyOnly', 'true');
    if (f.installedOnly) params.set('installedOnly', 'true');
    if (f.inputMethod) params.set('inputMethod', f.inputMethod);
    if (f.ownerSteamId) params.set('ownerSteamId', f.ownerSteamId);
    if (f.steamCollectionId) params.set('steamCollectionId', f.steamCollectionId);
    if (f.minHours > 0) params.set('minHours', String(f.minHours));
    if (f.maxHours !== '' && f.maxHours != null) params.set('maxHours', String(f.maxHours));
    if (f.favoritesOnly) params.set('favoritesOnly', 'true');
    if (f.hiddenOnly) params.set('hiddenOnly', 'true');
    return params;
  }

  function getLibraryApiUrl(refreshParts, page) {
    const params = buildFilterQueryParams(page);
    const refreshParam = buildRefreshPartsParam(refreshParts);
    if (refreshParam) params.set('refreshParts', refreshParam);
    if (refreshParts?.localizeRetryFailed) params.set('localizeRetryFailed', 'true');
    if (refreshParts?.coversIncludeLocal) params.set('coversIncludeLocal', 'true');
    if (refreshParts?.localizeIncludeLocal) params.set('localizeIncludeLocal', 'true');

    const steamId = (auth.activeUser?.steamId || '').trim();
    if (steamId) params.set('steamId', steamId);
    params.set('includeFamily', 'true');
    return `/api/games?${params.toString()}`;
  }

  function getLibraryStreamUrl(parts) {
    const streamParts = { library: true, localizeCovers: !!parts.localizeCovers };
    const params = new URLSearchParams();
    const refreshParam = buildRefreshPartsParam(streamParts);
    if (refreshParam) params.set('refreshParts', refreshParam);
    if (parts.localizeRetryFailed) params.set('localizeRetryFailed', 'true');
    if (parts.localizeIncludeLocal) params.set('localizeIncludeLocal', 'true');

    const steamId = (auth.activeUser?.steamId || '').trim();
    if (steamId) params.set('steamId', steamId);
    params.set('includeFamily', 'true');
    return `/api/games/library-stream?${params.toString()}`;
  }

  function getCoverLocalizeApiUrl(opts = activeLocalizeRefreshOpts) {
    const params = new URLSearchParams();
    params.set('platform', 'steam');
    const steamId = (auth.activeUser?.steamId || '').trim();
    if (steamId) params.set('steamId', steamId);
    params.set('includeFamily', 'true');
    if (opts.retryFailed) params.set('localizeRetryFailed', 'true');
    if (opts.overwriteLocal) params.set('localizeIncludeLocal', 'true');
    return `/api/covers/localize?${params.toString()}`;
  }

  function populateFilterOptions(data = {}) {
    filterOptions.value = {
      genres: data.genres || [],
      tags: data.tags || [],
      owners: data.owners || [],
      collections: data.collections || [],
    };
    if (filters.value.genre && !filterOptions.value.genres.includes(filters.value.genre)) {
      filters.value.genre = '';
    }
    if (filters.value.ownerSteamId && !filterOptions.value.owners.some((o) => o.id === filters.value.ownerSteamId)) {
      filters.value.ownerSteamId = '';
    }
    if (filters.value.steamCollectionId && !filterOptions.value.collections.some((c) => c.id === filters.value.steamCollectionId)) {
      filters.value.steamCollectionId = '';
    }
  }

  function syncLibraryMeta(data = {}) {
    libraryMeta.value = {
      source: data.source || libraryMeta.value.source,
      cachedAt: data.cachedAt ?? libraryMeta.value.cachedAt,
      sessionExpired: !!data.sessionExpired,
      installedCount: data.installedCount ?? libraryMeta.value.installedCount,
      metaPending: data.metaPending ?? libraryMeta.value.metaPending,
    };
  }

  function applyLibraryResponse(data) {
    games.value = data.games || [];
    libraryLoaded.value = true;
    libraryGameCount.value = data.gameCount || 0;
    libraryFilteredCount.value = data.filteredCount || 0;
    populateFilterOptions(data.filterOptions || {});
    syncLibraryMeta(data);
    if (data.pagination) {
      pagination.value = { ...pagination.value, ...data.pagination };
    }
    statsOverride.value = '';
  }

  function showGridLoading(text = '正在加载...') {
    gridLoading.value = true;
    gridLoadingText.value = text;
  }

  function hideGridLoading() {
    gridLoading.value = false;
  }

  function cancelPendingLibraryFetch() {
    libraryFetchToken += 1;
    if (libraryFetchController) {
      libraryFetchController.abort();
      libraryFetchController = null;
    }
  }

  function isStaleLibraryFetch(token) {
    return token !== libraryFetchToken;
  }

  function isPaginationBlocked() {
    return gamesLoading.value || metaEnriching.value || ui.isProgressHeld();
  }

  function computeGameGridLayout() {
    const mainEl = libraryMainRef.value;
    const gridEl = gameGridRef.value;
    if (!mainEl || !gridEl) {
      return { cols: 8, rows: GRID_ROWS, pageSize: PAGE_SIZE, cardH: 168, isCompactCard: false };
    }

    const styles = getComputedStyle(document.documentElement);
    const colGap = parseFloat(styles.getPropertyValue('--card-gap-x')) || 14;
    const rowGap = parseFloat(styles.getPropertyValue('--card-gap-y')) || 10;
    const gridInsetBottom = parseFloat(styles.getPropertyValue('--grid-layout-inset-bottom')) || 6;
    const mainRect = mainEl.getBoundingClientRect();
    const mainGap = parseFloat(styles.getPropertyValue('--library-main-gap')) || 4;
    const footH = (libraryFooterRef.value?.offsetHeight || 0) + mainGap;
    const availableH = Math.max(220, mainRect.height - footH - gridInsetBottom);
    const availableW = gridEl.clientWidth || mainRect.width;

    const minCardW = 168;
    const maxCols = 10;
    let cols = Math.floor((availableW + colGap) / (minCardW + colGap));
    cols = Math.max(4, Math.min(cols, maxCols));
    if (availableW >= 1360 && cols >= 9) cols = 10;

    const rows = GRID_ROWS;
    const cardH = Math.floor((availableH - rowGap * (rows - 1)) / rows);
    const pageSize = cols * rows;

    return { cols, rows, pageSize, cardH, isCompactCard: false };
  }

  function applyGameGridLayout(metrics) {
    document.documentElement.style.setProperty('--grid-cols', String(metrics.cols));
    document.documentElement.style.setProperty('--grid-rows', String(metrics.rows));
    document.documentElement.style.setProperty('--card-min-height', `${metrics.cardH}px`);
    gameGridRef.value?.classList.toggle('game-grid--compact', metrics.isCompactCard);
  }

  function layoutGameGrid() {
    const metrics = computeGameGridLayout();
    applyGameGridLayout(metrics);
    dynamicPageSize.value = metrics.pageSize;
    pagination.value.pageSize = metrics.pageSize;
    return metrics;
  }

  function scheduleLayoutGameGrid() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => layoutGameGrid());
    });
  }

  async function relayoutGridIfNeeded() {
    const prevSize = dynamicPageSize.value;
    layoutGameGrid();
    if (libraryLoaded.value && !gamesLoading.value && dynamicPageSize.value !== prevSize) {
      showGridLoading('正在调整布局...');
      await fetchLibraryPage(null, pagination.value.page, { quiet: true }).catch(() => {});
    }
  }

  function scheduleLibraryReload() {
    if (!libraryLoaded.value || isPaginationBlocked()) return;
    clearTimeout(filterReloadTimer);
    filterReloadTimer = setTimeout(() => {
      fetchLibraryPage(null, 1, { quiet: true, preserveProgress: true, nested: true })
        .catch((err) => ui.showToast(err.message, true));
    }, 250);
  }

  function scheduleFilterOptionsReload() {
    clearTimeout(filterOptionsReloadTimer);
    filterOptionsReloadTimer = setTimeout(() => {
      fetchLibraryPage(null, pagination.value.page, { quiet: true, suppressProgress: true, nested: true }).catch(() => {});
    }, 2000);
  }

  function abortEnrichStream() {
    if (enrichAbortController) {
      enrichAbortController.abort();
      enrichAbortController = null;
    }
  }

  function patchGameInList(appid, platform, patch) {
    const idx = games.value.findIndex(
      (g) => String(g.appid) === String(appid) && gamePlatform(g) === platform,
    );
    if (idx >= 0) games.value[idx] = { ...games.value[idx], ...patch };
  }

  function applyGameCardPatches(updates, platform = 'steam') {
    if (!updates?.length) return;
    for (const item of updates) {
      const appid = String(item.appid || '');
      if (!appid) continue;
      patchGameInList(appid, item.platform || platform, {
        cover_url: item.cover_url || undefined,
        cover_updated_at: item.cover_updated_at,
        name: item.name,
        name_cn: item.name_cn,
        store_url: item.store_url,
        genres: item.genres?.length ? item.genres : undefined,
        tags: item.tags?.length ? item.tags : undefined,
      });
      setCardUpdating(appid, item.platform || platform, false);
    }
  }

  function applyMetaUpdates(updates) {
    if (!updates?.length) return;
    for (const item of updates) {
      const appid = String(item.appid || '');
      if (!appid) continue;
      patchGameInList(appid, 'steam', {
        name_cn: item.name_cn,
        genres: item.genres?.length ? item.genres : undefined,
        tags: item.tags?.length ? item.tags : undefined,
        aliases: item.aliases?.length ? item.aliases : undefined,
        input_methods: item.input_methods?.length ? item.input_methods : undefined,
      });
    }
    scheduleFilterOptionsReload();
  }

  async function pullLibraryWithProgress(parts, page, options = {}) {
    const { headers, fetchOpts, refreshStages = [], staleFetch = () => false } = options;
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
      ui.updateProgress({
        label: payload.label || defaultLabel,
        current: payload.current || 0,
        total: payload.total || 0,
        stageIndex: libIdx,
        stageTotal,
        indeterminate: false,
      });
    });

    if (staleFetch()) return null;

    const listRes = await fetch(getLibraryApiUrl({}, page), headers ? { headers, ...fetchOpts } : fetchOpts);
    if (staleFetch()) return null;
    const data = await readApiJson(listRes);
    if (!listRes.ok) throw new Error(data.error || '加载失败');
    if (localizedCovers) data.localizedCovers = localizedCovers;
    return data;
  }

  function updateLocalizeCoverProgress(localizedCovers, refreshStages, cumulative = {}) {
    const stats = summarizeLocalizedCovers(localizedCovers, cumulative);
    const locIdx = stageIndexOf(refreshStages, 'localize');
    ui.updateProgress({
      label: '本地化封面',
      current: stats.processed,
      total: stats.total,
      failed: stats.failed,
      stageIndex: refreshStages.length ? locIdx : 0,
      stageTotal: refreshStages.length || 1,
      indeterminate: stats.total === 0 && stats.processed === 0,
    });
  }

  async function fetchCoverLocalizeBatch() {
    const headers = auth.buildHeaders();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    try {
      const res = await fetch(getCoverLocalizeApiUrl(), { method: 'POST', headers, signal: controller.signal });
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
      library: false, meta: false, covers: false, localizeCovers: false,
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
    const headers = auth.buildHeaders();
    const maxIterations = Math.max(1, Math.ceil(totalPending / 80) + 3);
    let iterations = 0;
    let lastRemaining = Infinity;

    while (data.localizedCovers.remaining > 0 && iterations < maxIterations) {
      iterations += 1;
      if (!options.suppressProgress) {
        updateLocalizeCoverProgress(data.localizedCovers, refreshStages, {
          total: totalPending, done: cumulativeDone, failed: cumulativeFailed,
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
      if (reloaded) data = { ...reloaded, localizedCovers: data.localizedCovers };
    } catch (err) {
      debugLog('本地化后刷新列表失败', { message: err.message });
    }

    if (!options.suppressProgress && data?.localizedCovers) {
      updateLocalizeCoverProgress(data.localizedCovers, refreshStages, {
        total: totalPending, done: cumulativeDone, failed: cumulativeFailed,
      });
    }
    return data;
  }

  async function refetchCoversStream(options = {}) {
    const forceAll = !!options.forceAll;
    abortEnrichStream();
    enrichAbortController = new AbortController();
    const { signal } = enrichAbortController;
    const platform = 'steam';
    const progressLabel = forceAll ? '全部刷新封面' : '补全封面';

    const steamId = (auth.activeUser?.steamId || '').trim();
    const params = new URLSearchParams();
    if (steamId) params.set('steamId', steamId);
    params.set('includeFamily', 'true');
    if (forceAll) params.set('forceAll', '1');
    if (options.includeLocal) params.set('includeLocal', 'true');
    const url = `/api/games/covers/refetch-stream?${params.toString()}`;

    for (const game of games.value) {
      if (gamePlatform(game) !== platform) continue;
      if (forceAll || !game.cover_url) setCardUpdating(game.appid, platform, true);
    }

    try {
      const res = await fetch(url, { headers: auth.buildHeaders(), signal });
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
            ui.updateProgress({
              label: progressLabel,
              current: payload.current || 0,
              total: payload.total,
              failed: payload.failed ?? null,
              stageIndex: options.stageIndex ?? 0,
              stageTotal: options.stageTotal ?? 1,
            });
          }
        }
      }
      await fetchLibraryPage(null, pagination.value.page, { quiet: true, suppressProgress: true, nested: true, preserveProgress: true });
    } catch (err) {
      if (err.name !== 'AbortError') debugLog('刷新封面失败', { message: err.message });
    } finally {
      for (const game of games.value) {
        if (gamePlatform(game) === platform) setCardUpdating(game.appid, platform, false);
      }
      if (enrichAbortController?.signal === signal) enrichAbortController = null;
      if (!options.keepProgress) ui.releaseProgress();
    }
  }

  async function enrichGamesMeta(steamId, options = {}) {
    abortEnrichStream();
    enrichAbortController = new AbortController();
    const { signal } = enrichAbortController;
    const silent = !!options.silent;
    const forceAll = !!options.forceAll;
    const progressLabel = forceAll ? '全部更新分类 / 标签' : '获取分类标签';
    const url = `/api/games/enrich-stream?steamId=${encodeURIComponent(steamId)}&includeFamily=true${forceAll ? '&forceAll=true' : ''}`;

    metaEnriching.value = true;
    let streamCompleted = false;
    let interrupted = false;

    try {
      const res = await fetch(url, { headers: auth.buildHeaders(), signal });
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
            ui.updateProgress({
              label: progressLabel,
              current: payload.current || 0,
              total: payload.total,
              stageIndex: options.stageIndex ?? 0,
              stageTotal: options.stageTotal ?? 1,
            });
          }
          if (payload.total > 0 && payload.current !== undefined) {
            libraryMeta.value.metaPending = Math.max(0, payload.total - payload.current);
          }
          if (payload.complete) streamCompleted = true;
        }
      }
      if (!streamCompleted && !signal.aborted) interrupted = true;
    } catch (err) {
      if (err.name === 'AbortError') interrupted = true;
      else debugLog('补全中文信息失败', { message: err.message });
    } finally {
      metaEnriching.value = false;
      if (enrichAbortController?.signal === signal) enrichAbortController = null;
      if (!options.keepProgress) ui.releaseProgress();
      await refreshMetaPendingCount();
      if (interrupted && libraryMeta.value.metaPending > 0 && !silent && !gamesLoading.value) {
        ui.showToast(`标签补全已暂停，还有 ${libraryMeta.value.metaPending} 款未完成，可点「继续补全」`);
      } else if (streamCompleted && !silent && !options.keepProgress && libraryMeta.value.metaPending === 0) {
        ui.showToast('分类标签补全完成');
      } else if (streamCompleted && !silent && !options.keepProgress && libraryMeta.value.metaPending > 0) {
        ui.showToast(`本轮已处理，还有 ${libraryMeta.value.metaPending} 款未能获取，可点「继续补全」`);
      }
      if (streamCompleted && options.reloadAfter) {
        fetchLibraryPage(null, pagination.value.page, { quiet: true, preserveProgress: true, nested: true })
          .catch((err) => debugLog('补全后刷新列表失败', { message: err.message }));
      }
    }
  }

  async function refreshMetaPendingCount() {
    try {
      const steamId = (auth.activeUser?.steamId || '').trim();
      if (!steamId) return;
      const params = new URLSearchParams({ steamId, includeFamily: 'true', metaPendingOnly: 'true' });
      const res = await fetch(`/api/games/meta-pending?${params}`, { headers: auth.buildHeaders() });
      const data = await readApiJson(res);
      if (res.ok) libraryMeta.value.metaPending = data.metaPending || 0;
    } catch {
      /* ignore */
    }
  }

  async function continueMetaEnrichment() {
    const steamId = (auth.activeUser?.steamId || '').split(',')[0].trim();
    if (!steamId) return;
    ui.holdProgress();
    await enrichGamesMeta(steamId, { keepProgress: true, reloadAfter: true });
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
      library: false, meta: false, metaAll: false,
      covers: false, coversAll: false, coversIncludeLocal: false, localizeCovers: false,
    };
    const refreshActive = isRefreshPartsActive(parts);
    const refreshStages = refreshActive && !suppressProgress ? buildRefreshStages(parts) : [];

    const steamId = (auth.activeUser?.steamId || '').trim();
    if (!steamId) {
      if (!quiet) ui.showToast('请先连接 Steam 账号', true);
      return;
    }
    if (parts.library) await auth.ensureTokenReady();

    if (!nested) {
      if (refreshActive) {
        abortEnrichStream();
        ui.resetProgressHold();
      }
      cancelPendingLibraryFetch();
      libraryFetchController = new AbortController();
      gamesLoading.value = true;
      layoutGameGrid();
      const skipGridLoading = preserveProgress && ui.isProgressHeld();
      if (!refreshStages.length && !skipGridLoading) {
        showGridLoading(refreshActive ? '正在更新...' : '正在加载...');
      }
    }

    const fetchToken = nested ? null : libraryFetchToken;
    const fetchSignal = nested ? undefined : libraryFetchController?.signal;
    const staleFetch = () => !nested && isStaleLibraryFetch(fetchToken);

    if (!nested) statsOverride.value = refreshActive ? '正在拉取最新数据...' : '正在加载...';

    if (refreshStages.length) {
      ui.holdProgress();
      ui.updateProgress({
        label: refreshStages[0].label,
        indeterminate: true,
        stageIndex: 0,
        stageTotal: refreshStages.length,
      });
    }

    try {
      const headers = auth.buildHeaders();
      const fetchOpts = fetchSignal ? { signal: fetchSignal } : undefined;
      let data;

      if (parts.library) {
        data = await pullLibraryWithProgress(parts, page, { headers, fetchOpts, refreshStages, staleFetch });
        if (staleFetch() || !data) return;
      } else {
        let res = await fetch(getLibraryApiUrl(parts, page), headers ? { headers, ...fetchOpts } : fetchOpts);
        if (staleFetch()) return;
        data = await readApiJson(res);

        if (res.status === 401 && data.needAuth) {
          auth.openTokenDialog('update');
          throw new Error(data.error || '请先完成账号连接');
        }
        if (!res.ok) throw new Error(data.error || '加载失败');

        if (autoFetchIfNoCache && !refreshActive && data.fromCache === true && data.gameCount === 0) {
          await auth.ensureTokenReady();
          statsOverride.value = '缓存为空，正在拉取...';
          data = await pullLibraryWithProgress({
            library: true, meta: false, covers: false, localizeCovers: false,
          }, page, {
            headers, fetchOpts,
            refreshStages: [{ id: 'library', label: '拉取 Steam 游戏库' }],
            staleFetch,
          });
          if (staleFetch() || !data) return;
        }
      }

      currentSteamId.value = data.steamId || currentSteamId.value;
      includeFamilyLoaded.value = !!data.includeFamily;
      loadedAccountCount.value = data.accountCount || 1;
      await loadSteamUserPrefs();
      if (data.tokenExpired) auth.refreshAuthStatus();

      applyLibraryResponse(data);
      hideGridLoading();
      if (!nested) scheduleLayoutGameGrid();
      if (staleFetch()) return;

      if (!quiet && !parts.localizeCovers && !staleFetch()) {
        ui.showToast(data.fromCache ? '已加载缓存' : '游戏库已更新');
      }

      if (staleFetch()) return;

      if (parts.meta || parts.metaAll) {
        const forceAll = !!parts.metaAll;
        const pending = data.metaPending || 0;
        if (forceAll || pending > 0) {
          await enrichGamesMeta((data.steamId || currentSteamId.value).split(',')[0].trim(), {
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
        if (refreshStages.length) updateLocalizeCoverProgress(data.localizedCovers, refreshStages);
        if (data.localizedCovers.remaining > 0) {
          data = await runCoverLocalizationBatches(page, refreshStages, data, { suppressProgress });
        } else {
          try {
            const reloaded = await reloadLibraryPageAfterLocalize(page, headers);
            if (reloaded) data = { ...reloaded, localizedCovers: data.localizedCovers };
          } catch (err) {
            debugLog('本地化后刷新列表失败', { message: err.message });
          }
        }
        if (!quiet && data?.localizedCovers) {
          const stats = summarizeLocalizedCovers(data.localizedCovers);
          if (stats.total > 0 || stats.processed > 0) {
            ui.showToast(formatLocalizeCoverToast(stats), stats.failed > 0 && stats.processed === stats.failed);
          } else {
            ui.showToast('没有需要本地化的封面', true);
          }
        }
      }

      if (staleFetch()) return;

      if (isCoversRefreshActive(parts)) {
        await refetchCoversStream({
          forceAll: !!parts.coversAll,
          includeLocal: !!parts.coversIncludeLocal,
          stageIndex: stageIndexOf(refreshStages, 'covers'),
          stageTotal: refreshStages.length || 1,
          keepProgress: refreshStages.length > 0,
        });
      }

      if (staleFetch()) return;

      if (refreshStages.length) {
        ui.updateProgress({
          label: '刷新完成',
          current: 1,
          total: 1,
          stageIndex: refreshStages.length - 1,
          stageTotal: refreshStages.length,
        });
        ui.releaseProgress();
      }

      return data;
    } catch (err) {
      if (err.name === 'AbortError' || staleFetch()) return;
      if (refreshStages.length) ui.resetProgressHold();
      debugLog('游戏库加载失败', { message: err.message });
      if (err.needAuth) auth.openTokenDialog('update');
      if (!quiet) ui.showToast(err.message, true);
      if (!libraryLoaded.value) {
        statsOverride.value = err.message.includes('Token') ? err.message : '加载失败';
        games.value = [];
      }
      throw err;
    } finally {
      if (!nested && fetchToken === libraryFetchToken) {
        gamesLoading.value = false;
        hideGridLoading();
        if (libraryFetchController?.signal?.aborted) libraryFetchController = null;
      }
    }
  }

  async function loadFavorites() {
    favoriteByPlatform.value = createEmptyPlatformSets();
    if (!auth.activeUserId) return;
    try {
      const res = await fetch('/api/favorites', { headers: auth.buildHeaders() });
      const data = await readApiJson(res);
      if (res.ok) {
        if (data.platforms) applyPlatformPrefSets(favoriteByPlatform.value, data.platforms);
        else if (data.appids) favoriteByPlatform.value.steam = new Set(data.appids.map((id) => String(Number(id))));
      }
    } catch { /* ignore */ }
  }

  async function loadHidden() {
    hiddenByPlatform.value = createEmptyPlatformSets();
    if (!auth.activeUserId) return;
    try {
      const res = await fetch('/api/hidden', { headers: auth.buildHeaders() });
      const data = await readApiJson(res);
      if (res.ok) {
        if (data.platforms) applyPlatformPrefSets(hiddenByPlatform.value, data.platforms);
        else if (data.appids) hiddenByPlatform.value.steam = new Set(data.appids.map((id) => String(Number(id))));
        savedSteamPath.value = data.steamPath || savedSteamPath.value;
      }
    } catch { /* ignore */ }
  }

  async function loadSteamUserPrefs() {
    await Promise.all([loadFavorites(), loadHidden()]);
  }

  async function toggleFavorite(appid) {
    if (!auth.activeUserId) {
      ui.showToast('请先连接 Steam 账号', true);
      return;
    }
    const res = await fetch('/api/favorites/toggle', {
      method: 'POST',
      headers: { ...auth.buildHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ appid, platform: 'steam' }),
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || '操作失败');
    applyPlatformPrefSets(favoriteByPlatform.value, data.platforms);
    if (filters.value.favoritesOnly) {
      await fetchLibraryPage(null, pagination.value.page, { quiet: true });
    }
  }

  async function toggleHidden(appid) {
    if (!auth.activeUserId) {
      ui.showToast('请先连接 Steam 账号', true);
      return;
    }
    const res = await fetch('/api/hidden/toggle', {
      method: 'POST',
      headers: { ...auth.buildHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ appid, platform: 'steam' }),
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || '操作失败');
    applyPlatformPrefSets(hiddenByPlatform.value, data.platforms);
    await fetchLibraryPage(null, pagination.value.page, { quiet: true });
  }

  function findGame(appid, platform = 'steam') {
    return games.value.find(
      (g) => String(g.appid) === String(appid) && gamePlatform(g) === platform,
    ) || (randomGame.value && String(randomGame.value.appid) === String(appid) && gamePlatform(randomGame.value) === platform
      ? randomGame.value
      : null);
  }

  async function confirmLaunchGame(appid, platform = 'steam') {
    const game = findGame(appid, platform);
    const name = game ? gameTitle(game) : `App ${appid}`;
    return ui.showConfirm({
      title: '启动游戏',
      message: `确定启动「${name}」？`,
      confirmText: '启动',
      confirmClass: 'btn-confirm-launch',
    });
  }

  async function confirmDownloadGame(appid, platform = 'steam') {
    const game = findGame(appid, platform);
    const name = game ? gameTitle(game) : `App ${appid}`;
    return ui.showConfirm({
      title: '安装游戏',
      message: `确定安装「${name}」？将打开 Steam 客户端。`,
      confirmText: '安装',
      confirmClass: 'btn-confirm-download',
    });
  }

  async function launchGame(appid, platform = 'steam') {
    const res = await fetch(`/api/games/${platform}/${encodeURIComponent(appid)}/launch`, {
      method: 'POST',
      headers: auth.buildHeaders(),
    });
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || '启动失败');
    ui.showToast('正在启动游戏');
  }

  async function downloadGame(appid, platform = 'steam') {
    const res = await fetch(`/api/games/${platform}/${encodeURIComponent(appid)}/install`, {
      method: 'POST',
      headers: auth.buildHeaders(),
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
    ui.showToast('正在打开 Steam 下载…');
  }

  function openGameStore(url) {
    if (!url || url === '#') return;
    window.open(url, '_blank', 'noopener');
  }

  function revokeGameEditPreviewObjectUrl() {
    if (!gameEditPreviewObjectUrl) return;
    URL.revokeObjectURL(gameEditPreviewObjectUrl);
    gameEditPreviewObjectUrl = '';
  }

  function setGameEditPreview(src, bustCache = false) {
    revokeGameEditPreviewObjectUrl();
    gameEditPreviewFile.value = null;
    if (!src) {
      gameEditPreview.value = '';
      return;
    }
    gameEditPreview.value = bustCache
      ? `${src}${src.includes('?') ? '&' : '?'}t=${Date.now()}`
      : src;
  }

  function setGameEditPreviewFromFile(file) {
    revokeGameEditPreviewObjectUrl();
    if (!file) {
      gameEditPreview.value = '';
      gameEditPreviewFile.value = null;
      return;
    }
    gameEditPreviewObjectUrl = URL.createObjectURL(file);
    gameEditPreviewFile.value = file;
    gameEditPreview.value = gameEditPreviewObjectUrl;
  }

  function updateGameEditCoverPreview() {
    if (gameEditPreviewFile.value) {
      setGameEditPreviewFromFile(gameEditPreviewFile.value);
      return;
    }
    const url = gameEditForm.value.coverUrl.trim();
    setGameEditPreview(url || '');
  }

  async function openGameEditDialog(game) {
    const platform = gamePlatform(game);
    gameEditTarget.value = {
      appid: game.appid,
      platform,
      source_name: game.source_name || game.name || '',
      source_name_cn: game.source_name_cn || game.name_cn || '',
    };

    gameEditShowGenres.value = platform === 'steam';
    gameEditSourceInfo.value = `平台原名：${gameEditTarget.value.source_name_cn || gameEditTarget.value.source_name || '—'} · ${platform}`;
    gameEditForm.value = {
      displayName: game.display_name || '',
      nameCn: game.custom_name_cn || game.name_cn || '',
      nameEn: resolveGameEnglishName(game),
      genres: listToInputValue(game.genres),
      tags: listToInputValue(game.tags),
      aliases: listToInputValue(game.aliases),
      coverUrl: game.cover_url?.startsWith('http') ? game.cover_url : '',
      coverLocalize: true,
      lockFromRefresh: !!game.lock_from_refresh,
      lookupQuery: resolveCoverLookupQuery(game),
    };
    coverLookupResults.value = [];
    setGameEditPreview(gameCoverImage(game) || gameCoverFallback(game), true);

    try {
      const res = await fetch(
        `/api/games/${platform}/${encodeURIComponent(game.appid)}/override`,
        { headers: auth.buildHeaders() },
      );
      const data = await readApiJson(res);
      if (gameEditTarget.value && res.ok && data.override) {
        const o = data.override;
        gameEditForm.value.displayName = o.display_name || gameEditForm.value.displayName;
        gameEditForm.value.nameCn = o.name_cn || gameEditForm.value.nameCn;
        if (o.name_en?.trim()) {
          const overrideEn = o.name_en.trim();
          // Ignore previously saved Chinese values in name_en.
          if (!hasChineseTextClient(overrideEn) || !gameEditForm.value.nameEn) {
            gameEditForm.value.nameEn = overrideEn;
          }
        }
        if (o.genres?.length) gameEditForm.value.genres = listToInputValue(o.genres);
        if (o.tags?.length) gameEditForm.value.tags = listToInputValue(o.tags);
        if (o.aliases?.length) gameEditForm.value.aliases = listToInputValue(o.aliases);
        gameEditForm.value.lockFromRefresh = !!o.lock_from_refresh;
        if (o.cover_url?.startsWith('http')) gameEditForm.value.coverUrl = o.cover_url;
        if (o.resolved_cover_url) setGameEditPreview(o.resolved_cover_url, true);
      }
    } catch { /* ignore */ }

    gameEditOpen.value = true;
  }

  function closeGameEditDialog() {
    gameEditOpen.value = false;
    gameEditTarget.value = null;
    revokeGameEditPreviewObjectUrl();
    gameEditPreview.value = '';
    coverLookupResults.value = [];
    document.activeElement?.blur?.();
  }

  function applyMetaToGameEditForm(meta = {}, onlyEmpty = false) {
    const set = (key, value) => {
      if (onlyEmpty && gameEditForm.value[key]?.trim()) return;
      if (value) gameEditForm.value[key] = value;
    };
    set('nameCn', meta.name_cn);
    set('nameEn', meta.name_en);
    set('genres', listToInputValue(meta.genres));
    set('tags', listToInputValue(meta.tags));
    set('aliases', listToInputValue(meta.aliases));
  }

  async function refreshGameEditMeta() {
    if (!gameEditTarget.value) return;
    const { appid, platform } = gameEditTarget.value;
    gameEditBusy.value = 'meta';
    try {
      const res = await fetch(
        `/api/games/${platform}/${encodeURIComponent(appid)}/refresh-meta`,
        { method: 'POST', headers: { ...auth.buildHeaders(), 'Content-Type': 'application/json' }, body: '{}' },
      );
      const data = await readApiJson(res);
      if (!res.ok) throw new Error(data.error || '刷新失败');
      if (data.meta) applyMetaToGameEditForm(data.meta);
      if (data.cover_url) {
        if (data.cover_url.startsWith('http')) gameEditForm.value.coverUrl = data.cover_url;
        setGameEditPreview(data.cover_url);
      }
      ui.showToast('已从 Steam 拉取最新资料');
    } catch (err) {
      ui.showToast(err.message, true);
    } finally {
      gameEditBusy.value = '';
    }
  }

  async function refetchGameEditCover() {
    if (!gameEditTarget.value) return;
    const { appid, platform } = gameEditTarget.value;
    gameEditBusy.value = 'cover';
    try {
      const res = await fetch(
        `/api/games/${platform}/${encodeURIComponent(appid)}/cover/refetch`,
        {
          method: 'POST',
          headers: { ...auth.buildHeaders(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ localize: gameEditForm.value.coverLocalize }),
        },
      );
      const data = await readApiJson(res);
      if (!res.ok) throw new Error(data.error || '获取封面失败');
      const coverUrl = data.resolved_cover_url || data.cover_url || '';
      if (coverUrl.startsWith('http')) gameEditForm.value.coverUrl = coverUrl;
      else gameEditForm.value.coverUrl = '';
      gameEditPreviewFile.value = null;
      setGameEditPreview(coverUrl, true);
      const coverUpdatedAt = Date.now();
      patchGameInList(appid, platform, { cover_url: coverUrl, cover_custom: true, cover_updated_at: coverUpdatedAt });
      ui.showToast(data.cover_local ? '已替换为平台封面并保存到本地' : '已替换为平台封面');
    } catch (err) {
      ui.showToast(err.message, true);
    } finally {
      gameEditBusy.value = '';
    }
  }

  async function lookupCoverCandidates() {
    const q = gameEditForm.value.lookupQuery.trim();
    if (q.length < 2) {
      ui.showToast('请至少输入 2 个字符', true);
      return;
    }
    gameEditBusy.value = 'lookup';
    try {
      const res = await fetch(`/api/games/lookup?q=${encodeURIComponent(q)}`);
      const data = await readApiJson(res);
      if (!res.ok) throw new Error(data.error || '搜索失败');
      coverLookupResults.value = data.results || [];
    } catch (err) {
      ui.showToast(err.message, true);
    } finally {
      gameEditBusy.value = '';
    }
  }

  function selectCoverLookupItem(item) {
    if (item.cover_url) {
      gameEditForm.value.coverUrl = item.cover_url;
      gameEditPreviewFile.value = null;
      setGameEditPreview(item.cover_url);
    }
    const nameCn = item.name_cn || item.name || '';
    if (nameCn) {
      gameEditForm.value.nameCn = nameCn;
      gameEditForm.value.lookupQuery = nameCn;
    }
    if (item.name && !gameEditForm.value.nameEn.trim()) gameEditForm.value.nameEn = item.name;
    if (item.genres?.length && !gameEditForm.value.genres.trim()) {
      gameEditForm.value.genres = item.genres.join(', ');
    }
  }

  async function saveGameEditDialog() {
    if (!gameEditTarget.value) return;
    const { appid, platform } = gameEditTarget.value;
    gameEditBusy.value = 'save';
    try {
      let uploadedCoverUrl = '';
      if (gameEditPreviewFile.value) {
        const form = new FormData();
        form.append('cover', gameEditPreviewFile.value);
        const uploadRes = await fetch(`/api/games/${platform}/${encodeURIComponent(appid)}/cover/upload`, {
          method: 'POST',
          headers: auth.buildHeaders(),
          body: form,
        });
        const uploadData = await readApiJson(uploadRes);
        if (!uploadRes.ok) throw new Error(uploadData.error || '上传失败');
        uploadedCoverUrl = uploadData.cover_url || '';
      }

      const body = {
        display_name: gameEditForm.value.displayName.trim(),
        name_cn: gameEditForm.value.nameCn.trim(),
        name_en: gameEditForm.value.nameEn.trim(),
        genres: gameEditForm.value.genres.trim(),
        tags: gameEditForm.value.tags.trim(),
        aliases: gameEditForm.value.aliases.trim(),
        cover_url: gameEditPreviewFile.value ? '' : gameEditForm.value.coverUrl.trim(),
        localize_cover: gameEditForm.value.coverLocalize,
        lock_from_refresh: gameEditForm.value.lockFromRefresh,
      };

      const res = await fetch(`/api/games/${platform}/${encodeURIComponent(appid)}/override`, {
        method: 'PUT',
        headers: { ...auth.buildHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await readApiJson(res);
      if (!res.ok) throw new Error(data.error || '保存失败');

      closeGameEditDialog();
      await fetchLibraryPage(null, pagination.value.page, { quiet: true, nested: true, suppressProgress: true });
      scheduleLayoutGameGrid();
      ui.showToast(body.lock_from_refresh ? '已保存并锁定' : '游戏资料已更新');
    } catch (err) {
      ui.showToast(err.message, true);
    } finally {
      gameEditBusy.value = '';
    }
  }

  function openRefreshDialog() {
    refreshOptions.value = {
      library: false, meta: false, metaAll: false,
      covers: false, coversAll: false, coversIncludeLocal: false,
      localizeCovers: false, localizeIncludeLocal: false, localizeRetryFailed: false,
    };
    refreshDialogOpen.value = true;
  }

  function closeRefreshDialog() {
    refreshDialogOpen.value = false;
  }

  function getRefreshPartsFromDialog() {
    const o = refreshOptions.value;
    const metaRefresh = o.meta;
    const coversRefresh = o.covers;
    return {
      library: o.library,
      meta: metaRefresh && !o.metaAll,
      metaAll: metaRefresh && o.metaAll,
      covers: coversRefresh && !o.coversAll,
      coversAll: coversRefresh && o.coversAll,
      coversIncludeLocal: coversRefresh && o.coversIncludeLocal,
      localizeCovers: o.localizeCovers,
      localizeIncludeLocal: o.localizeCovers && o.localizeIncludeLocal,
      localizeRetryFailed: o.localizeCovers && o.localizeRetryFailed,
    };
  }

  async function confirmRefreshDialog() {
    const parts = getRefreshPartsFromDialog();
    if (!isRefreshPartsActive(parts)) {
      ui.showToast('请至少选择一项要刷新的内容', true);
      return;
    }
    closeRefreshDialog();
    await fetchLibraryPage(parts, 1, { quiet: false });
  }

  async function pickRandomGame() {
    if (!libraryLoaded.value) {
      ui.showToast('请先加载游戏库', true);
      return;
    }
    try {
      const params = buildFilterQueryParams(1);
      params.set('platform', 'steam');
      if (auth.activeUser?.steamId) params.set('steamId', auth.activeUser.steamId);
      params.set('includeFamily', 'true');
      const res = await fetch(`/api/random?${params.toString()}`, { headers: auth.buildHeaders() });
      const data = await readApiJson(res);
      if (!res.ok) throw new Error(data.error || '随机抽取失败');
      randomGame.value = data.game;
      randomDialogOpen.value = true;
    } catch (err) {
      ui.showToast(err.message, true);
    }
  }

  async function openHiddenImportDialog() {
    if (!auth.activeUserId) {
      ui.showToast('请先连接 Steam 账号', true);
      return;
    }
    hiddenImportHint.value = '正在检测本机 Steam 路径...';
    hiddenImportPath.value = savedSteamPath.value || settings.steamPath || '';
    hiddenImportOpen.value = true;
    try {
      await settings.loadAppSettings().catch(() => {});
      if (!hiddenImportPath.value && settings.steamPath) hiddenImportPath.value = settings.steamPath;
      const res = await fetch('/api/hidden', { headers: auth.buildHeaders() });
      const data = await readApiJson(res);
      if (!res.ok) throw new Error(data.error || '读取配置失败');
      if (!hiddenImportPath.value && data.steamPath) hiddenImportPath.value = data.steamPath;
      const detected = (data.detectedPaths || []).join('；');
      hiddenImportHint.value = detected ? `已检测到：${detected}` : '未自动检测到 Steam 安装路径，请手动填写。';
    } catch (err) {
      hiddenImportHint.value = err.message;
    }
  }

  async function confirmHiddenImport() {
    hiddenImportBusy.value = true;
    try {
      const res = await fetch('/api/hidden/import-local', {
        method: 'POST',
        headers: { ...auth.buildHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ steamPath: hiddenImportPath.value.trim() }),
      });
      const data = await readApiJson(res);
      if (!res.ok) {
        const detected = (data.detectedPaths || []).join('；');
        throw new Error((data.error || '导入失败') + (detected ? ` 已检测：${detected}` : ''));
      }
      applyPlatformPrefSets(hiddenByPlatform.value, data.platforms);
      savedSteamPath.value = data.steamPath || hiddenImportPath.value.trim();
      hiddenImportOpen.value = false;
      await fetchLibraryPage(null, pagination.value.page, { quiet: true });
      ui.showToast(`已导入 ${data.imported} 款隐藏，新增 ${data.added} 款`);
    } catch (err) {
      hiddenImportHint.value = err.message;
      ui.showToast(err.message, true);
    } finally {
      hiddenImportBusy.value = false;
    }
  }

  async function openCollectionsImportDialog() {
    if (!auth.activeUserId) {
      ui.showToast('请先连接 Steam 账号', true);
      return;
    }
    collectionsImportHint.value = '正在检测本机 Steam 路径...';
    collectionsImportPath.value = savedSteamPath.value || settings.steamPath || '';
    collectionsImportOpen.value = true;
    try {
      await settings.loadAppSettings().catch(() => {});
      if (!collectionsImportPath.value && settings.steamPath) collectionsImportPath.value = settings.steamPath;
      const res = await fetch('/api/collections', { headers: auth.buildHeaders() });
      const data = await readApiJson(res);
      if (!res.ok) throw new Error(data.error || '读取配置失败');
      if (!collectionsImportPath.value && data.steamPath) collectionsImportPath.value = data.steamPath;
      const detected = (data.detectedPaths || []).join('；');
      const updatedAt = data.updatedAt ? `上次更新：${new Date(data.updatedAt).toLocaleString()}` : '尚未导入收藏夹';
      collectionsImportHint.value = detected
        ? `${updatedAt}。已检测到：${detected}`
        : `${updatedAt}。未自动检测到 Steam 安装路径，请手动填写。`;
    } catch (err) {
      collectionsImportHint.value = err.message;
    }
  }

  async function confirmCollectionsImport() {
    collectionsImportBusy.value = true;
    try {
      const res = await fetch('/api/collections/import-local', {
        method: 'POST',
        headers: { ...auth.buildHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ steamPath: collectionsImportPath.value.trim() }),
      });
      const data = await readApiJson(res);
      if (!res.ok) {
        const detected = (data.detectedPaths || []).join('；');
        throw new Error((data.error || '导入失败') + (detected ? ` 已检测：${detected}` : ''));
      }
      savedSteamPath.value = data.steamPath || collectionsImportPath.value.trim();
      collectionsImportOpen.value = false;
      if (libraryLoaded.value) await fetchLibraryPage(null, pagination.value.page, { quiet: true });
      ui.showToast(`已更新 ${data.imported} 个收藏夹`);
    } catch (err) {
      collectionsImportHint.value = err.message;
      ui.showToast(err.message, true);
    } finally {
      collectionsImportBusy.value = false;
    }
  }

  function resetGamesView(message = '请先加载游戏库') {
    libraryLoaded.value = false;
    libraryGameCount.value = 0;
    libraryFilteredCount.value = 0;
    libraryMeta.value = { source: '', cachedAt: null, sessionExpired: false, installedCount: 0, metaPending: 0 };
    pagination.value = { page: 1, pageSize: PAGE_SIZE, total: 0, totalPages: 1 };
    favoriteByPlatform.value = createEmptyPlatformSets();
    hiddenByPlatform.value = createEmptyPlatformSets();
    games.value = [];
    statsOverride.value = message;
  }

  async function loadEnvConfig() {
    await settings.loadAppSettings().catch(() => {});
    await auth.loadUsers();
    await auth.refreshAuthStatus();

    if (!auth.activeUserId) {
      resetGamesView('请先连接 Steam 账号');
      return;
    }

    await loadSteamUserPrefs();
    showGridLoading('正在加载游戏库...');
    statsOverride.value = '正在加载游戏库...';
    await fetchLibraryPage(null, 1, { quiet: false, autoFetchIfNoCache: true });
  }

  function onResize() {
    clearTimeout(gridLayoutTimer);
    gridLayoutTimer = setTimeout(() => relayoutGridIfNeeded(), 100);
  }

  function onFiltersClosed() {
    requestAnimationFrame(() => relayoutGridIfNeeded());
  }

  watch(filters, () => scheduleLibraryReload(), { deep: true });

  return {
    games,
    gridLoading,
    gridLoadingText,
    statsOverride,
    showGridLoading,
    hideGridLoading,
    gamesLoading,
    libraryLoaded,
    statsBarText,
    pagination,
    paginationVisible,
    pageInfoText,
    filters,
    filterOptions,
    controlsEnabled,
    showMetaContinue,
    metaEnriching,
    refreshDialogOpen,
    refreshOptions,
    refreshDialogHint,
    randomDialogOpen,
    randomGame,
    gameEditOpen,
    gameEditForm,
    gameEditPreview,
    gameEditSourceInfo,
    gameEditShowGenres,
    gameEditTarget,
    coverLookupResults,
    gameEditBusy,
    hiddenImportOpen,
    hiddenImportPath,
    hiddenImportHint,
    hiddenImportBusy,
    collectionsImportOpen,
    collectionsImportPath,
    collectionsImportHint,
    collectionsImportBusy,
    libraryMainRef,
    gameGridRef,
    libraryFooterRef,
    isFavorite,
    isHidden,
    isCardUpdating,
    layoutGameGrid,
    loadEnvConfig,
    fetchLibraryPage,
    continueMetaEnrichment,
    openRefreshDialog,
    closeRefreshDialog,
    confirmRefreshDialog,
    pickRandomGame,
    toggleFavorite,
    toggleHidden,
    confirmLaunchGame,
    confirmDownloadGame,
    launchGame,
    downloadGame,
    openGameStore,
    openGameEditDialog,
    closeGameEditDialog,
    refreshGameEditMeta,
    refetchGameEditCover,
    lookupCoverCandidates,
    selectCoverLookupItem,
    saveGameEditDialog,
    setGameEditPreview,
    setGameEditPreviewFromFile,
    updateGameEditCoverPreview,
    openHiddenImportDialog,
    confirmHiddenImport,
    openCollectionsImportDialog,
    confirmCollectionsImport,
    onResize,
    onFiltersClosed,
    formatHours,
  };
});
