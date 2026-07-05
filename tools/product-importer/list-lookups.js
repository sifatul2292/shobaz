/**
 * Run this first to see all valid category, author, and publisher names
 * that you can use in the products.xlsx file.
 *
 * Usage: node list-lookups.js
 */
const axios = require('axios');
const config = require('./config');

const api = axios.create({ baseURL: config.API_BASE_URL });

async function login() {
  const res = await api.post('/admin/login', {
    username: config.ADMIN_USERNAME,
    password: config.ADMIN_PASSWORD,
  });
  if (!res.data.success || !res.data.token) {
    throw new Error(`Login failed: ${res.data.message}`);
  }
  return res.data.token;
}

async function main() {
  try {
    const token = await login();
    const headers = { Authorization: `Bearer ${token}` };
    const select = { _id: 1, name: 1, nameEn: 1, slug: 1 };

    const [categories, authors, publishers] = await Promise.all([
      api.post('/category/get-all', { select }, { headers }).then((r) => r.data.data || []),
      api.post('/author/get-all', { select }, { headers }).then((r) => r.data.data || []),
      api.post('/publisher/get-all', { select }, { headers }).then((r) => r.data.data || []),
    ]);

    console.log('\n=== CATEGORIES ===');
    categories.forEach((c) => console.log(`  name: "${c.name}"  |  nameEn: "${c.nameEn || ''}"`));

    console.log('\n=== AUTHORS ===');
    authors.forEach((a) => console.log(`  name: "${a.name}"  |  nameEn: "${a.nameEn || ''}"`));

    console.log('\n=== PUBLISHERS ===');
    publishers.forEach((p) => console.log(`  name: "${p.name}"  |  nameEn: "${p.nameEn || ''}"`));

    console.log(
      `\nTotal: ${categories.length} categories, ${authors.length} authors, ${publishers.length} publishers`,
    );
    console.log('\nUse the exact "name" values above in your products.xlsx columns G (category), H (author), I (publisher).');
    console.log('Separate multiple values with | e.g.  author1|author2');
  } catch (err) {
    if (err.response) {
      console.error('API error:', err.response.status, JSON.stringify(err.response.data));
    } else {
      console.error('Error:', err.message);
    }
    process.exit(1);
  }
}

main();
