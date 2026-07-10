import { watch } from 'vue';

export function useNativeDialog(openRef, dialogRef) {
  watch(
    openRef,
    (open) => {
      const el = dialogRef.value;
      if (!el) return;
      if (open) {
        if (!el.open) el.showModal();
      } else if (el.open) {
        el.close();
      }
    },
    { flush: 'post' },
  );
}

export function openExternal(url) {
  window.open(url, '_blank', 'noopener');
}
