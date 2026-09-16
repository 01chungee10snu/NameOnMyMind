#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATE = '2026-09-16';
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const writeJson = (rel, value) => {
  const target = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, JSON.stringify(value, null, 2) + '\n');
};

const pendingIds = ['C0002', 'C0003', 'C0004', 'C0005'];
const refs = readJson('content/approved/references.json').references;
const assets = readJson('content/approved/assets.json').assets;
const refMap = new Map(refs.map((x) => [x.reference_id, x]));
const assetMap = new Map(assets.map((x) => [x.asset_id, x]));
const checklistNames = [
  'semantic_and_editorial_accuracy',
  'cultural_humility_and_non_othering',
  'ko_en_zh_ja_comparison_quality',
  'pronunciation_provenance_and_rights',
  'illustration_alt_and_accessibility',
  'release_decision',
];

const cards = pendingIds.map((cardId) => {
  const card = readJson(`content/review/cards/${cardId}.json`);
  const rr = readJson(`content/review/research-records/${cardId}.json`);
  if (card.status !== 'REVIEW_READY' || rr.lifecycle_state !== 'REVIEW_READY' || rr.human_editorial_release.status !== 'PENDING') {
    throw new Error(`${cardId} is not in the expected REVIEW_READY/PENDING state`);
  }
  const assetIds = [card.assets.illustration_asset_id, card.assets.share_asset_id, card.assets.audio_asset_id];
  return {
    card_id: cardId,
    term: card.term,
    experience_type: card.experience_type,
    front: card.front,
    meaning: card.meaning,
    comparisons: card.comparisons,
    semantic_tags: card.semantic_tags,
    relations: card.relations,
    verification: card.verification,
    machine_evidence: {
      lexical_verification: rr.lexical_verification,
      semantic_definition_and_boundaries: rr.semantic_definition_and_boundaries,
      cultural_context_review: rr.cultural_context_review,
      comparisons: rr.comparisons,
      pronunciation_verification: rr.pronunciation_verification,
      illustration_brief: rr.illustration_brief,
      editorial_copy: rr.editorial_copy,
      automated_gates: rr.automated_gates,
    },
    public_references: card.reference_ids.map((id) => {
      const r = refMap.get(id);
      if (!r) throw new Error(`${cardId} missing reference ${id}`);
      return {
        reference_id: id,
        source_type: r.source_type,
        title: r.title,
        publisher_or_container: r.publisher_or_container,
        citation_display: r.citation_display,
        url: r.url,
        license: r.license,
        rights_note: r.rights_note,
      };
    }),
    assets: assetIds.map((id) => {
      const a = assetMap.get(id);
      if (!a) throw new Error(`${cardId} missing asset ${id}`);
      return {
        asset_id: a.asset_id,
        asset_type: a.asset_type,
        path: a.path,
        creator_or_model: a.creator_or_model,
        source_url: a.source_url,
        license_or_rights_basis: a.license_or_rights_basis,
        attribution: a.attribution,
        sha256: a.sha256,
        review_status: a.review_status,
      };
    }),
    human_editorial_release_checklist: Object.fromEntries(checklistNames.map((name) => [name, 'PENDING'])),
    human_release_status: 'PENDING',
  };
});

const packet = {
  schema_version: '1.0.0',
  goal: 'G4',
  packet_type: 'FOUR_CARD_HUMAN_EDITORIAL_RELEASE_REVIEW',
  generated_at_date: DATE,
  baseline_card: {
    card_id: 'C0001',
    term: 'saudade',
    human_release_status: 'APPROVED',
    reused_evidence: 'docs/ops/evidence/C0001_HUMAN_EDITORIAL_RELEASE_2026-09-16.json',
    re_review_required: false,
  },
  pending_card_ids: pendingIds,
  cards,
  release_boundary: {
    current_public_cards: ['C0001'],
    pending_cards_must_not_be_public: pendingIds,
    external_publish_authorized: false,
    repository_push_authorized: false,
    g5_admission_allowed: false,
  },
  approval_instruction: 'Human review must explicitly approve C0002, C0003, C0004, and C0005 (or request changes) before any of them can move from REVIEW_READY to APPROVED/PUBLISHED. Machine PASS does not constitute release approval.',
};

const blocker = {
  schema_version: '1.0.0',
  goal: 'G4',
  status: 'BLOCKED_ON_HUMAN_EDITORIAL_RELEASE',
  generated_at_date: DATE,
  baseline_approved_card: 'C0001',
  pending_card_ids: pendingIds,
  human_review_packet: 'docs/ops/review/G4_HUMAN_EDITORIAL_REVIEW_PACKET_2026-09-16.json',
  g4_machine_gate_status: 'PASS',
  g4_human_release_status: 'PENDING_4_OF_4',
  g4_complete: false,
  g5_admission_allowed: false,
  external_publish_authorized: false,
  repository_push_authorized: false,
  unblock_condition: 'Explicit human approval of all four pending cards after review of the packet, followed by validator/public-boundary/full-regression recheck.',
};

writeJson('docs/ops/review/G4_HUMAN_EDITORIAL_REVIEW_PACKET_2026-09-16.json', packet);
writeJson('docs/ops/blockers/G4_HUMAN_EDITORIAL_RELEASE_REQUIRED_2026-09-16.json', blocker);
console.log(JSON.stringify({ status: 'PASS', pending_card_ids: pendingIds, packet: blocker.human_review_packet, g5_admission_allowed: false }, null, 2));
