<script setup>
import { computed, ref } from 'vue';
import {
  coverSrcForDisplay,
  formatHours,
} from '../utils/format.js';
import {
  gameCardGenreText,
  gameCardTagText,
  gameCoverAbbrev,
  gameCoverFallback,
  gameCoverImage,
  gameCoverPlaceholderColor,
  gameStoreUrl,
  gameSubtitle,
  gameTitle,
  getInputMethodInfo,
  ownerLabel,
  ownerNames,
  formatOwnerBadge,
} from '../utils/game.js';
import { useAuthStore } from '../stores/auth.js';
import { useLibraryStore } from '../stores/library.js';
import { useUiStore } from '../stores/ui.js';

const props = defineProps({
  game: { type: Object, required: true },
  random: { type: Boolean, default: false },
});

const auth = useAuthStore();
const library = useLibraryStore();
const ui = useUiStore();

const coverError = ref(false);
const coverLoaded = ref(false);

const title = computed(() => gameTitle(props.game));
const subtitle = computed(() => gameSubtitle(props.game));
const genreText = computed(() => gameCardGenreText(props.game));
const tagText = computed(() => gameCardTagText(props.game));
const coverSrc = computed(() => gameCoverImage(props.game) || gameCoverFallback(props.game));
const fallbackSrc = computed(() => gameCoverFallback(props.game));
const placeholderColor = computed(() => gameCoverPlaceholderColor(props.game.appid));
const placeholderAbbrev = computed(() => gameCoverAbbrev(title.value));
const inputMethod = computed(() => getInputMethodInfo(props.game));
const owners = computed(() => ownerNames(props.game));
const ownerText = computed(() => ownerLabel(props.game, auth.users));
const isFavorite = computed(() => library.isFavorite(props.game.appid));
const isHidden = computed(() => library.isHidden(props.game.appid));
const isUpdating = computed(() => library.isCardUpdating(props.game.appid, 'steam'));
const storeUrl = computed(() => gameStoreUrl(props.game));

function onCoverError(e) {
  const img = e.target;
  if (img.dataset.fallbackTried) {
    coverError.value = true;
    img.classList.add('is-hidden');
    return;
  }
  img.dataset.fallbackTried = '1';
  img.src = fallbackSrc.value;
}

function onCoverLoad(e) {
  coverLoaded.value = true;
  e.target.classList.remove('is-hidden');
}

async function onLaunch(e) {
  e.stopPropagation();
  if (!(await library.confirmLaunchGame(props.game.appid))) return;
  library.launchGame(props.game.appid).catch((err) => ui.showToast(err.message, true));
}

async function onDownload(e) {
  e.stopPropagation();
  if (!(await library.confirmDownloadGame(props.game.appid))) return;
  library.downloadGame(props.game.appid).catch((err) => ui.showToast(err.message, true));
}

function onStore(e) {
  e.stopPropagation();
  library.openGameStore(storeUrl.value);
}

function onEdit(e) {
  e.stopPropagation();
  e.currentTarget?.blur();
  library.openGameEditDialog(props.game);
}

function onFavorite(e) {
  e.stopPropagation();
  library.toggleFavorite(props.game.appid).catch((err) => ui.showToast(err.message, true));
}

function onHidden(e) {
  e.stopPropagation();
  library.toggleHidden(props.game.appid).catch((err) => ui.showToast(err.message, true));
}
</script>

