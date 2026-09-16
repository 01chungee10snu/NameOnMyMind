#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const sha256 = (abs) => crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
const fail = (message) => { throw new Error(message); };
const scope = process.argv.includes('--scope=g1') ? 'g1' : 'all';

function compile(schemaRel) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(readJson(schemaRel));
}
function assertValid(validate, data, label) {
  if (!validate(data)) {
    const details = validate.errors?.map((e) => `${e.instancePath || '/'} ${e.message}`).join('; ');
    fail(`${label} schema validation failed: ${details}`);
  }
}
function uniqueBy(items, key, label) {
  const seen = new Set();
  for (const item of items) {
    const value = item[key];
    if (seen.has(value)) fail(`${label} duplicate ${key}: ${value}`);
    seen.add(value);
  }
}
function filesUnder(relDir, suffix = '.json') {
  const dir = path.join(ROOT, relDir);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((x) => x.endsWith(suffix)).sort().map((x) => path.join(dir, x));
}
function loadRecords(relDir) {
  return filesUnder(relDir).map((file) => ({ file, data: JSON.parse(fs.readFileSync(file, 'utf8')) }));
}

const cardValidate = compile('schema/card.schema.json');
const refValidate = compile('schema/reference.schema.json');
const assetValidate = compile('schema/asset.schema.json');
const researchValidate = compile('schema/research-record.schema.json');

const refs = readJson('content/approved/references.json');
const assets = readJson('content/approved/assets.json');
assertValid(refValidate, refs, 'reference registry');
assertValid(assetValidate, assets, 'asset registry');
uniqueBy(refs.references, 'reference_id', 'reference registry');
uniqueBy(assets.assets, 'asset_id', 'asset registry');
const refMap = new Map(refs.references.map((r) => [r.reference_id, r]));
const assetMap = new Map(assets.assets.map((a) => [a.asset_id, a]));

const reviewCards = loadRecords('content/review/cards');
const reviewResearch = loadRecords('content/review/research-records');
const approvedCards = loadRecords('content/approved/cards');
const approvedResearch = loadRecords('content/approved/research-records');
for (const x of [...reviewCards, ...approvedCards]) assertValid(cardValidate, x.data, path.relative(ROOT, x.file));
for (const x of [...reviewResearch, ...approvedResearch]) assertValid(researchValidate, x.data, path.relative(ROOT, x.file));
uniqueBy([...reviewCards, ...approvedCards].map((x) => x.data), 'card_id', 'all cards');
uniqueBy([...reviewResearch, ...approvedResearch].map((x) => x.data), 'card_id', 'all research records');

const reviewResearchMap = new Map(reviewResearch.map((x) => [x.data.card_id, x.data]));
const approvedResearchMap = new Map(approvedResearch.map((x) => [x.data.card_id, x.data]));

