/*
 * Shobaz admin shell: the shared sidebar, top-bar user chip, login, toast and
 * small helpers for the custom admin pages. Exposed as window.ShobazAdmin.
 * Uses the same admin token key as custom-orders.html (co_admin_token), so one
 * sign-in covers every page.
 */
(function (root) {
  'use strict';

  var host = root.location.hostname;
  var isLocal = host === 'localhost' || host === '127.0.0.1';
  var API = isLocal ? 'http://localhost:4000' : 'https://api.shobaz.com';
  var ADMIN_URL = isLocal ? 'http://localhost:3007' : 'https://admin.shobaz.com';
  var STATIC = API + '/upload/static/';
  var TOKEN_KEY = 'co_admin_token';
  var MANAGER_ROLES = ['super_admin', 'admin'];

  var NAV = [
    { label: 'Sales', items: [
      { key: 'angular-orders', label: 'Orders (Angular)', icon: 'fa-list-ul', href: ADMIN_URL + '/sales/all-orders' },
      { key: 'orders', label: 'Orders', icon: 'fa-inbox', href: STATIC + 'custom-orders.html' },
      { key: 'incomplete', label: 'Incomplete orders', icon: 'fa-clock', href: STATIC + 'custom-orders.html?view=incomplete', sub: true },
      { key: 'import-woo', label: 'Import WooCommerce', icon: 'fa-file-import', href: STATIC + 'import-woo-orders.html' },
      { key: 'customer-manager', label: 'Customer Manager', icon: 'fa-address-book', href: STATIC + 'customer-manager.html' },
      { key: 'staff-performance', label: 'Staff Performance', icon: 'fa-trophy', href: STATIC + 'staff-performance.html' },
    ] },
    { label: 'Inventory', items: [
      { key: 'stock', label: 'Stock Management', icon: 'fa-boxes-stacked', href: STATIC + 'custom-orders.html?view=stock' },
    ] },
    { label: 'Analytics', items: [
      { key: 'insights', label: 'Customer & Bundle Insights', icon: 'fa-users', href: STATIC + 'customer-insights.html' },
      { key: 'profit', label: 'Profit Dashboard', icon: 'fa-chart-line', href: STATIC + 'profit-dashboard.html' },
      { key: 'searches', label: 'Customer Searches', icon: 'fa-magnifying-glass', href: STATIC + 'customer-searches.html' },
    ] },
  ];

  /* ── Small helpers ── */
  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function money(value) {
    var n = Number(value || 0);
    return (n < 0 ? '-৳' : '৳') + Math.abs(Math.round(n)).toLocaleString('en-BD');
  }
  function count(value) { return Number(value || 0).toLocaleString('en-BD'); }
  function pad(n) { return String(n).padStart(2, '0'); }
  /** Today's date (YYYY-MM-DD) in Dhaka, whatever the browser's time zone. */
  function dhakaToday(offsetDays) {
    var d = new Date(Date.now() + 6 * 3600 * 1000 + (offsetDays || 0) * 86400000);
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }
  function timeAgo(value) {
    if (!value) return '';
    var t = new Date(value).getTime();
    if (!isFinite(t)) return '';
    var s = Math.max(0, Math.round((Date.now() - t) / 1000));
    if (s < 45) return 'just now';
    var m = Math.round(s / 60);
    if (m < 60) return m + ' min ago';
    var h = Math.round(m / 60);
    if (h < 24) return h + (h === 1 ? ' hr ago' : ' hrs ago');
    var d = Math.round(h / 24);
    if (d < 30) return d + (d === 1 ? ' day ago' : ' days ago');
    var mo = Math.round(d / 30);
    if (mo < 12) return mo + (mo === 1 ? ' month ago' : ' months ago');
    var y = Math.round(mo / 12);
    return y + (y === 1 ? ' year ago' : ' years ago');
  }
  function fmtDate(value, withTime) {
    if (!value) return '—';
    var d = new Date(value);
    if (isNaN(d)) return String(value);
    var out = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    if (withTime) out += ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return out;
  }

  /* ── Auth ── */
  function getToken() { try { return root.localStorage.getItem(TOKEN_KEY) || null; } catch (e) { return null; } }
  function setToken(t) { try { root.localStorage.setItem(TOKEN_KEY, t); } catch (e) { /* private mode */ } }
  function clearToken() { try { root.localStorage.removeItem(TOKEN_KEY); } catch (e) { /* private mode */ } }
  function tokenPayload() {
    var t = getToken();
    if (!t) return null;
    try {
      var part = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      while (part.length % 4) part += '=';
      return JSON.parse(decodeURIComponent(escape(root.atob(part))));
    } catch (e) { return null; }
  }
  function role() { var p = tokenPayload(); return (p && p.role) || ''; }
  function isManager() { return MANAGER_ROLES.indexOf(role()) !== -1; }
  function isSalesman() { return role() === 'salesman'; }
  function authHeaders(extra) {
    var h = { 'Content-Type': 'application/json' };
    var t = getToken();
    if (t) h.administrator = t;
    if (extra) Object.keys(extra).forEach(function (k) { h[k] = extra[k]; });
    return h;
  }

  /**
   * fetch + JSON with the admin header. Rejects with the server message when the
   * request fails or the body says success:false; 401/403 opens the login.
   */
  function api(path, options) {
    options = options || {};
    var init = { method: options.method || 'GET', headers: authHeaders(options.headers) };
    if (options.body !== undefined) init.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    return root.fetch(path.indexOf('http') === 0 ? path : API + path, init).then(function (r) {
      return r.json().catch(function () { return null; }).then(function (body) {
        if (r.status === 401) {
          clearToken();
          showLogin('Session expired. Please sign in again.');
          throw new Error('Please sign in again.');
        }
        if (!r.ok || !body || body.success === false) {
          var msg = (body && (body.message || body.error)) || ('Request failed (' + r.status + ')');
          if (Array.isArray(msg)) msg = msg.join(', ');
          throw new Error(msg);
        }
        return body;
      });
    });
  }

  /* ── Toast ── */
  var toastTimer = null;
  function toast(message, type) {
    var el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = message;
    el.className = type || 'success';
    el.style.display = 'block';
    root.clearTimeout(toastTimer);
    toastTimer = root.setTimeout(function () { el.style.display = 'none'; }, 3500);
  }

  /* ── Login overlay (pages that do not ship their own) ── */
  var loginCallbacks = [];
  function ensureLoginOverlay() {
    var overlay = document.getElementById('login-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'login-overlay';
    overlay.className = 'hidden';
    overlay.innerHTML =
      '<form class="login-box" id="sa-login-form" autocomplete="on">' +
        '<div class="login-logo"><i class="fas fa-store"></i></div>' +
        '<div class="login-title">Sign in</div>' +
        '<div class="login-sub">Shobaz admin</div>' +
        '<div class="login-field"><label for="sa-login-user">Username</label><input id="sa-login-user" autocomplete="username" required></div>' +
        '<div class="login-field"><label for="sa-login-pass">Password</label><input id="sa-login-pass" type="password" autocomplete="current-password" required></div>' +
        '<button class="login-btn" id="sa-login-btn" type="submit">Sign in</button>' +
        '<div class="login-error" id="sa-login-error" role="alert"></div>' +
      '</form>';
    document.body.appendChild(overlay);
    overlay.querySelector('form').addEventListener('submit', function (event) {
      event.preventDefault();
      var btn = document.getElementById('sa-login-btn');
      var err = document.getElementById('sa-login-error');
      var username = document.getElementById('sa-login-user').value.trim();
      var password = document.getElementById('sa-login-pass').value;
      btn.disabled = true; btn.textContent = 'Signing in…'; err.style.display = 'none';
      root.fetch(API + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username, password: password }) })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data || !data.token) throw new Error('Invalid username or password.');
          setToken(data.token);
          overlay.classList.add('hidden');
          renderUserChip();
          root.dispatchEvent(new CustomEvent('shobaz:admin-auth-restored'));
          var cbs = loginCallbacks.splice(0);
          cbs.forEach(function (cb) { try { cb(); } catch (e) { root.console.error(e); } });
        })
        .catch(function (e) { err.textContent = e.message || 'Connection error. Try again.'; err.style.display = 'block'; })
        .then(function () { btn.disabled = false; btn.textContent = 'Sign in'; });
    });
    return overlay;
  }
  function showLogin(message) {
    var overlay = document.getElementById('login-overlay');
    var custom = overlay && !document.getElementById('sa-login-form');
    if (custom) {
      // Page ships its own overlay (custom-orders.html): let it handle the event.
      root.dispatchEvent(new CustomEvent('shobaz:admin-auth-required', { detail: { message: message } }));
      return;
    }
    overlay = ensureLoginOverlay();
    overlay.classList.remove('hidden');
    var err = document.getElementById('sa-login-error');
    if (message && err) { err.textContent = message; err.style.display = 'block'; }
    var user = document.getElementById('sa-login-user');
    if (user) root.setTimeout(function () { user.focus(); }, 30);
  }
  /** Runs cb now when signed in, otherwise after a successful sign-in. */
  function requireLogin(cb) {
    if (getToken()) { cb(); return; }
    loginCallbacks.push(cb);
    showLogin();
  }
  function logout() { clearToken(); root.location.reload(); }

  /* ── Sidebar ── */
  function navItemHtml(item, active) {
    var cls = 'nav-item' + (item.sub ? ' nav-subitem' : '') + (item.key === active ? ' active' : '');
    return '<a class="' + cls + '" id="nav-' + item.key + '" href="' + esc(item.href) + '"' +
      (item.key === active ? ' aria-current="page"' : '') + '><i class="fas ' + item.icon + '" aria-hidden="true"></i><span>' + esc(item.label) + '</span></a>';
  }
  function renderSidebar(active) {
    var aside = document.getElementById('sidebar');
    if (!aside) return;
    var html = '<a class="sidebar-logo" href="' + esc(STATIC + 'custom-orders.html') + '"><span class="logo-mark">S</span><span>Shobaz<small>Order management</small></span></a>';
    html += '<nav class="sidebar-nav" aria-label="Admin pages">';
    NAV.forEach(function (section) {
      html += '<div class="nav-section"><div class="nav-label">' + esc(section.label) + '</div>';
      section.items.forEach(function (item) { html += navItemHtml(item, active); });
      html += '</div>';
    });
    html += '</nav><div id="snapshotSlot"></div>';
    html += '<div class="nav-back"><a href="' + esc(ADMIN_URL) + '"><i class="fas fa-arrow-left" aria-hidden="true"></i> Back to admin</a></div>';
    aside.innerHTML = html;
    if (!document.getElementById('sidebarOverlay')) {
      var overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      overlay.id = 'sidebarOverlay';
      document.body.appendChild(overlay);
    }
    document.getElementById('sidebarOverlay').onclick = closeSidebar;
  }
  function setActiveNav(key) {
    var items = document.querySelectorAll('#sidebar .nav-item');
    for (var i = 0; i < items.length; i++) {
      var on = items[i].id === 'nav-' + key;
      items[i].classList.toggle('active', on);
      if (on) items[i].setAttribute('aria-current', 'page'); else items[i].removeAttribute('aria-current');
    }
  }
  function openSidebar() {
    var s = document.getElementById('sidebar'); var o = document.getElementById('sidebarOverlay');
    if (s) s.classList.add('open'); if (o) o.classList.add('open');
  }
  function closeSidebar() {
    var s = document.getElementById('sidebar'); var o = document.getElementById('sidebarOverlay');
    if (s) s.classList.remove('open'); if (o) o.classList.remove('open');
  }

  /* ── Top bar user chip ── */
  function renderUserChip() {
    var slot = document.getElementById('topbarUser');
    if (!slot) return;
    var p = tokenPayload();
    if (!p) { slot.innerHTML = ''; return; }
    var name = p.name || p.username || 'Admin';
    var initials = name.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(function (w) { return w[0]; }).join('') || 'A';
    slot.innerHTML = '<span class="topbar-user" title="' + esc(name + ' · ' + (p.role || '')) + '"><span class="avatar">' + esc(initials) + '</span><span class="name">' + esc(name) + '</span></span>';
  }

  /* ── Today's snapshot (sidebar) ── */
  var snapTimer = null;
  function mountSnapshot() {
    var slot = document.getElementById('snapshotSlot');
    if (!slot || !getToken() || isSalesman()) { if (slot) slot.innerHTML = ''; return; }
    var collapsed = false;
    try { collapsed = root.localStorage.getItem('sa_snapshot_collapsed') === '1'; } catch (e) { /* ignore */ }
    if (!document.getElementById('snapshotCard')) {
      slot.innerHTML =
        '<section class="snapshot' + (collapsed ? ' collapsed' : '') + '" id="snapshotCard" aria-label="Today\'s snapshot">' +
          '<button type="button" class="snapshot-head" id="snapshotToggle" aria-expanded="' + (!collapsed) + '">Today\'s snapshot <i class="fas fa-chevron-down" aria-hidden="true"></i></button>' +
          '<div class="snapshot-body">' +
            '<div class="snapshot-row"><span>Revenue</span><strong id="snapRevenue">—</strong></div>' +
            '<div class="snapshot-row"><span>Ad spend</span><strong id="snapSpend">—</strong></div>' +
            '<div class="snapshot-row"><span>Profit</span><strong id="snapProfit">—</strong></div>' +
            '<div class="snapshot-row"><span>Orders</span><strong id="snapOrders">—</strong></div>' +
            '<a class="snapshot-link" href="' + esc(STATIC + 'profit-dashboard.html') + '">View full analytics →</a>' +
          '</div>' +
        '</section>';
      document.getElementById('snapshotToggle').addEventListener('click', function () {
        var card = document.getElementById('snapshotCard');
        var nowCollapsed = card.classList.toggle('collapsed');
        this.setAttribute('aria-expanded', String(!nowCollapsed));
        try { root.localStorage.setItem('sa_snapshot_collapsed', nowCollapsed ? '1' : '0'); } catch (e) { /* ignore */ }
      });
    }
    loadSnapshot();
    root.clearInterval(snapTimer);
    snapTimer = root.setInterval(loadSnapshot, 5 * 60 * 1000);
  }
  function loadSnapshot() {
    if (!getToken() || isSalesman() || !document.getElementById('snapRevenue')) return;
    var today = dhakaToday();
    var q = '?startDate=' + today + '&endDate=' + today;
    var profitP = api('/api/dashboard/profit-analytics' + q).catch(function () { return null; });
    var spendP = api('/api/meta-ads/spend' + q).catch(function () { return null; });
    Promise.all([profitP, spendP]).then(function (res) {
      var totals = (res[0] && res[0].data && res[0].data.totals) || null;
      var spend = (res[1] && res[1].data && Number(res[1].data.total)) || 0;
      var set = function (id, text, cls) { var el = document.getElementById(id); if (el) { el.textContent = text; el.className = cls || ''; } };
      if (!totals) { set('snapRevenue', '—'); set('snapOrders', '—'); set('snapProfit', '—'); set('snapSpend', spend ? money(spend) : '—'); return; }
      var revenue = Number(totals.revenue || 0);
      var cost = Number(totals.totalCost || 0);
      var delivery = Number(totals.deliveryCharge || 0);
      var profit = revenue - cost - delivery - spend;
      var hasDeductions = cost > 0 || delivery > 0 || spend > 0;
      set('snapRevenue', money(revenue));
      set('snapSpend', spend ? money(spend) : '—');
      set('snapProfit', hasDeductions ? money(profit) : '—', hasDeductions ? (profit >= 0 ? 'pos' : 'neg') : '');
      set('snapOrders', count(totals.orderCount));
    });
  }

  /**
   * Standard page boot: sidebar, user chip, snapshot, hamburger. `ready` runs
   * once signed in (now, or after the login overlay succeeds).
   */
  function boot(options) {
    options = options || {};
    renderSidebar(options.active || '');
    renderUserChip();
    var ham = document.getElementById('hamburger');
    if (ham) ham.addEventListener('click', openSidebar);
    var out = document.getElementById('logoutBtn');
    if (out && !options.keepLogout) out.addEventListener('click', logout);
    requireLogin(function () {
      renderUserChip();
      if (options.snapshot !== false) mountSnapshot();
      if (typeof options.ready === 'function') options.ready();
    });
  }

  root.ShobazAdmin = {
    API: API,
    ADMIN_URL: ADMIN_URL,
    STATIC: STATIC,
    esc: esc,
    money: money,
    count: count,
    dhakaToday: dhakaToday,
    timeAgo: timeAgo,
    fmtDate: fmtDate,
    getToken: getToken,
    setToken: setToken,
    clearToken: clearToken,
    tokenPayload: tokenPayload,
    role: role,
    isManager: isManager,
    isSalesman: isSalesman,
    authHeaders: authHeaders,
    api: api,
    toast: toast,
    showLogin: showLogin,
    requireLogin: requireLogin,
    logout: logout,
    renderSidebar: renderSidebar,
    setActiveNav: setActiveNav,
    openSidebar: openSidebar,
    closeSidebar: closeSidebar,
    renderUserChip: renderUserChip,
    mountSnapshot: mountSnapshot,
    boot: boot,
  };
})(window);
