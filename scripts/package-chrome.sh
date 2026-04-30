#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(node -p "require('$ROOT_DIR/manifest.json').version")"
OUTPUT_DIR="$ROOT_DIR/dist/chrome"
ZIP_PATH="$OUTPUT_DIR/breezefill-chrome-web-store-v$VERSION.zip"

mkdir -p "$OUTPUT_DIR"
rm -f "$ZIP_PATH"

cd "$ROOT_DIR"
zip -rq "$ZIP_PATH" \
  manifest.json \
  background.js \
  content-script.js \
  content-styles.css \
  popup.html \
  popup.js \
  popup.css \
  options.html \
  options.js \
  options.css \
  lib \
  assets

echo "Chrome Web Store package ready at: $ZIP_PATH"
