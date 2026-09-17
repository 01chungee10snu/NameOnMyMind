import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readText = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const readJson = (rel) => JSON.parse(readText(rel));

test('daily card treats generated imagery as background-only while text and controls remain DOM overlays', () => {
  const html = readText('src/ui/index.html');
  const css = readText('assets/css/styles.css');
  const app = readText('src/ui/app.mjs');
  assert.match(html, /class="card-hero" data-visual-contract="generated-background-dom-overlay"/);
  assert.match(html, /id="card-illustration" class="card-visual-background" aria-hidden="true"/);
  assert.match(html, /class="card-hero-scrim" aria-hidden="true"/);
  assert.match(html, /class="card-hero-content"/);
  assert.match(html, /class="hero-actions"/);
  assert.match(html, /id="pronunciation-button" class="hero-action"/);
  assert.match(html, /id="favorite-button" class="hero-action"/);
  assert.match(html, /id="card-background-description" class="sr-only"/);
  assert.ok(html.indexOf('id="card-illustration"') < html.indexOf('id="card-term"'));
  assert.ok(html.indexOf('id="favorite-button"') < html.indexOf('id="card-term"'));
  assert.ok(html.indexOf('id="card-term"') < html.indexOf('id="poetic-line"'));
  assert.match(css, /\.card-hero\s*\{[\s\S]*position:\s*relative/);
  assert.match(css, /\.card-visual-background\s*\{[\s\S]*position:\s*absolute/);
  assert.match(css, /\.card-background-image\s*\{[\s\S]*object-fit:\s*cover/);
  assert.match(css, /\.card-hero-scrim\s*\{[\s\S]*linear-gradient/);
  assert.match(css, /\.hero-action\s*\{[\s\S]*backdrop-filter/);
  assert.match(css, /\.card-hero-content\s*\{[\s\S]*color:\s*#fffaf5/);
  assert.match(css, /var\(--card-art-image, none\)/);
  assert.match(app, /img\.className='card-background-image'/);
  assert.match(app, /img\.alt=''/);
  assert.match(app, /img\.setAttribute\('aria-hidden','true'\)/);
  assert.match(app, /backgroundDescription\.textContent = card\.assets\.alt_text/);
  assert.match(app, /new URL\(illustrationUrl, document\.baseURI\)\.href/);
  assert.match(app, /setProperty\('--card-art-image'/);
});

test('editorial mobile art direction keeps the image dominant and supporting UI visually restrained', () => {
  const css = readText('assets/css/styles.css');
  assert.match(css, /\.card-body\s*\{[\s\S]*margin:\s*-16px 10px 0/);
  assert.match(css, /\.language\s*\{[\s\S]*border-radius:\s*999px[\s\S]*backdrop-filter/);
  assert.match(css, /\.card-actions \.primary-action\s*\{\s*flex:\s*1 1 100%/);
  assert.match(css, /\.detail section\s*\{[\s\S]*border-top:\s*1px solid[\s\S]*background:\s*transparent/);
  assert.match(css, /\.primary-nav\s*\{[\s\S]*bottom:\s*calc\(8px \+ env\(safe-area-inset-bottom\)\)[\s\S]*border-radius:\s*25px[\s\S]*backdrop-filter:\s*blur\(26px\)/);
  assert.match(css, /@media \(prefers-reduced-motion: no-preference\)[\s\S]*art-settle[\s\S]*copy-rise/);
});

test('mobile interaction polish preserves navigation semantics while adding restrained tactile feedback', () => {
  const css = readText('assets/css/styles.css');
  const app = readText('src/ui/app.mjs');
  assert.match(app, /function prefersReducedMotion\(\)/);
  assert.match(app, /function showSpace\(name, \{ animate = false \} = \{\}\)/);
  assert.match(app, /document\.documentElement\.dataset\.activeSpace = name/);
  assert.match(app, /activePanel\.classList\.add\('space-entering'\)/);
  assert.match(app, /showSpace\(targetSpace, \{ animate: true \}\)/);
  assert.match(app, /showSpace\('journal', \{ animate: true \}\)/);
  assert.match(css, /\.hero-action:active\s*\{[\s\S]*scale\(\.92\)/);
  assert.match(css, /\.primary-action:active\s*\{[\s\S]*scale\(\.985\)/);
  assert.match(css, /\.discovery-card:active\s*\{[\s\S]*scale\(\.988\)/);
  assert.match(css, /\.primary-nav button:active\s*\{[\s\S]*scale\(\.955\)/);
  assert.match(css, /\.space-entering\s*\{[\s\S]*transform-origin/);
  assert.match(css, /@keyframes space-reveal/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test('Beauty V2 mobile UI baseline is explicitly locked to the validated interaction commit and content snapshot', () => {
  const lock = readJson('content/approved/mobile-ui-beauty-v2-lock.json');
  assert.equal(lock.status, 'LOCKED');
  assert.equal(lock.canonical_commit, '4218017');
  assert.equal(lock.visual_baseline_commit, '20e3a34');
  assert.equal(lock.generated_background_release_commit, 'c685816');
  assert.equal(lock.runtime_snapshot_version, 'a1c474f884d64648');
  assert.equal(lock.content_snapshot_version, '867d91c0737e29c7');
  assert.equal(lock.invariants.generated_raster_is_background_only, true);
  assert.equal(lock.invariants.text_and_controls_are_dom_layers, true);
  assert.equal(lock.invariants.daily_card_semantics_unchanged, true);
  assert.equal(lock.invariants.reflection_storage_remains_local_only, true);
  assert.equal(lock.invariants.external_publish_authorized, false);
  for (const artifact of Object.values(lock.verification_artifacts)) {
    assert.equal(fs.existsSync(path.join(ROOT, artifact)), true, `missing Beauty V2 lock artifact ${artifact}`);
  }
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

test('each published canary card resolves to its own human-approved generated background illustration', () => {
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
    assert.match(asset.path, /^assets\/media\/illustrations\/generated\/C000[1-5]\.jpg$/);
    assert.match(asset.creator_or_model, /Google Flow \/ Nano Banana 2/);
    assert.match(asset.source_or_generation_method, /background layer/);
    assert.equal(asset.path.includes('/candidates/'), false, `${card.card_id} review candidate leaked into approved registry`);
    assert.equal(fs.existsSync(path.join(ROOT, asset.path)), true);
  }
});

test('Flow candidate archive stays review-only after selected backgrounds are promoted through scoped human approval', () => {
  const review = readJson('content/review/illustrations/mobile-20260917/manifest.json');
  const proposal = readJson('content/review/illustrations/mobile-20260917/selection-proposal.json');
  const approval = readJson('content/approved/illustration-background-release-20260917.json');
  assert.equal(review.status, 'HUMAN_REVIEW_REQUIRED');
  assert.equal(proposal.status, 'HUMAN_BACKGROUND_APPROVED');
  assert.equal(proposal.approval_record, 'content/approved/illustration-background-release-20260917.json');
  assert.equal(approval.decision, 'APPROVED_FOR_BACKGROUND_LAYER');
  assert.match(approval.review_scope.approved, /backgrounds/);
  assert.deepEqual(approval.review_scope.not_approved_by_this_decision, ['foreign-language semantics','translations','pronunciation','cultural interpretation']);
  assert.match(approval.layer_contract.generated_raster, /Background visual only/);
  assert.match(approval.layer_contract.text, /DOM text/);
  assert.match(approval.layer_contract.ui_objects, /HTML\/CSS\/JS/);
  const candidates = Object.values(review.cards).flatMap((row) => row.candidate_files || []);
  assert.equal(candidates.length, 6);
  for (const candidate of candidates) {
    assert.match(candidate.path, /^assets\/media\/illustrations\/candidates\/mobile-20260917\//);
    assert.equal(fs.existsSync(path.join(ROOT, candidate.path)), true);
  }
  const publicCandidateRoot = path.join(ROOT, 'public/assets/media/illustrations/candidates');
  assert.equal(fs.existsSync(publicCandidateRoot), false, 'review candidates must not be copied to public output');
});
