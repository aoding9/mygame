<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import GameCard from './components/GameCard.vue';
import { useNativeDialog, openExternal } from './composables/useNativeDialog.js';
import { useAuthStore } from './stores/auth.js';
import { useLibraryStore } from './stores/library.js';
import { useSettingsStore } from './stores/settings.js';
import { useUiStore } from './stores/ui.js';

const auth = useAuthStore();
const library = useLibraryStore();
const settings = useSettingsStore();
const ui = useUiStore();

const confirmDialogRef = ref(null);
const randomDialogRef = ref(null);
const tokenDialogRef = ref(null);
const gameEditDialogRef = ref(null);
const refreshDialogRef = ref(null);
const hiddenImportDialogRef = ref(null);
const collectionsImportDialogRef = ref(null);
const settingsDialogRef = ref(null);

useNativeDialog(computed(() => ui.confirmOpen), confirmDialogRef);
useNativeDialog(computed(() => library.randomDialogOpen), randomDialogRef);
useNativeDialog(computed(() => auth.tokenDialogOpen), tokenDialogRef);
useNativeDialog(computed(() => library.gameEditOpen), gameEditDialogRef);
useNativeDialog(computed(() => library.refreshDialogOpen), refreshDialogRef);
useNativeDialog(computed(() => library.hiddenImportOpen), hiddenImportDialogRef);
useNativeDialog(computed(() => library.collectionsImportOpen), collectionsImportDialogRef);
useNativeDialog(computed(() => settings.settingsDialogOpen), settingsDialogRef);

const toastTarget = computed(() => {
  if (library.gameEditOpen && gameEditDialogRef.value) return gameEditDialogRef.value;
  if (library.refreshDialogOpen && refreshDialogRef.value) return refreshDialogRef.value;
  if (auth.tokenDialogOpen && tokenDialogRef.value) return tokenDialogRef.value;
  if (settings.settingsDialogOpen && settingsDialogRef.value) return settingsDialogRef.value;
  if (library.randomDialogOpen && randomDialogRef.value) return randomDialogRef.value;
  if (library.hiddenImportOpen && hiddenImportDialogRef.value) return hiddenImportDialogRef.value;
  if (library.collectionsImportOpen && collectionsImportDialogRef.value) return collectionsImportDialogRef.value;
  if (ui.confirmOpen && confirmDialogRef.value) return confirmDialogRef.value;
  return 'body';
});

const refreshBtnText = computed(() => {
  if (library.gamesLoading) return '加载中...';
  return '刷新数据';
});

const filtersToggleText = computed(() => (ui.filtersExpanded ? '收起筛选' : '筛选'));

function setLibraryMainRef(el) { library.libraryMainRef = el; }
function setGameGridRef(el) { library.gameGridRef = el; }
function setLibraryFooterRef(el) { library.libraryFooterRef = el; }

function onRefreshClick() {
  if (library.gamesLoading) return;
  library.openRefreshDialog();
}

async function onSaveToken() {
  await auth.saveToken(async () => {
    library.showGridLoading('正在加载游戏库...');
    library.statsOverride = '正在加载游戏库...';
    await library.fetchLibraryPage(null, 1, { quiet: false, autoFetchIfNoCache: true });
  });
}

function onCoverUrlInput() {
  if (library.gameEditForm.coverUrl.trim()) {
    library.setGameEditPreview(library.gameEditForm.coverUrl);
  } else {
    library.updateGameEditCoverPreview();
  }
}

function onCoverFileChange(e) {
  const file = e.target.files?.[0];
  if (file) {
    library.gameEditForm.coverUrl = '';
    library.setGameEditPreviewFromFile(file);
  } else {
    library.updateGameEditCoverPreview();
  }
}

function closeFilters() {
  ui.setFiltersExpanded(false);
  library.onFiltersClosed();
}

watch(() => ui.filtersExpanded, (expanded) => {
  if (!expanded) library.onFiltersClosed();
});

