import { AnimationConfig, AnimationFn, TexRenderer, easeInOut, timeSlice } from './janim.js';
import { CurveDef, computeFixedViewport, Viewport, CurveDef3D, createProjection, computeFixedViewport3D } from './plot.js';
import { SceneDraw, titleScene, ringsScene, homomorphismScene, parametricScene, parametric3DScene, dualityScene } from './scenes.js';

export const TITLE = 'Seeing Upside-Down';
export const SUBTITLE = 'a brief taste of algebraic geometry';
export const FADE = 0.15;
const SHOW_CC = true;

// --- Colored variables ---
const T = '{\\color{#3e8aff}{t}}';
export const X = '{\\color{#ff6b66}{x}}';
export const Y = '{\\color{#b28800}{y}}';
const U = '{\\color{#6eb200}{u}}';
const V = '{\\color{#b100d1}{v}}';
const W = '{\\color{#00b2bb}{w}}';

// --- Polynomial ring labels ---
const TEX_RT = `\\mathbb{R}[${T}]`;
const TEX_RXY = `\\mathbb{R}[${X},${Y}]`;
const TEX_RUVW = `\\mathbb{R}[${U},${V},${W}]`;
const TEX_CDOTS = '\\cdots';
export const RING_LABELS = [TEX_RT, TEX_RXY, TEX_RUVW, TEX_CDOTS];

// --- Example polynomials under each ring ---
const POLY_RT = [`${T}^2 + 1`, `3${T} - \\pi`, `${T}^5`];
const POLY_RXY = [`${X}^2 + ${Y}`, `${X}${Y} - 3.2`, '17.9'];
const POLY_RUVW = [`${U} + ${V}${W}`, `3${U} - ${V}`, `${U}${V}^9`];
export const POLY_GROUPS = [POLY_RT, POLY_RXY, POLY_RUVW];
const ALL_POLYS = [...POLY_RT, ...POLY_RXY, ...POLY_RUVW];

// --- Homomorphism ---
export const TEX_F_TYPE = `f : \\mathbb{R}[${X},${Y}] \\to \\mathbb{R}[${T}]`;
const TEX_F0 = 'f(0) = 0';
const TEX_F3 = 'f(-3) = -3';
const TEX_F100 = 'f(\\tfrac{100}{7}) = \\tfrac{100}{7}';
export const CONST_EXPRS = [TEX_F0, TEX_F3, TEX_F100];

// --- Mapping examples: persistent prefixes + cycling RHS ---
export const TEX_X_MAPSTO = `f(${X}) =`;
export const TEX_Y_MAPSTO = `f(${Y}) =`;

export const MAPPING_RHS: [string, string][] = [
  [`${T}^3 + 1`, `${T}^2 - ${T}`],
  [`${T}`, `${T}^5 - ${T}^4 + ${T}^3 - ${T}^2 + 3`],
  [`2${T} - 1`, `${T}^2`],
  [`0`, `${T}`],
];
export const ALL_RHS = MAPPING_RHS.flat();

// --- Parametric curve functions (parallel to MAPPING_RHS) ---
export const CURVES: CurveDef[] = [
  { xFn: t => t ** 3 + 1, yFn: t => t ** 2 - t, tRange: [-1.5, 1.5] },
  { xFn: t => t, yFn: t => t ** 5 - t ** 4 + t ** 3 - t ** 2 + 3, tRange: [-1.2, 1.5] },
  { xFn: t => 2 * t - 1, yFn: t => t ** 2, tRange: [-1.5, 1.5] },
  { xFn: t => 0, yFn: t => t, tRange: [-3, 3] },
];

export const VIEWPORT: Viewport = computeFixedViewport(CURVES);

// --- 3D mapping data ---
export const Z = '{\\color{#6eb200}{z}}';
export const TEX_Z_MAPSTO = `f(${Z}) =`;

export const MAPPING_RHS_3D: [string, string, string][] = [
  [T, `${T}^2`, `${T}^3`],
  [`${T}^3 + 1`, `${T}^2 - ${T}`, `2${T}`],
  [`${T}^2 - 1`, T, `${T}^3 - ${T}`],
  [`0`, T, `${T}^2`],
];
export const ALL_RHS_3D = MAPPING_RHS_3D.flat();

