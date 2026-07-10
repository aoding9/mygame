import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const toastMessage = ref('');
  const toastError = ref(false);
  const toastVisible = ref(false);
  let toastTimer = null;

  const progressVisible = ref(false);
  const progressLabel = ref('');
  const progressCurrent = ref(0);
  const progressTotal = ref(0);
  const progressFailed = ref(null);
  const progressIndeterminate = ref(false);
  const progressStageIndex = ref(0);
  const progressStageTotal = ref(1);
  let progressHoldCount = 0;

  const filtersExpanded = ref(false);

  const confirmOpen = ref(false);
  const confirmTitle = ref('');
  const confirmMessage = ref('');
  const confirmText = ref('确定');
  const confirmClass = ref('btn-primary');
  let confirmResolve = null;

  function showToast(message, isError = false) {
    toastMessage.value = message;
    toastError.value = isError;
    toastVisible.value = true;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastVisible.value = false;
    }, 3200);
  }

  function holdProgress() {
    progressHoldCount += 1;
  }

  function releaseProgress() {
    progressHoldCount = Math.max(0, progressHoldCount - 1);
    if (progressHoldCount === 0) hideProgress();
  }

  function resetProgressHold() {
    progressHoldCount = 0;
    hideProgress();
  }

  function isProgressHeld() {
    return progressHoldCount > 0;
  }

  function updateProgress(options = {}) {
    const {
      label = '处理中',
      current = 0,
      total = 0,
      failed = null,
      indeterminate = false,
      stageIndex = 0,
      stageTotal = 1,
    } = options;

    progressVisible.value = true;
    progressLabel.value = label;
    progressCurrent.value = current;
    progressTotal.value = total;
    progressFailed.value = failed;
    progressIndeterminate.value = indeterminate;
    progressStageIndex.value = stageIndex;
    progressStageTotal.value = stageTotal;
  }

  function hideProgress() {
    if (progressHoldCount > 0) return;
    progressVisible.value = false;
    progressIndeterminate.value = false;
    progressCurrent.value = 0;
    progressTotal.value = 0;
    progressFailed.value = null;
    progressLabel.value = '';
  }

  function progressPercent() {
    if (progressIndeterminate.value) return 0;
    const stageTotal = progressStageTotal.value || 1;
    const slice = 100 / stageTotal;
    const inner = progressTotal.value > 0
      ? (progressCurrent.value / progressTotal.value) * slice
      : slice * 0.5;
    return Math.min(100, Math.round(progressStageIndex.value * slice + inner));
  }

  function progressText() {
    const stageHint = progressStageTotal.value > 1
      ? `（${progressStageIndex.value + 1}/${progressStageTotal.value}）`
      : '';
    const showFailed = progressFailed.value !== null && progressFailed.value !== undefined;
    if (progressIndeterminate.value) {
      const stats = showFailed
        ? ` · ${progressCurrent.value}/${progressTotal.value} · 失败 ${progressFailed.value}`
        : (progressTotal.value > 0 ? ` · ${progressCurrent.value}/${progressTotal.value}` : '');
      return `${progressLabel.value}${stageHint}${stats}`;
    }
    if (showFailed) {
      return `${progressLabel.value}${stageHint} · ${progressCurrent.value}/${progressTotal.value} · 失败 ${progressFailed.value}`;
    }
    const countText = progressTotal.value > 0 ? ` · ${progressCurrent.value}/${progressTotal.value}` : '';
    return `${progressLabel.value}${stageHint}${countText}`;
  }

  function setFiltersExpanded(expanded) {
    filtersExpanded.value = expanded;
  }

  function toggleFilters() {
    filtersExpanded.value = !filtersExpanded.value;
  }

  function showConfirm({ title, message, confirmText: text = '确定', confirmClass: cls = 'btn-primary' }) {
    return new Promise((resolve) => {
      confirmResolve = resolve;
      confirmTitle.value = title;
      confirmMessage.value = message;
      confirmText.value = text;
      confirmClass.value = cls;
      confirmOpen.value = true;
    });
  }

  function finishConfirm(confirmed) {
    const resolve = confirmResolve;
    confirmResolve = null;
    confirmOpen.value = false;
    resolve?.(confirmed);
  }

  return {
    toastMessage,
    toastError,
    toastVisible,
    progressVisible,
    progressLabel,
    progressCurrent,
    progressTotal,
    progressFailed,
    progressIndeterminate,
    progressStageIndex,
    progressStageTotal,
    filtersExpanded,
    confirmOpen,
    confirmTitle,
    confirmMessage,
    confirmText,
    confirmClass,
    showToast,
    holdProgress,
    releaseProgress,
    resetProgressHold,
    isProgressHeld,
    updateProgress,
    hideProgress,
    progressPercent,
    progressText,
    setFiltersExpanded,
    toggleFilters,
    showConfirm,
    finishConfirm,
  };
});
