import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';

const LEVEL_RANK = { debug: 0, info: 1, warn: 2, error: 3 };

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatDetail(detail) {
  if (detail === undefined) return '';
  if (detail instanceof Error) return detail.stack || detail.message;
  if (typeof detail === 'object') {
    try {
      return JSON.stringify(detail);
    } catch {
      return String(detail);
    }
  }
  return String(detail);
}

function formatTimestamp(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} `
    + `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

function readTailSync(filePath, maxLines) {
  const text = readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/).filter(Boolean);
  return lines.slice(-maxLines);
}

export function createRuntimeLogger(options = {}) {
  const {
    logDir,
    level = 'info',
    toFile = true,
    keepDays = 14,
  } = options;

  let minRank = LEVEL_RANK[level] ?? LEVEL_RANK.info;
  let writeToFile = toFile !== false;

  if (writeToFile && logDir && !existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }

  function logFilePath(date = new Date()) {
    const name = `mygame-${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}.log`;
    return join(logDir, name);
  }

  function pruneOldLogs() {
    if (!writeToFile || !logDir || !existsSync(logDir)) return;
    const files = readdirSync(logDir)
      .filter((name) => /^mygame-\d{4}-\d{2}-\d{2}\.log$/.test(name))
      .sort();
    const extra = files.length - keepDays;
    if (extra <= 0) return;
    for (const name of files.slice(0, extra)) {
      try {
        unlinkSync(join(logDir, name));
      } catch {
        /* ignore */
      }
    }
  }

  function writeFile(line) {
    if (!writeToFile || !logDir) return;
    try {
      appendFileSync(logFilePath(), `${line}\n`, 'utf8');
      pruneOldLogs();
    } catch {
      /* ignore file write failure */
    }
  }

  function emit(levelName, label, detail) {
    const rank = LEVEL_RANK[levelName] ?? LEVEL_RANK.info;
    if (rank < minRank) return;

    const detailText = formatDetail(detail);
    const line = detailText
      ? `[${formatTimestamp()}] [${levelName.toUpperCase()}] ${label} ${detailText}`
      : `[${formatTimestamp()}] [${levelName.toUpperCase()}] ${label}`;

    if (rank >= LEVEL_RANK.error) console.error(line);
    else if (rank >= LEVEL_RANK.warn) console.warn(line);
    else console.log(line);

    writeFile(line);
  }

  function configure(next = {}) {
    if (next.level !== undefined) {
      const value = String(next.level || 'info').trim().toLowerCase();
      minRank = LEVEL_RANK[value] ?? LEVEL_RANK.info;
    }
    if (next.toFile !== undefined) {
      writeToFile = next.toFile !== false;
      if (writeToFile && logDir && !existsSync(logDir)) {
        mkdirSync(logDir, { recursive: true });
      }
    }
  }

  function shouldLogRequest(req) {
    const path = req.originalUrl || req.url || '';
    if (!path.startsWith('/api/')) return false;
    if (path.startsWith('/api/logs')) return false;
    return true;
  }

  function requestMiddleware() {
    return (req, res, next) => {
      if (!shouldLogRequest(req)) {
        next();
        return;
      }

      const started = Date.now();
      const userId = String(req.headers['x-user-id'] || req.query?.userId || '').trim();

      res.on('finish', () => {
        const duration = Date.now() - started;
        const detail = {
          method: req.method,
          path: req.originalUrl || req.url,
          status: res.statusCode,
          ms: duration,
          ...(userId ? { userId } : {}),
        };
        const levelName = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
        emit(levelName, 'HTTP', detail);
      });

      next();
    };
  }

  return {
    debug: (label, detail) => emit('debug', label, detail),
    info: (label, detail) => emit('info', label, detail),
    warn: (label, detail) => emit('warn', label, detail),
    error: (label, detail) => emit('error', label, detail),
    configure,
    requestMiddleware,
    logDir,
    todayLogPath: () => logFilePath(),
    readTail(maxLines = 200) {
      const filePath = logFilePath();
      if (!existsSync(filePath)) return [];
      return readTailSync(filePath, maxLines);
    },
    getConfig() {
      const levelName = Object.entries(LEVEL_RANK).find(([, rank]) => rank === minRank)?.[0] || 'info';
      return { level: levelName, toFile: writeToFile };
    },
  };
}
