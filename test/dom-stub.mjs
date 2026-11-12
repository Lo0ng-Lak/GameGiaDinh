// Stub DOM/window/localStorage cho test Node. getElementById trả về CÙNG một
// phần tử cho cùng id (để test lấy lại được handler click đã đăng ký), và
// addEventListener ghi lại handler để test có thể gọi trực tiếp (mô phỏng
// người chơi bấm nút "Ngày mới" trong game thật).
// File này chỉ dùng cho test, KHÔNG đi vào bundle game.

export function makeCtx2d() {
  // Proxy: mọi phương thức vẽ đều no-op, mọi gán thuộc tính đều được phép.
  const base = {
    createRadialGradient() { return { addColorStop() {} }; },
    createLinearGradient() { return { addColorStop() {} }; },
    createPattern() { return {}; },
    measureText() { return { width: 0 }; },
    getImageData() { return { data: [] }; },
    fillStyle: '', strokeStyle: '', globalAlpha: 1, lineWidth: 1,
  };
  return new Proxy(base, {
    get(t, prop) {
      if (prop in t) return t[prop];
      if (typeof prop === 'string') return function () {};
      return undefined;
    },
    set(t, prop, v) { t[prop] = v; return true; },
  });
}

export function makeEl(tag) {
  const el = {
    tagName: (tag || 'div').toUpperCase(),
    style: {},
    classList: { add() {}, remove() {}, contains() { return false; }, toggle() {} },
    children: [],
    _handlers: {},
    appendChild(c) { this.children.push(c); if (c) { c.parentElement = this; c.parentNode = this; } return c; },
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); if (c) { c.parentElement = null; c.parentNode = null; } },
    addEventListener(type, fn) { this._handlers[type] = fn; },
    removeEventListener(type) { delete this._handlers[type]; },
    // gọi handler đã đăng ký — test dùng để mô phỏng click thật
    fire(type, ev) { const fn = this._handlers[type]; if (fn) fn(ev || { preventDefault() {}, stopPropagation() {} }); },
    getContext() { return makeCtx2d(); },
    getBoundingClientRect() { return { left: 0, top: 0, width: 1280, height: 720 }; },
    setAttribute() {}, getAttribute() { return null; }, hasAttribute() { return false; },
    querySelector() { return makeEl(); },
    querySelectorAll() { return []; },
    innerHTML: '', textContent: '', value: '', checked: false, disabled: false,
    width: 0, height: 0, clientWidth: 1280, clientHeight: 720,
    focus() {}, click() {}, blur() {},
    requestPointerLock() {}, exitPointerLock() {},
    remove() { if (this.parentElement) this.parentElement.removeChild(this); },
    // duyệt cây DOM — HUD đọc firstElementChild để chỉnh thanh nước
    parentElement: null, parentNode: null,
    nextElementSibling: null, previousElementSibling: null,
    childNodes: [],
  };
  Object.defineProperty(el, 'firstElementChild', { get() { return this.children[0] || makeEl('div'); } });
  Object.defineProperty(el, 'lastElementChild', { get() { return this.children[this.children.length - 1] || makeEl('div'); } });
  Object.defineProperty(el, 'firstChild', { get() { return this.children[0] || makeEl('div'); } });
  Object.defineProperty(el, 'lastChild', { get() { return this.children[this.children.length - 1] || makeEl('div'); } });
  return el;
}

export function installDomStubs() {
  const byId = new Map();
  const storage = new Map();
  const localStorageStub = {
    getItem(k) { const v = storage.get(k); return v === undefined ? null : v; },
    setItem(k, v) { storage.set(k, String(v)); },
    removeItem(k) { storage.delete(k); },
    clear() { storage.clear(); },
    _store: storage,
  };
  globalThis.localStorage = localStorageStub;
  const doc = {
    getElementById(id) { if (!byId.has(id)) byId.set(id, makeEl('div')); return byId.get(id); },
    createElement(tag) { return makeEl(tag); },
    querySelector() { return makeEl(); },
    querySelectorAll() { return []; },
    body: makeEl('body'),
    head: makeEl('head'),
    documentElement: makeEl('html'),
    addEventListener() {}, removeEventListener() {},
    pointerLockElement: null,
    exitPointerLock() {},
    _byId: byId,
  };
  globalThis.document = doc;
  globalThis.window = {
    innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    localStorage: localStorageStub,
    addEventListener() {}, removeEventListener() {},
    __bike: null,
  };
  try { globalThis.navigator = { userAgent: 'node-test' }; } catch (e) { /* Node mới: navigator chỉ đọc */ }
  // requestAnimationFrame: KHÔNG gọi lại callback — animate() của game chỉ chạy
  // đúng 1 khung khi nạp module, không lặp vô hạn trong test.
  globalThis.requestAnimationFrame = function () { return 0; };
  globalThis.cancelAnimationFrame = function () {};
  return { byId, localStorage: localStorageStub, document: doc };
}
