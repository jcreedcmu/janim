import { renderToFrames } from './janim.js';
import { config, setup, animate } from './example.js';

const outDir = process.argv[2] || 'frames';

setup().then(() => {
  return renderToFrames({ ...config, outDir }, animate);
}).catch((err) => {
  console.error('Render failed:', err);
  process.exit(1);
});
