const MIN_MAJOR = 22;
const MIN_MINOR = 5;

function parseVersion(raw) {
  const match = /^v?(\d+)\.(\d+)\.(\d+)/.exec(String(raw || '').trim());
  if (!match) return null;
  return { major: +match[1], minor: +match[2], patch: +match[3] };
}

function versionTooLow(version) {
  if (version.major > MIN_MAJOR) return false;
  if (version.major < MIN_MAJOR) return true;
  return version.minor < MIN_MINOR;
}

function printHint(current) {
  console.error('');
  console.error('[ERROR] 当前 Node.js 版本过低');
  console.error(`        当前版本: ${current}`);
  console.error(`        需要版本: Node.js ${MIN_MAJOR}.${MIN_MINOR}.0 或更高（推荐 22 LTS）`);
  console.error('');
  console.error('        本项目使用 Node 内置 sqlite，无需 better-sqlite3 等原生模块。');
  console.error('        若已安装新版本，请确认 PATH 中的 node 指向正确版本：');
  console.error('          node -v');
  console.error('          where node   (Windows)');
  console.error('');
  console.error('        下载: https://nodejs.org/');
  console.error('');
}

const current = process.version;
const parsed = parseVersion(current);

if (!parsed || versionTooLow(parsed)) {
  printHint(current);
  process.exit(1);
}

try {
  await import('node:sqlite');
} catch (err) {
  console.error('');
  console.error('[ERROR] 当前 Node 不支持内置 sqlite 模块');
  console.error(`        当前 Node: ${current}`);
  console.error(`        ${err.message}`);
  console.error('');
  console.error(`        请升级到 Node.js ${MIN_MAJOR}.${MIN_MINOR}.0 或更高。`);
  console.error('');
  process.exit(1);
}
