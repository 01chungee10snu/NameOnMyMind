#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { fileURLToPath } from 'node:url';
import { selectEffectiveKoreanDailyPool } from '../../src/domain/korean-daily.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const fail = (m) => { throw new Error(m); };

const schema = read('schema/korean-emotion-map.schema.json');
const data = read('content/korean-expression/emotion-map-v1.json');
const simpleMeanings = read('content/korean-expression/simple-meanings-v1.json');
const dailyPool = read('content/korean-expression/daily-pool-v1.json');
const dailyPoolV2 = read('content/korean-expression/daily-pool-v2.json');
const dailyPoolRegistry = read('content/korean-expression/daily-pools.json');
const evidence = read('content/korean-expression/evidence/registry.json');
const contrastEvidence = read('content/korean-expression/evidence/contrast-source-v2.json');
const level1Evidence = read('content/korean-expression/evidence/level1-source-v1.json');
const level2Evidence = read('content/korean-expression/evidence/level2-exact-source-v1.json');
const level2FollowupEvidenceV2 = read('content/korean-expression/evidence/level2-followup-source-v2.json');
const level3Evidence = read('content/korean-expression/evidence/level3-exact-source-v1.json');
const level3FollowupEvidence = read('content/korean-expression/evidence/level3-followup-source-v2.json');
const level3FollowupEvidenceV3 = read('content/korean-expression/evidence/level3-followup-source-v3.json');
const level3FollowupEvidenceV4 = read('content/korean-expression/evidence/level3-followup-source-v4.json');
const phraseEvidence = read('content/korean-expression/evidence/phrase-source-v1.json');
const phraseEvidenceV2 = read('content/korean-expression/evidence/phrase-source-v2.json');
const standardFollowupEvidence = read('content/korean-expression/evidence/standard-dictionary-followup-v1.json');
const schoolAgeEvidence = read('content/korean-expression/evidence/school-age-v1.json');
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
if (!validate(data)) fail(JSON.stringify(validate.errors));

if (data.families.length < 20) fail('emotion family coverage too narrow');
if (data.terms.length < 120) fail('emotion vocabulary coverage too narrow');
if (data.contrast_sets.length < 12) fail('contrast-set coverage too narrow');
if (simpleMeanings.meanings_id !== 'KOREAN_SIMPLE_MEANINGS_V1_2026-09-24') fail('simple meanings snapshot id mismatch');
if (simpleMeanings.term_count !== data.terms.length || simpleMeanings.entries?.length !== data.terms.length) fail('simple meanings coverage mismatch');
const simpleMeaningById = new Map(simpleMeanings.entries.map((row) => [row.id, row]));
for (const term of data.terms) {
  const row = simpleMeaningById.get(term.id);
  if (!row || row.expression !== term.expression || !row.meaning?.trim()) fail(`${term.expression}: simple meaning missing or mismatched`);
  if (row.evidence_ref !== term.evidence_ref) fail(`${term.expression}: simple meaning evidence_ref drifted`);
  if (!['SOURCE_DEFINITION','EDITORIAL_SIMPLIFICATION'].includes(row.wording)) fail(`${term.expression}: simple meaning wording type invalid`);
}

const familyIds = new Set(data.families.map((x) => x.id));
if (familyIds.size !== data.families.length) fail('duplicate family id');
for (const term of data.terms) if (!familyIds.has(term.family_id)) fail(`${term.expression}: unknown family ${term.family_id}`);

const termIds = data.terms.map((x) => x.id);
if (new Set(termIds).size !== termIds.length) fail('duplicate term id');
const expressions = data.terms.map((x) => x.expression);
if (new Set(expressions).size !== expressions.length) fail('duplicate canonical expression');

const levels = new Set(data.terms.map((x) => x.level));
for (const level of [1,2,3]) if (!levels.has(level)) fail(`learning level ${level} missing`);

