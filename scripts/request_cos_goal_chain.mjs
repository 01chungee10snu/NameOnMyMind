#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const packetPath = path.resolve(process.argv[2] || path.join(root, 'reports/harness/cos_goal_chain/latest_nameonmymind_goal_chain_packet.json'));
const packet = JSON.parse(fs.readFileSync(packetPath, 'utf8'));
const eventId = String(packet.event_id || '');
const packetSha = String(packet.packet_sha256 || '');
if (!eventId || !packetSha) throw new Error('packet identity missing');
if (packet.goal_mode !== 'goal' || packet.loop_mode_requested !== false || packet.loop_embedded_in_goal !== true) throw new Error('unsafe goal mode');
if (packet.external_publish_authorized !== false || packet.repository_push_authorized !== false) throw new Error('external authority must remain false');

const phaseLines = (packet.phases || []).flatMap(p => [
  `${p.id} — ${p.name}`,
  ...(p.exit || []).map(x => `  EXIT: ${x}`),
]);
const objective = [
  'NAMEONMYMIND DURABLE PRODUCT GOAL CHAIN',
  packet.goal,
  '',
  'Gated phases:',
  ...phaseLines,
  '',
  'Repeat loop:',
  ...(packet.loop || []),
  '',
  'Hard boundaries:',
  ...(packet.hard_boundaries || []),
  '',
  'Stop conditions:',
  ...(packet.stop_conditions || []),
].join('\n');
if (!objective.trim() || objective.length > 16000) throw new Error(`invalid objective length ${objective.length}`);
const objectiveSha = crypto.createHash('sha256').update(objective).digest('hex');
const outDir = path.join(root, 'reports', 'harness', 'cos_goal_chain');
const responsePath = path.join(outDir, `${eventId}.ack.json`);
const bindingPath = path.join(outDir, 'nameonmymind_goal_chain_binding.json');

const safe = {
  event_id: eventId,
  packet_sha256: packetSha,
  request_type: packet.request_type,
  goal_mode: 'goal',
  loop_mode_requested: false,
  loop_embedded_in_goal: true,
  goal: packet.goal,
  phases: packet.phases,
  loop: packet.loop,
  hard_boundaries: packet.hard_boundaries,
  stop_conditions: packet.stop_conditions,
  current_state: packet.current_state,
  source_lineage: packet.source_lineage,
  external_publish_authorized: false,
  repository_push_authorized: false,
};

const prompt = [
  'You are Chat On Steroids operating as the independent development orchestration peer for NameOnMyMind.',
  'This first turn is ONLY to accept or challenge the durable Goal-chain contract. Do not call tools, browse, edit files, or run commands in this acceptance turn.',
  'Review only SAFE_NAMEONMYMIND_GOAL_CHAIN_PACKET below.',
  'The durable automation mode must be Goal, not infinite Loop. The repeat loop is embedded inside the Goal so the workflow stops at deploy-ready completion or a genuine human-action blocker.',
  'Treat the phases as strict gates: G1 must complete before G2, then G3, G4, and G5. Do not skip failed exit criteria.',
  'Do not weaken evidence, pronunciation, cultural, rights, privacy, accessibility, schema, or Human Editorial Release gates.',
  'Do not expose private interviews/research notes/reflections in public artifacts.',
  'This contract never authorizes GitHub push, Pages publication, domain changes, purchases, credentials/MFA handling, or external release.',
  'After acceptance, Goal automation may use available local-development tools and web research as needed within these boundaries.',
  '',
  `SAFE_NAMEONMYMIND_GOAL_CHAIN_PACKET=${JSON.stringify(safe)}`,
  '',
  'Return exactly one JSON object, no markdown fence and no prose outside JSON.',
  `Required schema: {"source":"cos","event_id":${JSON.stringify(eventId)},"packet_sha256":${JSON.stringify(packetSha)},"status":"GOAL_CHAIN_ACCEPTED|REQUEST_CHANGES","accepted_goal":"concise Korean statement","phase_order":["G1","G2","G3","G4","G5"],"next_task":"one concrete currently actionable G1 task","hard_boundaries_acknowledged":["..."],"stop_conditions":["..."],"external_publish_authorized":false,"repository_push_authorized":false,"analysis":"concise Korean rationale"}`,
].join('\n');
if (prompt.length > 16000) throw new Error(`prompt too large ${prompt.length}`);

