#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'review-preview');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function copyFile(rel, targetRel = rel) {
  const source = path.join(ROOT, rel);
  const target = path.join(OUT, targetRel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}
function copyTree(rel) {
  fs.cpSync(path.join(ROOT, rel), path.join(OUT, rel), { recursive: true });
}
function writeJson(rel, value) {
  const target = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(value, null, 2) + '\n');
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const cards = fs.readdirSync(path.join(ROOT, 'content/review/cards')).filter((x) => x.endsWith('.json')).sort().map((name) => readJson(`content/review/cards/${name}`));
if (cards.length !== 1) throw new Error(`G1 review preview requires exactly one card, got ${cards.length}`);
if (cards.some((card) => card.status !== 'REVIEW_READY')) throw new Error('review preview accepts REVIEW_READY cards only');
const refs = readJson('content/approved/references.json');
const assets = readJson('content/approved/assets.json');
const selectedRefIds = new Set(cards.flatMap((card) => card.reference_ids));
const selectedAssetIds = new Set(cards.flatMap((card) => [card.assets.illustration_asset_id, card.assets.share_asset_id, card.assets.audio_asset_id]));
const selectedRefs = refs.references.filter((ref) => selectedRefIds.has(ref.reference_id));
const selectedAssets = assets.assets.filter((asset) => selectedAssetIds.has(asset.asset_id));

copyFile('src/ui/index.html', 'index.html');
copyTree('src');
copyFile('assets/css/styles.css');
for (const asset of selectedAssets) copyFile(asset.path);

const inputHashes = {
  card_schema: sha(path.join(ROOT, 'schema/card.schema.json')),
  reference_schema: sha(path.join(ROOT, 'schema/reference.schema.json')),
  asset_schema: sha(path.join(ROOT, 'schema/asset.schema.json')),
  research_schema: sha(path.join(ROOT, 'schema/research-record.schema.json')),
  card: sha(path.join(ROOT, 'content/review/cards', `${cards[0].card_id}.json`)),
  references: sha(path.join(ROOT, 'content/approved/references.json')),
  assets: sha(path.join(ROOT, 'content/approved/assets.json')),
};
const snapshotSeed = Object.entries(inputHashes).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join('|');
const snapshotVersion = crypto.createHash('sha256').update(snapshotSeed).digest('hex').slice(0, 16);
writeJson('data/manifest.json', { schema_version: '1.0.0', release_mode: 'REVIEW_ONLY', public_release_authorized: false, snapshot_version: snapshotVersion, daily_seed: 'nameonmymind-g1-review-v1', card_count: cards.length, generated_from: 'validated REVIEW_READY source; not a publishable public bundle' });
writeJson('data/cards-index.json', { schema_version: '1.0.0', cards });
writeJson('data/references.json', { schema_version: refs.schema_version, references: selectedRefs });
writeJson('data/assets.json', { schema_version: assets.schema_version, assets: selectedAssets });
writeJson('BUILD_MANIFEST.json', { schema_version: '1.0.0', artifact_type: 'LOCAL_REVIEW_PREVIEW', deployable: false, human_editorial_release_required: true, snapshot_version: snapshotVersion, input_sha256: inputHashes, excluded_source_classes: ['private/**', 'content/review/research-records/**', 'reports/**'] });
console.log(JSON.stringify({ status: 'PASS', output: OUT, card_ids: cards.map((x) => x.card_id), snapshot_version: snapshotVersion, deployable: false }, null, 2));
