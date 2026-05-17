/**
 * Badge Widget — injects a "Product Badge" text input into the Angular admin
 * product edit page. Saves the `badge` field via PUT /api/product/update/:id.
 */
(function () {
  'use strict';

  var API = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://api.shobaz.com';
  var capturedToken = null;
  var currentProductId = null;
  var mountTimer = null;
  var PANEL_ID = 'bdg-inline-panel';

  /* ── Token capture ── */
  var _origXhrSetHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (typeof name === 'string' && name.toLowerCase() === 'administrator' && value) capturedToken = value;
    return _origXhrSetHeader.apply(this, arguments);
  };

  var _origFetch = window.fetch;
  window.fetch = function (input, init) {
    try {
      if (init && init.headers) {
        var h = init.headers;
        var t = (h instanceof Headers) ? h.get('administrator') : (h['administrator'] || h['Administrator']);
        if (t) capturedToken = t;
      }
    } catch (_) {}
    return _origFetch.apply(this, arguments);
  };

  /* ── Route detection ── */
  function getProductId(path) {
    var m = (path || location.pathname).match(/\/product\/edit-product\/([a-f0-9]{24})/i);
    return m ? m[1] : null;
  }

  function onRouteChange() {
    var id = getProductId();
    if (id) {
      if (id !== currentProductId || !document.getElementById(PANEL_ID)) {
        currentProductId = id;
        clearTimeout(mountTimer);
        mountTimer = setTimeout(mountPanel, 1800);
      }
    } else {
      currentProductId = null;
      removePanel();
    }
  }

  ['pushState', 'replaceState'].forEach(function (fn) {
    var orig = history[fn];
    history[fn] = function () { orig.apply(this, arguments); setTimeout(onRouteChange, 80); };
  });
  window.addEventListener('popstate', onRouteChange);
  document.addEventListener('DOMContentLoaded', function () {
    onRouteChange();
    new MutationObserver(function () { onRouteChange(); }).observe(document.body, { childList: true });
  });

  /* ── Auth helpers ── */
  function authHeaders() {
    var h = { 'Content-Type': 'application/json' };
    if (!capturedToken) {
      ['admin_token', 'adminToken', 'token', 'administrator'].forEach(function (k) {
        var v = localStorage.getItem(k) || sessionStorage.getItem(k);
        if (v && v.length > 20 && !v.startsWith('{')) capturedToken = v;
      });
    }
    if (capturedToken) h['administrator'] = capturedToken;
    return h;
  }

  /* ── Mount / remove ── */
  async function mountPanel() {
    removePanel();
    injectStyles();

    var currentBadge = '';
    try {
      var r = await _origFetch(API + '/api/product/' + currentProductId, { headers: authHeaders() });
      var j = await r.json();
      currentBadge = (j && j.data && j.data.badge) || '';
    } catch (e) { console.warn('[Badge Widget] load error:', e); }

    var anchor = findAnchor();
    if (!anchor) { clearTimeout(mountTimer); mountTimer = setTimeout(mountPanel, 1200); return; }

    var card = document.createElement('div');
    card.id = PANEL_ID;
    card.innerHTML = buildHTML(currentBadge);
    if (anchor.after && anchor.after.nextSibling) {
      anchor.parent.insertBefore(card, anchor.after.nextSibling);
    } else {
      anchor.parent.appendChild(card);
    }
    bindEvents();
  }

  function removePanel() {
    var el = document.getElementById(PANEL_ID);
    if (el) el.remove();
  }

  function findAnchor() {
    var bt = document.getElementById('bt-inline-panel');
    if (bt) return { parent: bt.parentElement, after: bt };

    var allCards = Array.prototype.slice.call(document.querySelectorAll('mat-card, .mat-card')).filter(function (c) {
      if (c.id === PANEL_ID) return false;
      var a = c.parentElement;
      while (a && a !== document.body) {
        if (a.tagName === 'MAT-CARD' || (a.classList && a.classList.contains('mat-card'))) return false;
        a = a.parentElement;
      }
      return true;
    });
    if (!allCards.length) return null;
    var rightCards = allCards.filter(function (c) { var r = c.getBoundingClientRect(); return r.width > 0 && r.width < window.innerWidth * 0.55; });
    var target = rightCards.length ? rightCards[rightCards.length - 1] : allCards[allCards.length - 1];
    return { parent: target.parentElement, after: target };
  }

  function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function buildHTML(badge) {
    return [
      '<div class="bdg-inner">',
      '  <div class="bdg-title">🏅 Product Badge</div>',
      '  <p class="bdg-sub">Short badge shown on the product image (e.g. "#1 WSJ Bestseller"). Leave blank to hide.</p>',
      '  <input id="bdg-input" class="bdg-input" type="text" placeholder="#1 WSJ Bestseller" value="' + esc(badge) + '" />',
      '  <div class="bdg-actions">',
      '    <button class="bdg-btn-save" id="bdg-save">💾 Save Badge</button>',
      '  </div>',
      '  <div class="bdg-status" id="bdg-status"></div>',
      '</div>',
    ].join('');
  }

  function bindEvents() {
    var sav = document.getElementById('bdg-save');
    if (!sav) return;
    sav.addEventListener('click', async function () {
      sav.disabled = true;
      sav.textContent = 'Saving…';
      try {
        var val = (document.getElementById('bdg-input') || {}).value || '';
        var res = await _origFetch(API + '/api/product/update/' + currentProductId, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify({ badge: val.trim() }),
        });
        showStatus(res.ok ? '✅ Saved!' : 'Save failed.', !res.ok);
      } catch (e) {
        console.error('[Badge Widget] save error:', e);
        showStatus('Save failed — see console.', true);
      }
      sav.disabled = false;
      sav.textContent = '💾 Save Badge';
    });
  }

  function showStatus(msg, isErr) {
    var el = document.getElementById('bdg-status');
    if (!el) return;
    el.textContent = msg;
    el.style.color = isErr ? '#d32f2f' : '#2e7d32';
    setTimeout(function () { if (el) el.textContent = ''; }, 4000);
  }

  function injectStyles() {
    if (document.getElementById('bdg-styles')) return;
    var s = document.createElement('style');
    s.id = 'bdg-styles';
    s.textContent = [
      '#bdg-inline-panel{background:#fff;border-radius:4px;box-shadow:0 2px 1px -1px rgba(0,0,0,.2),0 1px 1px 0 rgba(0,0,0,.14),0 1px 3px 0 rgba(0,0,0,.12);margin-bottom:16px;overflow:hidden}',
      '#bdg-inline-panel .bdg-inner{padding:20px 24px 16px}',
      '#bdg-inline-panel .bdg-title{font-size:15px;font-weight:700;color:#1a1a2e;border-left:3px solid #e85d2f;padding-left:10px;margin-bottom:8px}',
      '#bdg-inline-panel .bdg-sub{font-size:12px;color:#757575;margin:0 0 12px;line-height:1.5}',
      '#bdg-inline-panel .bdg-input{width:100%;border:1px solid #bdbdbd;border-radius:4px;padding:9px 12px;font-size:13px;color:#212121;box-sizing:border-box;outline:none;margin-bottom:10px;font-family:inherit;transition:border-color .2s}',
      '#bdg-inline-panel .bdg-input:focus{border-color:#e85d2f}',
      '#bdg-inline-panel .bdg-input::placeholder{color:#bdbdbd}',
      '#bdg-inline-panel .bdg-actions{display:flex}',
      '#bdg-inline-panel .bdg-btn-save{flex:1;background:#e85d2f;color:#fff;border:none;border-radius:4px;padding:10px 0;font-size:13px;font-weight:700;cursor:pointer;transition:background .15s;font-family:inherit}',
      '#bdg-inline-panel .bdg-btn-save:hover:not(:disabled){background:#c94e25}',
      '#bdg-inline-panel .bdg-btn-save:disabled{background:#f2a98b;cursor:default}',
      '#bdg-inline-panel .bdg-status{font-size:12px;min-height:18px;padding:6px 0 0;font-weight:600}',
    ].join('\n');
    document.head.appendChild(s);
  }
})();
