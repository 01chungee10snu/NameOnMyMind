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

function compile(schemaRel) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(readJson(schemaRel));
}
const validateKorean = compile('schema/g5-research-record.schema.json');
const validateForeign = compile('schema/g5-foreign-research-record.schema.json');
const refs = readJson('content/approved/references.json').references;
const refMap = new Map(refs.map((x) => [x.reference_id, x]));
const assets = readJson('content/approved/assets.json').assets;
const registeredAssetPaths = new Set(assets.map((x) => x.path));
const secondary = readJson('content/g5/secondary-korean-research.json');
const secondaryIds = new Set(secondary.card_ids);
const anchorIds = new Set(['C0006','C0007','C0008','C0009','C0010']);

if (secondary.status !== 'SECONDARY_RESEARCH_ONLY' || secondary.public_promotion_authorized !== false) fail('secondary Korean research boundary invalid');
if (JSON.stringify(secondary.card_ids) !== JSON.stringify(['C0011','C0012','C0013','C0014','C0015'])) fail('secondary Korean ID set mismatch');
if (files.length < 15) fail(`expected at least 15 G5 research records, got ${files.length}`);

const seen = new Set();
const rows = [];
for (const name of files) {
  const rr = readJson(`content/g5/research-records/${name}`);
  const foreign = rr.schema_version === '2.1.0';
  const validate = foreign ? validateForeign : validateKorean;
  if (!['2.0.0','2.1.0'].includes(rr.schema_version)) fail(`${name}: unsupported research schema ${rr.schema_version}`);
  if (!validate(rr)) fail(`${name}: schema validation failed: ${JSON.stringify(validate.errors)}`);
  if (seen.has(rr.card_id)) fail(`duplicate G5 card_id ${rr.card_id}`);
  seen.add(rr.card_id);
  const numericId = Number(rr.card_id.slice(1));
  if (numericId < 6 || numericId > 57) fail(`${rr.card_id} outside G5 C0006-C0057 range`);
  if (rr.lifecycle_state !== 'HOLD') fail(`${rr.card_id} must remain HOLD until full product gates pass`);
  if (rr.distinctiveness_review.status !== 'PASS') fail(`${rr.card_id} distinctiveness not PASS`);
  if (rr.distinctiveness_review.generic_basic_emotion !== false) fail(`${rr.card_id} generic/basic emotion candidate leaked into G5`);
  if (rr.pronunciation_verification.status !== 'HOLD' || rr.pronunciation_verification.audio_asset_id !== null) fail(`${rr.card_id} pronunciation boundary invalid`);
  if (rr.automated_gates.pronunciation !== 'HOLD' || rr.automated_gates.rights !== 'HOLD') fail(`${rr.card_id} pronunciation/rights must remain HOLD`);
  for (const gate of ['schema','evidence','cultural_humility','privacy']) if (rr.automated_gates[gate] !== 'PASS') fail(`${rr.card_id} ${gate} gate must PASS`);
  if (rr.human_editorial_release.status !== 'PENDING' || rr.human_editorial_release.reviewer !== null) fail(`${rr.card_id} human release must remain unopened/PENDING`);
  if (fs.existsSync(path.join(ROOT, `content/review/cards/${rr.card_id}.json`))) fail(`${rr.card_id} leaked into REVIEW_READY cards`);
  if (fs.existsSync(path.join(ROOT, `content/approved/cards/${rr.card_id}.json`))) fail(`${rr.card_id} leaked into approved cards`);
  if (fs.existsSync(path.join(ROOT, `public/data/cards/${rr.card_id}.json`))) fail(`${rr.card_id} leaked into public projection`);

  if (foreign) {
    if (numericId < 16) fail(`${rr.card_id} foreign cards may not reuse Korean research IDs below C0016`);
    if (rr.distinctiveness_review.track !== 'FOREIGN_KOREAN_GAP') fail(`${rr.card_id} foreign record has wrong track`);
    const cost = rr.distinctiveness_review.korean_expression_cost;
    if (!cost || cost.status !== 'PASS') fail(`${rr.card_id} Korean Expression Cost must PASS`);
    if (!['SHORT_PHRASE_PARTIAL','EXPLANATORY_PHRASE_REQUIRED'].includes(cost.classification)) fail(`${rr.card_id} Korean Expression Cost class is not admission-eligible`);
    if (cost.nearest_korean_terms.length < 1 || cost.natural_korean_rendering.length < 20 || cost.residue_dimensions.length < 1) fail(`${rr.card_id} Korean Expression Cost evidence is too thin`);
    if (rr.comparisons.ko.status !== 'PASS') fail(`${rr.card_id} Korean comparison must PASS before foreign research admission`);
    for (const locale of ['en','zh','ja']) if (!['PASS','HOLD'].includes(rr.comparisons[locale].status)) fail(`${rr.card_id} ${locale} comparison has invalid research-stage state`);
  } else {
    if (!anchorIds.has(rr.card_id) && !secondaryIds.has(rr.card_id)) fail(`${rr.card_id} Korean record is outside anchor/secondary sets`);
    if (rr.distinctiveness_review.track !== 'KOREAN_NUANCE') fail(`${rr.card_id} Korean record has wrong track`);
    for (const locale of ['ko','en','zh','ja']) if (rr.comparisons[locale].status !== 'PASS') fail(`${rr.card_id} Korean ${locale} comparison incomplete`);
  }

  const allRefIds = new Set([
    ...rr.source_inventory.map((x) => x.reference_id),
    ...rr.lexical_verification.reference_ids,
    ...rr.semantic_definition_and_boundaries.reference_ids,
    ...rr.cultural_context_review.reference_ids,
    ...rr.pronunciation_verification.reference_ids,
    ...rr.distinctiveness_review.residue_reference_ids,
    ...(foreign ? rr.distinctiveness_review.korean_expression_cost.reference_ids : []),
    ...rr.claim_source_map.flatMap((x) => x.reference_ids),
    ...Object.values(rr.comparisons).flatMap((x) => x.reference_ids),
  ]);
  for (const id of allRefIds) if (!refMap.has(id)) fail(`${rr.card_id} missing reference ${id}`);
  if (!rr.distinctiveness_review.semantic_residue || rr.distinctiveness_review.semantic_residue.length < 30) fail(`${rr.card_id} semantic residue too thin`);
  if (!rr.distinctiveness_review.overclaim_to_avoid || rr.distinctiveness_review.overclaim_to_avoid.length < 20) fail(`${rr.card_id} overclaim boundary too thin`);
  for (const locale of ['ko','en','zh','ja']) {
    const c = rr.comparisons[locale];
    if (c.near_terms.length < 1 || c.reference_ids.length < 1) fail(`${rr.card_id} ${locale} comparison payload incomplete`);
  }
  rows.push({
    card_id: rr.card_id,
    term: rr.candidate.term,
    track: rr.distinctiveness_review.track,
    status: rr.lifecycle_state,
    distinctiveness: rr.distinctiveness_review.status,
    korean_expression_cost: foreign ? rr.distinctiveness_review.korean_expression_cost.classification : null,
  });
}

for (const id of secondaryIds) {
  if (!seen.has(id)) fail(`secondary Korean research missing ${id}`);
  if (fs.existsSync(path.join(ROOT, `content/review/cards/${id}.json`)) || fs.existsSync(path.join(ROOT, `public/data/cards/${id}.json`))) fail(`${id} secondary research leaked toward publication`);
}

const pron = readJson('content/g5/korean-pronunciation-provenance-canary.json');
for (const item of pron.items) if (registeredAssetPaths.has(item.local_path)) fail(`unresolved Krdict audio registered as product asset: ${item.local_path}`);
const publicManifest = readJson('public/BUILD_MANIFEST.json');
if (JSON.stringify(publicManifest.card_ids) !== JSON.stringify(['C0001','C0002','C0003','C0004','C0005'])) fail('public projection changed during G5 HOLD research');

const counts = rows.reduce((m, r) => { m[r.track] = (m[r.track] || 0) + 1; return m; }, {});
console.log(JSON.stringify({ status: 'PASS', record_count: rows.length, track_counts: counts, rows, public_cards: publicManifest.card_ids, unresolved_product_audio_registered: 0 }, null, 2));