const verified = data.terms.filter((x) => x.status === 'SOURCE_VERIFIED');
if (verified.length !== 151) fail('all 151 Korean emotion terms must be source-verified after the final standard-dictionary follow-up');
const evidenceMap = new Map(evidence.entries.map((x) => [x.evidence_ref, x]));
if (evidenceMap.size !== evidence.entries.length) fail('duplicate evidence_ref in Korean emotion evidence registry');
for (const x of verified) {
  if (!x.evidence_ref) fail(`${x.expression}: SOURCE_VERIFIED without evidence_ref`);
  if (!evidenceMap.has(x.evidence_ref)) fail(`${x.expression}: unresolved evidence_ref ${x.evidence_ref}`);
}
for (const row of evidence.entries) {
  if (row.source_type === 'local_research_record') {
    if (!row.path || !fs.existsSync(path.join(ROOT, row.path))) fail(`${row.evidence_ref}: local evidence path missing`);
  } else if (row.source_type === 'official_dictionary') {
    if (!row.url || !new URL(row.url).hostname.endsWith('korean.go.kr')) fail(`${row.evidence_ref}: official dictionary URL invalid`);
  } else fail(`${row.evidence_ref}: unsupported evidence source_type`);
}
for (const x of data.terms.filter((x) => x.status === 'DISCOVERY_ONLY')) {
  if (x.note?.includes('제품 카드로 사용')) fail(`${x.expression}: discovery term framed as product-ready`);
}

if (dailyPool.pool_id !== 'KOREAN_DAILY_VERIFIED_V1_2026-09-22') fail('Korean daily pool id mismatch');
if (dailyPool.effective_date !== '2026-09-22') fail('Korean daily pool effective date mismatch');
if (dailyPool.source_commit !== 'f1a1d6518bec48c0d4c8aa7b71a96a2367b27af4') fail('Korean daily pool source commit mismatch');
if (dailyPool.term_count !== 116 || dailyPool.term_ids.length !== 116) fail('Korean daily pool v1 size drifted');
if (new Set(dailyPool.term_ids).size !== dailyPool.term_ids.length) fail('duplicate Korean daily pool term id');
const termById = new Map(data.terms.map((x) => [x.id, x]));
for (const id of dailyPool.term_ids) {
  const term = termById.get(id);
  if (!term) fail(`daily pool term missing: ${id}`);
  if (term.status !== 'SOURCE_VERIFIED') fail(`daily pool term is no longer SOURCE_VERIFIED: ${id}`);
}

if (dailyPoolV2.pool_id !== 'KOREAN_DAILY_VERIFIED_V2_2026-09-24') fail('Korean daily pool v2 id mismatch');
if (dailyPoolV2.effective_date !== '2026-09-24') fail('Korean daily pool v2 effective date mismatch');
if (dailyPoolV2.source_commit !== 'a05fbc7a901b50d1673db6b830bb05338bf9dc38') fail('Korean daily pool v2 source commit mismatch');
if (dailyPoolV2.term_count !== 151 || dailyPoolV2.term_ids.length !== 151) fail('Korean daily pool v2 size drifted');
if (new Set(dailyPoolV2.term_ids).size !== dailyPoolV2.term_ids.length) fail('duplicate Korean daily pool v2 term id');
if (dailyPoolV2.term_ids.length !== data.terms.length || dailyPoolV2.term_ids.some((id) => !termById.has(id))) fail('Korean daily pool v2 must cover the full emotion map');
if (data.terms.some((term) => !dailyPoolV2.term_ids.includes(term.id))) fail('Korean daily pool v2 is missing a current term id');
if (dailyPool.term_ids.some((id) => !dailyPoolV2.term_ids.includes(id))) fail('Korean daily pool v2 must preserve every v1 term id');