onMounted(() => {
  library.loadEnvConfig();
  window.addEventListener('resize', library.onResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', library.onResize);
});
</script>

<template>
  <div class="app">
    <header class="app-topbar panel compact-panel">
      <div class="topbar-left">
        <span class="topbar-brand"><span class="brand-icon">🎮</span> MyGame</span>
        <div class="topbar-left-actions">
          <button
            class="btn btn-secondary btn-sm"
            :disabled="library.gamesLoading || !library.libraryLoaded"
            @click="onRefreshClick"
          >{{ refreshBtnText }}</button>
          <button
            v-show="library.showMetaContinue"
            type="button"
            class="btn btn-secondary btn-sm"
            title="继续补全未完成的分类与标签（已完成的不会重复请求）"
            @click="library.continueMetaEnrichment()"
          >继续补全</button>
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            :disabled="!auth.activeUserId"
            title="从 Steam 客户端导入隐藏列表"
            @click="library.openHiddenImportDialog()"
          >导入隐藏</button>
          <button
            type="button"
            class="btn btn-secondary btn-sm"
            :disabled="!auth.activeUserId"
            title="从 Steam 客户端导入/更新收藏夹"
            @click="library.openCollectionsImportDialog()"
          >导入收藏夹</button>
        </div>
        <div class="load-progress load-progress-top" :class="{ hidden: !ui.progressVisible }">
          <div class="load-progress-track" :class="{ 'is-indeterminate': ui.progressIndeterminate }">
            <div
              class="load-progress-fill"
              :class="{ 'is-indeterminate': ui.progressIndeterminate }"
              :style="ui.progressIndeterminate ? {} : { width: `${ui.progressPercent()}%` }"
            />
          </div>
          <span class="load-progress-text">{{ ui.progressText() }}</span>
        </div>
      </div>
      <div class="topbar-center">
        <label class="topbar-search" title="支持中文名、简称，如 cs2、老头环">
          <input
            v-model="library.filters.search"
            type="search"
            placeholder="搜索游戏名、简称 cs2..."
            :disabled="!library.controlsEnabled"
            autocomplete="off"
            spellcheck="false"
          >
        </label>
      </div>
      <div class="topbar-actions">
        <div class="topbar-toolbar">
          <button
            class="btn btn-accent btn-sm"
            :disabled="!library.controlsEnabled"
            @click="library.pickRandomGame()"
          >🎲 随机</button>
          <button
            type="button"
            class="btn btn-secondary btn-sm filters-toggle"
            :aria-expanded="ui.filtersExpanded ? 'true' : 'false'"
            @click="ui.toggleFilters()"
          >{{ filtersToggleText }}</button>
        </div>
        <div class="topbar-account">
          <button
            type="button"
            class="topbar-icon-btn"
            :title="auth.tokenTitle"
            aria-label="Steam Token 状态"
            @click="auth.openTokenDialog(auth.activeUser ? 'update' : 'add')"
          >
            <span class="topbar-icon-glyph" aria-hidden="true">🔑</span>
            <span class="topbar-status-dot" :class="auth.tokenValid ? 'ok' : 'warn'" aria-hidden="true" />
          </button>
          <button type="button" class="topbar-icon-btn" title="设置" aria-label="设置" @click="settings.openSettingsDialog()">
            <span class="topbar-icon-glyph" aria-hidden="true">⚙</span>
          </button>
          <button
            type="button"
            class="user-menu-trigger"
            :class="{ 'is-add-only': auth.isAddOnly }"
            title="Steam 账号"
            @click="auth.openTokenDialog(auth.activeUser ? 'update' : 'add')"
          >
            <span v-if="auth.isAddOnly" class="user-menu-avatar user-menu-avatar-add" aria-hidden="true">+</span>
            <span v-else-if="auth.activeUser?.avatar" class="user-menu-avatar">
              <img :src="auth.activeUser.avatar" alt="" draggable="false">
            </span>
            <span v-else class="user-menu-avatar user-menu-avatar-default" aria-hidden="true" />
            <span v-if="!auth.isAddOnly" class="user-menu-name">{{ auth.userCardLabel(auth.activeUser) }}</span>
          </button>
        </div>
      </div>
    </header>

    <div class="app-main">
      <section :ref="setLibraryMainRef" class="library-main">
        <main
          :ref="setGameGridRef"
          class="game-grid"
          :class="{ 'is-loading': library.gridLoading }"
        >
          <div v-if="library.gridLoading" class="grid-loading-state">{{ library.gridLoadingText }}</div>
          <div v-else-if="!library.games.length" class="empty-state">
            {{ library.libraryLoaded ? '没有符合筛选条件的游戏' : library.statsBarText }}
          </div>
          <GameCard v-else v-for="game in library.games" :key="`${game.appid}-steam`" :game="game" />
        </main>
        <footer :ref="setLibraryFooterRef" class="library-footer">
          <div class="stats-bar stats-bar-footer">{{ library.statsBarText }}</div>
          <nav v-show="library.paginationVisible" class="pagination" aria-label="游戏库分页">
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              :disabled="library.pagination.page <= 1 || library.gamesLoading"
              @click="library.fetchLibraryPage(null, library.pagination.page - 1, { quiet: true, preserveProgress: true, nested: true })"
            >上一页</button>
            <span class="page-info">{{ library.pageInfoText }}</span>
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              :disabled="library.pagination.page >= library.pagination.totalPages || library.gamesLoading"
              @click="library.fetchLibraryPage(null, library.pagination.page + 1, { quiet: true, preserveProgress: true, nested: true })"
            >下一页</button>
          </nav>
        </footer>
      </section>
    </div>

    <div
      class="filters-backdrop"
      :class="{ hidden: !ui.filtersExpanded }"
      @click="closeFilters()"
    />
    <aside
      class="filters-drawer"
      :class="{ collapsed: !ui.filtersExpanded }"
      :aria-hidden="ui.filtersExpanded ? 'false' : 'true'"
    >
      <div class="filters-drawer-head">
        <h2 class="filters-drawer-title">筛选</h2>
        <button type="button" class="btn btn-ghost btn-icon" aria-label="关闭筛选" @click="closeFilters()">×</button>
      </div>
      <div class="filters-drawer-body">
        <div class="filters filters-drawer-grid">
          <label>
            类型
            <select v-model="library.filters.genre" :disabled="!library.controlsEnabled">
              <option value="">全部类型</option>
              <option v-for="g in library.filterOptions.genres" :key="g" :value="g">{{ g }}</option>
            </select>
          </label>
          <label>
            标签
            <input
              v-model="library.filters.tagSearch"
              type="search"
              list="filterTagOptions"
              placeholder="自走棋、rogue、卡牌..."
              :disabled="!library.controlsEnabled"
            >
            <datalist id="filterTagOptions">
              <option v-for="t in library.filterOptions.tags" :key="t" :value="t" />
            </datalist>
          </label>
          <label>
            所有者
            <select v-model="library.filters.ownerSteamId" :disabled="!library.controlsEnabled">
              <option value="">全部所有者</option>
              <option v-for="o in library.filterOptions.owners" :key="o.id" :value="o.id">{{ o.name }}</option>
            </select>
          </label>
          <label>
            Steam 收藏夹
            <select v-model="library.filters.steamCollectionId" :disabled="!library.controlsEnabled">
              <option value="">全部收藏夹</option>
              <option v-for="c in library.filterOptions.collections" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </label>
          <label>
            排序
            <select v-model="library.filters.sort" :disabled="!library.controlsEnabled">
              <option value="name-asc">名称 A-Z</option>
              <option value="name-desc">名称 Z-A</option>
              <option value="playtime-desc">游玩时长 ↓</option>
              <option value="playtime-asc">游玩时长 ↑</option>
              <option value="recent">最近游玩</option>
            </select>
          </label>
          <label>
            操作方式
            <select v-model="library.filters.inputMethod" :disabled="!library.controlsEnabled">
              <option value="">全部</option>
              <option value="keyboard_mouse">仅键鼠</option>
              <option value="controller_full">完全支持控制器</option>
              <option value="controller_partial">部分支持控制器</option>
              <option value="controller">任意控制器支持</option>
            </select>
          </label>
          <label>
            最少时长(h)
            <input v-model.number="library.filters.minHours" type="number" min="0" step="0.5" :disabled="!library.controlsEnabled">
          </label>
          <label>
            最多时长(h)
            <input v-model="library.filters.maxHours" type="number" min="0" step="0.5" placeholder="不限" :disabled="!library.controlsEnabled">
          </label>
          <div class="filter-checks filter-checks-steam">
            <label class="checkbox-label"><input v-model="library.filters.unplayed" type="checkbox" :disabled="!library.controlsEnabled"> 仅未玩过</label>
            <label class="checkbox-label"><input v-model="library.filters.shareableOnly" type="checkbox" :disabled="!library.controlsEnabled"> 仅可家庭共享</label>
            <label class="checkbox-label"><input v-model="library.filters.nonShareableOnly" type="checkbox" :disabled="!library.controlsEnabled"> 仅非共享</label>
            <label class="checkbox-label"><input v-model="library.filters.familyOnly" type="checkbox" :disabled="!library.controlsEnabled"> 仅家庭</label>
            <label class="checkbox-label"><input v-model="library.filters.installedOnly" type="checkbox" :disabled="!library.controlsEnabled"> 仅已安装</label>
          </div>
          <div class="filter-checks filter-checks-common">
            <label class="checkbox-label"><input v-model="library.filters.favoritesOnly" type="checkbox" :disabled="!library.controlsEnabled"> 仅收藏</label>
            <label class="checkbox-label"><input v-model="library.filters.hiddenOnly" type="checkbox" :disabled="!library.controlsEnabled"> 仅隐藏</label>
          </div>
        </div>
      </div>
    </aside>

    <Teleport :to="toastTarget">
      <div class="toast" :class="{ hidden: !ui.toastVisible, error: ui.toastError }">{{ ui.toastMessage }}</div>
    </Teleport>

    <!-- Confirm -->
    <dialog ref="confirmDialogRef" class="modal-dialog confirm-dialog" @cancel.prevent="ui.finishConfirm(false)">
      <div class="modal-content">
        <h2 class="modal-title">{{ ui.confirmTitle }}</h2>
        <p class="confirm-dialog-message">{{ ui.confirmMessage }}</p>
        <div class="dialog-actions dialog-actions-end">
          <button type="button" class="btn btn-secondary" @click="ui.finishConfirm(false)">取消</button>
          <button type="button" class="btn" :class="ui.confirmClass" @click="ui.finishConfirm(true)">{{ ui.confirmText }}</button>
        </div>
      </div>
    </dialog>

    <!-- Random -->
    <dialog ref="randomDialogRef" class="modal-dialog random-dialog" @cancel.prevent="library.randomDialogOpen = false">
      <div class="modal-content">
        <button class="dialog-close" aria-label="关闭" @click="library.randomDialogOpen = false">×</button>
        <GameCard v-if="library.randomGame" :game="library.randomGame" random />
        <div class="dialog-actions">
          <button class="btn btn-accent" @click="library.pickRandomGame()">再抽一次</button>
        </div>
      </div>
    </dialog>

    <!-- Token -->
    <dialog ref="tokenDialogRef" class="modal-dialog" @cancel.prevent="auth.closeTokenDialog()">
      <div class="modal-content">
        <button class="dialog-close" aria-label="关闭" @click="auth.closeTokenDialog()">×</button>
        <h2 class="modal-title">{{ auth.tokenDialogMode === 'add' ? '连接 Steam' : '更新 Token' }}</h2>
        <p class="step-text">在 Edge 登录 Steam 后，点「获取 Token」全选复制整页 JSON 粘贴即可，会自动提取 <code>webapi_token</code></p>
        <div class="token-input-row">
          <textarea
            v-model="auth.accessToken"
            rows="4"
            autocomplete="off"
            spellcheck="false"
            placeholder="粘贴整页 JSON 或 webapi_token"
            @input="auth.onTokenInput()"
            @paste="auth.onTokenPaste()"
          />
          <button type="button" class="btn btn-secondary" @click="openExternal('https://store.steampowered.com/pointssummary/ajaxgetasyncconfig')">获取 Token</button>
        </div>
        <div v-show="auth.tokenPreviewVisible" class="token-profile-preview" :class="{ loading: auth.tokenPreviewLoading }">
          <img v-if="auth.tokenPreviewAvatar" class="token-preview-avatar" :src="auth.tokenPreviewAvatar" alt="">
          <div class="token-preview-info">
            <div class="token-preview-name">{{ auth.tokenPreviewName }}</div>
            <div class="token-preview-id">{{ auth.tokenPreviewSteamId }}</div>
            <div class="token-preview-hint" :class="{ warn: auth.tokenPreviewWarn }">{{ auth.tokenPreviewHint }}</div>
          </div>
        </div>
        <label class="token-field">
          <span>API Key（可选，用于 Steam Web API）</span>
          <div class="token-input-row token-input-row-compact">
            <input v-model="auth.apiKey" type="text" autocomplete="off" spellcheck="false" maxlength="32" :placeholder="auth.apiKeyPlaceholder" @input="auth.scheduleTokenPreview()">
            <button type="button" class="btn btn-secondary" @click="openExternal('https://steamcommunity.com/dev/apikey')">申请 Key</button>
          </div>
        </label>
        <div class="dialog-actions dialog-actions-end">
          <button type="button" class="btn btn-secondary" @click="auth.closeTokenDialog()">取消</button>
          <button type="button" class="btn btn-primary" :disabled="auth.savingToken" @click="onSaveToken">{{ auth.savingToken ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </dialog>

    <!-- Game Edit -->
    <dialog ref="gameEditDialogRef" class="modal-dialog game-edit-dialog" @cancel.prevent="library.closeGameEditDialog()">
      <div class="modal-content game-edit-content">
        <header class="game-edit-header">
          <button class="dialog-close" aria-label="关闭" @click="library.closeGameEditDialog()">×</button>
          <h2 class="modal-title">编辑游戏资料</h2>
          <p class="step-text">{{ library.gameEditSourceInfo }}</p>
          <div class="game-edit-toolbar">
            <button type="button" class="btn btn-secondary btn-sm" :disabled="!!library.gameEditBusy" @click="library.refreshGameEditMeta()">
              {{ library.gameEditBusy === 'meta' ? '刷新中...' : '从平台刷新资料' }}
            </button>
          </div>
        </header>
        <div class="game-edit-body">
        <label class="token-field"><span>显示名称（优先展示）</span><input v-model="library.gameEditForm.displayName" type="text" placeholder="自定义显示名，可留空"></label>
        <label class="token-field"><span>中文名</span><input v-model="library.gameEditForm.nameCn" type="text" placeholder="中文名称"></label>
        <label class="token-field"><span>英文名 / 原名</span><input v-model="library.gameEditForm.nameEn" type="text" placeholder="英文名称或副标题"></label>
        <label v-show="library.gameEditShowGenres" class="token-field"><span>类型（逗号分隔）</span><input v-model="library.gameEditForm.genres" type="text" placeholder="动作, 角色扮演"></label>
        <label v-show="library.gameEditShowGenres" class="token-field"><span>标签（逗号分隔）</span><input v-model="library.gameEditForm.tags" type="text" placeholder="开放世界, 剧情丰富"></label>
        <label class="token-field"><span>搜索别名（逗号分隔）</span><input v-model="library.gameEditForm.aliases" type="text" placeholder="cs2, 老头环"></label>
        <div class="game-edit-preview-wrap">
          <span class="game-edit-preview-label">封面预览</span>
          <div class="cover-dialog-preview">
            <img v-if="library.gameEditPreview" :src="library.gameEditPreview" alt="封面预览">
            <div v-else class="empty-state">暂无封面</div>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" :disabled="!!library.gameEditBusy" @click="library.refetchGameEditCover()">
            {{ library.gameEditBusy === 'cover' ? '获取中...' : '重新获取封面' }}
          </button>
        </div>
        <label class="token-field"><span>封面图片链接</span><input v-model="library.gameEditForm.coverUrl" type="url" placeholder="https://..." @input="onCoverUrlInput"></label>
        <label class="token-field"><span>或上传封面图片</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" @change="onCoverFileChange"></label>
        <label class="token-field">
          <span>按游戏名搜索资料（Steam 商店）</span>
          <div class="token-input-row token-input-row-compact">
            <input v-model="library.gameEditForm.lookupQuery" type="search" placeholder="输入游戏名搜索">
            <button type="button" class="btn btn-secondary" :disabled="library.gameEditBusy === 'lookup'" @click="library.lookupCoverCandidates()">搜索</button>
          </div>
        </label>
        <div class="cover-lookup-results">
          <div v-if="!library.coverLookupResults.length" class="empty-state">搜索结果显示在此</div>
          <button
            v-for="(item, i) in library.coverLookupResults"
            :key="i"
            type="button"
            class="cover-lookup-item"
            @click="library.selectCoverLookupItem(item)"
          >
            <img v-if="item.cover_url" :src="item.cover_url" alt="">
            <span v-else class="cover-lookup-placeholder">无图</span>
            <span class="cover-lookup-name">{{ item.name_cn || item.name }}</span>
            <span class="cover-lookup-source">{{ item.source }}</span>
          </button>
        </div>
        <label class="checkbox-label"><input v-model="library.gameEditForm.coverLocalize" type="checkbox"> 外链封面保存时下载到本地</label>
        <label class="checkbox-label game-edit-lock"><input v-model="library.gameEditForm.lockFromRefresh" type="checkbox"> 锁定自定义内容，刷新游戏库时不被自动覆盖</label>
        </div>
        <footer class="game-edit-footer dialog-actions dialog-actions-end">
          <button type="button" class="btn btn-secondary" @click="library.closeGameEditDialog()">取消</button>
          <button type="button" class="btn btn-primary" :disabled="library.gameEditBusy === 'save'" @click="library.saveGameEditDialog()">{{ library.gameEditBusy === 'save' ? '保存中...' : '保存' }}</button>
        </footer>
      </div>
    </dialog>

    <!-- Refresh -->
    <dialog ref="refreshDialogRef" class="modal-dialog refresh-dialog" @cancel.prevent="library.closeRefreshDialog()">
      <div class="modal-content">
        <button class="dialog-close" aria-label="关闭" @click="library.closeRefreshDialog()">×</button>
        <h2 class="modal-title">刷新数据</h2>
        <p class="step-text">{{ library.refreshDialogHint }}</p>
        <div class="refresh-options">
          <label class="checkbox-label"><input v-model="library.refreshOptions.library" type="checkbox"> 游戏库列表（重新拉取拥有的游戏）</label>
          <div class="refresh-option-block">
            <label class="checkbox-label"><input v-model="library.refreshOptions.meta" type="checkbox"> 获取分类标签</label>
            <div v-show="library.refreshOptions.meta" class="refresh-sub-options">
              <label class="checkbox-label refresh-sub-option"><input v-model="library.refreshOptions.metaAll" type="checkbox"> 全部刷新</label>
            </div>
          </div>
          <div class="refresh-option-block">
            <label class="checkbox-label"><input v-model="library.refreshOptions.covers" type="checkbox"> 刷新封面</label>
            <div v-show="library.refreshOptions.covers" class="refresh-sub-options">
              <label class="checkbox-label refresh-sub-option"><input v-model="library.refreshOptions.coversAll" type="checkbox"> 全部刷新</label>
              <label class="checkbox-label refresh-sub-option"><input v-model="library.refreshOptions.coversIncludeLocal" type="checkbox"> 覆盖本地化的封面</label>
            </div>
          </div>
          <div class="refresh-option-block">
            <label class="checkbox-label"><input v-model="library.refreshOptions.localizeCovers" type="checkbox"> 封面本地化</label>
            <div v-show="library.refreshOptions.localizeCovers" class="refresh-sub-options">
              <label class="checkbox-label refresh-sub-option"><input v-model="library.refreshOptions.localizeIncludeLocal" type="checkbox"> 覆盖本地化的封面</label>
              <label class="checkbox-label refresh-sub-option"><input v-model="library.refreshOptions.localizeRetryFailed" type="checkbox"> 重新尝试之前下载失败的封面</label>
            </div>
          </div>
        </div>
        <p class="step-text refresh-protect-hint">已锁定自定义的游戏封面不会被覆盖。可在游戏卡片 ✎ 编辑中勾选「锁定自定义」。</p>
        <div class="dialog-actions dialog-actions-end">
          <button type="button" class="btn btn-secondary" @click="library.closeRefreshDialog()">取消</button>
          <button type="button" class="btn btn-primary" @click="library.confirmRefreshDialog()">开始刷新</button>
        </div>
      </div>
    </dialog>

    <!-- Hidden Import -->
    <dialog ref="hiddenImportDialogRef" class="modal-dialog" @cancel.prevent="library.hiddenImportOpen = false">
      <div class="modal-content">
        <button class="dialog-close" aria-label="关闭" @click="library.hiddenImportOpen = false">×</button>
        <h2 class="modal-title">从 Steam 客户端导入隐藏</h2>
        <p class="step-text">将读取本机 Steam 配置中的「已隐藏」分类，并合并到当前用户的隐藏列表（不会覆盖你手动隐藏的游戏）。</p>
        <label class="token-field">
          <span>Steam 安装路径（留空则使用「设置」中的路径或自动检测）</span>
          <input v-model="library.hiddenImportPath" type="text" autocomplete="off" spellcheck="false" placeholder="留空则尝试自动检测">
        </label>
        <p class="step-text">{{ library.hiddenImportHint }}</p>
        <div class="dialog-actions dialog-actions-end">
          <button type="button" class="btn btn-secondary" @click="library.hiddenImportOpen = false">取消</button>
          <button type="button" class="btn btn-primary" :disabled="library.hiddenImportBusy" @click="library.confirmHiddenImport()">{{ library.hiddenImportBusy ? '导入中...' : '开始导入' }}</button>
        </div>
      </div>
    </dialog>

    <!-- Collections Import -->
    <dialog ref="collectionsImportDialogRef" class="modal-dialog" @cancel.prevent="library.collectionsImportOpen = false">
      <div class="modal-content">
        <button class="dialog-close" aria-label="关闭" @click="library.collectionsImportOpen = false">×</button>
        <h2 class="modal-title">从 Steam 客户端导入收藏夹</h2>
        <p class="step-text">将读取本机 Steam 客户端的收藏夹配置，并更新筛选中的收藏夹列表。</p>
        <label class="token-field">
          <span>Steam 安装路径（留空则使用「设置」中的路径或自动检测）</span>
          <input v-model="library.collectionsImportPath" type="text" autocomplete="off" spellcheck="false" placeholder="留空则尝试自动检测">
        </label>
        <p class="step-text">{{ library.collectionsImportHint }}</p>
        <div class="dialog-actions dialog-actions-end">
          <button type="button" class="btn btn-secondary" @click="library.collectionsImportOpen = false">取消</button>
          <button type="button" class="btn btn-primary" :disabled="library.collectionsImportBusy" @click="library.confirmCollectionsImport()">{{ library.collectionsImportBusy ? '更新中...' : '更新收藏夹' }}</button>
        </div>
      </div>
    </dialog>

    <!-- Settings -->
    <dialog ref="settingsDialogRef" class="modal-dialog settings-dialog" @cancel.prevent="settings.closeSettingsDialog()">
      <div class="modal-content settings-modal-content">
        <button class="dialog-close" aria-label="关闭" @click="settings.closeSettingsDialog()">×</button>
        <div class="settings-head">
          <h2 class="modal-title">设置</h2>
          <p class="step-text settings-intro">配置保存在本机 data/app-settings.json，修改后立即生效，无需重启。</p>
        </div>
        <div class="settings-body">
          <section class="settings-section">
            <h3 class="settings-section-title">本地客户端路径</h3>
            <p class="settings-section-hint">留空则自动检测（注册表 / 常见目录）。</p>
            <label class="token-field settings-field">
              <span>Steam 安装目录</span>
              <input v-model="settings.steamPath" type="text" autocomplete="off" spellcheck="false" placeholder="如 D:\Steam">
            </label>
            <p class="settings-detected">{{ settings.steamDetectedText }}</p>
          </section>
          <section class="settings-section">
            <h3 class="settings-section-title">网络</h3>
            <label class="token-field settings-field">
              <span>HTTPS 代理（无法访问 Steam 时填写）</span>
              <input v-model="settings.httpsProxy" type="text" autocomplete="off" spellcheck="false" placeholder="如 http://127.0.0.1:7890">
            </label>
          </section>
          <section class="settings-section">
            <h3 class="settings-section-title">日志</h3>
            <label class="token-field settings-field">
              <span>日志级别</span>
              <select v-model="settings.logLevel">
                <option value="debug">debug</option>
                <option value="info">info</option>
                <option value="warn">warn</option>
                <option value="error">error</option>
              </select>
            </label>
            <label class="settings-check-row">
              <input v-model="settings.logToFile" type="checkbox">
              <span>写入文件（data/logs/）</span>
            </label>
          </section>
          <section class="settings-section">
            <h3 class="settings-section-title">封面清理</h3>
            <div class="settings-row-2">
              <label class="token-field settings-field">
                <span>无引用封面保留天数</span>
                <input v-model.number="settings.coverOrphanTtlDays" type="number" min="1" step="1" placeholder="3">
              </label>
              <label class="token-field settings-field">
                <span>清理任务间隔（小时）</span>
                <input v-model.number="settings.coverCleanupIntervalHours" type="number" min="1" step="1" placeholder="24">
              </label>
            </div>
          </section>
        </div>
        <div class="dialog-actions dialog-actions-end settings-footer">
          <button type="button" class="btn btn-secondary" @click="settings.closeSettingsDialog()">取消</button>
          <button type="button" class="btn btn-primary" :disabled="settings.saving || settings.loading" @click="settings.saveSettings()">{{ settings.saving ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </dialog>
  </div>
</template>
