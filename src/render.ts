import { GlobalFonts } from '@napi-rs/canvas';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderToFrames } from './janim.js';
import { config, setup, animate } from './example.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.resolve(__dirname, '..', 'vendor');

GlobalFonts.registerFromPath(path.join(fontsDir, 'Roboto.ttf'), 'Roboto');
GlobalFonts.registerFromPath(path.join(fontsDir, 'Roboto-Italic.ttf'), 'Roboto');

const outDir = process.argv[2] || 'frames';

setup().then(() => {
  return renderToFrames({ ...config, outDir }, animate);
}).catch((err) => {
  console.error('Render failed:', err);
  process.exit(1);
});
