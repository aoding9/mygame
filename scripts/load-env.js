import { copyFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

export function ensureEnvFile(baseDir) {
  const envPath = join(baseDir, '.env');
  if (existsSync(envPath)) return false;

  const examplePath = join(baseDir, '.env.example');
  if (!existsSync(examplePath)) return false;

  copyFileSync(examplePath, envPath);
  return true;
}

export function loadEnv(baseDir) {
  if (ensureEnvFile(baseDir)) {
    console.log('已创建 .env（来自 .env.example）');
  }

  const envPath = join(baseDir, '.env');
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
