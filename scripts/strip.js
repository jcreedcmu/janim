#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const raw = readFileSync(resolve(root, 'CAPTIONS'), 'utf-8');
const stripped = raw
  .replace(/\[!\w+\] ?/g, '')
  .replace(/ +$/gm, '')
  .replace(/\n{3,}/g, '\n\n')
  .trim() + '\n';
writeFileSync(resolve(root, 'CAPTIONS.txt'), stripped);
console.log('Wrote CAPTIONS.txt');
