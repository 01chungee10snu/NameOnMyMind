import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mergeRankedResults,validateOfficialManifest,validateOfficialEntry,createFederatedDictionaryClient,createOfficialDictionaryClient} from '../../src/domain/official-dictionary.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=rel=>JSON.parse(fs.readFileSync(path.join(ROOT,rel),'utf8'));
const source=read('content/dictionary/nikl/reviewed-source.json'),manifest=read('content/dictionary/nikl/manifest.json');
const index=read('content/dictionary/nikl/index.json'),dictionary=read('content/dictionary/nikl/dictionary.json');
const openIndex=read('content/dictionary/open-ko/index.json');
const base='https://example.test/content/dictionary/open-ko/';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const clone=x=>structuredClone(x);

test('Every retained official identity and definition is exact, unnumbered and source-attributed',()=>{
 assert.equal(sha(fs.readFileSync(path.join(ROOT,'content/dictionary/nikl/reviewed-source.json'))),'49385654031976a0a14cb1da2f95ca4d58a6dfd4feb581c45cfa9f95e314e33d');
 assert.equal(source.entries.length,287);assert.equal(index.entries.length,287);
 assert.equal(new Set(index.entries.map(r=>r[1])).size,277);
 for(const e of source.entries){const d=dictionary.entries['NK'+e.target_code];assert.equal(d.word,e.word);assert.equal(d.homonym,e.homonym);assert.equal(d.pos,'');assert.deepEqual(d.senses,e.senses);assert.equal(d.source_url,e.source_url);assert.equal(d.capture_date,source.retrieved_at);assert.equal(d.license,'CC BY-SA 2.0 KR');assert.equal(d.coverage,'PARTIAL_SEARCH_CAPTURE_ONLY_NOT_FULL_ENTRY');}
 assert.equal(validateOfficialManifest(manifest,index,dictionary),true);
 assert.equal(manifest.daily_card_promotion,false);assert.equal(manifest.child_usability_tested,false);
 for(const name of ['index.json','dictionary.json'])assert.equal(sha(fs.readFileSync(path.join(ROOT,'content/dictionary/nikl',name))),manifest.files[name].sha256);
});
test('Inventory counts are spelling counts, with 139 overlaps, 138 new spellings and 31848 combined',()=>{
 const off=new Set(index.entries.map(r=>r[1])),open=new Set(openIndex.entries.map(r=>r[1]));
 assert.equal([...off].filter(w=>open.has(w)).length,139);assert.equal([...off].filter(w=>!open.has(w)).length,138);
 assert.equal(new Set([...off,...open]).size,31848);assert.equal(manifest.combined_inventory.unique_words,31848);
 assert.equal(index.entries.filter(r=>r[1]==='감상').length,2);
});
test('Full-result totals are not the sum of two truncated pages and homographs remain separate',()=>{
 for(const q of ['가','감','감상','마음','망설이다']){
  const off=index.entries.filter(r=>r[1].includes(q)),spellings=new Set(off.map(r=>r[1]));
  const wiki=openIndex.entries.filter(r=>r[1].includes(q)&&!spellings.has(r[1]));
  const result=mergeRankedResults({officialRows:index.entries,wiktionaryRows:openIndex.entries},q);
  assert.equal(result.total,off.length+wiki.length);assert.ok(result.rows.length<=12);
 }
 const result=mergeRankedResults({officialRows:index.entries,wiktionaryRows:openIndex.entries},'가');
 assert.ok(result.total>24);assert.equal(result.rows[0][1],'가');assert.equal(result.rows[0][3],'WIKTIONARY');
 const homographs=mergeRankedResults({officialRows:index.entries,wiktionaryRows:openIndex.entries},'감상').rows.filter(r=>r[1]==='감상');
 assert.equal(homographs.length,2);assert.equal(new Set(homographs.map(r=>r[0])).size,2);assert.ok(homographs.every(r=>r[3]==='NIKL'));
});
test('Versions, required hashes, identities, source URLs, licensing and order provenance are strict',()=>{
 for(const mutate of [m=>m.source_sha256='',m=>delete m.files['index.json'].sha256,m=>m.version='wrong',m=>m.official_sense_numbers_known=true]){const m=clone(manifest);mutate(m);assert.throws(()=>validateOfficialManifest(m,index,dictionary));}
 for(const mutate of [e=>e.source_url='https://krdict.korean.go.kr/evil?key=not-a-key',e=>e.source_url=e.source_url.replace('28035','99999'),e=>e.id='NK9999',e=>e.senses[0].sense_order=1,e=>e.senses[0].sense_order_status='GUESSED',e=>e.license='public-domain',e=>e.provider='WIKTIONARY']){const e=clone(dictionary.entries.NK28035);mutate(e);assert.throws(()=>validateOfficialEntry(e));}
 const bad=clone(index);bad.entries[0][1]='다른말';assert.throws(()=>validateOfficialManifest(manifest,bad,dictionary));
});
async function withMock(options,fn){
 const previous=globalThis.fetch,calls=[];
 globalThis.fetch=(url,init={})=>{
  const u=new URL(String(url));calls.push({url:String(url),init});const rel=u.pathname.slice(1);
  const official=rel.includes('/nikl/'),wiki=rel.includes('/open-ko/');
  if((official&&options.failOfficial)||(wiki&&options.failWiki))return Promise.reject(new TypeError('simulated unavailable'));
  const produce=()=>{let bytes=fs.readFileSync(path.join(ROOT,rel));if(options.corrupt&&rel.endsWith(options.corrupt))bytes=Buffer.concat([bytes,Buffer.from(' ')]);return new Response(bytes,{status:200,headers:{'content-type':'application/json'}})};
  if(options.delay||options.hangOfficial&&official)return new Promise((resolve,reject)=>{
    if(init.signal?.aborted){reject(init.signal.reason);return;}
    const timer=setTimeout(()=>resolve(produce()),options.hangOfficial&&official?10000:options.delay);
    init.signal?.addEventListener('abort',()=>{clearTimeout(timer);reject(init.signal.reason)},{once:true});
  });
  return Promise.resolve(produce());
 };
 try{return await fn(calls)}finally{globalThis.fetch=previous}
}
test('Client is lazy; invalid queries and IDs cause zero fetches',async()=>withMock({},async calls=>{
 const c=createFederatedDictionaryClient(base);assert.equal(calls.length,0);
 await assert.rejects(c.search('https://evil.example'));await assert.rejects(c.entry('NK<script>'));assert.equal(calls.length,0);
}));
test('Official source wins for the same spelling and actual source URLs never contain credentials',async()=>withMock({},async calls=>{
 const c=createFederatedDictionaryClient(base),r=await c.search('가뿐하다');assert.equal(r.rows[0][3],'NIKL');assert.equal(r.rows.filter(x=>x[1]==='가뿐하다').length,1);
 const e=await c.entry(r.rows[0][0]);assert.equal(e.word,'가뿐하다');assert.equal(e.senses[0].definition,'마음에 부담이 없이 가볍고 편하다.');assert.equal(e.senses[0].sense_order,null);
 assert.equal(e.license_url,'https://creativecommons.org/licenses/by-sa/2.0/kr/');assert.ok(calls.every(x=>x.init.credentials==='omit'&&x.init.referrerPolicy==='no-referrer'&&!x.url.includes('key=')));
}));
test('Official outage remains unavailable on repeated searches while Wiktionary stays usable',async()=>withMock({failOfficial:true},async()=>{
 const c=createFederatedDictionaryClient(base);for(let i=0;i<2;i++){const r=await c.search('가뿐하다');assert.equal(r.providers.official.available,false);assert.equal(r.providers.wiktionary.available,true);assert.equal(r.rows[0][3],'WIKTIONARY');assert.equal(c.officialStatus.available,false);}
}));
test('Wiktionary outage does not reject available official results',async()=>withMock({failWiki:true},async()=>{
 const c=createFederatedDictionaryClient(base),r=await c.search('가슴앓이');assert.equal(r.providers.wiktionary.available,false);assert.equal(r.providers.official.available,true);assert.equal((await c.entry(r.rows[0][0])).word,'가슴앓이');
}));
test('Both unavailable providers produce an explicit recoverable error',async()=>withMock({failWiki:true,failOfficial:true},async()=>{
 await assert.rejects(createFederatedDictionaryClient(base).search('마음'),{code:'ALL_PROVIDERS_UNAVAILABLE'});
}));
test('Corrupt official detail or index is excluded before official results are offered',async()=>{
 for(const file of ['nikl/index.json','nikl/dictionary.json'])await withMock({corrupt:file},async()=>{const r=await createFederatedDictionaryClient(base).search('가뿐하다');assert.equal(r.providers.official.available,false);assert.equal(r.providers.official.error,'SNAPSHOT_MISMATCH');assert.equal(r.rows[0][3],'WIKTIONARY');});
});
test('Timed-out official provider is bounded and does not block the available source',async()=>withMock({hangOfficial:true},async()=>{
 const c=createFederatedDictionaryClient(base,{timeoutMs:25,providerTimeoutMs:100}),at=Date.now();const r=await c.search('가뿐하다');assert.ok(Date.now()-at<1000);assert.equal(r.providers.official.available,false);assert.equal(r.providers.wiktionary.available,true);
}));
test('Aborting one concurrent load does not poison a newer query or cache',async()=>withMock({delay:30},async()=>{
 const c=createFederatedDictionaryClient(base),control=new AbortController();const old=c.search('가뿐하다',control.signal);const newer=c.search('가슴앓이');control.abort();await assert.rejects(old);const r=await newer;assert.equal(r.rows[0][1],'가슴앓이');assert.equal(r.providers.official.available,true);
}));
test('Returned official data cannot mutate the verified cache',async()=>withMock({},async()=>{
 const c=createOfficialDictionaryClient(base),a=await c.entry('NK14548');a.senses[0].definition='changed';const b=await c.entry('NK14548');assert.notEqual(b.senses[0].definition,'changed');
}));
test('Builder --check rejects source, review or output-byte changes in an isolated copy',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'nomm-nikl-'));
 try{
  for(const rel of ['scripts/dictionary/build-nikl-dictionary.mjs','content/dictionary/nikl','content/dictionary/open-ko/index.json']){const target=path.join(tmp,rel);fs.mkdirSync(path.dirname(target),{recursive:true});fs.cpSync(path.join(ROOT,rel),target,{recursive:true});}
  const script=path.join(tmp,'scripts/dictionary/build-nikl-dictionary.mjs'),run=()=>spawnSync(process.execPath,[script,'--check']);assert.equal(run().status,0);
  for(const rel of ['content/dictionary/nikl/reviewed-source.json','content/dictionary/nikl/index.json']){const p=path.join(tmp,rel),bytes=fs.readFileSync(p);fs.appendFileSync(p,' ');assert.notEqual(run().status,0);fs.writeFileSync(p,bytes);}
  const p=path.join(tmp,'content/dictionary/nikl/release-review.json'),d=JSON.parse(fs.readFileSync(p));d.integration_authorized=false;fs.writeFileSync(p,JSON.stringify(d));assert.notEqual(run().status,0);
 }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});

