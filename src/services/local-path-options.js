const DEFAULT_OPTIONS = {
  steamPath: '',
};

let options = { ...DEFAULT_OPTIONS };

export function setLocalPathOptions(next = {}) {
  options = {
    steamPath: String(next.steamPath || '').trim(),
  };
}

export function getLocalPathOptions() {
  return { ...options };
}