if (dailyPoolRegistry.registry_id !== 'KOREAN_DAILY_POOL_REGISTRY_V1_2026-09-23') fail('Korean daily pool registry id mismatch');
if (dailyPoolRegistry.fallback_pool_id !== dailyPool.pool_id) fail('Korean daily pool registry fallback mismatch');
if (!Array.isArray(dailyPoolRegistry.pools) || dailyPoolRegistry.pools.length !== 2) fail('Korean daily pool registry version count mismatch');
const registryV1 = dailyPoolRegistry.pools.find((row) => row.pool_id === dailyPool.pool_id);
const registryV2 = dailyPoolRegistry.pools.find((row) => row.pool_id === dailyPoolV2.pool_id);
if (!registryV1 || registryV1.path !== 'daily-pool-v1.json' || registryV1.effective_date !== dailyPool.effective_date || registryV1.version_order !== 1) fail('Korean daily pool registry v1 row mismatch');
if (!registryV2 || registryV2.path !== 'daily-pool-v2.json' || registryV2.effective_date !== dailyPoolV2.effective_date || registryV2.version_order !== 2) fail('Korean daily pool registry v2 row mismatch');
if (selectEffectiveKoreanDailyPool(dailyPoolRegistry, new Date(2026, 8, 23, 12, 0, 0))?.pool_id !== dailyPool.pool_id) fail('Korean daily pool registry must keep v1 active on 2026-09-23');
if (selectEffectiveKoreanDailyPool(dailyPoolRegistry, new Date(2026, 8, 24, 12, 0, 0))?.pool_id !== dailyPoolV2.pool_id) fail('Korean daily pool registry must activate v2 on 2026-09-24');

if (level1Evidence.snapshot_id !== 'KOREAN_LEVEL1_LEXICAL_EVIDENCE_V1_2026-09-21') fail('Level 1 evidence snapshot id mismatch');
if (level1Evidence.entries.length !== 26) fail('Level 1 evidence v1 must contain 26 newly audited terms');
if (schoolAgeEvidence.evidence_id !== 'KICCE:2026:PR2012') fail('school-age evidence id mismatch');
if (schoolAgeEvidence.kci_article_id !== 'ART003331358') fail('school-age KCI article id mismatch');
if (schoolAgeEvidence.doi !== '10.5718/kcep.2026.20.1.29') fail('school-age DOI mismatch');
if (schoolAgeEvidence.study_scope?.grades !== '초등학교 3~6학년') fail('school-age evidence grade boundary mismatch');
if (!schoolAgeEvidence.study_scope?.lower_grade_boundary?.includes('1~2학년')) fail('lower-grade boundary must be explicit');

const depthByLevel = new Map([[1,'BASIC'],[2,'EXPANDED'],[3,'NUANCED']]);
const schoolCrosswalk = new Map(
  schoolAgeEvidence.map_crosswalk
    .filter((x) => x.map_expression && ['GRADE_3_6_SUPPORTED','GRADE_3_6_RELATED_FORM'].includes(x.support))
    .map((x) => [x.map_expression, x])
);
for (const term of data.terms) {
  const profile = term.learning_profile;
  if (!profile) fail(`${term.expression}: learning_profile missing`);
  if (profile.lexical_depth !== depthByLevel.get(term.level)) fail(`${term.expression}: lexical_depth does not match level`);

  const schoolRow = schoolCrosswalk.get(term.expression);
  const expectedSchool = schoolRow?.support || (term.status === 'SOURCE_VERIFIED' ? 'LEXICAL_ONLY' : 'AGE_REVIEW_REQUIRED');
  if (profile.school_age_evidence !== expectedSchool) fail(`${term.expression}: school_age_evidence mismatch`);
  if ((schoolRow?.source_form || null) !== profile.school_age_source_form) fail(`${term.expression}: school_age_source_form mismatch`);
  if (term.evidence_ref && !profile.evidence_refs.includes(term.evidence_ref)) fail(`${term.expression}: lexical evidence missing from learning_profile`);
  if (schoolRow && !profile.evidence_refs.includes(schoolAgeEvidence.evidence_id)) fail(`${term.expression}: school-age evidence id missing`);
}
if (data.terms.some((x) => x.level === 1 && x.status !== 'SOURCE_VERIFIED')) fail('all Level 1 terms must be source-verified');
if (data.terms.filter((x) => x.level === 1).length !== 38) fail('Level 1 baseline count drifted');
if (data.terms.some((x) => x.expression === '짜증나다')) fail('non-canonical 짜증나다 must not re-enter the emotion map');
if (!data.terms.some((x) => x.expression === '짜증이 나다' && x.evidence_ref === 'KRD:71579')) fail('canonical 짜증이 나다 evidence missing');

