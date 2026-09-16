import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createCatalog, getCard, selectDailyCardId, toPublicCardSemantics } from '../../src/domain/cards.mjs';
import { getRelatedCards, searchCards } from '../../src/domain/discovery.mjs';
import { createReadOnlyAgentApi } from '../../src/agent/webmcp-adapter.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const sha256 = (rel) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, rel))).digest('hex');
const listJson = (rel) => fs.readdirSync(path.join(ROOT, rel)).filter((x) => x.endsWith('.json')).sort().map((name) => readJson(`${rel}/${name}`));

const approvedCards = listJson('content/approved/cards');
const reviewCards = listJson('content/review/cards');
const cards = [...approvedCards, ...reviewCards].sort((a, b) => a.card_id.localeCompare(b.card_id));
const approvedResearch = listJson('content/approved/research-records');
const reviewResearch = listJson('content/review/research-records');
const rrMap = new Map([...approvedResearch, ...reviewResearch].map((x) => [x.card_id, x]));
const references = readJson('content/approved/references.json').references;
const assets = readJson('content/approved/assets.json').assets;
const assetMap = new Map(assets.map((x) => [x.asset_id, x]));
const catalog = createCatalog({ cards, references, assets });

test('G4 source set is exactly C0001-C0005 with only C0001 human-released', () => {
  assert.deepEqual(cards.map((x) => x.card_id), ['C0001', 'C0002', 'C0003', 'C0004', 'C0005']);
  assert.deepEqual(approvedCards.map((x) => x.card_id), ['C0001']);
  assert.deepEqual(reviewCards.map((x) => x.card_id), ['C0002', 'C0003', 'C0004', 'C0005']);
  assert.equal(rrMap.get('C0001').human_editorial_release.status, 'APPROVED');
  for (const id of ['C0002', 'C0003', 'C0004', 'C0005']) {
    assert.equal(getCard(catalog, id).status, 'REVIEW_READY');
    assert.equal(rrMap.get(id).lifecycle_state, 'REVIEW_READY');
    assert.equal(rrMap.get(id).human_editorial_release.status, 'PENDING');
    assert.equal(rrMap.get(id).human_editorial_release.reviewer, null);
  }
});

test('5/5 machine evidence, pronunciation, rights, cultural and comparison gates are declared PASS', () => {
  for (const card of cards) {
    const rr = rrMap.get(card.card_id);
    assert.ok(rr, `${card.card_id} research record missing`);
    assert.ok(card.term.ipa.trim(), `${card.card_id} IPA missing`);
    assert.ok(card.verification.lexical_source_count >= 1);
    assert.ok(card.verification.scholarly_source_count >= 1);
    assert.equal(rr.lexical_verification.status, 'PASS');
    assert.equal(rr.semantic_definition_and_boundaries.status, 'PASS');
    assert.equal(rr.cultural_context_review.status, 'PASS');
    assert.equal(rr.pronunciation_verification.status, 'PASS');
    assert.equal(rr.pronunciation_verification.ipa, card.term.ipa);
    for (const locale of ['ko', 'en', 'zh', 'ja']) {
      assert.equal(rr.comparisons[locale].status, 'PASS');
      assert.ok(rr.comparisons[locale].reference_ids.length >= 1);
    }
    assert.equal(Object.values(rr.automated_gates).every((x) => x === 'PASS'), true);
    const audio = assetMap.get(card.assets.audio_asset_id);
    assert.ok(audio);
    assert.equal(audio.asset_type, 'pronunciation_audio');
    assert.ok(audio.source_url?.startsWith('https://'));
    assert.ok(audio.creator_or_model);
    assert.ok(audio.license_or_rights_basis);
    assert.ok(audio.attribution);
    assert.equal(audio.sha256, sha256(audio.path));
  }
});

test('pronunciation rights UI links each G4 license family without mislabeling', () => {
  const source = fs.readFileSync(path.join(ROOT, 'src/ui/app.mjs'), 'utf8');
  assert.match(source, /licenses\/by-sa\/4\.0/);
  assert.match(source, /licenses\/by-sa\/2\.5/);
  assert.match(source, /publicdomain\/zero\/1\.0/);
  assert.match(source, /CC0 1\.0/);
});

