import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NAME_BLACKLIST = new Set(['gamename', 'l1', '', 'ubisoft game', 'name']);

function convertUbisoftPackedInt(value) {
  let data = value;
  if (data > 256 * 256) {
    data -= 128 * 256 * Math.ceil(data / (256 * 256));
    data -= 128 * Math.ceil(data / 256);
  } else if (data > 256) {
    data -= 128 * Math.ceil(data / 256);
  }
  return data;
}

function parseConfigurationHeader(header, secondEight = false) {
  try {
    let offset = 1;
    let multiplier = 1;
    let recordSize = 0;
    let tmpSize = 0;

    if (secondEight) {
      while (header[offset] !== 0x08 || (header[offset] === 0x08 && header[offset + 1] === 0x08)) {
        recordSize += header[offset] * multiplier;
        multiplier *= 256;
        offset += 1;
        tmpSize += 1;
      }
    } else {
      while (header[offset] !== 0x08 || recordSize === 0) {
        recordSize += header[offset] * multiplier;
        multiplier *= 256;
        offset += 1;
        tmpSize += 1;
      }
    }

    recordSize = convertUbisoftPackedInt(recordSize);
    offset += 1;

    multiplier = 1;
    let launchId = 0;
    while (header[offset] !== 0x10 || header[offset + 1] === 0x10) {
      launchId += header[offset] * multiplier;
      multiplier *= 256;
      offset += 1;
    }
    launchId = convertUbisoftPackedInt(launchId);
    offset += 1;

    multiplier = 1;
    let launchId2 = 0;
    while (header[offset] !== 0x1a || (header[offset] === 0x1a && header[offset + 1] === 0x1a)) {
      launchId2 += header[offset] * multiplier;
      multiplier *= 256;
      offset += 1;
    }
    launchId2 = convertUbisoftPackedInt(launchId2);

    if (recordSize - offset < 128 && recordSize >= 128) {
      tmpSize -= 1;
      recordSize += 1;
    }

    return {
      objectSize: recordSize - offset,
      installId: launchId,
      launchId: launchId2 === 0 || launchId2 === launchId ? launchId : launchId2,
      headerSize: offset + tmpSize + 1,
    };
  } catch {
    return { objectSize: 0, installId: 0, launchId: 0, headerSize: 10 };
  }
}

function parseConfigurationRecords(buffer) {
  const records = [];
  let globalOffset = 0;

  while (globalOffset < buffer.length) {
    const data = buffer.subarray(globalOffset);
    const { objectSize, installId, launchId, headerSize } = parseConfigurationHeader(data);
    if (objectSize > 500 && installId) {
      records.push({
        installId,
        launchId,
        offset: globalOffset + headerSize,
        size: objectSize,
      });
    }
    const prevOffset = globalOffset;
    globalOffset += objectSize + headerSize;

    if (globalOffset < buffer.length && buffer[globalOffset] !== 0x0a) {
      const retry = parseConfigurationHeader(data, true);
      globalOffset = prevOffset + retry.objectSize + retry.headerSize;
    }
  }

  return records;
}

function parseOwnershipHeader(header) {
  if (header[0] !== 0x0a) return null;

  let offset = 1;
  let multiplier = 1;
  let recordSize = 0;
  let tmpSize = 0;

  while (header[offset] !== 0x08 || recordSize === 0) {
    recordSize += header[offset] * multiplier;
    multiplier *= 256;
    offset += 1;
    tmpSize += 1;
  }
  recordSize = convertUbisoftPackedInt(recordSize);
  offset += 1;

  multiplier = 1;
  let launchId = 0;
  while (header[offset] !== 0x10 || header[offset + 1] === 0x10) {
    launchId += header[offset] * multiplier;
    multiplier *= 256;
    offset += 1;
  }
  launchId = convertUbisoftPackedInt(launchId);
  offset += 1;

  multiplier = 1;
  let launchId2 = 0;
  while (header[offset] !== 0x22) {
    launchId2 += header[offset] * multiplier;
    multiplier *= 256;
    offset += 1;
  }
  launchId2 = convertUbisoftPackedInt(launchId2);

  return {
    launchId,
    launchId2,
    recordSize: recordSize + tmpSize + 1,
  };
}

