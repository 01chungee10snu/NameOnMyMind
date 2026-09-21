#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const fail = (m) => { throw new Error(m); };

const schema = read('schema/korean-emotion-map.schema.json');
const data = read('content/korean-expression/emotion-map-v1.json');
const evidence = read('content/korean-expression/evidence/registry.json');
const contrastEvidence = read('content/korean-expression/evidence/contrast-source-v2.json');
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
if (!validate(data)) fail(JSON.stringify(validate.errors));

if (data.families.length < 20) fail('emotion family coverage too narrow');
if (data.terms.length < 120) fail('emotion vocabulary coverage too narrow');
if (data.contrast_sets.length < 12) fail('contrast-set coverage too narrow');

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
if (verified.length < 51) fail('too few source-verified Korean emotion terms after contrast evidence v2');
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
}, null, 2));