for (const row of level1Evidence.entries) {
  if (!row.term || !row.evidence_ref || !row.selected_definition || !row.url) fail('Level 1 evidence row incomplete');
  if (!evidenceMap.has(row.evidence_ref)) fail(`${row.term}: Level 1 evidence_ref missing from registry`);
}
if (level2Evidence.snapshot_id !== 'KOREAN_LEVEL2_EXACT_EVIDENCE_V1_2026-09-22') fail('Level 2 evidence snapshot id mismatch');
if (level2Evidence.entries.length !== 22 || level2Evidence.unresolved_terms.length !== 17) fail('Level 2 evidence admission/HOLD counts drifted');
for (const row of level2Evidence.entries) {
  if (!row.term || !row.evidence_ref || !row.selected_definition || !row.url) fail('Level 2 evidence row incomplete');
  if (!evidenceMap.has(row.evidence_ref)) fail(`${row.term}: Level 2 evidence_ref missing from registry`);
  const term = data.terms.find((x) => x.expression === row.term);
  if (!term || term.level !== 2 || term.status !== 'SOURCE_VERIFIED' || term.evidence_ref !== row.evidence_ref) fail(`${row.term}: Level 2 admitted term state mismatch`);
}
const phraseLevel2Superseded = new Set(phraseEvidence.superseded_level2_holds || []);
const phraseV2Level2Superseded = new Set(phraseEvidenceV2.superseded_level2_holds || []);
const followupLevel2Superseded = new Set(level2FollowupEvidenceV2.superseded_level2_holds || []);
const standardLevel2Superseded = new Set(standardFollowupEvidence.superseded_level2_holds || []);
for (const expression of level2Evidence.unresolved_terms) {
  const term = data.terms.find((x) => x.expression === expression);
  if (phraseLevel2Superseded.has(expression)) {
    const phraseRow = phraseEvidence.entries.find((x) => x.term === expression);
    if (!phraseRow || !term || term.level !== 2 || term.status !== 'SOURCE_VERIFIED' || term.evidence_ref !== phraseRow.evidence_ref) {
      fail(`${expression}: superseded Level 2 HOLD state mismatch`);
    }
  } else if (followupLevel2Superseded.has(expression)) {
    const row = level2FollowupEvidenceV2.entries.find((x) => x.term === expression);
    if (!row || !term || term.level !== 2 || term.status !== 'SOURCE_VERIFIED' || term.evidence_ref !== row.evidence_ref) {
      fail(`${expression}: superseded Level 2 follow-up HOLD state mismatch`);
    }
  } else if (phraseV2Level2Superseded.has(expression)) {
    const row = phraseEvidenceV2.entries.find((x) => x.term === expression);
    if (!row || !term || term.level !== 2 || term.status !== 'SOURCE_VERIFIED' || term.evidence_ref !== row.evidence_ref) {
      fail(`${expression}: superseded Level 2 phrase-v2 HOLD state mismatch`);
    }
  } else if (standardLevel2Superseded.has(expression)) {
    const row = standardFollowupEvidence.entries.find((x) => (x.previous_expression || x.term) === expression);
    const canonicalTerm = row && data.terms.find((x) => x.expression === row.term);
    if (!row || !canonicalTerm || canonicalTerm.level !== 2 || canonicalTerm.status !== 'SOURCE_VERIFIED' || canonicalTerm.evidence_ref !== row.evidence_ref) {
      fail(`${expression}: superseded Level 2 standard-dictionary HOLD state mismatch`);
    }
    if (row.previous_expression && row.previous_expression !== row.term && data.terms.some((x) => x.expression === row.previous_expression)) {
      fail(`${expression}: non-canonical Level 2 discovery expression must not remain in the map`);
    }
  } else if (!term || term.level !== 2 || term.status !== 'DISCOVERY_ONLY') {
    fail(`${expression}: unresolved Level 2 term must remain DISCOVERY_ONLY`);
  }
}
if (data.terms.filter((x) => x.level === 2 && x.status === 'SOURCE_VERIFIED').length !== 72) fail('Level 2 verified baseline drifted');
if (data.terms.filter((x) => x.level === 2 && x.status === 'DISCOVERY_ONLY').length !== 0) fail('Level 2 HOLD set must be empty');

