import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const readText = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const pool = readJson('content/g5/candidate-pool.json');
const batch = readJson('content/g5/batches/01_korean_nuance_research.json');
const rejections = readJson('content/g5/generic-candidate-rejections.json');
const pronunciation = readJson('content/g5/korean-pronunciation-provenance-canary.json');
const contract = readText('docs/ops/G5_EDITORIAL_SELECTION_CONTRACT.md');

test('G5 editorial contract is foreign-semantic-gap first', () => {
  assert.match(contract, /45 foreign-language semantic-gap cards/);
  assert.match(contract, /new: \*\*42 foreign cards\*\*/);
  assert.match(contract, /5 Korean nuance anchor cards/);
  assert.match(contract, /Korean Expression Cost/);
  assert.match(contract, /ONE_WORD_EQUIVALENT/);
  assert.match(contract, /EXPLANATORY_PHRASE_REQUIRED/);
  assert.match(contract, /This word cannot be translated/);
});

test('envy and 幸福 are preserved as G4 canary evidence but planned out of the final active 50', () => {
  const exceptions = new Map(rejections.grandfathered_g4_canary_exceptions.map((x) => [x.card_id, x]));
  assert.equal(exceptions.get('C0004').term, 'envy');
  assert.equal(exceptions.get('C0005').term, '幸福');
  assert.equal(exceptions.get('C0004').g5_final_active_status, 'PLANNED_RETIRE_AT_G5_CUTOVER');
  assert.equal(exceptions.get('C0005').g5_final_active_status, 'PLANNED_RETIRE_AT_G5_CUTOVER');
  assert.match(rejections.final_active_collection_rule, /45 foreign semantic-gap cards/);
  assert.match(rejections.final_active_collection_rule, /C0011-C0015 remain secondary research only/);
  const newTerms = new Set(pool.candidates.map((x) => x.term));
  assert.equal(newTerms.has('envy'), false);
  assert.equal(newTerms.has('幸福'), false);
});

test('G5 candidate pool is foreign-first with enough replacement depth', () => {
  assert.equal(pool.schema_version, '3.0.0');
  const korean = pool.candidates.filter((x) => x.track === 'KOREAN_NUANCE');
  const foreign = pool.candidates.filter((x) => x.track === 'FOREIGN_KOREAN_GAP');
  assert.equal(pool.composition_target.final_active_cards, 50);
  assert.equal(pool.composition_target.final_foreign_cards, 45);
  assert.equal(pool.composition_target.new_foreign_semantic_gap_cards, 42);
  assert.deepEqual(pool.composition_target.korean_anchor_cards, ['C0006','C0007','C0008','C0009','C0010']);
  assert.deepEqual(pool.composition_target.secondary_korean_research, ['C0011','C0012','C0013','C0014','C0015']);
  assert.deepEqual(pool.composition_target.planned_retirements, ['C0004','C0005']);
  assert.ok(foreign.length >= 60, `expected deep foreign replacement pool, got ${foreign.length}`);
  assert.ok(korean.length >= 5, `expected Korean anchor candidates, got ${korean.length}`);
  for (const term of ['Geborgenheit','Fernweh','切ない','もどかしい','委屈','舍不得','心疼','тоска','kilig','gigil']) {
    assert.ok(foreign.some((x) => x.term === term), `${term} missing from foreign gap pool`);
  }
  for (const term of ['joy','sadness','fear','anger']) assert.equal(pool.candidates.some((x) => x.term === term), false);
});

test('high-risk cultural concepts are explicitly fenced rather than privileged for novelty', () => {
  const risk = new Map(pool.candidates.map((x) => [x.term, x.risk]));
  assert.match(risk.get('정'), /^HIGH_/);
  assert.match(risk.get('한'), /^HIGH_/);
  assert.match(risk.get('눈치'), /^HIGH_/);
  assert.match(risk.get('甘え'), /^HIGH_/);
  assert.match(risk.get('hiraeth'), /^HIGH_/);
});

test('first Korean batch is admitted for research but blocked from REVIEW_READY by audio rights', () => {
  assert.equal(batch.status, 'RESEARCH_ADMITTED_AUDIO_RIGHTS_HOLD');
  assert.deepEqual(batch.reserved_card_ids, ['C0006','C0007','C0008','C0009','C0010']);
  assert.equal(batch.public_or_review_promotion_authorized, false);
  for (const item of batch.items) {
    assert.equal(item.track, 'KOREAN_NUANCE');
    assert.equal(item.research_status, 'PASS_DISTINCTIVENESS_HOLD_AUDIO_RIGHTS');
    assert.equal(item.audio_rights_status, 'HOLD_FILE_LEVEL_CCL_UNRESOLVED');
    assert.ok(item.semantic_residue_hypothesis.length > 20);
    assert.ok(item.overclaim_to_avoid.length > 10);
    assert.ok(item.scholly_source_ids === undefined); // typo-like fields must not silently substitute canonical scholarly_source_ids
    assert.ok(Array.isArray(item.scholarly_source_ids) && item.scholarly_source_ids.length >= 3);
  }
});

test('Krdict pronunciation MP3s remain local research only and are not registered product assets', () => {
  assert.equal(pronunciation.product_linkage_authorized, false);
  assert.equal(pronunciation.rights_gate, 'HOLD_MULTIMEDIA_FILE_LEVEL_RIGHTS_UNRESOLVED');
  const assets = readJson('content/approved/assets.json').assets;
  const registered = new Set(assets.map((x) => x.path));
  for (const item of pronunciation.items) {
    assert.equal(item.product_asset_registered, false);
    assert.equal(item.rights_status, 'HOLD_UNTIL_FILE_LEVEL_CCL_VERIFIED');
    assert.equal(registered.has(item.local_path), false);
  }
});

test('G5 Research Record v2 requires a distinctiveness review without mutating G1-G4 v1.1 schema', () => {
  const v1 = readJson('schema/research-record.schema.json');
  const v2 = readJson('schema/g5-research-record.schema.json');
  assert.equal(v1.properties.schema_version.const, '1.1.0');
  assert.equal(v1.required.includes('distinctiveness_review'), false);
  assert.equal(v2.properties.schema_version.const, '2.0.0');
  assert.equal(v2.required.includes('distinctiveness_review'), true);
  assert.deepEqual(v2.properties.distinctiveness_review.properties.status.enum, ['PASS','HOLD','REJECTED_GENERIC_EQUIVALENT']);
});

test('G5 final cutover targets 45 foreign plus 5 Korean anchors while current canary stays five-card', () => {
  assert.match(contract, /45 foreign \+ 5 Korean = 50 active cards/);
  assert.match(contract, /C0011-C0015 as non-public secondary research only/);
  const secondary = readJson('content/g5/secondary-korean-research.json');
  assert.equal(secondary.status, 'SECONDARY_RESEARCH_ONLY');
  assert.deepEqual(secondary.card_ids, ['C0011','C0012','C0013','C0014','C0015']);
  assert.equal(secondary.public_promotion_authorized, false);
  const manifest = readJson('public/BUILD_MANIFEST.json');
  assert.deepEqual(manifest.card_ids, ['C0001','C0002','C0003','C0004','C0005']);
  for (const id of ['C0006','C0007','C0008','C0009','C0010']) {
    assert.equal(fs.existsSync(path.join(ROOT, 'public/data/cards', `${id}.json`)), false);
  }
});