async function getJson(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(3000) });
  if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
  return r.json();
}
class Cdp {
  constructor(url) { this.url = url; this.socket = null; this.seq = 0; this.waiters = new Map(); }
  async open() {
    this.socket = new WebSocket(this.url);
    await new Promise((res, rej) => {
      const t = setTimeout(() => rej(new Error('CDP open timeout')), 10000);
      this.socket.addEventListener('open', () => { clearTimeout(t); res(); }, { once: true });
      this.socket.addEventListener('error', () => { clearTimeout(t); rej(new Error('CDP error')); }, { once: true });
    });
    this.socket.addEventListener('message', e => {
      let m; try { m = JSON.parse(String(e.data)); } catch { return; }
      const w = this.waiters.get(m.id); if (!w) return;
      this.waiters.delete(m.id);
      m?.result?.exceptionDetails ? w.reject(new Error(m.result.exceptionDetails.text || 'Runtime.evaluate exception')) : w.resolve(m?.result?.result?.value);
    });
  }
  evaluate(expr, timeout = 20000) {
    const id = ++this.seq;
    return new Promise((res, rej) => {
      const t = setTimeout(() => { this.waiters.delete(id); rej(new Error('Runtime.evaluate timeout')); }, timeout);
      this.waiters.set(id, { resolve: v => { clearTimeout(t); res(v); }, reject: e => { clearTimeout(t); rej(e); } });
      this.socket.send(JSON.stringify({ id, method: 'Runtime.evaluate', params: { expression: expr, awaitPromise: true, returnByValue: true } }));
    });
  }
  close() { try { this.socket?.close(); } catch {} }
}

