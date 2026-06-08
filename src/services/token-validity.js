import { parseTokenExpiry } from '../steam/auth.js';

const EXPIRY_BUFFER_MS = 60_000;

export function isSteamTokenLocallyValid(token, storedExpiresAt = 0) {
  if (!token) return false;
  const jwtExp = parseTokenExpiry(token);
  const expiresAt = jwtExp || Number(storedExpiresAt) || 0;
  if (!expiresAt) return true;
  return Date.now() < expiresAt - EXPIRY_BUFFER_MS;
}
