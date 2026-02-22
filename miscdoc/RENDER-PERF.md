# Render Performance Notes

## 1. Cache rasterized SVGs in Node (biggest win)

`TexRenderer.draw()` calls `loadImage(Buffer.from(svgString))` on every
invocation in Node. The browser path loads each SVG once as an `Image` and
reuses it, but the Node path re-parses and rasterizes on every frame.

Most expressions are drawn at only 1-2 scales across the whole animation,
so caching by `(expression, scale)` key would eliminate the vast majority
of redundant work.

## 2. Pipe frames directly to ffmpeg

Currently renders 2100+ PNGs to disk, then ffmpeg reads them back.
Instead, spawn ffmpeg with `-f image2pipe -i -` and pipe each PNG buffer
to stdin. Eliminates all the intermediate disk I/O.

## 3. Skip inactive scenes

Many scenes are inactive for most of the timeline. The scene dispatcher
already checks time ranges, but further short-circuiting (e.g. returning
early from scene functions when alpha would be 0) could save work.

## 4. Parallelize frame rendering

Frames are independent of each other. Split the frame range across N
worker threads. Requires creating separate canvas + TexRenderer instances
per worker since they're not thread-safe.