const S3 = 2.5; // scale factor for 3D curves
export const CURVES_3D: CurveDef3D[] = [
  { xFn: t => S3 * t, yFn: t => S3 * t ** 2, zFn: t => S3 * t ** 3, tRange: [-1.2, 1.2] },
  { xFn: t => S3 * (t ** 3 + 1), yFn: t => S3 * (t ** 2 - t), zFn: t => S3 * 2 * t, tRange: [-2.95, 1.05] },
  { xFn: t => S3 * (t ** 2 - 1), yFn: t => S3 * t, zFn: t => S3 * (t ** 3 - t), tRange: [-1.3, 1.3] },
  { xFn: t => 0, yFn: t => S3 * t, zFn: t => S3 * t ** 2, tRange: [-1.5, 1.5] },
];

export const PROJ_AZIMUTH = 0.3;
export const PROJ_ELEVATION = 1.1;
export const PROJ_DISTANCE = 10;
export const PROJ_ROTATION_SPEED = 0.15; // radians per second

// --- Duality / conclusion ---
const DUALITY_2D = `\\mathbb{R}[${X},${Y}] \\to \\mathbb{R}[${T}] \\quad\\cssId{arr}{\\longleftrightarrow}\\quad \\text{polynomial curves in } \\mathbb{R}^2`;
const DUALITY_3D = `\\mathbb{R}[${X},${Y},${Z}] \\to \\mathbb{R}[${T}] \\quad\\cssId{arr}{\\longleftrightarrow}\\quad \\text{polynomial curves in } \\mathbb{R}^3`;
const N = '{\\color{#b100d1}{n}}';
const P = '{\\color{#00b2bb}{p}}';
export const N_COLOR = '#b100d1';
export const P_COLOR = '#00b2bb';
const DUALITY_GENERAL = `\\mathbb{R}[${X}_1,\\ldots,${X}_{\\cssId{n1}{${N}}}] \\to \\mathbb{R}[${T}_1,\\ldots,${T}_{\\cssId{p1}{${P}}}] \\quad\\cssId{arr}{\\longleftrightarrow}\\quad \\text{polynomial maps } \\mathbb{R}^{\\cssId{p2}{${P}}} \\to \\mathbb{R}^{\\cssId{n2}{${N}}}`;
const DUALITY_CLOSING_EXPR = `\\text{algebra}^{\\text{op}} \\quad\\longleftrightarrow\\quad \\text{geometry}`;
export const DUALITY_ROWS = [DUALITY_2D, DUALITY_3D, DUALITY_GENERAL];
export const DUALITY_CLOSING = DUALITY_CLOSING_EXPR;

export const VIEWPORT_3D: Viewport = computeFixedViewport3D(
  CURVES_3D, createProjection(PROJ_AZIMUTH, PROJ_ELEVATION, PROJ_DISTANCE),
);

export const config: AnimationConfig = {
  width: 1920,
  height: 1080,
  duration: 70,
  fps: 30,
};

export const tex = new TexRenderer();

export async function setup(): Promise<void> {
  await tex.prepare([
    ...RING_LABELS, ...ALL_POLYS,
    TEX_F_TYPE, ...CONST_EXPRS,
    TEX_X_MAPSTO, TEX_Y_MAPSTO, ...ALL_RHS, X, Y,
    TEX_Z_MAPSTO, Z, ...ALL_RHS_3D,
    ...DUALITY_ROWS, DUALITY_CLOSING,
  ]);
}

// ---------------------------------------------------------------------------
// Timeline — all timing data in one place
// ---------------------------------------------------------------------------

interface SceneEntry {
  start: number;
  draw: SceneDraw;
  captions?: { start: number; end: number; text: string }[];
}

