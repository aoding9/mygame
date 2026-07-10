import { readApiJson } from '../utils/format.js';

export async function readSseFetch(res, onPayload) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let lastPayload = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() || '';

    for (const chunk of chunks) {
      const line = chunk.split('\n').find((row) => row.startsWith('data: '));
      if (!line) continue;
      const payload = JSON.parse(line.slice(6));
      lastPayload = payload;
      if (payload.error) {
        const err = new Error(payload.error);
        if (payload.needAuth) err.needAuth = true;
        throw err;
      }
      onPayload(payload);
    }
  }

  return lastPayload;
}

export async function readSseStream(url, options = {}) {
  const { headers, signal, onPayload } = options;
  const res = await fetch(url, { headers, signal });
  if (!res.ok) {
    const data = await readApiJson(res);
    throw new Error(data.error || '请求失败');
  }
  return readSseFetch(res, onPayload);
}
