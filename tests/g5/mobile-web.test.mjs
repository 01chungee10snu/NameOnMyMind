import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { assertMobileWebAuthorization, legacyRouterScript, rebaseResourcePaths, renderLearnerHtml, staleOutputPaths } from '../../scripts/stage-mobile-web.mjs';

const prototype = fs.readFileSync(new URL('../../prototypes/korean-daily-learning-20260923/index.html', import.meta.url), 'utf8');
const positiveSource = fs.readFileSync(new URL('../../src/ui/positive-learning.html', import.meta.url), 'utf8');

test('rebases prototype resources for root and learn entry points', () => {
  assert.match(rebaseResourcePaths('../../src/domain/korean-daily.mjs', 'root'), /^\.\//);
  assert.match(rebaseResourcePaths('../../src/domain/korean-daily.mjs', 'learn'), /^\.\.\//);
  assert.equal(renderLearnerHtml(prototype, { location: 'root' }).includes('../../'), false);
  assert.equal(renderLearnerHtml(prototype, { location: 'learn' }).includes('../../'), false);
});

test('learner output has public metadata, phone viewport, zoom, labels and no iframe/meta refresh', () => {
  const html = renderLearnerHtml(prototype, { location: 'root' });
  for (const value of ['rel="canonical"', 'property="og:title"', 'property="og:description"', 'property="og:type"', 'property="og:url"', 'app-icon.svg', 'manifest.webmanifest', 'viewport-fit=cover', 'for="sentence"']) {
    assert.match(html, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.doesNotMatch(html, /<iframe|http-equiv="refresh"/);
});

test('legacy router only redirects an allowlisted card or space to same-origin cards.html', () => {
  const router = legacyRouterScript();
  assert.match(router, /C000\[1-5\]/);
  assert.match(router, /today.*discover.*journal.*collection/);
  assert.match(router, /'\.\/cards\.html' \+ window\.location\.search \+ window\.location\.hash/);
});

test('authorization is explicit and stale output is detected without rewriting expected bytes', () => {
  assert.throws(() => assertMobileWebAuthorization(undefined), /explicit mobile web publication authorization/);
  assert.doesNotThrow(() => assertMobileWebAuthorization('1'));
  const expected = { 'index.html': 'new', 'learn/index.html': 'same' };
  assert.deepEqual(staleOutputPaths({ 'index.html': 'old', 'learn/index.html': 'same' }, expected), ['index.html']);
  assert.deepEqual(staleOutputPaths({ ...expected }, expected), []);
});

test('root learner and learn learner are distinct, while the card source remains frozen', () => {
  const root = renderLearnerHtml(prototype, { location: 'root' });
  const learn = renderLearnerHtml(prototype, { location: 'learn' });
  assert.notEqual(root, learn);
  assert.equal(root, renderLearnerHtml(prototype, { location: 'root' }));
  assert.equal(learn, renderLearnerHtml(prototype, { location: 'learn' }));
  assert.equal(root.includes('legacyRouterScript'), false);
  assert.equal(fs.readFileSync(new URL('../../src/ui/index.html', import.meta.url), 'utf8').includes('data-space="today"'), true);
});


test('legacy router execution preserves Korean hashes and never uses attacker redirect targets', async () => {
  const { runInNewContext } = await import('node:vm');
  const code=legacyRouterScript().replace(/^<script>\s*|\s*<\/script>$/g,'');
  for (const [query,hash,wanted] of [
    ['', '#KE0042', null], ['?next=https://invalid.example/', '#KE0044', null],
    ['?card=C0006','',null], ['?space=admin','',null],
    ['?card=C0001','#meaning','./cards.html?card=C0001#meaning'],
    ['?space=discover&q=saudade','','./cards.html?space=discover&q=saudade']
  ]) {
    let got=null;
    runInNewContext(code,{URLSearchParams,window:{location:{search:query,hash,replace:v=>{got=v}}}});
    assert.equal(got,wanted);
  }
  const html=renderLearnerHtml(prototype);
  assert.equal((html.match(/name="description"/g)||[]).length,1);
  assert.ok(html.indexOf('window.location.replace')<html.indexOf('<script type="module">'));
  assert.throws(()=>renderLearnerHtml(prototype,{location:'../elsewhere'}),/INVALID_MOBILE_ROUTE/);
});

test('real staging requires prior authorized build and --check detects stale files without writing', async () => {
  const os=await import('node:os'),path=await import('node:path');
  const {spawnSync}=await import('node:child_process');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nomm-mobile-stage-'));
  try {
    const put=(rel,text)=>{const p=path.join(dir,rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,text)};
    put('scripts/stage-mobile-web.mjs',fs.readFileSync(new URL('../../scripts/stage-mobile-web.mjs',import.meta.url),'utf8'));
    put('prototypes/korean-daily-learning-20260923/index.html',prototype);
    put('src/ui/positive-learning.html',positiveSource);
    const cards=fs.readFileSync(new URL('../../src/ui/index.html',import.meta.url),'utf8');put('src/ui/index.html',cards);
    const env={...process.env,NAMEONMYMIND_MOBILE_WEB_PUBLISH_AUTHORIZED:'1'};
    const run=(check=false,e=env)=>spawnSync(process.execPath,[path.join(dir,'scripts/stage-mobile-web.mjs'),...(check?['--check']:[])],{env:e,encoding:'utf8'});
    assert.notEqual(run().status,0);
    put('public/BUILD_MANIFEST.json',JSON.stringify({deployable:true,external_publish_authorized:true}));
    assert.notEqual(run().status,0);
    put('public/RESEARCH_PREVIEW_MANIFEST.json',JSON.stringify({preview_web_publish_authorized:true,product_release_authorized:false}));
    assert.notEqual(run(false,{...env,NAMEONMYMIND_MOBILE_WEB_PUBLISH_AUTHORIZED:''}).status,0);
    assert.equal(run().status,0);assert.equal(run(true).status,0);
    const original=fs.readFileSync(path.join(dir,'public/index.html'),'utf8');
    assert.equal(run().status,0);assert.equal(fs.readFileSync(path.join(dir,'public/index.html'),'utf8'),original);
    assert.equal(fs.readFileSync(path.join(dir,'public/cards.html'),'utf8'),cards);
    const mobileManifest=JSON.parse(fs.readFileSync(path.join(dir,'public/MOBILE_WEB_MANIFEST.json'),'utf8'));
    assert.ok(mobileManifest.source_sha256.learner_source);
    assert.ok(mobileManifest.source_sha256.legacy_prototype);
    fs.appendFileSync(path.join(dir,'public/learn/index.html'),' ');
    assert.notEqual(run(true).status,0);assert.ok(fs.readFileSync(path.join(dir,'public/learn/index.html'),'utf8').endsWith(' '));
    assert.equal(fs.readFileSync(path.join(dir,'prototypes/korean-daily-learning-20260923/index.html'),'utf8'),prototype);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
