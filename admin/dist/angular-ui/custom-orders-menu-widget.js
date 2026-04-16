/**
 * Custom Orders Menu Widget
 * Injects a "Custom Orders" link into the Angular admin sidebar under Sales.
 * Drop this file in /admin/dist/angular-ui/ and include it in index.html.
 */
(function () {
  'use strict';

  var LINK_ID  = 'co-sidebar-link';
  var STYLE_ID = 'co-sidebar-style';
  var CUSTOM_PAGE_URL = 'https://api.shobaz.com/upload/static/custom-orders.html';
  var injectTimer = null;

  /* ── Inject CSS once ── */
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = [
      '#' + LINK_ID + ' {',
      '  display: flex !important;',
      '  align-items: center;',
      '  gap: 6px;',
      '  cursor: pointer;',
      '  transition: background .15s, color .15s;',
      '}',
      '#' + LINK_ID + ':hover {',
      '  color: #a78bfa !important;',
      '  background: rgba(124,58,237,.12) !important;',
      '}',
      '#' + LINK_ID + ' .co-badge {',
      '  font-size: 9px;',
      '  font-weight: 800;',
      '  background: linear-gradient(135deg,#7c3aed,#4f46e5);',
      '  color: #fff;',
      '  padding: 2px 6px;',
      '  border-radius: 10px;',
      '  letter-spacing: .04em;',
      '  text-transform: uppercase;',
      '  line-height: 1.4;',
      '  flex-shrink: 0;',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ── Try to inject the sidebar link ── */
  function tryInject() {
    if (document.getElementById(LINK_ID)) return; // already injected

    // Find any existing "Orders List" or "Pre Orders" li/a in the sidebar
    var allLinks = document.querySelectorAll(
      'mat-nav-list a, mat-list-item a, .mat-list-item a, ' +
      '[class*="sidebar"] a, [class*="nav"] a, ' +
      'a[routerlink], a[routerLink], a[ng-reflect-router-link]'
    );

    var targetEl = null;
    var parentContainer = null;

    allLinks.forEach(function (el) {
      var text = (el.textContent || el.innerText || '').trim();
      if (!targetEl && (text === 'Orders List' || text.includes('Orders List'))) {
        targetEl = el;
      }
    });

    // Fall back: find any <li> containing "Orders List" text
    if (!targetEl) {
      var allLi = document.querySelectorAll('li, mat-list-item, .menu-item, [class*="menu-item"]');
      allLi.forEach(function (el) {
        var text = (el.textContent || '').trim();
        if (!targetEl && text.startsWith('Orders List')) {
          targetEl = el;
        }
      });
    }

    if (!targetEl) return; // sidebar not rendered yet

    // Determine the parent to insert into
    parentContainer = targetEl.parentElement;
    if (!parentContainer) return;

    // Create our link element — match the same tag as the sibling
    var tagName = targetEl.tagName.toLowerCase();
    var newEl = document.createElement(tagName);
    newEl.id = LINK_ID;

    // Copy classes from the target so it inherits the same styling
    if (targetEl.className) {
      newEl.className = targetEl.className;
    }

    // Use click handler instead of href — Angular's router intercepts <a href> clicks
    newEl.style.cssText = targetEl.style.cssText;
    newEl.style.cursor = 'pointer';

    // Build inner HTML to match style of sibling items
    var innerA = targetEl.querySelector('a');
    if (innerA && tagName !== 'a') {
      // The tag itself is a wrapper (e.g. li) — clone inner element but as a span
      var a = document.createElement('span');
      a.id = LINK_ID;
      a.style.cssText = innerA.style.cssText;
      a.style.cursor = 'pointer';
      a.className = innerA.className;
      a.innerHTML = buildLinkHTML(innerA.innerHTML);
      // Navigate on click, bypassing Angular router
      a.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        window.location.href = CUSTOM_PAGE_URL;
      }, true);
      newEl.appendChild(a);
      newEl.id = LINK_ID + '-wrap';
    } else {
      newEl.innerHTML = buildLinkHTML(targetEl.innerHTML);
      // Navigate on click, bypassing Angular router
      newEl.addEventListener('click', function (e) {
        e.stopPropagation();
        e.preventDefault();
        window.location.href = CUSTOM_PAGE_URL;
      }, true);
    }

    // Insert immediately after the target
    if (targetEl.nextSibling) {
      parentContainer.insertBefore(newEl, targetEl.nextSibling);
    } else {
      parentContainer.appendChild(newEl);
    }

    injectStyles();
  }

  function buildLinkHTML(originalHTML) {
    // Try to reuse the icon + structure of the existing item,
    // then replace the text node with our label.
    var tmp = document.createElement('div');
    tmp.innerHTML = originalHTML;

    // Replace text nodes with our label
    var walker = document.createTreeWalker(tmp, NodeFilter.SHOW_TEXT, null, false);
    var textNodes = [];
    var node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue && node.nodeValue.trim()) textNodes.push(node);
    }
    if (textNodes.length) {
      textNodes[textNodes.length - 1].nodeValue = 'Custom Orders';
    } else {
      tmp.appendChild(document.createTextNode('Custom Orders'));
    }

    // Append the NEW badge
    var badge = document.createElement('span');
    badge.className = 'co-badge';
    badge.textContent = 'NEW';
    tmp.appendChild(badge);

    return tmp.innerHTML;
  }

  /* ── Watch for Angular to render the sidebar ── */
  function startWatcher() {
    tryInject();

    // MutationObserver fires on every Angular render cycle
    var observer = new MutationObserver(function () {
      if (!document.getElementById(LINK_ID) && !document.getElementById(LINK_ID + '-wrap')) {
        clearTimeout(injectTimer);
        injectTimer = setTimeout(tryInject, 300);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  /* ── Bootstrap ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startWatcher);
  } else {
    startWatcher();
  }

  // Also retry several times during Angular bootstrap (Angular loads async)
  [500, 1000, 2000, 3000, 5000].forEach(function (delay) {
    setTimeout(tryInject, delay);
  });
})();
