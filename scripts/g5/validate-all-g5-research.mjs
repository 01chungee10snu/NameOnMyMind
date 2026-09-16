#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const fail = (m) => { throw new Error(m); };
const files = fs.readdirSync(path.join(ROOT, 'content/g5/research-records')).filter((x) => x.endsWith('.json')).sort();
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(readJson('schema/g5-research-record.schema.json'));
const refs = readJson('content/approved/references.json').references;
const refMap = new Map(refs.map((x) => [x.reference_id, x]));
const assets = readJson('content/approved/assets.json').assets;
const registeredAssetPaths = new Set(assets.map((x) => x.path));

if (files.length < 10) fail(`expected at least 10 G5 research records, got ${files.length}`);
const seen = new Set();
const rows = [];
for (const name of files) {
  const rr = readJson(`content/g5/research-records/${name}`);
  if (!validate(rr)) fail(`${name}: ${ajv.errorsText(validate.errors, { separator: '\n' })}`);
  if (seen.has(rr.card_id)) fail(`duplicate G5 card_id ${rr.card_id}`);
  seen.add(rr.card_id);
  if (!/^C00(0[6-9]|[1-4][0-9]|5[0-2])$/.test(rr.card_id)) fail(`${rr.card_id} outside G5 C0006-C0052 range`);
  if (rr.lifecycle_state !== 'HOLD') fail(`${rr.card_id} must remain HOLD until full product gates pass`);
  if (rr.distinctiveness_review.status !== 'PASS') fail(`${rr.card_id} distinctiveness not PASS`);
  if (rr.distinctiveness_review.track !== 'KOREAN_NUANCE') fail(`${rr.card_id} current Korean batches must be KOREAN_NUANCE`);
  if (rr.distinctiveness_review.generic_basic_emotion !== false) fail(`${rr.card_id} generic/basic emotion candidate leaked into G5`);
  if (rr.pronunciation_verification.status !== 'HOLD' || rr.pronunciation_verification.audio_asset_id !== null) fail(`${rr.card_id} pronunciation boundary invalid`);
  if (rr.automated_gates.pronunciation !== 'HOLD' || rr.automated_gates.rights !== 'HOLD') fail(`${rr.card_id} pronunciation/rights must remain HOLD`);
  for (const gate of ['schema', 'evidence', 'cultural_humility', 'privacy']) if (rr.automated_gates[gate] !== 'PASS') fail(`${rr.card_id} ${gate} gate must PASS`);
  if (rr.human_editorial_release.status !== 'PENDING' || rr.human_editorial_release.reviewer !== null) fail(`${rr.card_id} human release must remain unopened/PENDING`);
  if (fs.existsSync(path.join(ROOT, `content/review/cards/${rr.card_id}.json`))) fail(`${rr.card_id} leaked into REVIEW_READY cards`);
  if (fs.existsSync(path.join(ROOT, `content/approved/cards/${rr.card_id}.json`))) fail(`${rr.card_id} leaked into approved cards`);
  if (fs.existsSync(path.join(ROOT, `public/data/cards/${rr.card_id}.json`))) fail(`${rr.card_id} leaked into public projection`);

  const allRefIds = new Set([
    ...rr.source_inventory.map((x) => x.reference_id),
    ...rr.lexical_verification.reference_ids,
    ...rr.semantic_definition_and_boundaries.reference_ids,
    ...rr.cultural_context_review.reference_ids,
    ...rr.pronunciation_verification.reference_ids,
    ...rr.distinctiveness_review.residue_reference_ids,
    ...rr.claim_source_map.flatMap((x) => x.reference_ids),
    ...Object.values(rr.comparisons).flatMap((x) => x.reference_ids),
  ]);
  for (const id of allRefIds) if (!refMap.has(id)) fail(`${rr.card_id} missing reference ${id}`);
  if (!rr.distinctiveness_review.semantic_residue || rr.distinctiveness_review.semantic_residue.length < 30) fail(`${rr.card_id} semantic residue too thin`);
  if (!rr.distinctiveness_review.overclaim_to_avoid || rr.distinctiveness_review.overclaim_to_avoid.length < 20) fail(`${rr.card_id} overclaim boundary too thin`);
  for (const locale of ['ko','en','zh','ja']) {
    const c = rr.comparisons[locale];
    if (c.status !== 'PASS' || c.near_terms.length < 1 || c.reference_ids.length < 1) fail(`${rr.card_id} ${locale} comparison incomplete`);
  }
  rows.push({ card_id: rr.card_id, term: rr.candidate.term, status: rr.lifecycle_state, distinctiveness: rr.distinctiveness_review.status });
}

const pron = readJson('content/g5/korean-pronunciation-provenance-canary.json');
for (const item of pron.items) if (registeredAssetPaths.has(item.local_path)) fail(`unresolved Krdict audio registered as product asset: ${item.local_path}`);
const publicManifest = readJson('public/BUILD_MANIFEST.json');
if (JSON.stringify(publicManifest.card_ids) !== JSON.stringify(['C0001','C0002','C0003','C0004','C0005'])) fail('public projection changed during G5 HOLD research');

console.log(JSON.stringify({ status: 'PASS', record_count: rows.length, rows, public_cards: publicManifest.card_ids, unresolved_product_audio_registered: 0 }, null, 2));