const pages = await getJson('http://127.0.0.1:17776/json/list');
const page = pages.find(x => x?.type === 'page' && x?.title === 'Chat On Steroids');
if (!page?.webSocketDebuggerUrl) throw new Error('running COS renderer not found');
const cdp = new Cdp(page.webSocketDebuggerUrl);
await cdp.open();
try {
  const pending = await cdp.evaluate(`window.api.listInputs().then(r=>r.ok?{ok:true,count:r.data.filter(x=>['queued','browser','tool'].includes(x.state)&&!x.sessionId).length}:{ok:false,error:r.error})`);
  if (!pending?.ok) throw new Error(`outbox unavailable ${pending?.error || ''}`);
  if (Number(pending.count || 0) > 0) throw new Error('new-chat composer has pending input');

  const inputId = crypto.randomUUID();
  const args = { id: inputId, sessionId: null, projectId: null, text: prompt, mode: 'auto', dueAt: Date.now(), model: null, reasoningEffort: null, automation: 'off' };
  const accepted = await cdp.evaluate(`window.api.sendInput(${JSON.stringify(args)}).then(r=>r.ok?{ok:true,id:r.data.id}:{ok:false,error:r.error})`, 20000);
  if (!accepted?.ok || accepted.id !== inputId) throw new Error(`send rejected ${accepted?.error || ''}`);

  let session = null, state = 'queued';
  const ddl = Date.now() + 90000;
  while (Date.now() < ddl) {
    const row = await cdp.evaluate(`window.api.listInputs().then(r=>{if(!r.ok)return {ok:false,error:r.error};const x=r.data.find(v=>v.id===${JSON.stringify(inputId)});return x?{ok:true,state:x.state,session:x.deliveredSessionId||null,error:x.error||null}:{ok:false,error:'missing'}})`);
    if (!row?.ok) throw new Error(`tracking ${row?.error || ''}`);
    state = row.state; session = row.session || session;
    if (['failed','cancelled'].includes(state)) throw new Error(`input ${state}: ${row.error || ''}`);
    if (state === 'sent' && session) break;
    await new Promise(r => setTimeout(r, 1000));
  }
  if (state !== 'sent' || !session) throw new Error(`delivery timeout ${state}`);

  let text = null, turnId = null;
  const ad = Date.now() + 180000;
  while (Date.now() < ad) {
    const d = await cdp.evaluate(`window.api.getSession(${JSON.stringify(session)},{limit:160}).then(r=>{if(!r.ok)return {ok:false,error:r.error};const e=r.data.events||[];const a=e.filter(x=>x.kind==='assistant_message'&&x.final===true).map(x=>({text:x.message?.text||'',turnId:x.turnId||null}));const t=e.filter(x=>x.kind==='turn_end'&&x.outcome==='completed').map(x=>x.turnId||null);return {ok:true,a:a.slice(-3),t:t.slice(-3)}})`);
    if (!d?.ok) throw new Error(`session unavailable ${d?.error || ''}`);
    const a = d.a?.at(-1);
    if (a?.text && d.t?.some(t => !a.turnId || t === a.turnId)) { text = String(a.text).trim(); turnId = a.turnId; break; }
    await new Promise(r => setTimeout(r, 1500));
  }
  if (!text) throw new Error('acceptance turn not completed');

  let ack; try { ack = JSON.parse(text); } catch { throw new Error(`non-JSON COS ack: ${text.slice(0, 600)}`); }
  ack.source = 'cos'; ack.event_id = eventId; ack.packet_sha256 = packetSha;
  ack.external_publish_authorized = false; ack.repository_push_authorized = false;
  ack.cos_turn_id = turnId; ack.reviewed_at_utc = new Date().toISOString();

  let controls = null;
  if (ack.status === 'GOAL_CHAIN_ACCEPTED') {
    const set = await cdp.evaluate(`window.api.setSessionObjective(${JSON.stringify(session)},${JSON.stringify(objective)},'goal').then(r=>r.ok?{ok:true,data:r.data}:{ok:false,error:r.error})`, 30000);
    if (!set?.ok) throw new Error(`set objective failed ${set?.error || ''}`);
    controls = await cdp.evaluate(`window.api.getSessionControls(${JSON.stringify(session)}).then(r=>r.ok?{ok:true,data:r.data}:{ok:false,error:r.error})`);
    if (!controls?.ok) throw new Error(`controls failed ${controls?.error || ''}`);
    if (controls.data?.automation !== 'goal' || String(controls.data?.objective || '') !== objective) throw new Error('Goal binding readback mismatch');
  }

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(responsePath, JSON.stringify(ack, null, 2) + '\n');
  const binding = {
    schema_version: 1,
    event_id: eventId,
    packet_sha256: packetSha,
    status: ack.status,
    cos_session_id: session,
    objective_sha256: objectiveSha,
    objective_chars: objective.length,
    automation: controls?.data?.automation || 'off',
    goal_enabled: controls?.data?.automation === 'goal',
    goal_objective_exact_readback: controls?.data ? String(controls.data.objective || '') === objective : false,
    phase_order: ['G1','G2','G3','G4','G5'],
    next_task: ack.next_task || null,
    external_publish_authorized: false,
    repository_push_authorized: false,
    bound_at_utc: new Date().toISOString(),
  };
  fs.writeFileSync(bindingPath, JSON.stringify(binding, null, 2) + '\n');
  console.log(`COS_GOAL_CHAIN_STATUS=${ack.status || ''}`);
  console.log(`COS_GOAL_CHAIN_SESSION=${session}`);
  console.log(`COS_GOAL_CHAIN_AUTOMATION=${binding.automation}`);
  console.log(`COS_GOAL_CHAIN_OBJECTIVE_READBACK=${binding.goal_objective_exact_readback}`);
  console.log(`COS_GOAL_CHAIN_NEXT_TASK=${ack.next_task || ''}`);
  console.log(`COS_GOAL_CHAIN_BINDING=${bindingPath}`);
  console.log('EXTERNAL_PUBLISH_AUTHORIZED=false');
  console.log('REPOSITORY_PUSH_AUTHORIZED=false');
} finally {
  cdp.close();
}
