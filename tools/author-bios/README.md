# Author bios

`author-bios-draft.csv` holds a draft Bangla bio for each author (107 rows).
`apply-bios.mjs` loads the rows you approve into the admin (author → description,
and optionally the photo). Nothing is written until you run it with `--apply`
and type `YES`.

## 1. Review the sheet

Open `author-bios-draft.csv` in Google Sheets or Excel.

- **status**: `ready` (light proofread), `verify` (check the noted detail),
  `needs-info` (blank — write it yourself), `not-an-author` (translator/editor/publisher).
- Edit the text in **bio_bn** if needed.
- Put `yes` in **approve** for each author you want loaded.
- Optional photo in **image_url**: either a URL starting with `https://` (e.g. from
  admin → Gallery), or a local file next to the CSV such as
  `photos/author-name.webp` (webp/jpg/png, max 10 MB) — it is uploaded for you
  during `--apply`. Square ~600×600 WebP works best (the site shows it as a circle).
- Save as **CSV UTF-8** (Excel: *File → Save As → CSV UTF-8*; Google Sheets:
  *File → Download → CSV*). Plain "CSV" in Excel can break the Bangla text.

## 2. Preview (no changes)

```bash
node tools/author-bios/apply-bios.mjs
```

It looks up each approved author on the live API and prints what would change.
Authors that already have a bio are skipped unless you add `--overwrite`.

## 3. Apply

```bash
node tools/author-bios/apply-bios.mjs --apply
```

It shows the plan, asks you to type `YES`, then asks for your admin username and
password (the password is hidden and not saved). Each author is re-checked after
saving. Book pages show the new bio/photo within about an hour.

Options: `--only <author_id>` (repeatable) to load a single author,
`--csv <path>` for another file, `--api http://localhost:4000` to test locally,
`ADMIN_TOKEN=<token>` instead of the username/password prompt.

Requires Node 18 or newer; no `npm install` needed.
