import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { normalizeHeadword, rankDictionaryEntries, dictionaryArticleUrl, validateDictionaryEntry, matchWorldContext, createDictionaryClient } from '../../src/domain/dictionary.mjs';
const root = new URL('../../', import.meta.url);
const read = rel => JSON.parse(fs.readFileSync(new URL(rel,root),'utf8'));
const manifest = read('content/dictionary/open-ko/manifest.json');
const index = read('content/dictionary/open-ko/index.json');
const world = read('content/korean-expression/world-contexts-v1.json');

test('Broad dictionary inventory is separate from the 177 curated cards and is not an emotion count',()=>{
  assert.ok(index.entries.length > 30_000);
  assert.equal(manifest.searchable_headwords,index.entries.length);
  assert.equal(manifest.status,'DICTIONARY_SEARCH_ONLY');
  assert.equal(manifest.child_usability_tested,false);
  assert.equal(read('content/korean-expression/learning-vocabulary-v1.json').term_count,177);
  assert.equal(read('content/korean-expression/learning-daily-v3.json').term_count,177);
  assert.equal(new Set(index.entries.map(row=>row[0])).size,index.entries.length);
  assert.equal(new Set(index.entries.map(row=>row[1])).size,index.entries.length);
});

test('Every imported shard is hash-linked, with nonempty separate senses and no media or literary examples',()=>{
  let count=0, definitions=0;
  for(const [file,meta] of Object.entries(manifest.files)){
    const bytes=fs.readFileSync(new URL('content/dictionary/open-ko/'+file,root));
    assert.equal(bytes.length,meta.bytes);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),meta.sha256,file);
    if(!file.startsWith('entries/'))continue;
    const shard=JSON.parse(bytes);assert.equal(shard.version,manifest.version);
    for(const entry of Object.values(shard.entries)){
      validateDictionaryEntry(entry);count++;definitions+=entry.senses.length;
      assert.equal(entry.status,'DICTIONARY_SEARCH_ONLY');
      assert.ok(!('examples' in entry)&&!('sounds' in entry)&&!('translations' in entry));
    }
  }
  assert.equal(count,manifest.searchable_headwords);
  assert.equal(definitions,manifest.definition_count);
});

test('Query normalization, exact match priority and bounded results avoid full-sentence or URL requests',()=>{
  assert.equal(normalizeHeadword('  망설이다 '),'망설이다');
  for(const value of ['','https://example.com','<img src=x>','../secret','a'.repeat(50),'오늘은 너무 힘들다.'])assert.throws(()=>normalizeHeadword(value));
  const result=rankDictionaryEntries(index.entries,'망설이다');
  assert.equal(result.rows[0][1],'망설이다');
  assert.ok(rankDictionaryEntries(index.entries,'마음').rows.length<=12);
  assert.equal(dictionaryArticleUrl('망설이다',123),'https://ko.wiktionary.org/w/index.php?title=%EB%A7%9D%EC%84%A4%EC%9D%B4%EB%8B%A4&oldid=123');
});

test('Foreign companions are text-only contextual overlaps with primary source links, not HOLD full-card promotions',()=>{
  assert.equal(world.entries.length,7);
  assert.equal(new Set(world.entries.map(row=>row.lang)).size,5);
  const seen=new Set();
  for(const row of world.entries){
    assert.equal(row.relation,'PARTIAL_CONTEXT_OVERLAP');
    assert.equal(row.copy_status,'MODEL_EDITED_TEXT_ONLY');
    assert.ok(row.meaning.length < 100 && row.difference && row.locator && row.checked_at);
    assert.ok(row.source_url.startsWith('https://'));
    assert.ok(!row.audio && !row.illustration && !row.card_id);
    for(const anchor of row.anchors){assert.ok(!seen.has(anchor));seen.add(anchor)}
  }
  assert.equal(matchWorldContext(world,'그립다').term,'saudade');
  assert.equal(matchWorldContext(world,'포근하다').term,'Geborgenheit');
  assert.equal(matchWorldContext(world,'초조하다').term,'Torschlusspanik');
  assert.equal(matchWorldContext(world,'사과나무'),null);
  assert.equal(read('content/g5/research-records/C0016.json').lifecycle_state,'HOLD');
  assert.equal(read('content/g5/research-records/C0032.json').lifecycle_state,'HOLD');
});

test('The interface sends no dictionary query on typing and has no API key or reflective-text dependency',()=>{
  const ui=fs.readFileSync(new URL('src/ui/learning-dictionary.mjs',root),'utf8');
  assert.match(ui,/searchInput.addEventListener\('input',cancel\)/);
  assert.match(ui,/dictionary-live/);
  assert.doesNotMatch(ui,/#sentence|localStorage|sessionStorage|KRDICT_API_KEY|sendBeacon/);
  assert.match(ui,/AbortController/);
  assert.match(ui,/activeController.abort/);
  assert.ok(fs.readFileSync(new URL('content/dictionary/ATTRIBUTION.md',root),'utf8').includes('CC BY-SA 4.0'));
});

test('Anonymous live API requests use a fixed origin, no cookies and rate-limit backoff',async()=>{
  const oldFetch=globalThis.fetch;let calls=0;
  globalThis.fetch=async(url,options)=>{
    calls++;assert.equal(url.origin,'https://ko.wiktionary.org');assert.equal(url.searchParams.get('page'),'망설이다');
    assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');
    assert.equal(url.searchParams.get('origin'),'*');return new Response('',{status:429});
  };
  try{
    const client=createDictionaryClient('https://example.test/dictionary/');
    await assert.rejects(client.live('망설이다'),e=>e.code==='RATE_LIMITED');
    await assert.rejects(client.live('망설이다'),e=>e.code==='RATE_LIMITED');
    assert.equal(calls,1);
  }finally{globalThis.fetch=oldFetch}
});

test('Oversized live API payloads are rejected before HTML processing',async()=>{
  const original=globalThis.fetch;
  globalThis.fetch=async()=>new Response('{}',{status:200,headers:{'content-length':'2000000'}});
  try{await assert.rejects(createDictionaryClient('https://example.test/').live('검증'),e=>e.code==='OVERSIZED_RESPONSE')}
  finally{globalThis.fetch=original}
});

test('Source refresh collects review artifacts and never exposes a NIKL key to the browser',()=>{
  const workflow=fs.readFileSync(new URL('.github/workflows/dictionary-refresh.yml',root),'utf8');
  assert.match(workflow,/workflow_dispatch/);
  assert.match(workflow,/secrets.KRDICT_API_KEY/);
  assert.doesNotMatch(workflow,/git push|contents: write|pages: write/);
  const ui=fs.readFileSync(new URL('prototypes/korean-daily-learning-20260923/index.html',root),'utf8');
  assert.doesNotMatch(ui,/KRDICT_API_KEY|api\/search\?key/);
  assert.match(ui,/spellcheck="false"/);
});
