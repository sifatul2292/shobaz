const axios = require('axios');
const XLSX = require('xlsx');
const path = require('path');
const config = require('./config');

const api = axios.create({ baseURL: config.API_BASE_URL });

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function normalize(str) {
  return str.trim().normalize('NFC');
}

function buildLookupMap(items) {
  const map = {};
  for (const item of items) {
    if (item.name) map[normalize(item.name)] = item;
    if (item.nameEn) map[normalize(item.nameEn).toLowerCase()] = item;
  }
  return map;
}

function splitPipe(val) {
  if (!val) return [];
  return String(val)
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

function num(val) {
  const n = parseFloat(val);
  return isNaN(n) ? undefined : n;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

async function login() {
  console.log('Logging in...');
  const res = await api.post('/admin/login', {
    username: config.ADMIN_USERNAME,
    password: config.ADMIN_PASSWORD,
  });
  if (!res.data.success || !res.data.token) {
    throw new Error(`Login failed: ${res.data.message}`);
  }
  console.log('Login successful.');
  return res.data.token;
}

// ── Lookup fetchers ──────────────────────────────────────────────────────────

async function fetchAll(endpoint, method = 'post', body = {}) {
  const res =
    method === 'get'
      ? await api.get(endpoint)
      : await api.post(endpoint, body);
  const items = res.data.data;
  if (!Array.isArray(items)) return [];
  return items;
}

async function fetchLookups(token) {
  const headers = { administrator: token };
  console.log('Fetching categories, authors, publishers from VPS...');

  const [categories, authors, publishers] = await Promise.all([
    api
      .post('/category/get-all', { select: { _id: 1, name: 1, nameEn: 1, slug: 1 } }, { headers })
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),
    api
      .post('/author/get-all', { select: { _id: 1, name: 1, nameEn: 1, slug: 1 } }, { headers })
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),
    api
      .post('/publisher/get-all', { select: { _id: 1, name: 1, nameEn: 1, slug: 1 } }, { headers })
      .then((r) => (Array.isArray(r.data.data) ? r.data.data : [])),
  ]);

  console.log(
    `  Found: ${categories.length} categories, ${authors.length} authors, ${publishers.length} publishers`,
  );

  return {
    categoryMap: buildLookupMap(categories),
    authorMap: buildLookupMap(authors),
    publisherMap: buildLookupMap(publishers),
  };
}

// ── Excel reading ────────────────────────────────────────────────────────────

function readExcel(filePath) {
  const wb = XLSX.readFile(filePath);
  const ws = wb.Sheets[config.SHEET_NAME];
  if (!ws) {
    const available = wb.SheetNames.join(', ');
    throw new Error(
      `Sheet "${config.SHEET_NAME}" not found. Available sheets: ${available}`,
    );
  }
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}

// ── Row transformer ───────────────────────────────────────────────────────────

function transformRow(row, rowNum, { categoryMap, authorMap, publisherMap }) {
  const errors = [];

  const name = String(row.name || '').trim();
  const nameEn = String(row.nameEn || '').trim();

  if (!name) errors.push('missing "name" (Bengali)');
  if (!nameEn) errors.push('missing "nameEn" (English)');

  // Resolve categories
  const categoryNames = splitPipe(row.category);
  const category = categoryNames.map((n) => {
    const found = categoryMap[normalize(n)] || categoryMap[normalize(n).toLowerCase()];
    if (!found) errors.push(`category not found: "${n}"`);
    return found;
  }).filter(Boolean);

  // Resolve authors
  const authorNames = splitPipe(row.author);
  const author = authorNames.map((n) => {
    const found = authorMap[normalize(n)] || authorMap[normalize(n).toLowerCase()];
    if (!found) errors.push(`author not found: "${n}"`);
    return found;
  }).filter(Boolean);

  // Resolve publisher (single)
  let publisher = undefined;
  const pubName = String(row.publisher || '').trim();
  if (pubName) {
    const found = publisherMap[normalize(pubName)] || publisherMap[normalize(pubName).toLowerCase()];
    if (!found) errors.push(`publisher not found: "${pubName}"`);
    else publisher = found;
  }

  // Images: array of URL strings
  const images = splitPipe(row.images);

  const product = {
    name,
    nameEn,
    ...(num(row.salePrice) !== undefined && { salePrice: num(row.salePrice) }),
    ...(num(row.costPrice) !== undefined && { costPrice: num(row.costPrice) }),
    quantity: num(row.quantity) ?? 0,
    status: String(row.status || 'publish').trim() || 'publish',
    ...(category.length > 0 && { category }),
    ...(author.length > 0 && { author }),
    ...(publisher && { publisher }),
    ...(images.length > 0 && { images }),
    ...(row.description && { description: String(row.description) }),
    ...(row.shortDescription && { shortDescription: String(row.shortDescription) }),
    ...(row.isbn && { isbn: String(row.isbn).trim() }),
    ...(row.edition && { edition: String(row.edition).trim() }),
    ...(row.editionEn && { editionEn: String(row.editionEn).trim() }),
    ...(num(row.totalPages) !== undefined && { totalPages: num(row.totalPages) }),
    ...(row.publishedDate && { publishedDate: String(row.publishedDate).trim() }),
    ...(row.seoTitle && { seoTitle: String(row.seoTitle).trim() }),
    ...(row.seoDescription && { seoDescription: String(row.seoDescription).trim() }),
    ...(row.seoKeywords && { seoKeywords: String(row.seoKeywords).trim() }),
  };

  return { product, errors, rowNum: rowNum + 2 }; // +2: header row + 0-based index
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const filePath = path.resolve(__dirname, config.EXCEL_FILE);

  try {
    // 1. Login
    const token = await login();

    // 2. Fetch lookups
    const lookups = await fetchLookups(token);

    // 3. Read Excel
    console.log(`\nReading: ${filePath}`);
    const rows = readExcel(filePath);
    const dataRows = rows.filter(
      (r) => String(r.name || '').trim() || String(r.nameEn || '').trim(),
    );
    console.log(`Found ${dataRows.length} non-empty product rows.`);

    // 4. Transform
    const results = dataRows.map((row, i) => transformRow(row, i, lookups));

    // 5. Report rows with errors
    const errorRows = results.filter((r) => r.errors.length > 0);
    const validRows = results.filter((r) => r.errors.length === 0);

    if (errorRows.length > 0) {
      console.log(`\nSkipping ${errorRows.length} row(s) with errors:`);
      errorRows.forEach((r) => {
        console.log(`  Row ${r.rowNum}: ${r.errors.join(', ')}`);
      });
    }

    if (validRows.length === 0) {
      console.log('\nNo valid rows to import. Exiting.');
      return;
    }

    console.log(`\nSending ${validRows.length} product(s) to VPS...`);

    // 6. POST insert-many (deleteMany is hardcoded false — existing products are never deleted)
    const payload = {
      data: validRows.map((r) => r.product),
      option: { deleteMany: false },
    };

    const res = await api.post('/product/insert-many', payload, {
      headers: { administrator: token },
    });

    // 7. Summary
    console.log('\n--- Import Complete ---');
    console.log(`  Success : ${res.data.success}`);
    console.log(`  Message : ${res.data.message}`);
    if (errorRows.length > 0) {
      console.log(`  Skipped : ${errorRows.length} row(s) with lookup errors (see above)`);
    }
  } catch (err) {
    if (err.response) {
      console.error('\nAPI error:', err.response.status, JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('\nError:', err.message);
    }
    process.exit(1);
  }
}

main();
