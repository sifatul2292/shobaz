(function (root) {
  'use strict';

  var BN_DIGITS = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  var PAYMENT_MAP = { COD: 'cash_on_delivery', ONLINE: 'online_payment', BKASH: 'online_payment', NAGAD: 'online_payment' };

  function bnToEn(value) {
    return String(value || '').replace(/[০-৯]/g, function (digit) { return BN_DIGITS[digit]; });
  }

  function cleanValue(value) {
    return String(value || '').replace(/^\s*[:：ঃ\-–—]\s*/, '').replace(/[\s,.;।؟?!]+$/, '').trim();
  }

  function normalizePhone(value) {
    var digits = bnToEn(value).replace(/\D/g, '');
    if (digits.indexOf('880') === 0) digits = digits.slice(3);
    if (/^1[3-9]\d{8}$/.test(digits)) digits = '0' + digits;
    return /^01[3-9]\d{8}$/.test(digits) ? digits : '';
  }

  function findPhone(value) {
    var ascii = bnToEn(value);
    var candidates = ascii.match(/(?:\+?880[\s\-().]*|0)?1[3-9](?:[\s\-().]*\d){8}/g) || [];
    for (var i = 0; i < candidates.length; i += 1) {
      var normalized = normalizePhone(candidates[i]);
      if (normalized) return normalized;
    }
    return '';
  }

  function detectPayment(value) {
    var line = String(value || '').toLowerCase();
    if (/bkash|বিকাশ/.test(line)) return 'BKASH';
    if (/nagad|নগদ/.test(line)) return 'NAGAD';
    if (/online|অনলাইন|ট্রান্সফার|transfer/.test(line)) return 'ONLINE';
    return 'COD';
  }

  function looksLikePayment(value) {
    return /ক্যাশ|cash|cod|delivery|ডেলিভারি|bkash|বিকাশ|nagad|নগদ|online|অনলাইন|টাকা|তাকা|৳|\/-|\b(?:tk|taka)\b/i.test(value);
  }

  function extractPrice(value) {
    var matches = bnToEn(value).replace(/,/g, '').match(/\d+(?:\.\d+)?/g);
    return matches && matches.length ? matches[matches.length - 1] : '';
  }

  function parseOrder(raw) {
    var lines = String(raw || '').split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
    var result = { phone: '', name: '', address: '', city: '', product: '', paymentType: 'COD', price: '' };
    var remaining = [];
    var productLines = [];

    lines.forEach(function (line) {
      var phone = findPhone(line);
      var label = line.match(/^\s*(phone|mobile|contact|ফোন|মোবাইল|নাম|name|address|ঠিকানা|city|জেলা|থানা|উপজেলা|product|book|বই|পণ্য|payment|পেমেন্ট|মূল্য|price)\s*[:：ঃ\-–—]?\s*(.*)$/i);
      var key = label ? label[1].toLowerCase() : '';
      var value = label ? cleanValue(label[2]) : line;

      if (!result.phone && (phone || /^(phone|mobile|contact|ফোন|মোবাইল)$/.test(key))) {
        result.phone = phone || normalizePhone(value);
        if (result.phone) return;
      }
      if (/^(নাম|name)$/.test(key)) { result.name = value; return; }
      if (/^(address|ঠিকানা)$/.test(key)) { result.address = value; return; }
      if (/^(city|জেলা|থানা|উপজেলা)$/.test(key)) { result.city = value; return; }
      if (/^(product|book|বই|পণ্য)$/.test(key)) { if (value) productLines.push(value); return; }
      if (/^(payment|পেমেন্ট|মূল্য|price)$/.test(key) || looksLikePayment(line)) {
        result.paymentType = detectPayment(line);
        result.price = extractPrice(line) || result.price;
        return;
      }
      remaining.push(line);
    });

    if (!result.name && remaining.length) result.name = cleanValue(remaining.shift());
    if (!result.address && remaining.length) {
      if (remaining.length > 1) result.address = remaining.slice(0, -1).map(cleanValue).filter(Boolean).join(', ');
      else result.address = cleanValue(remaining[0]);
    }
    if (!productLines.length && remaining.length > 1) productLines.push(cleanValue(remaining[remaining.length - 1]));
    result.product = productLines.filter(Boolean).join(' | ');

    if (!result.city && result.address) {
      var addressParts = result.address.split(',').map(cleanValue).filter(Boolean);
      if (addressParts.length > 1) result.city = addressParts[addressParts.length - 1];
    }
    result.address = cleanValue(result.address);
    result.city = cleanValue(result.city);
    result.note = result.price ? 'Customer quoted: ৳' + result.price : '';
    return result;
  }

  var Parser = { bnToEn: bnToEn, normalizePhone: normalizePhone, findPhone: findPhone, parseOrder: parseOrder };
  root.ShobazAiAssistParser = Parser;
  if (typeof module === 'object' && module.exports) module.exports = Parser;
  if (!root.document) return;

  var document = root.document;
  var API = root.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://api.shobaz.com';
  var ids = { button: 'shobaz-ai-assist-button', overlay: 'shobaz-ai-assist-overlay' };
  var selectedProducts = [];
  var searchTimer = null;
  var searchController = null;
  var searchCache = new Map();
  var lastFocus = null;

  var CSS = [
    '/* Hallmark · component: order-assist modal · genre: modern-minimal · theme: Shobaz admin',
    ' * states: default · hover · focus · active · disabled · loading · error · success',
    ' * contrast: pass (46–50) · pre-emit critique: P4 H5 E5 S5 R5 V4',
    ' */',
    '.sa-ai-btn{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:44px;padding:7px 14px;border:1px solid rgba(255,255,255,.3);border-radius:22px;background:rgba(255,255,255,.18);color:#fff;font:700 13px/1 inherit;white-space:nowrap;cursor:pointer;transition:background .15s,transform .15s,opacity .15s}',
    '.sa-ai-btn:hover,.sa-ai-btn.is-hover{background:rgba(255,255,255,.29)}',
    '.sa-ai-btn:focus-visible,.sa-control:focus-visible,.sa-action:focus-visible,.sa-result:focus-visible,.sa-qty:focus-visible{outline:3px solid #fbbf24;outline-offset:2px}',
    '.sa-ai-btn:active,.sa-ai-btn.is-active,.sa-action:active,.sa-action.is-active{transform:translateY(1px)}',
    '.sa-ai-btn:disabled,.sa-action:disabled,.sa-ai-btn.is-disabled,.sa-action.is-disabled{cursor:not-allowed;opacity:.58;transform:none}',
    '.sa-ai-btn[data-state="loading"],.sa-action[data-state="loading"]{cursor:wait}',
    '.sa-ai-btn[data-state="error"],.sa-action[data-state="error"]{background:#b91c1c}',
    '.sa-ai-btn[data-state="success"],.sa-action[data-state="success"]{background:#047857}',
    '.sa-overlay{position:fixed;inset:0;z-index:12000;display:none;align-items:center;justify-content:center;padding:16px;background:rgba(15,23,42,.72);backdrop-filter:blur(6px)}',
    '.sa-overlay.open{display:flex}',
    '.sa-dialog{width:min(720px,100%);max-height:min(92vh,860px);display:flex;flex-direction:column;overflow:hidden;border-radius:20px;background:#fff;box-shadow:0 28px 80px rgba(15,23,42,.35);animation:sa-in .18s cubic-bezier(.2,.8,.2,1)}',
    '@keyframes sa-in{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:none}}',
    '.sa-header{display:flex;align-items:center;gap:14px;padding:20px 24px;background:linear-gradient(135deg,#059669,#047857);color:#fff}',
    '.sa-header-icon{display:grid;place-items:center;width:44px;height:44px;flex:0 0 auto;border-radius:12px;background:rgba(255,255,255,.2);font-size:19px}',
    '.sa-heading{min-width:0}.sa-heading h2{margin:0;font-size:19px;font-weight:900;line-height:1.2}.sa-heading p{margin:3px 0 0;color:rgba(255,255,255,.82);font-size:12px}',
    '.sa-close{margin-left:auto;width:44px;height:44px;flex:0 0 auto;border:0;border-radius:50%;background:rgba(255,255,255,.18);color:#fff;font-size:18px;cursor:pointer}.sa-close:hover{background:rgba(255,255,255,.3)}',
    '.sa-body{min-height:0;overflow:auto;padding:24px}.sa-step{display:none}.sa-step.active{display:block}',
    '.sa-label{display:block;margin-bottom:7px;color:#475569;font-size:11px;font-weight:800;letter-spacing:.055em;text-transform:uppercase}',
    '.sa-control{width:100%;min-height:44px;border:1.5px solid #dbe3ed;border-radius:10px;padding:9px 12px;background:#fff;color:#172033;font:500 14px/1.4 inherit;transition:border-color .15s,box-shadow .15s}',
    '.sa-control:hover{border-color:#94a3b8}.sa-control:focus{border-color:#059669;box-shadow:0 0 0 3px rgba(5,150,105,.12);outline:none}.sa-control[aria-invalid="true"]{border-color:#dc2626;box-shadow:0 0 0 3px rgba(220,38,38,.1)}',
    'textarea.sa-control{min-height:150px;resize:vertical}.sa-note{min-height:68px!important}',
    '.sa-hint,.sa-status{margin-top:8px;color:#64748b;font-size:12px;line-height:1.45}.sa-status{min-height:18px}.sa-status.error{color:#b91c1c}.sa-status.success{color:#047857}',
    '.sa-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:13px;margin-bottom:13px}.sa-grid.full{grid-template-columns:minmax(0,1fr)}',
    '.sa-field{min-width:0}.sa-product-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}',
    '.sa-action{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:44px;border:0;border-radius:999px;padding:10px 19px;background:#059669;color:#fff;font:800 14px/1 inherit;white-space:nowrap;cursor:pointer;transition:background .15s,transform .15s,opacity .15s}',
    '.sa-action:hover{background:#047857}.sa-action.secondary{background:#eef2f7;color:#52637b}.sa-action.secondary:hover{background:#e2e8f0}.sa-action.primary{background:#6d28d9}.sa-action.primary:hover{background:#5b21b6}',
    '.sa-results{display:none;max-height:190px;overflow:auto;margin-top:8px;border:1px solid #dbe3ed;border-radius:10px;background:#fff}.sa-results.open{display:block}',
    '.sa-result{display:flex;width:100%;align-items:center;justify-content:space-between;gap:12px;padding:11px 12px;border:0;border-bottom:1px solid #eef2f7;background:#fff;color:#172033;text-align:left;cursor:pointer}.sa-result:last-child{border-bottom:0}.sa-result:hover{background:#f7fafc}.sa-result-price{flex:0 0 auto;color:#6d28d9;font-weight:800}',
    '.sa-selected{min-height:48px;border:1px dashed #cbd5e1;border-radius:10px;padding:6px 10px;color:#94a3b8;font-size:13px}.sa-selected-row{display:grid;grid-template-columns:minmax(0,1fr) auto 64px 44px;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #eef2f7;color:#172033}.sa-selected-row:last-child{border-bottom:0}.sa-selected-name{min-width:0;font-weight:700;overflow-wrap:anywhere}.sa-selected-price{color:#64748b;white-space:nowrap}.sa-qty{width:64px;min-height:44px;border:1px solid #dbe3ed;border-radius:8px;text-align:center}.sa-remove{width:44px;height:44px;border:0;border-radius:8px;background:#fee2e2;color:#b91c1c;font-size:18px;cursor:pointer}.sa-remove:hover{background:#fecaca}',
    '.sa-summary{display:flex;justify-content:flex-end;gap:7px;margin-top:8px;color:#475569;font-size:12px}.sa-summary strong{color:#172033}',
    '.sa-footer{display:flex;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid #eef2f7;background:#fff}.sa-footer-group{display:flex;width:100%;justify-content:flex-end;gap:10px}.sa-footer-group[hidden]{display:none!important}',
    '@media(max-width:600px){.sa-overlay{align-items:flex-end;padding:0}.sa-dialog{max-height:96vh;border-radius:18px 18px 0 0}.sa-header{padding:16px}.sa-body{padding:16px}.sa-grid{grid-template-columns:minmax(0,1fr)}.sa-grid.sa-product-grid{grid-template-columns:minmax(0,1fr)}.sa-footer{padding:12px 16px}.sa-footer-group{display:grid!important;grid-template-columns:1fr 1fr}.sa-footer-group .sa-action:last-child{grid-column:1/-1;grid-row:1}.sa-selected-row{grid-template-columns:minmax(0,1fr) 64px 44px}.sa-selected-price{display:none}.sa-ai-btn .sa-btn-text{display:none}.sa-ai-btn{width:44px;padding:7px;border-radius:50%}}',
    '@media(prefers-reduced-motion:reduce){.sa-dialog{animation:none}.sa-ai-btn,.sa-action{transition:none}}'
  ].join('\n');

  var HTML = [
    '<div class="sa-overlay" id="' + ids.overlay + '" aria-hidden="true">',
    '<section class="sa-dialog" role="dialog" aria-modal="true" aria-labelledby="sa-title" aria-describedby="sa-subtitle">',
    '<header class="sa-header"><div class="sa-header-icon" aria-hidden="true"><i class="fas fa-wand-magic-sparkles"></i></div><div class="sa-heading"><h2 id="sa-title">AI Assist</h2><p id="sa-subtitle">Create an order from a WhatsApp or Facebook message</p></div><button class="sa-close" id="sa-close" type="button" aria-label="Close">&times;</button></header>',
    '<div class="sa-body">',
    '<div class="sa-step active" id="sa-step-one"><label class="sa-label" for="sa-order-text">Paste the order message</label><textarea class="sa-control" id="sa-order-text" placeholder="Paste customer order from WhatsApp, Facebook or SMS…&#10;&#10;01712-345678&#10;Customer name&#10;Full address, city&#10;Book: Product name&#10;Cash on delivery ৳460"></textarea><p class="sa-hint"><i class="fas fa-language" aria-hidden="true"></i> Understands common Bangla, English and Banglish order formats. You can edit everything before creating the order.</p><p class="sa-status" id="sa-parse-status" role="status"></p></div>',
    '<div class="sa-step" id="sa-step-two">',
    '<div class="sa-grid"><div class="sa-field"><label class="sa-label" for="sa-phone">Phone</label><input class="sa-control" id="sa-phone" inputmode="tel" autocomplete="tel" aria-required="true" aria-describedby="sa-create-status"></div><div class="sa-field"><label class="sa-label" for="sa-name">Name</label><input class="sa-control" id="sa-name" autocomplete="name" aria-required="true" aria-describedby="sa-create-status"></div></div>',
    '<div class="sa-grid full"><div class="sa-field"><label class="sa-label" for="sa-address">Address</label><input class="sa-control" id="sa-address" autocomplete="street-address" aria-required="true" aria-describedby="sa-create-status"></div></div>',
    '<div class="sa-grid"><div class="sa-field"><label class="sa-label" for="sa-city">City</label><input class="sa-control" id="sa-city" autocomplete="address-level2"></div><div class="sa-field"><label class="sa-label" for="sa-payment">Payment type</label><select class="sa-control" id="sa-payment"><option value="COD">Cash on Delivery</option><option value="ONLINE">Online Payment</option><option value="BKASH">bKash</option><option value="NAGAD">Nagad</option></select></div></div>',
    '<div class="sa-grid sa-product-grid"><div class="sa-field"><label class="sa-label" for="sa-product-search">Product (search &amp; pick)</label><div class="sa-product-row"><input class="sa-control" id="sa-product-search" autocomplete="off" placeholder="Type a book name…"><button class="sa-action" id="sa-search-button" type="button"><i class="fas fa-search" aria-hidden="true"></i> Search</button></div><div class="sa-results" id="sa-results"></div></div><div class="sa-field"><label class="sa-label" for="sa-delivery">Delivery charge (৳)</label><input class="sa-control" id="sa-delivery" type="number" inputmode="numeric" min="0" value="60"></div></div>',
    '<div class="sa-grid full"><div class="sa-field"><span class="sa-label">Selected products</span><div class="sa-selected" id="sa-selected">No product selected yet</div><div class="sa-summary" id="sa-summary"></div></div></div>',
    '<div class="sa-grid full"><div class="sa-field"><label class="sa-label" for="sa-note">Note (optional)</label><textarea class="sa-control sa-note" id="sa-note" placeholder="Extra notes…"></textarea></div></div>',
    '<p class="sa-status" id="sa-create-status" role="status" aria-live="polite"></p></div></div>',
    '<footer class="sa-footer"><div class="sa-footer-group" id="sa-footer-one"><button class="sa-action secondary" id="sa-cancel-one" type="button">Cancel</button><button class="sa-action" id="sa-extract" type="button"><i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i> Extract order</button></div><div class="sa-footer-group" id="sa-footer-two" hidden><button class="sa-action secondary" id="sa-back" type="button"><i class="fas fa-arrow-left" aria-hidden="true"></i> Back</button><button class="sa-action secondary" id="sa-cancel-two" type="button">Cancel</button><button class="sa-action primary" id="sa-create" type="button"><i class="fas fa-plus" aria-hidden="true"></i> Create order</button></div></footer>',
    '</section></div>'
  ].join('');

  function byId(id) { return document.getElementById(id); }
  function getToken() { return root.localStorage.getItem('co_admin_token') || null; }
  function setStatus(id, message, type) { var el = byId(id); el.textContent = message || ''; el.className = 'sa-status' + (type ? ' ' + type : ''); }

  function resetForm() {
    ['sa-order-text', 'sa-phone', 'sa-name', 'sa-address', 'sa-city', 'sa-product-search', 'sa-note'].forEach(function (id) { byId(id).value = ''; });
    byId('sa-payment').value = 'COD';
    byId('sa-delivery').value = '60';
    selectedProducts = [];
    renderSelected();
    showStep(1);
    setStatus('sa-parse-status', '');
    setStatus('sa-create-status', '');
  }

  function showStep(step) {
    byId('sa-step-one').classList.toggle('active', step === 1);
    byId('sa-step-two').classList.toggle('active', step === 2);
    byId('sa-footer-one').hidden = step !== 1;
    byId('sa-footer-two').hidden = step !== 2;
  }

  function openModal() {
    lastFocus = document.activeElement;
    resetForm();
    byId(ids.overlay).classList.add('open');
    byId(ids.overlay).setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    root.setTimeout(function () { byId('sa-order-text').focus(); }, 40);
  }

  function closeModal() {
    if (searchController) searchController.abort();
    byId(ids.overlay).classList.remove('open');
    byId(ids.overlay).setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function doExtract() {
    var raw = byId('sa-order-text').value.trim();
    if (!raw) { setStatus('sa-parse-status', 'Paste an order message first.', 'error'); byId('sa-order-text').focus(); return; }
    var data = parseOrder(raw);
    byId('sa-phone').value = data.phone;
    byId('sa-name').value = data.name;
    byId('sa-address').value = data.address;
    byId('sa-city').value = data.city;
    byId('sa-payment').value = data.paymentType;
    byId('sa-note').value = data.note;
    byId('sa-product-search').value = data.product;
    showStep(2);
    if (data.product) searchProducts(data.product);
    root.setTimeout(function () { (data.phone ? byId('sa-name') : byId('sa-phone')).focus(); }, 30);
  }

  function renderResults(items) {
    var box = byId('sa-results');
    box.innerHTML = '';
    box.classList.add('open');
    if (!items.length) { box.textContent = 'No matching products found.'; box.style.padding = '12px'; return; }
    box.style.padding = '';
    items.forEach(function (product) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'sa-result';
      button.innerHTML = '<span></span><span class="sa-result-price"></span>';
      button.firstChild.textContent = product.name || product.nameEn || 'Unnamed product';
      button.lastChild.textContent = '৳' + Number(product.salePrice || 0);
      button.addEventListener('click', function () { addProduct(product); });
      box.appendChild(button);
    });
  }

  function searchProducts(query) {
    var q = String(query == null ? byId('sa-product-search').value : query).trim();
    var box = byId('sa-results');
    if (q.length < 2) { box.classList.remove('open'); box.innerHTML = ''; return; }
    var key = q.toLocaleLowerCase();
    if (searchCache.has(key)) { renderResults(searchCache.get(key)); return; }
    if (searchController) searchController.abort();
    searchController = new AbortController();
    var timeout = root.setTimeout(function () { searchController.abort(); }, 10000);
    box.classList.add('open'); box.style.padding = '12px'; box.textContent = 'Searching…';
    fetch(API + '/api/product/get-all?q=' + encodeURIComponent(q), {
      method: 'POST', signal: searchController.signal, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filter: { salePrice: { $gte: 0 } }, pagination: { pageSize: 12, currentPage: 0 }, sort: { createdAt: -1 }, select: { name: 1, nameEn: 1, salePrice: 1 } })
    }).then(function (response) {
      if (!response.ok) throw new Error('Product search failed');
      return response.json();
    }).then(function (payload) {
      var items = Array.isArray(payload.data) ? payload.data : [];
      searchCache.set(key, items);
      if (searchCache.size > 20) searchCache.delete(searchCache.keys().next().value);
      renderResults(items);
    }).catch(function (error) {
      if (error.name === 'AbortError') return;
      box.style.padding = '12px'; box.textContent = error.message || 'Product search failed.';
    }).finally(function () { root.clearTimeout(timeout); });
  }

  function addProduct(product) {
    var existing = selectedProducts.find(function (item) { return item._id === product._id; });
    if (existing) existing.qty += 1;
    else selectedProducts.push({ _id: product._id, name: product.name || product.nameEn || 'Unnamed product', price: Number(product.salePrice || 0), qty: 1 });
    byId('sa-product-search').value = '';
    byId('sa-results').classList.remove('open');
    renderSelected();
  }

  function renderSelected() {
    var box = byId('sa-selected');
    var summary = byId('sa-summary');
    box.innerHTML = '';
    if (!selectedProducts.length) { box.textContent = 'No product selected yet'; summary.textContent = ''; return; }
    selectedProducts.forEach(function (product) {
      var row = document.createElement('div'); row.className = 'sa-selected-row';
      var name = document.createElement('span'); name.className = 'sa-selected-name'; name.textContent = product.name;
      var price = document.createElement('span'); price.className = 'sa-selected-price'; price.textContent = '৳' + product.price;
      var qty = document.createElement('input'); qty.className = 'sa-qty'; qty.type = 'number'; qty.min = '1'; qty.value = product.qty; qty.setAttribute('aria-label', 'Quantity for ' + product.name);
      qty.addEventListener('change', function () { product.qty = Math.max(1, parseInt(qty.value, 10) || 1); qty.value = product.qty; renderSelected(); });
      var remove = document.createElement('button'); remove.className = 'sa-remove'; remove.type = 'button'; remove.innerHTML = '&times;'; remove.setAttribute('aria-label', 'Remove ' + product.name);
      remove.addEventListener('click', function () { selectedProducts = selectedProducts.filter(function (item) { return item._id !== product._id; }); renderSelected(); });
      row.append(name, price, qty, remove); box.appendChild(row);
    });
    var subtotal = selectedProducts.reduce(function (sum, product) { return sum + product.price * product.qty; }, 0);
    summary.innerHTML = '<span>Product subtotal</span><strong>৳' + subtotal + '</strong>';
  }

  function validate() {
    var fields = [
      ['sa-phone', normalizePhone(byId('sa-phone').value) ? '' : 'Enter a valid Bangladesh mobile number.'],
      ['sa-name', byId('sa-name').value.trim() ? '' : 'Customer name is required.'],
      ['sa-address', byId('sa-address').value.trim() ? '' : 'Shipping address is required.']
    ];
    fields.forEach(function (field) { byId(field[0]).setAttribute('aria-invalid', field[1] ? 'true' : 'false'); });
    var firstError = fields.find(function (field) { return field[1]; });
    if (firstError) { setStatus('sa-create-status', firstError[1], 'error'); byId(firstError[0]).focus(); return false; }
    if (!selectedProducts.length) { setStatus('sa-create-status', 'Select at least one product.', 'error'); byId('sa-product-search').focus(); return false; }
    return true;
  }

  function createOrder() {
    if (!validate()) return;
    var token = getToken();
    if (!token) { setStatus('sa-create-status', 'Your admin session has expired. Sign in again.', 'error'); return; }
    var button = byId('sa-create');
    button.disabled = true; button.dataset.state = 'loading'; button.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Creating…';
    setStatus('sa-create-status', '');
    var carts = selectedProducts.map(function (product) { return product._id; });
    var cartData = selectedProducts.map(function (product) { return { product: product._id, selectedQty: product.qty, cartType: 0 }; });
    fetch(API + '/api/order/add-assisted', {
      method: 'POST', headers: { 'Content-Type': 'application/json', administrator: token },
      body: JSON.stringify({
        phoneNo: normalizePhone(byId('sa-phone').value), name: byId('sa-name').value.trim(), shippingAddress: byId('sa-address').value.trim(),
        city: byId('sa-city').value.trim(), paymentType: PAYMENT_MAP[byId('sa-payment').value] || 'cash_on_delivery',
        deliveryCharge: Math.max(0, Number(byId('sa-delivery').value) || 0), carts: carts, cartData: cartData, note: byId('sa-note').value.trim()
      })
    }).then(function (response) {
      return response.json().catch(function () { return {}; }).then(function (payload) { return { ok: response.ok, status: response.status, payload: payload }; });
    }).then(function (result) {
      if (!result.ok || result.payload.success === false) throw new Error(result.payload.message || 'Order creation failed (HTTP ' + result.status + ')');
      var orderId = result.payload.data && result.payload.data.orderId;
      button.dataset.state = 'success'; button.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Created';
      setStatus('sa-create-status', 'Order' + (orderId ? ' #' + orderId : '') + ' created successfully.', 'success');
      root.dispatchEvent(new CustomEvent('shobaz:order-created', { detail: result.payload.data || {} }));
      root.setTimeout(closeModal, 700);
    }).catch(function (error) {
      button.dataset.state = 'error'; setStatus('sa-create-status', error.message || 'Order creation failed.', 'error');
    }).finally(function () {
      root.setTimeout(function () { button.disabled = false; button.dataset.state = ''; button.innerHTML = '<i class="fas fa-plus" aria-hidden="true"></i> Create order'; }, 900);
    });
  }

  function trapKeys(event) {
    if (!byId(ids.overlay).classList.contains('open')) return;
    if (event.key === 'Escape') { closeModal(); return; }
    if (event.key !== 'Tab') return;
    var focusable = Array.prototype.slice.call(byId(ids.overlay).querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')).filter(function (el) { return !el.hidden && el.offsetParent !== null; });
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function inject() {
    if (byId(ids.button) || new URLSearchParams(root.location.search).get('view') === 'stock') return;
    var addButton = document.querySelector('.topbar-right .btn-add[href]');
    if (!addButton) return;
    var style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);
    var shell = document.createElement('div'); shell.innerHTML = HTML; document.body.appendChild(shell.firstChild);
    var button = document.createElement('button'); button.id = ids.button; button.className = 'sa-ai-btn'; button.type = 'button'; button.setAttribute('aria-label', 'AI Assist'); button.innerHTML = '<i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i><span class="sa-btn-text">AI Assist</span>';
    addButton.parentElement.insertBefore(button, addButton); button.addEventListener('click', openModal);
    byId('sa-close').addEventListener('click', closeModal); byId('sa-cancel-one').addEventListener('click', closeModal); byId('sa-cancel-two').addEventListener('click', closeModal);
    byId('sa-extract').addEventListener('click', doExtract); byId('sa-back').addEventListener('click', function () { showStep(1); byId('sa-order-text').focus(); }); byId('sa-create').addEventListener('click', createOrder);
    byId('sa-search-button').addEventListener('click', function () { searchProducts(); });
    byId('sa-product-search').addEventListener('input', function () { root.clearTimeout(searchTimer); var value = this.value; searchTimer = root.setTimeout(function () { searchProducts(value); }, 320); });
    byId('sa-product-search').addEventListener('keydown', function (event) { if (event.key === 'Enter') { event.preventDefault(); searchProducts(); } });
    byId(ids.overlay).addEventListener('click', function (event) { if (event.target === this) closeModal(); });
    document.addEventListener('keydown', trapKeys);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module === 'object' && module.exports && globalThis.ShobazAiAssistParser) {
  module.exports = globalThis.ShobazAiAssistParser;
}
