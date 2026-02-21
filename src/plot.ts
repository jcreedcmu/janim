import { TexRenderer } from './janim.js';

export interface PlotRect { x: number; y: number; w: number; h: number }

export interface CurveDef {
  xFn: (t: number) => number;
  yFn: (t: number) => number;
  tRange: [number, number];
}

export interface Viewport {
  minX: number; maxX: number; minY: number; maxY: number;
}

export function computeFixedViewport(curves: CurveDef[]): Viewport {
  const N = 200;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const { xFn, yFn, tRange } of curves) {
    for (let i = 0; i <= N; i++) {
      const t = tRange[0] + (tRange[1] - tRange[0]) * (i / N);
      const x = xFn(t), y = yFn(t);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX - minX < 0.01) { minX -= 1; maxX += 1; }
  if (maxY - minY < 0.01) { minY -= 1; maxY += 1; }
  const mx = (maxX - minX) * 0.15;
  const my = (maxY - minY) * 0.15;
  return { minX: minX - mx, maxX: maxX + mx, minY: minY - my, maxY: maxY + my };
}

export function plotToCanvas(plotRect: PlotRect, viewport: Viewport) {
  const { minX, maxX, minY, maxY } = viewport;
  return {
    toCanvasX: (v: number) => plotRect.x + ((v - minX) / (maxX - minX)) * plotRect.w,
    toCanvasY: (v: number) => plotRect.y + plotRect.h - ((v - minY) / (maxY - minY)) * plotRect.h,
  };
}

export async function drawPlotAxes(
  ctx: CanvasRenderingContext2D,
  plotRect: PlotRect,
  viewport: Viewport,
  texRenderer: TexRenderer,
  xLabel: string,
  yLabel: string,
) {
  const { minX, maxX, minY, maxY } = viewport;
  const { toCanvasX, toCanvasY } = plotToCanvas(plotRect, viewport);

  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1.5;
  if (minY <= 0 && maxY >= 0) {
    const y0 = toCanvasY(0);
    ctx.beginPath();
    ctx.moveTo(plotRect.x, y0);
    ctx.lineTo(plotRect.x + plotRect.w, y0);
    ctx.stroke();
  }
  if (minX <= 0 && maxX >= 0) {
    const x0 = toCanvasX(0);
    ctx.beginPath();
    ctx.moveTo(x0, plotRect.y);
    ctx.lineTo(x0, plotRect.y + plotRect.h);
    ctx.stroke();
  }

  const labelScale = 2.5;
  if (minY <= 0 && maxY >= 0) {
    const y0 = toCanvasY(0);
    const xm = texRenderer.measure(xLabel);
    await texRenderer.draw(ctx, xLabel, plotRect.x + plotRect.w - xm.width * labelScale - 8, y0 - xm.height * labelScale - 4, labelScale);
  }
  if (minX <= 0 && maxX >= 0) {
    const x0 = toCanvasX(0);
    await texRenderer.draw(ctx, yLabel, x0 + 6, plotRect.y + 4, labelScale);
  }
}

// ---------------------------------------------------------------------------
// 3D utilities
// ---------------------------------------------------------------------------

export interface CurveDef3D {
  xFn: (t: number) => number;
  yFn: (t: number) => number;
  zFn: (t: number) => number;
  tRange: [number, number];
}

export interface Projection3D {
  project(x: number, y: number, z: number): [number, number];
}

export function createProjection(azimuth: number, elevation: number, distance: number): Projection3D {
  const ca = Math.cos(azimuth), sa = Math.sin(azimuth);
  const ce = Math.cos(elevation), se = Math.sin(elevation);
  return {
    project(x: number, y: number, z: number): [number, number] {
      // Rotate around Z by azimuth
      const x1 = ca * x + sa * y;
      const y1 = -sa * x + ca * y;
      // Rotate around X by elevation
      const x2 = x1;
      const y2 = ce * y1 + se * z;
      const z2 = -se * y1 + ce * z;
      // Perspective division (z2 > 0 = closer to camera = larger)
      const scale = distance / (distance - z2);
      return [x2 * scale, y2 * scale];
    },
  };
}

