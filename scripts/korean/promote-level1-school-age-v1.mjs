#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mapPath = path.join(ROOT, 'content/korean-expression/emotion-map-v1.json');
const registryPath = path.join(ROOT, 'content/korean-expression/evidence/registry.json');
const level1Path = path.join(ROOT, 'content/korean-expression/evidence/level1-source-v1.json');
const schoolPath = path.join(ROOT, 'content/korean-expression/evidence/school-age-v1.json');

const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const level1 = JSON.parse(fs.readFileSync(level1Path, 'utf8'));
const school = JSON.parse(fs.readFileSync(schoolPath, 'utf8'));

const SCHOOL_EVIDENCE_ID = school.evidence_id;
const level1ByTerm = new Map(level1.entries.map((x) => [x.term, x]));
const schoolByTerm = new Map(
  school.map_crosswalk
    .filter((x) => x.map_expression && ['GRADE_3_6_SUPPORTED','GRADE_3_6_RELATED_FORM'].includes(x.support))
    .map((x) => [x.map_expression, x])
);

const aliases = new Map([['짜증나다', '짜증이 나다']]);
for (const term of map.terms) {
  if (aliases.has(term.expression)) term.expression = aliases.get(term.expression);
}

const registryMap = new Map(registry.entries.map((x) => [x.evidence_ref, x]));
for (const row of level1.entries) {
  if (!registryMap.has(row.evidence_ref)) {
    const entry = {
      evidence_ref: row.evidence_ref,
      source_type: 'official_dictionary',
      path: null,
      url: row.url,
    };
    registry.entries.push(entry);
    registryMap.set(entry.evidence_ref, entry);
  }
}

const depthByLevel = {1:'BASIC',2:'EXPANDED',3:'NUANCED'};
for (const term of map.terms) {
  if (term.level === 1 && term.status === 'DISCOVERY_ONLY') {
    const lexical = level1ByTerm.get(term.expression);
    if (!lexical) throw new Error(`Unverified Level 1 lexical evidence missing: ${term.expression}`);
    term.status = 'SOURCE_VERIFIED';
    term.evidence_ref = lexical.evidence_ref;
    term.note = lexical.match_type === 'EXACT_HEADWORD' || lexical.match_type === 'EXACT_HEADWORD_HOMONYM'
      ? '2026-09-21 국립국어원 한국어기초사전의 표제어·뜻풀이를 직접 확인한 기본 표현.'
      : '2026-09-21 국립국어원 한국어기초사전의 공식 문형·결합·예문 근거를 직접 확인한 기본 표현.';
  }
  if (term.level === 1 && term.status === 'SOURCE_VERIFIED' && !term.evidence_ref) {
    throw new Error(`Verified Level 1 term has no evidence_ref: ${term.expression}`);
  }

  const schoolRow = schoolByTerm.get(term.expression);
  let schoolState;
  if (schoolRow?.support === 'GRADE_3_6_SUPPORTED') schoolState = 'GRADE_3_6_SUPPORTED';
  else if (schoolRow?.support === 'GRADE_3_6_RELATED_FORM') schoolState = 'GRADE_3_6_RELATED_FORM';
  else if (term.status === 'SOURCE_VERIFIED') schoolState = 'LEXICAL_ONLY';
  else schoolState = 'AGE_REVIEW_REQUIRED';

  const refs = [];
  if (term.evidence_ref) refs.push(term.evidence_ref);
  if (schoolRow) refs.push(SCHOOL_EVIDENCE_ID);

  term.learning_profile = {
    lexical_depth: depthByLevel[term.level],
    school_age_evidence: schoolState,
    evidence_refs: [...new Set(refs)],
    school_age_source_form: schoolRow?.source_form || null,
  };
}

registry.entries.sort((a,b) => a.evidence_ref.localeCompare(b.evidence_ref, 'en'));

fs.writeFileSync(mapPath, JSON.stringify(map, null, 2) + '\n');
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');

const counts = map.terms.reduce((acc, term) => {
  acc.verified += term.status === 'SOURCE_VERIFIED' ? 1 : 0;
  acc.discovery += term.status === 'DISCOVERY_ONLY' ? 1 : 0;
  acc[term.learning_profile.school_age_evidence] = (acc[term.learning_profile.school_age_evidence] || 0) + 1;
  return acc;
}, {verified:0, discovery:0});

console.log(JSON.stringify({
  status: 'PASS',
  level1_count: map.terms.filter((x) => x.level === 1).length,
  level1_verified: map.terms.filter((x) => x.level === 1 && x.status === 'SOURCE_VERIFIED').length,
  total_verified: counts.verified,
  discovery_only: counts.discovery,
  school_age_direct: counts.GRADE_3_6_SUPPORTED || 0,
  school_age_related: counts.GRADE_3_6_RELATED_FORM || 0,
  lexical_only: counts.LEXICAL_ONLY || 0,
  age_review_required: counts.AGE_REVIEW_REQUIRED || 0,
  canonicalized: {from:'짜증나다',to:'짜증이 나다'},
  registry_count: registry.entries.length,
}, null, 2));
