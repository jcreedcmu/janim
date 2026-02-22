/// <reference types="vite/client" />
import { runInBrowser, AnimationController } from './janim.js';
import { config, setup, animate, rebuildTimelineInPlace, setCaptionsRaw } from './example.js';
import { CUE_DEFS, getCue, setCue } from './cues.js';
import captionsRaw from '../CAPTIONS?raw';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const playPauseBtn = document.getElementById('play-pause') as HTMLButtonElement;
const restartBtn = document.getElementById('restart') as HTMLButtonElement;
const waveformCanvas = document.getElementById('waveform') as HTMLCanvasElement;
const timeDisplay = document.getElementById('time-display') as HTMLSpanElement;
const audio = document.getElementById('audio') as HTMLAudioElement;

let ctrl: AnimationController;

// --- Waveform data ---
const WAVEFORM_BUCKETS = 3000;
type Peaks = { min: Float32Array; max: Float32Array };
let peaks: Peaks | null = null;
let audioDuration = config.duration; // will be updated once audio is decoded

function computePeaks(channelData: Float32Array, sampleRate: number): Peaks {
  const totalSamples = channelData.length;
  const samplesPerBucket = totalSamples / WAVEFORM_BUCKETS;
  const minArr = new Float32Array(WAVEFORM_BUCKETS);
  const maxArr = new Float32Array(WAVEFORM_BUCKETS);
  for (let i = 0; i < WAVEFORM_BUCKETS; i++) {
    const start = Math.floor(i * samplesPerBucket);
    const end = Math.min(Math.floor((i + 1) * samplesPerBucket), totalSamples);
    let lo = 1, hi = -1;
    for (let j = start; j < end; j++) {
      const s = channelData[j];
      if (s < lo) lo = s;
      if (s > hi) hi = s;
    }
    minArr[i] = lo;
    maxArr[i] = hi;
  }
  return { min: minArr, max: maxArr };
}

// Visible time window (in seconds)
let viewStart = 0;
let viewEnd = config.duration;

function timeToX(t: number, w: number): number {
  return ((t - viewStart) / (viewEnd - viewStart)) * w;
}

function xToTime(px: number, w: number): number {
  return viewStart + (px / w) * (viewEnd - viewStart);
}

// --- Cue marker rendering ---
const BUBBLE_FONT_SIZE = 9;
const BUBBLE_H = 25;
const BUBBLE_PAD = 8;
const BUBBLE_R = 8;
const SCENE_CUE_COLOR = 'rgb(255, 220, 100)';
const SUB_CUE_COLOR = 'rgb(140, 200, 255)';
const ANIM_CUE_COLOR = 'rgb(255, 120, 120)';
const CUE_LINE_COLOR_SCENE = 'rgb(255, 220, 100)';
const CUE_LINE_COLOR_SUB = 'rgb(140, 200, 255)';
const CUE_LINE_COLOR_ANIM = 'rgb(255, 120, 120)';

function cueCategory(id: string): 'anim' | 'scene' | 'sub' {
  if (id.startsWith('anim-')) return 'anim';
  if (id.startsWith('scene-')) return 'scene';
  return 'sub';
}

const BUBBLE_ANGLE = -Math.PI / 4; // -45 degrees (up and to the right)
const BUBBLE_NUDGE = 7; // CSS pixels: shift bubble right along its rotated axis
const BUBBLE_TOP_MARGIN = 70; // CSS pixels: where cue line pivots sit
const WAVEFORM_TOP_MARGIN = 20; // CSS pixels: where waveform bars start

function drawCueMarkers(ctx: CanvasRenderingContext2D, w: number, h: number, topMargin: number, dpr: number) {
  ctx.font = `${BUBBLE_FONT_SIZE * dpr}px system-ui, sans-serif`;
  const bubbleH = BUBBLE_H * dpr;
  const bubblePad = BUBBLE_PAD * dpr;
  const bubbleR = BUBBLE_R * dpr;

  for (const cue of CUE_DEFS) {
    const t = getCue(cue.id);
    const x = timeToX(t, w);
    if (x < -100 * dpr || x > w + 100 * dpr) continue;

    const cat = cueCategory(cue.id);
    const lineColor = cat === 'anim' ? CUE_LINE_COLOR_ANIM : cat === 'scene' ? CUE_LINE_COLOR_SCENE : CUE_LINE_COLOR_SUB;
    const bubbleColor = cat === 'anim' ? ANIM_CUE_COLOR : cat === 'scene' ? SCENE_CUE_COLOR : SUB_CUE_COLOR;

    // Vertical stem
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3 * dpr;
    ctx.beginPath();
    ctx.moveTo(x, topMargin - 20 * dpr);
    ctx.lineTo(x, h);
    ctx.stroke();

    // Rotated bubble: pivot at (x, topMargin), rotated up-right
    ctx.save();
    ctx.translate(x, topMargin);
    ctx.rotate(BUBBLE_ANGLE);

    const textW = ctx.measureText(cue.label).width;
    const bw = textW + bubblePad * 2;

    const bx = BUBBLE_NUDGE * dpr;
    const by = -bubbleH - bubblePad;

    ctx.fillStyle = bubbleColor;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bubbleH, bubbleR);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(cue.label, bx + bubblePad, by + bubbleH / 2);

    ctx.restore();
  }
}

