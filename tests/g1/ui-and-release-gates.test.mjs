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

test('C0001 is human-released and promoted to approved PUBLISHED source', () => {
  const card = readJson('content/approved/cards/C0001.json');
  const rr = readJson('content/approved/research-records/C0001.json');
  assert.equal(card.status, 'PUBLISHED');
  assert.equal(rr.lifecycle_state, 'APPROVED');
  assert.equal(rr.human_editorial_release.status, 'APPROVED');
  assert.equal(rr.human_editorial_release.reviewed_at, '2026-09-16');
  assert.equal(fs.existsSync(path.join(ROOT, 'content/review/cards/C0001.json')), false);
});

test('public builder produces a local deployable bundle without external publish authority', () => {
  const result = spawnSync(process.execPath, ['scripts/build-public.mjs'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const manifest = readJson('public/BUILD_MANIFEST.json');
  const dataManifest = readJson('public/data/manifest.json');
  assert.equal(manifest.deployable, true);
  assert.equal(manifest.external_publish_authorized, false);
  assert.deepEqual(manifest.card_ids, ['C0001']);
  assert.equal(dataManifest.release_mode, 'PUBLIC_LOCAL_BUILD');
  assert.equal(dataManifest.card_count, 1);
});

test('pronunciation attribution exposes source and CC BY-SA license links', () => {
  const source = readText('src/ui/app.mjs');
  assert.match(source, /audioAsset\.source_url/);
  assert.match(source, /creativecommons\.org\/licenses\/by-sa\/4\.0/);
  assert.match(source, /CC BY-SA 4\.0 라이선스/);
});

test('share asset locale matches the selected pt-BR card locale', () => {
  const share = readText('assets/media/share/C0001.svg');
  assert.match(share, /Português \(Brasil\) · \/sawˈda\.dʒi\//);
});

test('styles include reduced motion and visible focus support', () => {
  const css = readText('assets/css/styles.css');
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /focus-visible/);
  assert.match(css, /forced-colors/);
});
