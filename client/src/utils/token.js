export function decodeJwtPart(part) {
  try {
    const padded = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function parseSteamIdFromToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length < 2) return '';
  const payload = decodeJwtPart(parts[1]);
  if (!payload) return '';
  const sub = String(payload.sub || '');
  const match = sub.match(/(\d{17})$/);
  return match ? match[1] : '';
}

export function normalizeApiKeyInput(raw) {
  return String(raw || '').trim();
}

export function isValidApiKeyFormat(apiKey) {
  return /^[A-Za-z0-9]{32}$/.test(apiKey);
}

export function extractTokenFromPaste(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  if (text.startsWith('{')) {
    try {
      const obj = JSON.parse(text);
      if (obj.data?.webapi_token) return String(obj.data.webapi_token).trim();
      if (obj.webapi_token) return String(obj.webapi_token).trim();
    } catch {
      /* ignore */
    }
  }
  const match = text.match(/"webapi_token"\s*:\s*"([^"]+)"/);
  if (match) return match[1].trim();
  if (/^[A-Za-z0-9._-]+$/.test(text) && text.includes('.')) return text;
  return text;
}

export function applyTokenInputValue(raw) {
  return extractTokenFromPaste(raw);
}
