#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const mapPath = path.join(ROOT, 'content/korean-expression/emotion-map-v1.json');
const registryPath = path.join(ROOT, 'content/korean-expression/evidence/registry.json');

const map = read('content/korean-expression/emotion-map-v1.json');
const registry = read('content/korean-expression/evidence/registry.json');
const level2 = read('content/korean-expression/evidence/level2-followup-source-v2.json');
const level3 = read('content/korean-expression/evidence/level3-followup-source-v4.json');

if (level2.snapshot_id !== 'KOREAN_LEVEL2_FOLLOWUP_EVIDENCE_V2_2026-09-23') throw new Error('Level 2 follow-up snapshot mismatch');
if (level3.snapshot_id !== 'KOREAN_LEVEL3_FOLLOWUP_EVIDENCE_V4_2026-09-23') throw new Error('Level 3 follow-up v4 snapshot mismatch');
if (level2.entries.length !== 3 || level3.entries.length !== 12) throw new Error('headword follow-up evidence row count mismatch');

const registryMap = new Map(registry.entries.map((x) => [x.evidence_ref, x]));
const promoted = [];

for (const row of [...level2.entries, ...level3.entries]) {
  const term = map.terms.find((x) => x.expression === row.term);
  if (!term) throw new Error(`map term missing: ${row.term}`);
  if (term.level !== row.level || term.status !== 'DISCOVERY_ONLY') throw new Error(`${row.term}: pre-promotion state mismatch`);

  term.status = 'SOURCE_VERIFIED';
  term.evidence_ref = row.evidence_ref;
  term.note = '2026-09-23 국립국어원 한국어기초사전 배포 데이터의 정확한 표제어 ID와 감정 의미 뜻풀이를 확인한 표현.';

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
  promoted.push(row.term);
}

registry.entries.sort((a,b) => a.evidence_ref.localeCompare(b.evidence_ref, 'en'));

const counts = {
  source_verified: map.terms.filter((x) => x.status === 'SOURCE_VERIFIED').length,
  discovery_only: map.terms.filter((x) => x.status === 'DISCOVERY_ONLY').length,
  level2_verified: map.terms.filter((x) => x.level === 2 && x.status === 'SOURCE_VERIFIED').length,
  level2_hold: map.terms.filter((x) => x.level === 2 && x.status === 'DISCOVERY_ONLY').length,
  level3_verified: map.terms.filter((x) => x.level === 3 && x.status === 'SOURCE_VERIFIED').length,
  level3_hold: map.terms.filter((x) => x.level === 3 && x.status === 'DISCOVERY_ONLY').length,
};

if (counts.source_verified !== 134 || counts.discovery_only !== 17) throw new Error('post-headword total count mismatch');
if (counts.level2_verified !== 61 || counts.level2_hold !== 11) throw new Error('post-headword Level 2 count mismatch');
if (counts.level3_verified !== 35 || counts.level3_hold !== 6) throw new Error('post-headword Level 3 count mismatch');

fs.writeFileSync(mapPath, JSON.stringify(map, null, 2) + '\n');
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');

console.log(JSON.stringify({ status: 'PASS', promoted, ...counts, registry_count: registry.entries.length }, null, 2));
