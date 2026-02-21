/// <reference types="vite/client" />
import { runInBrowser, AnimationController } from './janim.js';
import { config, setup, animate, TIMELINE } from './example.js';

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

function computePeaks(channelData: Float32Array, sampleRate: number, duration: number): Peaks {
  const totalSamples = Math.min(channelData.length, Math.floor(sampleRate * duration));
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

function drawWaveform(peaks: Peaks, cvs: HTMLCanvasElement, currentT: number, duration: number) {
  const ctx = cvs.getContext('2d')!;
  const w = cvs.width;
  const h = cvs.height;
  ctx.clearRect(0, 0, w, h);

  const playheadX = (currentT / duration) * w;
  const buckets = peaks.min.length;

  // Draw one bar per pixel column, sampling from the fixed-size peaks array
  for (let px = 0; px < w; px++) {
    const idx = Math.min(Math.round((px / w) * buckets), buckets - 1);
    const minVal = Math.max(-1, peaks.min[idx] * 3);
    const maxVal = Math.min(1, peaks.max[idx] * 3);
    // Map [-1,1] to [h, 0]
    const yMin = ((1 - maxVal) / 2) * h;
    const yMax = ((1 - minVal) / 2) * h;
    ctx.fillStyle = px < playheadX ? '#e94560' : '#555';
    ctx.fillRect(px, yMin, 1, yMax - yMin);
  }

  // Scene boundary lines
  const sceneBoundaries = TIMELINE.map(e => e.start);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1;
  for (const t of sceneBoundaries) {
    if (t <= 0) continue;
    const x = (t / duration) * w;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  // Playhead line
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(playheadX, 0);
  ctx.lineTo(playheadX, h);
  ctx.stroke();
}

// --- Sync helpers ---
function syncPlay() {
  ctrl.play();
  audio.play();
}

function syncPause() {
  ctrl.pause();
  audio.pause();
}

function syncSeek(t: number) {
  ctrl.seek(t);
  audio.currentTime = t;
}

// --- Init ---
async function init() {
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
    peaks = computePeaks(channelData, decoded.sampleRate, config.duration);
    audioCtx.close();
  } catch (err) {
    console.warn('Could not load audio for waveform:', err);
  }

  window.addEventListener('resize', () => {
    sizeWaveformCanvas();
  });

  // UI update loop
  function updateUI() {
    const t = ctrl.currentTime();
    timeDisplay.textContent = `${t.toFixed(2)}s / ${ctrl.duration.toFixed(1)}s`;
    playPauseBtn.textContent = ctrl.isPlaying() ? '\u23F8\uFE0E' : '\u25B6\uFE0E';
    if (peaks) {
      drawWaveform(peaks, waveformCanvas, t, ctrl.duration);
    }
    requestAnimationFrame(updateUI);
  }
  requestAnimationFrame(updateUI);

  // Play/Pause
  playPauseBtn.addEventListener('click', () => {
    if (ctrl.isPlaying()) syncPause(); else syncPlay();
  });

  // Restart
  restartBtn.addEventListener('click', () => {
    syncPause();
    syncSeek(0);
  });

  // Zoom on main canvas
  let zoom = 1;
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    zoom = Math.max(0.25, Math.min(8, zoom * factor));
    canvas.style.transform = `scale(${zoom})`;
  }, { passive: false });

  // Waveform mouse interaction
  let dragging = false;

  function seekFromMouse(e: MouseEvent) {
    const rect = waveformCanvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const t = (x / rect.width) * ctrl.duration;
    syncSeek(t);
  }

  waveformCanvas.addEventListener('mousedown', (e) => {
    dragging = true;
    syncPause();
    seekFromMouse(e);
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    seekFromMouse(e);
  });

  window.addEventListener('mouseup', () => {
    dragging = false;
  });
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
    await mod.setup();
    ctrl.updateAnimation(mod.animate);
    syncSeek(savedT);
    if (wasPlaying) syncPlay();
  });
}
