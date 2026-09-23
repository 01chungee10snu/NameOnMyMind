#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/korean-expression/emotion-map-v1.json'), 'utf8'));
const evidenceDir = path.join(ROOT, 'content/korean-expression/evidence');
const outputPath = path.join(ROOT, 'content/korean-expression/simple-meanings-v1.json');
const evidenceRegistry = JSON.parse(fs.readFileSync(path.join(evidenceDir, 'registry.json'), 'utf8'));
const evidenceRegistryMap = new Map(evidenceRegistry.entries.map((row) => [row.evidence_ref, row]));

const decode = (s) => s
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/\s+/g, ' ')
  .trim();

const meanings = new Map();
for (const name of fs.readdirSync(evidenceDir).filter((name) => name.endsWith('.json'))) {
  const filePath = path.join(evidenceDir, name);
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  for (const row of Array.isArray(json.entries) ? json.entries : []) {
    if (!row.term || !row.selected_definition) continue;
    if (!meanings.has(row.term)) meanings.set(row.term, {
      meaning: row.selected_definition,
      source: row.evidence_ref || null,
      wording: 'SOURCE_DEFINITION',
    });
  }
}

const editorialFallbacks = {
  '뿌듯하다': '기쁘고 자랑스러워 마음이 든든하다.',
  '후련하다': '답답하거나 걱정되던 것이 풀려 마음이 시원하다.',
  '아쉽다': '무언가 부족하거나 끝나 버려 마음에 남는다.',
  '서운하다': '기대했던 만큼 되지 않아 마음이 상하고 아쉽다.',
  '섭섭하다': '상대의 태도나 이별 때문에 서운하고 아쉽다.',
  '억울하다': '잘못이 없거나 부당한 일을 당해 답답하고 속상하다.',
  '멋쩍다': '어색하거나 쑥스러워 자연스럽지 못하다.',
  '착잡하다': '여러 생각과 감정이 뒤섞여 마음이 복잡하다.',
  '시원섭섭하다': '후련하면서도 한편으로는 아쉽다.',
  '뭉클하다': '감동이 북받쳐 가슴이 벅차다.',
};
for (const [term, meaning] of Object.entries(editorialFallbacks)) {
  if (!meanings.has(term)) {
    const mapTerm = map.terms.find((row) => row.expression === term);
    meanings.set(term, {
      meaning,
      source: mapTerm?.evidence_ref || null,
      wording: 'EDITORIAL_SIMPLIFICATION',
    });
  }
}

async function fetchKrdictDefinition(evidenceRef) {
  const id = evidenceRef.split(':')[1];
  const url = `https://krdict.korean.go.kr/eng/dicSearch/SearchView?ParaWordNo=${id}&nation=eng`;
  const response = await fetch(url, { headers: { 'user-agent': 'NameOnMyMind-evidence-build/1.0' } });
  if (!response.ok) throw new Error(`KRD HTTP ${response.status}: ${evidenceRef}`);
  const html = await response.text();
  const matches = [...html.matchAll(/<p class="senseDef[^"]*"[^>]*>([\s\S]*?)<\/p>/g)];
  for (const match of matches) {
    const text = decode(match[1]).replace(/^\d+\s*\.\s*/, '');
    if (/[가-힣]/.test(text) && text.length >= 4) return { meaning: text, url };
  }
  throw new Error(`KRD definition not found: ${evidenceRef}`);
}

async function mapLimit(items, limit, fn) {
  let index = 0;
  const results = new Array(items.length);
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const current = index++;
      if (current >= items.length) return;
      results[current] = await fn(items[current], current);
    }
  });
  await Promise.all(workers);
  return results;
}

const unresolved = map.terms.filter((term) => !meanings.has(term.expression));
await mapLimit(unresolved, 8, async (term) => {
  let krdictRef = term.evidence_ref || '';
  if (!/^KRD:\d+$/.test(krdictRef)) {
    const registryRow = evidenceRegistryMap.get(krdictRef);
    const match = registryRow?.url?.match(/ParaWordNo=(\d+)/);
    if (match) krdictRef = `KRD:${match[1]}`;
  }
  if (!/^KRD:\d+$/.test(krdictRef)) {
    throw new Error(`simple meaning requires explicit fallback: ${term.id} ${term.expression} ${term.evidence_ref || ''}`);
  }
  const fetched = await fetchKrdictDefinition(krdictRef);
  meanings.set(term.expression, {
    meaning: fetched.meaning,
    source: term.evidence_ref,
    wording: 'SOURCE_DEFINITION',
  });
});

const rows = map.terms.map((term) => {
  const item = meanings.get(term.expression);
  if (!item) throw new Error(`simple meaning missing: ${term.id} ${term.expression}`);
  return {
    id: term.id,
    expression: term.expression,
    meaning: item.meaning,
    evidence_ref: term.evidence_ref,
    wording: item.wording,
  };
});

const result = {
  schema_version: '1.0.0',
  meanings_id: 'KOREAN_SIMPLE_MEANINGS_V1_2026-09-24',
  purpose: 'Short meanings for the simple Korean learning surface. Dictionary-backed rows preserve official definitions. A small set of G5 research-record terms uses concise editorial wording grounded in the verified research record.',
  term_count: rows.length,
  source_definition_count: rows.filter((x) => x.wording === 'SOURCE_DEFINITION').length,
  editorial_simplification_count: rows.filter((x) => x.wording === 'EDITORIAL_SIMPLIFICATION').length,
  entries: rows,
};

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({
  status: 'PASS',
  term_count: rows.length,
  source_definition_count: result.source_definition_count,
  editorial_simplification_count: result.editorial_simplification_count,
  fetched_krdict_count: unresolved.length,
  output: outputPath,
}, null, 2));
