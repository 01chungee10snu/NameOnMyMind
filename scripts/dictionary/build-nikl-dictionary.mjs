#!/usr/bin/env node
// Reproducible publication of the explicitly reviewed, credential-free NIKL capture.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const DIR=path.join(ROOT,'content/dictionary/nikl');
const PIN='49385654031976a0a14cb1da2f95ca4d58a6dfd4feb581c45cfa9f95e314e33d';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const text=x=>JSON.stringify(x,null,2)+'\n';
const fail=m=>{throw new Error(m)};
const raw=fs.readFileSync(path.join(DIR,'reviewed-source.json'));
if(hash(raw)!==PIN)fail('Reviewed source bytes changed; a new reviewed release is required.');
const source=JSON.parse(raw),review=JSON.parse(fs.readFileSync(path.join(DIR,'release-review.json'),'utf8'));
if(review.source_sha256!==PIN||review.scope!=='DICTIONARY_SEARCH_ONLY'||review.integration_authorized!==true||review.human_linguistic_review!==false)fail('Release review missing or inconsistent.');
if(review.records!==287||review.unique_words!==277||review.retrieved_at!==source.retrieved_at)fail('Review/source metadata mismatch.');
if(source.source!=='국립국어원 한국어기초사전 Open API'||source.daily_card_promotion!==false||source.entry_count!==287||source.entries.length!==287)fail('Wrong captured source.');
const version='nikl-v24-'+PIN.slice(0,16),entries={},index=[],words=new Set();
for(const e of source.entries){
  if(!/^[1-9]\d*$/.test(e.target_code)||!/^[가-힣][가-힣 ·ㆍ-]{0,39}$/.test(e.word)||!/^\d+$/.test(e.homonym)||e.pos!=='')fail('Invalid original identity.');
  const id='NK'+e.target_code,url='https://krdict.korean.go.kr/eng/dicSearch/SearchView?ParaWordNo='+e.target_code+'&nation=eng';
  if(entries[id]||e.source_url!==url||!Array.isArray(e.senses)||!e.senses.length)fail('Duplicate or invalid source entry.');
  for(const s of e.senses){
    if(typeof s.definition!=='string'||!s.definition.trim()||s.definition.length>1000||s.sense_order!==null||s.sense_order_status!=='API_DID_NOT_PROVIDE_VALID_ORDER')fail('Invalid captured sense.');
  }
  entries[id]={id,target_code:e.target_code,word:e.word,homonym:e.homonym,pos:e.pos,provider:'NIKL',source:source.source,
    source_url:e.source_url,capture_date:source.retrieved_at,license:'CC BY-SA 2.0 KR',license_url:'https://creativecommons.org/licenses/by-sa/2.0/kr/',
    status:'DICTIONARY_SEARCH_ONLY',coverage:'PARTIAL_SEARCH_CAPTURE_ONLY_NOT_FULL_ENTRY',senses:e.senses};
  index.push([id,e.word,e.homonym]);words.add(e.word);
}
if(words.size!==277)fail('Unique spelling count mismatch.');
const old=JSON.parse(fs.readFileSync(path.join(ROOT,'content/dictionary/open-ko/index.json'),'utf8'));
const oldWords=new Set(old.entries.map(row=>row[1]));
const overlap=[...words].filter(w=>oldWords.has(w)).length;
const outputs={'index.json':{version,entries:index},'dictionary.json':{version,entries}};
const files=Object.fromEntries(Object.entries(outputs).map(([name,value])=>[name,{sha256:hash(text(value)),bytes:Buffer.byteLength(text(value))}]));
outputs['manifest.json']={schema_version:'1.0.0',version,status:'DICTIONARY_SEARCH_ONLY',provider:'NIKL',source:source.source,
  source_name:'국립국어원 한국어기초사전',source_sha256:PIN,source_url:'https://krdict.korean.go.kr/',source_run_url:review.source_run_url,retrieved_at:source.retrieved_at,
  records:index.length,unique_words:words.size,searchable_headwords:words.size,definition_count:Object.values(entries).reduce((n,e)=>n+e.senses.length,0),
  homograph_pair_count:10,coverage:'PARTIAL_SEARCH_CAPTURE_ONLY_NOT_FULL_ENTRY',license:review.license,license_url:review.license_url,rights_source:review.rights_source,
  official_sense_numbers_known:false,daily_card_promotion:false,child_usability_tested:false,
  combined_inventory:{open_words:oldWords.size,overlap_words:overlap,new_words:words.size-overlap,unique_words:new Set([...oldWords,...words]).size},files};
for(const [name,value] of Object.entries(outputs)){
  const p=path.join(DIR,name),expected=text(value);
  if(process.argv.includes('--check')){if(!fs.existsSync(p)||fs.readFileSync(p,'utf8')!==expected)fail('Stale or changed generated file: '+name);}
  else {const tmp=p+'.tmp';fs.writeFileSync(tmp,expected);fs.renameSync(tmp,p);}
}
console.log(JSON.stringify({status:'PASS',official_entries:287,official_spellings:277,combined_spellings:outputs['manifest.json'].combined_inventory.unique_words,mode:process.argv.includes('--check')?'check':'build'}));