if (level2FollowupEvidenceV2.snapshot_id !== 'KOREAN_LEVEL2_FOLLOWUP_EVIDENCE_V2_2026-09-23') fail('Level 2 follow-up v2 evidence snapshot id mismatch');
if (level2FollowupEvidenceV2.entries.length !== 3 || followupLevel2Superseded.size !== 3 || level2FollowupEvidenceV2.remaining_level2_holds_expected !== 11) fail('Level 2 follow-up v2 evidence counts drifted');
for (const row of level2FollowupEvidenceV2.entries) {
  if (!row.term || !row.evidence_ref || !row.selected_definition || !row.url) fail('Level 2 follow-up v2 evidence row incomplete');
  if (!evidenceMap.has(row.evidence_ref)) fail(`${row.term}: Level 2 follow-up v2 evidence_ref missing from registry`);
}

if (level3Evidence.snapshot_id !== 'KOREAN_LEVEL3_EXACT_EVIDENCE_V1_2026-09-22') fail('Level 3 evidence snapshot id mismatch');
if (level3Evidence.entries.length !== 13 || level3Evidence.unresolved_terms.length !== 22) fail('Level 3 evidence admission/HOLD counts drifted');
for (const row of level3Evidence.entries) {
  if (!row.term || !row.evidence_ref || !row.selected_definition || !row.url) fail('Level 3 evidence row incomplete');
  if (!evidenceMap.has(row.evidence_ref)) fail(`${row.term}: Level 3 evidence_ref missing from registry`);
  const term = data.terms.find((x) => x.expression === row.term);
  if (!term || term.level !== 3 || term.status !== 'SOURCE_VERIFIED' || term.evidence_ref !== row.evidence_ref) fail(`${row.term}: Level 3 admitted term state mismatch`);
}
const phraseLevel3Superseded = new Set(phraseEvidence.superseded_level3_holds || []);
const phraseV2Level3Superseded = new Set(phraseEvidenceV2.superseded_level3_holds || []);
const standardLevel3Superseded = new Set(standardFollowupEvidence.superseded_level3_holds || []);
const followupLevel3EvidenceBatches = [level3FollowupEvidence, level3FollowupEvidenceV3, level3FollowupEvidenceV4];
const followupLevel3Superseded = new Set(followupLevel3EvidenceBatches.flatMap((batch) => batch.superseded_level3_holds || []));
for (const expression of level3Evidence.unresolved_terms) {
  if (phraseLevel3Superseded.has(expression)) {
    const phraseRow = phraseEvidence.entries.find((x) => x.previous_expression === expression);
    const canonicalTerm = phraseRow && data.terms.find((x) => x.expression === phraseRow.term);
    if (!phraseRow || data.terms.some((x) => x.expression === expression) || !canonicalTerm || canonicalTerm.level !== 3 || canonicalTerm.status !== 'SOURCE_VERIFIED' || canonicalTerm.evidence_ref !== phraseRow.evidence_ref) {
      fail(`${expression}: superseded Level 3 HOLD/canonicalization mismatch`);
    }
  } else if (followupLevel3Superseded.has(expression)) {
    const followupRow = followupLevel3EvidenceBatches.flatMap((batch) => batch.entries).find((x) => x.term === expression);
    const term = data.terms.find((x) => x.expression === expression);
    if (!followupRow || !term || term.level !== 3 || term.status !== 'SOURCE_VERIFIED' || term.evidence_ref !== followupRow.evidence_ref) {
      fail(`${expression}: superseded Level 3 follow-up HOLD state mismatch`);
    }
  } else if (phraseV2Level3Superseded.has(expression)) {
    const row = phraseEvidenceV2.entries.find((x) => x.term === expression);
    const term = data.terms.find((x) => x.expression === expression);
    if (!row || !term || term.level !== 3 || term.status !== 'SOURCE_VERIFIED' || term.evidence_ref !== row.evidence_ref) {
      fail(`${expression}: superseded Level 3 phrase-v2 HOLD state mismatch`);
    }
  } else if (standardLevel3Superseded.has(expression)) {
    const row = standardFollowupEvidence.entries.find((x) => (x.previous_expression || x.term) === expression);
    const canonicalTerm = row && data.terms.find((x) => x.expression === row.term);
    if (!row || !canonicalTerm || canonicalTerm.level !== 3 || canonicalTerm.status !== 'SOURCE_VERIFIED' || canonicalTerm.evidence_ref !== row.evidence_ref) {
      fail(`${expression}: superseded Level 3 standard-dictionary HOLD state mismatch`);
    }
    if (row.previous_expression && row.previous_expression !== row.term && data.terms.some((x) => x.expression === row.previous_expression)) {
      fail(`${expression}: non-canonical Level 3 discovery expression must not remain in the map`);
    }
  } else {
    const term = data.terms.find((x) => x.expression === expression);
    if (!term || term.level !== 3 || term.status !== 'DISCOVERY_ONLY') fail(`${expression}: unresolved Level 3 term must remain DISCOVERY_ONLY`);
  }
}
if (data.terms.filter((x) => x.level === 3 && x.status === 'SOURCE_VERIFIED').length !== 41) fail('Level 3 verified baseline drifted');
if (data.terms.filter((x) => x.level === 3 && x.status === 'DISCOVERY_ONLY').length !== 0) fail('Level 3 HOLD set must be empty');

