import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnimationFn = (ctx: CanvasRenderingContext2D, t: number) => void | Promise<void>;

export interface AnimationConfig {
  width: number;
  height: number;
  duration: number;
  fps?: number;
}

// ---------------------------------------------------------------------------
// TeX Renderer
// ---------------------------------------------------------------------------

type ImageLike = HTMLImageElement | { width: number; height: number };

// 1 ex ≈ 8px at default MathJax font size — tunable
const EX_TO_PX = 8;

function parseDimension(value: string): number {
  const n = parseFloat(value);
  if (value.endsWith('ex')) return n * EX_TO_PX;
  if (value.endsWith('px')) return n;
  return n;
}

interface TexCacheEntry {
  // Raw SVG template with %WIDTH% and %HEIGHT% placeholders for dimensions
  svgTemplate: string;
  width: number;
  height: number;
  // Browser: pre-loaded Image (browser re-rasterizes SVG at draw size)
  browserImage?: ImageLike;
  // Node: loadImage function, cached at import time
  nodeLoadImage?: (src: Buffer) => Promise<ImageLike>;
}

export class TexRenderer {
  private cache = new Map<string, TexCacheEntry>();
  private adaptor = liteAdaptor();
  private html: ReturnType<typeof mathjax.document>;

  constructor() {
    RegisterHTMLHandler(this.adaptor);
    const tex = new TeX({ packages: AllPackages });
    const svg = new SVG({ fontCache: 'none' });
    this.html = mathjax.document('', { InputJax: tex, OutputJax: svg });
  }

  private texToSvg(expression: string): { svgTemplate: string; width: number; height: number } {
    const node = this.html.convert(expression, { display: true });
    // innerHTML strips the <mjx-container> wrapper, giving us just the <svg>
    let svgString = this.adaptor.innerHTML(node);

    // Replace currentColor with white so it renders visibly in an <img> context
    svgString = svgString.replace(/currentColor/g, '#ffffff');

    // Extract logical dimensions (ex → px)
    const widthMatch = svgString.match(/width="([^"]+)"/);
    const heightMatch = svgString.match(/height="([^"]+)"/);
    const width = widthMatch ? parseDimension(widthMatch[1]) : 100;
    const height = heightMatch ? parseDimension(heightMatch[1]) : 50;

    // Replace dimensions with placeholders so we can stamp in the exact
    // target pixel size at draw time (avoids any raster rescaling).
    if (widthMatch) svgString = svgString.replace(`width="${widthMatch[1]}"`, `width="%WIDTH%"`);
    if (heightMatch) svgString = svgString.replace(`height="${heightMatch[1]}"`, `height="%HEIGHT%"`);

    return { svgTemplate: svgString, width, height };
  }

  async prepare(expressions: string[]): Promise<void> {
    const isNode = typeof window === 'undefined';

    for (const expr of expressions) {
      if (this.cache.has(expr)) continue;

      const { svgTemplate, width, height } = this.texToSvg(expr);
      const entry: TexCacheEntry = { svgTemplate, width, height };

      if (isNode) {
        const { loadImage } = await import('@napi-rs/canvas');
        entry.nodeLoadImage = loadImage as any;
      } else {
        // Browser: load an image with the logical dimensions.
        // The browser re-rasterizes SVG at whatever size drawImage requests,
        // so we don't need per-frame loading.
        const svgString = svgTemplate
          .replace('%WIDTH%', `${width}px`)
          .replace('%HEIGHT%', `${height}px`);
        const img = new Image();
        const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = (e) => reject(e);
          img.src = dataUrl;
        });
        entry.browserImage = img;
      }

      this.cache.set(expr, entry);
    }
  }

  async draw(
    ctx: CanvasRenderingContext2D,
    tex: string,
    x: number,
    y: number,
    scale: number = 1,
  ): Promise<void> {
    const entry = this.cache.get(tex);
    if (!entry) throw new Error(`TeX not prepared: "${tex}". Call prepare() first.`);

    const w = entry.width * scale;
    const h = entry.height * scale;

    if (entry.browserImage) {
      // Browser: drawImage with target size — browser re-rasterizes the SVG
      ctx.drawImage(entry.browserImage as any, x, y, w, h);
    } else if (entry.nodeLoadImage) {
      // Node: rasterize SVG at exact target pixel size, then draw 1:1
      const svgString = entry.svgTemplate
        .replace('%WIDTH%', `${w}px`)
        .replace('%HEIGHT%', `${h}px`);
      const buf = Buffer.from(svgString, 'utf-8');
      const img = await entry.nodeLoadImage(buf);
      ctx.drawImage(img as any, x, y);
    }
  }

  measure(tex: string): { width: number; height: number } {
    const entry = this.cache.get(tex);
    if (!entry) throw new Error(`TeX not prepared: "${tex}". Call prepare() first.`);
    return { width: entry.width, height: entry.height };
  }
}

// ---------------------------------------------------------------------------
// Browser runner
// ---------------------------------------------------------------------------

export function runInBrowser(
  canvas: HTMLCanvasElement,
  config: AnimationConfig,
  animFn: AnimationFn,
): void {
  canvas.width = config.width;
  canvas.height = config.height;
  const ctx = canvas.getContext('2d')!;
  const duration = config.duration;
  let startTime: number | null = null;

  async function frame(timestamp: number) {
    if (startTime === null) startTime = timestamp;
    const elapsed = (timestamp - startTime) / 1000;
    const t = Math.min(elapsed, duration);

    ctx.clearRect(0, 0, config.width, config.height);
    await animFn(ctx, t);

    if (t < duration) {
      requestAnimationFrame(frame);
    }
  }

  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------------------
// Node.js frame renderer
// ---------------------------------------------------------------------------

export async function renderToFrames(
  config: AnimationConfig & { outDir: string },
  animFn: AnimationFn,
): Promise<void> {
  const { createCanvas } = await import('@napi-rs/canvas');
  const fs = await import('fs');
  const path = await import('path');

  const fps = config.fps ?? 30;
  const totalFrames = Math.ceil(config.duration * fps);
  const canvas = createCanvas(config.width, config.height);
  const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;

  fs.mkdirSync(config.outDir, { recursive: true });

  for (let i = 0; i <= totalFrames; i++) {
    const t = i / fps;

    (ctx as any).clearRect(0, 0, config.width, config.height);
    await animFn(ctx, t);

    const buf = canvas.toBuffer('image/png');
    const framePath = path.join(config.outDir, `frame_${String(i).padStart(5, '0')}.png`);
    fs.writeFileSync(framePath, buf);

    if (i % fps === 0) {
      console.log(`Rendered ${i}/${totalFrames} frames (${(t).toFixed(1)}s)`);
    }
  }

  console.log(`Done: ${totalFrames + 1} frames in ${config.outDir}`);
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeInOut(t: number): number {
  return t < 0.5
    ? 2 * t * t
    : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/** Clamp and normalize `t` into [0,1] over the interval [start, end]. */
export function timeSlice(t: number, start: number, end: number): number {
  if (t <= start) return 0;
  if (t >= end) return 1;
  return (t - start) / (end - start);
}
