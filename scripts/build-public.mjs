#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const approvedDir = path.join(ROOT, 'content/approved/cards');
const cards = fs.existsSync(approvedDir) ? fs.readdirSync(approvedDir).filter((x) => x.endsWith('.json')).sort() : [];
if (cards.length === 0) {
  console.error('PUBLIC_BUILD_BLOCKED: no human-released PUBLISHED/REVISED cards exist; existing public output is untouched.');
  process.exit(2);
}
for (const name of cards) {
  const card = JSON.parse(fs.readFileSync(path.join(approvedDir, name), 'utf8'));
  if (!['PUBLISHED', 'REVISED'].includes(card.status)) throw new Error(`${card.card_id} is not public-release status`);
  const researchPath = path.join(ROOT, 'content/approved/research-records', `${card.card_id}.json`);
  if (!fs.existsSync(researchPath)) throw new Error(`${card.card_id} lacks approved research record`);
  const rr = JSON.parse(fs.readFileSync(researchPath, 'utf8'));
  if (rr.lifecycle_state !== 'APPROVED' || rr.human_editorial_release?.status !== 'APPROVED') {
    throw new Error(`${card.card_id} lacks Human Editorial Release APPROVED`);
  }
}
throw new Error('Public build implementation intentionally remains unavailable until the first human-released card exists; no public output was changed.');