if (level3FollowupEvidence.snapshot_id !== 'KOREAN_LEVEL3_FOLLOWUP_EVIDENCE_V2_2026-09-22') fail('Level 3 follow-up evidence snapshot id mismatch');
if (level3FollowupEvidence.entries.length !== 1 || new Set(level3FollowupEvidence.superseded_level3_holds || []).size !== 1 || level3FollowupEvidence.remaining_level3_holds_expected !== 20) fail('Level 3 follow-up evidence counts drifted');
for (const row of level3FollowupEvidence.entries) {
  if (!row.term || !row.evidence_ref || !row.selected_definition || !row.url) fail('Level 3 follow-up evidence row incomplete');
  if (!evidenceMap.has(row.evidence_ref)) fail(`${row.term}: Level 3 follow-up evidence_ref missing from registry`);
}
if (level3FollowupEvidenceV3.snapshot_id !== 'KOREAN_LEVEL3_FOLLOWUP_EVIDENCE_V3_2026-09-23') fail('Level 3 follow-up v3 evidence snapshot id mismatch');
if (level3FollowupEvidenceV3.entries.length !== 2 || new Set(level3FollowupEvidenceV3.superseded_level3_holds || []).size !== 2 || level3FollowupEvidenceV3.remaining_level3_holds_expected !== 18) fail('Level 3 follow-up v3 evidence counts drifted');
for (const row of level3FollowupEvidenceV3.entries) {
  if (!row.term || !row.evidence_ref || !row.selected_definition || !row.url) fail('Level 3 follow-up v3 evidence row incomplete');
  if (!evidenceMap.has(row.evidence_ref)) fail(`${row.term}: Level 3 follow-up v3 evidence_ref missing from registry`);
}
if (level3FollowupEvidenceV4.snapshot_id !== 'KOREAN_LEVEL3_FOLLOWUP_EVIDENCE_V4_2026-09-23') fail('Level 3 follow-up v4 evidence snapshot id mismatch');
if (level3FollowupEvidenceV4.entries.length !== 12 || new Set(level3FollowupEvidenceV4.superseded_level3_holds || []).size !== 12 || level3FollowupEvidenceV4.remaining_level3_holds_expected !== 6) fail('Level 3 follow-up v4 evidence counts drifted');
for (const row of level3FollowupEvidenceV4.entries) {
  if (!row.term || !row.evidence_ref || !row.selected_definition || !row.url) fail('Level 3 follow-up v4 evidence row incomplete');
  if (!evidenceMap.has(row.evidence_ref)) fail(`${row.term}: Level 3 follow-up v4 evidence_ref missing from registry`);
}

