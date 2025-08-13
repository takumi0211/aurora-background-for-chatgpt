// content.js — Ambient Blur + scoped transparency + robust hide/show + legacy toggle
(() => {
  const ID = 'cgpt-ambient-bg';
  const HTML_CLASS = 'cgpt-ambient-on';
  const LEGACY_CLASS = 'cgpt-legacy-composer';
  const DEFAULTS = { showInChats: false, legacyComposer: false };
  let settings = { ...DEFAULTS };

  const isChatPage = () => location.pathname.startsWith('/c/');
  const isHomePage = () => location.pathname === '/';

  function ensureAppOnTop() {
    const app =
      document.getElementById('__next') ||
      document.querySelector('#root') ||
      document.querySelector('main') ||
      document.body.firstElementChild;
    if (!app) return;
    const cs = getComputedStyle(app);
    if (cs.position === 'static') app.style.position = 'relative';
    if (!app.style.zIndex || parseInt(app.style.zIndex || '0', 10) < 0) app.style.zIndex = '0';
  }

  function makeBgNode() {
    const wrap = document.createElement('div');
    wrap.id = ID;
    wrap.setAttribute('aria-hidden', 'true');
    Object.assign(wrap.style, { position: 'fixed', inset: '0', zIndex: '-1', pointerEvents: 'none' });
    wrap.innerHTML = `
      <picture>
        <source type="image/webp"
          srcset="https://persistent.oaistatic.com/burrito-nux/640.webp 640w,
                  https://persistent.oaistatic.com/burrito-nux/1280.webp 1280w,
                  https://persistent.oaistatic.com/burrito-nux/1920.webp 1920w">
        <img alt="" aria-hidden="true" sizes="100vw" loading="eager" fetchpriority="high"
          srcset="https://persistent.oaistatic.com/burrito-nux/640.webp 640w,
                  https://persistent.oaistatic.com/burrito-nux/1280.webp 1280w,
                  https://persistent.oaistatic.com/burrito-nux/1920.webp 1920w"
          src="https://persistent.oaistatic.com/burrito-nux/640.webp">
      </picture>
      <div class="haze"></div>
      <div class="overlay"></div>
    `;
    return wrap;
  }

  function applyRootFlags() {
    document.documentElement.classList.toggle(HTML_CLASS, shouldShow());
    document.documentElement.classList.toggle(LEGACY_CLASS, !!settings.legacyComposer);
  }

  function showBg() {
    if (!document.getElementById(ID)) {
      const node = makeBgNode();
      const add = () => { document.body.prepend(node); ensureAppOnTop(); };
      if (document.body) add();
      else document.addEventListener('DOMContentLoaded', add, { once: true });
    }
  }

  function hideBg() {
    const node = document.getElementById(ID);
    if (node) node.remove();
  }

  function shouldShow() {
    // Show ambient background only on the initial home screen
    return isHomePage();
  }

  function applyVisibility() {
    if (shouldShow()) showBg(); else hideBg();
    applyRootFlags();
  }

  function startObservers() {
    const mo = new MutationObserver(() => applyVisibility());
    mo.observe(document.documentElement, { childList: true, subtree: true });

    let last = location.href;
    setInterval(() => {
      if (location.href !== last) { last = location.href; applyVisibility(); }
    }, 400);
  }

  // Init
  if (chrome?.storage?.sync) {
    chrome.storage.sync.get(DEFAULTS, (res) => {
      settings = { ...DEFAULTS, ...res };
      applyVisibility();
      startObservers();
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'sync') return;
      if ('showInChats' in changes) settings.showInChats = changes.showInChats.newValue;
      if ('legacyComposer' in changes) settings.legacyComposer = changes.legacyComposer.newValue;
      applyVisibility();
    });
  } else {
    applyVisibility();
    startObservers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyVisibility, { once: true });
  } else {
    applyVisibility();
  }
})();
