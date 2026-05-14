#!/usr/bin/env python3
"""
Book cover converter — shobaz.com
Usage:
  1. Create input_covers/ next to this file
  2. Drop all 35 downloaded cover images inside it
  3. Run: python3 convert_to_webp.py
  4. Find output in output_covers/
  5. Upload output_covers/ contents to server at: /public/images/books/

Requires Pillow:  pip install Pillow
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow not installed. Run:  pip install Pillow")

INPUT_DIR  = Path(__file__).parent / "input_covers"
OUTPUT_DIR = Path(__file__).parent / "output_covers"

QUALITY  = 85   # WebP quality (1-100). 85 = great balance size/quality
MIN_SIZE = (300, 450)  # warn if cover smaller than this

# Expected slugs — used to validate you have all 35
EXPECTED_SLUGS = [
    "atomic-habits", "deep-work", "the-one-thing", "eat-that-frog", "indistractable",
    "the-psychology-of-money", "rich-dad-poor-dad", "the-intelligent-investor",
    "think-and-grow-rich", "i-will-teach-you-to-be-rich",
    "how-to-win-friends-and-influence-people", "never-split-the-difference",
    "influence-the-psychology-of-persuasion", "crucial-conversations",
    "the-48-laws-of-power", "mindset", "mans-search-for-meaning",
    "the-subtle-art-of-not-giving-a-fck", "cant-hurt-me",
    "thinking-fast-and-slow", "zero-to-one", "100m-offers", "the-lean-startup",
    "good-to-great", "the-hard-thing-about-hard-things", "meditations",
    "the-obstacle-is-the-way", "the-alchemist",
    "the-7-habits-of-highly-effective-people", "the-four-agreements",
    "start-with-why", "this-is-marketing", "contagious", "originals", "drive",
]

SUPPORTED = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif"}


def main():
    if not INPUT_DIR.exists():
        sys.exit(f"input_covers/ folder not found at {INPUT_DIR}\nCreate it and put your images inside.")

    OUTPUT_DIR.mkdir(exist_ok=True)

    images = [f for f in INPUT_DIR.iterdir() if f.suffix.lower() in SUPPORTED]
    if not images:
        sys.exit("No images found in input_covers/. Add .jpg/.png files and retry.")

    print(f"\nConverting {len(images)} image(s) → output_covers/\n")

    converted = []
    warnings  = []

    for src in sorted(images):
        stem   = src.stem                        # e.g. "atomic-habits"
        out    = OUTPUT_DIR / f"{stem}.webp"

        try:
            with Image.open(src) as img:
                w, h = img.size
                if w < MIN_SIZE[0] or h < MIN_SIZE[1]:
                    warnings.append(f"  ⚠  {src.name} is small ({w}×{h}px) — may look blurry")

                # Convert RGBA/P → RGB so WebP saves cleanly
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGBA")   # keep alpha if present
                else:
                    img = img.convert("RGB")

                img.save(out, "WEBP", quality=QUALITY, method=6)
                kb = out.stat().st_size // 1024
                print(f"  ✓  {src.name:50s} → {out.name}  ({w}×{h}  {kb} KB)")
                converted.append(stem)

        except Exception as e:
            print(f"  ✗  {src.name}: {e}")

    # ── validation ──────────────────────────────────────────────────────────
    print(f"\n── Summary {'─'*40}")
    print(f"   Converted : {len(converted)}/35")

    missing = [s for s in EXPECTED_SLUGS if s not in converted]
    if missing:
        print(f"\n   Missing covers ({len(missing)}):")
        for m in missing:
            print(f"     • {m}.jpg")

    if warnings:
        print(f"\n   Warnings:")
        for w in warnings:
            print(w)

    print(f"\n── Next steps {'─'*39}")
    print("   1. Upload contents of output_covers/ to server:")
    print("        /path/to/frontend/public/images/books/")
    print("   2. Then run the DB patch to update image paths:")
    print("        node patch-image-paths.js")
    print()


if __name__ == "__main__":
    main()
