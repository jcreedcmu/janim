/// <reference types="vite/client" />
import { runInBrowser, AnimationController } from './janim.js';
import { config, setup, animate } from './example.js';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const playPauseBtn = document.getElementById('play-pause') as HTMLButtonElement;
const restartBtn = document.getElementById('restart') as HTMLButtonElement;
const scrubber = document.getElementById('scrubber') as HTMLInputElement;
const timeDisplay = document.getElementById('time-display') as HTMLSpanElement;

let ctrl: AnimationController;

async function init() {
  await setup();
  ctrl = runInBrowser(canvas, config, animate);

  scrubber.max = String(config.duration);
  scrubber.step = '0.01';

  function updateUI() {
    const t = ctrl.currentTime();
    scrubber.value = String(t);
    timeDisplay.textContent = `${t.toFixed(2)}s / ${ctrl.duration.toFixed(1)}s`;
    playPauseBtn.textContent = ctrl.isPlaying() ? '\u23F8\uFE0E' : '\u25B6\uFE0E';
    requestAnimationFrame(updateUI);
  }
  requestAnimationFrame(updateUI);

  playPauseBtn.addEventListener('click', () => {
    if (ctrl.isPlaying()) ctrl.pause(); else ctrl.play();
  });

  restartBtn.addEventListener('click', () => {
    ctrl.pause();
    ctrl.seek(0);
  });

  let zoom = 1;
  canvas.style.width = `${config.width}px`;
  canvas.style.height = `${config.height}px`;
  canvas.style.transform = '';
  canvas.style.transformOrigin = '';
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
    zoom = Math.max(0.25, Math.min(8, zoom * factor));
    canvas.style.transform = `scale(${zoom})`;
    canvas.style.transformOrigin = 'center center';
    ctrl.setResolution(
      Math.round(config.width * zoom),
      Math.round(config.height * zoom),
    );
  }, { passive: false });

  scrubber.addEventListener('mousedown', () => { ctrl.pause(); });
  scrubber.addEventListener('input', () => { ctrl.seek(parseFloat(scrubber.value)); });
}

init().catch((err) => {
  console.error('Failed to set up animation:', err);
});

if (import.meta.hot) {
  import.meta.hot.accept('./example.js', async (mod: any) => {
    if (!mod || !ctrl) return;
    const savedT = ctrl.currentTime();
    const wasPlaying = ctrl.isPlaying();
    if (wasPlaying) ctrl.pause();
    await mod.setup();
    ctrl.updateAnimation(mod.animate);
    ctrl.seek(savedT);
    if (wasPlaying) ctrl.play();
  });
}
