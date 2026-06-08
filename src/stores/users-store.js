import { existsSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'fs';

import { dirname, join } from 'path';

import { randomUUID } from 'crypto';



const DEFAULT_STORE = {

  activeUserId: '',

  users: [],

};



export function createUsersStore(dataDir) {

  const storePath = join(dataDir, 'users.json');



  function ensureDir() {

    if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });

  }



  function readStore() {

    ensureDir();

    if (!existsSync(storePath)) return { ...DEFAULT_STORE, users: [] };



    try {

      const data = JSON.parse(readFileSync(storePath, 'utf-8'));

      return {

        activeUserId: data.activeUserId || '',

        users: Array.isArray(data.users) ? data.users : [],

      };

    } catch {

      return { ...DEFAULT_STORE, users: [] };

    }

  }



  function writeStore(store) {

    ensureDir();

    writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf-8');

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



    const index = store.users.findIndex((u) => u.id === payload.id);

    if (index >= 0) {

      store.users[index] = payload;

    } else {

      store.users.push(payload);

      store.activeUserId = payload.id;

    }



    writeStore(store);

    return publicUser(payload);

  }



  function findUserBySteamId(steamId) {
    const target = String(steamId || '').trim();
    if (!target) return null;
    const user = readStore().users.find((u) => u.steamId === target);
    return user ? publicUser(user) : null;
  }

  function switchUser(userId) {

    const store = readStore();

    if (!store.users.some((u) => u.id === userId)) {

      throw new Error('用户不存在');

    }

    store.activeUserId = userId;

    writeStore(store);

    return publicUser(store.users.find((u) => u.id === userId));

  }



  function deleteUser(userId) {

    const store = readStore();

    const target = store.users.find((u) => u.id === userId);

    if (!target) throw new Error('用户不存在');

    store.users = store.users.filter((u) => u.id !== userId);

    if (store.activeUserId === userId) {

      store.activeUserId = store.users[0]?.id || '';

    }

    writeStore(store);

    const { tokenPath } = getUserPaths(userId);

    if (existsSync(tokenPath)) unlinkSync(tokenPath);

    const profileDir = join(dataDir, `browser-profile-${userId}`);
    if (existsSync(profileDir)) rmSync(profileDir, { recursive: true, force: true });

    const favoritesPath = join(dataDir, `favorites-${userId}.json`);

    if (existsSync(favoritesPath)) unlinkSync(favoritesPath);

    const hiddenPath = join(dataDir, `hidden-${userId}.json`);
    if (existsSync(hiddenPath)) unlinkSync(hiddenPath);

    if (target.steamId) {
      const legacyHiddenPath = join(dataDir, `hidden-${target.steamId}.json`);
      if (existsSync(legacyHiddenPath)) unlinkSync(legacyHiddenPath);
    }

    return listUsers();

  }



  function initFromEnv(env) {

    const store = readStore();

    if (store.users.length) return listUsers();



    const steamId = String(env.STEAM_ID || '').trim();

    if (!steamId) return listUsers();



    const user = saveUser({

      name: '默认用户',

      steamId,

    });

    switchUser(user.id);

    return listUsers();

  }



  return {

    storePath,

    readStore,

    getActiveUser,

    getUserPaths,

    listUsers,

    saveUser,

    findUserBySteamId,

    switchUser,

    deleteUser,

    initFromEnv,

    sanitizeUser,

    publicUser,

    getUserApiKey,

  };

}


