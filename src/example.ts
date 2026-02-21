import { AnimationConfig, AnimationFn, TexRenderer, lerp, easeInOut, timeSlice } from './janim.js';

const TITLE = 'Seeing Upside-Down';
const SUBTITLE = 'a brief taste of algebraic geometry';
const TEX_Z = '\\mathbb{Z}';
const TEX_ZN = '\\mathbb{Z}/n\\mathbb{Z}';
const TEX_Q = '\\mathbb{Q}';
const TEX_R = '\\mathbb{R}';
const TEX_C = '\\mathbb{C}';
const TEX_RXY = '\\mathbb{R}[x,y]';

const RINGS = [TEX_Z, TEX_ZN, TEX_Q, TEX_R, TEX_C];
const FADE = 0.15; // seconds — very brief fades

export const config: AnimationConfig = {
  width: 1920,
  height: 1080,
  duration: 18,
  fps: 30,
};

export const tex = new TexRenderer();

export async function setup(): Promise<void> {
  await tex.prepare([...RINGS, TEX_RXY]);
}

// Helper: draw TeX centered at (cx, cy)
async function drawTexCentered(
  ctx: CanvasRenderingContext2D, expr: string, cx: number, cy: number, scale: number,
) {
  const size = tex.measure(expr);
  const w = size.width * scale;
  const h = size.height * scale;
  await tex.draw(ctx, expr, cx - w / 2, cy - h / 2, scale);
}

export const animate: AnimationFn = async (ctx, t) => {
  const { width, height } = config;

  // Background
  ctx.fillStyle = '#faf5e7';
  ctx.fillRect(0, 0, width, height);

  // --- Title card (0–4s) ---
  if (t < 4) {
    const fadeIn = easeInOut(timeSlice(t, 0, FADE));
    const fadeOut = 1 - easeInOut(timeSlice(t, 4 - FADE, 4));
    const alpha = Math.min(fadeIn, fadeOut);
    if (alpha > 0) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#000';
      ctx.font = 'bold 72px Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(TITLE, width / 2, height / 2 - 40);
      ctx.font = 'italic 48px Roboto, sans-serif';
      ctx.fillText(SUBTITLE, width / 2, height / 2 + 40);
      ctx.globalAlpha = 1;
    }
    return;
  }

  // --- Ring examples (4–12s) ---
  if (t < 12) {
    const scale = 4;
    const gap = 60;

    const measures = RINGS.map(r => tex.measure(r));
    const widths = measures.map(m => m.width * scale);
    const totalW = widths.reduce((a, b) => a + b, 0) + gap * (RINGS.length - 1);
    let x = (width - totalW) / 2;
    const baselineY = height / 2; // common baseline

    for (let i = 0; i < RINGS.length; i++) {
      const appearTime = 5 + i * 1.2;
      const p = easeInOut(timeSlice(t, appearTime, appearTime + FADE));
      if (p > 0) {
        ctx.globalAlpha = p;
        const y = baselineY - measures[i].baseline * scale;
        await tex.draw(ctx, RINGS[i], x, y, scale);
        ctx.globalAlpha = 1;
      }
      x += widths[i] + gap;
    }

    return;
  }

  // --- R[x,y] (12–18s) ---
  {
    const ringFade = 1 - easeInOut(timeSlice(t, 12, 12 + FADE));
    if (ringFade > 0) {
      const scale = 4;
      const gap = 60;
      const measures = RINGS.map(r => tex.measure(r));
      const widths = measures.map(m => m.width * scale);
      const totalW = widths.reduce((a, b) => a + b, 0) + gap * (RINGS.length - 1);
      let x = (width - totalW) / 2;
      const baselineY = height / 2;

      ctx.globalAlpha = ringFade;
      for (let i = 0; i < RINGS.length; i++) {
        const y = baselineY - measures[i].baseline * scale;
        await tex.draw(ctx, RINGS[i], x, y, scale);
        x += widths[i] + gap;
      }
      ctx.globalAlpha = 1;
    }

    const rxyFade = easeInOut(timeSlice(t, 13, 13 + FADE));
    if (rxyFade > 0) {
      ctx.globalAlpha = rxyFade;
      await drawTexCentered(ctx, TEX_RXY, width / 2, height / 2, 5);
      ctx.globalAlpha = 1;
    }
  }
};
