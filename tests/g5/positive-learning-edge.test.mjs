import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {createPositiveLearningModel,safeLearningSource} from '../../src/domain/positive-learning.mjs';
const read=rel=>JSON.parse(fs.readFileSync(new URL('../../'+rel,import.meta.url)));
const vocabulary=read('content/korean-expression/learning-vocabulary-v1.json');
const policy=read('content/korean-expression/positive-focus-v1.json');
const world=read('content/korean-expression/world-contexts-v1.json');
const clone=structuredClone;
const create=(v=vocabulary,p=policy,w=world)=>createPositiveLearningModel(v,p,w);
const date=new Date(2026,9,8,12);

test('Every day in two full cycles uses a distinct positive-only review ID, with no negative hero',()=>{
 const m=create(),seen=[];
 for(let d=0;d<122;d++){
  const entry=m.daily(new Date(2026,9,8+d,12));assert.equal(m.isPositive(entry.id),true);seen.push(entry.id);
 }
 assert.equal(new Set(seen.slice(0,61)).size,61);assert.deepEqual(seen.slice(0,61),seen.slice(61));
 assert.equal(m.daily(date).expression,'기쁘다');
 for(const d of [new Date(2026,9,31,12),new Date(2026,11,31,12),new Date(2028,1,28,12),new Date(2028,1,29,12)]){
  const next=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1,12);
  assert.equal(m.next(m.daily(d).id).id,m.daily(next).id);
 }
});

test('All original and three comparison-only terms retain exact meaning and example below a positive hero',()=>{
 const m=create();
 for(const row of [...vocabulary.entries,...policy.comparison_only_entries]){
  const s=m.select('#'+row.id,date);assert.equal(m.isPositive(s.hero.id),true);
  const displayed=m.isPositive(row.id)?s.hero:s.comparison;
  assert.equal(displayed.id,row.id);assert.equal(displayed.meaning,row.meaning);assert.equal(displayed.example,row.example);
  assert.equal(s.focus.related_ids.length,2);assert.ok(s.focus.related_ids.every(m.isPositive));
  if(!m.isPositive(row.id))assert.equal(s.openComparison,true);
 }
});

test('Four genuine antonym pairs remain distinct from 28 contextual comparisons and unrelated search',()=>{
 const m=create();
 assert.equal(policy.relations.filter(r=>r.kind==='LEXICAL_ANTONYM').length,4);
 assert.equal(policy.relations.filter(r=>r.kind==='CONTEXTUAL_CONTRAST').length,28);
 for(const r of policy.relations){
  const selected=m.select('#'+r.focus_id,date);
  if(r.kind==='LEXICAL_ANTONYM')assert.equal(selected.comparison_label,'반대말');
  else assert.notEqual(selected.relation?.kind,'LEXICAL_ANTONYM');
 }
 assert.equal(m.select('#KE0063',date).hero.expression,'기쁘다');
 assert.equal(m.select('#KE0063',date).comparison_label,'반대말');
 assert.equal(m.select('#KE0010',date).comparison_label,'찾아본 말');
 assert.equal(m.select('#KE0042',date).secondaryWorld.term,'saudade');
});

test('Default comparisons stay closed; deliberate secondary links open without falsely relabeling world words',()=>{
 const m=create();
 for(const id of m.focusIds())assert.equal(m.select('#'+id,date).openComparison,false);
 for(const w of world.entries){
  const s=m.select('#'+w.id,date);assert.equal(s.requestedWorld.id,w.id);assert.equal(s.relation,null);
  assert.equal(m.isPositive(s.hero.id),true);assert.equal(s.comparison,null);
  if(policy.primary_world_ids.includes(w.id)){assert.equal(s.primaryWorld.id,w.id);assert.equal(s.secondaryWorld,null);assert.equal(s.openComparison,false);}
  else {assert.equal(s.secondaryWorld.id,w.id);assert.equal(s.openComparison,true);}
 }
});

