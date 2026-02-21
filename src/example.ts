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
const FADE = 0.15;
const SHOW_CC = true;

// --- "Soup" elements: raw ingredients of R[x,y] ---
const SOUP_NUMS = ['0', '1', '-2', '\\tfrac{100}{3}', '9.5', '\\pi', '\\sqrt{2}'];
const SOUP_VARS = ['x', 'y'];
const SOUP_ALL = [...SOUP_NUMS, ...SOUP_VARS];

// --- Expressions built from ring operations ---
const EXPR_PAIRS: [string, string][] = [
  ['8', '3+5'],
  ['2\\pi', '\\pi \\cdot 2'],
  ['y + x \\cdot x \\cdot x', 'x^3 + y'],
  ['x \\cdot y', 'y \\cdot x'],
];
const EXPRS_LEFT = EXPR_PAIRS.map(p => p[0]);
const EXPRS_RIGHT = EXPR_PAIRS.map(p => p[1]);
const ALL_EXPRS = [...EXPRS_LEFT, ...EXPRS_RIGHT];

// --- Pseudo-random but deterministic positions for soup ---
function seededPositions(count: number, width: number, height: number, seed: number) {
  const positions: { x: number; y: number }[] = [];
  let s = seed;
  function rand() { s = (s * 1664525 + 1013904223) & 0x7fffffff; return s / 0x7fffffff; }
  const margin = 200;
  for (let i = 0; i < count; i++) {
    positions.push({
      x: margin + rand() * (width - 2 * margin),
      y: margin + rand() * (height - 2 * margin - 150),
    });
  }
  return positions;
}

// --- Timeline ---
// 0–4:     Title card
// 4–12:    Ring examples (Z, Z/nZ, Q, R, C)
// 12–16:   R[x,y] introduction
// 16–18:   R[x,y] fade out
// 18–24:   "Chaotic soup" of numbers and variables
// 24–30:   Expressions built with ring operations
// 30–36:   Unification animation (pairs merge)
// 36–40:   "polynomials" conclusion

const RING_APPEAR = [7.1, 8.3, 9.5, 10.7, 11.9];

const CAPTIONS: [number, number, string][] = [
  [4, 4.8, "Let's talk about rings."],
  [4.8, 6, "A ring is a set that knows how to\nadd, subtract, and multiply."],
  [6, 7.2, "Some basic examples are: the integers,"],
  [7.2, 8.4, "the integers modulo some n,"],
  [8.4, 9.6, "the rationals,"],
  [9.6, 10.8, "the real numbers,"],
  [10.8, 12, "the complex numbers."],
  [12, 14, "Here's another example:"],
  [14, 18, "any ring with some variables\nadjoined to it is also a ring."],
  [18, 22, "The elements of this ring are all the\nexpressions we could write down"],
  [22, 24, "involving real numbers,\nand variables x and y,"],
  [24, 28, "built up with ring operations \u2014\naddition, subtraction, and multiplication."],
  [28, 34, "We consider two expressions the same\nif the ring axioms force them to be."],
  [34, 40, "The elements of this ring are exactly\nthe polynomials over x and y."],
];

export const config: AnimationConfig = {
  width: 1920,
  height: 1080,
  duration: 40,
  fps: 30,
};

export const tex = new TexRenderer();

export async function setup(): Promise<void> {
  await tex.prepare([...RINGS, TEX_RXY, ...SOUP_ALL, ...ALL_EXPRS]);
}

async function drawTexCentered(
  ctx: CanvasRenderingContext2D, expr: string, cx: number, cy: number, scale: number,
) {
  const size = tex.measure(expr);
  const w = size.width * scale;
  const h = size.height * scale;
  await tex.draw(ctx, expr, cx - w / 2, cy - h / 2, scale);
}

function drawCC(ctx: CanvasRenderingContext2D, t: number, width: number, height: number) {
  if (!SHOW_CC) return;
  const caption = CAPTIONS.find(([start, end]) => t >= start && t < end);
  if (!caption) return;
  const text = caption[2];
  const lines = text.split('\n');

  ctx.font = '36px Roboto, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  const lineHeight = 44;
  const padding = 12;
  const boxHeight = lines.length * lineHeight + padding * 2;
  const boxY = height - 80 - boxHeight;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(width / 2 - 600, boxY, 1200, boxHeight);

  ctx.fillStyle = '#fff';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], width / 2, boxY + padding + (i + 1) * lineHeight);
  }
}

