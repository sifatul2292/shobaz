/**
 * Product Showcase Widget — injected into the compiled Angular admin product edit page.
 * Saves `showcaseImages` for the storefront auto-sliding image showcase.
 */
(function () {
  'use strict';

  var API = window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://api.shobaz.com';
  var PANEL_ID = 'psw-inline-panel';
  var STYLE_ID = 'psw-styles';
  var currentProductId = null;
  var capturedToken = null;
  var mountTimer = null;
  var showcaseImages = [];
  var pendingFiles = [];

  var _origFetch = window.fetch;
  var _origXhrSetHeader = XMLHttpRequest.prototype.setRequestHeader;

  XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
    if (typeof name === 'string' && name.toLowerCase() === 'administrator' && value) capturedToken = value;
    return _origXhrSetHeader.apply(this, arguments);
  };

  window.fetch = function (input, init) {
    try {
      if (init && init.headers) {
        var h = init.headers;
        var token = h instanceof Headers ? h.get('administrator') : (h.administrator || h.Administrator);
        if (token) capturedToken = token;
      }
    } catch (_) {}
    return _origFetch.apply(this, arguments);
  };

  function getProductId(path) {
    var match = (path || location.pathname).match(/\/product\/edit-product\/([a-f0-9]{24})/i);
    return match ? match[1] : null;
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
    history[fn] = function () {
      orig.apply(this, arguments);
      setTimeout(onRouteChange, 80);
    };
  });
  window.addEventListener('popstate', onRouteChange);
  document.addEventListener('DOMContentLoaded', function () {
    onRouteChange();
    new MutationObserver(function () { onRouteChange(); }).observe(document.body, { childList: true });
  });

  function authHeaders(isJson) {
    if (!capturedToken) {
      ['admin_token', 'adminToken', 'token', 'administrator'].forEach(function (key) {
        var value = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (value && value.length > 20 && !value.startsWith('{')) capturedToken = value;
      });
    }
    var headers = {};
    if (isJson) headers['Content-Type'] = 'application/json';
    if (capturedToken) headers.administrator = capturedToken;
    return headers;
  }

  async function mountPanel() {
    removePanel();
    injectStyles();
    pendingFiles = [];
    showcaseImages = [];

    try {
      var res = await _origFetch(API + '/api/product/' + currentProductId, { headers: authHeaders(true) });
      var json = await res.json();
      showcaseImages = (json && json.data && Array.isArray(json.data.showcaseImages)) ? json.data.showcaseImages : [];
    } catch (err) {
      console.warn('[Product Showcase] load error:', err);
    }

    var anchor = findAnchor();
    if (!anchor) {
      clearTimeout(mountTimer);
      mountTimer = setTimeout(mountPanel, 1200);
      return;
    }

    var card = document.createElement('div');
    card.id = PANEL_ID;
    card.innerHTML = buildHTML();
    if (anchor.after && anchor.after.nextSibling) anchor.parent.insertBefore(card, anchor.after.nextSibling);
    else anchor.parent.appendChild(card);
    bindEvents();
    renderImages();
  }

  function removePanel() {
    var el = document.getElementById(PANEL_ID);
    if (el) el.remove();
  }

  function findAnchor() {
    var badge = document.getElementById('bdg-inline-panel');
    if (badge) return { parent: badge.parentElement, after: badge };
    var bt = document.getElementById('bt-inline-panel');
    if (bt) return { parent: bt.parentElement, after: bt };

    var cards = Array.prototype.slice.call(document.querySelectorAll('mat-card, .mat-card')).filter(function (card) {
      if (card.id === PANEL_ID) return false;
      var node = card.parentElement;
      while (node && node !== document.body) {
        if (node.tagName === 'MAT-CARD' || (node.classList && node.classList.contains('mat-card'))) return false;
        node = node.parentElement;
      }
      return true;
    });
    if (!cards.length) return null;
    var rightCards = cards.filter(function (card) {
      var rect = card.getBoundingClientRect();
      return rect.width > 0 && rect.width < window.innerWidth * 0.55;
    });
    var target = rightCards.length ? rightCards[rightCards.length - 1] : cards[cards.length - 1];
    return { parent: target.parentElement, after: target };
  }

  function buildHTML() {
    return [
      '<div class="psw-inner">',
      '  <div class="psw-title">Product Showcase Images <span id="psw-count">0</span></div>',
      '  <p class="psw-sub">Upload images for the storefront slideshow above “একসাথে কিনুন”. Click Save after uploading.</p>',
      '  <label class="psw-drop">',
      '    <input id="psw-file" type="file" accept="image/*" multiple />',
      '    <span>+ Choose Images</span>',
      '  </label>',
      '  <div class="psw-pending" id="psw-pending"></div>',
      '  <div class="psw-grid" id="psw-grid"></div>',
      '  <div class="psw-actions">',
      '    <button id="psw-clear" class="psw-btn light">Clear All</button>',
      '    <button id="psw-save" class="psw-btn">Save Showcase</button>',
      '  </div>',
      '  <div id="psw-status" class="psw-status"></div>',
      '</div>',
    ].join('');
  }

  function bindEvents() {
    var fileInput = document.getElementById('psw-file');
    var save = document.getElementById('psw-save');
    var clear = document.getElementById('psw-clear');

    if (fileInput) {
      fileInput.addEventListener('change', function () {
        pendingFiles = Array.prototype.slice.call(fileInput.files || []);
        renderPending();
      });
    }

    if (clear) {
      clear.addEventListener('click', function () {
        showcaseImages = [];
        pendingFiles = [];
        if (fileInput) fileInput.value = '';
        renderPending();
        renderImages();
      });
    }

    if (save) {
      save.addEventListener('click', async function () {
        save.disabled = true;
        save.textContent = 'Saving...';
        try {
          var uploaded = pendingFiles.length ? await uploadPendingFiles() : [];
          var finalImages = showcaseImages.concat(uploaded).filter(Boolean);
          var res = await _origFetch(API + '/api/product/update/' + currentProductId, {
            method: 'PUT',
            headers: authHeaders(true),
            body: JSON.stringify({ showcaseImages: finalImages }),
          });
          if (!res.ok) throw new Error('Update failed');
          showcaseImages = finalImages;
          pendingFiles = [];
          if (fileInput) fileInput.value = '';
          renderPending();
          renderImages();
          showStatus('Saved successfully.');
        } catch (err) {
          console.error('[Product Showcase] save error:', err);
          showStatus('Save failed. Please check console.', true);
        }
        save.disabled = false;
        save.textContent = 'Save Showcase';
      });
    }
  }

  async function uploadPendingFiles() {
    var form = new FormData();
    pendingFiles.forEach(function (file) { form.append('imageMulti', file); });
    var res = await _origFetch(API + '/api/upload/multiple-image', {
      method: 'POST',
      headers: authHeaders(false),
      body: form,
    });
    if (!res.ok) throw new Error('Upload failed');
    var json = await res.json();
    return (Array.isArray(json) ? json : []).map(function (item) {
      return filenameFromUrl(item.url);
    }).filter(Boolean);
  }

  function renderPending() {
    var el = document.getElementById('psw-pending');
    if (!el) return;
    if (!pendingFiles.length) {
      el.innerHTML = '';
      return;
    }
    el.innerHTML = '<div>' + pendingFiles.length + ' new image(s) ready to upload</div>';
  }

  function renderImages() {
    var grid = document.getElementById('psw-grid');
    var count = document.getElementById('psw-count');
    if (count) count.textContent = String(showcaseImages.length);
    if (!grid) return;
    if (!showcaseImages.length) {
      grid.innerHTML = '<div class="psw-empty">No showcase images yet.</div>';
      return;
    }
    grid.innerHTML = showcaseImages.map(function (img, index) {
      return [
        '<div class="psw-thumb">',
        '  <img src="' + esc(imageUrl(img)) + '" onerror="this.closest(\'.psw-thumb\').classList.add(\'is-broken\')" />',
        '  <div class="psw-thumb-actions">',
        '    <button data-action="up" data-i="' + index + '" title="Move left">‹</button>',
        '    <button data-action="down" data-i="' + index + '" title="Move right">›</button>',
        '    <button data-action="remove" data-i="' + index + '" title="Remove">×</button>',
        '  </div>',
        '</div>',
      ].join('');
    }).join('');

    grid.querySelectorAll('button[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.getAttribute('data-action');
        var i = Number(btn.getAttribute('data-i'));
        if (action === 'remove') showcaseImages.splice(i, 1);
        if (action === 'up' && i > 0) swap(i, i - 1);
        if (action === 'down' && i < showcaseImages.length - 1) swap(i, i + 1);
        renderImages();
      });
    });
  }

  function swap(a, b) {
    var tmp = showcaseImages[a];
    showcaseImages[a] = showcaseImages[b];
    showcaseImages[b] = tmp;
  }

  function filenameFromUrl(url) {
    if (!url) return '';
    var clean = String(url).split('?')[0].split('#')[0];
    return decodeURIComponent(clean.substring(clean.lastIndexOf('/') + 1));
  }

  function imageUrl(img) {
    if (!img) return '';
    if (/^https?:\/\//i.test(img)) return img;
    return API + '/api/upload/images/' + img;
  }

  function showStatus(message, isError) {
    var el = document.getElementById('psw-status');
    if (!el) return;
    el.textContent = message;
    el.style.color = isError ? '#d32f2f' : '#2e7d32';
    setTimeout(function () { if (el) el.textContent = ''; }, 4500);
  }

  function esc(value) {
    return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#psw-inline-panel{background:#fff;border-radius:4px;box-shadow:0 2px 1px -1px rgba(0,0,0,.2),0 1px 1px 0 rgba(0,0,0,.14),0 1px 3px 0 rgba(0,0,0,.12);margin-bottom:16px;overflow:hidden}',
      '#psw-inline-panel .psw-inner{padding:20px 24px 16px}',
      '#psw-inline-panel .psw-title{font-size:15px;font-weight:800;color:#1a1a2e;border-left:3px solid #16a34a;padding-left:10px;margin-bottom:8px}',
      '#psw-inline-panel .psw-title span{float:right;background:#dcfce7;color:#15803d;border-radius:999px;padding:2px 9px;font-size:12px}',
      '#psw-inline-panel .psw-sub{font-size:12px;color:#757575;margin:0 0 12px;line-height:1.5}',
      '#psw-inline-panel .psw-drop{display:flex;align-items:center;justify-content:center;height:76px;border:1.5px dashed #a7f3d0;border-radius:6px;background:#f0fdf4;color:#15803d;font-weight:800;cursor:pointer;margin-bottom:12px}',
      '#psw-inline-panel .psw-drop input{display:none}',
      '#psw-inline-panel .psw-pending{font-size:12px;color:#455a64;font-weight:700;margin-bottom:10px}',
      '#psw-inline-panel .psw-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:12px}',
      '#psw-inline-panel .psw-empty{grid-column:1/-1;padding:14px;background:#f7f7f7;border-radius:6px;color:#9e9e9e;font-size:12px;text-align:center}',
      '#psw-inline-panel .psw-thumb{position:relative;aspect-ratio:1/1;border-radius:6px;overflow:hidden;background:#f5f5f5;border:1px solid #eee}',
      '#psw-inline-panel .psw-thumb img{width:100%;height:100%;object-fit:cover;display:block}',
      '#psw-inline-panel .psw-thumb.is-broken:before{content:"Image";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#9e9e9e;font-size:12px}',
      '#psw-inline-panel .psw-thumb-actions{position:absolute;left:4px;right:4px;bottom:4px;display:flex;gap:4px;justify-content:center}',
      '#psw-inline-panel .psw-thumb-actions button{width:25px;height:24px;border:0;border-radius:4px;background:rgba(0,0,0,.68);color:#fff;font-size:17px;line-height:1;cursor:pointer}',
      '#psw-inline-panel .psw-actions{display:flex;gap:10px}',
      '#psw-inline-panel .psw-btn{flex:1;background:#16a34a;color:#fff;border:none;border-radius:4px;padding:10px 0;font-size:13px;font-weight:800;cursor:pointer;font-family:inherit}',
      '#psw-inline-panel .psw-btn.light{background:#fff;color:#374151;border:1px solid #d1d5db}',
      '#psw-inline-panel .psw-btn:disabled{opacity:.55;cursor:default}',
      '#psw-inline-panel .psw-status{font-size:12px;min-height:18px;padding:6px 0 0;font-weight:700}',
    ].join('\n');
    document.head.appendChild(style);
  }
})();
