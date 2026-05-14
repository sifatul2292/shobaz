/**
 * Patches product image paths from .jpg → .webp for all 35 seeded books.
 * Run AFTER uploading WebP files to the server:
 *   node patch-image-paths.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const DB_URI = process.env.DB_USERNAME
  ? `mongodb://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@127.0.0.1:${process.env.DB_PORT || 27017}/${process.env.DB_NAME || 'shobaz'}?authSource=${process.env.AUTH_SOURCE || 'admin'}`
  : `mongodb://127.0.0.1:${process.env.DB_PORT || 27017}/${process.env.DB_NAME || 'shobaz'}`;

const SLUGS = [
  'atomic-habits','deep-work','the-one-thing','eat-that-frog','indistractable',
  'the-psychology-of-money','rich-dad-poor-dad','the-intelligent-investor',
  'think-and-grow-rich','i-will-teach-you-to-be-rich',
  'how-to-win-friends-and-influence-people','never-split-the-difference',
  'influence-the-psychology-of-persuasion','crucial-conversations',
  'the-48-laws-of-power','mindset','mans-search-for-meaning',
  'the-subtle-art-of-not-giving-a-fck','cant-hurt-me','thinking-fast-and-slow',
  'zero-to-one','100m-offers','the-lean-startup','good-to-great',
  'the-hard-thing-about-hard-things','meditations','the-obstacle-is-the-way',
  'the-alchemist','the-7-habits-of-highly-effective-people','the-four-agreements',
  'start-with-why','this-is-marketing','contagious','originals','drive',
];

async function main() {
  await mongoose.connect(DB_URI);
  const db = mongoose.connection.db;
  const col = db.collection('products');

  let updated = 0;
  for (const slug of SLUGS) {
    const res = await col.updateOne(
      { slug },
      { $set: { images: [`/images/books/${slug}.webp`] } },
    );
    if (res.modifiedCount) {
      updated++;
      console.log(`  ✓  ${slug}`);
    } else {
      console.log(`  –  ${slug} (not found or already updated)`);
    }
  }

  console.log(`\nPatched ${updated}/35 products.`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err.message); process.exit(1); });
