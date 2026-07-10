import { defineStore } from 'pinia';
import { ref } from 'vue';
import { formatDetectedPaths, readApiJson } from '../utils/format.js';
import { useUiStore } from './ui.js';

export const useSettingsStore = defineStore('settings', () => {
  const settingsDialogOpen = ref(false);
  const saving = ref(false);
  const loading = ref(false);

  const steamPath = ref('');
  const httpsProxy = ref('');
  const logLevel = ref('info');
  const logToFile = ref(true);
  const coverOrphanTtlDays = ref(3);
  const coverCleanupIntervalHours = ref(24);
  const detectedSteam = ref([]);

  const steamDetectedText = ref('');

  function applyFromData(data) {
    steamPath.value = data.steamPath || '';
    httpsProxy.value = data.httpsProxy || '';
    logLevel.value = data.logLevel || 'info';
    logToFile.value = data.logToFile !== false;
    coverOrphanTtlDays.value = data.coverOrphanTtlDays ?? 3;
    coverCleanupIntervalHours.value = data.coverCleanupIntervalHours ?? 24;
    detectedSteam.value = data.detected?.steam || [];
    steamDetectedText.value = formatDetectedPaths(detectedSteam.value, '未检测到 Steam 安装目录');
  }

  function readForm() {
    return {
      steamPath: steamPath.value.trim(),
      httpsProxy: httpsProxy.value.trim(),
      logLevel: logLevel.value || 'info',
      logToFile: logToFile.value,
      coverOrphanTtlDays: Math.max(1, Number(coverOrphanTtlDays.value) || 3),
      coverCleanupIntervalHours: Math.max(1, Number(coverCleanupIntervalHours.value) || 24),
    };
  }

  async function loadAppSettings() {
    const res = await fetch('/api/settings');
    const data = await readApiJson(res);
    if (!res.ok) throw new Error(data.error || '读取设置失败');
    applyFromData(data);
    return data;
  }

  async function openSettingsDialog() {
    settingsDialogOpen.value = true;
    steamDetectedText.value = '';
    loading.value = true;
    try {
      await loadAppSettings();
    } catch (err) {
      useUiStore().showToast(err.message, true);
      steamDetectedText.value = formatDetectedPaths([], '未检测到 Steam 安装目录');
    } finally {
      loading.value = false;
    }
  }

  function closeSettingsDialog() {
    settingsDialogOpen.value = false;
  }

  async function saveSettings() {
    const ui = useUiStore();
    const payload = readForm();
    saving.value = true;
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await readApiJson(res);
      if (!res.ok) throw new Error(data.error || '保存失败');
      applyFromData(data);
      closeSettingsDialog();
      ui.showToast('设置已保存');
    } catch (err) {
      ui.showToast(err.message, true);
    } finally {
      saving.value = false;
    }
  }

  return {
    settingsDialogOpen,
    saving,
    loading,
    steamPath,
    httpsProxy,
    logLevel,
    logToFile,
    coverOrphanTtlDays,
    coverCleanupIntervalHours,
    steamDetectedText,
    loadAppSettings,
    openSettingsDialog,
    closeSettingsDialog,
    saveSettings,
  };
});
