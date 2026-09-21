#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public');
const SOURCE_DIR = path.join(ROOT, 'prototypes/g5-research-preview-20260918');
const TARGET_DIR = path.join(OUT, 'prototypes/g5-research-preview-20260918');
const KOREAN_SOURCE_DIR = path.join(ROOT, 'prototypes/korean-emotion-map-20260919');
const KOREAN_TARGET_DIR = path.join(OUT, 'prototypes/korean-emotion-map-20260919');
const KOREAN_DATA_SOURCE = path.join(ROOT, 'content/korean-expression/emotion-map-v1.json');
const KOREAN_DATA_TARGET = path.join(OUT, 'content/korean-expression/emotion-map-v1.json');
const KOREAN_SCHOOL_SOURCE = path.join(ROOT, 'content/korean-expression/evidence/school-age-v1.json');
const KOREAN_SCHOOL_TARGET = path.join(OUT, 'content/korean-expression/evidence/school-age-v1.json');
const KOREAN_LEVEL1_SOURCE = path.join(ROOT, 'content/korean-expression/evidence/level1-source-v1.json');
const KOREAN_LEVEL1_TARGET = path.join(OUT, 'content/korean-expression/evidence/level1-source-v1.json');
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

if (!fs.existsSync(path.join(KOREAN_SOURCE_DIR, 'index.html'))) throw new Error('Korean emotion map prototype missing.');
if (!fs.existsSync(KOREAN_DATA_SOURCE)) throw new Error('Korean emotion map data missing.');
if (!fs.existsSync(KOREAN_SCHOOL_SOURCE)) throw new Error('Korean school-age evidence missing.');
if (!fs.existsSync(KOREAN_LEVEL1_SOURCE)) throw new Error('Korean Level 1 evidence missing.');
const koreanMap = JSON.parse(fs.readFileSync(KOREAN_DATA_SOURCE, 'utf8'));
if (koreanMap.track_id !== 'KOREAN_EMOTION_ARTICULATION') throw new Error('Korean emotion map track_id mismatch.');
if (!Array.isArray(koreanMap.families) || !Array.isArray(koreanMap.terms) || !Array.isArray(koreanMap.contrast_sets)) {
  throw new Error('Korean emotion map shape invalid.');
}
const koreanVerifiedCount = koreanMap.terms.filter((term) => term.status === 'SOURCE_VERIFIED').length;
const koreanSchoolAgeDirectCount = koreanMap.terms.filter((term) => term.learning_profile?.school_age_evidence === 'GRADE_3_6_SUPPORTED').length;
const koreanSchoolAgeRelatedCount = koreanMap.terms.filter((term) => term.learning_profile?.school_age_evidence === 'GRADE_3_6_RELATED_FORM').length;
const koreanLevel1VerifiedCount = koreanMap.terms.filter((term) => term.level === 1 && term.status === 'SOURCE_VERIFIED').length;
if (koreanVerifiedCount === 0) throw new Error('Korean emotion map has no source-verified terms.');

fs.mkdirSync(TARGET_DIR, { recursive: true });
fs.copyFileSync(path.join(SOURCE_DIR, 'index.html'), path.join(TARGET_DIR, 'index.html'));
fs.mkdirSync(KOREAN_TARGET_DIR, { recursive: true });
fs.copyFileSync(path.join(KOREAN_SOURCE_DIR, 'index.html'), path.join(KOREAN_TARGET_DIR, 'index.html'));
fs.mkdirSync(path.dirname(KOREAN_DATA_TARGET), { recursive: true });
fs.copyFileSync(KOREAN_DATA_SOURCE, KOREAN_DATA_TARGET);
fs.mkdirSync(path.dirname(KOREAN_SCHOOL_TARGET), { recursive: true });
fs.copyFileSync(KOREAN_SCHOOL_SOURCE, KOREAN_SCHOOL_TARGET);
fs.copyFileSync(KOREAN_LEVEL1_SOURCE, KOREAN_LEVEL1_TARGET);

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
const koreanAliasDir = path.join(OUT, 'korean');
fs.mkdirSync(koreanAliasDir, { recursive: true });
fs.writeFileSync(
  path.join(koreanAliasDir, 'index.html'),
  '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NameOnMyMind Korean Map</title><meta http-equiv="refresh" content="0; url=../prototypes/korean-emotion-map-20260919/"><link rel="canonical" href="../prototypes/korean-emotion-map-20260919/"><p><a href="../prototypes/korean-emotion-map-20260919/">한국어 마음 지도 열기</a></p>\n'
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
  korean_emotion_map: {
    track_id: koreanMap.track_id,
    family_count: koreanMap.families.length,
    term_count: koreanMap.terms.length,
    source_verified_term_count: koreanVerifiedCount,
    level1_verified_term_count: koreanLevel1VerifiedCount,
    school_age_direct_term_count: koreanSchoolAgeDirectCount,
    school_age_related_term_count: koreanSchoolAgeRelatedCount,
    contrast_set_count: koreanMap.contrast_sets.length,
    preview_path: 'prototypes/korean-emotion-map-20260919/',
    data_path: 'content/korean-expression/emotion-map-v1.json',
    school_age_evidence_path: 'content/korean-expression/evidence/school-age-v1.json',
    level1_evidence_path: 'content/korean-expression/evidence/level1-source-v1.json',
    alias_path: 'korean/',
    product_release_authorized: false,
  },
};
fs.writeFileSync(path.join(OUT, 'RESEARCH_PREVIEW_MANIFEST.json'), JSON.stringify(stagedEvidence, null, 2) + '\n');

console.log(JSON.stringify({ status: 'PASS', ...stagedEvidence }, null, 2));
