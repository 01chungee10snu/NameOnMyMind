#!/usr/bin/env python3
"""Browser checks for the separate open-dictionary and contextual world-word layer."""
import functools
import json
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'reports/ui/mobile-first-20260930/open-dictionary-world-v23'
OUT.mkdir(parents=True,exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*_args):pass
server=ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Quiet,directory=str(ROOT/'public')))
threading.Thread(target=server.serve_forever,daemon=True).start()
base=f'http://127.0.0.1:{server.server_port}'
report={'status':'RUNNING'}
try:
    with sync_playwright() as pw:
        browser=pw.chromium.launch(headless=True)
        context=browser.new_context(viewport={'width':390,'height':844},locale='ko-KR',timezone_id='Asia/Seoul')
        page=context.new_page();requests=[];errors=[]
        page.on('request',lambda r:requests.append({'url':r.url,'method':r.method}))
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto(base+'/learn/',wait_until='networkidle');page.wait_for_selector('h1')
        route=page.url.split('#')[0]
        assert not any('open-ko/' in r['url'] or 'wiktionary.org' in r['url'] for r in requests)
        report['dictionary_lazy_on_first_action']=True
        page.evaluate("location.hash='KE0042'")
        page.wait_for_function("document.querySelector('h1').textContent==='그립다'")
        assert page.locator('#word-card .world-title').inner_text().startswith('saudade')
        page.screenshot(path=str(OUT/'world-saudade-390x844.png'),full_page=True)
        # Every companion can render at both narrow mobile widths.
        words=json.loads((ROOT/'content/korean-expression/learning-vocabulary-v1.json').read_text())['entries']
        ids={r['expression']:r['id'] for r in words}
        world=json.loads((ROOT/'content/korean-expression/world-contexts-v1.json').read_text())['entries']
        for width in [320,390]:
            page.set_viewport_size({'width':width,'height':844})
            for row in world:
                anchor=next(w for w in row['anchors'] if w in ids)
                page.evaluate('(id)=>location.hash=id',ids[anchor]);page.wait_for_function('(word)=>document.querySelector("h1").textContent===word',arg=anchor)
                assert row['term'] in page.locator('#word-card .world-title').inner_text()
                assert page.locator('#word-card .world-context').count()==1
                assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        report['foreign_mobile_checks']=14
        page.locator('#find summary').click()
        page.locator('#search').fill('saudade')
        assert 'saudade' in page.locator('#results').inner_text()
        report['foreign_term_search']='PASS'
        before=len(requests)
        page.locator('#search').fill('망설이다')

        page.wait_for_timeout(250)
        assert len(requests)==before
        page.locator('#dictionary-search').click()
        page.wait_for_function("document.querySelector('#dictionary-results').children.length>0")
        page.locator('#dictionary-results button').filter(has_text='망설이다').first.click()
        page.wait_for_selector('#dictionary-detail h3')
        assert page.locator('#dictionary-detail h3').inner_text()=='망설이다'
        assert '결정하지 못하다' in page.locator('#dictionary-detail').inner_text()
        assert 'CC BY-SA 4.0' in page.locator('#dictionary-detail').inner_text()
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
        report['broad_word_lookup']='망설이다'
        page.screenshot(path=str(OUT/'dictionary-result-390x844.png'),full_page=True)
        # Real anonymous CORS request from the browser, not only a server-side curl.
        page.locator('#search').fill('설레다')
        page.locator('#dictionary-live').click()
        page.wait_for_function("document.querySelector('#dictionary-detail h3') || (!document.querySelector('#dictionary-search-host').hasAttribute('aria-busy') && document.querySelector('#dictionary-status').textContent)",timeout=15000)
        if page.locator('#dictionary-detail h3').count():
            assert page.locator('#dictionary-detail h3').inner_text()=='설레다'
            assert '현재 사전' in page.locator('#dictionary-detail .dictionary-label').inner_text()
            report['live_api']={'status':'PASS','word':'설레다','meaning':page.locator('#dictionary-detail .dictionary-senses').inner_text()}
        else:
            report['live_api']={'status':'FAILED','message':page.locator('#dictionary-status').inner_text()}
            raise AssertionError('Live API did not complete: '+str(report['live_api']))
        report['live_api_request_count']=sum('ko.wiktionary.org/w/api.php' in r['url'] for r in requests)
        # Reflection remains private even after dictionary use.
        page.locator('#write summary').click();before=len(requests)
        page.locator('#sentence').fill('개인적인 시험 문장: 마음을 적었다.')
        page.wait_for_timeout(250);assert len(requests)==before
        assert page.evaluate('localStorage.length===0 && sessionStorage.length===0')
        report['typing_and_reflection_external_requests']=0
        # Inert HTML parser rejects non-Korean entries and never inserts scripts/media.
        parsed=page.evaluate("""async () => {
          const m=await import('../../src/domain/dictionary.mjs');
          const malicious={parse:{title:'검증',revid:1,text:'<div class="mw-parser-output"><h2 id="한국어">한국어</h2><h3>명사</h3><ol><li>안전한 뜻<script>window.bad=1</script><img src="https://invalid.example/spy"></li></ol><h2>영어</h2><ol><li>ignore</li></ol></div>'}};
          const got=m.parseWiktionaryPayload(malicious,'검증');
          let rejected=false;try{m.parseWiktionaryPayload({parse:{title:'검증',text:'<h2>영어</h2><ol><li>wrong language</li></ol>'}},'검증')}catch(e){rejected=true}
          return {definitions:got.senses.map(x=>x.definition),rejected,bad:window.bad||null};
        }""")
        assert parsed=={'definitions':['안전한 뜻'],'rejected':True,'bad':None},parsed
        assert not any('invalid.example' in r['url'] for r in requests)
        report['inert_parser_xss_language_checks']='PASS'
        # A rejected live request leaves snapshot search and the curated word usable.
        page.route('https://ko.wiktionary.org/w/api.php?**',lambda route:route.abort())
        page.locator('#search').fill('차분하다');page.locator('#dictionary-live').click()
        page.wait_for_function("!document.querySelector('#dictionary-search-host').hasAttribute('aria-busy')")
        assert '연결하지 못했어요' in page.locator('#dictionary-status').inner_text()
        page.locator('#search').fill('망설이다');page.locator('#dictionary-search').click()
        page.wait_for_function("document.querySelector('#dictionary-results').children.length>0")
        assert page.locator('h1').is_visible()
        report['live_failure_snapshot_fallback']='PASS'
        # Cancelling an in-flight lookup must not resurrect stale query results.
        page.unroute('https://ko.wiktionary.org/w/api.php?**')
        page.route('https://ko.wiktionary.org/w/api.php?**',lambda route:route.fulfill(status=200,content_type='application/json',body=json.dumps({'error':{'code':'missingtitle'}})))
        page.locator('#search').fill('없는말검증')
        page.locator('#dictionary-live').click()
        page.locator('#search').fill('새로운낱말')
        page.wait_for_timeout(250)
        assert page.locator('#dictionary-detail').inner_text()==''
        assert page.locator('#dictionary-status').inner_text()==''
        report['stale_query_cancellation']='PASS'

        assert not errors,errors
        report.update(status='PASS',errors=errors,real_device_tested=False,browser='Chromium '+browser.version)
        context.close();browser.close()
finally:
    server.shutdown();server.server_close()
    (OUT/'dictionary-browser-qa.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
