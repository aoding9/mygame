import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname } from 'path';

export function getAuthState() {
  return {
    status: 'idle',
    message: '请手动粘贴 Steam Token',
    error: null,
  };
}

function decodeJwtPart(part) {
  if (!part) return null;
  try {
    let padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const remainder = padded.length % 4;
    if (remainder) padded += '='.repeat(4 - remainder);
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

export function parseTokenPayload(token) {
  const parts = String(token || '').trim().split('.');
  return decodeJwtPart(parts[1]) || decodeJwtPart(parts[0]) || null;
}

export function parseTokenExpiry(token) {
  const json = parseTokenPayload(token);
  if (!json) return null;
  if (json.exp) return json.exp * 1000;
  if (json.expire) return json.expire * 1000;
  return null;
}

export function parseSteamIdFromToken(token) {
  const parts = String(token || '').trim().split('.');
  for (const part of [parts[1], parts[0], ...parts.slice(2)]) {
    const json = decodeJwtPart(part);
    if (!json) continue;
    for (const key of ['sub', 'steamid', 'steam_id', 'steamId']) {
      const raw = String(json[key] || '').trim();
      if (/^\d{17}$/.test(raw)) return raw;
    }
    const matched = String(json.sub || '').match(/\d{17}/);
    if (matched) return matched[0];
  }
  return '';
}

export function extractWebApiToken(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';

  try {
    const json = JSON.parse(text);
    if (json?.data?.webapi_token) return String(json.data.webapi_token).trim();
    if (json?.webapi_token) return String(json.webapi_token).trim();
  } catch {
    /* not json */
  }

  const quoted = text.match(/"webapi_token"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
  if (quoted) return quoted[1].replace(/\\"/g, '"').trim();

  const jwt = text.match(/ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
  if (jwt) return jwt[0];

  return text.replace(/^["']|["']$/g, '').trim();
}

export function loadStoredToken(tokenPath) {
  if (!existsSync(tokenPath)) return null;

  try {
    const data = JSON.parse(readFileSync(tokenPath, 'utf-8'));
    if (!data.token) return null;
    if (data.expiresAt && Date.now() > data.expiresAt - 60000) return null;
    return data.token;
  } catch {
    return null;
  }
}

export function saveStoredToken(tokenPath, token) {
  const expiresAt = parseTokenExpiry(token) || Date.now() + 20 * 60 * 60 * 1000;
  mkdirSync(dirname(tokenPath), { recursive: true });
  writeFileSync(
    tokenPath,
    JSON.stringify({ token, savedAt: Date.now(), expiresAt }, null, 2),
    'utf-8'
  );
  process.env.STEAM_ACCESS_TOKEN = token;
  return expiresAt;
}

export async function validateAccessToken(token, steamFetch) {
  if (!token) return false;

  try {
    const params = new URLSearchParams({
      access_token: token,
      family_groupid: '0',
      include_own: 'true',
      format: 'json',
    });
    const res = await steamFetch(
      `https://api.steampowered.com/IFamilyGroupsService/GetSharedLibraryApps/v1/?${params}`
    );
    const text = await res.text();
    if (text.trimStart().startsWith('<')) return false;
    const json = JSON.parse(text);
    return !!json.response;
  } catch {
    return false;
  }
}
