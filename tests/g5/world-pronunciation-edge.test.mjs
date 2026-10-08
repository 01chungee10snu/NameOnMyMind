import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createPronunciationController,selectPronunciationVoice} from '../../src/ui/world-pronunciation.mjs';
import {WORLD_PRONUNCIATIONS as words} from '../../src/domain/world-pronunciation-data.mjs';
import {worldMarkup,worldSourceMarkup} from '../../src/ui/learning-dictionary.mjs';
const ROOT=fileURLToPath(new URL('../../',import.meta.url));
class Events {
  constructor(){this.handlers=new Map()}
  addEventListener(k,f){if(!this.handlers.has(k))this.handlers.set(k,new Set());this.handlers.get(k).add(f)}
  removeEventListener(k,f){this.handlers.get(k)?.delete(f)}
  emit(k,event={}){for(const f of [...(this.handlers.get(k)||[])])f(event)}
  count(){return [...this.handlers.values()].reduce((n,s)=>n+s.size,0)}
}
const voice=(lang,name='sample',local=true)=>({lang,name,localService:local});
function setup(initial=[voice('pt-BR')], options={}) {
 const doc=new Events(),win=new Events();doc.hidden=false;doc.body={};doc.contains=b=>b.connected!==false;
 const requests=[],timers=new Map();let seq=0,cancels=0,current=null,observer;
 const synth=new Events();synth.voices=initial;synth.getVoices=()=>synth.voices;
 synth.speak=u=>{requests.push(u);current=u};synth.cancel=()=>{cancels++;current?.onerror?.({error:'canceled'})};
 class U{constructor(text){this.text=text}}
 class O{constructor(cb){this.cb=cb;observer=this}observe(){}disconnect(){this.disconnected=true}fire(){this.cb()}}
 const ctl=createPronunciationController({speechSynthesis:synth,Utterance:U,documentObject:doc,windowObject:win,Observer:O,setTimeoutFn:(f,ms)=>{const id=++seq;timers.set(id,{f,ms});return id},clearTimeoutFn:id=>timers.delete(id),...options});
 const button=(id='WC01',mode)=>{
  const status={textContent:''},section={querySelector:()=>status};
  return {dataset:{pronunciationId:id,...(mode?{pronunciationMode:mode}:{})},textContent:mode==='slow'?'천천히':'듣기',attrs:{},connected:true,closest:()=>section,setAttribute(k,v){this.attrs[k]=v},status};
 };
 const tick=ms=>{for(const [id,item] of [...timers])if(item.ms<=ms){timers.delete(id);item.f()}};
 return {doc,win,synth,requests,timers,ctl,button,tick,get observer(){return observer},get cancels(){return cancels}};
}

test('Exact voice locale matching rejects Welsh-English, Brazilian-European and Mandarin-Cantonese substitutions',()=>{
 for(const [id,wrong] of [['WC02','en-GB'],['WC01','pt-PT'],['WC07','zh-HK'],['WC07','yue-HK'],['WC07','zh-TW']])assert.equal(selectPronunciationVoice([voice(wrong)],words.get(id)),null);
 assert.equal(selectPronunciationVoice([voice('PT_br')],words.get('WC01')).lang,'PT_br');
 assert.equal(selectPronunciationVoice([voice('en-US'),voice('cy-GB')],words.get('WC02')).lang,'cy-GB');
 const chosen=selectPronunciationVoice([voice('pt-BR','cloud',false),voice('pt-BR','Eddy'),voice('pt-BR','Luciana')],words.get('WC01'));
 assert.equal(chosen.name,'Luciana');assert.equal(chosen.localService,true);
});

