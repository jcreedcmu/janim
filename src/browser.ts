import { runInBrowser } from './janim.js';
import { config, setup, animate } from './example.js';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const playPauseBtn = document.getElementById('play-pause') as HTMLButtonElement;
const restartBtn = document.getElementById('restart') as HTMLButtonElement;
const scrubber = document.getElementById('scrubber') as HTMLInputElement;
const timeDisplay = document.getElementById('time-display') as HTMLSpanElement;

setup().then(() => {
  const ctrl = runInBrowser(canvas, config, animate);

  // Scrubber range matches duration
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

  // Scroll wheel zoom
  let zoom = 1;
  canvas.style.width = `${config.width}px`;
  canvas.style.height = `${config.height}px`;
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

  let scrubbing = false;
  scrubber.addEventListener('mousedown', () => { scrubbing = true; ctrl.pause(); });
  scrubber.addEventListener('input', () => { ctrl.seek(parseFloat(scrubber.value)); });
  scrubber.addEventListener('mouseup', () => { scrubbing = false; });

}).catch((err) => {
  console.error('Failed to set up animation:', err);
});
