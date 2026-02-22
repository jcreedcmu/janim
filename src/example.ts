import { AnimationConfig, AnimationFn, TexRenderer, easeInOut, timeSlice } from './janim.js';
import { CurveDef, computeFixedViewport, Viewport, CurveDef3D, createProjection, computeFixedViewport3D } from './plot.js';
import { SceneDraw, titleScene, ringsScene, homomorphismScene, parametricScene, parametric3DScene, dualityScene } from './scenes.js';
import { getCue } from './cues.js';

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

// --- Ring operation preservation examples ---
export const RING_OP_EXPRS = [
  `f(${X} + 2${Y}) = f(${X}) + 2f(${Y})`,
  `f(${X}${Y}^2 - 3) = f(${X})\\,f(${Y})^2 - 3`,
  `f(${X}^3) = f(${X})^3`,
];

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
const DUALITY_POINT = `\\mathbb{R}[${X},${Y}] \\to \\mathbb{R} \\quad\\cssId{arr}{\\longleftrightarrow}\\quad \\text{points in } \\mathbb{R}^2`;
const DUALITY_SURFACE = `\\mathbb{R}[${X},${Y},${Z}] \\to \\mathbb{R}[${T},${U}] \\quad\\cssId{arr}{\\longleftrightarrow}\\quad \\text{polynomial surfaces in } \\mathbb{R}^3`;
const DUALITY_GENERAL = `\\mathbb{R}[${X}_1,\\ldots,${X}_{\\cssId{n1}{${N}}}] \\to \\mathbb{R}[${T}_1,\\ldots,${T}_{\\cssId{p1}{${P}}}] \\quad\\cssId{arr}{\\longleftrightarrow}\\quad \\text{polynomial maps } \\mathbb{R}^{\\cssId{p2}{${P}}} \\to \\mathbb{R}^{\\cssId{n2}{${N}}}`;
// Uniform versions: indexed variables on the left, R^p → R^n on the right
const DUALITY_2D_U = `\\mathbb{R}[${X}_1,${X}_2] \\to \\mathbb{R}[${T}_1] \\quad\\cssId{arr}{\\longleftrightarrow}\\quad \\text{polynomial maps } \\mathbb{R}^1 \\to \\mathbb{R}^2`;
const DUALITY_3D_U = `\\mathbb{R}[${X}_1,${X}_2,${X}_3] \\to \\mathbb{R}[${T}_1] \\quad\\cssId{arr}{\\longleftrightarrow}\\quad \\text{polynomial maps } \\mathbb{R}^1 \\to \\mathbb{R}^3`;
const DUALITY_POINT_U = `\\mathbb{R}[${X}_1,${X}_2] \\to \\mathbb{R} \\quad\\cssId{arr}{\\longleftrightarrow}\\quad \\text{polynomial maps } \\mathbb{R}^0 \\to \\mathbb{R}^2`;
const DUALITY_SURFACE_U = `\\mathbb{R}[${X}_1,${X}_2,${X}_3] \\to \\mathbb{R}[${T}_1,${T}_2] \\quad\\cssId{arr}{\\longleftrightarrow}\\quad \\text{polynomial maps } \\mathbb{R}^2 \\to \\mathbb{R}^3`;

const DUALITY_CLOSING_EXPR = `\\text{algebra}^{\\text{op}} \\quad\\longleftrightarrow\\quad \\text{geometry}`;
export const DUALITY_ROWS = [DUALITY_2D, DUALITY_3D, DUALITY_POINT, DUALITY_SURFACE, DUALITY_GENERAL];
export const DUALITY_ROWS_UNIFORM = [DUALITY_2D_U, DUALITY_3D_U, DUALITY_POINT_U, DUALITY_SURFACE_U, DUALITY_GENERAL];
export const DUALITY_CLOSING = DUALITY_CLOSING_EXPR;

export const VIEWPORT_3D: Viewport = computeFixedViewport3D(
  CURVES_3D, createProjection(PROJ_AZIMUTH, PROJ_ELEVATION, PROJ_DISTANCE),
);

export const config: AnimationConfig = {
  width: 1920,
  height: 1080,
  duration: getCue('anim-end') - getCue('anim-begin'),
  fps: 30,
};

export const tex = new TexRenderer();

