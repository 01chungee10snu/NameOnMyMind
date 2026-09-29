#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { validateLearningVocabulary, resolveExpandedLearningDaily } from '../../src/domain/korean-learning.mjs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIR = path.join(ROOT, 'content/korean-expression');
const read = file => JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
const base = read('emotion-map-v1.json');
const meanings = read('simple-meanings-v1.json');
const extension = read('learning-expansion-v1.json');
const evidence = read('evidence/learning-expansion-source-v1.json');
const schedule = read('learning-daily-v3.json');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
for (const [file, expected] of Object.entries(extension.preserved_source_sha256)) {
  if (hash(fs.readFileSync(path.join(DIR, file))) !== expected) throw new Error(`Frozen source changed: ${file}`);
}
if (extension.entries.length !== extension.term_count || evidence.verified_count !== extension.term_count) throw new Error('Expansion count mismatch');
const families = new Set(base.families.map(row => row.id));
const sourceByWord = new Map(evidence.entries.map(row => [row.expression, row]));
if (sourceByWord.size !== extension.entries.length) throw new Error('Missing or duplicate dictionary evidence');
for (const row of extension.entries) {
  const source = sourceByWord.get(row.expression);
  if (!source || source.headword !== row.expression || source.evidence_ref !== row.evidence_ref || source.url !== row.source_url) throw new Error(`Wrong headword: ${row.id}`);
  if (!Number.isInteger(row.sense_number) || row.sense_number < 1 || row.selected_definition !== source.definitions[row.sense_number - 1] || row.sense_number !== source.selected_sense_number) throw new Error(`Wrong dictionary sense: ${row.id}`);
  if (!/^https:\/\/krdict\.korean\.go\.kr\/eng\/dicSearch\/SearchView\?ParaWordNo=\d+&nation=eng$/.test(row.source_url) || !source.checked_at || !/^[a-f0-9]{64}$/.test(source.html_sha256)) throw new Error(`Unverified source: ${row.id}`);
  if (!families.has(row.family_id) || row.wording !== 'EDITORIAL_SIMPLIFICATION' || row.age_review_status !== 'AGE_REVIEW_REQUIRED' || row.evidence_scope !== 'DICTIONARY_SENSE_ONLY') throw new Error(`Editorial boundary changed: ${row.id}`);
}
const meaningById = new Map(meanings.entries.map(row => [row.id, row]));
const entries = [
  ...base.terms.map(term => ({ ...meaningById.get(term.id), family_id: term.family_id, status: term.status, origin: 'BASE' })),
  ...extension.entries.map(({ selected_definition, sense_number, ...row }) => ({ ...row, origin: 'EXPANSION' })),
];
const allIds = new Set(entries.map(row => row.id));
for (const [id, related] of Object.entries(extension.related_overrides || {})) {
  if (!base.terms.some(row => row.id === id) || related.some(id => !allIds.has(id))) throw new Error('Invalid base comparison override');
  entries.find(row => row.id === id).related_ids = related;
}
const result = {
  schema_version: '1.0.0', vocabulary_id: 'KOREAN_LEARNING_VOCABULARY_V1_2026-09-30',
  purpose: 'Simple learner copy; dictionary sense verification does not establish age suitability or interchangeability of comparison words.',
  term_count: entries.length, base_term_count: base.terms.length, added_term_count: extension.entries.length,
  child_usability_tested: false, product_release_authorized: false, entries,
};
validateLearningVocabulary(result);
resolveExpandedLearningDaily(result, schedule, entries[0], new Date(2026, 9, 1));
if (hash(JSON.stringify(schedule.term_ids)) !== schedule.order_sha256) throw new Error('Daily order changed without a new snapshot');
const output = path.join(DIR, 'learning-vocabulary-v1.json');
const text = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (fs.readFileSync(output, 'utf8') !== text) throw new Error('Rebuild the learning vocabulary.');
} else fs.writeFileSync(output, text);
console.log(JSON.stringify({ status: 'PASS', term_count: entries.length, added: extension.entries.length, source_verified: evidence.verified_count }));