test('Search preserves definitions, prioritizes positive matches and keeps all seven native-language spellings searchable',()=>{
 const m=create(),results=m.search('마음');let sawOther=false;
 for(const r of results){if(r.type==='comparison')sawOther=true;if(r.type==='positive')assert.equal(sawOther,false);}
 for(const r of [...vocabulary.entries,...policy.comparison_only_entries]){
  const found=m.search(r.expression).find(x=>x.term?.id===r.id);assert.ok(found,r.expression);assert.equal(found.term.meaning,r.meaning);
 }
 assert.equal(m.search('슬프다').find(r=>r.term.id==='KE0063').label,'반대말');
 assert.equal(m.search('들뜨다').find(r=>r.term.id==='KE0010').label,'다른 마음');
 for(const w of world.entries)assert.ok(m.search(w.term.toUpperCase()).some(r=>r.world?.id===w.id));
 assert.deepEqual(m.search(''),[]);assert.deepEqual(m.search('<script>alert(1)</script>'),[]);
});

test('Model owns immutable input copies; consumer mutation cannot change tomorrow or a meaning',()=>{
 const v=clone(vocabulary),p=clone(policy),w=clone(world),m=create(v,p,w);
 v.entries[0].meaning='wrong';p.daily_ids[0]='KE0063';w.entries[0].meaning='wrong';
 assert.equal(m.daily(date).expression,'기쁘다');assert.equal(m.daily(date).meaning,vocabulary.entries[0].meaning);
 assert.throws(()=>{m.daily(date).meaning='wrong'});const ids=m.focusIds();ids.pop();assert.equal(m.focusIds().length,61);
});

test('Missing optional world data preserves daily reading, comparisons and Korean search',()=>{
 const m=create(vocabulary,policy,null);assert.equal(m.daily(date).expression,'기쁘다');
 assert.equal(m.select('#KE0063',date).comparison.expression,'슬프다');
 assert.equal(m.select('#WC07',date).requestedWorld,null);assert.ok(m.search('행복하다').length);
});

test('Invalid identity, negative suggestion, forged relation, malformed dates and unsafe sources fail closed',()=>{
 const mutations=[p=>p.daily_ids[0]='KE0063',p=>p.daily_ids[1]=p.daily_ids[0],p=>p.focus_entries[0].related_ids[0]='KE0063',p=>p.focus_entries[0].expression='슬프다',p=>p.relations[0].kind='AI_INVENTED',p=>p.relations[0].source_url='https://evil.example/',p=>p.effective_date='2026-02-30',p=>p.primary_world_ids.push('WC01')];
 for(const mutate of mutations){const p=clone(policy);mutate(p);assert.throws(()=>create(vocabulary,p,world));}
 assert.throws(()=>create().daily(new Date('invalid')));
 for(const url of ['javascript:alert(1)','http://krdict.korean.go.kr/','https://krdict.korean.go.kr.evil.example/','https://u:p@krdict.korean.go.kr/','https://krdict.korean.go.kr:9999/','https://krdict.korean.go.kr/?key=x'])assert.equal(safeLearningSource(url),false);
 assert.equal(create().select('#<img>',date).hero.expression,'기쁘다');
});

test('Original learning and world snapshots have not been rewritten by display policy',()=>{
 for(const [key,file] of [['vocabulary','learning-vocabulary-v1.json'],['world','world-contexts-v1.json']]){
  const b=fs.readFileSync(new URL('../../content/korean-expression/'+file,import.meta.url));assert.equal(crypto.createHash('sha256').update(b).digest('hex'),policy.source_sha256[key]);
 }
});

test('Legitimate official dictionary searchKeywordTo is not mistaken for an API secret',()=>{
 assert.equal(safeLearningSource('https://stdict.korean.go.kr/search/searchView.do?word_no=234001&searchKeywordTo=3'),true);
 assert.equal(safeLearningSource('https://stdict.korean.go.kr/?api_key=x'),false);
});