function validatePair(card, rr, expectedStage) {
  if (!rr) fail(`${card.card_id} missing ${expectedStage} research record`);
  const approved = expectedStage === 'approved';
  if (approved) {
    if (!['PUBLISHED', 'REVISED'].includes(card.status)) fail(`${card.card_id} approved card must be PUBLISHED/REVISED`);
    if (rr.lifecycle_state !== 'APPROVED' || rr.human_editorial_release?.status !== 'APPROVED') fail(`${card.card_id} approved source lacks Human Editorial Release APPROVED`);
    if (!rr.human_editorial_release?.reviewer || !rr.human_editorial_release?.reviewed_at) fail(`${card.card_id} approved source lacks human reviewer/date provenance`);
  } else {
    if (card.status !== 'REVIEW_READY') fail(`${card.card_id} review card must be REVIEW_READY`);
    if (rr.lifecycle_state !== 'REVIEW_READY' || rr.human_editorial_release?.status !== 'PENDING') fail(`${card.card_id} review source must remain REVIEW_READY/PENDING`);
  }

  for (const id of card.reference_ids) if (!refMap.has(id)) fail(`${card.card_id} missing reference ${id}`);
  for (const inv of rr.source_inventory) if (!refMap.has(inv.reference_id)) fail(`${card.card_id} research inventory missing reference ${inv.reference_id}`);
  for (const map of rr.claim_source_map) for (const id of map.reference_ids) if (!refMap.has(id)) fail(`${card.card_id} claim ${map.claim_id} missing reference ${id}`);

  const lexicalRefs = rr.lexical_verification.reference_ids.map((id) => refMap.get(id)).filter(Boolean);
  if (lexicalRefs.length < 1 || lexicalRefs.some((r) => r.source_type !== 'lexical')) fail(`${card.card_id} minimum lexical evidence gate failed`);
  const scholarlyRefs = card.reference_ids.map((id) => refMap.get(id)).filter((r) => r?.source_type === 'scholarly');
  if (scholarlyRefs.length < 1) fail(`${card.card_id} minimum scholarly evidence gate failed`);
  if (card.verification.lexical_source_count !== lexicalRefs.length) fail(`${card.card_id} lexical_source_count must count target-term lexical sources only`);
  if (card.verification.scholarly_source_count !== scholarlyRefs.length) fail(`${card.card_id} scholarly_source_count mismatch`);
  if (rr.cultural_context_review.status !== 'PASS' || rr.cultural_context_review.reference_ids.length < 1) fail(`${card.card_id} cultural-context gate failed`);

  for (const locale of ['ko', 'en', 'zh', 'ja']) {
    const comparison = rr.comparisons[locale];
    if (comparison?.status !== 'PASS') fail(`${card.card_id} ${locale} comparison gate failed`);
    if (!Array.isArray(comparison.reference_ids) || comparison.reference_ids.length < 1) fail(`${card.card_id} ${locale} comparison provenance missing`);
    for (const id of comparison.reference_ids) {
      const ref = refMap.get(id);
      if (!ref) fail(`${card.card_id} ${locale} comparison missing reference ${id}`);
      if (ref.source_type !== 'lexical') fail(`${card.card_id} ${locale} comparison reference ${id} is not lexical`);
      if (!card.reference_ids.includes(id)) fail(`${card.card_id} ${locale} comparison reference ${id} is absent from public reference_ids`);
    }
  }

  if (rr.pronunciation_verification.status !== 'PASS' || rr.pronunciation_verification.ipa !== card.term.ipa) fail(`${card.card_id} pronunciation gate failed`);
  if (!card.term.ipa.trim()) fail(`${card.card_id} IPA is empty`);
  const requiredAssetIds = [card.assets.illustration_asset_id, card.assets.share_asset_id, card.assets.audio_asset_id];
  for (const id of requiredAssetIds) {
    const asset = assetMap.get(id);
    if (!asset) fail(`${card.card_id} missing asset ${id}`);
    if (asset.card_id !== card.card_id) fail(`${id} belongs to ${asset.card_id}, not ${card.card_id}`);
    const abs = path.join(ROOT, asset.path);
    if (!fs.existsSync(abs)) fail(`${id} file missing: ${asset.path}`);
    if (!asset.sha256 || sha256(abs) !== asset.sha256) fail(`${id} sha256 mismatch`);
    if (asset.review_status === 'HOLD') fail(`${id} asset review is HOLD`);
    if (approved && asset.review_status !== 'HUMAN_APPROVED') fail(`${id} must be HUMAN_APPROVED for published card ${card.card_id}`);
  }
  const audio = assetMap.get(card.assets.audio_asset_id);
  if (audio.asset_type !== 'pronunciation_audio') fail(`${card.card_id} audio_asset_id does not point to pronunciation_audio`);
  if (!audio.source_url || !audio.license_or_rights_basis || !audio.attribution) fail(`${card.card_id} pronunciation audio provenance/rights incomplete`);
  if (!/^https:\/\//.test(audio.source_url)) fail(`${card.card_id} pronunciation audio source URL must be HTTPS`);
  if (/CC BY-SA 4\.0/i.test(audio.license_or_rights_basis) && !/Wikimedia Commons/i.test(audio.attribution)) fail(`${card.card_id} CC BY-SA audio attribution incomplete`);
  if (rr.pronunciation_verification.audio_asset_id !== audio.asset_id) fail(`${card.card_id} pronunciation research/audio asset mismatch`);

  for (const [gate, state] of Object.entries(rr.automated_gates)) if (state !== 'PASS') fail(`${card.card_id} declared automated gate ${gate} is ${state}`);
  if (/only (portuguese|brazilian)|untranslatable emotion/i.test(card.meaning.cultural_context)) fail(`${card.card_id} cultural framing contains a prohibited exclusivity shortcut`);
  if (/포르투갈어권에서도 일상적으로 쓰이며/.test(card.meaning.cultural_context)) fail(`${card.card_id} cultural context retains unsupported language-wide everyday-usage claim`);
}

for (const { data: card } of reviewCards) validatePair(card, reviewResearchMap.get(card.card_id), 'review');
for (const { data: card } of approvedCards) validatePair(card, approvedResearchMap.get(card.card_id), 'approved');

const allCards = [...reviewCards, ...approvedCards].map((x) => x.data);
const allIds = new Set(allCards.map((c) => c.card_id));
const allCardMap = new Map(allCards.map((c) => [c.card_id, c]));
const symmetricRelations = new Set(['similar_to', 'partially_overlaps', 'contrasts_with', 'often_confused_with']);
for (const card of allCards) {
  for (const [relation, ids] of Object.entries(card.relations || {})) {
    for (const id of ids) {
      if (!allIds.has(id)) fail(`${card.card_id} relation target missing: ${id}`);
      if (id === card.card_id) fail(`${card.card_id} relation ${relation} cannot self-reference`);
      const target = allCardMap.get(id);
      if (symmetricRelations.has(relation) && !(target.relations?.[relation] || []).includes(card.card_id)) {
        fail(`${card.card_id} relation ${relation} -> ${id} is not symmetric`);
      }
      if (relation === 'broader_than' && !(target.relations?.narrower_than || []).includes(card.card_id)) {
        fail(`${card.card_id} broader_than -> ${id} lacks inverse narrower_than`);
      }
      if (relation === 'narrower_than' && !(target.relations?.broader_than || []).includes(card.card_id)) {
        fail(`${card.card_id} narrower_than -> ${id} lacks inverse broader_than`);
      }
    }
  }
}
if (scope === 'g1') {
  const g1 = approvedCards.filter((x) => x.data.card_id === 'C0001');
  if (g1.length !== 1 || g1[0].data.status !== 'PUBLISHED') fail('G1 baseline C0001 must remain approved PUBLISHED source');
  const rr = approvedResearchMap.get('C0001');
  if (!rr || rr.lifecycle_state !== 'APPROVED' || rr.human_editorial_release?.status !== 'APPROVED') fail('G1 baseline C0001 Human Editorial Release must remain APPROVED');
}

console.log(JSON.stringify({
  status: 'PASS',
  scope,
  review_cards: reviewCards.map((x) => x.data.card_id),
  approved_public_cards: approvedCards.map((x) => x.data.card_id),
  reference_count: refs.references.length,
  asset_count: assets.assets.length,
  human_release_pending: reviewCards.filter((x) => reviewResearchMap.get(x.data.card_id)?.human_editorial_release.status === 'PENDING').map((x) => x.data.card_id)
}, null, 2));
