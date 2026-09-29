#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Build only from the editorial snapshot. Never choose the first dictionary
// sense automatically: a valid headword is not proof of the intended meaning.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = rel => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const map = read('content/korean-expression/emotion-map-v1.json');
const copy = read('content/korean-expression/learning-copy-v1.json');
const registry = read('content/korean-expression/evidence/registry.json');
const refs = new Map(registry.entries.map(row => [row.evidence_ref, row]));
const byId = new Map(copy.entries.map(row => [row.id, row]));
if (byId.size !== copy.entries.length || byId.size !== map.terms.length) {
  throw new Error('Editorial copy must cover every term exactly once.');
}
const sourceUrl = ref => {
  if (/^KRD:\d+$/.test(ref)) return `https://krdict.korean.go.kr/eng/dicSearch/SearchView?ParaWordNo=${ref.split(':')[1]}&nation=eng`;
  if (/^STD:\d+$/.test(ref)) return `https://stdict.korean.go.kr/search/searchView.do?word_no=${ref.split(':')[1]}&searchKeywordTo=3`;
  const url = refs.get(ref)?.url || '';
  return /^https:\/\/(krdict|stdict)\.korean\.go\.kr\//.test(url) ? url : '';
};
const entries = map.terms.map(term => {
  const row = byId.get(term.id);
  if (!row || row.expression !== term.expression || row.evidence_ref !== term.evidence_ref) {
    throw new Error(`Editorial identity mismatch: ${term.id}`);
  }
  for (const [field, max] of [['meaning', 64], ['example', 90]]) {
    if (typeof row[field] !== 'string' || !row[field].trim() || [...row[field]].length > max) {
      throw new Error(`Missing or long ${field}: ${term.id}`);
    }
  }
  if (row.wording !== 'EDITORIAL_SIMPLIFICATION') throw new Error(`Copy provenance missing: ${term.id}`);
  if (!Array.isArray(row.related_ids) || row.related_ids.length !== 2 || new Set(row.related_ids).size !== 2 || row.related_ids.some(id => id === row.id || !byId.has(id))) throw new Error(`Invalid comparison pair: ${term.id}`);
  return {
    id: row.id,
    expression: row.expression,
    meaning: row.meaning,
    example: row.example,
    related_ids: row.related_ids,
    evidence_ref: row.evidence_ref,
    wording: row.wording,
    source_url: row.sense_selection?.url || sourceUrl(row.evidence_ref),
  };
});
const result = {
  schema_version: '1.1.0',
  meanings_id: 'KOREAN_SIMPLE_MEANINGS_V2_2026-09-29',
  purpose: 'Editorial learning meanings and original fictional examples; not verbatim dictionary definitions. Historical wording and sense corrections remain in learning-copy-v1.json.',
  term_count: entries.length,
  source_definition_count: 0,
  editorial_simplification_count: entries.length,
  example_count: entries.length,
  child_usability_tested: false,
  entries,
};
const output = path.join(ROOT, 'content/korean-expression/simple-meanings-v1.json');
const text = JSON.stringify(result, null, 2) + '\n';
if (process.argv.includes('--check')) {
  if (fs.readFileSync(output, 'utf8') !== text) throw new Error('Simple meanings are out of date. Run the builder.');
} else {
  fs.writeFileSync(output, text);
}
console.log(JSON.stringify({ status: 'PASS', terms: entries.length, examples: entries.length, mode: process.argv.includes('--check') ? 'check' : 'build' }));
