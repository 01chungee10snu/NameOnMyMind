#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createPositiveLearningModel} from '../../src/domain/positive-learning.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const bytes=p=>fs.readFileSync(path.join(ROOT,p));
const read=p=>JSON.parse(bytes(p));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const policy=read('content/korean-expression/positive-focus-v1.json');
const vocabulary=read('content/korean-expression/learning-vocabulary-v1.json');
const world=read('content/korean-expression/world-contexts-v1.json');
for(const [key,p] of Object.entries({vocabulary:'content/korean-expression/learning-vocabulary-v1.json',world:'content/korean-expression/world-contexts-v1.json'})) {
 if(hash(bytes(p))!==policy.source_sha256?.[key]) throw new Error('Frozen source changed: '+key);
}
const model=createPositiveLearningModel(vocabulary,policy,world);
const expected=[['KE0001','KE0063','4214169','기쁘다'],['KE0004','AX0001','4188387','유쾌하다'],['KE0006','AX0002','4184970','불행하다'],['KE0027','AX0003','4381623','편안하다']];
const lexical=policy.relations.filter(r=>r.kind==='LEXICAL_ANTONYM');
if(lexical.length!==expected.length)throw new Error('Antonym evidence set changed; review is required.');
for(const [focus,target,revision,title] of expected){
 const r=lexical.find(r=>r.focus_id===focus&&r.target_id===target);
 const u=new URL(r?.source_url||'https://invalid.example/');
 if(u.searchParams.get('oldid')!==revision||u.searchParams.get('title')!==title)throw new Error('Source-backed relation mismatch');
}
if(policy.child_comprehension_tested!==false||policy.selection_basis!=='MODEL_EDITORIAL_DISPLAY_PRIORITY_NOT_VALIDATED_EMOTION_CLASSIFICATION')throw new Error('Editorial boundary changed.');
console.log(JSON.stringify({status:'PASS',positive_entries:model.focusIds().length,lexical_antonyms:lexical.length,contextual_contrasts:policy.relations.length-lexical.length,original_entries:vocabulary.term_count,world_entries:world.entries.length}));
