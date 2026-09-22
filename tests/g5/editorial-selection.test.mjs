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

test('app discovery exposes research surfaces without promoting research candidates', () => {
  const ui = readText('src/ui/index.html');
  const app = readText('src/ui/app.mjs');
  const stage = readText('scripts/stage-research-preview.mjs');
  const korean = readJson('content/korean-expression/emotion-map-v1.json');
  const dailyPool = readJson('content/korean-expression/daily-pool-v1.json');
  const schoolAge = readJson('content/korean-expression/evidence/school-age-v1.json');
  const level1Evidence = readJson('content/korean-expression/evidence/level1-source-v1.json');
  const level2Evidence = readJson('content/korean-expression/evidence/level2-exact-source-v1.json');
  const level3Evidence = readJson('content/korean-expression/evidence/level3-exact-source-v1.json');
  const level3FollowupEvidence = readJson('content/korean-expression/evidence/level3-followup-source-v2.json');
  const level3FollowupEvidenceV3 = readJson('content/korean-expression/evidence/level3-followup-source-v3.json');
  const phraseEvidence = readJson('content/korean-expression/evidence/phrase-source-v1.json');
  const sourcePreview = readJson('prototypes/g5-research-preview-20260918/manifest.json');

  assert.match(ui, /RESEARCH PREVIEW/);
  assert.match(ui, /아직 다듬고 있는 마음말/);
  assert.match(ui, /WORLD WORDS/);
  assert.match(ui, /KOREAN MAP/);
  assert.match(app, /hydrateResearchDiscovery/);
  assert.match(app, /readJsonOptional/);
  assert.match(app, /renderResearchSearch/);
  assert.match(app, /syncDiscoverQuery/);
  assert.match(app, /requestedQuery/);
  assert.match(app, /worldResearchHref/);
  assert.match(app, /koreanResearchHref/);
  assert.match(readText('prototypes/g5-research-preview-20260918/index.html'), /requestedCard/);
  const koreanPrototype = readText('prototypes/korean-emotion-map-20260919/index.html');
  assert.match(koreanPrototype, /requestedFamily/);
  assert.match(koreanPrototype, /syncUrl/);
  assert.match(koreanPrototype, /상황에서 찾기/);
  assert.match(koreanPrototype, /guideSituation/);
  assert.match(koreanPrototype, /renderGuideSets/);
  assert.match(koreanPrototype, /data\.contrast_sets\.filter\(x=>x\.status==='SOURCE_VERIFIED'\)/);
  assert.doesNotMatch(koreanPrototype, /연구 중 비교도 보기/);
  assert.match(koreanPrototype, /앱이 감정을 판정하지 않습니다/);
  assert.match(koreanPrototype, /선택 사항 · 저장하지 않음/);
  assert.match(koreanPrototype, /id="school-age-only"/);
  assert.match(koreanPrototype, /1–2학년 적합성 판정을 뜻하지 않습니다/);
  assert.match(koreanPrototype, /schoolAgeEligible/);
  assert.match(app, /3–6학년 연구 연결/);
  assert.match(app, /koreanDailyVerifiedTerm/);
  assert.match(app, /koreanDailyPool/);
  assert.match(app, /daily-pool-v1\.json/);
  assert.match(app, /koreanDailyContrastSet/);
  assert.match(app, /오늘의 한국어 마음말/);
  assert.match(app, /오늘의 비슷한 말 연습/);
  assert.match(app, /정답을 맞히는 문제가 아닙니다/);
  assert.match(app, /오늘의 한 문장/);
  assert.match(app, /작성 내용은 저장하거나 전송하지 않습니다/);
  assert.match(app, /korean-daily-reflection-input/);
  assert.doesNotMatch(app, /saveReflection\(daily/);
  assert.match(app, /term\.status === 'SOURCE_VERIFIED'/);
  assert.match(app, /set\.status === 'SOURCE_VERIFIED'/);
  assert.match(app, /set\.terms\.includes\(dailyTerm\.expression\)/);
  assert.match(app, /getFullYear\(\).*getMonth\(\).*getDate\(\)/s);
  const styles = readText('assets/css/styles.css');
  assert.match(styles, /\.korean-daily-card/);
  assert.match(styles, /\.korean-daily-term/);
  assert.match(styles, /\.korean-daily-practice/);
  assert.match(styles, /\.korean-daily-practice-choices/);
  assert.match(styles, /\.korean-daily-reflection/);
  assert.match(styles, /\.korean-daily-reflection-input/);
  assert.doesNotMatch(koreanPrototype, /localStorage/);
  assert.doesNotMatch(koreanPrototype, /searchParams\.set\(['"]situation/);
  assert.match(app, /상황에서 마음말 찾기/);
  assert.match(stage, /product_release_authorized: false/);
  assert.equal(sourcePreview.status, 'RESEARCH_PREVIEW_ONLY');
  assert.equal(sourcePreview.public_release_authorized, false);
  assert.equal(sourcePreview.cards.length, 16);
  assert.ok(sourcePreview.cards.every((card) => card.lifecycle_state === 'HOLD'));

  assert.equal(korean.track_id, 'KOREAN_EMOTION_ARTICULATION');
  assert.equal(korean.families.length, 22);
  assert.equal(korean.terms.length, 151);
  assert.equal(korean.terms.filter((term) => term.status === 'SOURCE_VERIFIED').length, 119);
  assert.equal(korean.terms.filter((term) => term.level === 1).length, 38);
  assert.ok(korean.terms.filter((term) => term.level === 1).every((term) => term.status === 'SOURCE_VERIFIED'));
  assert.equal(korean.terms.filter((term) => term.level === 2 && term.status === 'SOURCE_VERIFIED').length, 58);
  assert.equal(korean.terms.filter((term) => term.level === 2 && term.status === 'DISCOVERY_ONLY').length, 14);
  assert.equal(korean.terms.filter((term) => term.level === 3 && term.status === 'SOURCE_VERIFIED').length, 23);
  assert.equal(korean.terms.filter((term) => term.level === 3 && term.status === 'DISCOVERY_ONLY').length, 18);
  assert.equal(korean.terms.filter((term) => term.learning_profile?.school_age_evidence === 'GRADE_3_6_SUPPORTED').length, 21);
  assert.equal(korean.terms.filter((term) => term.learning_profile?.school_age_evidence === 'GRADE_3_6_RELATED_FORM').length, 1);
  assert.ok(korean.terms.every((term) => term.learning_profile?.lexical_depth));
  assert.equal(korean.contrast_sets.length, 16);
  assert.ok(korean.contrast_sets.every((set) => set.status === 'SOURCE_VERIFIED'));
  assert.equal(dailyPool.pool_id, 'KOREAN_DAILY_VERIFIED_V1_2026-09-22');
  assert.equal(dailyPool.term_count, 116);
  assert.equal(dailyPool.term_ids.length, 116);
  assert.equal(new Set(dailyPool.term_ids).size, 116);
  assert.ok(dailyPool.term_ids.every((id) => korean.terms.some((term) => term.id === id && term.status === 'SOURCE_VERIFIED')));
  assert.equal(dailyPool.term_ids.includes('KE0012'), false); // 고대하다 was verified later; v1 remains stable
  assert.equal(korean.terms.some((term) => term.expression === '샘나다'), false);
  assert.equal(korean.terms.some((term) => term.expression === '샘내다'), true);
  assert.equal(korean.terms.some((term) => term.expression === '짜증나다'), false);
  assert.equal(korean.terms.some((term) => term.expression === '짜증이 나다'), true);
  assert.equal(korean.terms.some((term) => term.expression === '조바심나다'), false);
  assert.equal(korean.terms.some((term) => term.expression === '조바심하다'), true);

  assert.equal(schoolAge.evidence_id, 'KICCE:2026:PR2012');
  assert.equal(schoolAge.study_scope.grades, '초등학교 3~6학년');
  assert.match(schoolAge.study_scope.lower_grade_boundary, /1~2학년/);
  assert.equal(schoolAge.doi, '10.5718/kcep.2026.20.1.29');
  assert.equal(schoolAge.map_crosswalk.filter((row) => row.support === 'GRADE_3_6_SUPPORTED').length, 21);
  assert.equal(schoolAge.map_crosswalk.filter((row) => row.support === 'GRADE_3_6_RELATED_FORM').length, 1);
  assert.equal(level1Evidence.snapshot_id, 'KOREAN_LEVEL1_LEXICAL_EVIDENCE_V1_2026-09-21');
  assert.equal(level1Evidence.entries.length, 26);
  assert.ok(level1Evidence.entries.every((row) => row.evidence_ref && row.url?.includes('korean.go.kr')));
  assert.equal(level2Evidence.snapshot_id, 'KOREAN_LEVEL2_EXACT_EVIDENCE_V1_2026-09-22');
  assert.equal(level2Evidence.entries.length, 22);
  assert.equal(level2Evidence.unresolved_terms.length, 17);
  assert.ok(level2Evidence.entries.every((row) => row.evidence_ref && row.url?.includes('korean.go.kr')));
  assert.equal(level3Evidence.snapshot_id, 'KOREAN_LEVEL3_EXACT_EVIDENCE_V1_2026-09-22');
  assert.equal(level3Evidence.entries.length, 13);
  assert.equal(level3Evidence.unresolved_terms.length, 22);
  assert.ok(level3Evidence.entries.every((row) => row.evidence_ref && row.url?.includes('korean.go.kr')));
  assert.equal(level3FollowupEvidence.snapshot_id, 'KOREAN_LEVEL3_FOLLOWUP_EVIDENCE_V2_2026-09-22');
  assert.deepEqual(level3FollowupEvidence.superseded_level3_holds, ['고대하다']);
  assert.equal(level3FollowupEvidence.entries[0]?.evidence_ref, 'KRD:25588');
  assert.equal(level3FollowupEvidence.remaining_level3_holds_expected, 20);
  assert.equal(level3FollowupEvidenceV3.snapshot_id, 'KOREAN_LEVEL3_FOLLOWUP_EVIDENCE_V3_2026-09-23');
  assert.deepEqual(level3FollowupEvidenceV3.superseded_level3_holds, ['낙담하다','격분하다']);
  assert.deepEqual(level3FollowupEvidenceV3.entries.map((row) => row.evidence_ref), ['KRD:36830','KRD:33033']);
  assert.equal(level3FollowupEvidenceV3.remaining_level3_holds_expected, 18);
  assert.equal(phraseEvidence.snapshot_id, 'KOREAN_PHRASE_EVIDENCE_V1_2026-09-22');
  assert.equal(phraseEvidence.entries.length, 4);
  assert.deepEqual(phraseEvidence.superseded_level2_holds, ['마음을 졸이다','마음에 걸리다','가슴이 철렁하다']);
  assert.deepEqual(phraseEvidence.superseded_level3_holds, ['조바심나다']);
  assert.ok(phraseEvidence.entries.every((row) => row.evidence_ref && row.url?.includes('korean.go.kr')));
  assert.match(stage, /daily_pool_path/);
  assert.match(stage, /school_age_evidence_path/);
  assert.match(stage, /level1_evidence_path/);
  assert.match(stage, /level2_evidence_path/);
  assert.match(stage, /level3_evidence_path/);
  assert.match(stage, /level3_followup_evidence_path/);
  assert.match(stage, /level3_followup_v3_evidence_path/);
  assert.match(stage, /phrase_evidence_path/);

  const manifest = readJson('public/BUILD_MANIFEST.json');
  assert.deepEqual(manifest.card_ids, ['C0001','C0002','C0003','C0004','C0005']);
});