test('G4 set has language, script, experience-type diversity and a close semantic pair', () => {
  assert.ok(new Set(cards.map((x) => x.term.language_name)).size >= 4);
  assert.equal(cards.some((x) => /[^\x00-\x7F]/.test(x.term.original)), true);
  assert.equal(cards.some((x) => /^[\x00-\x7F]+$/.test(x.term.original)), true);
  assert.ok(new Set(cards.map((x) => x.experience_type)).size >= 3);
  assert.equal(getCard(catalog, 'C0003').relations.partially_overlaps.includes('C0004'), true);
  assert.equal(getCard(catalog, 'C0004').relations.partially_overlaps.includes('C0003'), true);
});

test('relation graph has valid targets, no self edges, and symmetric/inverse integrity', () => {
  const symmetric = new Set(['similar_to', 'partially_overlaps', 'contrasts_with', 'often_confused_with']);
  for (const card of cards) {
    for (const [kind, ids] of Object.entries(card.relations)) {
      for (const id of ids) {
        assert.notEqual(id, card.card_id);
        const target = getCard(catalog, id);
        assert.ok(target, `${card.card_id} -> ${id} missing`);
        if (symmetric.has(kind)) assert.equal(target.relations[kind].includes(card.card_id), true);
        if (kind === 'broader_than') assert.equal(target.relations.narrower_than.includes(card.card_id), true);
        if (kind === 'narrower_than') assert.equal(target.relations.broader_than.includes(card.card_id), true);
      }
    }
  }
});

test('Human UI domain and Agent API share semantics across all five canary cards', () => {
  const api = createReadOnlyAgentApi({ catalog, dataSnapshotVersion: 'g4-canary' });
  for (const card of cards) {
    const agent = api.get_card({ card_id: card.card_id });
    assert.equal(agent.ok, true);
    assert.deepEqual(agent.data, toPublicCardSemantics(getCard(catalog, card.card_id)));
    const humanSearch = searchCards(catalog, card.term.original);
    const agentSearch = api.search_feelings({ query: card.term.original });
    assert.deepEqual(agentSearch.data.map((x) => x.card.card_id), humanSearch.map((x) => x.card.card_id));
  }
  const humanRelated = getRelatedCards(catalog, 'C0003');
  const agentRelated = api.get_related_feelings({ card_id: 'C0003' });
  assert.deepEqual(agentRelated.data.map((x) => [x.relation, x.card.card_id]), humanRelated.map((x) => [x.relation, x.card.card_id]));
  const date = new Date(2026, 8, 16, 12, 0, 0);
  assert.equal(selectDailyCardId(catalog, { date, seed: 'g4' }), selectDailyCardId(catalog, { date, seed: 'g4' }));
});

test('review preview contains exactly four pending cards and remains non-deployable', () => {
  const manifest = readJson('review-preview/BUILD_MANIFEST.json');
  const data = readJson('review-preview/data/manifest.json');
  assert.deepEqual(manifest.card_ids, ['C0002', 'C0003', 'C0004', 'C0005']);
  assert.equal(manifest.deployable, false);
  assert.equal(manifest.human_editorial_release_required, true);
  assert.equal(data.release_mode, 'REVIEW_ONLY');
  assert.equal(data.card_count, 4);
  for (const id of manifest.card_ids) assert.equal(fs.existsSync(path.join(ROOT, 'review-preview/data/cards', `${id}.json`)), true);
});

test('public build still contains only the already-approved C0001', () => {
  const manifest = readJson('public/BUILD_MANIFEST.json');
  const index = readJson('public/data/cards-index.json');
  assert.deepEqual(manifest.card_ids, ['C0001']);
  assert.deepEqual(index.cards.map((x) => x.card_id), ['C0001']);
  for (const id of ['C0002', 'C0003', 'C0004', 'C0005']) {
    assert.equal(fs.existsSync(path.join(ROOT, 'public/data/cards', `${id}.json`)), false);
  }
});

test('unverified supplied Toska and legacy Schadenfreude audio are not product evidence', () => {
  const registeredPaths = new Set(assets.map((x) => x.path));
  assert.equal(registeredPaths.has('assets/media/audio/ru-toska.ogg'), false);
  assert.equal(registeredPaths.has('assets/media/audio/de-schadenfreude.ogg'), false);
  assert.equal(reviewCards.some((x) => /toska|тоска/i.test(x.term.original)), false);
  const audit = readJson('docs/ops/evidence/G4_AUDIO_PROVENANCE_AUDIT_2026-09-16.json');
  assert.ok(audit.items.find((x) => x.local_path === 'assets/media/audio/ru-toska.ogg' && x.decision === 'HOLD_NOT_LINKED'));
  assert.ok(audit.items.find((x) => x.local_path === 'assets/media/audio/de-schadenfreude.ogg' && x.decision === 'HOLD_NOT_LINKED'));
});