if (phraseEvidence.snapshot_id !== 'KOREAN_PHRASE_EVIDENCE_V1_2026-09-22') fail('phrase evidence snapshot id mismatch');
if (phraseEvidence.entries.length !== 4 || phraseLevel2Superseded.size !== 3 || phraseLevel3Superseded.size !== 1) fail('phrase evidence admission counts drifted');
if (phraseEvidence.remaining_level2_holds_expected !== 14 || phraseEvidence.remaining_level3_holds_expected !== 21) fail('phrase evidence remaining HOLD counts drifted');
for (const row of phraseEvidence.entries) {
  if (!row.term || !row.evidence_ref || !row.selected_definition || !row.url) fail('phrase evidence row incomplete');
  if (!evidenceMap.has(row.evidence_ref)) fail(`${row.term}: phrase evidence_ref missing from registry`);
}
if (phraseEvidenceV2.snapshot_id !== 'KOREAN_PHRASE_EVIDENCE_V2_2026-09-23') fail('phrase v2 evidence snapshot id mismatch');
if (phraseEvidenceV2.entries.length !== 9 || phraseV2Level2Superseded.size !== 6 || phraseV2Level3Superseded.size !== 3) fail('phrase v2 evidence admission counts drifted');
if (phraseEvidenceV2.remaining_level2_holds_expected !== 5 || phraseEvidenceV2.remaining_level3_holds_expected !== 3) fail('phrase v2 evidence remaining HOLD counts drifted');
for (const row of phraseEvidenceV2.entries) {
  if (!row.term || !row.evidence_ref || !row.selected_definition || !row.url) fail('phrase v2 evidence row incomplete');
  if (!evidenceMap.has(row.evidence_ref)) fail(`${row.term}: phrase v2 evidence_ref missing from registry`);
}
if (standardFollowupEvidence.snapshot_id !== 'KOREAN_STANDARD_DICTIONARY_FOLLOWUP_V1_2026-09-23') fail('standard-dictionary follow-up snapshot id mismatch');
if (standardFollowupEvidence.entries.length !== 8 || standardLevel2Superseded.size !== 5 || standardLevel3Superseded.size !== 3) fail('standard-dictionary follow-up admission counts drifted');
if (standardFollowupEvidence.remaining_level2_holds_expected !== 0 || standardFollowupEvidence.remaining_level3_holds_expected !== 0) fail('standard-dictionary follow-up must close all HOLDs');
for (const row of standardFollowupEvidence.entries) {
  if (!row.term || !row.evidence_ref || !row.selected_definition || !row.url) fail('standard-dictionary follow-up row incomplete');
  if (!row.url.includes('stdict.korean.go.kr')) fail(`${row.term}: standard-dictionary URL invalid`);
  if (!evidenceMap.has(row.evidence_ref)) fail(`${row.term}: standard-dictionary evidence_ref missing from registry`);
}
if (data.terms.some((x) => x.status === 'DISCOVERY_ONLY')) fail('final Korean emotion map must not contain DISCOVERY_ONLY terms');
if (data.terms.some((x) => x.learning_profile?.school_age_evidence === 'AGE_REVIEW_REQUIRED')) fail('final Korean emotion map must not contain AGE_REVIEW_REQUIRED terms');
if (data.terms.some((x) => x.expression === '조바심나다')) fail('non-canonical 조바심나다 must not re-enter the emotion map');
if (!data.terms.some((x) => x.expression === '조바심하다' && x.evidence_ref === 'KRD:75299')) fail('canonical 조바심하다 evidence missing');

if (schoolCrosswalk.size !== 22) fail('school-age direct/related crosswalk must contain 22 mapped expressions');

const allExpressions = new Set(expressions);
for (const set of data.contrast_sets) {
  for (const expression of set.terms) if (!allExpressions.has(expression)) fail(`${set.id}: contrast term missing from map: ${expression}`);
  for (const cue of set.choice_cues) {
    if (!set.terms.includes(cue.expression)) fail(`${set.id}: cue expression is outside contrast set`);
  }
  if (set.status === 'SOURCE_VERIFIED') {
    for (const expression of set.terms) {
      const row = data.terms.find((x) => x.expression === expression);
      if (row.status !== 'SOURCE_VERIFIED') fail(`${set.id}: verified contrast includes unverified term ${expression}`);
    }
  }
}
if (data.contrast_sets.length !== 16) fail('contrast-set count drifted from verified v2 baseline');
if (data.contrast_sets.some((x) => x.status !== 'SOURCE_VERIFIED')) fail('all 16 contrast sets must be source-verified');
if (data.terms.some((x) => x.expression === '샘나다')) fail('non-canonical 샘나다 must not re-enter the emotion map');
if (!data.terms.some((x) => x.expression === '샘내다' && x.evidence_ref === 'KRD:62760')) fail('canonical 샘내다 evidence missing');

