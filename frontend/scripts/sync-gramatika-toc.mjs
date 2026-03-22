import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { daftarIsiGramatika } from '../src/constants/gramatikaData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, '..');
const gramatikaRoot = path.join(frontendRoot, 'public', 'gramatika');

function buildOrderedList(items = [], level = 0) {
  const indent = '   '.repeat(level);

  return items.flatMap((item, index) => {
    const currentLine = `${indent}${index + 1}. [${item.judul}](/gramatika/${item.slug})`;
    const childLines = buildOrderedList(item.turunan || [], level + 1);
    return [currentLine, ...childLines];
  });
}

function buildTocBlock(bab) {
  const lines = buildOrderedList(bab.items || []);
  return [...lines, ''].join('\n');
}

function syncBabFile(bab) {
  const filePath = path.join(gramatikaRoot, bab.slug, `${bab.slug}.md`);
  const nextContent = buildTocBlock(bab);

  fs.writeFileSync(filePath, nextContent, 'utf8');
  return path.relative(frontendRoot, filePath);
}

const updatedFiles = daftarIsiGramatika.map(syncBabFile);

for (const filePath of updatedFiles) {
  console.log(`synced ${filePath}`);
}