export function computeFixedViewport3D(curves: CurveDef3D[], projection: Projection3D): Viewport {
  const N = 200;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  function include(px: number, py: number) {
    if (px < minX) minX = px;
    if (px > maxX) maxX = px;
    if (py < minY) minY = py;
    if (py > maxY) maxY = py;
  }

  // Sample all curves
  for (const { xFn, yFn, zFn, tRange } of curves) {
    for (let i = 0; i <= N; i++) {
      const t = tRange[0] + (tRange[1] - tRange[0]) * (i / N);
      const [px, py] = projection.project(xFn(t), yFn(t), zFn(t));
      include(px, py);
    }
  }

  // Include projected axis endpoints
  const axisLen = 6;
  for (const [ax, ay, az] of [[axisLen, 0, 0], [-axisLen, 0, 0], [0, axisLen, 0], [0, -axisLen, 0], [0, 0, axisLen], [0, 0, -axisLen]] as [number, number, number][]) {
    const [px, py] = projection.project(ax, ay, az);
    include(px, py);
  }

  if (maxX - minX < 0.01) { minX -= 1; maxX += 1; }
  if (maxY - minY < 0.01) { minY -= 1; maxY += 1; }
  const mx = (maxX - minX) * 0.15;
  const my = (maxY - minY) * 0.15;
  return { minX: minX - mx, maxX: maxX + mx, minY: minY - my, maxY: maxY + my };
}

export async function draw3DAxes(
  ctx: CanvasRenderingContext2D,
  plotRect: PlotRect,
  viewport: Viewport,
  projection: Projection3D,
  texRenderer: TexRenderer,
  xLabel: string,
  yLabel: string,
  zLabel: string,
) {
  const { toCanvasX, toCanvasY } = plotToCanvas(plotRect, viewport);
  const [ox, oy] = projection.project(0, 0, 0);

  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1.5;

  const axisLen = 6;
  const axes: [number, number, number][] = [[axisLen, 0, 0], [0, axisLen, 0], [0, 0, axisLen]];
  const labels = [xLabel, yLabel, zLabel];
  const labelScale = 2.5;

  for (let i = 0; i < 3; i++) {
    const [px, py] = projection.project(...axes[i]);
    ctx.beginPath();
    ctx.moveTo(toCanvasX(ox), toCanvasY(oy));
    ctx.lineTo(toCanvasX(px), toCanvasY(py));
    ctx.stroke();

    const m = texRenderer.measure(labels[i]);
    const cx = toCanvasX(px);
    const cy = toCanvasY(py);
    await texRenderer.draw(ctx, labels[i], cx - m.width * labelScale / 2, cy - m.height * labelScale - 6, labelScale);
  }
}

export function draw3DParametricCurve(
  ctx: CanvasRenderingContext2D,
  curve: CurveDef3D,
  plotRect: PlotRect,
  viewport: Viewport,
  projection: Projection3D,
) {
  const { xFn, yFn, zFn, tRange } = curve;
  const N = 200;
  const STRUT_INTERVAL = 10; // draw a vertical strut every this many samples
  const { toCanvasX, toCanvasY } = plotToCanvas(plotRect, viewport);

  // Shadow: project curve onto xy plane (z=0)
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const t = tRange[0] + (tRange[1] - tRange[0]) * (i / N);
    const [sx, sy] = projection.project(xFn(t), yFn(t), 0);
    const cx = toCanvasX(sx);
    const cy = toCanvasY(sy);
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  }
  ctx.stroke();

  // Vertical struts from curve to shadow
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 1;
  for (let i = 0; i <= N; i += STRUT_INTERVAL) {
    const t = tRange[0] + (tRange[1] - tRange[0]) * (i / N);
    const x = xFn(t), y = yFn(t), z = zFn(t);
    const [px, py] = projection.project(x, y, z);
    const [sx, sy] = projection.project(x, y, 0);
    ctx.beginPath();
    ctx.moveTo(toCanvasX(px), toCanvasY(py));
    ctx.lineTo(toCanvasX(sx), toCanvasY(sy));
    ctx.stroke();
  }

  // Main curve
  ctx.strokeStyle = '#3e8aff';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const t = tRange[0] + (tRange[1] - tRange[0]) * (i / N);
    const [px, py] = projection.project(xFn(t), yFn(t), zFn(t));
    const cx = toCanvasX(px);
    const cy = toCanvasY(py);
    if (i === 0) ctx.moveTo(cx, cy);
    else ctx.lineTo(cx, cy);
  }
  ctx.stroke();
}

export function drawParametricCurve(
  ctx: CanvasRenderingContext2D,
  curve: CurveDef,
  plotRect: PlotRect,
  viewport: Viewport,
) {
  const { xFn, yFn, tRange } = curve;
  const N = 200;
  const { toCanvasX, toCanvasY } = plotToCanvas(plotRect, viewport);

  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i <= N; i++) {
    const t = tRange[0] + (tRange[1] - tRange[0]) * (i / N);
    xs.push(xFn(t));
    ys.push(yFn(t));
  }

  ctx.strokeStyle = '#3e8aff';
  ctx.lineWidth = 3;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(toCanvasX(xs[0]), toCanvasY(ys[0]));
  for (let i = 1; i <= N; i++) {
    ctx.lineTo(toCanvasX(xs[i]), toCanvasY(ys[i]));
  }
  ctx.stroke();
}
