#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const mapPath = path.join(ROOT, 'content/korean-expression/emotion-map-v1.json');
const registryPath = path.join(ROOT, 'content/korean-expression/evidence/registry.json');
const evidencePath = path.join(ROOT, 'content/korean-expression/evidence/level3-followup-source-v2.json');

const map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));

if (evidence.snapshot_id !== 'KOREAN_LEVEL3_FOLLOWUP_EVIDENCE_V2_2026-09-22') throw new Error('follow-up evidence snapshot mismatch');
if (evidence.entries.length !== 1) throw new Error('follow-up evidence must contain exactly one admitted row');

const registryMap = new Map(registry.entries.map((x) => [x.evidence_ref, x]));
for (const row of evidence.entries) {
  const term = map.terms.find((x) => x.expression === row.term);
  if (!term) throw new Error(`map term missing: ${row.term}`);
  if (term.level !== row.level || term.status !== 'DISCOVERY_ONLY') throw new Error(`${row.term}: pre-promotion state mismatch`);

  term.status = 'SOURCE_VERIFIED';
  term.evidence_ref = row.evidence_ref;
  term.note = '2026-09-22 국립국어원 한국어기초사전의 정확한 표제어·뜻풀이를 후속 확인한 섬세 표현.';

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
}

registry.entries.sort((a,b) => a.evidence_ref.localeCompare(b.evidence_ref, 'en'));
fs.writeFileSync(mapPath, JSON.stringify(map, null, 2) + '\n');
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');

console.log(JSON.stringify({
  status: 'PASS',
  promoted: evidence.entries.map((x) => x.term),
  source_verified_count: map.terms.filter((x) => x.status === 'SOURCE_VERIFIED').length,
  discovery_only_count: map.terms.filter((x) => x.status === 'DISCOVERY_ONLY').length,
  level3_verified_count: map.terms.filter((x) => x.level === 3 && x.status === 'SOURCE_VERIFIED').length,
  level3_discovery_count: map.terms.filter((x) => x.level === 3 && x.status === 'DISCOVERY_ONLY').length,
  registry_count: registry.entries.length,
}, null, 2));
