import { runInBrowser } from './janim.js';
import { config, setup, animate } from './example.js';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;

setup().then(() => {
  runInBrowser(canvas, config, animate);
}).catch((err) => {
  console.error('Failed to set up animation:', err);
});
