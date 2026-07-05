/**
 * Generates an empty products.xlsx template with the correct column headers
 * and sample row. Run once: node create-template.js
 */
const XLSX = require('xlsx');
const path = require('path');
const config = require('./config');

const HEADERS = [
  'name',
  'nameEn',
  'salePrice',
  'costPrice',
  'quantity',
  'status',
  'category',
  'author',
  'publisher',
  'description',
  'shortDescription',
  'isbn',
  'edition',
  'editionEn',
  'totalPages',
  'publishedDate',
  'images',
  'seoTitle',
  'seoDescription',
];

const SAMPLE = {
  name: 'নমুনা বই',
  nameEn: 'Sample Book',
  salePrice: 350,
  costPrice: 280,
  quantity: 10,
  status: 'publish',
  category: 'ইসলামিক বই',
  author: 'হুমায়ূন আহমেদ',
  publisher: 'প্রথমা',
  description: 'বইটির বিবরণ এখানে লিখুন।',
  shortDescription: 'সংক্ষিপ্ত বিবরণ।',
  isbn: '978-000-000-000-0',
  edition: '৩য় সংস্করণ',
  editionEn: '3rd Edition',
  totalPages: 256,
  publishedDate: '2024-01-15',
  images: 'https://api.shobaz.com/api/upload/images/example.jpg',
  seoTitle: 'Sample Book SEO Title',
  seoDescription: 'Sample Book SEO description for search engines.',
};

const NOTES = {
  name: 'Required. Bengali product name.',
  nameEn: 'Required. English product name (used to generate URL slug).',
  salePrice: 'Selling price (number).',
  costPrice: 'Purchase/cost price (number).',
  quantity: 'Stock quantity. Default: 0.',
  status: '"publish" or "draft". Default: publish.',
  category: 'Category name(s) from admin panel, separated by | for multiple.',
  author: 'Author name(s) from admin panel, separated by |.',
  publisher: 'Publisher name (single) from admin panel.',
  description: 'Full product description.',
  shortDescription: 'Short blurb shown in listings.',
  isbn: 'ISBN number.',
  edition: 'Edition label in Bengali.',
  editionEn: 'Edition label in English.',
  totalPages: 'Number of pages (number).',
  publishedDate: 'Format: YYYY-MM-DD e.g. 2024-01-15',
  images:
    'Upload images via admin panel first, then paste the returned URL(s) here. Multiple: url1|url2',
  seoTitle: 'SEO page title.',
  seoDescription: 'SEO meta description.',
};

function createTemplate() {
  const wb = XLSX.utils.book_new();

  // --- Products sheet ---
  const productRows = [SAMPLE];
  const ws = XLSX.utils.json_to_sheet(productRows, { header: HEADERS });

  // Column widths
  ws['!cols'] = HEADERS.map((h) => ({
    wch: Math.max(h.length + 2, 20),
  }));

  XLSX.utils.book_append_sheet(wb, ws, config.SHEET_NAME);

  // --- Notes sheet ---
  const notesData = HEADERS.map((h) => ({ Column: h, Notes: NOTES[h] || '' }));
  const wsNotes = XLSX.utils.json_to_sheet(notesData);
  wsNotes['!cols'] = [{ wch: 20 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsNotes, 'Column Notes');

  const outPath = path.resolve(__dirname, config.EXCEL_FILE);
  XLSX.writeFile(wb, outPath);
  console.log(`Template created: ${outPath}`);
  console.log('Fill in your products on the "Products" sheet and run: node import.js');
  console.log('\nTip: Run "node list-lookups.js" first to see exact category/author/publisher names.');
}

createTemplate();