function parseOwnershipLaunchIds(buffer) {
  const ids = new Set();
  let globalOffset = 0x108;

  while (globalOffset < buffer.length) {
    const parsed = parseOwnershipHeader(buffer.subarray(globalOffset));
    if (!parsed?.launchId) break;
    ids.add(parsed.launchId);
    if (parsed.launchId2 !== parsed.launchId) ids.add(parsed.launchId2);
    globalOffset += parsed.recordSize;
  }

  return ids;
}

function extractGameFieldsFromYamlChunk(text) {
  if (!text.includes('start_game')) return null;

  const spaceMatch = text.match(/space_id:\s*([0-9a-f-]{36})/i);
  const spaceId = spaceMatch?.[1] || '';
  if (!UUID_RE.test(spaceId)) return null;

  let name = '';
  const localized = text.match(/GAMENAME:\s*([^\n]+)/i);
  if (localized?.[1]) {
    name = localized[1].trim().replace(/^['"]|['"]$/g, '');
  }

  if (!name || NAME_BLACKLIST.has(name.toLowerCase())) {
    const directName = text.match(/(?:^|\n)\s*name:\s*([^\n]+)/im);
    if (directName?.[1]) name = directName[1].trim().replace(/^['"]|['"]$/g, '');
  }

  const rootName = text.match(/root:\s*\r?\n\s*name:\s*['"]?([^'"\n]+)/i)?.[1]?.trim().replace(/^['"]|['"]$/g, '') || '';
  const gameIdentifier = text.match(/game_identifier:\s*([^\n]+)/i)?.[1]?.trim().replace(/^['"]|['"]$/g, '') || '';
  const shortcutName = text.match(/shortcut_name:\s*([^\n]+)/i)?.[1]?.trim().replace(/^['"]|['"]$/g, '') || '';

  if (!name || NAME_BLACKLIST.has(name.toLowerCase())) {
    if (gameIdentifier) name = gameIdentifier;
  }
  if ((!name || NAME_BLACKLIST.has(name.toLowerCase())) && rootName) {
    name = rootName;
  }

  let nameEn = '';
  for (const candidate of [gameIdentifier, rootName, shortcutName]) {
    const value = String(candidate || '').trim();
    if (!value || /[\u4e00-\u9fff]/.test(value)) continue;
    if (/[a-z]/i.test(value)) {
      nameEn = value;
      break;
    }
  }

  const homepageUrl = text.match(/homepage_url:\s*([^\n]+)/i)?.[1]?.trim().replace(/^['"]|['"]$/g, '') || '';
  const aboutUrl = text.match(/about_url:\s*([^\n]+)/i)?.[1]?.trim().replace(/^['"]|['"]$/g, '') || '';
  const storeSlug = deriveUbisoftStoreSlugFromUrl(homepageUrl || aboutUrl);

  return {
    spaceId,
    name: name || nameEn || spaceId,
    name_en: nameEn || (!/[\u4e00-\u9fff]/.test(name) ? name : ''),
    name_cn: /[\u4e00-\u9fff]/.test(name) ? name : '',
    gameIdentifier,
    homepageUrl,
    aboutUrl,
    storeSlug,
    slug: storeSlug,
    productSlug: storeSlug,
  };
}

function deriveUbisoftStoreSlugFromUrl(rawUrl) {
  const value = String(rawUrl || '').trim();
  if (!value) return '';
  try {
    const pathname = new URL(value).pathname.replace(/\/+$/, '');
    const gameMatch = pathname.match(/\/game\/([^/]+)\/([^/?#]+)/i);
    if (gameMatch) {
      return `${gameMatch[1]}-${gameMatch[2]}`.replace(/_/g, '-').toLowerCase();
    }
    const segment = pathname.split('/').filter(Boolean).pop() || '';
    if (!segment || /^(home|index|en-gb|en-us|zh-cn)$/i.test(segment)) {
      const parts = pathname.split('/').filter(Boolean);
      const fallback = parts.length >= 2 ? parts[parts.length - 2] : '';
      return fallback.replace(/_/g, '-').toLowerCase();
    }
    return segment.replace(/_/g, '-').toLowerCase();
  } catch {
    return '';
  }
}

function resolveUbisoftConnectBaseDirs() {
  const dirs = [];
  const localAppData = process.env.LOCALAPPDATA || '';
  if (localAppData) {
    dirs.push(path.join(localAppData, 'Ubisoft Game Launcher'));
  }

  if (process.platform === 'win32') {
    try {
      const output = execSync(
        'reg query "HKLM\\SOFTWARE\\Ubisoft\\Launcher" /v InstallDir',
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      );
      const match = output.match(/InstallDir\s+REG_SZ\s+(.+)/i);
      const installDir = match?.[1]?.trim();
      if (installDir && !dirs.includes(installDir)) dirs.unshift(installDir);
    } catch {
      /* registry unavailable */
    }
  }

  return [...new Set(dirs.filter(Boolean))];
}

function readBinaryFile(filePath) {
  try {
    return fs.readFileSync(filePath);
  } catch {
    return null;
  }
}

function listOwnershipCandidates(baseDir, profileId) {
  const ownershipDir = path.join(baseDir, 'cache', 'ownership');
  const candidates = [];
  const preferred = path.join(ownershipDir, profileId);
  if (profileId) candidates.push(preferred);

  try {
    const entries = fs.readdirSync(ownershipDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      const fullPath = path.join(ownershipDir, entry.name);
      if (!candidates.includes(fullPath)) candidates.push(fullPath);
    }
  } catch {
    /* ownership dir missing */
  }

  return candidates;
}

function loadOwnedGamesFromBaseDir(baseDir, profileId, logger) {
  const log = (label, detail) => {
    if (logger) logger(label, detail);
  };

  const configPath = path.join(baseDir, 'cache', 'configuration', 'configurations');
  const configBuffer = readBinaryFile(configPath);
  if (!configBuffer) {
    log('本地 Connect 缓存 跳过', { baseDir, reason: '缺少 configurations' });
    return [];
  }

  let best = [];

  for (const ownershipPath of listOwnershipCandidates(baseDir, profileId)) {
    const ownershipBuffer = readBinaryFile(ownershipPath);
    if (!ownershipBuffer) continue;

    const ownedLaunchIds = parseOwnershipLaunchIds(ownershipBuffer);
    const records = parseConfigurationRecords(configBuffer);
    const games = [];
    const seenSpaceIds = new Set();

    for (const record of records) {
      if (!ownedLaunchIds.has(record.installId) && !ownedLaunchIds.has(record.launchId)) continue;

      const chunk = configBuffer.subarray(record.offset, record.offset + record.size);
      const fields = extractGameFieldsFromYamlChunk(chunk.toString('utf8'));
      if (!fields || seenSpaceIds.has(fields.spaceId)) continue;

      seenSpaceIds.add(fields.spaceId);
      games.push({
        spaceId: fields.spaceId,
        id: fields.spaceId,
        name: fields.name,
        installId: String(record.installId),
        launchId: String(record.launchId),
        source: 'local-connect',
        owned: true,
      });
    }

    if (games.length > best.length) {
      best = games;
    }
  }

  if (best.length) {
    log('本地 Connect 缓存 命中', { baseDir, games: best.length });
  } else {
    log('本地 Connect 缓存 无匹配游戏', { baseDir });
  }

  return best;
}

export function readUbisoftLocalOwnedGames(profileId, logger) {
  if (!profileId || process.platform !== 'win32') {
    return [];
  }

  for (const baseDir of resolveUbisoftConnectBaseDirs()) {
    const games = loadOwnedGamesFromBaseDir(baseDir, profileId, logger);
    if (games.length) return games;
  }

  return [];
}
