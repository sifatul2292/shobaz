#!/usr/bin/env node
/**
 * Load approved author bios (and optional photo URLs) from the review CSV into
 * the Shobaz admin, one author at a time.
 *
 *   node tools/author-bios/apply-bios.mjs            # dry run (default) — shows what would change
 *   node tools/author-bios/apply-bios.mjs --apply    # writes, after you type YES
 *
 * Options
 *   --csv <path>       CSV to read (default: author-bios-draft.csv next to this script)
 *   --api <url>        API origin (default: $API_BASE or https://api.shobaz.com)
 *   --overwrite        replace a bio/photo that already exists in admin (default: skip it)
 *   --only <id>        only this author id (repeatable)
 *   --yes              skip the "type YES" confirmation (for scripted runs)
 *
 * Which rows are used
 *   Only rows whose `approve` column is yes / y / true / 1 / হ্যাঁ.
 *   `bio_bn`    → author description (edit the text in the sheet before approving).
 *   `image_url` → author photo, optional; must be an http(s) URL (e.g. uploaded via
 *                 admin → Gallery first).
 *
 * Login (only for --apply)
 *   Uses $ADMIN_TOKEN if set, otherwise asks for your admin username and password
 *   (the password is not shown or stored). Never commit tokens or passwords.
 *
 * Needs Node 18+ (built-in fetch). No npm install required.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const here = dirname(fileURLToPath(import.meta.url));

// ── args ────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const values = (name) => argv.flatMap((a, i) => (a === name && argv[i + 1] ? [argv[i + 1]] : []));
const APPLY = flag('--apply');
const OVERWRITE = flag('--overwrite');
const YES = flag('--yes');
const ONLY = new Set(values('--only'));
const CSV_PATH = resolve(values('--csv')[0] || resolve(here, 'author-bios-draft.csv'));
const API = (values('--api')[0] || process.env.API_BASE || 'https://api.shobaz.com').replace(/\/+$/, '');
if (flag('--help') || flag('-h')) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
  process.exit(0);
}

// ── CSV (RFC 4180: quotes, escaped quotes, commas/newlines inside quotes, BOM) ──
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((r) => r.some((v) => v.trim() !== ''));
  const keys = header.map((h) => h.trim().toLowerCase());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

// ── helpers ─────────────────────────────────────────────────────────────────
const APPROVED = new Set(['yes', 'y', 'true', '1', 'হ্যাঁ', 'ok']);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const short = (t, n = 60) => (t.length > n ? `${t.slice(0, n)}…` : t);

async function getJson(url, init = {}) {
  const res = await fetch(url, init);
  let body = null;
  try { body = await res.json(); } catch { /* non-JSON */ }
  return { status: res.status, body };
}

function ask(question, { hidden = false } = {}) {
  return new Promise((resolveAnswer) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolveAnswer(answer.trim());
    });
  });
}

