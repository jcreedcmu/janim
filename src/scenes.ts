import { easeInOut, timeSlice } from './janim.js';
import { PlotRect, drawPlotAxes, drawParametricCurve, draw3DAxes, draw3DParametricCurve, createProjection } from './plot.js';
import {
  tex, FADE, TITLE, SUBTITLE,
  RING_LABELS, POLY_GROUPS,
  TEX_F_TYPE, CONST_EXPRS,
  TEX_X_MAPSTO, TEX_Y_MAPSTO, MAPPING_RHS, ALL_RHS,
  CURVES, VIEWPORT, X, Y,
  TEX_Z_MAPSTO, MAPPING_RHS_3D, Z,
  CURVES_3D, VIEWPORT_3D,
  PROJ_AZIMUTH, PROJ_ELEVATION, PROJ_DISTANCE, PROJ_ROTATION_SPEED,
  DUALITY_ROWS, DUALITY_CLOSING,
} from './example.js';

export type SceneDraw = (
  ctx: CanvasRenderingContext2D,
  localT: number,
  env: { width: number; height: number; duration: number },
) => void | Promise<void>;

async function drawTexCentered(
  ctx: CanvasRenderingContext2D, expr: string, cx: number, cy: number, scale: number,
) {
  const size = tex.measure(expr);
  const w = size.width * scale;
  const h = size.height * scale;
  await tex.draw(ctx, expr, cx - w / 2, cy - h / 2, scale);
}

export function titleScene(): SceneDraw {
  return async (ctx, localT, { width, height, duration }) => {
    const fadeIn = easeInOut(timeSlice(localT, 0, FADE));
    const fadeOut = 1 - easeInOut(timeSlice(localT, duration - FADE, duration));
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
  };
}

export function ringsScene(cues: { labels: number; polys: number }): SceneDraw {
  return async (ctx, localT, { width, height, duration }) => {
    const phaseOut = 1 - easeInOut(timeSlice(localT, duration, duration + FADE));
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

    // Ring labels appear one by one (staggered from cues.labels)
    const LABEL_APPEAR = [cues.labels, cues.labels + 0.5, cues.labels + 1, cues.labels + 1.5];
    for (let i = 0; i < RING_LABELS.length; i++) {
      const fadeIn = easeInOut(timeSlice(localT, LABEL_APPEAR[i], LABEL_APPEAR[i] + FADE));
      const alpha = fadeIn * phaseOut;
      if (alpha > 0) {
        ctx.globalAlpha = alpha;
        await drawTexCentered(ctx, RING_LABELS[i], labelCenterX[i], labelY, scale);
        ctx.globalAlpha = 1;
      }
    }

    // Example polys appear underneath (staggered from cues.polys)
    const polyScale = 2.5;
    const polyStartTimes = [cues.polys, cues.polys + 0.5, cues.polys + 1];
    for (let g = 0; g < POLY_GROUPS.length; g++) {
      const polys = POLY_GROUPS[g];
      const cx = labelCenterX[g];
      for (let j = 0; j < polys.length; j++) {
        const appearT = polyStartTimes[g] + j * 0.4;
        const fadeIn = easeInOut(timeSlice(localT, appearT, appearT + FADE));
        const alpha = fadeIn * phaseOut;
        if (alpha > 0) {
          ctx.globalAlpha = alpha;
          await drawTexCentered(ctx, polys[j], cx, labelY + 120 + j * 80, polyScale);
          ctx.globalAlpha = 1;
        }
      }
    }
  };
}