test('TTS has no automatic speech; click speaks reviewed text, explicit language and voice only',()=>{
 const s=setup();assert.equal(s.requests.length,0);const b=s.button();b.dataset.text='private reflection';b.dataset.pronunciationTerm='untrusted';s.ctl.click(b);
 const u=s.requests[0];assert.equal(u.text,'saudade');assert.equal(u.lang,'pt-BR');assert.equal(u.voice,s.synth.voices[0]);assert.equal(u.rate,.85);assert.equal(u.pitch,1);
 assert.match(b.status.textContent,/준비/);assert.doesNotMatch(b.status.textContent,/재생 중/);u.onstart();assert.match(b.status.textContent,/재생 중/);u.onend();assert.equal(b.textContent,'듣기');assert.equal(b.attrs['aria-pressed'],'false');assert.equal(s.timers.size,0);s.ctl.destroy();
});

test('Slow playback resets to 천천히 after end and explicit stop',()=>{
 const s=setup(),b=s.button('WC01','slow');s.ctl.click(b);assert.equal(s.requests[0].rate,.6);assert.equal(b.textContent,'멈춤');s.requests[0].onend();assert.equal(b.textContent,'천천히');
 s.ctl.click(b);s.ctl.click(b);assert.equal(b.textContent,'천천히');assert.equal(s.requests.length,2);assert.equal(s.timers.size,0);s.ctl.destroy();
});

test('A new button cancels previous speech; late events from an old play cannot stop a replay on the same button',()=>{
 const s=setup(),normal=s.button(),slow=s.button('WC01','slow');s.ctl.click(normal);const oldEnd=s.requests[0].onend,oldError=s.requests[0].onerror;
 s.ctl.click(slow);assert.equal(normal.textContent,'듣기');assert.equal(s.cancels,1);assert.equal(s.requests[1].rate,.6);
 s.ctl.click(normal);oldEnd();oldError();assert.equal(normal.attrs['aria-pressed'],'true');assert.equal(s.requests.length,3);assert.equal(s.cancels,2);s.ctl.destroy();
});

test('Asynchronous voiceschanged is awaited once and listener is removed before speech',()=>{
 const s=setup([]),b=s.button();s.ctl.click(b);assert.equal(s.requests.length,0);assert.equal(s.synth.count(),1);
 s.synth.voices=[voice('pt-BR')];s.synth.emit('voiceschanged');s.synth.emit('voiceschanged');assert.equal(s.requests.length,1);assert.equal(s.synth.count(),0);s.ctl.destroy();assert.equal(s.timers.size,0);
});

test('Unavailable language and engine retain a readable error and never synthesize a wrong-language approximation',()=>{
 const s=setup([voice('en-GB')]),b=s.button('WC02');s.ctl.click(b);s.tick(1800);assert.equal(s.requests.length,0);assert.match(b.status.textContent,/언어 음성이 없어요/);assert.equal(b.textContent,'듣기');assert.equal(s.synth.count(),0);assert.equal(s.timers.size,0);s.ctl.destroy();
 const no=setup([],{speechSynthesis:null,Utterance:null}),n=no.button();no.ctl.click(n);assert.match(n.status.textContent,/지원하지/);assert.equal(no.requests.length,0);no.ctl.destroy();
});

test('No speech events, errors and throwing engines recover without stale active UI',()=>{
 const s=setup(),b=s.button();s.ctl.click(b);s.tick(12000);assert.match(b.status.textContent,/응답이 늦어요/);assert.equal(b.textContent,'듣기');assert.equal(s.timers.size,0);
 s.ctl.click(b);s.requests.at(-1).onerror({error:'network'});assert.match(b.status.textContent,/재생하지 못했어요/);assert.equal(s.timers.size,0);
 s.synth.speak=()=>{throw new Error('engine unavailable')};assert.doesNotThrow(()=>s.ctl.click(b));assert.equal(b.textContent,'듣기');s.ctl.destroy();
});

test('Navigation cancels a pending voice lookup and queued callbacks cannot restart it',()=>{
 const s=setup([]),b=s.button();s.ctl.click(b);const oldReady=[...s.synth.handlers.get('voiceschanged')][0];s.win.emit('hashchange');s.synth.voices=[voice('pt-BR')];oldReady();s.tick(1800);
 assert.equal(s.requests.length,0);assert.equal(s.synth.count(),0);assert.equal(s.timers.size,0);assert.equal(b.textContent,'듣기');s.ctl.destroy();
});

