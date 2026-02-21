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
