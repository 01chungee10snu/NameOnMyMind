#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const fail = (m) => { throw new Error(m); };
const ids = ['C0021','C0022','C0023','C0024','C0025'];
const terms = ['Torschlusspanik','舍不得','тоска','обида','طَرَب'];
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(read('schema/g5-foreign-research-record.schema.json'));
const refs = new Map(read('content/approved/references.json').references.map((x) => [x.reference_id, x]));
const assets = read('content/approved/assets.json').assets;
const batch = read('content/g5/batches/02_foreign_semantic_gap_research.json');
const cfg = read('content/g5/batches/02_foreign_semantic_gap_config.json');

if (batch.batch_id !== 'G5-F02-FOREIGN-SEMANTIC-GAP') fail('batch id mismatch');
if (batch.status !== 'RESEARCH_CORE_PASS_PRODUCT_GATES_HOLD' || batch.public_promotion_authorized !== false) fail('batch boundary invalid');
if (JSON.stringify(batch.card_ids) !== JSON.stringify(ids) || JSON.stringify(batch.terms) !== JSON.stringify(terms)) fail('batch identity mismatch');
if (batch.review_ready !== 0) fail('batch must not be REVIEW_READY');
if (cfg.cards.length !== 5 || cfg.references.length !== 15) fail('batch config shape mismatch');
const screened = new Map(batch.screened_out.map((x) => [x.term, x]));
if (!screened.has('vergüenza ajena') || !/대리 수치/.test(screened.get('vergüenza ajena').reason)) fail('secondhand-embarrassment near-equivalent screening is missing');
if (!screened.has('委屈') || !/억울하다/.test(screened.get('委屈').reason)) fail('委屈 direct-Korean-comparison hold is missing');

for (let i = 0; i < ids.length; i += 1) {
  const id = ids[i];
  const rr = read(`content/g5/research-records/${id}.json`);
  if (!validate(rr)) fail(`${id} schema: ${JSON.stringify(validate.errors)}`);
  if (rr.schema_version !== '2.1.0' || rr.candidate.term !== terms[i]) fail(`${id} identity/schema mismatch`);
  if (rr.lifecycle_state !== 'HOLD' || rr.distinctiveness_review.track !== 'FOREIGN_KOREAN_GAP') fail(`${id} state/track mismatch`);
  if (rr.distinctiveness_review.status !== 'PASS' || rr.distinctiveness_review.generic_basic_emotion !== false) fail(`${id} distinctiveness boundary invalid`);
  const cost = rr.distinctiveness_review.korean_expression_cost;
  if (cost.status !== 'PASS' || cost.classification !== 'EXPLANATORY_PHRASE_REQUIRED') fail(`${id} must pass EXPLANATORY_PHRASE_REQUIRED`);
  if (cost.natural_korean_rendering.length < 30 || cost.residue_dimensions.length < 3 || cost.reference_ids.length < 2) fail(`${id} Korean Expression Cost evidence too thin`);
  if (rr.comparisons.ko.status !== 'PASS') fail(`${id} Korean comparison must PASS`);
  if (id === 'C0022' && rr.comparisons.zh.status !== 'PASS') fail('舍不得 target-language Chinese comparison must PASS');
  for (const locale of ['en','ja']) if (rr.comparisons[locale].status !== 'HOLD') fail(`${id} ${locale} comparison should remain HOLD pending independent lexical verification`);
  if (id !== 'C0022' && rr.comparisons.zh.status !== 'HOLD') fail(`${id} Chinese comparison should remain HOLD pending independent lexical verification`);
  if (rr.pronunciation_verification.status !== 'HOLD' || rr.pronunciation_verification.audio_asset_id !== null) fail(`${id} pronunciation/audio boundary invalid`);
  if (rr.automated_gates.pronunciation !== 'HOLD' || rr.automated_gates.rights !== 'HOLD') fail(`${id} product audio gates must remain HOLD`);
  if (rr.human_editorial_release.status !== 'PENDING' || rr.human_editorial_release.reviewer !== null) fail(`${id} Human Release opened too early`);
  if (assets.some((a) => a.card_id === id)) fail(`${id} has product asset before rights verification`);
  if (fs.existsSync(path.join(ROOT, `content/review/cards/${id}.json`)) || fs.existsSync(path.join(ROOT, `public/data/cards/${id}.json`))) fail(`${id} leaked toward review/public`);

  const refIds = new Set([
    ...rr.source_inventory.map((x) => x.reference_id),
    ...rr.distinctiveness_review.residue_reference_ids,
    ...rr.distinctiveness_review.korean_expression_cost.reference_ids,
    ...rr.pronunciation_verification.reference_ids,
  ]);
  for (const rid of refIds) if (!refs.has(rid)) fail(`${id} missing registry reference ${rid}`);
  const scholarly = rr.source_inventory.filter((x) => x.role === 'scholarly');
  if (scholarly.length < 1) fail(`${id} scholarly support missing`);
  for (const x of scholarly) if (refs.get(x.reference_id)?.source_type !== 'scholarly') fail(`${id} scholarly registry mismatch ${x.reference_id}`);
}

const publicCards = read('public/BUILD_MANIFEST.json').card_ids;
if (JSON.stringify(publicCards) !== JSON.stringify(['C0001','C0002','C0003','C0004','C0005'])) fail('public boundary changed');

console.log(JSON.stringify({
  status: 'PASS',
  batch_id: batch.batch_id,
  card_ids: ids,
  expression_cost: '5/5 EXPLANATORY_PHRASE_REQUIRED',
  screened_out: batch.screened_out,
  review_ready: 0,
  product_assets_registered: 0,
  public_cards: publicCards,
}, null, 2));
