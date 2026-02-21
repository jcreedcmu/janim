#!/usr/bin/env bash
set -euo pipefail

OUTDIR="${1:-frames}"
OUTPUT="${2:-output.mp4}"
FPS="${3:-30}"

echo "==> Rendering frames to $OUTDIR ..."
npx tsx src/render.ts "$OUTDIR"

echo "==> Encoding $OUTPUT at ${FPS} fps ..."
ffmpeg -y -framerate "$FPS" -i "$OUTDIR/frame_%05d.png" \
  -c:v libx264 -pix_fmt yuv420p -crf 18 \
  "$OUTPUT"

echo "==> Done: $OUTPUT"