if (contrastEvidence.snapshot_id !== 'KOREAN_CONTRAST_EVIDENCE_V2_2026-09-21') fail('contrast evidence snapshot id mismatch');
if (contrastEvidence.entries.length !== 30) fail('contrast evidence v2 must contain 30 audited terms');
for (const row of contrastEvidence.entries) {
  if (!row.term || !row.evidence_ref || !row.selected_definition) fail('contrast evidence row incomplete');
  if (!evidenceMap.has(row.evidence_ref)) fail(`${row.term}: contrast snapshot evidence_ref missing from registry`);
}

const requiredFamilies = [
  '기쁨·즐거움','기대·설렘','만족·성취','안도·해방','애정·친밀감',
  '그리움·마음 남음','관계의 상처','외로움·허전함','슬픔·비애','실망·허탈',
  '걱정·불안','두려움·공포','답답함·막막함','분노·짜증','억울함·원망',
  '부끄러움·자기의식','미안함·후회','부러움·질투','놀람·혼란·경이','복합·양가감정'
];
for (const label of requiredFamilies) if (!data.families.some((x) => x.label === label)) fail(`required emotion family missing: ${label}`);

const requiredContrastTitles = [
  '서운하다 · 섭섭하다 · 아쉽다',
  '불안하다 · 조마조마하다 · 초조하다',
  '뿌듯하다 · 흐뭇하다 · 대견하다',
  '부끄럽다 · 민망하다 · 쑥스럽다 · 멋쩍다',
  '화나다 · 분하다 · 억울하다 · 원망스럽다',
  '벅차다 · 뭉클하다 · 울컥하다'
];
for (const title of requiredContrastTitles) if (!data.contrast_sets.some((x) => x.title === title)) fail(`core contrast set missing: ${title}`);

const harmfulFrames = ['너는 이런 사람', '성격이 문제', '정상적인 감정', '비정상적인 감정', '진단'];
const payload = JSON.stringify(data);
for (const phrase of harmfulFrames) if (payload.includes(phrase)) fail(`diagnostic or identity-labeling language detected: ${phrase}`);

console.log(JSON.stringify({
  status: 'PASS',
  track_id: data.track_id,
  family_count: data.families.length,
  term_count: data.terms.length,
  contrast_set_count: data.contrast_sets.length,
  source_verified_count: verified.length,
  evidence_registry_count: evidence.entries.length,
  discovery_only_count: data.terms.length - verified.length,
  levels: [...levels].sort(),
  verified_contrast_sets: data.contrast_sets.filter((x) => x.status === 'SOURCE_VERIFIED').map((x) => x.id),
  level1_verified_count: data.terms.filter((x) => x.level === 1 && x.status === 'SOURCE_VERIFIED').length,
  level2_verified_count: data.terms.filter((x) => x.level === 2 && x.status === 'SOURCE_VERIFIED').length,
  level2_discovery_count: data.terms.filter((x) => x.level === 2 && x.status === 'DISCOVERY_ONLY').length,
  level3_verified_count: data.terms.filter((x) => x.level === 3 && x.status === 'SOURCE_VERIFIED').length,
  level3_discovery_count: data.terms.filter((x) => x.level === 3 && x.status === 'DISCOVERY_ONLY').length,
  school_age_direct_count: data.terms.filter((x) => x.learning_profile.school_age_evidence === 'GRADE_3_6_SUPPORTED').length,
  school_age_related_count: data.terms.filter((x) => x.learning_profile.school_age_evidence === 'GRADE_3_6_RELATED_FORM').length,
  age_review_required_count: data.terms.filter((x) => x.learning_profile.school_age_evidence === 'AGE_REVIEW_REQUIRED').length,
}, null, 2));
