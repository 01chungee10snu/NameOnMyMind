#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mapPath = path.join(ROOT, 'content/korean-expression/emotion-map-v1.json');
const registryPath = path.join(ROOT, 'content/korean-expression/evidence/registry.json');
const evidencePath = path.join(ROOT, 'content/korean-expression/evidence/standard-dictionary-followup-v1.json');

const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));

if (evidence.snapshot_id !== 'KOREAN_STANDARD_DICTIONARY_FOLLOWUP_V1_2026-09-23') throw new Error('standard-dictionary follow-up snapshot mismatch');
if (evidence.entries.length !== 8) throw new Error('standard-dictionary follow-up must contain exactly eight admitted rows');

const registryMap = new Map(registry.entries.map((x) => [x.evidence_ref, x]));
const promoted = [];

for (const row of evidence.entries) {
  const previous = row.previous_expression || row.term;
  const term = map.terms.find((x) => x.expression === previous);
  if (!term) throw new Error(`map term missing: ${previous}`);
  if (term.level !== row.level || term.status !== 'DISCOVERY_ONLY') throw new Error(`${previous}: pre-promotion state mismatch`);

  if (previous !== row.term) {
    if (map.terms.some((x) => x !== term && x.expression === row.term)) throw new Error(`canonical expression already exists: ${row.term}`);
    term.expression = row.term;
  }

  term.status = 'SOURCE_VERIFIED';
  term.evidence_ref = row.evidence_ref;
  term.note = row.canonicalization_note
    ? `2026-09-23 국립국어원 표준국어대사전 근거에 따라 정규화·검증. ${row.canonicalization_note}`
    : '2026-09-23 국립국어원 표준국어대사전의 공식 표제어 또는 관용구와 뜻풀이를 직접 확인한 표현.';

  const refs = new Set(term.learning_profile?.evidence_refs || []);
  refs.add(row.evidence_ref);
  term.learning_profile.evidence_refs = [...refs];
  if (term.learning_profile.school_age_evidence === 'AGE_REVIEW_REQUIRED') {
    term.learning_profile.school_age_evidence = 'LEXICAL_ONLY';
  }

  if (!registryMap.has(row.evidence_ref)) {
    const entry = { evidence_ref: row.evidence_ref, source_type: 'official_dictionary', path: null, url: row.url };
    registry.entries.push(entry);
    registryMap.set(entry.evidence_ref, entry);
  }
  promoted.push({ previous, current: row.term, evidence_ref: row.evidence_ref });
}

registry.entries.sort((a,b) => a.evidence_ref.localeCompare(b.evidence_ref, 'en'));

const counts = {
  source_verified: map.terms.filter((x) => x.status === 'SOURCE_VERIFIED').length,
  discovery_only: map.terms.filter((x) => x.status === 'DISCOVERY_ONLY').length,
  level1_verified: map.terms.filter((x) => x.level === 1 && x.status === 'SOURCE_VERIFIED').length,
  level2_verified: map.terms.filter((x) => x.level === 2 && x.status === 'SOURCE_VERIFIED').length,
  level2_hold: map.terms.filter((x) => x.level === 2 && x.status === 'DISCOVERY_ONLY').length,
  level3_verified: map.terms.filter((x) => x.level === 3 && x.status === 'SOURCE_VERIFIED').length,
  level3_hold: map.terms.filter((x) => x.level === 3 && x.status === 'DISCOVERY_ONLY').length,
  age_review_required: map.terms.filter((x) => x.learning_profile?.school_age_evidence === 'AGE_REVIEW_REQUIRED').length,
};

if (counts.source_verified !== 151 || counts.discovery_only !== 0) throw new Error('post-standard-followup total count mismatch');
if (counts.level1_verified !== 38) throw new Error('Level 1 count mismatch');
if (counts.level2_verified !== 72 || counts.level2_hold !== 0) throw new Error('Level 2 final count mismatch');
if (counts.level3_verified !== 41 || counts.level3_hold !== 0) throw new Error('Level 3 final count mismatch');
if (counts.age_review_required !== 0) throw new Error('age-review final count mismatch');

fs.writeFileSync(mapPath, JSON.stringify(map, null, 2) + '\n');
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');

console.log(JSON.stringify({ status: 'PASS', promoted, ...counts, registry_count: registry.entries.length }, null, 2));
