import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCatalog, getCard } from '../../src/domain/cards.mjs';
import { searchCards, getRelatedCards } from '../../src/domain/discovery.mjs';
import { resolveDailyCard } from '../../src/local/state.mjs';
import { AGENT_CONTRACT_VERSION, buildReadOnlyTools, createReadOnlyAgentApi, registerWebMcpReadOnlyTools } from '../../src/agent/webmcp-adapter.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const readText = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const card = readJson('content/approved/cards/C0001.json');
const references = readJson('content/approved/references.json').references;
const assets = readJson('content/approved/assets.json').assets;
const catalog = createCatalog({ cards: [card], references, assets });
class MemoryStorage { #m=new Map(); getItem(k){return this.#m.has(k)?this.#m.get(k):null;} setItem(k,v){this.#m.set(k,String(v));} }

test('public machine-readable snapshot contains stable per-card, references and relations projections', () => {
  const manifest=readJson('public/data/manifest.json');
  const index=readJson('public/data/cards-index.json');
  const perCard=readJson('public/data/cards/C0001.json');
  const relations=readJson('public/data/relations.json');
  assert.equal(manifest.schema_version,'1.1.0');
  assert.equal(index.snapshot_version,manifest.snapshot_version);
  assert.deepEqual(perCard,card);
  assert.equal(relations.snapshot_version,manifest.snapshot_version);
  assert.equal(relations.relations[0].card_id,'C0001');
  assert.equal(manifest.card_documents.includes('./cards/C0001.json'),true);
});

test('agent manifest matches registered read-only capabilities and denies write/publication authority', () => {
  const manifest=readJson('public/agent-manifest.json');
  const build=readJson('public/BUILD_MANIFEST.json');
  const api=createReadOnlyAgentApi({catalog,dataSnapshotVersion:build.snapshot_version});
  const names=buildReadOnlyTools(api).map((x)=>x.name);
  assert.deepEqual(manifest.webmcp_capabilities,names);
  assert.equal(manifest.agent_contract_version,AGENT_CONTRACT_VERSION);
  assert.equal(manifest.data_snapshot_version,build.snapshot_version);
  assert.equal(manifest.external_publish_authorized,false);
  assert.equal(manifest.repository_write_authorized,false);
  assert.doesNotMatch(JSON.stringify(manifest),/reflection body|personal reflection/i);
});

test('Human daily freeze and WebMCP get_daily_card resolve identical card semantics', () => {
  const storage=new MemoryStorage();
  const date=new Date(2026,8,16,10,0,0);
  const dailyResolver=()=>resolveDailyCard(catalog,{storage,date,seed:'g3-shared'}).card;
  const human=dailyResolver();
  const api=createReadOnlyAgentApi({catalog,clock:()=>date,dailySeed:'ignored-when-resolver-present',dailyResolver,dataSnapshotVersion:'snap'});
  const agent=api.get_daily_card();
  assert.equal(agent.ok,true);
  assert.equal(agent.data.card_id,human.card_id);
  assert.deepEqual(agent.data,getCard(catalog,human.card_id));
  assert.equal(agent.data_snapshot_version,'snap');
});

test('Human search/relations and agent search/relations share domain semantics', () => {
  const api=createReadOnlyAgentApi({catalog,dataSnapshotVersion:'snap'});
  const humanSearch=searchCards(catalog,'longing');
  const agentSearch=api.search_feelings({query:'longing'});
  assert.deepEqual(agentSearch.data.map((x)=>({card:x.card,rationale:x.rationale})), humanSearch.map((x)=>({card:x.card,rationale:x.rationale})));
  const humanRelated=getRelatedCards(catalog,'C0001');
  const agentRelated=api.get_related_feelings({card_id:'C0001'});
  assert.deepEqual(agentRelated.data.map((x)=>({relation:x.relation,label:x.label,card:x.card})),humanRelated.map((x)=>({relation:x.relation,label:x.label,card:x.card})));
});

test('WebMCP tools are same-origin by default, read-only, non-consequential and contain no reflection tool', () => {
  const api=createReadOnlyAgentApi({catalog});
  const captured=[];
  const result=registerWebMcpReadOnlyTools({api,modelContext:{registerTool(tool,options){captured.push({tool,options});}}});
  assert.equal(result.supported,true);
  assert.equal(captured.length,7);
  assert.equal(captured.every(({tool})=>tool.annotations.readOnlyHint===true),true);
  assert.equal(captured.every(({tool})=>tool.annotations.consequentialHint===false),true);
  assert.equal(captured.every(({options})=>options===undefined),true);
  assert.equal(captured.some(({tool})=>/reflection|favorite|write|publish/i.test(tool.name)),false);
  assert.equal(Object.keys(api).some((name)=>/reflection/i.test(name)),false);
});

test('PWA manifest, snapshot-versioned service worker and graceful offline fallback are generated', () => {
  const manifest=readJson('public/manifest.webmanifest');
  const build=readJson('public/BUILD_MANIFEST.json');
  const sw=readText('public/service-worker.js');
  const offline=readText('public/offline.html');
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.icons[0].src,'./assets/brand/app-icon.svg');
  assert.match(sw,new RegExp(`const SNAPSHOT = '${build.snapshot_version}'`));
  assert.match(sw,/nomm-shell-v1-\$\{SNAPSHOT\}/);
  assert.match(sw,/nomm-content-\$\{SNAPSHOT\}/);
  assert.equal(build.pwa.shell_cache,`nomm-shell-v1-${build.snapshot_version}`);
  assert.equal(build.pwa.content_cache,`nomm-content-${build.snapshot_version}`);
  assert.match(sw,/offline\.html/);
  assert.match(sw,/data\/cards\/C0001\.json/);
  assert.doesNotMatch(sw,/localStorage|reflection-note|nomm:reflection/);
  assert.match(offline,/마지막으로 설치가 완료된 검증 스냅샷/);
  assert.equal(build.pwa.service_worker,'service-worker.js');
});

test('share asset path is stable and present in the public build', () => {
  const publicCard=readJson('public/data/cards/C0001.json');
  const publicAssets=readJson('public/data/assets.json').assets;
  const share=publicAssets.find((x)=>x.asset_id===publicCard.assets.share_asset_id);
  assert.ok(share);
  assert.equal(share.path,'assets/media/share/C0001.svg');
  assert.equal(fs.existsSync(path.join(ROOT,'public',share.path)),true);
});

test('online UI registers service worker progressively and exposes freshness without reflection to agents', () => {
  const source=readText('src/ui/app.mjs');
  const html=readText('src/ui/index.html');
  assert.match(source,/'serviceWorker' in navigator/);
  assert.match(source,/register\('\.\/service-worker\.js'\)/);
  assert.match(source,/콘텐츠 스냅샷/);
  assert.match(html,/rel="manifest"/);
  assert.match(html,/id="freshness-status"/);
  assert.doesNotMatch(readText('src/agent/webmcp-adapter.mjs'),/readReflection|saveReflection|reflection_body/);
});
