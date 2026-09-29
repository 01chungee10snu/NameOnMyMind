import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = p => JSON.parse(fs.readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8'));
const data = read('content/korean-expression/emotion-map-v1.json');
const copy = read('content/korean-expression/learning-copy-v1.json');
const built = read('content/korean-expression/simple-meanings-v1.json');
const html = fs.readFileSync(new URL('../../prototypes/korean-daily-learning-20260923/index.html', import.meta.url), 'utf8');

test('Every verified term has one short editorial meaning and one original example', () => {
  assert.equal(built.entries.length, 151);
  assert.equal(new Set(built.entries.map(row => row.id)).size, 151);
  assert.equal(new Set(built.entries.map(row => row.example)).size, 151);
  assert.equal(built.example_count, 151);
  assert.equal(built.editorial_simplification_count, 151);
  assert.equal(built.child_usability_tested, false);
  for (const term of data.terms) {
    const row = built.entries.find(row => row.id === term.id);
    assert.equal(row.expression, term.expression);
    assert.equal(row.evidence_ref, term.evidence_ref);
    assert.equal(row.wording, 'EDITORIAL_SIMPLIFICATION');
    assert.equal(row.related_ids.length, 2);
    assert.equal(new Set(row.related_ids).size, 2);
    assert.ok(row.related_ids.every(id => id !== row.id && built.entries.some(other => other.id === id)));
    assert.ok(row.meaning.length >= 5 && row.meaning.length <= 64, term.expression);
    assert.ok(row.example.length >= 8 && row.example.length <= 90, term.expression);
    assert.ok(copy.entries.find(item => item.id === term.id)?.previous_display?.meaning);
  }
});

test('Selected emotional senses and whole idioms do not regress to the first headword sense', () => {
  const meaning = term => built.entries.find(row => row.expression === term).meaning;
  assert.equal(meaning('벅차다'), '기쁨이나 희망이 마음에 가득 차다.');
  assert.equal(meaning('민망하다'), '다른 사람을 대하거나 보기가 부끄럽다.');
  assert.equal(meaning('맥이 빠지다'), '기운이 없어지고 힘이 풀리다.');
  assert.equal(meaning('애가 타다'), '몹시 걱정되거나 안타까워 마음이 조급하다.');
  assert.doesNotMatch(meaning('억울하다'), /부당성 인식|묶이는 상태/);
  assert.doesNotMatch(meaning('여운'), /운치/);
});

test('Learning surface includes visible meanings, examples and two related words, not research clutter', () => {
  for (const text of ['오늘의 마음말', '뜻', '이렇게 써요', '비슷한 말', '내 문장 써보기']) assert.ok(html.includes(text), text);
  assert.match(html, /slice\(0,2\)/);
  assert.match(html, /<label[^>]+for="sentence"/);
  assert.match(html, /<label[^>]+for="search"/);
  assert.match(html, /<details id="write">/);
  assert.match(html, /<details id="find">/);
  assert.doesNotMatch(html, /<details[^>]* open/);
  assert.doesNotMatch(html, /오늘의 학습 풀|151\/151|근거 연결|lexical depth/);
});

test('Word navigation remains on the simple surface and drafts are never persisted or transmitted', () => {
  assert.match(html, /hashchange/);
  assert.match(html, /drafts=new Map/);
  assert.match(html, /autocomplete="off"/);
  assert.match(html, /여기에 쓴 글은 저장되지 않아요/);
  assert.match(html, /다른 곳으로 보내지도 않아요/);
  assert.doesNotMatch(html, /localStorage|sessionStorage|indexedDB|sendBeacon|WebSocket|method:[^}]*POST/);
  assert.doesNotMatch(html, /korean-emotion-map-20260919/);
});
