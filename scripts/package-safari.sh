#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT_DIR="${BREEZEFILL_SAFARI_OUTPUT:-$ROOT_DIR/build/safari/BreezeFill}"
APP_NAME="${BREEZEFILL_APP_NAME:-BreezeFill}"
BUNDLE_ID="${BREEZEFILL_BUNDLE_ID:-com.breezefill.app}"
MODE="create"
PLATFORM_FLAGS=()
COPY_RESOURCES=0

while (($#)); do
  case "$1" in
    --rebuild)
      MODE="rebuild"
      ;;
    --ios-only)
      PLATFORM_FLAGS+=("--ios-only")
      ;;
    --macos-only)
      PLATFORM_FLAGS+=("--macos-only")
      ;;
    --output)
      OUTPUT_DIR="$2"
      shift
      ;;
    --app-name)
      APP_NAME="$2"
      shift
      ;;
    --bundle-id)
      BUNDLE_ID="$2"
      shift
      ;;
    --copy-resources)
      COPY_RESOURCES=1
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
  shift
done

mkdir -p "$(dirname "$OUTPUT_DIR")"

if [[ "$COPY_RESOURCES" == "1" && "$OUTPUT_DIR" == "$ROOT_DIR"* ]]; then
  echo "Refusing to copy resources into a Safari project nested inside the extension directory." >&2
  echo "Use --output outside $ROOT_DIR or omit --copy-resources." >&2
  exit 1
fi

CONVERTER_FLAGS=(
  --app-name "$APP_NAME"
  --bundle-identifier "$BUNDLE_ID"
  --swift
  --no-open
  --no-prompt
  --force
)

if ((${#PLATFORM_FLAGS[@]})); then
  CONVERTER_FLAGS+=("${PLATFORM_FLAGS[@]}")
fi

if [[ "$COPY_RESOURCES" == "1" ]]; then
  CONVERTER_FLAGS+=(--copy-resources)
fi

if [[ "$MODE" == "rebuild" ]]; then
  if [[ ! -d "$OUTPUT_DIR" ]]; then
    echo "Cannot rebuild Safari project because $OUTPUT_DIR does not exist." >&2
    exit 1
  fi

  xcrun safari-web-extension-converter \
    --rebuild-project "$OUTPUT_DIR" \
    "${CONVERTER_FLAGS[@]}"
else
  xcrun safari-web-extension-converter "$ROOT_DIR" \
    --project-location "$OUTPUT_DIR" \
    "${CONVERTER_FLAGS[@]}"
fi

echo "Safari Web Extension project ready at: $OUTPUT_DIR"
