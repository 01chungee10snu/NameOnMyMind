#!/usr/bin/env python3
"""Credential-isolated NIKL candidate collector; never publishes daily cards.
Reads KRDICT_API_KEY from environment only. No key or keyed URL is logged.
"""
import argparse
import datetime
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

class NiklError(Exception):
    pass

def parse_response(payload):
    if len(payload) > 2_000_000 or b'<!DOCTYPE' in payload.upper() or b'<!ENTITY' in payload.upper():
        raise NiklError('UNSAFE_XML')
    try: root = ET.fromstring(payload)
    except ET.ParseError: raise NiklError('INVALID_XML') from None
    if root.tag == 'error':
        code = root.findtext('error_code', 'UNKNOWN')
        raise NiklError('NIKL_ERROR_' + code if re.fullmatch(r'\d{3}', code) else 'NIKL_ERROR_UNKNOWN')
    if root.tag != 'channel': raise NiklError('INVALID_CHANNEL')
    entries = []
    for item in root.findall('item'):
        code, word = item.findtext('target_code', ''), item.findtext('word', '')
        if not code.isdigit() or not word.strip(): raise NiklError('INVALID_ENTRY')
        senses = []
        for sense in item.findall('sense'):
            number, definition = sense.findtext('sense_order', ''), sense.findtext('definition', '').strip()
            if not number.isdigit() or not definition: raise NiklError('INVALID_SENSE')
            senses.append({'sense_order': int(number), 'definition': definition})
        if senses:
            entries.append({'target_code': code, 'word': word, 'homonym': item.findtext('sup_no', ''),
                            'pos': item.findtext('pos', ''), 'senses': senses,
                            'source_url': 'https://krdict.korean.go.kr/eng/dicSearch/SearchView?ParaWordNo=' + code + '&nation=eng'})
    try: total = int(root.findtext('total', '0'))
    except ValueError: raise NiklError('INVALID_TOTAL') from None
    return {'total': total, 'entries': entries}

def collect(key, queries, pages=1, opener=urllib.request.urlopen):
    if not re.fullmatch(r'[a-fA-F0-9]{32}', key or ''): raise NiklError('MISSING_OR_INVALID_KRDICT_API_KEY')
    if not 1 <= pages <= 10 or not 1 <= len(queries) <= 10: raise NiklError('REQUEST_BUDGET_EXCEEDED')
    found = {}; count = 0
    for query in queries:
        if not re.fullmatch(r'[가-힣 ]{1,30}', query): raise NiklError('INVALID_QUERY')
        for page in range(pages):
            start = 1 + page * 100
            params = {'key': key, 'q': query, 'start': start, 'num': 100, 'part': 'dfn', 'sort': 'dict'}
            request = urllib.request.Request('https://krdict.korean.go.kr/api/search?' + urllib.parse.urlencode(params), headers={'User-Agent': 'NameOnMyMind-ResearchCollector/1.0'})
            try:
                with opener(request, timeout=15) as response: payload = response.read(2_000_001)
            except Exception: raise NiklError('NIKL_NETWORK_ERROR') from None
            data = parse_response(payload); count += 1
            for entry in data['entries']: found[entry['target_code']] = entry
            if start + 100 > data['total'] or not data['entries']: break
            time.sleep(1)
    return {'source': '국립국어원 한국어기초사전 Open API', 'status': 'RESEARCH_IMPORT_REVIEW_REQUIRED',
            'retrieved_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
            'requests': count, 'entry_count': len(found), 'entries': list(found.values()),
            'rights_review_required': True, 'daily_card_promotion': False}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--query', default='마음,기분,감정,그리움,즐겁다')
    parser.add_argument('--pages', type=int, default=1)
    parser.add_argument('--output', type=Path, default=Path('.tmp/nikl-candidates.json'))
    args = parser.parse_args()
    try:
        result = collect(os.environ.get('KRDICT_API_KEY', ''), [q.strip() for q in args.query.split(',')], args.pages)
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n',encoding='utf-8')
        print(json.dumps({'status':'PASS','entries':result['entry_count'],'requests':result['requests']}))
    except NiklError as error:
        print(json.dumps({'status':'NOT_ACTIVE' if str(error)=='MISSING_OR_INVALID_KRDICT_API_KEY' else 'FAILED','code':str(error)}))
        return 3
    return 0

if __name__ == '__main__': sys.exit(main())
