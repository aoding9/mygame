import * as rt from '../runtime.js';
import {
  getAuthState,
  parseSteamIdFromToken,
  saveStoredToken,
  validateAccessToken,
} from '../../steam/auth.js';

export function registerAuthRoutes(app) {
  const {
  debugLog,
  fetchSteamProfile,
  getAccessToken,
  getApiKey,
  getRequestUser,
  getSteamIdInput,
  getSteamTokenContext,
  getUserAuthPaths,
  isSteamTokenValidForRequest,
  isValidApiKey,
  normalizeAccessToken,
  normalizeApiKey,
  resolveSteamId,
  steamFetch,
  usersStore,
  verifyApiKey
  } = rt;

  app.get('/api/users', (_req, res) => {
    res.json(rt.usersStore.listUsers());
  });

  app.get('/api/steam/profile', async (req, res) => {
    try {
      const apiKey = rt.getApiKey(req);
      await rt.verifyApiKey(apiKey);
      const steamId = await rt.resolveSteamId(rt.getSteamIdInput(req), apiKey);
      const profile = await rt.fetchSteamProfile(steamId, apiKey);
      if (!profile) {
        res.status(404).json({ error: '未找到该 Steam 用户' });
        return;
      }
      res.json(profile);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/users/refresh-profile', async (req, res) => {
    try {
      const user = rt.getRequestUser(req);
      if (!user?.id || !user.steamId) {
        res.status(400).json({ error: '请先选择用户' });
        return;
      }

      const token = rt.getAccessToken(req);
      if (!token) {
        res.status(401).json({ error: '需要 Steam Token', needAuth: true });
        return;
      }

      const existing = rt.usersStore.readStore().users.find((u) => u.id === user.id);
      const profile = await rt.fetchSteamProfile(user.steamId, getApiKey(req), token);
      if (!profile?.personaName && !profile?.avatar) {
        res.status(404).json({ error: '无法获取用户资料，请确认 Steam 社区资料为公开' });
        return;
      }

      const saved = rt.usersStore.saveUser({
        id: user.id,
        steamId: user.steamId,
        apiKey: existing?.apiKey,
        personaName: profile.personaName,
        avatar: profile.avatar,
        name: profile.personaName || user.name,
      });
      rt.debugLog('用户资料已更新', { userId: saved.id, steamId: saved.steamId, name: saved.personaName });
      res.json(saved);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/auth/status', (req, res) => {
    const { token } = rt.getSteamTokenContext(req);
    const user = rt.getRequestUser(req);
    res.json({
      ...getAuthState(),
      hasToken: !!token,
      valid: rt.isSteamTokenValidForRequest(req),
      userId: user?.id || '',
    });
  });

  app.post('/api/auth/preview', async (req, res) => {
    try {
      const token = rt.normalizeAccessToken(req.body?.token || '');
      if (!token) {
        res.status(400).json({ error: '请粘贴 webapi_token' });
        return;
      }

      const apiKeyInput = rt.normalizeApiKey(req.body?.apiKey || '');
      if (apiKeyInput && !rt.isValidApiKey(apiKeyInput)) {
        res.status(400).json({ error: 'API Key 格式不正确，应为 32 位字母和数字' });
        return;
      }

      const valid = await validateAccessToken(token, steamFetch);
      if (!valid) {
        res.status(400).json({ error: 'Token 无效或已过期，请重新获取' });
        return;
      }

      const steamId = parseSteamIdFromToken(token);
      if (!steamId) {
        res.status(400).json({ error: '无法从 Token 解析 Steam ID' });
        return;
      }

      const existingUser = rt.usersStore.findUserBySteamId(steamId);
      let profile = null;
      try {
        profile = await rt.fetchSteamProfile(steamId, apiKeyInput, token);
      } catch {
        profile = null;
      }

      res.json({
        steamId,
        personaName: profile?.personaName || '',
        avatar: profile?.avatar || '',
        duplicate: !!existingUser,
        existingUserId: existingUser?.id || '',
        existingUserName: existingUser?.personaName || existingUser?.name || '',
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/users/add-token', async (req, res) => {
    try {
      const token = rt.normalizeAccessToken(req.body?.token || '');
      if (!token) {
        res.status(400).json({ error: '请粘贴 webapi_token' });
        return;
      }

      const apiKeyInput = rt.normalizeApiKey(req.body?.apiKey || '');
      if (apiKeyInput && !rt.isValidApiKey(apiKeyInput)) {
        res.status(400).json({ error: 'API Key 格式不正确，应为 32 位字母和数字' });
        return;
      }

      const valid = await validateAccessToken(token, steamFetch);
      if (!valid) {
        res.status(400).json({ error: 'Token 无效或已过期，请在已登录 Steam 的浏览器中重新获取' });
        return;
      }

      const steamId = parseSteamIdFromToken(token);
      if (!steamId) {
        res.status(400).json({ error: '无法从 Token 解析 Steam ID' });
        return;
      }

      const existingUser = rt.usersStore.getActiveUser();
      if (existingUser) {
        res.status(409).json({
          error: '已配置 Steam 账号，请使用更新 Token',
          userId: existingUser.id,
          steamId: existingUser.steamId,
        });
        return;
      }

      let body = { steamId, apiKey: apiKeyInput };
      try {
        const profile = await rt.fetchSteamProfile(steamId, apiKeyInput, token);
        if (profile) {
          body.personaName = profile.personaName;
          body.avatar = profile.avatar;
          body.name = profile.personaName;
        }
      } catch {
        /* keep steam id only */
      }

      const saved = rt.usersStore.saveUser(body);
      const { tokenPath } = rt.usersStore.getUserPaths(saved.id);
      const expiresAt = saveStoredToken(tokenPath, token);
      rt.debugLog('用户已添加', { userId: saved.id, steamId: saved.steamId, name: saved.name });
      res.json({ ...saved, expiresAt, message: '用户已添加' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/auth/token', async (req, res) => {
    try {
      const token = rt.normalizeAccessToken(req.body?.token || '');
      if (!token) {
        res.status(400).json({ error: '请粘贴 webapi_token' });
        return;
      }

      const apiKeyInput = req.body?.apiKey !== undefined
        ? rt.normalizeApiKey(req.body.apiKey || '')
        : undefined;
      if (apiKeyInput && !rt.isValidApiKey(apiKeyInput)) {
        res.status(400).json({ error: 'API Key 格式不正确，应为 32 位字母和数字' });
        return;
      }

      const valid = await validateAccessToken(token, steamFetch);
      if (!valid) {
        res.status(400).json({ error: 'Token 无效或已过期，请在已登录 Steam 的 Edge 中重新打开 Token 页' });
        return;
      }

      const user = rt.getRequestUser(req);
      const { tokenPath } = rt.getUserAuthPaths(user);
      const expiresAt = saveStoredToken(tokenPath, token);

      const steamId = parseSteamIdFromToken(token);
      let savedUser = user ? rt.usersStore.publicUser(user) : null;
      if (user && steamId) {
        let profileBody = { id: user.id, steamId };
        if (apiKeyInput !== undefined) profileBody.apiKey = apiKeyInput;
        const profileKey = apiKeyInput !== undefined ? apiKeyInput : rt.getApiKey(req);
        try {
          const profile = await rt.fetchSteamProfile(steamId, profileKey, token);
          if (profile) {
            profileBody.personaName = profile.personaName;
            profileBody.avatar = profile.avatar;
            profileBody.name = profile.personaName;
          }
        } catch {
          /* ignore */
        }
        savedUser = rt.usersStore.saveUser(profileBody);
        rt.debugLog('Token 已保存并更新资料', { userId: savedUser.id, steamId: savedUser.steamId, name: savedUser.name });
      }

      res.json({
        ok: true,
        expiresAt,
        message: 'Token 已保存',
        user: savedUser,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
}
