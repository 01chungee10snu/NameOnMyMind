#!/usr/bin/env python3
"""Import licensed Korean Wiktionary entries from Kaikki, never into daily cards.
Run: python3 scripts/dictionary/import-open-dictionary.py --input PATH.jsonl.gz
Use --download to fetch the documented public dump with a bounded request.
"""
import argparse
import datetime
import gzip
import hashlib
import json
import re
import tempfile
import unicodedata
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = 'https://kaikki.org/dictionary/downloads/ko/ko-extract.jsonl.gz'
PAGE = 'https://ko.wiktionary.org/wiki/'
MAX_COMPRESSED = 45_000_000
MAX_UNCOMPRESSED = 400_000_000
EXCLUDE_TAGS = {'vulgar', 'offensive', 'derogatory', 'slur', 'obscene', 'no-gloss'}
# A conservative display filter, not certification of child suitability.
EXCLUDE_WORD = re.compile(r'씨발|시발놈|개새끼|좆|자지|보지|포르노|강간|음란|성교|수간|자위행위|항문성교')
EXCLUDE_GLOSS = re.compile(r'성교|성행위|성적인 흥분|성적 흥분|남성의 성기|여성의 성기|음란|강간|비하하여|욕설|낮잡아|비속어')
ALLOWED_WORD = re.compile(r'^[가-힣][가-힣 ·ㆍ-]{0,39}$')

def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n'
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(text, encoding='utf-8')
    temporary.replace(path)

def load_rows(path):
    consumed = 0
    with gzip.open(path, 'rt', encoding='utf-8') as handle:
        for line in handle:
            consumed += len(line.encode('utf-8'))
            if consumed > MAX_UNCOMPRESSED or len(line) > 2_000_000:
                raise ValueError('Dictionary dump exceeds the bounded import size')
            yield json.loads(line)

def build(path):
    if not path.is_file() or path.stat().st_size > MAX_COMPRESSED:
        raise ValueError('Missing or oversized compressed dictionary dump')
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    words, raw_count, omitted = {}, 0, 0
    for row in load_rows(path):
        if row.get('lang_code') != 'ko':
            continue
        raw_count += 1
        word = unicodedata.normalize('NFC', row.get('word', '')).strip()
        if not ALLOWED_WORD.fullmatch(word) or EXCLUDE_WORD.search(word):
            omitted += 1
            continue
        parts = []
        for number, sense in enumerate(row.get('senses', []), 1):
            tags = set(row.get('tags', [])) | set(sense.get('tags', []))
            raw_tags = ' '.join(row.get('raw_tags', []) + sense.get('raw_tags', []))
            if EXCLUDE_TAGS & tags or re.search(r'비속어|욕설|비하|성적', raw_tags):
                continue
            glosses = [re.sub(r'\s+', ' ', s).strip() for s in sense.get('glosses', []) if isinstance(s, str)]
            glosses = [s for s in glosses if 3 <= len(s) <= 600 and not EXCLUDE_GLOSS.search(s)]
            if not glosses:
                continue
            meaning = ' / '.join(glosses)
            if len(meaning) > 650:
                continue
            # Omit examples, quotations, audio, images and automatic translations.
            parts.append({'pos': row.get('pos_title', ''), 'sense': number, 'definition': meaning})
        if not parts:
            omitted += 1
            continue
        existing = words.setdefault(word, [])
        for sense in parts:
            if not any(x['definition'] == sense['definition'] and x['pos'] == sense['pos'] for x in existing):
                existing.append(sense)
    if len(words) < 10_000:
        raise ValueError('Unexpectedly small source; refusing to replace the existing index')
    output = ROOT / 'content/dictionary/open-ko'
    shards = {f'{i:02x}': {} for i in range(32)}
    index = []
    for word in sorted(words):
        h = hashlib.sha256(word.encode('utf-8')).hexdigest()
        key, shard = 'WD' + h[:16], f'{int(h[:2], 16) % 32:02x}'
        index.append([key, word, shard])
        shards[shard][key] = {'id': key, 'word': word, 'senses': words[word], 'source': 'ko-wiktionary', 'status': 'DICTIONARY_SEARCH_ONLY'}
    version = 'kaikki-ko-' + digest[:16]
    manifest = {
        'schema_version': '1.0.0', 'version': version, 'source': SOURCE,
        'source_name': '한국어 위키낱말사전 · Kaikki 공개 추출본',
        'source_sha256': digest, 'retrieved_at': datetime.datetime.fromtimestamp(path.stat().st_mtime, datetime.timezone.utc).isoformat(),
        'raw_korean_records': raw_count, 'searchable_headwords': len(index),
        'definition_count': sum(len(v) for v in words.values()),
        'omitted_records': omitted, 'shard_count': 32,
        'license': 'CC-BY-SA-4.0', 'license_url': 'https://creativecommons.org/licenses/by-sa/4.0/',
        'attribution': '한국어 위키낱말사전 기여자; Kaikki/Wiktextract 추출. 국립국어원 자료가 포함된 항목은 원문에 표시된 저작자·이용 조건도 함께 적용됩니다.',
        'source_article_base': PAGE, 'changes': '한국어 표제어와 뜻만 추출·정규화·중복 제거. 일부 표시 제한. 예문·인용문·음성·이미지 제외.',
        'status': 'DICTIONARY_SEARCH_ONLY', 'child_usability_tested': False,
        'warning': '전체 일반 어휘의 검색용 자료입니다. 감정어 개수나 검토된 학습 카드 개수를 뜻하지 않습니다.',
        'files': {}
    }
    save(output / 'index.json', {'version': version, 'entries': index})
    for shard, entries in shards.items():
        save(output / 'entries' / (shard + '.json'), {'version': version, 'entries': entries})
    for p in [output / 'index.json'] + sorted((output / 'entries').glob('*.json')):
        manifest['files'][str(p.relative_to(output))] = {'sha256': hashlib.sha256(p.read_bytes()).hexdigest(), 'bytes': p.stat().st_size}
    save(output / 'manifest.json', manifest)
    print(json.dumps({k: manifest[k] for k in ['version','raw_korean_records','searchable_headwords','definition_count','omitted_records']}, ensure_ascii=False))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', type=Path, default=ROOT / '.tmp/external-dictionaries/ko-extract.jsonl.gz')
    parser.add_argument('--download', action='store_true')
    args = parser.parse_args()
    if args.download:
        args.input.parent.mkdir(parents=True, exist_ok=True)
        temporary = args.input.with_suffix('.part')
        try:
            request = urllib.request.Request(SOURCE, headers={'User-Agent': 'NameOnMyMind/1.0 (https://github.com/01chungee10snu/NameOnMyMind)'})
            size = 0
            with urllib.request.urlopen(request, timeout=30) as response, temporary.open('wb') as handle:
                while True:
                    chunk = response.read(1024 * 512)
                    if not chunk: break
                    size += len(chunk)
                    if size > MAX_COMPRESSED: raise ValueError('Download size limit exceeded')
                    handle.write(chunk)
            temporary.replace(args.input)
        finally:
            temporary.unlink(missing_ok=True)
    build(args.input)

if __name__ == '__main__':
    main()
