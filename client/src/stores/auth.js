import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { debugLog, readApiJson } from '../utils/format.js';
import {
  applyTokenInputValue,
  isValidApiKeyFormat,
  normalizeApiKeyInput,
} from '../utils/token.js';
import { userCardLabel } from '../utils/game.js';
import { useUiStore } from './ui.js';

export const useAuthStore = defineStore('auth', () => {
  const users = ref([]);
  const activeUserId = ref('');
  const tokenValid = ref(false);
  const tokenTitle = ref('Token 未配置');

  const tokenDialogOpen = ref(false);
  const tokenDialogMode = ref('add');
  const accessToken = ref('');
  const apiKey = ref('');
  const tokenPreviewVisible = ref(false);
  const tokenPreviewLoading = ref(false);
  const tokenPreviewAvatar = ref('');
  const tokenPreviewName = ref('');
  const tokenPreviewSteamId = ref('');
  const tokenPreviewHint = ref('');
  const tokenPreviewWarn = ref(false);
  const savingToken = ref(false);

  let tokenPreviewTimer = null;
  let tokenPreviewRequestId = 0;

  const activeUser = computed(() => users.value.find((u) => u.id === activeUserId.value) || null);
  const isAddOnly = computed(() => !activeUser.value);
  const apiKeyPlaceholder = computed(() => {
    if (tokenDialogMode.value === 'update' && activeUser.value?.hasApiKey) {
      return '已配置 Key，留空则不修改';
    }
    return '32 位 Key（可选）';
  });

  function buildHeaders() {
    const headers = {};
    if (activeUserId.value) headers['X-User-Id'] = activeUserId.value;
    return headers;
  }

  async function loadUsers() {
    const res = await fetch('/api/users');
    const data = await readApiJson(res);
    users.value = data.users || [];
    activeUserId.value = data.activeUserId || users.value[0]?.id || '';
    debugLog('用户已加载', { activeUserId: activeUserId.value });
    await refreshMissingUserProfiles();
  }

  async function refreshMissingUserProfiles() {
    const user = activeUser.value;
    if (!user?.steamId || (user.personaName && user.avatar)) return;
    try {
      const res = await fetch('/api/users/refresh-profile', {
        method: 'POST',
        headers: buildHeaders(),
      });
      const data = await readApiJson(res);
      if (!res.ok) return;
      users.value = [data];
      activeUserId.value = data.id;
      debugLog('用户资料已补全', { userId: user.id, name: data.personaName || data.name });
    } catch {
      /* ignore */
    }
  }

  async function refreshAuthStatus() {
    try {
      const res = await fetch('/api/auth/status', { headers: buildHeaders() });
      const status = await readApiJson(res);
      if (status.valid) {
        tokenTitle.value = 'Token 有效';
        tokenValid.value = true;
      } else if (status.hasToken) {
        tokenTitle.value = 'Token 已过期';
        tokenValid.value = false;
      } else {
        tokenTitle.value = 'Token 未配置';
        tokenValid.value = false;
      }
      return tokenValid.value;
    } catch {
      tokenTitle.value = 'Token 状态未知';
      tokenValid.value = false;
      return false;
    }
  }

  function clearTokenPreview() {
    clearTimeout(tokenPreviewTimer);
    tokenPreviewRequestId += 1;
    tokenPreviewVisible.value = false;
    tokenPreviewLoading.value = false;
    tokenPreviewAvatar.value = '';
    tokenPreviewName.value = '';
    tokenPreviewSteamId.value = '';
    tokenPreviewHint.value = '';
    tokenPreviewWarn.value = false;
  }

  function scheduleTokenPreview() {
    clearTimeout(tokenPreviewTimer);
    tokenPreviewTimer = setTimeout(() => {
      previewTokenProfile().catch(() => {});
    }, 350);
  }

  async function previewTokenProfile() {
    const token = applyTokenInputValue(accessToken.value);
    if (!token) {
      clearTokenPreview();
      return;
    }
    const key = normalizeApiKeyInput(apiKey.value);
    if (key && !isValidApiKeyFormat(key)) {
      tokenPreviewVisible.value = true;
      tokenPreviewLoading.value = false;
      tokenPreviewAvatar.value = '';
      tokenPreviewName.value = '无法识别账号';
      tokenPreviewSteamId.value = '';
      tokenPreviewHint.value = 'API Key 应为 32 位字母和数字';
      tokenPreviewWarn.value = true;
      return;
    }

    const requestId = ++tokenPreviewRequestId;
    tokenPreviewVisible.value = true;
    tokenPreviewLoading.value = true;
    tokenPreviewName.value = '正在获取资料...';
    tokenPreviewSteamId.value = '';
    tokenPreviewHint.value = '';
    tokenPreviewWarn.value = false;

    try {
      const res = await fetch('/api/auth/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, apiKey: key || undefined }),
      });
      const data = await readApiJson(res);
      if (requestId !== tokenPreviewRequestId) return;
      if (!res.ok) throw new Error(data.error || '获取资料失败');
      tokenPreviewAvatar.value = data.avatar || '';
      tokenPreviewName.value = data.personaName || `Steam 用户 ${String(data.steamId || '').slice(-4)}`;
      tokenPreviewSteamId.value = data.steamId || '';
      tokenPreviewHint.value = tokenDialogMode.value === 'add'
        ? 'Token 有效，保存后将连接该账号'
        : 'Token 有效，保存后将更新账号';
      tokenPreviewWarn.value = false;
    } catch (err) {
      if (requestId !== tokenPreviewRequestId) return;
      tokenPreviewAvatar.value = '';
      tokenPreviewName.value = '无法识别账号';
      tokenPreviewSteamId.value = '';
      tokenPreviewHint.value = err.message;
      tokenPreviewWarn.value = true;
    } finally {
      if (requestId === tokenPreviewRequestId) tokenPreviewLoading.value = false;
    }
  }

  function openTokenDialog(mode) {
    tokenDialogMode.value = mode;
    accessToken.value = '';
    apiKey.value = '';
    clearTokenPreview();
    tokenDialogOpen.value = true;
  }

  function closeTokenDialog() {
    tokenDialogOpen.value = false;
    accessToken.value = '';
    apiKey.value = '';
    clearTokenPreview();
  }

  function onTokenInput() {
    accessToken.value = applyTokenInputValue(accessToken.value);
    scheduleTokenPreview();
  }

  function onTokenPaste() {
    setTimeout(() => {
      accessToken.value = applyTokenInputValue(accessToken.value);
      scheduleTokenPreview();
    }, 0);
  }

  async function ensureTokenReady() {
    const valid = await refreshAuthStatus();
    if (valid) return true;
    openTokenDialog(activeUser.value ? 'update' : 'add');
    throw new Error('请先配置 Steam Token');
  }

  async function saveToken(onSaved) {
    const ui = useUiStore();
    const token = applyTokenInputValue(accessToken.value);
    if (!token) {
      ui.showToast('请粘贴 webapi_token 或整页 JSON', true);
      return;
    }
    accessToken.value = token;

    const isAdd = tokenDialogMode.value === 'add';
    if (isAdd && activeUser.value) {
      ui.showToast('已配置 Steam 账号，请使用更新 Token', true);
      return;
    }

    const key = normalizeApiKeyInput(apiKey.value);
    if (key && !isValidApiKeyFormat(key)) {
      ui.showToast('API Key 应为 32 位字母和数字', true);
      return;
    }

    const url = isAdd ? '/api/users/add-token' : '/api/auth/token';
    const headers = { 'Content-Type': 'application/json', ...buildHeaders() };
    const body = { token };
    if (isAdd) body.apiKey = key;
    else if (apiKey.value.trim() !== '') body.apiKey = key;

    savingToken.value = true;
    try {
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
      const data = await readApiJson(res);
      if (!res.ok) throw new Error(data.error || '保存失败');

      if (isAdd) activeUserId.value = data.id;
      closeTokenDialog();

      const profileName = data.personaName || data.name || data.user?.personaName || data.user?.name || '';
      await loadUsers();
      await refreshAuthStatus();
      ui.showToast(profileName
        ? `${isAdd ? 'Steam 已连接' : 'Token 已更新'}：${profileName}`
        : (isAdd ? 'Steam 已连接' : 'Token 已更新'));

      await onSaved?.();
    } finally {
      savingToken.value = false;
    }
  }

  return {
    users,
    activeUserId,
    tokenValid,
    tokenTitle,
    activeUser,
    isAddOnly,
    tokenDialogOpen,
    tokenDialogMode,
    accessToken,
    apiKey,
    apiKeyPlaceholder,
    tokenPreviewVisible,
    tokenPreviewLoading,
    tokenPreviewAvatar,
    tokenPreviewName,
    tokenPreviewSteamId,
    tokenPreviewHint,
    tokenPreviewWarn,
    savingToken,
    buildHeaders,
    loadUsers,
    refreshAuthStatus,
    openTokenDialog,
    closeTokenDialog,
    onTokenInput,
    onTokenPaste,
    scheduleTokenPreview,
    previewTokenProfile,
    ensureTokenReady,
    saveToken,
    userCardLabel,
  };
});
