import { AnimationConfig, AnimationFn, TexRenderer, lerp, easeInOut, timeSlice } from './janim.js';

const TITLE = 'Seeing Upside-Down';
const SUBTITLE = 'a brief taste of algebraic geometry';
const FADE = 0.15;
const SHOW_CC = true;

// --- Colored variables ---
const T = '{\\color{#3e8aff}{t}}';
const X = '{\\color{#ff6b66}{x}}';
const Y = '{\\color{#b28800}{y}}';
const U = '{\\color{#6eb200}{u}}';
const V = '{\\color{#b100d1}{v}}';
const W = '{\\color{#00b2bb}{w}}';

// --- Polynomial ring labels ---
const TEX_RT = `\\mathbb{R}[${T}]`;
const TEX_RXY = `\\mathbb{R}[${X},${Y}]`;
const TEX_RUVW = `\\mathbb{R}[${U},${V},${W}]`;
const TEX_CDOTS = '\\cdots';
const RING_LABELS = [TEX_RT, TEX_RXY, TEX_RUVW, TEX_CDOTS];

// --- Example polynomials under each ring ---
const POLY_RT = [`${T}^2 + 1`, `3${T} - \\pi`, `${T}^5`];
const POLY_RXY = [`${X}^2 + ${Y}`, `${X}${Y} - 3.2`, '17.9'];
const POLY_RUVW = [`${U} + ${V}${W}`, `3${U} - ${V}`, `${U}${V}^9`];
const POLY_GROUPS = [POLY_RT, POLY_RXY, POLY_RUVW];
const ALL_POLYS = [...POLY_RT, ...POLY_RXY, ...POLY_RUVW];

// --- Homomorphism ---
const TEX_F_TYPE = `f : \\mathbb{R}[${X},${Y}] \\to \\mathbb{R}[${T}]`;
const TEX_F0 = 'f(0) = 0';
const TEX_F3 = 'f(-3) = -3';
const TEX_F100 = 'f(\\tfrac{100}{7}) = \\tfrac{100}{7}';
const CONST_EXPRS = [TEX_F0, TEX_F3, TEX_F100];

// --- Mapping examples: persistent prefixes + cycling RHS ---
const TEX_X_MAPSTO = `${X} \\mapsto`;
const TEX_Y_MAPSTO = `${Y} \\mapsto`;

const MAPPING_RHS: [string, string][] = [
  [`${T}^3 + 1`, `${T}^2 - ${T}`],
  [`${T}`, `${T}^5 - ${T}^4 + ${T}^3 - ${T}^2 + 3`],
  [`2${T} - 1`, `${T}^2`],
  [`0`, `${T}`],
];
const ALL_RHS = MAPPING_RHS.flat();

// --- Timeline ---
// 0–3:     Title card
// 3–10:    Polynomial ring labels + example polys
// 10–30:   Homomorphism f : R[x,y] → R[t]
//   10–14:   Type signature appears
//   14–19:   Constants map to themselves
//   19–30:   Mapping examples cycle

const CAPTIONS: [number, number, string][] = [
  [3, 5, "Let's talk about real polynomial rings."],
  [5, 7.5, "The elements of one of these rings\nare all the polynomials we can write down"],
  [7.5, 10, "over a particular set of variables,\nwith real coefficients."],
  [10, 12.5, "What are the nice functions\nbetween these rings?"],
  [12.5, 14, "Let's consider an example."],
  [14, 16.5, "What are some nice functions\nfrom R[x,y] to R[t]?"],
  [16.5, 19, "Let's say that we want to only\nmap constants to themselves."],
  [19, 22, "If we demand that f is a ring homomorphism,\nthen the only freedom we have left"],
  [22, 25, "is deciding what x and y\nget mapped to."],
  [25, 28, "A nice function from R[x,y] to R[t]\namounts to making only two choices:"],
  [28, 30, "choosing a polynomial in t for x,\nand another for y."],
];

export const config: AnimationConfig = {
  width: 1920,
  height: 1080,
  duration: 30,
  fps: 30,
};

export const tex = new TexRenderer();

