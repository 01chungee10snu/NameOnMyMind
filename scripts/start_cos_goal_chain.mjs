#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const bindingPath = path.join(root, 'reports/harness/cos_goal_chain/nameonmymind_goal_chain_binding.json');
const binding = JSON.parse(fs.readFileSync(bindingPath, 'utf8'));
if (binding.status !== 'GOAL_CHAIN_ACCEPTED') throw new Error(`goal chain not accepted: ${binding.status}`);
if (!binding.cos_session_id) throw new Error('missing COS session id');
if (binding.external_publish_authorized !== false || binding.repository_push_authorized !== false) throw new Error('unsafe external authority');
const session = String(binding.cos_session_id);

async function getJson(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
class Cdp {
  constructor(url) { this.url=url; this.seq=0; this.waiters=new Map(); }
  async open() {
    this.socket = new WebSocket(this.url);
    await new Promise((res,rej)=>{
      const t=setTimeout(()=>rej(new Error('CDP open timeout')),10000);
      this.socket.addEventListener('open',()=>{clearTimeout(t);res();},{once:true});
      this.socket.addEventListener('error',()=>{clearTimeout(t);rej(new Error('CDP error'));},{once:true});
    });
    this.socket.addEventListener('message',e=>{
      let m; try{m=JSON.parse(String(e.data));}catch{return;}
      const w=this.waiters.get(m.id); if(!w)return;
      this.waiters.delete(m.id);
      m?.result?.exceptionDetails ? w.reject(new Error(m.result.exceptionDetails.text||'Runtime.evaluate exception')) : w.resolve(m?.result?.result?.value);
    });
  }
  evaluate(expr, timeout=20000) {
    const id=++this.seq;
    return new Promise((res,rej)=>{
      const t=setTimeout(()=>{this.waiters.delete(id);rej(new Error('Runtime.evaluate timeout'));},timeout);
      this.waiters.set(id,{resolve:v=>{clearTimeout(t);res(v);},reject:e=>{clearTimeout(t);rej(e);}});
      this.socket.send(JSON.stringify({id,method:'Runtime.evaluate',params:{expression:expr,awaitPromise:true,returnByValue:true}}));
    });
  }
  close(){try{this.socket?.close();}catch{}}
}

const pages = await getJson('http://127.0.0.1:17776/json/list');
const page = pages.find(x=>x?.type==='page' && x?.title==='Chat On Steroids');
if(!page?.webSocketDebuggerUrl) throw new Error('running COS renderer not found');
const cdp = new Cdp(page.webSocketDebuggerUrl); await cdp.open();
try {
  const controls = await cdp.evaluate(`window.api.getSessionControls(${JSON.stringify(session)}).then(r=>r.ok?{ok:true,data:r.data}:{ok:false,error:r.error})`);
  if(!controls?.ok) throw new Error(`controls unavailable ${controls?.error||''}`);
  if(controls.data?.automation !== 'goal') throw new Error(`session automation is ${controls.data?.automation}`);
  if(controls.data?.activeTurnId) throw new Error(`session already active: ${controls.data.activeTurnId}`);
  const objective = String(controls.data?.objective || '');
  if(!objective.trim()) throw new Error('goal objective missing');
  if(crypto.createHash('sha256').update(objective).digest('hex') !== binding.objective_sha256) throw new Error('objective hash mismatch');

  const inputId = crypto.randomUUID();
  const text = [
    '실행을 시작하세요. acceptance-only 단계는 끝났습니다.',
    '현재 durable objective의 G1부터 실제 작업을 수행하십시오.',
    '먼저 NameOnMyMind workspace의 git 상태, 활성 프로세스, canonical source lineage를 재검증하고 중복 작업이 없음을 확인하세요.',
    '그 다음 G1의 첫 미완료 exit criterion부터 실제 파일 수정·테스트·검증을 진행하세요.',
    '각 Goal이 완전히 PASS하면 같은 durable objective에 따라 다음 Goal로 자동 승계하고, G5 deploy-ready 완료 또는 명시된 fail-closed blocker에서만 멈추세요.',
    '외부 push/Pages publish/도메인 변경은 수행하지 마세요.'
  ].join('\n');
  const args = { id:inputId, sessionId:session, projectId:null, text, mode:'auto', dueAt:Date.now(), model:null, reasoningEffort:null, objective, automation:'goal' };
  const accepted = await cdp.evaluate(`window.api.sendInput(${JSON.stringify(args)}).then(r=>r.ok?{ok:true,id:r.data.id,state:r.data.state}:{ok:false,error:r.error})`,20000);
  if(!accepted?.ok || accepted.id!==inputId) throw new Error(`send rejected ${accepted?.error||''}`);

  let state=accepted.state||'queued', conversationId=null, activeTurnId=null;
  const deadline=Date.now()+90000;
  while(Date.now()<deadline){
    const row=await cdp.evaluate(`Promise.all([window.api.listInputs(),window.api.getSessionControls(${JSON.stringify(session)})]).then(([a,b])=>{const x=a.ok?a.data.find(v=>v.id===${JSON.stringify(inputId)}):null;return {input:a.ok&&x?{state:x.state,error:x.error||null,conversationId:x.conversationId||null}:null,controls:b.ok?b.data:null,error:[a.error,b.error]}})`);
    if(row?.input?.state) state=row.input.state;
    conversationId=row?.input?.conversationId||conversationId;
    activeTurnId=row?.controls?.activeTurnId||activeTurnId;
    if(['failed','cancelled'].includes(state)) throw new Error(`input ${state}: ${row?.input?.error||''}`);
    if(state==='sent' && (activeTurnId || row?.controls?.finishWaiting || row?.controls?.goalDraft)) break;
    await new Promise(r=>setTimeout(r,1000));
  }
  const out={
    schema_version:1,
    session_id:session,
    input_id:inputId,
    input_state:state,
    conversation_id:conversationId,
    active_turn_id:activeTurnId,
    automation:'goal',
    objective_sha256:binding.objective_sha256,
    started_at_utc:new Date().toISOString(),
    external_publish_authorized:false,
    repository_push_authorized:false,
  };
  const startedPath=path.join(root,'reports/harness/cos_goal_chain/nameonmymind_goal_chain_started.json');
  fs.writeFileSync(startedPath,JSON.stringify(out,null,2)+'\n');
  console.log(`COS_GOAL_CHAIN_STARTED=true`);
  console.log(`COS_GOAL_CHAIN_SESSION=${session}`);
  console.log(`COS_GOAL_CHAIN_INPUT_STATE=${state}`);
  console.log(`COS_GOAL_CHAIN_ACTIVE_TURN=${activeTurnId||''}`);
  console.log(`COS_GOAL_CHAIN_START_ARTIFACT=${startedPath}`);
} finally { cdp.close(); }
