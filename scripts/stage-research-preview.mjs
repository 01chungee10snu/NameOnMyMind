#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public');
const SOURCE_DIR = path.join(ROOT, 'prototypes/g5-research-preview-20260918');
const TARGET_DIR = path.join(OUT, 'prototypes/g5-research-preview-20260918');
const PREVIEW_AUTHORIZED = process.env.NAMEONMYMIND_RESEARCH_PREVIEW_PUBLISH_AUTHORIZED === '1';

if (!PREVIEW_AUTHORIZED) {
  console.error('RESEARCH_PREVIEW_STAGE_BLOCKED: explicit preview publication authorization is required.');
  process.exit(2);
}
if (!fs.existsSync(path.join(OUT, 'BUILD_MANIFEST.json'))) {
  throw new Error('Public bundle must be built before staging the research preview.');
}

const publicBuild = JSON.parse(fs.readFileSync(path.join(OUT, 'BUILD_MANIFEST.json'), 'utf8'));
const sourceManifest = JSON.parse(fs.readFileSync(path.join(SOURCE_DIR, 'manifest.json'), 'utf8'));

if (sourceManifest.status !== 'RESEARCH_PREVIEW_ONLY') throw new Error('Preview source status is not RESEARCH_PREVIEW_ONLY.');
if (sourceManifest.public_release_authorized !== false) throw new Error('Research preview must not claim product release authorization.');
if (!Array.isArray(sourceManifest.cards) || sourceManifest.cards.length === 0) throw new Error('Research preview has no cards.');
if (sourceManifest.card_count !== sourceManifest.cards.length) throw new Error('Research preview card_count mismatch.');

const ids = sourceManifest.cards.map((card) => card.card_id);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate research preview card_id.');

for (const card of sourceManifest.cards) {
  if (card.lifecycle_state !== 'HOLD') throw new Error(`${card.card_id} is not HOLD.`);
  if (card.expression_cost !== 'EXPLANATORY_PHRASE_REQUIRED') throw new Error(`${card.card_id} does not satisfy preview expression-cost gate.`);
  const sourceImage = path.resolve(SOURCE_DIR, card.image);
  if (!sourceImage.startsWith(path.join(ROOT, 'assets/media/illustrations/candidates/g5-preview-20260918') + path.sep)) {
    throw new Error(`${card.card_id} image escapes approved preview candidate directory.`);
  }
  if (!fs.existsSync(sourceImage)) throw new Error(`${card.card_id} image missing.`);
  const actualSha = crypto.createHash('sha256').update(fs.readFileSync(sourceImage)).digest('hex');
  if (actualSha !== card.sha256) throw new Error(`${card.card_id} SHA mismatch.`);
}

fs.mkdirSync(TARGET_DIR, { recursive: true });
fs.copyFileSync(path.join(SOURCE_DIR, 'index.html'), path.join(TARGET_DIR, 'index.html'));

const stagedCards = sourceManifest.cards.map(({ research_record, ...card }) => card);
const stagedManifest = {
  schema_version: sourceManifest.schema_version,
  status: 'RESEARCH_PREVIEW_ONLY',
  created_at: sourceManifest.created_at,
  generator_surface: sourceManifest.generator_surface,
  observed_image_model: sourceManifest.observed_image_model,
  preview_web_publish_authorized: true,
  product_release_authorized: false,
  card_count: stagedCards.length,
  cards: stagedCards,
  generation_backlog: sourceManifest.generation_backlog
    ? {
        prepared_card_ids: sourceManifest.generation_backlog.prepared_prompts ?? [],
        promotion_authorized: false,
      }
    : undefined,
};
fs.writeFileSync(path.join(TARGET_DIR, 'manifest.json'), JSON.stringify(stagedManifest, null, 2) + '\n');

for (const card of sourceManifest.cards) {
  const sourceImage = path.resolve(SOURCE_DIR, card.image);
  const relFromRoot = path.relative(ROOT, sourceImage);
  const targetImage = path.join(OUT, relFromRoot);
  fs.mkdirSync(path.dirname(targetImage), { recursive: true });
  fs.copyFileSync(sourceImage, targetImage);
}

const aliasDir = path.join(OUT, 'preview');
fs.mkdirSync(aliasDir, { recursive: true });
fs.writeFileSync(
  path.join(aliasDir, 'index.html'),
  '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NameOnMyMind Preview</title><meta http-equiv="refresh" content="0; url=../prototypes/g5-research-preview-20260918/"><link rel="canonical" href="../prototypes/g5-research-preview-20260918/"><p><a href="../prototypes/g5-research-preview-20260918/">NameOnMyMind Research Preview 열기</a></p>\n'
);

const stagedEvidence = {
  schema_version: '1.0.0',
  artifact_type: 'RESEARCH_PREVIEW_WEB_STAGE',
  preview_web_publish_authorized: true,
  product_release_authorized: false,
  approved_public_card_ids: publicBuild.card_ids,
  preview_card_ids: ids,
  preview_card_count: ids.length,
  preview_path: 'prototypes/g5-research-preview-20260918/',
  alias_path: 'preview/',
};
fs.writeFileSync(path.join(OUT, 'RESEARCH_PREVIEW_MANIFEST.json'), JSON.stringify(stagedEvidence, null, 2) + '\n');

console.log(JSON.stringify({ status: 'PASS', ...stagedEvidence }, null, 2));
