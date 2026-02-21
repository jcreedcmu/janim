import { AnimationConfig, AnimationFn, TexRenderer, palette, lerp, easeInOut, timeSlice } from './janim.js';

const TEX_EMC2 = 'E = mc^2';
const TEX_INTEGRAL = '\\int_0^\\infty e^{-x}\\, dx = 1';

export const config: AnimationConfig = {
  width: 1920,
  height: 1080,
  duration: 5,
  fps: 30,
};

export const tex = new TexRenderer();

export async function setup(): Promise<void> {
  await tex.prepare([TEX_EMC2, TEX_INTEGRAL]);
}

export const animate: AnimationFn = async (ctx, t) => {
  const { width, height } = config;

  ctx.fillStyle = '#faf5e7';
  ctx.fillRect(0, 0, width, height);

  // --- Color blobs ---
  const cols = 4;
  const rows = 3;
  const blobR = 40;
  const spacingX = width / (cols + 1);
  const spacingY = height / (rows + 1);
  for (let i = 0; i < palette.length; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = spacingX * (col + 1);
    const cy = spacingY * (row + 1);
    ctx.fillStyle = palette[i];
    ctx.beginPath();
    ctx.arc(cx, cy, blobR, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Phase 1: Fade in E = mc^2 (0–1s) ---
  const p1 = easeInOut(timeSlice(t, 0, 1));
  if (p1 > 0) {
    ctx.globalAlpha = p1;
    const scale = lerp(1.5, 3, p1);
    const size = tex.measure(TEX_EMC2);
    const w = size.width * scale;
    const h = size.height * scale;
    await tex.draw(ctx, TEX_EMC2, (width - w) / 2, (height - h) / 2 - 60, scale);
    ctx.globalAlpha = 1;
  }

  // --- Phase 2: Bezier curve growing (1–3s) ---
  const p2 = easeInOut(timeSlice(t, 1, 3));
  if (p2 > 0) {
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(80, height - 100);

    // Draw a partial bezier — use subpath via splitting parameter
    const endX = lerp(80, width - 80, p2);
    const cp1x = lerp(80, 300, p2);
    const cp1y = 100;
    const cp2x = lerp(80, width - 300, p2);
    const cp2y = height - 50;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, height - 100);
    ctx.stroke();
  }

  // --- Phase 3: Slide in integral formula (3–4.5s) ---
  const p3 = easeInOut(timeSlice(t, 3, 4.5));
  if (p3 > 0) {
    ctx.globalAlpha = p3;
    const scale = 2.5;
    const size = tex.measure(TEX_INTEGRAL);
    const w = size.width * scale;
    const h = size.height * scale;
    const targetX = (width - w) / 2;
    const startX = width + 20;
    const x = lerp(startX, targetX, p3);
    await tex.draw(ctx, TEX_INTEGRAL, x, (height - h) / 2 + 80, scale);
    ctx.globalAlpha = 1;
  }
};