test('Frozen learning cards, schedules, world contexts and approved simple page stay byte-identical',()=>{
 const review=read('content/dictionary/nikl/release-review.json');assert.equal(Object.keys(review.preserved_learning_sha256).length,15);
 for(const [rel,expected] of Object.entries(review.preserved_learning_sha256))assert.equal(sha(fs.readFileSync(path.join(ROOT,rel))),expected,rel);
});
test('Fallback Wiktionary cache is also isolated from caller mutation',async()=>withMock({},async()=>{
 const c=createFederatedDictionaryClient(base),r=await c.search('망설이다'),id=r.rows.find(row=>row[1]==='망설이다')[0];
 const a=await c.entry(id),original=a.senses[0].definition;a.senses[0].definition='changed';assert.equal((await c.entry(id)).senses[0].definition,original);
}));
test('Wiktionary shard hashes are mandatory before any detail data is accepted',async()=>{
 const previous=globalThis.fetch;let shardRequested=false;
 globalThis.fetch=async(url)=>{const rel=new URL(String(url)).pathname.slice(1);let bytes=fs.readFileSync(path.join(ROOT,rel));if(rel.endsWith('open-ko/manifest.json')){const m=JSON.parse(bytes);for(const name of Object.keys(m.files))if(name.startsWith('entries/'))delete m.files[name].sha256;bytes=Buffer.from(JSON.stringify(m));}if(rel.includes('/entries/'))shardRequested=true;return new Response(bytes,{status:200})};
 try{const c=createFederatedDictionaryClient(base),r=await c.search('망설이다'),id=r.rows.find(row=>row[1]==='망설이다')[0];await assert.rejects(c.entry(id),{code:'INVALID_DATA'});assert.equal(shardRequested,false);}finally{globalThis.fetch=previous;}
});
test('Null or array live JSON is a controlled invalid-data error',async()=>{
 const {parseWiktionaryPayload}=await import('../../src/domain/dictionary.mjs');
 for(const payload of [null,undefined,[],true])assert.throws(()=>parseWiktionaryPayload(payload,'설레다'),{code:'INVALID_DATA'});
});
