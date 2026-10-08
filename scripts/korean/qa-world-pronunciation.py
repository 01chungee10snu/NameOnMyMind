#!/usr/bin/env python3
"""Pronunciation viewports and real browser speech events (no microphone or recorded output).
Run with a Python interpreter where Playwright is installed, after build + staging.
"""
import functools
import json
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'reports/ui/world-pronunciation-v25-20261008'
OUT.mkdir(parents=True, exist_ok=True)
pron = json.loads((ROOT/'content/korean-expression/world-pronunciations-v1.json').read_text())
world = json.loads((ROOT/'content/korean-expression/world-contexts-v1.json').read_text())
curated = json.loads((ROOT/'content/korean-expression/learning-vocabulary-v1.json').read_text())
ids = {r['expression']:r['id'] for r in curated['entries']}
contexts = {r['id']:r for r in world['entries']}
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*_args): pass
server = ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT/'public')))
threading.Thread(target=server.serve_forever,daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
report = {'status':'RUNNING','layout_checks':0,'real_speech_results':[],
          'physical_phone_tested':False,'native_speaker_listening_review':False}
audit_js = """() => {}"""
# add_init_script runs before application code; native synthesis is NOT replaced by a fake.
init = """window.__speechAudit=[];
if(window.speechSynthesis){
 const engine=window.speechSynthesis, speak=engine.speak.bind(engine);
 engine.speak=function(u){
  const row={text:u.text,lang:u.lang,voice:u.voice?.name,local:u.voice?.localService,rate:u.rate,events:[]};
  window.__speechAudit.push(row);
  u.addEventListener('start',()=>row.events.push('start'));
  u.addEventListener('end',()=>row.events.push('end'));
  u.addEventListener('error',e=>row.events.push('error:'+e.error));
  return speak(u);
 };
}
"""
try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True)
        context=browser.new_context(viewport={'width':390,'height':844},locale='ko-KR',timezone_id='Asia/Seoul')
        context.add_init_script(init)
        page=context.new_page(); errors=[]; requests=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('request',lambda r:requests.append(r.url))
        page.goto(base+'/learn/',wait_until='networkidle');page.wait_for_selector('#word-card h1')
        assert page.evaluate('window.__speechAudit.length')==0
        assert not any('wiktionary.org/w/api.php' in u for u in requests)
        route=page.url.split('#')[0]
        def show(row):
            anchor=next(w for w in contexts[row['world_id']]['anchors'] if w in ids)
            page.evaluate('(id)=>location.hash=id',ids[anchor])
            page.wait_for_function('(word)=>document.querySelector("#word-card h1").textContent===word',arg=anchor)
            return page.locator('#word-card .world-context')
        for width,height in [(320,740),(390,844),(768,1024),(1280,900)]:
            page.set_viewport_size({'width':width,'height':height})
            for row in pron['entries']:
                section=show(row)
                assert row['ipa'] in section.locator('.world-ipa').inner_text()
                assert row['korean_guide'] in section.locator('.world-reading').inner_text()
                assert section.locator('[data-pronunciation-id]').count()==2
                assert page.locator('details[open]').count()==0
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'), row['world_id']
                assert all(v>=44 for v in section.locator('button').evaluate_all('(els)=>els.map(x=>x.getBoundingClientRect().height)'))
                report['layout_checks']+=1
                if width==390 and row['world_id'] in ['WC01','WC06','WC07']:
                    page.screenshot(path=str(OUT/f"pronunciation-{row['world_id']}-390.png"),full_page=True)
        page.set_viewport_size({'width':390,'height':844})
        voices=page.evaluate('speechSynthesis.getVoices().map(v=>({lang:v.lang,name:v.name,local:v.localService}))')
        normalize=lambda lang:lang.lower().replace('_','-')
        for row in pron['entries']:
            section=show(row);before=page.evaluate('window.__speechAudit.length')
            available=any(normalize(v['lang']) in [normalize(x) for x in row['voice_locales']] for v in voices)
            section.locator('button').first.click()
            if not available:
                page.wait_for_function('document.querySelector("#word-card .world-pronunciation-status").textContent.includes("언어 음성이 없어요")',timeout=5000)
                assert page.evaluate('window.__speechAudit.length')==before
                report['real_speech_results'].append({'word':row['term'],'status':'VOICE_NOT_INSTALLED','wrong_language_fallback':False})
                continue
            page.wait_for_function('(n)=>window.__speechAudit[n] && window.__speechAudit[n].events.some(e=>e==="end" || e.startsWith("error:"))',arg=before,timeout=15000)
            event=page.evaluate('(n)=>window.__speechAudit[n]',before)
            assert event['text']==row['speech_text'] and normalize(event['lang']) in [normalize(v) for v in row['voice_locales']]
            assert event['events']==['start','end'], event
            assert section.locator('button').first.inner_text()=='듣기'
            report['real_speech_results'].append({'word':row['term'],'status':'START_END_CONFIRMED',**event})
        # Keyboard activation and slower real playback.
        row=pron['entries'][0];section=show(row);before=page.evaluate('window.__speechAudit.length')
        section.locator('[data-pronunciation-mode=slow]').focus();page.keyboard.press('Enter')
        page.wait_for_function('(n)=>window.__speechAudit[n]?.events.includes("end")',arg=before,timeout=15000)
        slow=page.evaluate('(n)=>window.__speechAudit[n]',before);assert abs(slow['rate']-.6)<0.00001
        assert section.locator('[data-pronunciation-mode=slow]').inner_text()=='천천히'
        report['slow_keyboard_playback']=slow
        # Dynamically rendered official dictionary results share the controls.
        official=json.loads((ROOT/'content/dictionary/nikl/reviewed-source.json').read_text())
        dynamic_word=next(e['word'] for e in official['entries'] if e['word']=='감격하다')
        page.locator('#find summary').click();page.locator('#search').fill(dynamic_word);page.locator('#dictionary-search').click()
        page.wait_for_selector('#dictionary-results button');page.locator('#dictionary-results button').filter(has_text=dynamic_word).first.click()
        page.wait_for_selector('#dictionary-detail .world-context button')
        before=page.evaluate('window.__speechAudit.length');page.locator('#dictionary-detail .world-context button').first.click()
        page.wait_for_function('(n)=>window.__speechAudit[n]?.events.includes("end")',arg=before,timeout=15000)
        dynamic=page.evaluate('(n)=>window.__speechAudit[n]',before);assert dynamic['text']=='もののあわれ';report['dynamic_dictionary_playback']=dynamic
        # Typing remains independent from TTS and external providers.
        before_speech=page.evaluate('window.__speechAudit.length');before_requests=len(requests)
        page.locator('#search').fill('비공개시험낱말');page.locator('#write summary').click();page.locator('#sentence').fill('내 마음을 기록한 비공개 시험 문장')
        page.wait_for_timeout(200)
        assert page.evaluate('window.__speechAudit.length')==before_speech
        assert len(requests)==before_requests
        assert page.evaluate('localStorage.length===0 && sessionStorage.length===0')
        report['typing_or_reflection_speech_requests']=0
        report['typing_or_reflection_app_network_requests']=0
        assert not errors,errors
        report.update(status='PASS',browser='Chromium '+browser.version,errors=errors,all_native_test_voices_local=all(r.get('local',True) for r in report['real_speech_results']))
        context.close();browser.close()
except Exception as error:
    report['status']='FAILED'
    report['error']=type(error).__name__+': '+str(error)[:300]
    raise
finally:
    server.shutdown();server.server_close()
    (OUT/'browser-pronunciation-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