async function getToken() {
  if (process.env.ADMIN_TOKEN) return process.env.ADMIN_TOKEN.trim();
  const username = await ask('Admin username: ');
  const password = await ask('Admin password: ', { hidden: true });
  const { status, body } = await getJson(`${API}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!body?.success || !body?.token) {
    throw new Error(`Login failed (${status}): ${body?.message || 'no token returned'}`);
  }
  return body.token;
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  const rows = parseCsv(readFileSync(CSV_PATH, 'utf8'));
  if (!rows.length || !('author_id' in rows[0]) || !('bio_bn' in rows[0])) {
    throw new Error(`${CSV_PATH} needs at least the columns author_id, bio_bn (and approve).`);
  }
  if (!('approve' in rows[0])) {
    throw new Error('No "approve" column found — add it and mark the rows to load with "yes".');
  }

  const picked = rows.filter((r) =>
    APPROVED.has((r.approve || '').toLowerCase()) && (!ONLY.size || ONLY.has(r.author_id)),
  );
  console.log(`API:      ${API}`);
  console.log(`CSV:      ${CSV_PATH}`);
  console.log(`Approved: ${picked.length} of ${rows.length} rows${ONLY.size ? ' (filtered by --only)' : ''}`);
  console.log(`Mode:     ${APPLY ? 'APPLY (writes to the API)' : 'dry run (no changes)'}${OVERWRITE ? ', overwrite existing' : ''}\n`);
  if (!picked.length) {
    console.log('Nothing to do. Put "yes" in the approve column for the authors you checked.');
    return;
  }

  // 1) Plan: compare each approved row with what admin currently has.
  const plan = [];
  const counts = { update: 0, unchanged: 0, skippedExisting: 0, notFound: 0, invalid: 0 };
  for (const r of picked) {
    const label = `${r.name || '(no name)'} [${r.author_id}]`;
    if (!/^[a-f0-9]{24}$/i.test(r.author_id)) { counts.invalid++; console.log(`✗ ${label}: invalid author_id`); continue; }
    const bio = (r.bio_bn || '').trim();
    const image = (r.image_url || '').trim();
    if (!bio && !image) { counts.invalid++; console.log(`✗ ${label}: approved but bio_bn and image_url are empty`); continue; }
    if (image && !/^https?:\/\//i.test(image)) { counts.invalid++; console.log(`✗ ${label}: image_url must start with http(s)://`); continue; }

    const { status, body } = await getJson(`${API}/api/author/${r.author_id}`);
    const current = body?.data;
    if (status >= 400 || !current) { counts.notFound++; console.log(`✗ ${label}: author not found (${status})`); continue; }

    const changes = {};
    const notes = [];
    if (bio) {
      if ((current.description || '').trim() === bio) notes.push('bio already set');
      else if (current.description && !OVERWRITE) { notes.push('has a bio already — skipped (use --overwrite)'); counts.skippedExisting++; }
      else changes.description = bio;
    }
    if (image) {
      if ((current.image || '') === image) notes.push('photo already set');
      else if (current.image && !OVERWRITE) notes.push('has a photo already — skipped (use --overwrite)');
      else changes.image = image;
    }
    if (!Object.keys(changes).length) {
      if (!notes.some((n) => n.includes('skipped'))) counts.unchanged++;
      console.log(`· ${current.name}: ${notes.join('; ') || 'nothing to change'}`);
      continue;
    }
    counts.update++;
    plan.push({ id: r.author_id, current, changes });
    const what = [changes.description && `bio "${short(changes.description)}"`, changes.image && 'photo'].filter(Boolean).join(' + ');
    console.log(`→ ${current.name}: set ${what}${notes.length ? ` (${notes.join('; ')})` : ''}`);
    await sleep(60);
  }

  console.log(`\nPlan: ${counts.update} to update, ${counts.unchanged} unchanged, ${counts.skippedExisting} skipped (already have a bio), ${counts.notFound} not found, ${counts.invalid} invalid rows.`);
  if (!APPLY) {
    console.log('Dry run only — nothing was written. Re-run with --apply to save these changes.');
    return;
  }
  if (!plan.length) return;

  if (!YES) {
    const answer = await ask(`\nType YES to write ${plan.length} author(s) to ${API}: `);
    if (answer !== 'YES') { console.log('Cancelled — nothing was written.'); return; }
  }

  // 2) Apply: send the author's current name + slug back unchanged (the API
  //    re-derives the slug otherwise) plus only the fields being changed.
  const token = await getToken();
  let ok = 0;
  let failed = 0;
  for (const { id, current, changes } of plan) {
    const payload = { name: current.name, slug: current.slug, ...changes };
    const { status, body } = await getJson(`${API}/api/author/update/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', administrator: token },
      body: JSON.stringify(payload),
    });
    if (status === 401 || status === 403) {
      throw new Error(`Not authorised (${status}). Check the admin login/token and try again — stopped after ${ok} update(s).`);
    }
    if (!body?.success) { failed++; console.log(`✗ ${current.name}: update failed (${status}) ${body?.message || ''}`); continue; }

    // Verify it really saved and the slug did not move.
    const check = (await getJson(`${API}/api/author/${id}`)).body?.data;
    const saved = check
      && (!changes.description || (check.description || '').trim() === changes.description)
      && (!changes.image || check.image === changes.image)
      && check.slug === current.slug;
    if (saved) { ok++; console.log(`✓ ${current.name}`); }
    else { failed++; console.log(`⚠ ${current.name}: API said OK but the saved data does not match — check it in admin`); }
    await sleep(120);
  }
  console.log(`\nDone: ${ok} updated, ${failed} failed.`);
  if (failed) process.exitCode = 1;
}

main().catch((err) => {
  console.error(`\nError: ${err.message}`);
  process.exitCode = 1;
});
