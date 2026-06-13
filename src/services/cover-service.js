import { createWriteStream, existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import { extname, join } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import sharp from 'sharp';
import { isPortraitSteamCoverSource } from './steam-cover-urls.js';

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const MAX_LOCAL_COVER_BYTES = 100 * 1024;

function safeAppId(appid) {
  return String(appid || '').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function guessExt(url, contentType = '') {
  const fromUrl = extname(new URL(url).pathname).toLowerCase();
  if (ALLOWED_EXT.has(fromUrl)) return fromUrl;
  if (/png/i.test(contentType)) return '.png';
  if (/webp/i.test(contentType)) return '.webp';
  if (/gif/i.test(contentType)) return '.gif';
  return '.jpg';
}

async function compressCoverForLocal(buffer) {
  if (!buffer?.length || buffer.length <= MAX_LOCAL_COVER_BYTES) {
    return { buffer, ext: '' };
  }

  try {
    await sharp(buffer, { failOn: 'none' }).metadata();
  } catch {
    return { buffer, ext: '' };
  }

  const widths = [null, 512, 448, 384, 320, 256, 200];
  const qualities = [85, 75, 65, 55, 45, 35, 25, 20];
  let smallest = null;

  for (const width of widths) {
    for (const quality of qualities) {
      let pipeline = sharp(buffer, { failOn: 'none' });
      if (width) {
        pipeline = pipeline.resize({ width, withoutEnlargement: true });
      }
      const out = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
      if (!smallest || out.length < smallest.length) smallest = out;
      if (out.length <= MAX_LOCAL_COVER_BYTES) {
        return { buffer: out, ext: '.jpg' };
      }
    }
  }

  return { buffer: smallest || buffer, ext: '.jpg' };
}

export function createCoverService(dataDir, fetchImpl, overrideStore) {
  const coversDir = join(dataDir, 'covers');
  if (!existsSync(coversDir)) mkdirSync(coversDir, { recursive: true });

  function localDir(platform) {
    const dir = join(coversDir, platform);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
  }

  function publicLocalUrl(coverLocal) {
    if (!coverLocal) return '';
    return `/covers/${coverLocal.replace(/\\/g, '/')}`;
  }

  function buildLocalCoverIndex(platform) {
    const index = new Set();
    const dir = join(coversDir, platform);
    if (!existsSync(dir)) return index;
    for (const name of readdirSync(dir)) {
      const lower = name.toLowerCase();
      const dot = lower.indexOf('.');
      if (dot <= 0) continue;
      if (!ALLOWED_EXT.has(extname(lower))) continue;
      index.add(lower.slice(0, dot));
    }
    return index;
  }

  function hasLocalCoverInIndex(index, appid) {
    return index.has(safeAppId(appid).toLowerCase());
  }

  function findLocalCoverRelative(platform, appid) {
    const dir = join(coversDir, platform);
    if (!existsSync(dir)) return '';
    const base = safeAppId(appid);
    const prefix = `${base}.`;
    for (const name of readdirSync(dir)) {
      const lower = name.toLowerCase();
      if (!lower.startsWith(prefix)) continue;
      const ext = extname(lower);
      if (ALLOWED_EXT.has(ext)) return `${platform}/${name}`;
    }
    return '';
  }

  function hasProtectedLocalCover(platform, appid, userId = '') {
    if (overrideStore.isLocked(platform, appid, userId)) return true;
    const existing = overrideStore.get(platform, appid, userId);
    if (existing?.cover_local) {
      if (existsSync(join(coversDir, existing.cover_local))) return true;
      overrideStore.clearStaleLocalCover?.(platform, appid, userId);
    }
    return !!findLocalCoverRelative(platform, appid);
  }

  function hasLocalCoverFile(platform, appid, userId = '') {
    const existing = overrideStore.get(platform, appid, userId);
    if (existing?.cover_local && existsSync(join(coversDir, existing.cover_local))) return true;
    return !!findLocalCoverRelative(platform, appid);
  }

  function clearAppCoverFiles(platform, appid) {
    const dir = join(coversDir, platform);
    if (!existsSync(dir)) return;
    const base = safeAppId(appid);
    const prefix = `${base}.`;
    for (const name of readdirSync(dir)) {
      if (!name.toLowerCase().startsWith(prefix)) continue;
      try {
        unlinkSync(join(dir, name));
      } catch {
        /* ignore */
      }
    }
  }

  async function downloadToLocal(platform, appid, remoteUrl, userId = '') {
    const url = String(remoteUrl || '').trim();
    if (!url) throw new Error('封面链接为空');

    let res;
    try {
      res = await fetchImpl(url);
    } catch (err) {
      throw new Error(err.message || '下载封面失败');
    }
    if (!res.ok) throw new Error(`下载封面失败 (${res.status})`);

    const contentType = res.headers.get('content-type') || '';
    const ext = guessExt(url, contentType);
    const rawBuffer = Buffer.from(await res.arrayBuffer());
    const { buffer, ext: compressedExt } = await compressCoverForLocal(rawBuffer);
    const finalExt = compressedExt || ext;
    const relative = `${platform}/${safeAppId(appid)}${finalExt}`;
    localDir(platform);
    const fullPath = join(coversDir, relative);

    const existing = overrideStore.get(platform, appid, userId);
    if (existing?.cover_local && existing.cover_local !== relative) {
      try {
        unlinkSync(join(coversDir, existing.cover_local));
      } catch {
        /* ignore */
      }
    }

    writeFileSync(fullPath, buffer);

    overrideStore.updateCoverFields(platform, appid, userId, {
      cover_url: '',
      cover_local: relative,
      cover_source_url: url,
    });

    return {
      cover_url: publicLocalUrl(relative),
      cover_local: relative,
      source_url: url,
    };
  }

  async function setCoverUrl(platform, appid, userId, url, localize = false) {
    const remote = String(url || '').trim();
    if (!remote) throw new Error('请填写封面链接');

    if (localize) {
      return downloadToLocal(platform, appid, remote, userId);
    }

    overrideStore.updateCoverFields(platform, appid, userId, {
      cover_url: remote,
      cover_local: '',
      cover_source_url: remote,
    });

    return { cover_url: remote, cover_local: '', source_url: remote };
  }

  async function refetchCover(platform, appid, userId, remoteUrl, localize = false) {
    const urls = (Array.isArray(remoteUrl) ? remoteUrl : [remoteUrl])
      .map((item) => String(item || '').trim())
      .filter(Boolean);
    if (!urls.length) throw new Error('封面链接为空');

    clearAppCoverFiles(platform, appid);

    if (localize) {
      return downloadToLocalWithFallback(platform, appid, urls, userId);
    }

    const url = urls[0];

    overrideStore.updateCoverFields(platform, appid, userId, {
      cover_url: url,
      cover_local: '',
      cover_source_url: url,
    });

    return {
      cover_url: url,
      cover_local: '',
      source_url: url,
    };
  }

  async function saveUploadedFile(platform, appid, userId, buffer, originalName = '') {
    const ext = ALLOWED_EXT.has(extname(originalName).toLowerCase())
      ? extname(originalName).toLowerCase()
      : '.jpg';
    const relative = `${platform}/${safeAppId(appid)}${ext}`;
    localDir(platform);
    const fullPath = join(coversDir, relative);
    await pipeline(Readable.from(buffer), createWriteStream(fullPath));

    overrideStore.updateCoverFields(platform, appid, userId, {
      cover_url: '',
      cover_local: relative,
      cover_source_url: 'upload',
    });

    return {
      cover_url: publicLocalUrl(relative),
      cover_local: relative,
      source_url: 'upload',
    };
  }

  async function downloadToLocalWithFallback(platform, appid, urls, userId = '') {
    const list = (Array.isArray(urls) ? urls : [urls]).map((item) => String(item || '').trim()).filter(Boolean);
    if (!list.length) throw new Error('封面链接为空');

    let lastError = null;
    for (const url of list) {
      try {
        return await downloadToLocal(platform, appid, url, userId);
      } catch (err) {
        lastError = err;
        const retryable = /下载封面失败 \(404\)|下载封面失败 \(403\)|下载封面失败 \(410\)/.test(err.message || '');
        if (!retryable) throw err;
      }
    }
    throw lastError || new Error('下载封面失败');
  }

  function needsLandscapeCoverReplace(platform, appid, userId = '', overrideMap = null) {
    if (platform !== 'steam') return false;
    const override = overrideMap?.get(String(appid)) ?? overrideStore.get(platform, appid, userId || '');
    if (!override?.cover_local) return false;
    return isPortraitSteamCoverSource(override.cover_source_url);
  }

  async function runConcurrent(items, concurrency, worker) {
    if (!items.length) return;
    let cursor = 0;
    const limit = Math.max(1, Math.min(concurrency, items.length));
    const workers = Array.from({ length: limit }, async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        await worker(items[index], index);
      }
    });
    await Promise.all(workers);
  }

  async function localizeDefaultCovers(games, platform, resolveDefaultUrl, shouldSkip = () => false, options = {}) {
    const batchSize = Math.max(1, Number(options.batchSize) || 80);
    const concurrency = Math.max(1, Number(options.concurrency) || 10);
    const onError = typeof options.onError === 'function' ? options.onError : () => {};
    const onFail = typeof options.onFail === 'function' ? options.onFail : () => {};
    const shouldSkipAppId = typeof options.shouldSkipAppId === 'function' ? options.shouldSkipAppId : () => false;
    const overwriteLocal = !!options.overwriteLocal;
    overrideStore.clearStaleLocalCovers?.(platform);
    const localCoverIndex = buildLocalCoverIndex(platform);
    const overrideMap = overrideStore.loadMap?.(platform, '') || new Map();
    const skippedSet = options.skippedAppIds instanceof Set ? options.skippedAppIds : null;

    const pending = [];
    let skipped = 0;
    for (const game of games || []) {
      const appid = String(game?.appid || '').trim();
      if (!appid) continue;
      if (shouldSkip(game)) continue;
      if (skippedSet ? skippedSet.has(appid) : shouldSkipAppId(appid)) {
        skipped += 1;
        continue;
      }
      const override = overrideMap.get(appid);
      const locked = !!override?.lock_from_refresh;
      const hasLocal = locked
        || (override?.cover_local && hasLocalCoverInIndex(localCoverIndex, appid))
        || hasLocalCoverInIndex(localCoverIndex, appid);
      if (hasLocal && !needsLandscapeCoverReplace(platform, game.appid, '', overrideMap) && !overwriteLocal) continue;
      const remote = resolveDefaultUrl(game);
      const urls = Array.isArray(remote) ? remote : [remote].filter(Boolean);
      if (!urls.length) continue;
      pending.push({ game, urls });
    }

    const batch = pending.slice(0, batchSize);
    let done = 0;
    let failed = 0;
    await runConcurrent(batch, concurrency, async (item) => {
      try {
        await downloadToLocalWithFallback(platform, item.game.appid, item.urls, '');
        done += 1;
      } catch (err) {
        failed += 1;
        onError(item.game.appid, err);
        onFail(String(item.game.appid), err);
      }
    });

    const processed = done + failed;
    return {
      done,
      failed,
      pending: pending.length,
      remaining: Math.max(0, pending.length - processed),
      skipped,
    };
  }

  async function refetchAllCovers(games, platform, resolveRemoteUrls, options = {}) {
    const userId = String(options.userId || '');
    const includeLocal = !!options.includeLocal;
    const fillOnly = !!options.fillOnly;
    const concurrency = Math.max(1, Number(options.concurrency) || 6);
    const shouldSkipAppId = typeof options.shouldSkipAppId === 'function' ? options.shouldSkipAppId : () => false;
    const onProgress = typeof options.onProgress === 'function' ? options.onProgress : null;

    const pending = [];
    for (const game of games || []) {
      const appid = String(game?.appid || '').trim();
      if (!appid || shouldSkipAppId(appid)) continue;
      if (overrideStore.isLocked(platform, appid, userId)) continue;
      if (!includeLocal && hasProtectedLocalCover(platform, appid, userId)) continue;

      const existing = overrideStore.get(platform, appid, userId);
      const hadLocal = hasLocalCoverFile(platform, appid, userId);
      if (fillOnly && !needsLandscapeCoverReplace(platform, appid, userId)) {
        const coverUrl = String(existing?.cover_url || game?.cover_url || '').trim();
        if (coverUrl.startsWith('http') || coverUrl.startsWith('/covers/')) continue;
        if (hadLocal && !includeLocal) continue;
      }

      const remote = resolveRemoteUrls(game);
      const urls = Array.isArray(remote) ? remote : [remote].filter(Boolean);
      if (!urls.length) continue;

      pending.push({ appid, urls, localize: includeLocal && hadLocal });
    }

    const total = pending.length;
    let current = 0;
    let failed = 0;

    if (!total) {
      onProgress?.({ current: 0, total: 0, failed: 0, updates: [], complete: true });
      return { total: 0, done: 0, failed: 0 };
    }

    await runConcurrent(pending, concurrency, async (item) => {
      const updates = [];
      try {
        const result = await refetchCover(platform, item.appid, userId, item.urls, item.localize);
        updates.push({
          appid: item.appid,
          cover_url: result.cover_url,
          img_icon_url: result.cover_url,
        });
      } catch {
        failed += 1;
      } finally {
        current += 1;
        onProgress?.({
          current,
          total,
          failed,
          updates,
          complete: current >= total,
        });
      }
    });

    return { total, done: total - failed, failed };
  }

  return {
    coversDir,
    downloadToLocal,
    setCoverUrl,
    saveUploadedFile,
    localizeDefaultCovers,
    publicLocalUrl,
    hasProtectedLocalCover,
    findLocalCoverRelative,
    clearAppCoverFiles,
    refetchCover,
    refetchAllCovers,
  };
}