export const animate: AnimationFn = async (ctx, t) => {
  const { width, height } = config;

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
  }

  // --- Ring examples (4–12s) ---
  if (t >= 4 && t < 12) {
    const scale = 4;
    const gap = 60;

    const measures = RINGS.map(r => tex.measure(r));
    const widths = measures.map(m => m.width * scale);
    const totalW = widths.reduce((a, b) => a + b, 0) + gap * (RINGS.length - 1);
    let x = (width - totalW) / 2;
    const baselineY = height / 2;

    for (let i = 0; i < RINGS.length; i++) {
      const appearTime = RING_APPEAR[i];
      const p = easeInOut(timeSlice(t, appearTime, appearTime + FADE));
      if (p > 0) {
        ctx.globalAlpha = p;
        const y = baselineY - measures[i].baseline * scale;
        await tex.draw(ctx, RINGS[i], x, y, scale);
        ctx.globalAlpha = 1;
      }
      x += widths[i] + gap;
    }
  }

  // --- R[x,y] introduction (12–18s) ---
  if (t >= 12 && t < 18) {
    // Fade out ring row
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

    // R[x,y] fade in then hold, fade out at end
    const rxyIn = easeInOut(timeSlice(t, 13, 13 + FADE));
    const rxyOut = 1 - easeInOut(timeSlice(t, 18 - FADE, 18));
    const rxyAlpha = Math.min(rxyIn, rxyOut);
    if (rxyAlpha > 0) {
      ctx.globalAlpha = rxyAlpha;
      await drawTexCentered(ctx, TEX_RXY, width / 2, height / 2, 5);
      ctx.globalAlpha = 1;
    }
  }

  // --- Chaotic soup of numbers and variables (18–24s) ---
  if (t >= 18 && t < 24) {
    const soupPositions = seededPositions(SOUP_ALL.length, width, height, 42);
    const scale = 3;

    for (let i = 0; i < SOUP_ALL.length; i++) {
      // Stagger appearance over 18–20s
      const appearTime = 18 + (i / SOUP_ALL.length) * 2;
      const fadeOut = 1 - easeInOut(timeSlice(t, 24 - FADE, 24));
      const fadeIn = easeInOut(timeSlice(t, appearTime, appearTime + FADE));
      const alpha = Math.min(fadeIn, fadeOut);
      if (alpha > 0) {
        ctx.globalAlpha = alpha;
        await drawTexCentered(ctx, SOUP_ALL[i], soupPositions[i].x, soupPositions[i].y, scale);
        ctx.globalAlpha = 1;
      }
    }
  }

  // --- Expressions with ring operations (24–36s) ---
  if (t >= 24 && t < 36) {
    const scale = 3;
    const pairGap = 120;
    const rowHeight = 100;
    const startY = 200;

    for (let i = 0; i < EXPR_PAIRS.length; i++) {
      const [left, right] = EXPR_PAIRS[i];
      const appearTime = 24 + i * 1;
      const fadeIn = easeInOut(timeSlice(t, appearTime, appearTime + FADE));

      // Unification: pairs merge toward center during 30–34s
      const unifyStart = 30 + i * 1;
      const unifyP = easeInOut(timeSlice(t, unifyStart, unifyStart + 1));

      const leftMeasure = tex.measure(left);
      const rightMeasure = tex.measure(right);
      const cx = width / 2;
      const cy = startY + i * (rowHeight + 40);

      // Start: left and right separated by gap
      // End: both converge to center, right fades out
      const separation = lerp(pairGap, 0, unifyP);
      const leftX = cx - separation / 2 - leftMeasure.width * scale / 2;
      const rightX = cx + separation / 2 - rightMeasure.width * scale / 2;

      if (fadeIn > 0) {
        // "=" sign between them (fades in with pair, fades out during unify)
        const eqAlpha = fadeIn * (1 - unifyP);
        if (eqAlpha > 0) {
          ctx.globalAlpha = eqAlpha;
          ctx.fillStyle = '#000';
          ctx.font = '48px Roboto, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('=', cx, cy);
          ctx.globalAlpha = 1;
        }

        // Left expression
        ctx.globalAlpha = fadeIn;
        await tex.draw(ctx, left, leftX, cy - leftMeasure.height * scale / 2, scale);
        ctx.globalAlpha = 1;

        // Right expression (fades out during unification)
        const rightAlpha = fadeIn * (1 - unifyP);
        if (rightAlpha > 0) {
          ctx.globalAlpha = rightAlpha;
          await tex.draw(ctx, right, rightX, cy - rightMeasure.height * scale / 2, scale);
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  // --- "Polynomials" conclusion (36–40s) ---
  if (t >= 36) {
    // Fade out expressions
    const exprFade = 1 - easeInOut(timeSlice(t, 36, 36 + FADE));
    if (exprFade > 0) {
      // Just let them vanish with the fade — the previous block
      // won't draw since t >= 36.
    }

    // Show R[x,y] = "polynomials" centered
    const fadeIn = easeInOut(timeSlice(t, 36.5, 36.5 + FADE));
    if (fadeIn > 0) {
      ctx.globalAlpha = fadeIn;
      await drawTexCentered(ctx, TEX_RXY, width / 2, height / 2, 5);

      ctx.fillStyle = '#000';
      ctx.font = '48px Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('= polynomials in x and y with real coefficients', width / 2, height / 2 + 60);
      ctx.globalAlpha = 1;
    }
  }

  // --- Closed captions (drawn last, on top) ---
  drawCC(ctx, t, width, height);
};