function drawWaveform(peaks: Peaks, cvs: HTMLCanvasElement, currentT: number, animDuration: number, dpr: number) {
  const ctx = cvs.getContext('2d')!;
  const w = cvs.width;
  const h = cvs.height;
  const bubbleMargin = BUBBLE_TOP_MARGIN * dpr;
  const waveTop = WAVEFORM_TOP_MARGIN * dpr;
  const waveH = h - waveTop;
  ctx.fillStyle = '#f0ece4';
  ctx.fillRect(0, 0, w, h);

  const playheadX = timeToX(currentT, w);
  const buckets = peaks.min.length;

  // Draw one bar per pixel column, sampling from the fixed-size peaks array
  for (let px = 0; px < w; px++) {
    const t = xToTime(px, w);
    const idx = Math.round((t / audioDuration) * buckets);
    if (idx < 0 || idx >= buckets) continue;
    const minVal = Math.max(-1, peaks.min[idx] * 3);
    const maxVal = Math.min(1, peaks.max[idx] * 3);
    const yMin = waveTop + ((1 - maxVal) / 2) * waveH;
    const yMax = waveTop + ((1 - minVal) / 2) * waveH;
    ctx.fillStyle = px < playheadX ? '#6eb200' : '#bbb';
    ctx.fillRect(px, yMin, 1, yMax - yMin);
  }

  // Cue markers (pivots at bubbleMargin, lines extend to bottom)
  drawCueMarkers(ctx, w, h, bubbleMargin, dpr);

  // Playhead line
  if (playheadX >= 0 && playheadX <= w) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2 * dpr;
    ctx.beginPath();
    ctx.moveTo(playheadX, waveTop);
    ctx.lineTo(playheadX, h);
    ctx.stroke();
  }
}

// --- Cue hit testing ---
function hitTestCue(clientX: number, clientY: number, dpr: number): string | null {
  const rect = waveformCanvas.getBoundingClientRect();
  const mx = (clientX - rect.left) * dpr;
  const my = (clientY - rect.top) * dpr;
  const w = waveformCanvas.width;
  const topMargin = BUBBLE_TOP_MARGIN * dpr;
  const bubbleH = BUBBLE_H * dpr;
  const bubblePad = BUBBLE_PAD * dpr;

  const ctx = waveformCanvas.getContext('2d')!;
  ctx.font = `${BUBBLE_FONT_SIZE * dpr}px system-ui, sans-serif`;

  // Inverse-rotate mouse coords around each cue's pivot (x, topMargin)
  const cosA = Math.cos(-BUBBLE_ANGLE);
  const sinA = Math.sin(-BUBBLE_ANGLE);

  for (const cue of CUE_DEFS) {
    const t = getCue(cue.id);
    const cx = timeToX(t, w);

    // Transform mouse into the rotated bubble's local space
    const dx = mx - cx;
    const dy = my - topMargin;
    const lx = dx * cosA - dy * sinA;
    const ly = dx * sinA + dy * cosA;

    const textW = ctx.measureText(cue.label).width;
    const bw = textW + bubblePad * 2;
    const bx = BUBBLE_NUDGE * dpr;
    const by = -bubbleH - bubblePad;

    if (lx >= bx && lx <= bx + bw && ly >= by && ly <= by + bubbleH) {
      return cue.id;
    }
  }
  return null;
}

// --- Sync helpers ---
// Audio element is the source of truth for current time.
// The animation controller is kept in sync but clamped to its own duration.
function syncPlay() {
  audio.play();
  if (audio.currentTime <= config.duration) ctrl.play();
}

function syncPause() {
  ctrl.pause();
  audio.pause();
}

function syncSeek(t: number) {
  audio.currentTime = t;
  ctrl.seek(Math.min(t, config.duration));
}