export async function setup(): Promise<void> {
  await tex.prepare([
    ...RING_LABELS, ...ALL_POLYS,
    TEX_F_TYPE, ...CONST_EXPRS,
    TEX_X_MAPSTO, TEX_Y_MAPSTO, ...ALL_RHS,
  ]);
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

  // --- Title card (0–3s) ---
  if (t < 3) {
    const fadeIn = easeInOut(timeSlice(t, 0, FADE));
    const fadeOut = 1 - easeInOut(timeSlice(t, 3 - FADE, 3));
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

  // --- Ring labels + example polys (3–10s) ---
  if (t >= 3 && t < 10.5) {
    const phaseOut = 1 - easeInOut(timeSlice(t, 10, 10 + FADE));
    const scale = 3.5;
    const gap = 200;

    // Layout ring labels in a row
    const measures = RING_LABELS.map(r => tex.measure(r));
    const widths = measures.map(m => m.width * scale);
    const totalW = widths.reduce((a, b) => a + b, 0) + gap * (RING_LABELS.length - 1);
    const labelY = height / 3;

    // Center x positions for each label
    const labelCenterX: number[] = [];
    let xPos = (width - totalW) / 2;
    for (let i = 0; i < RING_LABELS.length; i++) {
      labelCenterX.push(xPos + widths[i] / 2);
      xPos += widths[i] + gap;
    }

    // Ring labels appear one by one (3.5–5s)
    const LABEL_APPEAR = [3.5, 4.0, 4.5, 5.0];
    for (let i = 0; i < RING_LABELS.length; i++) {
      const fadeIn = easeInOut(timeSlice(t, LABEL_APPEAR[i], LABEL_APPEAR[i] + FADE));
      const alpha = fadeIn * phaseOut;
      if (alpha > 0) {
        ctx.globalAlpha = alpha;
        await drawTexCentered(ctx, RING_LABELS[i], labelCenterX[i], labelY, scale);
        ctx.globalAlpha = 1;
      }
    }

    // Example polys appear underneath (6–8s)
    const polyScale = 2.5;
    const polyStartTimes = [6.0, 6.5, 7.0];
    for (let g = 0; g < POLY_GROUPS.length; g++) {
      const polys = POLY_GROUPS[g];
      const cx = labelCenterX[g];
      for (let j = 0; j < polys.length; j++) {
        const appearT = polyStartTimes[g] + j * 0.4;
        const fadeIn = easeInOut(timeSlice(t, appearT, appearT + FADE));
        const alpha = fadeIn * phaseOut;
        if (alpha > 0) {
          ctx.globalAlpha = alpha;
          await drawTexCentered(ctx, polys[j], cx, labelY + 120 + j * 80, polyScale);
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  // --- Homomorphism: f : R[x,y] → R[t] (10–30s) ---
  if (t >= 10) {
    // Type signature: fades in at 10.5, persists, fades out at end
    const fTypeIn = easeInOut(timeSlice(t, 10.5, 10.5 + FADE));
    const fTypeOut = 1 - easeInOut(timeSlice(t, 30 - FADE, 30));
    const fAlpha = Math.min(fTypeIn, fTypeOut);
    if (fAlpha > 0) {
      ctx.globalAlpha = fAlpha;
      await drawTexCentered(ctx, TEX_F_TYPE, width / 2, height / 4, 4);
      ctx.globalAlpha = 1;
    }

    // Constants: f(0)=0, f(-3)=-3, f(100/7)=100/7 (17–19.5s)
    if (t >= 17 && t < 19.5) {
      const constOut = 1 - easeInOut(timeSlice(t, 19, 19 + FADE));
      const constTimes = [17.2, 17.6, 18.0];
      for (let i = 0; i < CONST_EXPRS.length; i++) {
        const fadeIn = easeInOut(timeSlice(t, constTimes[i], constTimes[i] + FADE));
        const alpha = fadeIn * constOut;
        if (alpha > 0) {
          ctx.globalAlpha = alpha;
          await drawTexCentered(ctx, CONST_EXPRS[i], width / 2, height / 2 + i * 90, 3);
          ctx.globalAlpha = 1;
        }
      }
    }

    // Mapping examples cycle (19.5–30s)
    if (t >= 19.5) {
      const exampleDur = 2.5;
      const crossFade = 0.3;
      const mapScale = 3.5;
      const rhsGap = 20;

      // Layout: center the block (prefix + gap + widest RHS)
      const xPrefixM = tex.measure(TEX_X_MAPSTO);
      const yPrefixM = tex.measure(TEX_Y_MAPSTO);
      const prefixW = Math.max(xPrefixM.width, yPrefixM.width) * mapScale;
      const maxRhsW = Math.max(...ALL_RHS.map(e => tex.measure(e).width * mapScale));
      const totalW = prefixW + rhsGap + maxRhsW;
      const leftX = (width - totalW) / 2;
      const rhsX = leftX + prefixW + rhsGap;

      // Two baseline Y positions for the x and y rows
      const xBaselineY = height / 2;
      const yBaselineY = height / 2 + 100;

      // Persistent prefixes: x ↦ and y ↦ (baseline-aligned)
      const prefixIn = easeInOut(timeSlice(t, 19.5, 19.5 + crossFade));
      const prefixOut = 1 - easeInOut(timeSlice(t, 30 - FADE, 30));
      const prefixAlpha = Math.min(prefixIn, prefixOut);
      if (prefixAlpha > 0) {
        ctx.globalAlpha = prefixAlpha;
        await tex.draw(ctx, TEX_X_MAPSTO, leftX, xBaselineY - xPrefixM.baseline * mapScale, mapScale);
        await tex.draw(ctx, TEX_Y_MAPSTO, leftX, yBaselineY - yPrefixM.baseline * mapScale, mapScale);
        ctx.globalAlpha = 1;
      }

      // Cycling RHS values (baseline-aligned to same rows)
      for (let i = 0; i < MAPPING_RHS.length; i++) {
        const [xRhs, yRhs] = MAPPING_RHS[i];
        const start = 19.5 + i * exampleDur;
        const end = start + exampleDur;

        if (t < start || t > end + crossFade) continue;

        const fadeIn = easeInOut(timeSlice(t, start, start + crossFade));
        const fadeOut = (i < MAPPING_RHS.length - 1)
          ? 1 - easeInOut(timeSlice(t, end - crossFade, end))
          : 1 - easeInOut(timeSlice(t, 30 - FADE, 30));
        const alpha = Math.min(fadeIn, fadeOut);

        if (alpha > 0) {
          ctx.globalAlpha = alpha;
          const xM = tex.measure(xRhs);
          const yM = tex.measure(yRhs);
          await tex.draw(ctx, xRhs, rhsX, xBaselineY - xM.baseline * mapScale, mapScale);
          await tex.draw(ctx, yRhs, rhsX, yBaselineY - yM.baseline * mapScale, mapScale);
          ctx.globalAlpha = 1;
        }
      }
    }
  }

  // --- Closed captions (drawn last, on top) ---
  drawCC(ctx, t, width, height);
};
