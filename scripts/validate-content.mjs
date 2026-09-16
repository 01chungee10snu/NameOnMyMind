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

const reviewCards = filesUnder('content/review/cards');
const reviewResearch = filesUnder('content/review/research-records');
if (reviewCards.length !== 1 || reviewResearch.length !== 1) fail(`G1 expects exactly one review card and research record, got ${reviewCards.length}/${reviewResearch.length}`);

const cards = reviewCards.map((file) => ({ file, data: JSON.parse(fs.readFileSync(file, 'utf8')) }));
const research = reviewResearch.map((file) => ({ file, data: JSON.parse(fs.readFileSync(file, 'utf8')) }));
for (const { file, data } of cards) assertValid(cardValidate, data, path.relative(ROOT, file));
for (const { file, data } of research) assertValid(researchValidate, data, path.relative(ROOT, file));
uniqueBy(cards.map((x) => x.data), 'card_id', 'review cards');
uniqueBy(research.map((x) => x.data), 'card_id', 'research records');

const researchMap = new Map(research.map((x) => [x.data.card_id, x.data]));
for (const { data: card } of cards) {
  if (card.status !== 'REVIEW_READY') fail(`${card.card_id} must remain REVIEW_READY before human release`);
  const rr = researchMap.get(card.card_id);
  if (!rr) fail(`${card.card_id} missing research record`);
  if (rr.lifecycle_state !== 'REVIEW_READY') fail(`${card.card_id} research record not REVIEW_READY`);
  if (rr.human_editorial_release.status !== 'PENDING') fail(`${card.card_id} human release must remain PENDING until a human approves it`);

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
  for (const locale of ['ko', 'en', 'zh', 'ja']) if (rr.comparisons[locale]?.status !== 'PASS') fail(`${card.card_id} ${locale} comparison gate failed`);
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
  }
  const audio = assetMap.get(card.assets.audio_asset_id);
  if (audio.asset_type !== 'pronunciation_audio') fail(`${card.card_id} audio_asset_id does not point to pronunciation_audio`);
  if (!audio.source_url || !audio.license_or_rights_basis || !audio.attribution) fail(`${card.card_id} pronunciation audio provenance/rights incomplete`);
  if (rr.pronunciation_verification.audio_asset_id !== audio.asset_id) fail(`${card.card_id} pronunciation research/audio asset mismatch`);

  const automated = rr.automated_gates;
  for (const [gate, state] of Object.entries(automated)) if (state !== 'PASS') fail(`${card.card_id} declared automated gate ${gate} is ${state}`);
  if (/only (portuguese|brazilian)|untranslatable emotion/i.test(card.meaning.cultural_context)) fail(`${card.card_id} cultural framing contains a prohibited exclusivity shortcut`);
}

const approvedCards = filesUnder('content/approved/cards');
for (const file of approvedCards) {
  const card = JSON.parse(fs.readFileSync(file, 'utf8'));
  assertValid(cardValidate, card, path.relative(ROOT, file));
  if (!['PUBLISHED', 'REVISED'].includes(card.status)) fail(`approved public card must be PUBLISHED/REVISED: ${card.card_id}`);
  const rrFile = path.join(ROOT, 'content/approved/research-records', `${card.card_id}.json`);
  if (!fs.existsSync(rrFile)) fail(`${card.card_id} approved card lacks approved research record`);
  const rr = JSON.parse(fs.readFileSync(rrFile, 'utf8'));
  assertValid(researchValidate, rr, path.relative(ROOT, rrFile));
  if (rr.lifecycle_state !== 'APPROVED' || rr.human_editorial_release.status !== 'APPROVED') fail(`${card.card_id} cannot be public without human editorial release`);
}

console.log(JSON.stringify({
  status: 'PASS',
  scope: process.argv.includes('--scope=g1') ? 'g1' : 'all',
  review_cards: cards.map((x) => x.data.card_id),
  approved_public_cards: approvedCards.length,
  reference_count: refs.references.length,
  asset_count: assets.assets.length,
  human_release_pending: cards.filter((x) => researchMap.get(x.data.card_id)?.human_editorial_release.status === 'PENDING').map((x) => x.data.card_id)
}, null, 2));
