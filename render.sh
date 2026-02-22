#!/usr/bin/env bash
set -euo pipefail

OUTDIR="frames"
OUTPUT="output.mp4"
FPS="30"
ENCODE_ONLY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --encode-only) ENCODE_ONLY=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ "$ENCODE_ONLY" = false ]; then
  echo "==> Rendering frames to $OUTDIR ..."
  npx tsx src/render.ts "$OUTDIR"
fi

AUDIO="public/audio/untitled.wav"

echo "==> Encoding $OUTPUT at ${FPS} fps (YouTube-optimized) ..."
ffmpeg -y -framerate "$FPS" -i "$OUTDIR/frame_%05d.png" \
  -i "$AUDIO" \
  -c:v libx264 -pix_fmt yuv420p \
  -profile:v high -level:v 4.0 \
  -crf 18 -preset slow \
  -bf 2 -g "$((FPS * 2))" \
  -movflags +faststart \
  -c:a aac -b:a 192k -ar 48000 \
  -shortest \
  "$OUTPUT"

echo "==> Done: $OUTPUT"
