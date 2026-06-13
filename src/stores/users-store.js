import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';

import { dirname, join } from 'path';

import { randomUUID } from 'crypto';
import { createTinyCache } from '../services/tiny-cache.js';



const DEFAULT_STORE = {

  activeUserId: '',

  users: [],

};



export function createUsersStore(dataDir) {

  const storePath = join(dataDir, 'users.json');
  const storeCache = createTinyCache();



  function ensureDir() {

    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

  }



  function normalizeStore(store) {
    const users = Array.isArray(store.users) ? store.users : [];
    if (!users.length) {
      return { activeUserId: '', users: [] };
    }
    const active = users.find((u) => u.id === store.activeUserId) || users[0];
    return { activeUserId: active.id, users: [active] };
  }

  function readStore() {

    const cached = storeCache.get();
    if (cached) return cached;

    ensureDir();

    if (!existsSync(storePath)) {
      const empty = { ...DEFAULT_STORE, users: [] };
      storeCache.set(empty);
      return empty;
    }



    try {

      const data = JSON.parse(readFileSync(storePath, 'utf-8'));

      const store = normalizeStore({

        activeUserId: data.activeUserId || '',

        users: Array.isArray(data.users) ? data.users : [],

      });
      storeCache.set(store);
      return store;

    } catch {

      const empty = { ...DEFAULT_STORE, users: [] };
      storeCache.set(empty);
      return empty;

    }

  }



  function writeStore(store) {

    ensureDir();

    writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf-8');
    storeCache.set({
      activeUserId: store.activeUserId || '',
      users: Array.isArray(store.users) ? store.users : [],
    });

  }



  function normalizeApiKey(raw) {
    return String(raw || '').trim().replace(/\s+/g, '');
  }

  function sanitizeUser(user) {

    const personaName = String(user.personaName || user.name || '').trim();

    return {

      id: user.id,

      name: personaName || '未命名',

      personaName,

      avatar: String(user.avatar || '').trim(),

      steamId: String(user.steamId || '').trim(),

      apiKey: normalizeApiKey(user.apiKey),

    };

  }



  function publicUser(user) {

    const safe = sanitizeUser(user);

    return {

      id: safe.id,

      name: safe.name,

      personaName: safe.personaName,

      avatar: safe.avatar,

      steamId: safe.steamId,

      hasApiKey: /^[A-Fa-f0-9]{32}$/i.test(safe.apiKey),

    };

  }

  function getUserApiKey(userId) {
    if (!userId) return '';
    const user = readStore().users.find((u) => u.id === userId);
    return normalizeApiKey(user?.apiKey);
  }



  function getActiveUser() {

    const store = readStore();

    const user = store.users.find((u) => u.id === store.activeUserId) || store.users[0];

    return user ? sanitizeUser(user) : null;

  }



  function getUserPaths(userId) {
    return {
      tokenPath: join(dataDir, `steam-token-${userId}.json`),
    };
  }



  function listUsers() {

    const store = readStore();

    return {

      activeUserId: store.activeUserId || store.users[0]?.id || '',

      users: store.users.map(publicUser),

    };

  }



  function saveUser(input) {

    const store = readStore();

    const existing = input.id ? store.users.find((u) => u.id === input.id) : null;
    const apiKey = input.apiKey !== undefined
      ? normalizeApiKey(input.apiKey)
      : (existing?.apiKey || '');

    const payload = sanitizeUser({

      id: input.id || randomUUID(),

      name: input.name ?? existing?.name,

      personaName: input.personaName ?? existing?.personaName,

      avatar: input.avatar ?? existing?.avatar,

      steamId: input.steamId ?? existing?.steamId,

      apiKey,

    });



    store.users = [payload];
    store.activeUserId = payload.id;

    writeStore(store);

    return publicUser(payload);

  }



  function findUserBySteamId(steamId) {
    const target = String(steamId || '').trim();
    if (!target) return null;
    const user = readStore().users.find((u) => u.steamId === target);
    return user ? publicUser(user) : null;
  }

  return {

    storePath,

    readStore,

    getActiveUser,

    getUserPaths,

    listUsers,

    saveUser,

    findUserBySteamId,

    sanitizeUser,

    publicUser,

    getUserApiKey,

  };

}


