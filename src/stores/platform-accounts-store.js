import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const DEFAULT = {
  epic: null,
  ubisoft: null,
};

export function createPlatformAccountsStore(dataDir) {
  const storePath = join(dataDir, 'platform-accounts.json');

  function ensureDir() {
    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
  }

  function readStore() {
    ensureDir();
    if (!existsSync(storePath)) return { ...DEFAULT };
    try {
      const data = JSON.parse(readFileSync(storePath, 'utf-8'));
      return {
        epic: data.epic || null,
        ubisoft: data.ubisoft || null,
      };
    } catch {
      return { ...DEFAULT };
    }
  }

  function writeStore(store) {
    ensureDir();
    writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf-8');
  }

  function publicEpic(account) {
    if (!account?.accessToken) return null;
    return {
      accountId: account.accountId || '',
      displayName: account.displayName || '',
      expiresAt: account.expiresAt || 0,
      connected: true,
    };
  }

  function publicUbisoft(account) {
    if (!account?.ticket) return null;
    return {
      profileId: account.profileId || '',
      displayName: account.displayName || '',
      email: account.email || '',
      expiresAt: account.expiresAt || 0,
      connected: true,
    };
  }

  function getEpic() {
    return readStore().epic;
  }

  function getUbisoft() {
    return readStore().ubisoft;
  }

  function saveEpic(account) {
    const store = readStore();
    store.epic = account;
    writeStore(store);
    return publicEpic(account);
  }

  function saveUbisoft(account) {
    const store = readStore();
    store.ubisoft = account;
    writeStore(store);
    return publicUbisoft(account);
  }

  function clearEpic() {
    const store = readStore();
    store.epic = null;
    writeStore(store);
  }

  function clearUbisoft() {
    const store = readStore();
    store.ubisoft = null;
    writeStore(store);
  }

  function listPublic() {
    const store = readStore();
    return {
      epic: publicEpic(store.epic),
      ubisoft: publicUbisoft(store.ubisoft),
    };
  }

  return {
    getEpic,
    getUbisoft,
    saveEpic,
    saveUbisoft,
    clearEpic,
    clearUbisoft,
    listPublic,
  };
}
