export function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

export function formatHours(minutes) {
  const hours = minutes / 60;
  if (hours < 1) return `${minutes} 分钟`;
  return `${hours.toFixed(1)} 小时`;
}

export async function readApiJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (text.trimStart().startsWith('<')) {
      throw new Error('服务未正常响应，请重新双击 mygame.bat 启动');
    }
    throw new Error('服务器返回了无效数据');
  }
}

export function debugLog(label, detail = undefined) {
  const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  if (detail === undefined) {
    console.log(`[MyGame ${time}] ${label}`);
    return;
  }
  console.log(`[MyGame ${time}] ${label}`, detail);
}

export function coverUrl(appid) {
  return `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/header.jpg`;
}

export function iconUrl(appid, hash) {
  if (hash) {
    return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${hash}.jpg`;
  }
  return coverUrl(appid);
}

export function coverSrcForDisplay(url, updatedAt = 0) {
  if (!url) return url;
  if (url.startsWith('/covers/')) {
    const v = updatedAt || Date.now();
    return `${url}${url.includes('?') ? '&' : '?'}v=${v}`;
  }
  return url;
}

export function formatDetectedPaths(list, emptyText) {
  const paths = Array.isArray(list) ? list.filter(Boolean) : [];
  if (!paths.length) return emptyText || '未检测到有效路径';
  return `已检测：${paths.join('；')}`;
}

export function listToInputValue(list) {
  return Array.isArray(list) ? list.filter(Boolean).join(', ') : '';
}

export function parseListInput(raw) {
  return String(raw || '')
    .split(/[,，;；\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
