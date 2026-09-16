#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public');
const readJsonAbs = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const readJson = (rel) => readJsonAbs(path.join(ROOT, rel));
const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const approvedDir = path.join(ROOT, 'content/approved/cards');
const cardFiles = fs.existsSync(approvedDir) ? fs.readdirSync(approvedDir).filter((x) => x.endsWith('.json')).sort().map((x) => path.join(approvedDir, x)) : [];
if (cardFiles.length === 0) {
  console.error('PUBLIC_BUILD_BLOCKED: no human-released PUBLISHED/REVISED cards exist; existing public output is untouched.');
  process.exit(2);
}
const cards = cardFiles.map(readJsonAbs);
for (const card of cards) {
  if (!['PUBLISHED','REVISED'].includes(card.status)) throw new Error(`${card.card_id} is not public-release status`);
  const rrPath = path.join(ROOT, 'content/approved/research-records', `${card.card_id}.json`);
  if (!fs.existsSync(rrPath)) throw new Error(`${card.card_id} lacks approved research record`);
  const rr = readJsonAbs(rrPath);
  if (rr.lifecycle_state !== 'APPROVED' || rr.human_editorial_release?.status !== 'APPROVED') throw new Error(`${card.card_id} lacks Human Editorial Release APPROVED`);
}
const refs = readJson('content/approved/references.json');
const assets = readJson('content/approved/assets.json');
const selectedRefIds = new Set(cards.flatMap((card) => card.reference_ids));
const selectedAssetIds = new Set(cards.flatMap((card) => [card.assets.illustration_asset_id, card.assets.share_asset_id, card.assets.audio_asset_id]));
const selectedRefs = refs.references.filter((ref) => selectedRefIds.has(ref.reference_id));
const selectedAssets = assets.assets.filter((asset) => selectedAssetIds.has(asset.asset_id));

function copyFile(rel, targetRel = rel) {
  const source = path.join(ROOT, rel);
  const target = path.join(OUT, targetRel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}
function copyTree(rel) { fs.cpSync(path.join(ROOT, rel), path.join(OUT, rel), { recursive: true }); }
function writeJson(rel, value) {
  const target = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(value, null, 2) + '\n');
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
copyFile('src/ui/index.html', 'index.html');
copyTree('src');
copyFile('assets/css/styles.css');
copyFile('.nojekyll');
for (const asset of selectedAssets) copyFile(asset.path);

const inputHashes = {
  card_schema: sha(path.join(ROOT,'schema/card.schema.json')),
  reference_schema: sha(path.join(ROOT,'schema/reference.schema.json')),
  asset_schema: sha(path.join(ROOT,'schema/asset.schema.json')),
  research_schema: sha(path.join(ROOT,'schema/research-record.schema.json')),
  references: sha(path.join(ROOT,'content/approved/references.json')),
  assets: sha(path.join(ROOT,'content/approved/assets.json')),
  ...Object.fromEntries(cardFiles.map((file) => [`card_${path.basename(file,'.json')}`, sha(file)])),
};
const snapshotSeed = Object.entries(inputHashes).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => `${k}:${v}`).join('|');
const snapshotVersion = crypto.createHash('sha256').update(snapshotSeed).digest('hex').slice(0,16);
writeJson('data/manifest.json', {
  schema_version:'1.0.0', release_mode:'PUBLIC_LOCAL_BUILD', external_publish_authorized:false,
  snapshot_version: snapshotVersion, daily_seed:'nameonmymind-public-v1', card_count:cards.length,
  generated_from:'human-released approved editorial source'
});
writeJson('data/cards-index.json', { schema_version:'1.0.0', cards });
writeJson('data/references.json', { schema_version:refs.schema_version, references:selectedRefs });
writeJson('data/assets.json', { schema_version:assets.schema_version, assets:selectedAssets });
writeJson('BUILD_MANIFEST.json', {
  schema_version:'1.0.0', artifact_type:'LOCAL_PUBLIC_BUILD', deployable:true, external_publish_authorized:false,
  snapshot_version:snapshotVersion, card_ids:cards.map((x)=>x.card_id), input_sha256:inputHashes,
  excluded_source_classes:['private/**','content/review/**','content/approved/research-records/**','reports/**']
});
console.log(JSON.stringify({status:'PASS',output:OUT,card_ids:cards.map((x)=>x.card_id),snapshot_version:snapshotVersion,deployable:true,external_publish_authorized:false},null,2));
