#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const fail = (msg) => { throw new Error(msg); };
const ids = ['C0006','C0007','C0008','C0009','C0010'];
const expectedTerms = ['서운하다','아쉽다','섭섭하다','뿌듯하다','뭉클하다'];

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const schema = readJson('schema/g5-research-record.schema.json');
const validate = ajv.compile(schema);
const refs = readJson('content/approved/references.json').references;
const refMap = new Map(refs.map((x) => [x.reference_id, x]));
const assetRegistry = readJson('content/approved/assets.json');
const assets = assetRegistry.assets;
const registeredAssetPaths = new Set(assets.map((x) => x.path));
const referenceRegistry = readJson('content/approved/references.json');
const hashJsonValue = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const approvedCards = fs.readdirSync(path.join(ROOT, 'content/approved/cards')).filter((x) => x.endsWith('.json')).sort().map((name) => readJson(`content/approved/cards/${name}`));
const batch = readJson('content/g5/batches/01_korean_nuance_research.json');
const pron = readJson('content/g5/korean-pronunciation-provenance-canary.json');

if (schema.$id !== 'urn:nameonmymind:schema:research-record:v2.0.0') fail('unexpected G5 Research Record schema id');
if (!schema.required.includes('distinctiveness_review')) fail('G5 schema does not require distinctiveness_review');
if (batch.status !== 'RESEARCH_ADMITTED_AUDIO_RIGHTS_HOLD') fail('batch is not in expected research/audio-rights HOLD state');
if (JSON.stringify(batch.reserved_card_ids) !== JSON.stringify(ids)) fail('reserved card IDs mismatch');
if (pron.product_linkage_authorized !== false || pron.rights_gate !== 'HOLD_MULTIMEDIA_FILE_LEVEL_RIGHTS_UNRESOLVED') fail('pronunciation rights ledger is not fail-closed');

for (let i = 0; i < ids.length; i += 1) {
  const id = ids[i];
  const rel = `content/g5/research-records/${id}.json`;
  const rr = readJson(rel);
  if (!validate(rr)) fail(`${id} schema: ${ajv.errorsText(validate.errors, { separator: '\n' })}`);
  if (rr.card_id !== id || rr.candidate.term !== expectedTerms[i]) fail(`${id} identity mismatch`);
  if (rr.lifecycle_state !== 'HOLD') fail(`${id} must remain HOLD`);
  if (rr.distinctiveness_review.status !== 'PASS') fail(`${id} distinctiveness must PASS for research admission`);
  if (rr.distinctiveness_review.track !== 'KOREAN_NUANCE') fail(`${id} must use KOREAN_NUANCE track`);
  if (rr.distinctiveness_review.generic_basic_emotion !== false) fail(`${id} must not be a generic/basic emotion candidate`);
  if (rr.pronunciation_verification.status !== 'HOLD' || rr.pronunciation_verification.audio_asset_id !== null) fail(`${id} pronunciation must remain HOLD with null product audio asset`);
  if (rr.automated_gates.pronunciation !== 'HOLD' || rr.automated_gates.rights !== 'HOLD') fail(`${id} pronunciation/rights gates must remain HOLD`);
  for (const k of ['schema','evidence','cultural_humility','privacy']) if (rr.automated_gates[k] !== 'PASS') fail(`${id} ${k} should PASS`);
  if (rr.human_editorial_release.status !== 'PENDING' || rr.human_editorial_release.reviewer !== null) fail(`${id} human release must remain PENDING`);
  const allRefs = new Set([
    ...rr.source_inventory.map((x) => x.reference_id),
    ...rr.lexical_verification.reference_ids,
    ...rr.semantic_definition_and_boundaries.reference_ids,
    ...rr.cultural_context_review.reference_ids,
    ...rr.pronunciation_verification.reference_ids,
    ...rr.distinctiveness_review.residue_reference_ids,
    ...rr.claim_source_map.flatMap((x) => x.reference_ids),
    ...Object.values(rr.comparisons).flatMap((x) => x.reference_ids),
  ]);
  for (const refId of allRefs) if (!refMap.has(refId)) fail(`${id} references missing registry entry ${refId}`);
  for (const refId of rr.distinctiveness_review.residue_reference_ids) {
    const r = refMap.get(refId);
    if (!['lexical','scholarly'].includes(r.source_type)) fail(`${id} distinctiveness reference ${refId} is not lexical/scholarly`);
  }
  for (const locale of ['ko','en','zh','ja']) {
    const c = rr.comparisons[locale];
    if (c.status !== 'PASS' || c.near_terms.length < 1 || c.reference_ids.length < 1) fail(`${id} comparison ${locale} incomplete`);
  }
  const batchItem = batch.items.find((x) => x.card_id === id);
  if (!batchItem) fail(`${id} missing batch item`);
  if (batchItem.audio_rights_status !== 'HOLD_FILE_LEVEL_CCL_UNRESOLVED') fail(`${id} batch audio rights not HOLD`);
  if (registeredAssetPaths.has(batchItem.audio_local_research_path)) fail(`${id} unresolved Krdict audio leaked into asset registry`);
  if (fs.existsSync(path.join(ROOT, `content/review/cards/${id}.json`))) fail(`${id} must not be REVIEW_READY`);
  if (fs.existsSync(path.join(ROOT, `content/approved/cards/${id}.json`))) fail(`${id} must not be PUBLISHED`);
  if (fs.existsSync(path.join(ROOT, `public/data/cards/${id}.json`))) fail(`${id} must not be public`);
}

const publicManifest = readJson('public/BUILD_MANIFEST.json');
if (JSON.stringify(publicManifest.card_ids) !== JSON.stringify(['C0001','C0002','C0003','C0004','C0005'])) fail('public boundary changed during G5 HOLD research');
const selectedRefIds = new Set(approvedCards.flatMap((card) => card.reference_ids));
const selectedAssetIds = new Set(approvedCards.flatMap((card) => [card.assets.illustration_asset_id, card.assets.share_asset_id, card.assets.audio_asset_id]));
const selectedRefs = refs.filter((ref) => selectedRefIds.has(ref.reference_id));
const selectedAssets = assets.filter((asset) => selectedAssetIds.has(asset.asset_id));
const refProjectionHash = hashJsonValue({ schema_version: referenceRegistry.schema_version, references: selectedRefs });
const assetProjectionHash = hashJsonValue({ schema_version: assetRegistry.schema_version, assets: selectedAssets });
if (publicManifest.input_sha256.references !== refProjectionHash) fail('public snapshot reference hash is not limited to the released projection');
if (publicManifest.input_sha256.assets !== assetProjectionHash) fail('public snapshot asset hash is not limited to the released projection');
if (!publicManifest.excluded_source_classes.includes('content/g5/**')) fail('public build manifest does not explicitly exclude G5 research sources');

// Contract can express honest HOLD without permitting a fake PASS.
const sampleHold = readJson('content/g5/research-records/C0006.json');
if (!validate(sampleHold)) fail('HOLD sample should validate');
const invalidPass = structuredClone(sampleHold);
invalidPass.pronunciation_verification.status = 'PASS';
invalidPass.pronunciation_verification.audio_asset_id = null;
if (validate(invalidPass)) fail('G5 schema incorrectly permits pronunciation PASS with null audio asset');

console.log(JSON.stringify({
  status: 'PASS',
  batch_id: batch.batch_id,
  research_records: ids,
  lifecycle: 'HOLD',
  distinctiveness: '5/5 PASS',
  pronunciation_rights: '5/5 HOLD',
  product_audio_registered: 0,
  review_ready: 0,
  public_cards: publicManifest.card_ids,
}, null, 2));