// --- Init ---
async function init() {
  setCaptionsRaw(captionsRaw);
  rebuildTimelineInPlace();
  await setup();

  ctrl = runInBrowser(canvas, config, animate);

  // Size waveform canvas for device pixel ratio
  const dpr = window.devicePixelRatio || 1;
  function sizeWaveformCanvas() {
    const rect = waveformCanvas.getBoundingClientRect();
    waveformCanvas.width = rect.width * dpr;
    waveformCanvas.height = rect.height * dpr;
  }
  sizeWaveformCanvas();

  // Load and decode audio for waveform
  try {
    const resp = await fetch('/audio/untitled.wav');
    const buf = await resp.arrayBuffer();
    const audioCtx = new AudioContext();
    const decoded = await audioCtx.decodeAudioData(buf);
    const channelData = decoded.getChannelData(0);
    audioDuration = decoded.duration;
    viewEnd = audioDuration;
    peaks = computePeaks(channelData, decoded.sampleRate);
    audioCtx.close();
  } catch (err) {
    console.warn('Could not load audio for waveform:', err);
  }

  window.addEventListener('resize', () => {
    sizeWaveformCanvas();
  });

  // UI update loop
  function updateUI() {
    const t = audio.currentTime;
    // Keep animation controller in sync (clamped to animation range)
    if (!Number.isNaN(t)) {
      ctrl.seek(Math.min(t, config.duration));
    }
    timeDisplay.textContent = `${t.toFixed(2)}s / ${audioDuration.toFixed(1)}s`;
    const playing = !audio.paused && !audio.ended;
    playPauseBtn.textContent = playing ? '\u23F8\uFE0E' : '\u25B6\uFE0E';
    if (peaks) {
      drawWaveform(peaks, waveformCanvas, t, config.duration, dpr);
    }
    requestAnimationFrame(updateUI);
  }
  requestAnimationFrame(updateUI);

  // Play/Pause
  function togglePlayPause() {
    if (!audio.paused) syncPause(); else syncPlay();
  }
  playPauseBtn.addEventListener('click', togglePlayPause);
  canvas.addEventListener('click', togglePlayPause);
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      togglePlayPause();
    }
  });

  // Restart
  restartBtn.addEventListener('click', () => {
    syncPause();
    syncSeek(0);
  });

  // Zoom on main canvas (works anywhere in the content pane)
  const contentPane = document.getElementById('content-pane')!;
  let zoom = 1;
  contentPane.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    zoom = Math.max(0.25, Math.min(8, zoom * factor));
    canvas.style.transform = `scale(${zoom})`;
  }, { passive: false });

  // Waveform mouse interaction
  let seekDragging = false;
  let panDragging = false;
  let panLastX = 0;
  let cueDragging: string | null = null;
  let cueDragLastX = 0;

  function seekFromMouse(e: MouseEvent) {
    const rect = waveformCanvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const t = xToTime(x * dpr, waveformCanvas.width);
    syncSeek(Math.max(0, Math.min(t, audioDuration)));
  }

  function cueDragFromMouse(e: MouseEvent) {
    if (!cueDragging) return;
    const rect = waveformCanvas.getBoundingClientRect();
    const dx = e.clientX - cueDragLastX;
    const dtPerPx = (viewEnd - viewStart) / rect.width;
    const dt = dx * dtPerPx;
    const newT = Math.max(0, Math.min(getCue(cueDragging) + dt, audioDuration));
    setCue(cueDragging, newT);
    rebuildTimelineInPlace();
    cueDragLastX = e.clientX;
  }

  waveformCanvas.addEventListener('mousedown', (e) => {
    if (e.button === 2) {
      // Right-click: pan
      panDragging = true;
      panLastX = e.clientX;
    } else if (e.button === 0) {
      // Check if clicking on a cue bubble
      const hitCue = hitTestCue(e.clientX, e.clientY, dpr);
      if (hitCue) {
        cueDragging = hitCue;
        cueDragLastX = e.clientX;
        syncPause();
      } else {
        // Left-click: seek/scrub
        seekDragging = true;
        syncPause();
        seekFromMouse(e);
      }
    }
  });

  waveformCanvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (cueDragging) {
      cueDragFromMouse(e);
    } else if (seekDragging) {
      seekFromMouse(e);
    } else if (panDragging) {
      const rect = waveformCanvas.getBoundingClientRect();
      const dx = e.clientX - panLastX;
      const dtPerPx = (viewEnd - viewStart) / rect.width;
      const dt = -dx * dtPerPx;
      viewStart += dt;
      viewEnd += dt;
      panLastX = e.clientX;
    }
  });

  window.addEventListener('mouseup', () => {
    cueDragging = null;
    seekDragging = false;
    panDragging = false;
  });

  // Zoom waveform with scroll wheel (centered on mouse position)
  waveformCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = waveformCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseT = xToTime(mouseX * dpr, waveformCanvas.width);
    const factor = e.deltaY > 0 ? 1.2 : 1 / 1.2;
    const newSpan = Math.max((viewEnd - viewStart) * factor, 0.5);
    // Keep mouseT at the same pixel position
    const frac = mouseX / rect.width;
    viewStart = mouseT - frac * newSpan;
    viewEnd = mouseT + (1 - frac) * newSpan;
  }, { passive: false });
}

init().catch((err) => {
  console.error('Failed to set up animation:', err);
});

if (import.meta.hot) {
  import.meta.hot.accept('./example.js', async (mod: any) => {
    if (!mod || !ctrl) return;
    const savedT = ctrl.currentTime();
    const wasPlaying = ctrl.isPlaying();
    if (wasPlaying) syncPause();
    mod.setCaptionsRaw(captionsRaw);
    await mod.setup();
    mod.rebuildTimelineInPlace();
    ctrl.updateAnimation(mod.animate);
    syncSeek(savedT);
    if (wasPlaying) syncPlay();
  });
}
