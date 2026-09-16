import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readText = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const readJson = (rel) => JSON.parse(readText(rel));

test('Daily Card Shell exposes canonical detail anchors and accessible reveal contract', () => {
  const html = readText('src/ui/index.html');
  for (const id of ['daily-card', 'meaning', 'languages', 'culture', 'evidence']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-controls="compact-meaning"/);
  assert.match(html, /type="module"/);
});

test('UI source imports the canonical domain and read-only agent adapter', () => {
  const source = readText('src/ui/app.mjs');
  assert.match(source, /from '\.\.\/domain\/cards\.mjs'/);
  assert.match(source, /from '\.\.\/agent\/webmcp-adapter\.mjs'/);
  assert.match(source, /new URLSearchParams\(location\.search\)\.get\('card'\)/);
});

test('review card is not human-released or present in approved public cards', () => {
  const card = readJson('content/review/cards/C0001.json');
  const rr = readJson('content/review/research-records/C0001.json');
  assert.equal(card.status, 'REVIEW_READY');
  assert.equal(rr.human_editorial_release.status, 'PENDING');
  assert.equal(fs.existsSync(path.join(ROOT, 'content/approved/cards/C0001.json')), false);
});

test('public builder fails closed while human editorial release is pending', () => {
  const result = spawnSync(process.execPath, ['scripts/build-public.mjs'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /PUBLIC_BUILD_BLOCKED/);
});

test('styles include reduced motion and visible focus support', () => {
  const css = readText('assets/css/styles.css');
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /focus-visible/);
  assert.match(css, /forced-colors/);
});
