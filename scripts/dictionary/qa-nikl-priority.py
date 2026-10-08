#!/usr/bin/env python3
"""Independent UI verification; build and stage public first. No keyed API calls."""
import functools,json,threading,traceback,os
from pathlib import Path
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'reports/ui/nikl-priority-v24-20261008'
OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT/'public')))
threading.Thread(target=server.serve_forever,daemon=True).start()
url=os.environ.get('NOMM_QA_URL',f'http://127.0.0.1:{server.server_port}/learn/')
report={'status':'RUNNING','physical_device_tested':False,'url':url}
def wait_idle(p):
    p.wait_for_function("!document.querySelector('#dictionary-search-host').hasAttribute('aria-busy')",timeout=25000)
def open_find(p):
    p.locator('#find').evaluate('(e)=>e.open=true')
def more(p,word):
    open_find(p);p.locator('#search').fill(word);p.locator('#dictionary-search').click();wait_idle(p)
def select(p,word,n=0):
    p.locator('#dictionary-results .dictionary-result').filter(has_text=word).nth(n).click();wait_idle(p)
    p.wait_for_selector('#dictionary-detail h3')
try:
    with sync_playwright() as pw:
        b=pw.chromium.launch(headless=True)
        c=b.new_context(viewport={'width':390,'height':844},locale='ko-KR',timezone_id='Asia/Seoul')
        p=c.new_page();requests=[];errors=[]
        p.on('request',lambda r:requests.append({'url':r.url,'method':r.method}))
        p.on('pageerror',lambda e:errors.append(str(e)))
        p.goto(url,wait_until='networkidle');p.wait_for_selector('#word-card .meaning');base=p.url.split('#')[0]
        assert not any('/content/dictionary/' in r['url'] for r in requests)
        assert p.locator('details').count()==3
        before=len(requests);open_find(p);p.locator('#search').fill('가뿐하다');p.wait_for_timeout(200)
        assert len(requests)==before
        report['initial_dictionary_requests']=0;report['typing_requests']=0
        checks=[]
        for w,h in [(320,740),(390,844),(768,1024),(1280,900)]:
            p.set_viewport_size({'width':w,'height':h})
            for word in ['가뿐하다','가슴앓이']:
                more(p,word)
                assert '국립국어원' in p.locator('#dictionary-results .dictionary-result').filter(has_text=word).first.inner_text()
                select(p,word)
                text=p.locator('#dictionary-detail').inner_text()
                assert '국립국어원' in text and 'CC BY-SA 2.0 KR' in text
                assert p.locator('#dictionary-detail .dictionary-senses').evaluate('(e)=>e.tagName')=='UL'
                assert p.locator('#dictionary-detail a[href*="krdict.korean.go.kr"]').count()>=1
                assert 'key=' not in p.locator('#dictionary-detail').inner_html()
                assert '전체 뜻' in text
                if word=='가뿐하다':assert '마음에 부담이 없이 가볍고 편하다.' in text
                assert p.evaluate('document.documentElement.scrollWidth<=innerWidth'),(w,word)
                checks.append({'width':w,'word':word,'official_first':True,'unknown_order_unnumbered':True})
                if w==390:p.screenshot(path=str(OUT/('official-'+str(len(checks))+'-390.png')),full_page=True)
        report['official_layout_checks']=checks
        p.set_viewport_size({'width':390,'height':844})
        more(p,'감상')
        # Exact homographs should occupy distinct source identities, not blended meanings.
        official=p.locator('#dictionary-results .dictionary-result').filter(has_text='국립국어원')
        texts=official.all_text_contents();report['homograph_results']=texts[:4]
        official.first.click();wait_idle(p)
        first=p.locator('#dictionary-detail a[href*="krdict.korean.go.kr"]').first.get_attribute('href')
        more(p,'감상');p.locator('#dictionary-results .dictionary-result').filter(has_text='국립국어원').nth(1).click();wait_idle(p)
        second=p.locator('#dictionary-detail a[href*="krdict.korean.go.kr"]').first.get_attribute('href')
        assert first!=second;report['separate_homograph_urls']=[first,second]
        more(p,'망설이다');select(p,'망설이다')
        assert '위키낱말사전' in p.locator('#dictionary-detail').inner_text()
        assert 'CC BY-SA 4.0' in p.locator('#dictionary-detail').inner_text()
        report['open_only_word']='망설이다'
        # The explicitly mapped world word is still present; no new daily card is synthesized.
        p.evaluate("location.hash='KE0042'");p.wait_for_function("document.querySelector('h1').textContent==='그립다'")
        assert 'saudade' in p.locator('#word-card .world-title').inner_text()
        p.screenshot(path=str(OUT/'world-unchanged-390.png'),full_page=True)
        before=len(requests);p.locator('#write').evaluate('(e)=>e.open=true');p.locator('#sentence').fill('검사용 개인 문장. 내 이야기는 보내지 않는다.')
        p.wait_for_timeout(200);assert len(requests)==before
        assert p.evaluate('localStorage.length===0 && sessionStorage.length===0')
        report['reflection_requests']=0
        assert not errors,errors
        report['normal_page_errors']=errors
        # Independently failing either provider leaves the other searchable.
        fallbacks=[]
        if not os.environ.get('NOMM_QA_URL'):
            for blocked,word,expected in [('nikl','가뿐하다','위키낱말사전'),('open-ko','가슴앓이','국립국어원')]:
                ctx=b.new_context(viewport={'width':390,'height':844},locale='ko-KR',timezone_id='Asia/Seoul')
                ctx.route('**/content/dictionary/'+blocked+'/**',lambda route:route.abort())
                page=ctx.new_page();page.goto(base,wait_until='networkidle');page.wait_for_selector('#word-card .meaning')
                more(page,word);select(page,word)
                assert expected in page.locator('#dictionary-detail').inner_text()
                assert page.locator('#word-card .meaning').is_visible()
                fallbacks.append({'unavailable':blocked,'usable_source':expected})
                ctx.close()
        report['provider_fallback_checks']=fallbacks
        report.update(status='PASS',browser='Chromium '+b.version)
        c.close();b.close()
except Exception as e:
    report.update(status='FAILED',error=str(e),traceback=traceback.format_exc())
    raise
finally:
    server.shutdown();server.server_close()
    (OUT/('production-browser-qa.json' if os.environ.get('NOMM_QA_URL') else 'independent-browser-qa.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
