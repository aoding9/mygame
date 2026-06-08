import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { extname, join } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

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

  async function downloadToLocal(platform, appid, remoteUrl, userId = '') {
    const url = String(remoteUrl || '').trim();
    if (!url) throw new Error('封面链接为空');

    const res = await fetchImpl(url);
    if (!res.ok) throw new Error(`下载封面失败 (${res.status})`);

    const contentType = res.headers.get('content-type') || '';
    const ext = guessExt(url, contentType);
    const relative = `${platform}/${safeAppId(appid)}${ext}`;
    const fullPath = join(coversDir, relative);

    const existing = overrideStore.get(platform, appid, userId);
    if (existing?.cover_local && existing.cover_local !== relative) {
      try {
        unlinkSync(join(coversDir, existing.cover_local));
      } catch {
        /* ignore */
      }
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    await pipeline(Readable.from(buffer), createWriteStream(fullPath));

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

  async function saveUploadedFile(platform, appid, userId, buffer, originalName = '') {
    const ext = ALLOWED_EXT.has(extname(originalName).toLowerCase())
      ? extname(originalName).toLowerCase()
      : '.jpg';
    const relative = `${platform}/${safeAppId(appid)}${ext}`;
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

  async function localizeDefaultCovers(games, platform, resolveDefaultUrl, shouldSkip = () => false) {
    const pending = [];
    for (const game of games || []) {
      if (shouldSkip(game)) continue;
      const existing = overrideStore.get(platform, game.appid, '');
      if (existing?.cover_local || existing?.cover_url) continue;
      const remote = resolveDefaultUrl(game);
      if (!remote) continue;
      pending.push({ game, remote });
    }

    let done = 0;
    for (const item of pending.slice(0, 24)) {
      try {
        await downloadToLocal(platform, item.game.appid, item.remote, '');
        done += 1;
      } catch {
        /* ignore single cover failure */
      }
    }
    return done;
  }

  return {
    coversDir,
    downloadToLocal,
    setCoverUrl,
    saveUploadedFile,
    localizeDefaultCovers,
    publicLocalUrl,
  };
}