<template>
  <article
    class="game-card"
    :class="{
      'is-installed': game.installed,
      'game-card--random': random,
      'is-updating': isUpdating,
    }"
    :data-appid="game.appid"
    data-platform="steam"
    :data-source-name="game.source_name || game.name || ''"
  >
    <div class="game-cover-wrap">
      <img
        v-if="coverSrc && !coverError"
        class="game-cover"
        :src="coverSrcForDisplay(coverSrc, game.cover_updated_at)"
        :alt="title"
        loading="lazy"
        @error="onCoverError"
        @load="onCoverLoad"
      >
      <div
        v-if="!coverLoaded && !coverError"
        class="game-cover-placeholder"
        :style="{ background: placeholderColor }"
      >
        {{ placeholderAbbrev }}
      </div>
      <div
        v-if="coverError"
        class="game-cover-placeholder is-fallback"
        :style="{ background: placeholderColor }"
      >
        {{ placeholderAbbrev }}
      </div>
      <span v-if="game.installed" class="game-installed-badge" title="已安装">已安装</span>
    </div>

    <div class="game-body">
      <div class="game-body-content">
        <h3 class="game-name">{{ title }}</h3>
        <div v-if="subtitle" class="game-subtitle">{{ subtitle }}</div>
        <div v-if="genreText" class="game-genres">{{ genreText }}</div>
        <div v-if="tagText" class="game-tags">{{ tagText }}</div>
        <div v-if="owners.length" class="game-owners">
          <span
            v-for="oid in owners.slice(0, 3)"
            :key="oid"
            class="badge badge-owner"
          >{{ formatOwnerBadge(oid, auth.users) }}</span>
          <span v-if="owners.length > 3" class="badge badge-owner">+{{ owners.length - 3 }}</span>
        </div>
        <div v-else-if="ownerText" class="game-owners">
          <span class="badge badge-owner">{{ formatOwnerBadge(ownerText, auth.users) }}</span>
        </div>
      </div>
      <div class="game-meta">
        <span class="game-input-methods">
          <span class="input-method-badge" :title="inputMethod.title">
            <svg v-if="inputMethod.type === 'keyboard'" class="input-method-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm2 4v2h2v-2H6zm3 0v2h2v-2H9zm3 0v2h2v-2h-2zm3 0v2h2v-2h-2zM6 13v2h12v-2H6z"/><path fill="currentColor" d="M10 18h4v2h-4z" opacity=".85"/></svg>
            <svg v-else class="input-method-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M8 6a5 5 0 0 0-5 5v2a5 5 0 0 0 5 5h8a5 5 0 0 0 5-5v-2a5 5 0 0 0-5-5H8zm2.5 3a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM7 13.5a1 1 0 0 1 2 0 1 1 0 0 1-2 0zm8 0a1 1 0 1 1 2 0 1 1 0 0 1-2 0z"/></svg>
          </span>
        </span>
        <span>{{ formatHours(game.playtime_forever) }}</span>
        <span v-if="game.from_family" class="badge badge-family">家庭</span>
        <span v-if="game.shareable === false" class="badge badge-warn">非共享</span>
      </div>
    </div>

    <div class="game-cover-actions">
      <div class="game-cover-actions-corner">
        <button
          type="button"
          class="btn-game-edit"
          :class="{ 'is-locked': game.lock_from_refresh }"
          title="编辑资料"
          aria-label="编辑资料"
          @click="onEdit"
        >✎</button>
        <button
          type="button"
          class="btn-hidden"
          :class="{ 'is-hidden': isHidden }"
          :title="isHidden ? '取消隐藏' : '隐藏'"
          :aria-label="isHidden ? '取消隐藏' : '隐藏'"
          @click="onHidden"
        >{{ isHidden ? '🙈' : '👁' }}</button>
        <button
          type="button"
          class="btn-favorite"
          :class="{ 'is-favorite': isFavorite }"
          :title="isFavorite ? '取消收藏' : '收藏'"
          :aria-label="isFavorite ? '取消收藏' : '收藏'"
          @click="onFavorite"
        >{{ isFavorite ? '★' : '☆' }}</button>
      </div>
      <div class="game-cover-actions-store-tl">
        <button
          type="button"
          class="btn-platform-store btn-platform-store-steam"
          aria-label="在 Steam 商店查看"
          title="Steam 商店"
          @click="onStore"
        >
          <svg class="btn-steam-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M12 2a9.99 9.99 0 0 0-9.91 8.68l5.66 2.34a2.89 2.89 0 0 1 1.64-.51c.08 0 .16.01.24.02l2.53-3.67V9.9c0-2.21 1.79-4 4-4s4 1.79 4 4-1.79 4-4 4h-.09l-3.67 2.53c.01.08.02.16.02.24 0 .58-.18 1.12-.51 1.64l2.34 5.66A9.99 9.99 0 1 0 12 2zm-1.18 14.58l-1.47-3.55 2.12-1.54.9 2.17-1.55 2.92zm7.06-2.65a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>
        </button>
      </div>
      <div class="game-cover-actions-primary">
        <div class="game-cover-actions-icon">
          <button
            v-if="game.installed"
            type="button"
            class="btn-game-launch"
            title="启动游戏"
            aria-label="启动游戏"
            @click="onLaunch"
          >
            <svg class="btn-play-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>
          </button>
          <button
            v-else
            type="button"
            class="btn-game-download"
            title="下载游戏"
            aria-label="下载游戏"
            @click="onDownload"
          >
            <svg class="btn-download-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zm-14 9v2h14v-2H5z"/></svg>
          </button>
        </div>
        <div class="game-cover-actions-title-wrap">
          <span class="game-cover-actions-title">{{ title }}</span>
        </div>
      </div>
    </div>

    <div v-if="isUpdating" class="game-cover-loading" aria-hidden="true">
      <span class="game-cover-spinner" />
    </div>
  </article>
</template>
