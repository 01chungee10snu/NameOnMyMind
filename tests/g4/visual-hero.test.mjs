import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readText = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const readJson = (rel) => JSON.parse(readText(rel));

test('daily card uses a full-bleed illustration hero with semantic text overlay', () => {
  const html = readText('src/ui/index.html');
  const css = readText('assets/css/styles.css');
  assert.match(html, /class="card-hero"/);
  assert.match(html, /id="card-illustration" class="card-illustration"/);
  assert.match(html, /class="card-hero-scrim" aria-hidden="true"/);
  assert.match(html, /class="card-hero-content"/);
  assert.ok(html.indexOf('id="card-illustration"') < html.indexOf('id="card-term"'));
  assert.ok(html.indexOf('id="card-term"') < html.indexOf('id="poetic-line"'));
  assert.match(css, /\.card-hero\s*\{[\s\S]*position:\s*relative/);
  assert.match(css, /\.card-illustration\s*\{[\s\S]*position:\s*absolute/);
  assert.match(css, /\.card-hero-scrim\s*\{[\s\S]*linear-gradient/);
  assert.match(css, /\.card-hero-content\s*\{[\s\S]*color:\s*#fffaf5/);
  assert.match(css, /var\(--card-art-image, none\)/);
  const app = readText('src/ui/app.mjs');
  assert.match(app, /new URL\(illustrationUrl, document\.baseURI\)\.href/);
  assert.match(app, /setProperty\('--card-art-image'/);
});

test('mobile-first shell uses a constrained app canvas, safe-area bottom navigation, and image-led discovery cards', () => {
  const html = readText('src/ui/index.html');
  const css = readText('assets/css/styles.css');
  const app = readText('src/ui/app.mjs');
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /class="nav-icon"/);
  assert.match(html, /id="space-journal"/);
  assert.match(html, /id="pronunciation-button"/);
  assert.match(css, /--app-width:\s*540px/);
  assert.match(css, /\.primary-nav\s*\{[\s\S]*position:\s*fixed/);
  assert.match(css, /grid-template-columns:\s*repeat\(4,/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /\.card-hero\s*\{[\s\S]*aspect-ratio:\s*4\s*\/\s*3/);
  assert.match(css, /\.discovery-card\s*\{[\s\S]*grid-template-columns/);
  assert.match(app, /function renderCardTile\(catalog, card/);
  assert.match(app, /img\.loading = 'lazy'/);
});

test('each published canary card resolves to its own approved illustration', () => {
  const cards = fs.readdirSync(path.join(ROOT, 'content/approved/cards'))
    .filter((name) => /^C000[1-5]\.json$/.test(name))
    .sort()
    .map((name) => readJson(`content/approved/cards/${name}`));
  const assets = readJson('content/approved/assets.json').assets;
  const assetMap = new Map(assets.map((asset) => [asset.asset_id, asset]));
  const illustrationIds = cards.map((card) => card.assets.illustration_asset_id);
  assert.equal(cards.length, 5);
  assert.equal(new Set(illustrationIds).size, 5);
  for (const card of cards) {
    const asset = assetMap.get(card.assets.illustration_asset_id);
    assert.ok(asset, `${card.card_id} illustration missing`);
    assert.equal(asset.asset_type, 'illustration');
    assert.equal(asset.review_status, 'HUMAN_APPROVED');
    assert.equal(asset.path.includes('/candidates/'), false, `${card.card_id} review candidate leaked into approved registry`);
    assert.equal(fs.existsSync(path.join(ROOT, asset.path)), true);
  }
});

test('Flow-generated mobile illustration candidates remain review-only and cannot enter public build before human approval', () => {
  const review = readJson('content/review/illustrations/mobile-20260917/manifest.json');
  const proposal = readJson('content/review/illustrations/mobile-20260917/selection-proposal.json');
  assert.equal(review.status, 'HUMAN_REVIEW_REQUIRED');
  assert.equal(proposal.status, 'HUMAN_APPROVAL_PENDING');
  const candidates = Object.values(review.cards).flatMap((row) => row.candidate_files || []);
  assert.equal(candidates.length, 6);
  for (const candidate of candidates) {
    assert.match(candidate.path, /^assets\/media\/illustrations\/candidates\/mobile-20260917\//);
    assert.equal(fs.existsSync(path.join(ROOT, candidate.path)), true);
  }
  const publicCandidateRoot = path.join(ROOT, 'public/assets/media/illustrations/candidates');
  assert.equal(fs.existsSync(publicCandidateRoot), false, 'review candidates must not be copied to public output');
});
