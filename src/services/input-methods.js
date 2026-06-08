const CATEGORY_PARTIAL = 18;
const CATEGORY_FULL = 28;

function controllerLevelFromCategories(categories) {
  let full = false;
  let partial = false;
  for (const item of categories || []) {
    const id = Number(item?.id);
    if (id === CATEGORY_FULL) full = true;
    if (id === CATEGORY_PARTIAL) partial = true;
    const desc = String(item?.description || '');
    if (/full controller|完全支持控制器/i.test(desc)) full = true;
    if (/partial controller|部分控制器|controller enabled/i.test(desc)) partial = true;
  }
  if (full) return 'full';
  if (partial) return 'partial';
  return '';
}

export function extractInputMethodsFromStoreData(data) {
  const methods = ['keyboard_mouse'];
  if (!data || typeof data !== 'object') return methods;

  const support = String(data.controller_support || '').toLowerCase();
  let level = '';
  if (support === 'full') level = 'full';
  else if (support === 'partial') level = 'partial';
  else level = controllerLevelFromCategories(data.categories);

  if (level === 'full') methods.push('controller_full');
  else if (level === 'partial') methods.push('controller_partial');
  return methods;
}

export function normalizeInputMethods(raw) {
  const allowed = new Set(['keyboard_mouse', 'controller', 'controller_full', 'controller_partial']);
  const list = Array.isArray(raw) ? raw : [];
  const out = [];
  for (const item of list) {
    const key = String(item || '').trim();
    if (!allowed.has(key) || out.includes(key)) continue;
    out.push(key);
  }
  if (out.includes('controller') && !out.includes('controller_full') && !out.includes('controller_partial')) {
    out.push('controller_partial');
  }
  const controllerIdx = out.indexOf('controller');
  if (controllerIdx >= 0) out.splice(controllerIdx, 1);
  if (!out.includes('keyboard_mouse')) out.unshift('keyboard_mouse');
  return out;
}

export function hasControllerSupport(raw) {
  const methods = normalizeInputMethods(raw);
  return methods.includes('controller_full') || methods.includes('controller_partial');
}
