(function (root) {
  'use strict';

  if (!root.document) return;

  /*
   * Order editor for custom-orders.html. Two modes:
   *  - incomplete: abandoned checkout (PUT /api/order/update-incomplete-order-by-id/:id)
   *  - order:      placed order      (PUT /api/order/update-order-admin/:id)
   * Exposed as window.ShobazIncompleteEditor.{open, openOrder, close}.
   */
  var document = root.document;
  var API = /^(localhost|127\.0\.0\.1)$/.test(root.location.hostname) ? 'http://localhost:4000' : 'https://api.shobaz.com';
  var items = [];
  var currentId = '';
  var currentMode = 'incomplete';
  var lastFocus = null;
  var searchTimer = null;
  var searchController = null;

  var CSS = [
    '.ie-overlay{position:fixed;inset:0;z-index:12500;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,.5)}',
    '.ie-overlay.open{display:flex}.ie-dialog{width:min(780px,100%);max-height:94vh;display:flex;flex-direction:column;overflow:hidden;border-radius:16px;background:#fff;box-shadow:0 20px 20px -8px rgba(26,26,26,.28),0 0 0 1px rgba(0,0,0,.08);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#303030}',
    '.ie-header{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#f3f3f3;border-bottom:1px solid #e3e3e3}.ie-header h2{margin:0;font-size:14px;font-weight:650}.ie-header p{margin:2px 0 0;color:#616161;font-size:12px}',
    '.ie-close{margin-left:auto;width:28px;height:28px;border:0;border-radius:8px;background:none;color:#616161;font-size:20px;line-height:1;cursor:pointer}.ie-close:hover{background:rgba(0,0,0,.06);color:#303030}',
    '.ie-body{min-height:0;overflow:auto;padding:16px}.ie-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}.ie-grid.full{grid-template-columns:1fr}',
    '.ie-label,.ie-small-label{display:block;margin-bottom:4px;color:#303030;font-size:12px;font-weight:550}.ie-small-label{color:#616161;font-weight:500}',
    '.ie-control,.ie-item input{width:100%;min-height:32px;border:1px solid #b5b5b5;border-top-color:#8a8a8a;border-radius:8px;padding:6px 10px;background:#fdfdfd;color:#303030;font:400 13px/1.4 inherit;outline:0}',
    '.ie-control:focus,.ie-item input:focus{border-color:#005bd3;box-shadow:0 0 0 1px #005bd3;background:#fff}.ie-control[aria-invalid="true"]{border-color:#c70a24;background:#fff4f4}textarea.ie-control{resize:vertical}',
    '.ie-search-row{display:grid;grid-template-columns:1fr auto;gap:8px}.ie-results{display:none;max-height:200px;overflow:auto;margin-top:6px;border:1px solid #e3e3e3;border-radius:10px;box-shadow:0 4px 6px -2px rgba(26,26,26,.15)}.ie-results.open{display:block}',
    '.ie-result{display:flex;width:100%;align-items:center;justify-content:space-between;gap:10px;padding:8px 12px;border:0;border-bottom:1px solid #ebebeb;background:#fff;color:#303030;font:400 13px/1.35 inherit;text-align:left;cursor:pointer}.ie-result:last-child{border-bottom:0}.ie-result:hover,.ie-result:focus{background:#f7f7f7;outline:0}.ie-result strong{white-space:nowrap;font-weight:600}',
    '.ie-button{display:inline-flex;height:32px;align-items:center;justify-content:center;gap:6px;border:0;border-radius:8px;padding:0 12px;background:#303030;color:#fff;font:550 13px/1 inherit;cursor:pointer;box-shadow:inset 0 -1px 0 1px rgba(0,0,0,.8),inset 0 .5px 0 1.5px rgba(255,255,255,.25)}.ie-button:hover{background:#1a1a1a}.ie-button:disabled{opacity:.6;cursor:not-allowed}',
    '.ie-button.secondary{background:#fff;color:#303030;box-shadow:inset 0 -1px 0 0 #b5b5b5,inset 0 0 0 1px rgba(0,0,0,.1)}.ie-button.secondary:hover{background:#f7f7f7}',
    '.ie-items{border:1px solid #e3e3e3;border-radius:12px;overflow:hidden}.ie-empty{padding:16px;color:#8a8a8a;text-align:center;font-size:13px}',
    '.ie-item{display:grid;grid-template-columns:minmax(0,1fr) 110px 80px 32px;align-items:end;gap:8px;padding:10px 12px;border-bottom:1px solid #ebebeb}.ie-item:last-child{border-bottom:0}.ie-item-name{align-self:center;font-size:13px;font-weight:550;line-height:1.35}',
    '.ie-remove{width:32px;height:32px;border:0;border-radius:8px;background:#fff;color:#8e0b21;font-size:18px;line-height:1;cursor:pointer;box-shadow:inset 0 0 0 1px #e3e3e3}.ie-remove:hover{background:#fee8e7}',
    '.ie-totals{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:20px;margin-top:10px;color:#616161;font-size:12px}.ie-totals strong{display:block;margin-top:2px;color:#303030;font-size:15px;font-weight:650;font-variant-numeric:tabular-nums}',
    '.ie-status{min-height:18px;margin:10px 0 0;color:#616161;font-size:12px;font-weight:550}.ie-status.error{color:#8e0b21}.ie-status.success{color:#014b40}',
    '.ie-warning{display:none;margin-bottom:12px;padding:8px 12px;border-radius:10px;background:#fff1a8;color:#4f4700;font-size:12px;font-weight:550}.ie-warning.show{display:block}',
    '.ie-footer{display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid #e3e3e3}',
    '.ie-only-order{display:none}.ie-mode-order .ie-only-order{display:block}',
    '@media(max-width:620px){.ie-overlay{align-items:flex-end;padding:0}.ie-dialog{max-height:96vh;border-radius:16px 16px 0 0}.ie-grid{grid-template-columns:1fr}.ie-item{grid-template-columns:minmax(0,1fr) 88px 64px 32px}.ie-item-name{grid-column:1/-1}}'
  ].join('\n');

  var HTML = [
    '<div class="ie-overlay" id="ie-overlay" aria-hidden="true">',
    '<section class="ie-dialog" id="ie-dialog" role="dialog" aria-modal="true" aria-labelledby="ie-title">',
    '<header class="ie-header"><div><h2 id="ie-title">Edit incomplete order</h2><p id="ie-subtitle">Changes will be used when this order is added or sent to courier.</p></div><button class="ie-close" id="ie-close" type="button" aria-label="Close">&times;</button></header>',
    '<div class="ie-body">',
    '<div class="ie-warning" id="ie-warning" role="note"></div>',
    '<div class="ie-grid"><div><label class="ie-label" for="ie-name">Customer name</label><input class="ie-control" id="ie-name" autocomplete="name"></div><div><label class="ie-label" for="ie-phone">Phone</label><input class="ie-control" id="ie-phone" inputmode="tel" autocomplete="tel"></div></div>',
    '<div class="ie-grid full"><div><label class="ie-label" for="ie-address">Shipping address</label><input class="ie-control" id="ie-address" autocomplete="street-address"></div></div>',
    '<div class="ie-grid"><div><label class="ie-label" for="ie-city">City / area</label><input class="ie-control" id="ie-city" autocomplete="address-level2"></div><div><label class="ie-label" for="ie-email">Email (optional)</label><input class="ie-control" id="ie-email" type="email" autocomplete="email"></div></div>',
    '<div class="ie-grid"><div><label class="ie-label" for="ie-payment">Payment type</label><select class="ie-control" id="ie-payment"><option value="cash_on_delivery">Cash on Delivery</option><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="card">Card</option><option value="online_payment">Online payment</option></select></div><div><label class="ie-label" for="ie-delivery">Delivery charge (৳)</label><input class="ie-control" id="ie-delivery" type="number" min="0" step="1" inputmode="decimal"></div></div>',
    '<div class="ie-grid full ie-only-order"><div><label class="ie-label" for="ie-discount">Discount (৳)</label><input class="ie-control" id="ie-discount" type="number" min="0" step="1" inputmode="decimal"><span class="ie-small-label" style="margin-top:4px">Coupon or order discount. Book prices below are final prices.</span></div></div>',
    '<div class="ie-grid full"><div><label class="ie-label" for="ie-search">Add or replace products</label><div class="ie-search-row"><input class="ie-control" id="ie-search" autocomplete="off" placeholder="Search product name…"><button class="ie-button secondary" id="ie-search-button" type="button"><i class="fas fa-search"></i> Search</button></div><div class="ie-results" id="ie-results"></div></div></div>',
    '<span class="ie-label">Products, unit prices and quantities</span><div class="ie-items" id="ie-items"></div><div class="ie-totals"><span>Products<strong id="ie-subtotal">৳0</strong></span><span class="ie-only-order">Discount<strong id="ie-discount-total">৳0</strong></span><span>Delivery<strong id="ie-delivery-total">৳0</strong></span><span>Total<strong id="ie-grand-total">৳0</strong></span></div>',
    '<div class="ie-grid full" style="margin-top:14px"><div><label class="ie-label" for="ie-note">Customer note</label><textarea class="ie-control" id="ie-note" rows="2"></textarea></div></div>',
    '<p class="ie-status" id="ie-status" role="status" aria-live="polite"></p></div>',
    '<footer class="ie-footer"><button class="ie-button secondary" id="ie-cancel" type="button">Cancel</button><button class="ie-button" id="ie-save" type="button"><i class="fas fa-save"></i> Save changes</button></footer>',
    '</section></div>'
  ].join('');

  function byId(id) { return document.getElementById(id); }
  function token() { try { return root.localStorage.getItem('co_admin_token') || ''; } catch (e) { return ''; } }
  function headers() { return { 'Content-Type': 'application/json', administrator: token() }; }
  function setStatus(message, type) { var el = byId('ie-status'); el.textContent = message || ''; el.className = 'ie-status' + (type ? ' ' + type : ''); }
  function number(value) { var parsed = Number(value); return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0; }
  function itemPrice(item) {
    var regular = number(item.regularPrice || item.price || item.salePrice);
    var discount = number(item.discountAmount);
    var type = String(item.discountType || '').toUpperCase();
    if ((type === 'PERCENTAGE' || type === '1') && discount) return Math.floor(regular - (discount / 100) * regular);
    if ((type === 'CASH' || type === '2') && discount) return Math.floor(regular - discount);
    return number(item.unitPrice || item.salePrice || regular);
  }
  function quantity(item) { return Math.max(1, parseInt(item.editQty || item.quantity || item.selectedQty || 1, 10) || 1); }
  function normalizePayment(value) {
    var payment = String(value || 'cash_on_delivery').toLowerCase();
    return payment === 'cod' ? 'cash_on_delivery' : payment;
  }
  function parseResponse(response) {
    return response.text().then(function (text) {
      var payload = {};
      try { payload = text ? JSON.parse(text) : {}; } catch (error) { payload = { message: text || 'Unexpected server response' }; }
      if (response.status === 401) {
        root.dispatchEvent(new CustomEvent('shobaz:admin-auth-required', { detail: { message: 'Session expired. Please log in again.' } }));
      }
      if (!response.ok || payload.success === false) {
        var message = payload.message || 'Request failed (HTTP ' + response.status + ')';
        throw new Error(Array.isArray(message) ? message.join(', ') : message);
      }
      return payload;
    });
  }
  function money(value) { return '৳' + Math.round(value).toLocaleString(); }
  function totals() {
    var subtotal = items.reduce(function (sum, item) { return sum + number(item.editPrice) * quantity(item); }, 0);
    var delivery = number(byId('ie-delivery').value);
    var discount = currentMode === 'order' ? Math.min(number(byId('ie-discount').value), subtotal) : 0;
    var grand = Math.max(0, subtotal + delivery - discount);
    byId('ie-subtotal').textContent = money(subtotal);
    byId('ie-discount-total').textContent = discount ? '-' + money(discount) : money(0);
    byId('ie-delivery-total').textContent = money(delivery);
    byId('ie-grand-total').textContent = money(grand);
    return { subTotal: subtotal, deliveryCharge: delivery, discount: discount, grandTotal: grand };
  }
  function renderItems() {
    var box = byId('ie-items');
    box.innerHTML = '';
    if (!items.length) { box.innerHTML = '<div class="ie-empty">No products selected. Search above to add one.</div>'; totals(); return; }
    items.forEach(function (item, index) {
      var row = document.createElement('div'); row.className = 'ie-item';
      var name = document.createElement('div'); name.className = 'ie-item-name'; name.textContent = item.name || item.nameEn || 'Unnamed product';
      var priceWrap = document.createElement('label'); priceWrap.innerHTML = '<span class="ie-small-label">Unit price (৳)</span>';
      var price = document.createElement('input'); price.type = 'number'; price.min = '0'; price.step = '1'; price.value = item.editPrice; price.setAttribute('aria-label', 'Unit price for ' + name.textContent);
      price.addEventListener('input', function () { item.editPrice = number(price.value); totals(); }); priceWrap.appendChild(price);
      var qtyWrap = document.createElement('label'); qtyWrap.innerHTML = '<span class="ie-small-label">Quantity</span>';
      var qty = document.createElement('input'); qty.type = 'number'; qty.min = '1'; qty.step = '1'; qty.value = quantity(item); qty.setAttribute('aria-label', 'Quantity for ' + name.textContent);
      qty.addEventListener('input', function () { item.editQty = Math.max(1, parseInt(qty.value, 10) || 1); totals(); }); qtyWrap.appendChild(qty);
      var remove = document.createElement('button'); remove.type = 'button'; remove.className = 'ie-remove'; remove.innerHTML = '&times;'; remove.setAttribute('aria-label', 'Remove ' + name.textContent);
      remove.addEventListener('click', function () { items.splice(index, 1); renderItems(); });
      row.append(name, priceWrap, qtyWrap, remove); box.appendChild(row);
    });
    totals();
  }
  function renderResults(products) {
    var box = byId('ie-results'); box.innerHTML = ''; box.classList.add('open');
    if (!products.length) { box.innerHTML = '<div class="ie-empty">No products found.</div>'; return; }
    products.forEach(function (product) {
      var button = document.createElement('button'); button.type = 'button'; button.className = 'ie-result';
      var label = document.createElement('span'); label.textContent = product.name || product.nameEn || 'Unnamed product';
      var price = document.createElement('strong'); price.textContent = '৳' + number(product.salePrice || product.price).toLocaleString();
      button.append(label, price); button.addEventListener('click', function () {
        var id = String(product._id || '');
        var existing = items.find(function (item) { return String(item._id) === id; });
        if (existing) existing.editQty = quantity(existing) + 1;
        else items.push(Object.assign({}, product, { editPrice: itemPrice(product), editQty: 1 }));
        byId('ie-search').value = ''; box.classList.remove('open'); renderItems();
      });
      box.appendChild(button);
    });
  }
  function search() {
    var query = byId('ie-search').value.trim(); var box = byId('ie-results');
    if (query.length < 2) { box.classList.remove('open'); box.innerHTML = ''; return; }
    if (searchController) searchController.abort(); searchController = new AbortController();
    box.classList.add('open'); box.innerHTML = '<div class="ie-empty">Searching…</div>';
    fetch(API + '/api/product/search?q=' + encodeURIComponent(query) + '&limit=12', { signal: searchController.signal })
      .then(parseResponse).then(function (payload) { renderResults(Array.isArray(payload.data) ? payload.data : []); })
      .catch(function (error) {
        if (error.name === 'AbortError') return;
        var empty = document.createElement('div'); empty.className = 'ie-empty'; empty.textContent = String(error.message || 'Search failed');
        box.innerHTML = ''; box.appendChild(empty);
      });
  }
  function close() {
    byId('ie-overlay').classList.remove('open'); byId('ie-overlay').setAttribute('aria-hidden', 'true'); document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function setMode(mode, order) {
    currentMode = mode;
    byId('ie-dialog').classList.toggle('ie-mode-order', mode === 'order');
    byId('ie-title').textContent = mode === 'order'
      ? 'Edit order' + (order && order.orderId ? ' #' + order.orderId : '')
      : 'Edit incomplete order';
    byId('ie-subtitle').textContent = mode === 'order'
      ? 'Customer, books, prices and delivery. Status and payment stay as they are.'
      : 'Changes will be used when this order is added or sent to courier.';
    var warn = byId('ie-warning');
    var booked = mode === 'order' && order && order.courierData && order.courierData.providerName;
    warn.textContent = booked ? 'This order is already booked with ' + order.courierData.providerName + '. You can fix the customer\'s details, but changes that alter the total are blocked because the parcel\'s cash-on-delivery amount would no longer match.' : '';
    warn.classList.toggle('show', !!booked);
  }
  function fill(order) {
    byId('ie-name').value = order.name || ''; byId('ie-phone').value = order.phoneNo || ''; byId('ie-address').value = order.shippingAddress || '';
    byId('ie-city').value = order.city || ''; byId('ie-email').value = order.email || ''; byId('ie-payment').value = normalizePayment(order.paymentType);
    if (!byId('ie-payment').value) byId('ie-payment').value = 'cash_on_delivery';
    byId('ie-delivery').value = number(order.deliveryCharge); byId('ie-note').value = order.note || '';
    items = (Array.isArray(order.orderedItems) ? order.orderedItems : []).map(function (item) { return Object.assign({}, item, { editPrice: itemPrice(item), editQty: quantity(item) }); });
    if (currentMode === 'order') {
      // What the customer pays beyond the book prices: coupon / order discount.
      var lineTotal = items.reduce(function (sum, item) { return sum + number(item.editPrice) * quantity(item); }, 0);
      var extra = lineTotal + number(order.deliveryCharge) - number(order.grandTotal);
      byId('ie-discount').value = Math.max(0, Math.round(extra));
    } else {
      byId('ie-discount').value = 0;
    }
    loadedMoney = moneySignature();
  }
  // Books, prices, quantities, delivery and discount as one string, to tell
  // whether a save changes money at all (customer-only edits keep the stored total).
  var loadedMoney = '';
  function moneySignature() {
    return JSON.stringify({
      items: items.map(function (item) { return [String(item._id || item.product || ''), number(item.editPrice), quantity(item)]; }),
      delivery: number(byId('ie-delivery').value),
      discount: number(byId('ie-discount').value),
    });
  }
  function openWith(id, mode) {
    if (!id) return; currentId = id; lastFocus = document.activeElement; items = []; setMode(mode); renderItems(); setStatus('Loading order…');
    byId('ie-save').disabled = false;
    byId('ie-overlay').classList.add('open'); byId('ie-overlay').setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    var url = mode === 'order' ? '/api/order/' + encodeURIComponent(id) : '/api/order/incomplete/' + encodeURIComponent(id);
    fetch(API + url, { headers: headers() }).then(parseResponse).then(function (payload) {
      var order = payload.data;
      if (!order) throw new Error('Order was not found.');
      if (mode === 'incomplete' && order.status === 'converted') throw new Error('Converted orders can no longer be edited here.');
      if (mode === 'order' && [6, 7, 9, 10].indexOf(Number(order.orderStatus)) !== -1) throw new Error('Cancelled or trashed orders cannot be edited.');
      setMode(mode, order);
      fill(order);
      renderItems(); setStatus(''); byId('ie-name').focus();
    }).catch(function (error) { setStatus(error.message || 'Could not load order.', 'error'); byId('ie-save').disabled = true; });
  }
  function validate() {
    var fields = [['ie-name', 'Customer name is required.'], ['ie-phone', 'Phone number is required.'], ['ie-address', 'Shipping address is required.']];
    fields.forEach(function (entry) { byId(entry[0]).setAttribute('aria-invalid', byId(entry[0]).value.trim() ? 'false' : 'true'); });
    var missing = fields.find(function (entry) { return !byId(entry[0]).value.trim(); });
    if (missing) { setStatus(missing[1], 'error'); byId(missing[0]).focus(); return false; }
    if (!items.length) { setStatus('Select at least one product.', 'error'); byId('ie-search').focus(); return false; }
    return true;
  }
  function save() {
    if (!validate()) return;
    var computed = totals();
    var orderedItems = items.map(function (item) {
      var price = number(item.editPrice); var qty = quantity(item); var output = Object.assign({}, item);
      delete output.editPrice; delete output.editQty; delete output.selectedQty;
      output.quantity = qty; output.regularPrice = price; output.unitPrice = price; output.salePrice = price; output.discountAmount = 0; output.discountType = 2;
      return output;
    });
    var payload = {
      name: byId('ie-name').value.trim(), phoneNo: byId('ie-phone').value.trim(), shippingAddress: byId('ie-address').value.trim(),
      city: byId('ie-city').value.trim(), email: byId('ie-email').value.trim(), paymentType: byId('ie-payment').value,
      deliveryCharge: computed.deliveryCharge, orderedItems: orderedItems, note: byId('ie-note').value.trim()
    };
    var path;
    if (currentMode === 'order') {
      if (moneySignature() === loadedMoney) {
        // Only customer details changed: leave books and totals exactly as stored.
        delete payload.orderedItems;
        delete payload.deliveryCharge;
      } else {
        payload.discount = computed.discount;
      }
      path = '/api/order/update-order-admin/';
    } else {
      payload.paymentStatus = 'unpaid'; payload.subTotal = computed.subTotal; payload.discount = 0; payload.grandTotal = computed.grandTotal;
      path = '/api/order/update-incomplete-order-by-id/';
    }
    var button = byId('ie-save'); button.disabled = true; button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving…'; setStatus('');
    fetch(API + path + encodeURIComponent(currentId), { method: 'PUT', headers: headers(), body: JSON.stringify(payload) })
      .then(parseResponse).then(function () {
        setStatus('Changes saved.', 'success');
        root.dispatchEvent(new CustomEvent('shobaz:order-edited', { detail: { id: currentId, mode: currentMode } }));
        root.setTimeout(close, 350);
        button.disabled = false; button.innerHTML = '<i class="fas fa-save"></i> Save changes';
      })
      .catch(function (error) { setStatus(error.message || 'Could not save changes.', 'error'); button.disabled = false; button.innerHTML = '<i class="fas fa-save"></i> Save changes'; });
  }

  var style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
  document.body.insertAdjacentHTML('beforeend', HTML);
  byId('ie-close').addEventListener('click', close); byId('ie-cancel').addEventListener('click', close); byId('ie-save').addEventListener('click', save);
  byId('ie-search-button').addEventListener('click', search); byId('ie-search').addEventListener('input', function () { clearTimeout(searchTimer); searchTimer = setTimeout(search, 320); });
  byId('ie-search').addEventListener('keydown', function (event) { if (event.key === 'Enter') { event.preventDefault(); search(); } });
  byId('ie-delivery').addEventListener('input', totals); byId('ie-discount').addEventListener('input', totals);
  byId('ie-overlay').addEventListener('click', function (event) { if (event.target === this) close(); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape' && byId('ie-overlay').classList.contains('open')) close(); });
  root.ShobazIncompleteEditor = {
    open: function (id) { openWith(id, 'incomplete'); },
    openOrder: function (id) { openWith(id, 'order'); },
    close: close,
  };
})(window);
