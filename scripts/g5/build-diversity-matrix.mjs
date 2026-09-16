#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'docs/ops/evidence/G5_DIVERSITY_MATRIX.json');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const list = (rel) => fs.existsSync(path.join(ROOT, rel))
  ? fs.readdirSync(path.join(ROOT, rel)).filter((x) => x.endsWith('.json')).sort().map((x) => read(`${rel}/${x}`))
  : [];
const cards = [...list('content/approved/cards'), ...list('content/review/cards')].sort((a,b) => a.card_id.localeCompare(b.card_id));
const plannedRetirements = new Set(['C0004','C0005']);
const prospectiveActiveCards = cards.filter((c) => !plannedRetirements.has(c.card_id));
const byFor = (source, keyFn) => Object.fromEntries([...source.reduce((m,c) => { const k=keyFn(c); m.set(k,(m.get(k)||0)+1); return m; }, new Map())].sort());
const by = (keyFn) => byFor(cards, keyFn);
const script = (s) => {
  if (/\p{Script=Hangul}/u.test(s)) return 'Hangul';
  if (/\p{Script=Han}/u.test(s)) return 'Han';
  if (/\p{Script=Hiragana}|\p{Script=Katakana}/u.test(s)) return 'JapaneseKana';
  if (/\p{Script=Cyrillic}/u.test(s)) return 'Cyrillic';
  if (/\p{Script=Latin}/u.test(s)) return 'Latin';
  return 'Other';
};
const relationPairs=[];
for (const c of cards) for (const [kind,ids] of Object.entries(c.relations||{})) for (const id of ids) if(c.card_id<id) relationPairs.push({source:c.card_id,target:id,kind});
const value = {
  schema_version:'1.0.0',
  generated_at_date:'2026-09-16',
  total_cards:cards.length,
  approved_count:list('content/approved/cards').length,
  review_ready_count:list('content/review/cards').length,
  planned_retirement_ids:['C0004','C0005'],
  prospective_active_count:prospectiveActiveCards.length,
  final_active_target:50,
  prospective_active_by_language_code:byFor(prospectiveActiveCards,(c)=>c.term.language_code),
  prospective_active_by_experience_type:byFor(prospectiveActiveCards,(c)=>c.experience_type),
  by_language_code:by((c)=>c.term.language_code),
  by_language_name:by((c)=>c.term.language_name),
  by_experience_type:by((c)=>c.experience_type),
  by_script:by((c)=>script(c.term.original)),
  semantic_tag_counts:Object.fromEntries([...cards.flatMap(c=>c.semantic_tags||[]).reduce((m,t)=>{m.set(t,(m.get(t)||0)+1);return m;},new Map())].sort()),
  relation_pair_count:relationPairs.length,
  relation_pairs:relationPairs,
  boundaries:{
    diversity_is_descriptive_not_a_publication_gate:true,
    no_language_quota_overrides_evidence_gates:true,
    failed_candidates_must_be_replaced_not_forced:true,
    c0004_c0005_canary_evidence_preserved_but_final_active_retirement_planned:true,
    final_release_requires_exactly_50_active_cards:true
  }
};
fs.mkdirSync(path.dirname(OUT),{recursive:true});
fs.writeFileSync(OUT,JSON.stringify(value,null,2)+'\n');
console.log(JSON.stringify({status:'PASS',total_cards:value.total_cards,approved:value.approved_count,review_ready:value.review_ready_count,by_language_code:value.by_language_code,by_script:value.by_script},null,2));
