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

test('G5 editorial contract prioritizes nuanced Korean and material Korean lexical gaps', () => {
  assert.match(contract, /20 Korean nuanced terms\/expressions/);
  assert.match(contract, /27 non-Korean terms with a material Korean one-word gap/);
  assert.match(contract, /47 new editorial cards/);
  assert.match(contract, /REJECTED_GENERIC_EQUIVALENT/);
  assert.match(contract, /한 단어로 완전히 겹치지는 않는 표현/);
  assert.match(contract, /Never say:[\s\S]*Koreans are the only people who feel X/);
  assert.match(contract, /Never say:[\s\S]*This word cannot be translated/);
});

test('envy and 幸福 are preserved as G4 canary evidence but planned out of the final active 50', () => {
  const exceptions = new Map(rejections.grandfathered_g4_canary_exceptions.map((x) => [x.card_id, x]));
  assert.equal(exceptions.get('C0004').term, 'envy');
  assert.equal(exceptions.get('C0005').term, '幸福');
  assert.equal(exceptions.get('C0004').g5_final_active_status, 'PLANNED_RETIRE_AT_G5_CUTOVER');
  assert.equal(exceptions.get('C0005').g5_final_active_status, 'PLANNED_RETIRE_AT_G5_CUTOVER');
  assert.match(rejections.final_active_collection_rule, /C0006-C0052/);
  const newTerms = new Set(pool.candidates.map((x) => x.term));
  assert.equal(newTerms.has('envy'), false);
  assert.equal(newTerms.has('幸福'), false);
});

test('G5 candidate pool is distinctiveness-first and includes substantial Korean nuance research', () => {
  assert.equal(pool.schema_version, '2.0.0');
  const korean = pool.candidates.filter((x) => x.track === 'KOREAN_NUANCE');
  const foreign = pool.candidates.filter((x) => x.track === 'FOREIGN_KOREAN_GAP');
  assert.equal(pool.composition_target.new_korean_nuance, 20);
  assert.equal(pool.composition_target.new_non_korean_gap, 27);
  assert.equal(pool.composition_target.total_new, 47);
  assert.equal(pool.composition_target.final_active_cards, 50);
  assert.deepEqual(pool.composition_target.planned_retirements, ['C0004','C0005']);
  assert.ok(korean.length >= 20, `expected at least 20 Korean candidates, got ${korean.length}`);
  assert.ok(foreign.length >= 27, `expected at least 27 foreign gap candidates, got ${foreign.length}`);
  for (const term of ['서운하다','아쉽다','섭섭하다','뿌듯하다','뭉클하다','억울하다','후련하다','찜찜하다','먹먹하다','착잡하다']) {
    assert.ok(korean.some((x) => x.term === term), `${term} missing from Korean nuance pool`);
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

test('G5 final cutover targets C0001-C0003 plus C0006-C0052 while current canary stays five-card', () => {
  assert.match(contract, /C0001-C0003 plus C0006-C0052/);
  assert.match(contract, /C0004\/C0005 remain PUBLISHED only/);
  const manifest = readJson('public/BUILD_MANIFEST.json');
  assert.deepEqual(manifest.card_ids, ['C0001','C0002','C0003','C0004','C0005']);
  for (const id of ['C0006','C0007','C0008','C0009','C0010']) {
    assert.equal(fs.existsSync(path.join(ROOT, 'public/data/cards', `${id}.json`)), false);
  }
});
