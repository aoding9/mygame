/** 仅用于体积极小、读取频繁的数据（用户列表、平台账号、收藏等）。 */
export function createTinyCache() {
  let value = null;
  return {
    get() {
      return value;
    },
    set(next) {
      value = next;
    },
    clear() {
      value = null;
    },
  };
}

export function createKeyedTinyCache() {
  const map = new Map();
  return {
    get(key) {
      return map.get(key);
    },
    set(key, value) {
      map.set(key, value);
    },
    delete(key) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
  };
}
