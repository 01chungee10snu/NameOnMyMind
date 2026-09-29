#!/usr/bin/env python3
"""Optional browser QA: python3 scripts/korean/qa-learning-page.py (requires Playwright)."""
import functools
import json
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'reports/ui/mobile-first-20260929/korean-learning-v21'
OUT.mkdir(parents=True, exist_ok=True)
DATA = json.loads((ROOT / 'content/korean-expression/simple-meanings-v1.json').read_text())
ROWS = {row['id']: row for row in DATA['entries']}
class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass
server = ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT / 'public')))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}'
report = {'status': 'RUNNING', 'viewports': [], 'sweep_count': 0, 'errors': []}
try:
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 390, 'height': 844}, locale='ko-KR', timezone_id='Asia/Seoul')
        page = context.new_page()
        errors, requests = [], []
        page.on('pageerror', lambda err: errors.append(str(err)))
        page.on('request', lambda request: requests.append({'url': request.url, 'method': request.method, 'body': request.post_data}))
        page.goto(base + '/learn/', wait_until='networkidle')
        page.wait_for_selector('h1')
        route = page.url.split('#')[0]
        report['daily_word'] = page.locator('h1').inner_text()
        assert page.locator('.example p').inner_text()
        assert page.locator('.similar').count() == 2
        assert page.locator('details[open]').count() == 0
        page.screenshot(path=str(OUT / 'learn-today-390x844.png'), full_page=True)
        for width, height in [(320, 740), (390, 844), (768, 1024), (1280, 900)]:
            page.set_viewport_size({'width': width, 'height': height})
            page.evaluate("location.hash='KE0017'")
            page.wait_for_function("document.querySelector('h1').textContent === '뿌듯하다'")
            dims = page.evaluate("({width:innerWidth,scroll:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight})")
            assert dims['scroll'] <= width, (width, dims)
            report['viewports'].append({'width': width, 'height': height, 'document_height': dims['height'], 'horizontal_overflow': False})
            if width in [390, 1280]:
                page.screenshot(path=str(OUT / f'learn-proud-{width}x{height}.png'), full_page=True)
        # Exercise every meaning and example at both narrow mobile sizes.
        for width in [320, 390]:
            page.set_viewport_size({'width': width, 'height': 844})
            for row in DATA['entries']:
                page.evaluate('(id) => { location.hash=id }', row['id'])
                page.wait_for_function('(word) => document.querySelector("h1").textContent === word', arg=row['expression'])
                assert page.locator('.meaning').inner_text() == row['meaning'], row['id']
                assert page.locator('.example p').inner_text() == row['example'], row['id']
                assert page.locator('.similar').count() == 2, row['id']
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), row['id']
                assert page.url.split('#')[0] == route
                report['sweep_count'] += 1
        # Search stays in the learner view; typed content never enters URL/storage/network.
        page.locator('#find summary').click()
        network_before = len(requests)
        page.locator('#search').fill('뿌듯')
        page.locator('#results .result').filter(has=page.locator('strong', has_text='뿌듯하다')).first.click()
        page.wait_for_function("document.querySelector('h1').textContent === '뿌듯하다'")
        page.locator('#write summary').click()
        sentence = '테스트 문장: 오늘 내 힘으로 완성해서 뿌듯하다.'
        page.locator('#sentence').fill(sentence)
        assert '테스트' not in page.url
        page.locator('.similar').first.click()
        page.go_back()
        page.wait_for_function("document.querySelector('h1').textContent === '뿌듯하다'")
        assert page.locator('#sentence').input_value() == sentence
        assert len(requests) == network_before, 'Typing or navigation caused a network request'
        assert page.evaluate('localStorage.length === 0 && sessionStorage.length === 0')
        page.reload(wait_until='networkidle')
        assert page.locator('#sentence').input_value() == ''
        report['privacy'] = {'typing_network_requests': 0, 'browser_storage_entries': 0, 'draft_survives_word_switch': True, 'draft_cleared_on_reload': True}
        # No-result input is text, not HTML; source controls and navigation remain usable.
        page.locator('#find summary').click()
        page.locator('#search').fill('<img src=x onerror=alert(1)>')
        assert page.locator('#results img').count() == 0
        assert '찾은 말이 없어요' in page.locator('#results').inner_text()
        assert page.locator('#search').evaluate('(el)=>el.labels.length') == 1
        assert page.locator('#sentence').evaluate('(el)=>el.labels.length') == 1
        assert all(x >= 44 for x in page.locator('summary,.similar').evaluate_all('(els)=>els.map(el=>el.getBoundingClientRect().height)'))
        assert not errors, errors
        assert all(r['method'] == 'GET' for r in requests)
        # A failed data request fails visibly rather than rendering missing meanings.
        failed = context.new_page()
        failed.route('**/simple-meanings-v1.json', lambda route: route.abort())
        failed.goto(route, wait_until='networkidle')
        assert failed.locator('[role=alert]').is_visible()
        assert failed.locator('#retry').is_visible()
        failed.close()
        report.update(status='PASS', errors=errors, search_same_surface=True, source_failure_visible=True,
                      associated_input_labels=True, touch_targets_min_44=True,
                      browser='Chromium ' + browser.version, real_device_tested=False)
        context.close()
        browser.close()
finally:
    server.shutdown()
    server.server_close()
    (OUT / 'browser-qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
print(json.dumps(report, ensure_ascii=False, indent=2))
