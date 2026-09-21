#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mapPath = path.join(ROOT, 'content/korean-expression/emotion-map-v1.json');
const registryPath = path.join(ROOT, 'content/korean-expression/evidence/registry.json');
const evidencePath = path.join(ROOT, 'content/korean-expression/evidence/level2-exact-source-v1.json');

const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));

if (evidence.snapshot_id !== 'KOREAN_LEVEL2_EXACT_EVIDENCE_V1_2026-09-22') {
  throw new Error('Level 2 evidence snapshot mismatch');
}
if (evidence.entries.length !== 22) throw new Error('Expected exactly 22 admitted Level 2 evidence rows');

const byTerm = new Map(evidence.entries.map((x) => [x.term, x]));
const registryMap = new Map(registry.entries.map((x) => [x.evidence_ref, x]));

for (const row of evidence.entries) {
  const term = map.terms.find((x) => x.expression === row.term);
  if (!term) throw new Error(`Map term missing: ${row.term}`);
  if (term.level !== 2) throw new Error(`${row.term}: expected Level 2`);
  if (term.status !== 'DISCOVERY_ONLY') throw new Error(`${row.term}: expected DISCOVERY_ONLY before promotion`);

  term.status = 'SOURCE_VERIFIED';
  term.evidence_ref = row.evidence_ref;
  term.note = '2026-09-22 국립국어원 한국어기초사전의 정확한 표제어·뜻풀이를 직접 확인한 확장 표현.';

  const refs = new Set(term.learning_profile?.evidence_refs || []);
  refs.add(row.evidence_ref);
  term.learning_profile.evidence_refs = [...refs];
  if (term.learning_profile.school_age_evidence === 'AGE_REVIEW_REQUIRED') {
    term.learning_profile.school_age_evidence = 'LEXICAL_ONLY';
  }

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

for (const unresolved of evidence.unresolved_terms) {
  const term = map.terms.find((x) => x.expression === unresolved);
  if (!term) throw new Error(`Unresolved map term missing: ${unresolved}`);
  if (term.status !== 'DISCOVERY_ONLY') throw new Error(`${unresolved}: unresolved term must remain DISCOVERY_ONLY`);
}

registry.entries.sort((a,b) => a.evidence_ref.localeCompare(b.evidence_ref, 'en'));

fs.writeFileSync(mapPath, JSON.stringify(map, null, 2) + '\n');
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');

console.log(JSON.stringify({
  status: 'PASS',
  promoted_level2_terms: evidence.entries.length,
  unresolved_level2_terms: evidence.unresolved_terms.length,
  source_verified_count: map.terms.filter((x) => x.status === 'SOURCE_VERIFIED').length,
  discovery_only_count: map.terms.filter((x) => x.status === 'DISCOVERY_ONLY').length,
  level2_verified_count: map.terms.filter((x) => x.level === 2 && x.status === 'SOURCE_VERIFIED').length,
  level2_discovery_count: map.terms.filter((x) => x.level === 2 && x.status === 'DISCOVERY_ONLY').length,
  lexical_only_count: map.terms.filter((x) => x.learning_profile.school_age_evidence === 'LEXICAL_ONLY').length,
  age_review_required_count: map.terms.filter((x) => x.learning_profile.school_age_evidence === 'AGE_REVIEW_REQUIRED').length,
  registry_count: registry.entries.length,
}, null, 2));
