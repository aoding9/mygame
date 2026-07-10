import { spawn, spawnSync } from 'node:child_process';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const checkNodePath = join(root, 'scripts', 'check-node.js');

const check = spawnSync(process.execPath, [checkNodePath], { stdio: 'inherit' });
if (check.status !== 0) process.exit(check.status ?? 1);
const serverPath = join(root, 'src', 'server.js');

let child = null;
let restarting = false;
let exiting = false;
let forceKillTimer = null;

function clearForceKillTimer() {
  if (!forceKillTimer) return;
  clearTimeout(forceKillTimer);
  forceKillTimer = null;
}

function restartDelayMs() {
  return process.platform === 'win32' ? 1200 : 600;
}

function startServer() {
  clearForceKillTimer();
  child = spawn(process.execPath, [serverPath], {
    stdio: 'inherit',
    cwd: root,
    env: process.env,
  });

  child.on('exit', (code) => {
    const wasRestarting = restarting;
    child = null;
    clearForceKillTimer();

    if (exiting) {
      process.exit(code ?? 0);
    }
    if (wasRestarting) {
      restarting = false;
      setTimeout(startServer, restartDelayMs());
      return;
    }
    process.exit(code ?? 0);
  });
}

function requestRestart() {
  if (!child || restarting || exiting) return;

  restarting = true;
  const dying = child;
  process.stdout.write('\n正在重启服务...\n');

  forceKillTimer = setTimeout(() => {
    forceKillTimer = null;
    if (child === dying) {
      try {
        dying.kill('SIGKILL');
      } catch {
        /* ignore */
      }
    }
  }, 5000);

  try {
    dying.kill('SIGTERM');
  } catch {
    restarting = false;
    clearForceKillTimer();
  }
}

function requestExit() {
  exiting = true;
  clearForceKillTimer();
  if (child) child.kill('SIGTERM');
  else process.exit(0);
}

function setupHotkeys() {
  if (!process.stdin.isTTY) {
    startServer();
    return;
  }

  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  process.stdin.on('keypress', (_str, key) => {
    if (!key) return;
    if (key.ctrl && key.name === 'r') {
      requestRestart();
      return;
    }
    if (key.ctrl && key.name === 'c') {
      requestExit();
    }
  });

  process.stdout.write('MyGame — Ctrl+R 重启服务  Ctrl+C 退出\n\n');
  startServer();
}

setupHotkeys();