test('Removed dictionary result, hidden page, closed details and pagehide each stop playback',()=>{
 for(const operation of [(s,b)=>{b.connected=false;s.observer.fire()},s=>{s.doc.hidden=true;s.doc.emit('visibilitychange')},(s,b)=>s.doc.emit('toggle',{target:{tagName:'DETAILS',open:false,contains:x=>x===b}}),s=>s.win.emit('pagehide')]){
  const s=setup(),b=s.button();s.ctl.click(b);operation(s,b);assert.equal(s.cancels,1);assert.equal(b.textContent,'듣기');assert.equal(s.timers.size,0);s.ctl.destroy();
 }
});

test('Destroy removes all event handlers and observers and disallows subsequent speech',()=>{
 const s=setup(),b=s.button();s.ctl.click(b);s.ctl.destroy();s.ctl.destroy();s.ctl.click(b);assert.equal(s.requests.length,1);assert.equal(s.doc.count(),0);assert.equal(s.win.count(),0);assert.equal(s.synth.count(),0);assert.ok(s.observer.disconnected);assert.equal(s.timers.size,0);
});

test('Unknown IDs, unsupported mode, detached button and hidden page never enter the speech engine',()=>{
 const s=setup();s.ctl.click(s.button('unreviewed'));s.ctl.click(s.button('WC01','arbitrary'));const detached=s.button();detached.connected=false;s.ctl.click(detached);s.doc.hidden=true;s.ctl.click(s.button());assert.equal(s.requests.length,0);s.ctl.destroy();
});

test('Every world context has readable IPA, approximate Korean and native reading where needed; missing enrichment retains meaning',()=>{
 const world=JSON.parse(fs.readFileSync(path.join(ROOT,'content/korean-expression/world-contexts-v1.json')));
 for(const row of world.entries){const p=words.get(row.id),markup=worldMarkup(world,row.anchors[0]);assert.ok(markup.includes(p.ipa));assert.ok(markup.includes(p.korean_guide));assert.equal((markup.match(/data-pronunciation-id=/g)||[]).length,2);assert.equal((markup.match(/<details/g)||[]).length,0);assert.match(worldSourceMarkup(world,row.anchors[0]),/CC BY-SA 4.0/);if(['WC06','WC07'].includes(row.id))assert.ok(markup.includes(p.reading));}
 const newWorld={...world,entries:[{...world.entries[0],id:'WC99'}]};assert.ok(worldMarkup(newWorld,'그립다').includes(world.entries[0].meaning));assert.doesNotMatch(worldMarkup(newWorld,'그립다'),/data-pronunciation-id=/);
 assert.equal(words.set,undefined);assert.throws(()=>{words.get('WC01').voice_locales.push('en-US')},TypeError);
});

test('Compilation rejects identity, spoken-text, wrong-locale and source-origin drift',()=>{
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'nomm-pron-'));
 try{
  for(const rel of ['scripts/korean/build-world-pronunciation-data.mjs','content/korean-expression/world-contexts-v1.json','content/korean-expression/world-pronunciations-v1.json','src/domain/world-pronunciation-data.mjs']){const target=path.join(tmp,rel);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(ROOT,rel),target)}
  const file=path.join(tmp,'content/korean-expression/world-pronunciations-v1.json'),bytes=fs.readFileSync(file),run=()=>spawnSync(process.execPath,[path.join(tmp,'scripts/korean/build-world-pronunciation-data.mjs'),'--check']);assert.equal(run().status,0);
  for(const mutate of [d=>d.entries[0].term='wrong',d=>d.entries[0].speech_text='personal text',d=>d.entries[1].voice_locales=['en-GB'],d=>d.entries[0].source_url='https://untrusted.example/wiki/saudade']){const d=JSON.parse(bytes);mutate(d);fs.writeFileSync(file,JSON.stringify(d));assert.notEqual(run().status,0);fs.writeFileSync(file,bytes)}
 }finally{fs.rmSync(tmp,{recursive:true,force:true})}
});
