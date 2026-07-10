import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from './load-env.js';

const DEFAULT_PORT = 3000;
const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

export function resolvePort(baseDir = projectRoot) {
  loadEnv(baseDir);

  const fromEnv = Number(process.env.PORT);
  if (Number.isInteger(fromEnv) && fromEnv > 0 && fromEnv < 65536) return fromEnv;

  return DEFAULT_PORT;
}

if (resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  console.log(resolvePort());
}
