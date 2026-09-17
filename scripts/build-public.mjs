#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public');
const externalPublishAuthorized = process.env.NAMEONMYMIND_EXTERNAL_PUBLISH_AUTHORIZED === '1';
const readJsonAbs = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const readJson = (rel) => readJsonAbs(path.join(ROOT, rel));
const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const hashJsonValue = (value) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const approvedDir = path.join(ROOT, 'content/approved/cards');
const cardFiles = fs.existsSync(approvedDir)
  ? fs.readdirSync(approvedDir).filter((x) => x.endsWith('.json')).sort().map((x) => path.join(approvedDir, x))
  : [];
if (cardFiles.length === 0) {
  console.error('PUBLIC_BUILD_BLOCKED: no human-released PUBLISHED/REVISED cards exist; existing public output is untouched.');
  process.exit(2);
}
const cards = cardFiles.map(readJsonAbs);
for (const card of cards) {
  if (!['PUBLISHED', 'REVISED'].includes(card.status)) throw new Error(`${card.card_id} is not public-release status`);
  const rrPath = path.join(ROOT, 'content/approved/research-records', `${card.card_id}.json`);
  if (!fs.existsSync(rrPath)) throw new Error(`${card.card_id} lacks approved research record`);
  const rr = readJsonAbs(rrPath);
  if (rr.lifecycle_state !== 'APPROVED' || rr.human_editorial_release?.status !== 'APPROVED') {
    throw new Error(`${card.card_id} lacks Human Editorial Release APPROVED`);
  }
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
function writeText(rel, value) {
  const target = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value);
}
function writeJson(rel, value) { writeText(rel, JSON.stringify(value, null, 2) + '\n'); }

const runtimeInputs = [
  'src/ui/index.html',
  'src/ui/app.mjs',
  'src/domain/cards.mjs',
  'src/domain/discovery.mjs',
  'src/local/state.mjs',
  'src/agent/webmcp-adapter.mjs',
  'src/agent/agent-manifest.json',
  'src/pwa/manifest.webmanifest',
  'src/pwa/service-worker.template.js',
  'src/pwa/offline.html',
  'assets/css/styles.css',
  'assets/brand/app-icon.svg',
];
const inputHashes = {
  card_schema: sha(path.join(ROOT, 'schema/card.schema.json')),
  reference_schema: sha(path.join(ROOT, 'schema/reference.schema.json')),
  asset_schema: sha(path.join(ROOT, 'schema/asset.schema.json')),
  research_schema: sha(path.join(ROOT, 'schema/research-record.schema.json')),
  // Unpublished research registry growth must not invalidate the public snapshot.
  // Hash only the references/assets reachable from human-released public cards.
  references: hashJsonValue({ schema_version: refs.schema_version, references: selectedRefs }),
  assets: hashJsonValue({ schema_version: assets.schema_version, assets: selectedAssets }),
  ...Object.fromEntries(cardFiles.map((file) => [`card_${path.basename(file, '.json')}`, sha(file)])),
  ...Object.fromEntries(runtimeInputs.map((rel) => [`runtime_${rel.replaceAll('/', '_')}`, sha(path.join(ROOT, rel))])),
};
const snapshotSeed = Object.entries(inputHashes).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join('|');
const snapshotVersion = crypto.createHash('sha256').update(snapshotSeed).digest('hex').slice(0, 16);

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
copyFile('src/ui/index.html', 'index.html');
for (const rel of ['src/ui/app.mjs', 'src/domain/cards.mjs', 'src/domain/discovery.mjs', 'src/local/state.mjs', 'src/agent/webmcp-adapter.mjs']) copyFile(rel);
copyFile('assets/css/styles.css');
copyFile('assets/brand/app-icon.svg');
copyFile('.nojekyll');
for (const asset of selectedAssets) copyFile(asset.path);

writeJson('data/manifest.json', {
  schema_version: '1.1.0',
  release_mode: externalPublishAuthorized ? 'PUBLIC_EXTERNAL_RELEASE' : 'PUBLIC_LOCAL_BUILD',
  external_publish_authorized: externalPublishAuthorized,
  snapshot_version: snapshotVersion,
  daily_seed: 'nameonmymind-public-v1',
  card_count: cards.length,
  card_documents: cards.map((card) => `./cards/${card.card_id}.json`),
  relations_location: './relations.json',
  references_location: './references.json',
  assets_location: './assets.json',
  share_asset_base: './assets/media/share/',
  generated_from: 'human-released approved editorial source',
});
writeJson('data/cards-index.json', { schema_version: '1.1.0', snapshot_version: snapshotVersion, cards });
for (const card of cards) writeJson(`data/cards/${card.card_id}.json`, card);
writeJson('data/references.json', { schema_version: refs.schema_version, snapshot_version: snapshotVersion, references: selectedRefs });
writeJson('data/assets.json', { schema_version: assets.schema_version, snapshot_version: snapshotVersion, assets: selectedAssets });
writeJson('data/relations.json', {
  schema_version: '1.0.0',
  snapshot_version: snapshotVersion,
  relations: cards.map((card) => ({ card_id: card.card_id, ...card.relations })),
});

const agentManifest = readJson('src/agent/agent-manifest.json');
agentManifest.data_snapshot_version = snapshotVersion;
writeJson('agent-manifest.json', agentManifest);
copyFile('src/pwa/manifest.webmanifest', 'manifest.webmanifest');
copyFile('src/pwa/offline.html', 'offline.html');
const swTemplate = fs.readFileSync(path.join(ROOT, 'src/pwa/service-worker.template.js'), 'utf8');
const cardUrls = cards.map((card) => `./data/cards/${card.card_id}.json`);
writeText('service-worker.js', swTemplate
  .replaceAll('__BUILD_SNAPSHOT__', snapshotVersion)
  .replace('__CARD_URLS__', JSON.stringify(cardUrls)));

writeJson('BUILD_MANIFEST.json', {
  schema_version: '1.1.0',
  artifact_type: externalPublishAuthorized ? 'EXTERNAL_PUBLIC_RELEASE' : 'LOCAL_PUBLIC_BUILD',
  deployable: true,
  external_publish_authorized: externalPublishAuthorized,
  snapshot_version: snapshotVersion,
  card_ids: cards.map((x) => x.card_id),
  agent_contract_version: agentManifest.agent_contract_version,
  pwa: {
    manifest: 'manifest.webmanifest',
    service_worker: 'service-worker.js',
    offline_fallback: 'offline.html',
    shell_cache: `nomm-shell-v1-${snapshotVersion}`,
    content_cache: `nomm-content-${snapshotVersion}`,
    asset_cache: `nomm-assets-v1-${snapshotVersion}`,
  },
  input_sha256: inputHashes,
  excluded_source_classes: ['private/**', 'content/review/**', 'content/g5/**', 'content/approved/research-records/**', 'schema/g5-research-record.schema.json', 'reports/**'],
});

console.log(JSON.stringify({
  status: 'PASS', output: OUT, card_ids: cards.map((x) => x.card_id), snapshot_version: snapshotVersion,
  deployable: true, external_publish_authorized: externalPublishAuthorized, agent_manifest: true, pwa: true,
}, null, 2));