export async function setup(): Promise<void> {
  await tex.prepare([
    ...RING_LABELS, ...ALL_POLYS,
    TEX_F_TYPE, ...CONST_EXPRS,
    TEX_X_MAPSTO, TEX_Y_MAPSTO, ...ALL_RHS, ...RING_OP_EXPRS, X, Y,
    TEX_Z_MAPSTO, Z, ...ALL_RHS_3D,
    ...DUALITY_ROWS, ...DUALITY_ROWS_UNIFORM, DUALITY_CLOSING,
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

// Helper: build caption array from cue-aligned slots.
// Each entry is [cueId, text]. The caption starts at that cue and ends at the
// next entry's cue (or endCue for the last entry). Null text = no caption.
function cc(
  sceneCue: string,
  entries: [string, string | null][],
  endCue: string,
): { start: number; end: number; text: string }[] {
  const s = getCue(sceneCue);
  const result: { start: number; end: number; text: string }[] = [];
  for (let i = 0; i < entries.length; i++) {
    const [cue, text] = entries[i];
    if (text === null) continue;
    const start = getCue(cue) - s;
    const nextCue = i < entries.length - 1 ? entries[i + 1][0] : endCue;
    const end = getCue(nextCue) - s;
    result.push({ start, end, text });
  }
  return result;
}

export function buildTimeline(): SceneEntry[] {
  return [
    {
      start: getCue('scene-title'),
      draw: titleScene(),
    },
    {
      start: getCue('scene-rings'),
      draw: ringsScene({
        labels: getCue('rings-labels') - getCue('scene-rings'),
        polys: getCue('rings-polys') - getCue('scene-rings'),
      }),
      captions: cc('scene-rings', [
        ['scene-rings', "Let's talk about real polynomial rings."],
        ['rings-labels', "The elements of a polynomial ring\nare all the polynomials we can write down"],
        ['rings-polys', "over a particular set of variables,\nwith real coefficients."],
      ], 'scene-hom'),
    },
    {
      start: getCue('scene-hom'),
      draw: homomorphismScene({
        typeSig: getCue('hom-typeSig') - getCue('scene-hom'),
        constants: getCue('hom-constants') - getCue('scene-hom'),
        ringOps: getCue('hom-ringOps') - getCue('scene-hom'),
        mappings: getCue('hom-mappings') - getCue('scene-hom'),
      }),
      captions: cc('scene-hom', [
        ['scene-hom', null],
        ['hom-typeSig', "What are the nice functions\nfrom R[x,y] to R[t]?"],
        ['hom-constants', "A nice function maps constants to themselves\nand is a ring homomorphism."],
        ['hom-ringOps', "It respects all the ring operations."],
        ['hom-mappings', "The only freedom left is deciding\nwhat x and y map to — two choices."],
      ], 'scene-param'),
    },
    {
      start: getCue('scene-param'),
      draw: parametricScene({
        plotStart: getCue('param-plotStart') - getCue('scene-param'),
      }),
      captions: cc('scene-param', [
        ['scene-param', null],
        ['param-plotStart', "This is the same thing as describing\na parameterized curve in the plane."],
      ], 'scene-param3d'),
    },
    {
      start: getCue('scene-param3d'),
      draw: parametric3DScene({
        plotStart: getCue('param3d-plotStart') - getCue('scene-param3d'),
      }),
      captions: cc('scene-param3d', [
        ['scene-param3d', null],
        ['param3d-plotStart', "If we had three variables instead,\nwe'd get parameterized curves in 3D space."],
      ], 'scene-duality'),
    },
    {
      start: getCue('scene-duality'),
      draw: dualityScene({
        row2: getCue('duality-row2') - getCue('scene-duality'),
        row3: getCue('duality-row3') - getCue('scene-duality'),
        row4: getCue('duality-row4') - getCue('scene-duality'),
        row5: getCue('duality-row5') - getCue('scene-duality'),
        uniformize: getCue('duality-uniformize') - getCue('scene-duality'),
        fadeOut: getCue('duality-fadeOut') - getCue('scene-duality'),
      }),
      captions: cc('scene-duality', [
        ['scene-duality', "Maps from R[x,y] to R[t] give curves in the plane,\nand maps from R[x,y,z] to R[t] give curves in 3D."],
        ['duality-row2', "Try changing the number of variables\non both sides and see what happens."],
        ['duality-row3', "Maps from R[x,y] to just R\nare mere points in the plane."],
        ['duality-row4', "Maps from R[x,y,z] to R[t,u] are\npolynomial surfaces in 3D space."],
        ['duality-row5', "There's a general pattern happening here."],
        ['duality-uniformize', "Nice maps from n variables to p variables\ncorrespond to geometric maps from R^p to R^n."],
        ['duality-fadeOut', "The duality between algebra and geometry."],
      ], 'anim-end'),
    },
  ];
}

export let TIMELINE: SceneEntry[] = buildTimeline();

export function rebuildTimelineInPlace(): void {
  config.duration = getCue('anim-end') - getCue('anim-begin');
  TIMELINE = buildTimeline();
}

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