export const TIMELINE: SceneEntry[] = [
  {
    start: 0,
    draw: titleScene(),
  },
  {
    start: 3,
    draw: ringsScene({ labels: 0.5, polys: 3 }),
    captions: [
      { start: 0, end: 2, text: "Let's talk about real polynomial rings." },
      { start: 2, end: 4.5, text: "The elements of a polynomial ring\nare all the polynomials we can write down" },
      { start: 4.5, end: 7, text: "over a particular set of variables,\nwith real coefficients." },
    ],
  },
  {
    start: 10,
    draw: homomorphismScene({ typeSig: 0.5, constants: 7, mappings: 9.5 }),
    captions: [
      { start: 0, end: 2.5, text: "What are the nice functions\nbetween these rings?" },
      { start: 2.5, end: 4, text: "Let's consider an example." },
      { start: 4, end: 6.5, text: "What are some nice functions\nfrom R[x,y] to R[t]?" },
      { start: 6.5, end: 9, text: "I'm being intentionally a bit vague\nabout what \"nice\" means." },
      { start: 9, end: 11.5, text: "Let's say that being a nice function means\nat least that you map any constant to itself." },
      { start: 11.5, end: 14, text: "Let's also say that a nice function\nneeds to be a ring homomorphism:" },
      { start: 14, end: 15.5, text: "it respects all the ring operations." },
      { start: 15.5, end: 17.5, text: "In that case the only freedom we have left\nis deciding what x and y get mapped to," },
      { start: 17.5, end: 19, text: "because once we decide that, everything else\nfollows from ring operation preservation." },
      { start: 19, end: 20, text: "So a nice function from R[x,y] to R[t]\namounts to making only two choices:" },
    ],
  },
  {
    start: 30,
    draw: parametricScene({ plotStart: 0.5 }),
    captions: [
      { start: 0, end: 3.5, text: "Notice that this is the same thing as\ndescribing a parameterized curve in the plane." },
      { start: 3.5, end: 7, text: "We're giving for each time t a polynomial function\nthat tells us what the x and y values should be at that time." },
    ],
  },
  {
    start: 40,
    draw: parametric3DScene({ plotStart: 0.5 }),
    captions: [
      { start: 0, end: 4, text: "If we had asked about nice functions\nfrom R[x,y,z] to R[t]," },
      { start: 4, end: 8, text: "we would have found that they\nare parameterized curves in 3D space." },
    ],
  },
  {
    start: 50,
    draw: dualityScene(),
    captions: [
      { start: 0, end: 3, text: "So maps from R[x,y] to R[t] tell us\nhow to map a one-dimensional line into the two-dimensional plane," },
      { start: 3, end: 5, text: "and maps from R[x,y,z] to R[t]\ntell us how to map a line into 3D space." },
      { start: 5, end: 8, text: "It's a nice exercise to change the number of variables\non both sides of the function and see what happens." },
      { start: 8, end: 11, text: "For example, maps from R[x,y] to just R are\nmere points in the plane," },
      { start: 11, end: 13, text: "and maps from R[x,y,z] to R[t,u] are\ntwo-dimensional polynomial surfaces in 3D space." },
      { start: 13, end: 15, text: "There's a general pattern happening here:" },
      { start: 15, end: 17.5, text: "Algebraically nice maps from a ring with n variables\nto a ring with p variables correspond to" },
      { start: 17.5, end: 19, text: "geometrically nice maps going the other direction,\nfrom p-dimensional space to n-dimensional space." },
      { start: 19, end: 20, text: "This is a small tip of a deep iceberg:\nthe duality between algebra and geometry." },
    ],
  },
];

// ---------------------------------------------------------------------------
// Closed captions
// ---------------------------------------------------------------------------

function drawCC(
  ctx: CanvasRenderingContext2D,
  localT: number,
  captions: { start: number; end: number; text: string }[],
  width: number,
  height: number,
) {
  if (!SHOW_CC) return;
  const caption = captions.find(c => localT >= c.start && localT < c.end);
  if (!caption) return;
  const text = caption.text;
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

// ---------------------------------------------------------------------------
// Main animation — scene dispatcher
// ---------------------------------------------------------------------------

const { width, height } = config;

export const animate: AnimationFn = async (ctx, t) => {
  ctx.fillStyle = '#faf5e7';
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < TIMELINE.length; i++) {
    const entry = TIMELINE[i];
    const duration = (i < TIMELINE.length - 1 ? TIMELINE[i + 1].start : config.duration) - entry.start;
    const localT = t - entry.start;
    if (localT >= 0 && localT < duration + FADE) {
      await entry.draw(ctx, localT, { width, height, duration });
    }
    // captions
    if (entry.captions && localT >= 0 && localT < duration) {
      drawCC(ctx, localT, entry.captions, width, height);
    }
  }
};
