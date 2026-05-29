#!/bin/bash
# LendPaper Chrome Extension — one-command install

set -e

EXT_DIR="$(cd "$(dirname "$0")" && pwd)"
ICONS="$EXT_DIR/icons"
SVG="$ICONS/icon.svg"
SIZES=(16 32 48 128)

echo ""
echo "  □ lendpaper. — Chrome Extension Installer"
echo "  ─────────────────────────────────────────"
echo ""

# ── Step 1: Generate PNG icons ───────────────────────────

echo "  [1/2] Generating icons..."

if ! command -v rsvg-convert &>/dev/null; then
  echo "        rsvg-convert not found — installing librsvg via Homebrew..."
  brew install librsvg --quiet
fi

for SIZE in "${SIZES[@]}"; do
  rsvg-convert -w "$SIZE" -h "$SIZE" "$SVG" -o "$ICONS/icon${SIZE}.png"
  echo "        ✓ icon${SIZE}.png"
done

# ── Step 2: Open Chrome extensions page ─────────────────

echo ""
echo "  [2/2] Opening Chrome..."
open "chrome://extensions"

echo ""
echo "  ──────────────────────────────────────────────────"
echo "  In Chrome:"
echo "    1. Enable  Developer mode  (top-right toggle)"
echo "    2. Click   Load unpacked"
echo "    3. Select  $EXT_DIR"
echo "  ──────────────────────────────────────────────────"
echo ""
