import { easeInOut, easeOutBack, lerp, timeSlice } from './janim.js';
import { PlotRect, drawPlotAxes, drawParametricCurve, draw3DAxes, draw3DParametricCurve, createProjection } from './plot.js';
import {
  tex, FADE, TITLE, SUBTITLE,
  RING_LABELS, POLY_GROUPS,
  TEX_F_TYPE, CONST_EXPRS,
  TEX_X_MAPSTO, TEX_Y_MAPSTO, MAPPING_RHS, ALL_RHS, RING_OP_EXPRS,
  CURVES, VIEWPORT, X, Y,
  TEX_Z_MAPSTO, MAPPING_RHS_3D, Z,
  CURVES_3D, VIEWPORT_3D,
  PROJ_AZIMUTH, PROJ_ELEVATION, PROJ_DISTANCE, PROJ_ROTATION_SPEED,
  DUALITY_ROWS, DUALITY_ROWS_UNIFORM, DUALITY_CLOSING,
  N_COLOR, P_COLOR,
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
      ctx.font = '36px Roboto, sans-serif';
      ctx.fillText('(Episode 1)', width / 2, height / 2 + 100);
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

export function homomorphismScene(cues: { typeSig: number; constants: number; ringOps: number; mappings: number }): SceneDraw {
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
    // At ringOps cue, they slide left; ring-op examples appear on right
    if (localT >= cues.constants && localT < cues.mappings) {
      const constOut = 1 - easeInOut(timeSlice(localT, cues.mappings - 0.5, cues.mappings - 0.5 + FADE));
      const constTimes = [cues.constants + 0.2, cues.constants + 0.6, cues.constants + 1.0];

      // Slide constants left at ringOps cue
      const slideT = easeOutBack(timeSlice(localT, cues.ringOps, cues.ringOps + 0.5));
      const constCenterX = lerp(width / 2, width * 0.3, slideT);

      for (let i = 0; i < CONST_EXPRS.length; i++) {
        const fadeIn = easeInOut(timeSlice(localT, constTimes[i], constTimes[i] + FADE));
        const alpha = fadeIn * constOut;
        if (alpha > 0) {
          ctx.globalAlpha = alpha;
          await drawTexCentered(ctx, CONST_EXPRS[i], constCenterX, height / 2 + i * 90, 3);
          ctx.globalAlpha = 1;
        }
      }

      // Ring-op expressions on the right
      if (localT >= cues.ringOps) {
        const opsScale = 2.5;
        for (let i = 0; i < RING_OP_EXPRS.length; i++) {
          const opStart = cues.ringOps + 0.5 + i * 0.3;
          const opFadeIn = easeInOut(timeSlice(localT, opStart, opStart + FADE));
          const alpha = opFadeIn * constOut;
          if (alpha > 0) {
            ctx.globalAlpha = alpha;
            await drawTexCentered(ctx, RING_OP_EXPRS[i], width * 0.7, height / 2 + i * 90, opsScale);
            ctx.globalAlpha = 1;
          }
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
      // Stop drawing at duration — the param scene takes over seamlessly
      const prefixIn = easeInOut(timeSlice(localT, cues.mappings, cues.mappings + crossFade));
      if (prefixIn > 0 && localT < duration) {
        ctx.globalAlpha = prefixIn;
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
    const sectionOut = 1 - easeInOut(timeSlice(localT, duration - FADE, duration));

    // --- Prefix block: slides from hom-scene center to param-scene left ---
    const crossFade = 0.3;
    const exampleDur = 2.5;

    // Hom-scene layout (start position)
    const homScale = 3.5;
    const homRhsGap = 20;
    const homXPrefixM = tex.measure(TEX_X_MAPSTO);
    const homYPrefixM = tex.measure(TEX_Y_MAPSTO);
    const homPrefixW = Math.max(homXPrefixM.width, homYPrefixM.width) * homScale;
    const homMaxRhsW = Math.max(...ALL_RHS.map(e => tex.measure(e).width * homScale));
    const homTotalW = homPrefixW + homRhsGap + homMaxRhsW;
    const homLeftX = (width - homTotalW) / 2;
    const homRowGap = 100;

    // Param-scene layout (end position)
    const paramScale = 2.5;
    const paramRhsGap = 15;
    const paramLeftX = 400;
    const paramRowGap = 80;

    // Animate from hom layout to param layout
    const slideT = easeOutBack(timeSlice(localT, 0, cues.plotStart));
    const curScale = lerp(homScale, paramScale, slideT);
    const curLeftX = lerp(homLeftX, paramLeftX, slideT);
    const curRowGap = lerp(homRowGap, paramRowGap, slideT);
    const curRhsGap = lerp(homRhsGap, paramRhsGap, slideT);

    const xPrefixM = tex.measure(TEX_X_MAPSTO);
    const yPrefixM = tex.measure(TEX_Y_MAPSTO);
    const prefixW = Math.max(xPrefixM.width, yPrefixM.width) * curScale;
    const rhsX = curLeftX + prefixW + curRhsGap;

    const xBaselineY = height / 2;
    const yBaselineY = height / 2 + curRowGap;

    // Draw persistent prefixes (no fade-in, they persist from hom scene)
    ctx.globalAlpha = sectionOut;
    await tex.draw(ctx, TEX_X_MAPSTO, curLeftX, xBaselineY - xPrefixM.baseline * curScale, curScale);
    await tex.draw(ctx, TEX_Y_MAPSTO, curLeftX, yBaselineY - yPrefixM.baseline * curScale, curScale);
    ctx.globalAlpha = 1;

    // --- Plot area: fades in at plotStart ---
    const plotIn = easeInOut(timeSlice(localT, cues.plotStart, cues.plotStart + FADE));
    const plotAlpha = Math.min(plotIn, sectionOut);

    if (plotAlpha > 0) {
      const plotSize = 450;
      const plotRect: PlotRect = {
        x: width * 0.48,
        y: (height - plotSize) / 2,
        w: plotSize * 1.3,
        h: plotSize,
      };

      ctx.globalAlpha = plotAlpha;
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
        const alpha = Math.min(fadeIn, fadeOut) * plotAlpha;

        if (alpha > 0) {
          ctx.globalAlpha = alpha;

          // Draw RHS formulas
          const xM = tex.measure(xRhs);
          const yM = tex.measure(yRhs);
          await tex.draw(ctx, xRhs, rhsX, xBaselineY - xM.baseline * curScale, curScale);
          await tex.draw(ctx, yRhs, rhsX, yBaselineY - yM.baseline * curScale, curScale);

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

function drawBezierArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  color: string,
  bulge: number,
) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2 + bulge;

  // Two quadratic segments: vertical endpoints, horizontal at the bulge midpoint
  // Segment 1: (x1,y1) → (midX,midY), control (x1, midY)
  // Segment 2: (midX,midY) → (x2,y2), control (x2, midY)
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(x1, midY, midX, midY);
  ctx.quadraticCurveTo(x2, midY, x2, y2);
  ctx.stroke();

  // Arrowheads — tangent is vertical at both endpoints, so triangles are simple
  const arrowLen = 14;
  const arrowW = 8; // half-width of arrowhead base
  ctx.fillStyle = color;

  // Destination arrowhead: curve arrives from bulge side, tip points away
  const dDir = y2 > midY ? 1 : -1; // direction from midpoint toward endpoint
  ctx.beginPath();
  ctx.moveTo(x2, y2 + dDir * arrowLen); // tip, beyond endpoint
  ctx.lineTo(x2 - arrowW, y2);          // base left
  ctx.lineTo(x2 + arrowW, y2);          // base right
  ctx.closePath();
  ctx.fill();

  // Source arrowhead: curve arrives from bulge side, tip points away
  const sDir = y1 > midY ? 1 : -1;
  ctx.beginPath();
  ctx.moveTo(x1, y1 + sDir * arrowLen); // tip, beyond endpoint
  ctx.lineTo(x1 - arrowW, y1);          // base left
  ctx.lineTo(x1 + arrowW, y1);          // base right
  ctx.closePath();
  ctx.fill();
}

export function dualityScene(cues: { row2: number; row3: number; row4: number; uniformize: number; row5: number; fadeOut: number }): SceneDraw {
  return async (ctx, localT, { width, height, duration }) => {
    const sectionOut = 1 - easeInOut(timeSlice(localT, duration - FADE, duration));
    const rowScale = 2.8;
    const rowGap = 100;
    const rowAppear = [0, cues.row2, cues.row3, cues.row4, cues.row5];
    const tableFadeOut = cues.fadeOut;
    const uniformizeDur = 0.5;

    const tableOut = 1 - easeInOut(timeSlice(localT, tableFadeOut - 0.3, tableFadeOut));

    // Progressive table of correspondences, aligned on the \longleftrightarrow
    for (let i = 0; i < DUALITY_ROWS.length; i++) {
      if (localT < rowAppear[i]) continue;
      const fadeIn = easeInOut(timeSlice(localT, rowAppear[i], rowAppear[i] + 0.3));

      const cy = height / 2 + (i - 2) * rowGap;

      // Crossfade from original to uniform version (rows 0-3 only; row 4 is already general)
      const uniformT = i < 4 ? easeInOut(timeSlice(localT, cues.uniformize, cues.uniformize + uniformizeDur)) : 0;

      // Draw original row (fading out during uniformize)
      const origAlpha = Math.min(fadeIn, tableOut) * (1 - uniformT);
      if (origAlpha > 0) {
        ctx.globalAlpha = origAlpha;
        const expr = DUALITY_ROWS[i];
        const size = tex.measure(expr);
        const arrMarker = tex.markerPositions(expr, ['arr']).get('arr');
        const arrowOffsetX = arrMarker ? arrMarker.x * rowScale : (size.width * rowScale) / 2;
        const contentLeft = width / 2 - arrowOffsetX;
        const contentTop = cy - (size.height * rowScale) / 2;
        await tex.draw(ctx, expr, contentLeft, contentTop, rowScale);
      }

      // Draw uniform row (fading in during uniformize)
      if (uniformT > 0 && i < 4) {
        const uAlpha = Math.min(fadeIn, tableOut) * uniformT;
        if (uAlpha > 0) {
          ctx.globalAlpha = uAlpha;
          const uExpr = DUALITY_ROWS_UNIFORM[i];
          const uSize = tex.measure(uExpr);
          const uArrMarker = tex.markerPositions(uExpr, ['arr']).get('arr');
          const uArrowOffsetX = uArrMarker ? uArrMarker.x * rowScale : (uSize.width * rowScale) / 2;
          const uContentLeft = width / 2 - uArrowOffsetX;
          const uContentTop = cy - (uSize.height * rowScale) / 2;
          await tex.draw(ctx, uExpr, uContentLeft, uContentTop, rowScale);
        }
      }

      // Bezier arrows on the general row (row 4) linking matching n's and p's
      if (i === 4) {
        const alpha = Math.min(fadeIn, tableOut);
        if (alpha > 0) {
          ctx.globalAlpha = alpha;
          const expr = DUALITY_ROWS[i];
          const size = tex.measure(expr);
          const arrMarker = tex.markerPositions(expr, ['arr']).get('arr');
          const arrowOffsetX = arrMarker ? arrMarker.x * rowScale : (size.width * rowScale) / 2;
          const contentLeft = width / 2 - arrowOffsetX;
          const contentTop = cy - (size.height * rowScale) / 2;

          const markers = tex.markerPositions(expr, ['n1', 'p1', 'p2', 'n2']);

          const toCanvas = (id: string) => {
            const m = markers.get(id)!;
            return { x: contentLeft + m.x * rowScale, y: contentTop + m.y * rowScale };
          };

          const NUDGEX = 10;
          const NUDGEY = 25;
          if (markers.has('n1') && markers.has('n2')) {
            const a = toCanvas('n1'), b = toCanvas('n2');
            drawBezierArrow(ctx, a.x + NUDGEX, a.y + NUDGEY, b.x + NUDGEX, b.y + NUDGEY, N_COLOR, 200);
          }
          if (markers.has('p1') && markers.has('p2')) {
            const a = toCanvas('p1'), b = toCanvas('p2');
            drawBezierArrow(ctx, a.x + NUDGEX, a.y + NUDGEY, b.x + NUDGEX, b.y + NUDGEY, P_COLOR, 100);
          }
        }
      }

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
