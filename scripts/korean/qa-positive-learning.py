#!/usr/bin/env python3
"""Positive public surface QA in anonymous WebKit/Chromium; not physical-phone testing."""
import functools, json, os, threading, traceback
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(os.environ.get('NOMM_QA_OUT',str(ROOT/'reports/ui/positive-focus-v27-20261008')))
OUT.mkdir(parents=True,exist_ok=True)
class Handler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
    def translate_path(self,path):
        if path.startswith('/NameOnMyMind/'):path=path[len('/NameOnMyMind'):]
        return super().translate_path(path)
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT/'public')))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=os.environ.get('NOMM_PUBLIC_QA_URL',f'http://127.0.0.1:{server.server_port}/NameOnMyMind/').rstrip('/')+'/'
vocab=json.loads((ROOT/'content/korean-expression/learning-vocabulary-v1.json').read_text())['entries']
policy=json.loads((ROOT/'content/korean-expression/positive-focus-v1.json').read_text())
world=json.loads((ROOT/'content/korean-expression/world-contexts-v1.json').read_text())['entries']
focus={e['id']:e['expression'] for e in policy['focus_entries']}
focus_words=set(focus.values())
fixed_date="""const NativeDate=Date; const stamp=NativeDate.parse('2026-10-08T12:00:00+09:00');
window.Date=class extends NativeDate{constructor(...a){super(...(a.length?a:[stamp]));}static now(){return stamp;}};
window.__speechAudit=[];if(window.speechSynthesis){const speak=speechSynthesis.speak.bind(speechSynthesis);speechSynthesis.speak=u=>{const r={text:u.text,lang:u.lang,events:[]};u.addEventListener('start',()=>r.events.push('start'));u.addEventListener('end',()=>r.events.push('end'));window.__speechAudit.push(r);speak(u);};}
"""
report={'status':'RUNNING','base_url':base,'anonymous':True,'physical_phone_tested':False,'checks':[]}
try:
 with sync_playwright() as pw:
  for engine,device in [('webkit','iPhone 13'),('chromium','Pixel 7')]:
   browser=getattr(pw,engine).launch(headless=True)
   context=browser.new_context(**pw.devices[device],locale='ko-KR',timezone_id='Asia/Seoul')
   context.add_init_script(fixed_date)
   page=context.new_page();errors=[];requests=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   page.on('request',lambda r:requests.append(r.url))
   check={'engine':engine,'profile':device,'positive_route_checks':0,'secondary_route_checks':0,'world_checks':0}
   for route in ['', 'learn/']:
    response=page.goto(base+route,wait_until='networkidle',timeout=45000)
    page.wait_for_selector('#word-card .meaning')
    assert response.status==200 and page.url==base+route
    assert page.locator('h1').inner_text()=='기쁘다'
    assert page.locator('details[open]').count()==0
    assert page.locator('.similar').count()==2
    assert not any('/nikl/' in x or '/open-ko/' in x for x in requests)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   page.screenshot(path=str(OUT/(engine+'-positive-home.png')),full_page=True)
   for row in vocab:
    page.evaluate('(id)=>{location.hash=id}',row['id'])
    if row['id'] in focus:
     page.wait_for_function('(w)=>document.querySelector("h1").textContent===w',arg=row['expression'])
     assert page.locator('details[open]').count()==0
     check['positive_route_checks']+=1
    else:
     page.wait_for_function('(w)=>document.querySelector("#opposites").open&&document.querySelector("#opposites").textContent.includes(w)',arg=row['expression'])
     assert page.locator('h1').inner_text() in focus_words
     assert row['meaning'] in page.locator('#opposites').inner_text()
     check['secondary_route_checks']+=1
    similar=page.locator('.similar strong').all_text_contents()
    assert len(similar)==2 and all(w in focus_words for w in similar)
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),row['expression']
   for row in policy['comparison_only_entries']:
    page.evaluate('(id)=>location.hash=id',row['id'])
    page.wait_for_function('(w)=>document.querySelector("#opposites").open&&document.querySelector("#opposites").textContent.includes(w)',arg=row['expression'])
    assert page.locator('h1').inner_text() in focus_words
    check['secondary_route_checks']+=1
   page.evaluate("location.hash='KE0063'")
   page.wait_for_function("document.querySelector('h1').textContent==='기쁘다'&&document.querySelector('#opposites').open")
   assert '슬프다' in page.locator('#opposites').inner_text()
   page.screenshot(path=str(OUT/(engine+'-antonym.png')),full_page=True)
   for wc in world:
    page.evaluate('(id)=>location.hash=id',wc['id'])
    page.wait_for_function('(w)=>[...document.querySelectorAll(".world-title")].some(el=>el.textContent.includes(w))',arg=wc['term'])
    assert page.locator('h1').inner_text() in focus_words
    titles=page.locator('.world-context').filter(has=page.locator('bdi',has_text=wc['term']))
    assert titles.count()==1
    selected=titles.last
    assert selected.is_visible()
    assert selected.locator('[data-pronunciation-id]').count()==2
    assert 'IPA' in selected.locator('.world-pronunciation').inner_text()
    if wc['id'] in ['WC06','WC07']:
     assert selected.locator('.world-hanja').count()==1
     assert '한국식' in selected.locator('.world-hanja').inner_text()
    check['world_checks']+=1
   page.screenshot(path=str(OUT/(engine+'-world-hanja.png')),full_page=True)
   # Return/next controls and repeat searches do not lose route intent.
   page.locator('#today').click()
   page.wait_for_function("document.querySelector('h1').textContent==='기쁘다' && !location.hash")
   assert page.locator('details[open]').count()==0
   page.locator('#next-positive').click()
   page.wait_for_function("document.querySelector('h1').textContent==='만족스럽다'")
   page.locator('#today').click()
   page.wait_for_function("document.querySelector('h1').textContent==='기쁘다'")
   check['return_and_next_controls']=True
   # An explicitly searched negative word is retained below, never replaces the positive headline.
   page.locator('#find').evaluate('(e)=>e.open=true')
   before=len(requests);speech_before=page.evaluate('window.__speechAudit.length')
   page.locator('#search').fill('슬프다');page.wait_for_timeout(100)
   assert len(requests)==before and page.evaluate('window.__speechAudit.length')==speech_before
   page.locator('#results a[href="#KE0063"]').first.click()
   page.wait_for_function("document.querySelector('h1').textContent==='기쁘다'&&document.querySelector('#opposites').open")
   # Repeating a search for the current hash reopens the deliberate comparison.
   page.locator('#opposites').evaluate('(e)=>e.open=false')
   page.locator('#find').evaluate('(e)=>e.open=true');page.locator('#search').fill('슬프다')
   page.locator('#results a[href="#KE0063"]').first.click()
   assert page.locator('#opposites').evaluate('(e)=>e.open')
   page.locator('#source').evaluate('(e)=>e.open=true')
   assert page.locator('#world-sources a').filter(has_text='반의 관계 출처').count()==1
   check['repeat_search_and_antonym_source']=True
   page.locator('#write').evaluate('(e)=>e.open=true');before=len(requests)
   page.locator('#sentence').fill('내 마음은 여러 가지다. 내가 쓴 글은 전송하지 않는다.')
   page.wait_for_timeout(100)
   assert len(requests)==before and page.evaluate('window.__speechAudit.length')==speech_before
   assert page.evaluate('localStorage.length===0&&sessionStorage.length===0')
   check['private_text_network_requests']=0;check['private_text_speech_requests']=0
   page.locator('#find').evaluate('(e)=>e.open=true');page.locator('#search').fill('가뿐하다');page.locator('#dictionary-search').click()
   page.wait_for_function('!document.querySelector("#dictionary-search-host").hasAttribute("aria-busy")',timeout=25000)
   page.locator('#dictionary-results button[data-provider=NIKL]').first.click()
   page.wait_for_selector('#dictionary-detail h3')
   assert '국립국어원' in page.locator('#dictionary-detail').inner_text()
   assert page.locator('h1').inner_text() in focus_words
   check['official_dictionary_unchanged']=True
   page.set_viewport_size({'width':320,'height':740})
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
   check['compact_320px']=True
   optional=context.new_page();optional.route('**/world-contexts-v1.json',lambda r:r.abort())
   optional.goto(base,wait_until='networkidle');optional.wait_for_selector('h1')
   assert optional.locator('h1').inner_text()=='기쁘다';optional.close()
   check['optional_world_failure_does_not_break_reading']=True

   assert not errors,errors
   check['errors']=errors;check['cookie_count']=len(context.cookies())
   report['checks'].append(check)
   context.close();browser.close()
  # Real desktop engine, not a mock: verify retained speech on the positive surface.
  speech_browser=pw.chromium.launch(headless=True)
  speech_context=speech_browser.new_context(viewport={'width':390,'height':844},locale='ko-KR',timezone_id='Asia/Seoul')
  speech_context.add_init_script(fixed_date);voice_page=speech_context.new_page()
  voice_page.goto(base+'#WC03',wait_until='networkidle');voice_page.wait_for_selector('h1')
  voice_page.wait_for_function('speechSynthesis.getVoices().length>0')
  real=[]
  for wid,spoken in [('WC03','Geborgenheit'),('WC06','もののあわれ')]:
   voice_page.evaluate('(id)=>location.hash=id',wid)
   button=voice_page.locator('[data-pronunciation-id="'+wid+'"]').first
   button.wait_for(state='visible');before=voice_page.evaluate('window.__speechAudit.length');button.click()
   voice_page.wait_for_function('(n)=>window.__speechAudit[n]?.events.includes("end")',arg=before,timeout=15000)
   audit=voice_page.evaluate('(n)=>window.__speechAudit[n]',before)
   assert audit['text']==spoken and audit['events']==['start','end'];real.append(audit)
  speech_context.close();speech_browser.close();report['real_tts_start_end']=real
 report['status']='PASS'
except Exception as e:
 report['status']='FAILED';report['error']=str(e);traceback.print_exc();raise
finally:
 server.shutdown();server.server_close()
 (OUT/'positive-browser-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps(report,ensure_ascii=False,indent=2))
