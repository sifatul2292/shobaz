/**
 * Dynamic Pages Admin Widget
 * Injected into the compiled Angular admin so additional pages can be
 * created, updated, deleted, and assigned to header/footer menus.
 */
(function () {
  'use strict';

  var API = 'http://localhost:4000';
  var PANEL_ID = 'pm-panel';
  var STYLES_ID = 'pm-styles';
  var ROUTE_MATCHERS = ['additionl-page', 'additional-page'];
  var PAGE_LIST_ROUTE_MATCHERS = ['page-list'];
  var mountTimer = null;
  var pages = [];
  var editingId = null;
  var searchTerm = '';

  if (!window._shobazAdminToken) window._shobazAdminToken = null;

  var _origFetch = window._pmOrigFetch || window.fetch;
  var _origXhrSetHeader = XMLHttpRequest.prototype.setRequestHeader;

  if (!window._shobazXhrPatched) {
    window._shobazXhrPatched = true;
    XMLHttpRequest.prototype.setRequestHeader = function (name, value) {
      if (typeof name === 'string' && name.toLowerCase() === 'administrator' && value) {
        window._shobazAdminToken = value;
      }
      return _origXhrSetHeader.apply(this, arguments);
    };
  }

  if (!window._shobazFetchPatched) {
    window._shobazFetchPatched = true;
    window._pmOrigFetch = window.fetch;
    _origFetch = window.fetch;
    window.fetch = function (input, init) {
      try {
        if (init && init.headers) {
          var h = init.headers;
          if (h instanceof Headers) {
            var t = h.get('administrator');
            if (t) window._shobazAdminToken = t;
          } else {
            var t2 = h['administrator'] || h['Administrator'];
            if (t2) window._shobazAdminToken = t2;
          }
        }
      } catch (_) {}
      return _origFetch.apply(this, arguments);
    };
  }

  function getToken() {
    if (window._shobazAdminToken) return window._shobazAdminToken;
    try {
      var keys = ['admin_token', 'adminToken', 'token', 'administrator'];
      for (var i = 0; i < keys.length; i++) {
        var value = localStorage.getItem(keys[i]) || sessionStorage.getItem(keys[i]);
        if (value && value.length > 20 && !value.startsWith('{')) {
          window._shobazAdminToken = value;
          return value;
        }
      }
    } catch (_) {}
    return null;
  }

  function authHeaders() {
    var headers = { 'Content-Type': 'application/json' };
    var token = getToken();
    if (token) headers.administrator = token;
    return headers;
  }

  function isPagesRoute() {
    var path = location.pathname || '';
    for (var i = 0; i < ROUTE_MATCHERS.length; i++) {
      if (path.indexOf(ROUTE_MATCHERS[i]) !== -1) return true;
    }
    return false;
  }

  function onRouteChange() {
    if (isPagesRoute()) {
      clearTimeout(mountTimer);
      mountTimer = setTimeout(mountPanel, 500);
    } else {
      removePanel();
    }
  }

  ['pushState', 'replaceState'].forEach(function (fn) {
    var original = history[fn];
    history[fn] = function () {
      original.apply(this, arguments);
      setTimeout(onRouteChange, 80);
    };
  });

  window.addEventListener('popstate', onRouteChange);

  document.addEventListener('DOMContentLoaded', function () {
    onRouteChange();
    new MutationObserver(function () {
      if (isPagesRoute() && !document.getElementById(PANEL_ID)) {
        clearTimeout(mountTimer);
        mountTimer = setTimeout(mountPanel, 500);
      }
    }).observe(document.body, { childList: true, subtree: true });
  });

  function apiRequest(path, options) {
    return _origFetch(API + path, options).then(async function (response) {
      var json = null;
      try {
        json = await response.json();
      } catch (_) {
        json = null;
      }

      if (!response.ok) {
        var error = new Error((json && (json.message || json.error)) || 'Request failed');
        error.payload = json;
        throw error;
      }

      return json;
    });
  }

  function apiGet(path) {
    return apiRequest(path, { headers: authHeaders() });
  }

  function apiPost(path, body) {
    return apiRequest(path, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
  }

  function apiPut(path, body) {
    return apiRequest(path, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(body),
    });
  }

  function apiDelete(path) {
    return apiRequest(path, {
      method: 'DELETE',
      headers: authHeaders(),
    });
  }

  async function fetchPages() {
    var response = await apiGet('/api/additional-page/get-all?includeInactive=true');
    var list = response && response.data ? response.data : [];
    pages = Array.isArray(list) ? list.slice().sort(sortPages) : [];
  }

  function sortPages(a, b) {
    var aHeader = typeof a.headerOrder === 'number' ? a.headerOrder : 999;
    var bHeader = typeof b.headerOrder === 'number' ? b.headerOrder : 999;
    var aFooter = typeof a.footerOrder === 'number' ? a.footerOrder : 999;
    var bFooter = typeof b.footerOrder === 'number' ? b.footerOrder : 999;
    if (aHeader !== bHeader) return aHeader - bHeader;
    if (aFooter !== bFooter) return aFooter - bFooter;
    return String(a.name || '').localeCompare(String(b.name || ''));
  }

  async function mountPanel() {
    removePanel();
    injectStyles();

    try {
      await fetchPages();
    } catch (error) {
      console.warn('[Pages Widget] load failed:', error);
      pages = [];
    }

    var container = findContainer();
    if (!container) {
      clearTimeout(mountTimer);
      mountTimer = setTimeout(mountPanel, 900);
      return;
    }

    var panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = buildPanelHTML();
    container.appendChild(panel);
    bindPanelEvents();
  }

  function removePanel() {
    var panel = document.getElementById(PANEL_ID);
    if (panel) panel.remove();
  }

  function findContainer() {
    var path = location.pathname || '';
    var pageListRoute = PAGE_LIST_ROUTE_MATCHERS.some(function (segment) {
      return path.indexOf(segment) !== -1;
    });

    if (pageListRoute) {
      var listCard = document.querySelector('app-page-list mat-card, app-page-list .mat-card');
      if (listCard && listCard.parentElement) return listCard.parentElement;

      var pageListHost = document.querySelector('app-page-list');
      if (pageListHost) return pageListHost;
    }

    var viewForm = document.querySelector('app-view-page .container, app-view-page');
    if (viewForm) return viewForm;

    var contentArea = document.querySelector('.all-page-render, .page-render-area-main, .dashboard-page-render');
    if (contentArea) return contentArea;

    return null;
  }

  function buildPanelHTML() {
    return [
      '<div class="pm-shell">',
      '  <div class="pm-header">',
      '    <div>',
      '      <div class="pm-title">Dynamic Pages</div>',
      '      <div class="pm-subtitle">Create pages, edit HTML, and place them in header or footer.</div>',
      '    </div>',
      '    <button class="pm-icon-btn" id="pm-close" title="Collapse section">−</button>',
      '  </div>',
      '  <div class="pm-toolbar">',
      '    <input id="pm-search" class="pm-input pm-search" placeholder="Search pages..." value="' + escAttr(searchTerm) + '" />',
      '    <button class="pm-btn pm-btn-muted" id="pm-refresh">Refresh</button>',
      '    <button class="pm-btn" id="pm-new-page">New Page</button>',
      '  </div>',
      '  <div class="pm-body" id="pm-body">',
      '    <div class="pm-grid">',
      '      <div class="pm-col pm-col-list">',
               buildPagesListHTML(),
      '      </div>',
      '      <div class="pm-col pm-col-form">',
               buildFormHTML(getEditingPage()),
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>',
    ].join('');
  }

  function buildPagesListHTML() {
    var filtered = getFilteredPages();
    var rows = filtered.length ? filtered.map(buildPageRowHTML).join('') : '<div class="pm-empty">No pages found.</div>';

    return [
      '<div class="pm-section-head">',
      '  <span>All Pages</span>',
      '  <span class="pm-badge">' + filtered.length + '</span>',
      '</div>',
      '<div class="pm-list">' + rows + '</div>',
    ].join('');
  }

  function buildPageRowHTML(page) {
    var activeClass = page._id === editingId ? ' pm-row-active' : '';
    return [
      '<button class="pm-row' + activeClass + '" data-edit-id="' + escAttr(page._id || '') + '">',
      '  <div class="pm-row-top">',
      '    <span class="pm-row-name">' + esc(page.name || 'Untitled Page') + '</span>',
      '    <span class="pm-status-chip ' + (page.isActive === false ? 'pm-status-off' : 'pm-status-on') + '">' + (page.isActive === false ? 'Inactive' : 'Active') + '</span>',
      '  </div>',
      '  <div class="pm-row-meta">/' + esc(page.slug || '') + (page.menuLabel ? ' • Menu: ' + esc(page.menuLabel) : '') + '</div>',
      '  <div class="pm-row-meta">' + menuSummary(page) + '</div>',
      '</button>',
    ].join('');
  }

  function buildFormHTML(page) {
    var draft = page || {
      name: '',
      slug: '',
      menuLabel: '',
      isHtml: true,
      isActive: true,
      showInHeader: false,
      showInFooter: false,
      footerGroup: 'policy',
      headerOrder: 99,
      footerOrder: 99,
      content: '',
      description: '',
    };

    return [
      '<div class="pm-section-head">',
      '  <span>' + (page ? 'Edit Page' : 'Create Page') + '</span>',
      '  <span class="pm-badge">' + (page ? esc(page.slug || '') : 'new') + '</span>',
      '</div>',
      '<div id="pm-form-message" class="pm-form-message"></div>',
      '<form id="pm-form" class="pm-form">',
      '  <input type="hidden" id="pm-page-id" value="' + escAttr(page && page._id ? page._id : '') + '" />',
      '  <div class="pm-form-grid">',
      fieldHTML('Page Name', '<input id="pm-name" class="pm-input" value="' + escAttr(draft.name || '') + '" placeholder="About Us" required />'),
      fieldHTML('Slug', '<input id="pm-slug" class="pm-input" value="' + escAttr(draft.slug || '') + '" placeholder="about-us" required />'),
      fieldHTML('Menu Label', '<input id="pm-menu-label" class="pm-input" value="' + escAttr(draft.menuLabel || '') + '" placeholder="Optional label for menu" />'),
      fieldHTML('Footer Group', [
        '<select id="pm-footer-group" class="pm-input">',
        optionHTML('feature', draft.footerGroup === 'feature', 'Feature'),
        optionHTML('policy', !draft.footerGroup || draft.footerGroup === 'policy', 'Policy'),
        optionHTML('none', draft.footerGroup === 'none', 'None'),
        '</select>',
      ].join('')),
      fieldHTML('Header Order', '<input id="pm-header-order" class="pm-input" type="number" value="' + escAttr(String(numberValue(draft.headerOrder, 99))) + '" />'),
      fieldHTML('Footer Order', '<input id="pm-footer-order" class="pm-input" type="number" value="' + escAttr(String(numberValue(draft.footerOrder, 99))) + '" />'),
      '</div>',
      '  <div class="pm-checks">',
      checkboxHTML('pm-is-active', draft.isActive !== false, 'Active'),
      checkboxHTML('pm-is-html', draft.isHtml !== false, 'HTML Content'),
      checkboxHTML('pm-show-header', !!draft.showInHeader, 'Show In Header'),
      checkboxHTML('pm-show-footer', !!draft.showInFooter, 'Show In Footer'),
      '  </div>',
      fieldHTML('HTML / Content', '<textarea id="pm-content" class="pm-textarea" placeholder="Write HTML or rich content here...">' + escText(draft.content || draft.description || '') + '</textarea>'),
      '  <div class="pm-actions">',
      '    <button type="submit" class="pm-btn">' + (page ? 'Save Changes' : 'Create Page') + '</button>',
      '    <button type="button" class="pm-btn pm-btn-muted" id="pm-reset-form">Reset</button>',
      (page ? '    <button type="button" class="pm-btn pm-btn-danger" id="pm-delete-page">Delete</button>' : ''),
      '  </div>',
      '</form>',
    ].join('');
  }

  function fieldHTML(label, control) {
    return [
      '<label class="pm-field">',
      '  <span class="pm-label">' + label + '</span>',
      control,
      '</label>',
    ].join('');
  }

  function checkboxHTML(id, checked, label) {
    return [
      '<label class="pm-check">',
      '  <input id="' + id + '" type="checkbox"' + (checked ? ' checked' : '') + ' />',
      '  <span>' + label + '</span>',
      '</label>',
    ].join('');
  }

  function optionHTML(value, selected, label) {
    return '<option value="' + value + '"' + (selected ? ' selected' : '') + '>' + label + '</option>';
  }

  function getFilteredPages() {
    if (!searchTerm) return pages;
    var q = searchTerm.toLowerCase();
    return pages.filter(function (page) {
      return [
        page.name || '',
        page.slug || '',
        page.menuLabel || '',
      ].join(' ').toLowerCase().indexOf(q) !== -1;
    });
  }

  function getEditingPage() {
    if (!editingId) return null;
    for (var i = 0; i < pages.length; i++) {
      if (pages[i]._id === editingId) return pages[i];
    }
    return null;
  }

  function bindPanelEvents() {
    var panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    var closeBtn = document.getElementById('pm-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        var body = document.getElementById('pm-body');
        if (!body) return;
        var collapsed = body.style.display === 'none';
        body.style.display = collapsed ? '' : 'none';
        closeBtn.textContent = collapsed ? '−' : '+';
      });
    }

    var refreshBtn = document.getElementById('pm-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async function () {
        await rerenderAfter(async function () {
          await fetchPages();
        });
      });
    }

    var newBtn = document.getElementById('pm-new-page');
    if (newBtn) {
      newBtn.addEventListener('click', function () {
        editingId = null;
        rerender();
      });
    }

    var searchInput = document.getElementById('pm-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        searchTerm = searchInput.value || '';
        rerender();
      });
    }

    panel.querySelectorAll('[data-edit-id]').forEach(function (row) {
      row.addEventListener('click', function () {
        editingId = row.getAttribute('data-edit-id');
        rerender();
      });
    });

    var form = document.getElementById('pm-form');
    if (form) {
      form.addEventListener('submit', async function (event) {
        event.preventDefault();
        await saveForm();
      });
    }

    var resetBtn = document.getElementById('pm-reset-form');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        rerender();
      });
    }

    var deleteBtn = document.getElementById('pm-delete-page');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async function () {
        await deleteCurrentPage();
      });
    }
  }

  async function saveForm() {
    var payload = readFormPayload();
    if (!payload.name) return showFormMessage('Page name is required.', true);
    if (!payload.slug) return showFormMessage('Slug is required.', true);

    var pageId = valueOf('pm-page-id');
    setSubmitting(true);

    try {
      if (pageId) {
        await apiPut('/api/additional-page/update-by-id/' + pageId, payload);
        showFormMessage('Page updated successfully.', false);
      } else {
        await apiPost('/api/additional-page/add', payload);
        showFormMessage('Page created successfully.', false);
      }

      await fetchPages();
      var matched = findPageBySlug(payload.slug);
      editingId = matched && matched._id ? matched._id : null;
      rerender();
    } catch (error) {
      console.error('[Pages Widget] save failed:', error);
      showFormMessage(error.message || 'Save failed.', true);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteCurrentPage() {
    var pageId = valueOf('pm-page-id');
    var page = getEditingPage();
    if (!pageId || !page) return;

    if (!window.confirm('Delete "' + (page.name || 'this page') + '"?')) return;

    setSubmitting(true);
    try {
      await apiDelete('/api/additional-page/delete-data/' + encodeURIComponent(page.slug || ''));
      editingId = null;
      await fetchPages();
      rerender();
    } catch (error) {
      console.error('[Pages Widget] delete failed:', error);
      showFormMessage(error.message || 'Delete failed.', true);
    } finally {
      setSubmitting(false);
    }
  }

  function readFormPayload() {
    var content = valueOf('pm-content');
    return {
      name: valueOf('pm-name').trim(),
      slug: slugify(valueOf('pm-slug')),
      menuLabel: valueOf('pm-menu-label').trim(),
      footerGroup: valueOf('pm-footer-group') || 'policy',
      headerOrder: numberValue(valueOf('pm-header-order'), 99),
      footerOrder: numberValue(valueOf('pm-footer-order'), 99),
      isActive: checkedOf('pm-is-active'),
      isHtml: checkedOf('pm-is-html'),
      showInHeader: checkedOf('pm-show-header'),
      showInFooter: checkedOf('pm-show-footer'),
      content: content,
      description: content,
    };
  }

  function slugify(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function rerender() {
    var panel = document.getElementById(PANEL_ID);
    if (!panel) return;
    panel.innerHTML = buildPanelHTML();
    bindPanelEvents();
  }

  async function rerenderAfter(work) {
    try {
      await work();
    } catch (error) {
      console.error('[Pages Widget] action failed:', error);
    }
    rerender();
  }

  function setSubmitting(disabled) {
    var form = document.getElementById('pm-form');
    if (!form) return;
    form.querySelectorAll('input, textarea, select, button').forEach(function (el) {
      el.disabled = disabled;
    });
  }

  function showFormMessage(message, isError) {
    var el = document.getElementById('pm-form-message');
    if (!el) return;
    el.textContent = message || '';
    el.className = 'pm-form-message' + (message ? (isError ? ' pm-msg-error' : ' pm-msg-success') : '');
  }

  function findPageBySlug(slug) {
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].slug === slug) return pages[i];
    }
    return null;
  }

  function menuSummary(page) {
    var bits = [];
    if (page.showInHeader) bits.push('Header #' + numberValue(page.headerOrder, 99));
    if (page.showInFooter) bits.push('Footer #' + numberValue(page.footerOrder, 99));
    if (page.showInFooter && page.footerGroup) bits.push(capitalize(page.footerGroup));
    if (!bits.length) bits.push('Not in menu');
    return bits.join(' • ');
  }

  function capitalize(value) {
    value = String(value || '');
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
  }

  function valueOf(id) {
    var el = document.getElementById(id);
    return el ? el.value || '' : '';
  }

  function checkedOf(id) {
    var el = document.getElementById(id);
    return !!(el && el.checked);
  }

  function numberValue(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function esc(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escText(value) {
    return esc(value).replace(/"/g, '&quot;');
  }

  function escAttr(value) {
    return esc(value).replace(/"/g, '&quot;');
  }

  function injectStyles() {
    if (document.getElementById(STYLES_ID)) return;

    var style = document.createElement('style');
    style.id = STYLES_ID;
    style.textContent = [
      '#' + PANEL_ID + '{position:relative;width:95%;max-width:1150px;margin:28px auto 40px;z-index:1;font-family:Nunito Sans,sans-serif}',
      '#' + PANEL_ID + ' .pm-shell{background:#111827;color:#e5e7eb;border:1px solid rgba(255,255,255,.08);border-radius:16px;box-shadow:0 16px 40px rgba(0,0,0,.18);overflow:hidden}',
      '#' + PANEL_ID + ' .pm-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:16px 18px;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(135deg,#111827,#1f2937)}',
      '#' + PANEL_ID + ' .pm-title{font-size:18px;font-weight:800;color:#fff}',
      '#' + PANEL_ID + ' .pm-subtitle{font-size:12px;color:#94a3b8;margin-top:4px;line-height:1.45}',
      '#' + PANEL_ID + ' .pm-icon-btn{border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.04);color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer}',
      '#' + PANEL_ID + ' .pm-toolbar{display:flex;gap:10px;align-items:center;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.08);background:#0f172a}',
      '#' + PANEL_ID + ' .pm-search{flex:1}',
      '#' + PANEL_ID + ' .pm-body{max-height:calc(100vh - 180px);overflow:auto}',
      '#' + PANEL_ID + ' .pm-grid{display:grid;grid-template-columns:minmax(280px,360px) minmax(0,1fr)}',
      '#' + PANEL_ID + ' .pm-col{padding:18px}',
      '#' + PANEL_ID + ' .pm-col-list{border-right:1px solid rgba(255,255,255,.08);background:#0b1220}',
      '#' + PANEL_ID + ' .pm-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;font-weight:700;color:#fff}',
      '#' + PANEL_ID + ' .pm-badge{font-size:11px;padding:4px 8px;border-radius:999px;background:#1e293b;color:#cbd5e1}',
      '#' + PANEL_ID + ' .pm-list{display:flex;flex-direction:column;gap:8px}',
      '#' + PANEL_ID + ' .pm-row{width:100%;text-align:left;border:1px solid rgba(255,255,255,.07);background:#111827;border-radius:12px;padding:12px;cursor:pointer;transition:.2s}',
      '#' + PANEL_ID + ' .pm-row:hover,#' + PANEL_ID + ' .pm-row-active{border-color:#38bdf8;background:#172033}',
      '#' + PANEL_ID + ' .pm-row-top{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:6px}',
      '#' + PANEL_ID + ' .pm-row-name{font-weight:700;color:#fff;display:block}',
      '#' + PANEL_ID + ' .pm-row-meta{font-size:12px;color:#94a3b8;line-height:1.45}',
      '#' + PANEL_ID + ' .pm-status-chip{font-size:10px;font-weight:800;padding:4px 8px;border-radius:999px;text-transform:uppercase;letter-spacing:.04em}',
      '#' + PANEL_ID + ' .pm-status-on{background:rgba(34,197,94,.15);color:#86efac}',
      '#' + PANEL_ID + ' .pm-status-off{background:rgba(248,113,113,.15);color:#fca5a5}',
      '#' + PANEL_ID + ' .pm-empty{padding:14px;border:1px dashed rgba(255,255,255,.14);border-radius:12px;color:#94a3b8;font-size:13px}',
      '#' + PANEL_ID + ' .pm-form{display:flex;flex-direction:column;gap:14px}',
      '#' + PANEL_ID + ' .pm-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}',
      '#' + PANEL_ID + ' .pm-field{display:flex;flex-direction:column;gap:6px}',
      '#' + PANEL_ID + ' .pm-label{font-size:12px;font-weight:700;color:#cbd5e1}',
      '#' + PANEL_ID + ' .pm-input,#' + PANEL_ID + ' .pm-textarea{width:100%;border:1px solid rgba(255,255,255,.12);background:#0f172a;color:#fff;border-radius:10px;padding:10px 12px;font:inherit}',
      '#' + PANEL_ID + ' .pm-textarea{min-height:260px;resize:vertical;line-height:1.5}',
      '#' + PANEL_ID + ' .pm-input:focus,#' + PANEL_ID + ' .pm-textarea:focus{outline:none;border-color:#38bdf8;box-shadow:0 0 0 3px rgba(56,189,248,.12)}',
      '#' + PANEL_ID + ' .pm-checks{display:flex;flex-wrap:wrap;gap:12px}',
      '#' + PANEL_ID + ' .pm-check{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;background:#0f172a;border:1px solid rgba(255,255,255,.08)}',
      '#' + PANEL_ID + ' .pm-actions{display:flex;flex-wrap:wrap;gap:10px}',
      '#' + PANEL_ID + ' .pm-btn{border:none;background:#0284c7;color:#fff;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer}',
      '#' + PANEL_ID + ' .pm-btn:hover{background:#0369a1}',
      '#' + PANEL_ID + ' .pm-btn-muted{background:#334155}',
      '#' + PANEL_ID + ' .pm-btn-muted:hover{background:#475569}',
      '#' + PANEL_ID + ' .pm-btn-danger{background:#b91c1c}',
      '#' + PANEL_ID + ' .pm-btn-danger:hover{background:#991b1b}',
      '#' + PANEL_ID + ' .pm-form-message{min-height:20px;font-size:12px;font-weight:700}',
      '#' + PANEL_ID + ' .pm-msg-success{color:#86efac}',
      '#' + PANEL_ID + ' .pm-msg-error{color:#fca5a5}',
      '@media (max-width: 900px){#' + PANEL_ID + '{width:auto;max-width:none;margin:20px 16px 28px}#' + PANEL_ID + ' .pm-grid{grid-template-columns:1fr}#' + PANEL_ID + ' .pm-col-list{border-right:none;border-bottom:1px solid rgba(255,255,255,.08)}#' + PANEL_ID + ' .pm-form-grid{grid-template-columns:1fr}}'
    ].join('');

    document.head.appendChild(style);
  }
})();
