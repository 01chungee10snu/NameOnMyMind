#!/usr/bin/env python3
"""Anonymous mobile-browser QA; emulation is not a physical-phone test."""
import functools, json, os, threading, traceback
from pathlib import Path
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=Path(os.environ.get('NOMM_QA_OUT', str(ROOT/'reports/ui/mobile-web-hanja-v26-20261008')))
OUT.mkdir(parents=True,exist_ok=True)
PREFIX='/NameOnMyMind'
class Handler(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
    def translate_path(self,path):
        if path.startswith(PREFIX+'/'): path=path[len(PREFIX):]
        return super().translate_path(path)
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(ROOT/'public')))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=os.environ.get('NOMM_PUBLIC_QA_URL',f'http://127.0.0.1:{server.server_port}{PREFIX}/').rstrip('/')+'/'
world=json.loads((ROOT/'content/korean-expression/world-contexts-v1.json').read_text())['entries']
terms=json.loads((ROOT/'content/korean-expression/learning-vocabulary-v1.json').read_text())['entries']
term_ids={row['expression']:row['id'] for row in terms}
report={'status':'RUNNING','base_url':base,'anonymous':True,'physical_phone_tested':False,'browser_checks':[]}
try:
    with sync_playwright() as pw:
        profiles=[('webkit','iPhone 13'),('chromium','Pixel 7')]
        for engine,device in profiles:
            browser=getattr(pw,engine).launch(headless=True)
            context=browser.new_context(**pw.devices[device],locale='ko-KR',timezone_id='Asia/Seoul')
            page=context.new_page();errors=[];failed=[];requests=[]
            page.on('pageerror',lambda e:errors.append(str(e)))
            page.on('requestfailed',lambda r:failed.append({'url':r.url,'failure':r.failure}))
            page.on('request',lambda r:requests.append(r.url))
            check={'engine':engine,'profile':device,'routes':[],'hanja_checks':[]}
            for route in ['', 'learn/']:
                response=page.goto(base+route,wait_until='networkidle',timeout=45000)
                page.wait_for_selector('#word-card .meaning')
                assert response.status==200
                assert page.url==base+route, (page.url,base+route)
                assert page.locator('h1').inner_text().strip()
                assert page.locator('details[open]').count()==0
                assert page.locator('meta[name=description]').count()==1
                assert not page.locator('iframe').count()
                assert not any('open-ko/' in u or 'nikl/' in u for u in requests[-8:])
                viewport=page.locator('meta[name=viewport]').get_attribute('content')
                assert 'user-scalable=no' not in viewport and 'maximum-scale=1' not in viewport
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                check['routes'].append({'route':route or '/','http_status':200,'direct_learner':True,'horizontal_overflow':False})
            for wc in world:
                anchor=next(a for a in wc['anchors'] if a in term_ids)
                page.goto(base+'#'+term_ids[anchor],wait_until='networkidle')
                page.wait_for_function('(term)=>document.querySelector(".world-title").textContent.includes(term)',arg=wc['term'])
                assert wc['term'] in page.locator('.world-title').inner_text()
                assert page.locator('#word-card button[data-pronunciation-id]').count()==2
                assert 'IPA' in page.locator('.world-pronunciation').inner_text()
                if wc['id']=='WC06':
                    text=page.locator('#word-card .world-hanja').inner_text()
                    assert '物 물건 물' in text and '哀 슬플 애' in text,text
                    assert 'の' not in text and 'れ' not in text
                elif wc['id']=='WC07':
                    text=page.locator('#word-card .world-hanja').inner_text()
                    assert '舍(捨) 버릴 사' in text and '不 아닐 불/부' in text and '得 얻을 득' in text,text
                    assert '간체자' in text
                else: assert page.locator('#word-card .world-hanja').count()==0
                if wc['id'] in ['WC06','WC07']:
                    check['hanja_checks'].append(wc['term'])
                    page.screenshot(path=str(OUT/(engine+'-'+wc['id']+'.png')),full_page=True)
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),wc['term']
                sizes=page.locator('#word-card button[data-pronunciation-id]').evaluate_all('(els)=>els.map(e=>e.getBoundingClientRect().height)')
                assert all(h>=44 for h in sizes),sizes
            # The same character helper must also appear in dynamically loaded official dictionary results.
            page.locator('#find').evaluate('(e)=>e.open=true')
            count=len(requests);page.locator('#search').fill('감상');page.wait_for_timeout(150);assert len(requests)==count
            page.locator('#dictionary-search').click()
            page.wait_for_function('!document.querySelector("#dictionary-search-host").hasAttribute("aria-busy")',timeout=25000)
            page.locator('#dictionary-results button[data-provider=NIKL]').first.click()
            page.wait_for_selector('#dictionary-detail h3')
            assert page.locator('#dictionary-detail .world-hanja').count()==1
            assert '物 물건 물' in page.locator('#dictionary-detail .world-hanja').inner_text()
            count=len(requests);page.locator('#write').evaluate('(e)=>e.open=true');page.locator('#sentence').fill('내 문장은 사전과 음성 기능으로 보내지 않습니다.');page.wait_for_timeout(150)
            assert len(requests)==count
            assert page.evaluate('localStorage.length===0 && sessionStorage.length===0')
            check['reflection_network_requests']=0
            check['browser_cookie_count']=len(context.cookies())
            # No user accounts in this context: old card deep links still route only to same-origin cards.html.
            assert not failed, failed
            page.goto(base+'?card=C0001#meaning',wait_until='networkidle')
            page.wait_for_selector('#card-term')
            assert '/cards.html?card=C0001#meaning' in page.url,page.url
            assert page.locator('#card-term').inner_text()=='saudade'
            check['legacy_card_link_preserved']=True
            redirects=[r for r in failed if r['failure'] in ['cancelled','net::ERR_ABORTED'] and r['url'].startswith(base)]
            assert len(redirects)==len(failed),failed
            check['legacy_redirect_cancelled_requests']=len(redirects)
            failed.clear()
            page.goto(base+'?next=https://invalid.example/#'+term_ids['그립다'],wait_until='networkidle')
            page.wait_for_selector('#word-card')
            assert page.url.startswith(base) and '/cards.html' not in page.url
            assert not any('invalid.example/'==u.split('?')[0] for u in requests)
            # Keep old prototype links valid too.
            page.goto(base+'prototypes/korean-daily-learning-20260923/#'+term_ids['아쉽다'],wait_until='networkidle')
            page.wait_for_selector('#word-card .world-hanja')
            check['old_prototype_preserved']=True
            page.set_viewport_size({'width':320,'height':640})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            check['compact_320px_layout']=True
            assert not errors,errors
            assert not failed,failed
            check['errors']=errors;check['failed_requests']=failed;check['foreign_words_checked']=7
            check['speech_engine_available']=page.evaluate('typeof speechSynthesis !== "undefined" && typeof SpeechSynthesisUtterance !== "undefined"')
            report['browser_checks'].append(check)
            context.close();browser.close()
        report['status']='PASS'
except Exception as e:
    report['status']='FAILED';report['error']=str(e)
    traceback.print_exc()
    raise
finally:
    server.shutdown();server.server_close()
    (OUT/'mobile-browser-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(report,ensure_ascii=False,indent=2))