export function homomorphismScene(cues: { typeSig: number; constants: number; mappings: number }): SceneDraw {
  return async (ctx, localT, { width, height, duration }) => {
    // Type signature: fades in at cues.typeSig, fades out at duration
    const fTypeIn = easeInOut(timeSlice(localT, cues.typeSig, cues.typeSig + FADE));
    const fTypeOut = 1 - easeInOut(timeSlice(localT, duration - FADE, duration));
    const fAlpha = Math.min(fTypeIn, fTypeOut);
    if (fAlpha > 0) {
      ctx.globalAlpha = fAlpha;
      await drawTexCentered(ctx, TEX_F_TYPE, width / 2, height / 4, 4);
      ctx.globalAlpha = 1;
    }

    // Constants: f(0)=0, f(-3)=-3, f(100/7)=100/7
    if (localT >= cues.constants && localT < cues.mappings) {
      const constOut = 1 - easeInOut(timeSlice(localT, cues.mappings - 0.5, cues.mappings - 0.5 + FADE));
      const constTimes = [cues.constants + 0.2, cues.constants + 0.6, cues.constants + 1.0];
      for (let i = 0; i < CONST_EXPRS.length; i++) {
        const fadeIn = easeInOut(timeSlice(localT, constTimes[i], constTimes[i] + FADE));
        const alpha = fadeIn * constOut;
        if (alpha > 0) {
          ctx.globalAlpha = alpha;
          await drawTexCentered(ctx, CONST_EXPRS[i], width / 2, height / 2 + i * 90, 3);
          ctx.globalAlpha = 1;
        }
      }
    }

    // Mapping examples cycle (from cues.mappings to duration)
    if (localT >= cues.mappings && localT < duration + FADE) {
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
      const prefixIn = easeInOut(timeSlice(localT, cues.mappings, cues.mappings + crossFade));
      const prefixOut = 1 - easeInOut(timeSlice(localT, duration - FADE, duration));
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
        const start = cues.mappings + i * exampleDur;
        const end = start + exampleDur;

        if (localT < start || localT > end + crossFade) continue;

        const fadeIn = easeInOut(timeSlice(localT, start, start + crossFade));
        const fadeOut = (i < MAPPING_RHS.length - 1)
          ? 1 - easeInOut(timeSlice(localT, end - crossFade, end))
          : 1 - easeInOut(timeSlice(localT, duration - FADE, duration));
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
  };
}

export function parametricScene(cues: { plotStart: number }): SceneDraw {
  return async (ctx, localT, { width, height, duration }) => {
    const sectionIn = easeInOut(timeSlice(localT, cues.plotStart, cues.plotStart + FADE));
    const sectionOut = 1 - easeInOut(timeSlice(localT, duration - FADE, duration));
    const sectionAlpha = Math.min(sectionIn, sectionOut);

    if (sectionAlpha > 0) {
      ctx.globalAlpha = sectionAlpha;

      // Left side: formulas (~40% of width)
      const mapScale = 2.5;
      const crossFade = 0.3;
      const exampleDur = 2.5;
      const rhsGap = 15;

      const xPrefixM = tex.measure(TEX_X_MAPSTO);
      const yPrefixM = tex.measure(TEX_Y_MAPSTO);
      const prefixW = Math.max(xPrefixM.width, yPrefixM.width) * mapScale;

      const leftMargin = 400;
      const leftX = leftMargin;
      const rhsX = leftX + prefixW + rhsGap;

      const xBaselineY = height / 2;
      const yBaselineY = height / 2 + 80;

      // Draw persistent prefixes
      await tex.draw(ctx, TEX_X_MAPSTO, leftX, xBaselineY - xPrefixM.baseline * mapScale, mapScale);
      await tex.draw(ctx, TEX_Y_MAPSTO, leftX, yBaselineY - yPrefixM.baseline * mapScale, mapScale);

      // Right side: plot area (~55% of width)
      const plotSize = 450;
      const plotRect: PlotRect = {
        x: width * 0.48,
        y: (height - plotSize) / 2,
        w: plotSize * 1.3,
        h: plotSize,
      };

      // Draw axes at section alpha (consistent, not affected by per-curve crossfade)
      ctx.globalAlpha = sectionAlpha;
      await drawPlotAxes(ctx, plotRect, VIEWPORT, tex, X, Y);

      // Cycling through curves
      for (let i = 0; i < MAPPING_RHS.length; i++) {
        const [xRhs, yRhs] = MAPPING_RHS[i];
        const start = cues.plotStart + i * exampleDur;
        const end = start + exampleDur;

        if (localT < start || localT > end + crossFade) continue;

        const fadeIn = easeInOut(timeSlice(localT, start, start + crossFade));
        const fadeOut = (i < MAPPING_RHS.length - 1)
          ? 1 - easeInOut(timeSlice(localT, end - crossFade, end))
          : 1 - easeInOut(timeSlice(localT, duration - FADE, duration));
        const alpha = Math.min(fadeIn, fadeOut) * sectionAlpha;

        if (alpha > 0) {
          ctx.globalAlpha = alpha;

          // Draw RHS formulas
          const xM = tex.measure(xRhs);
          const yM = tex.measure(yRhs);
          await tex.draw(ctx, xRhs, rhsX, xBaselineY - xM.baseline * mapScale, mapScale);
          await tex.draw(ctx, yRhs, rhsX, yBaselineY - yM.baseline * mapScale, mapScale);

          // Draw curve
          drawParametricCurve(ctx, CURVES[i], plotRect, VIEWPORT);
        }
      }

      ctx.globalAlpha = 1;
    }
  };
}

export function parametric3DScene(cues: { plotStart: number }): SceneDraw {
  return async (ctx, localT, { width, height, duration }) => {
    const sectionIn = easeInOut(timeSlice(localT, cues.plotStart, cues.plotStart + FADE));
    const sectionOut = 1 - easeInOut(timeSlice(localT, duration - FADE, duration));
    const sectionAlpha = Math.min(sectionIn, sectionOut);

    if (sectionAlpha > 0) {
      ctx.globalAlpha = sectionAlpha;

      // Left side: formulas
      const mapScale = 2.5;
      const crossFade = 0.3;
      const exampleDur = 2.5;
      const rhsGap = 15;

      const xPrefixM = tex.measure(TEX_X_MAPSTO);
      const yPrefixM = tex.measure(TEX_Y_MAPSTO);
      const zPrefixM = tex.measure(TEX_Z_MAPSTO);
      const prefixW = Math.max(xPrefixM.width, yPrefixM.width, zPrefixM.width) * mapScale;

      const leftMargin = 650;
      const leftX = leftMargin;
      const rhsX = leftX + prefixW + rhsGap;

      // Three rows centered vertically, ~70px apart
      const rowGap = 70;
      const centerY = height / 2;
      const xBaselineY = centerY - rowGap;
      const yBaselineY = centerY;
      const zBaselineY = centerY + rowGap;

      // Draw persistent prefixes
      await tex.draw(ctx, TEX_X_MAPSTO, leftX, xBaselineY - xPrefixM.baseline * mapScale, mapScale);
      await tex.draw(ctx, TEX_Y_MAPSTO, leftX, yBaselineY - yPrefixM.baseline * mapScale, mapScale);
      await tex.draw(ctx, TEX_Z_MAPSTO, leftX, zBaselineY - zPrefixM.baseline * mapScale, mapScale);

      // Right side: 3D plot area
      const plotSize = 450;
      const plotRect: PlotRect = {
        x: width * 0.48,
        y: (height - plotSize) / 2,
        w: plotSize * 1.3,
        h: plotSize,
      };

      // Per-frame projection with animated azimuth rotation
      const proj = createProjection(
        PROJ_AZIMUTH + PROJ_ROTATION_SPEED * localT,
        PROJ_ELEVATION,
        PROJ_DISTANCE,
      );

      // Draw 3D axes
      ctx.globalAlpha = sectionAlpha;
      await draw3DAxes(ctx, plotRect, VIEWPORT_3D, proj, tex, X, Y, Z);

      // Cycling through curves
      for (let i = 0; i < MAPPING_RHS_3D.length; i++) {
        const [xRhs, yRhs, zRhs] = MAPPING_RHS_3D[i];
        const start = cues.plotStart + i * exampleDur;
        const end = start + exampleDur;

        if (localT < start || localT > end + crossFade) continue;

        const fadeIn = easeInOut(timeSlice(localT, start, start + crossFade));
        const fadeOut = (i < MAPPING_RHS_3D.length - 1)
          ? 1 - easeInOut(timeSlice(localT, end - crossFade, end))
          : 1 - easeInOut(timeSlice(localT, duration - FADE, duration));
        const alpha = Math.min(fadeIn, fadeOut) * sectionAlpha;

        if (alpha > 0) {
          ctx.globalAlpha = alpha;

          // Draw RHS formulas
          const xM = tex.measure(xRhs);
          const yM = tex.measure(yRhs);
          const zM = tex.measure(zRhs);
          await tex.draw(ctx, xRhs, rhsX, xBaselineY - xM.baseline * mapScale, mapScale);
          await tex.draw(ctx, yRhs, rhsX, yBaselineY - yM.baseline * mapScale, mapScale);
          await tex.draw(ctx, zRhs, rhsX, zBaselineY - zM.baseline * mapScale, mapScale);

          // Draw 3D curve
          draw3DParametricCurve(ctx, CURVES_3D[i], plotRect, VIEWPORT_3D, proj);
        }
      }

      ctx.globalAlpha = 1;
    }
  };
}

export function dualityScene(): SceneDraw {
  return async (ctx, localT, { width, height, duration }) => {
    const sectionOut = 1 - easeInOut(timeSlice(localT, duration - FADE, duration));
    const rowScale = 2.8;
    const rowGap = 100;
    const rowAppear = [0, 5, 13]; // when each table row fades in
    const tableFadeOut = 17; // when the whole table fades out

    // Progressive table of correspondences
    const tableOut = 1 - easeInOut(timeSlice(localT, tableFadeOut - 0.3, tableFadeOut));
    for (let i = 0; i < DUALITY_ROWS.length; i++) {
      if (localT < rowAppear[i]) continue;
      const fadeIn = easeInOut(timeSlice(localT, rowAppear[i], rowAppear[i] + 0.3));
      const alpha = Math.min(fadeIn, tableOut);
      if (alpha <= 0) continue;

      ctx.globalAlpha = alpha;
      const cy = height / 2 + (i - 1) * rowGap;
      await drawTexCentered(ctx, DUALITY_ROWS[i], width / 2, cy, rowScale);
      ctx.globalAlpha = 1;
    }

    // Closing beat: "algebra ↔ geometry"
    if (localT >= tableFadeOut - 0.3) {
      const fadeIn = easeInOut(timeSlice(localT, tableFadeOut, tableFadeOut + 0.3));
      const alpha = Math.min(fadeIn, sectionOut);
      if (alpha > 0) {
        ctx.globalAlpha = alpha;
        await drawTexCentered(ctx, DUALITY_CLOSING, width / 2, height / 2, 4.5);
        ctx.globalAlpha = 1;
      }
    }
  };
}
