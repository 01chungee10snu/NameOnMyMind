#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DATE='2026-09-16';
const read=(rel)=>JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8'));
const list=(rel)=>fs.existsSync(path.join(ROOT,rel))?fs.readdirSync(path.join(ROOT,rel)).filter(x=>x.endsWith('.json')).sort().map(x=>read(`${rel}/${x}`)):[];
const write=(rel,value)=>{const p=path.join(ROOT,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(value,null,2)+'\n');};
const approved=list('content/approved/cards');
const review=list('content/review/cards');
const reviewRR=new Map(list('content/review/research-records').map(x=>[x.card_id,x]));
const refs=read('content/approved/references.json').references;
const assets=read('content/approved/assets.json').assets;
const refMap=new Map(refs.map(x=>[x.reference_id,x]));
const assetMap=new Map(assets.map(x=>[x.asset_id,x]));
if(approved.length!==5) throw new Error(`G5 review packet requires the five approved G4 baseline cards, got ${approved.length}`);
if(review.length!==47) throw new Error(`G5 review packet requires exactly 47 pending review cards, got ${review.length}`);
const expected=Array.from({length:47},(_,i)=>`C${String(i+6).padStart(4,'0')}`);
if(JSON.stringify(review.map(x=>x.card_id))!==JSON.stringify(expected)) throw new Error('G5 review card IDs must be exactly C0006-C0052');
const checklistNames=['poetic_copy_does_not_exceed_evidence','cross_language_comparisons_not_one_to_one','cultural_framing_avoids_exoticization_and_overgeneralization','illustration_does_not_stereotype_or_diagnose','reflection_is_optional_low_pressure_non_diagnostic','verification_and_reference_presentation_is_understandable','share_and_public_assets_contain_no_private_or_local_state'];
const cards=review.map(card=>{
  const rr=reviewRR.get(card.card_id);if(!rr)throw new Error(`${card.card_id} research record missing`);
  if(card.status!=='REVIEW_READY'||rr.lifecycle_state!=='REVIEW_READY'||rr.human_editorial_release?.status!=='PENDING')throw new Error(`${card.card_id} is not REVIEW_READY/PENDING`);
  const assetIds=[card.assets.illustration_asset_id,card.assets.share_asset_id,card.assets.audio_asset_id];
  return {
    card_id:card.card_id,term:card.term,experience_type:card.experience_type,front:card.front,meaning:card.meaning,comparisons:card.comparisons,semantic_tags:card.semantic_tags,relations:card.relations,verification:card.verification,
    machine_evidence:{lexical_verification:rr.lexical_verification,semantic_definition_and_boundaries:rr.semantic_definition_and_boundaries,cultural_context_review:rr.cultural_context_review,comparisons:rr.comparisons,pronunciation_verification:rr.pronunciation_verification,illustration_brief:rr.illustration_brief,editorial_copy:rr.editorial_copy,automated_gates:rr.automated_gates},
    public_references:card.reference_ids.map(id=>{const r=refMap.get(id);if(!r)throw new Error(`${card.card_id} missing reference ${id}`);return {reference_id:id,source_type:r.source_type,title:r.title,publisher_or_container:r.publisher_or_container,citation_display:r.citation_display,url:r.url,license:r.license,rights_note:r.rights_note};}),
    assets:assetIds.map(id=>{const a=assetMap.get(id);if(!a)throw new Error(`${card.card_id} missing asset ${id}`);return {asset_id:id,asset_type:a.asset_type,path:a.path,creator_or_model:a.creator_or_model,source_url:a.source_url,license_or_rights_basis:a.license_or_rights_basis,attribution:a.attribution,sha256:a.sha256,review_status:a.review_status};}),
    human_editorial_release_checklist:Object.fromEntries(checklistNames.map(k=>[k,'PENDING'])),human_release_status:'PENDING'
  };
});
const matrix=read('docs/ops/evidence/G5_DIVERSITY_MATRIX.json');
const packet={schema_version:'1.0.0',goal:'G5',packet_type:'FORTY_SEVEN_CARD_HUMAN_EDITORIAL_RELEASE_REVIEW',generated_at_date:DATE,approved_baseline:{card_ids:approved.map(x=>x.card_id),human_release_status:'APPROVED',re_review_required:false,planned_retire_at_g5_cutover:['C0004','C0005']},pending_card_ids:review.map(x=>x.card_id),diversity_matrix:matrix,cards,release_boundary:{current_public_cards:approved.map(x=>x.card_id),pending_cards_must_not_be_public:review.map(x=>x.card_id),planned_retirements:['C0004','C0005'],prospective_final_active_card_ids:['C0001','C0002','C0003',...review.map(x=>x.card_id)],prospective_final_active_count:50,external_publish_authorized:false,repository_push_authorized:false,g5_complete:false},approval_instruction:'Human review must explicitly approve, request changes, or HOLD the 47 pending cards. Machine PASS is not Human Editorial Release. C0004/C0005 remain canary-only until the final cutover and are not counted toward the final active 50.'};
const blocker={schema_version:'1.0.0',goal:'G5',status:'BLOCKED_ON_HUMAN_EDITORIAL_RELEASE',generated_at_date:DATE,baseline_approved_cards:approved.map(x=>x.card_id),planned_retirements:['C0004','C0005'],pending_card_ids:review.map(x=>x.card_id),human_review_packet:'docs/ops/review/G5_HUMAN_EDITORIAL_REVIEW_PACKET_2026-09-16.json',machine_gate_status:'PASS',human_release_status:'PENDING_47_OF_47',g5_complete:false,prospective_final_active_count:50,external_publish_authorized:false,repository_push_authorized:false,unblock_condition:'Explicit human release decision for C0006-C0052, then versioned retirement of C0004/C0005, followed by 50-active-card full regression and clean-checkout reproduction.'};
write('docs/ops/review/G5_HUMAN_EDITORIAL_REVIEW_PACKET_2026-09-16.json',packet);write('docs/ops/blockers/G5_HUMAN_EDITORIAL_RELEASE_REQUIRED_2026-09-16.json',blocker);
console.log(JSON.stringify({status:'PASS',pending_count:review.length,packet:blocker.human_review_packet,g5_complete:false},null,2));
