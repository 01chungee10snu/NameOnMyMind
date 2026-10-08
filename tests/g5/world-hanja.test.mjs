import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { renderHanja, hanjaSources } from '../../src/ui/world-hanja.mjs';

const root = path.resolve(new URL('../..', import.meta.url).pathname);
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const authored = readJson('content/korean-expression/world-hanja-v1.json');
const world = readJson('content/korean-expression/world-contexts-v1.json');

test('authored Hanja data compiles deterministically', () => {
  const run = spawnSync(process.execPath, [path.join(root, 'scripts/korean/build-world-hanja.mjs'), '--check'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
});

test('renders Han characters in source order with Korean hun/eum labels', () => {
  const wc06 = renderHanja({ id: 'WC06', term: '物の哀れ' });
  const plain = markup => markup.replace(/<[^>]+>/g, '');
  assert.match(plain(wc06), /物\s+물건\s+물.*哀\s+슬플\s+애/s);
  const wc07 = renderHanja({ id: 'WC07', term: '舍不得' });
  assert.match(plain(wc07), /舍\(捨\)\s+버릴\s+사.*不\s+아닐\s+불\/부.*得\s+얻을\s+득/s);
  assert.match(wc07, /舍는 여기서 捨의 간체자예요/);
  assert.doesNotMatch(renderHanja({ id: 'WC06', term: 'もののあわれ' }), /한자 음훈/);
  assert.doesNotMatch(renderHanja({ id: 'WC99', term: '舍不得' }), /한자 음훈/);
  assert.doesNotMatch(renderHanja({ id: 'WC06', term: '그립다' }), /한자 음훈/);
  assert.doesNotMatch(renderHanja({ id: 'WC07', term: '<img src=x onerror=alert(1)>' }), /한자 음훈/);
});

test('source disclosure contains provenance and does not alter meaning or TTS text', () => {
  const row = world.entries.find(entry => entry.id === 'WC07');
  const markup = renderHanja(row);
  assert.equal((markup.match(/<span class="world-hanja-item"[^>]*>/g) || []).length, 3);
  const sources = hanjaSources(row);
  assert.match(sources, /ko\.wiktionary\.org/);
  assert.match(sources, /zdic\.net/);
  assert.match(sources, /CC BY-SA 4\.0/);
  assert.doesNotMatch(sources, /speech_text|듣기/);
  assert.equal(renderHanja({ id: 'WC06', term: '物の哀れ' }).includes('もののあわれ'), false);
});

test('authored coverage contains only the Han characters in each term', () => {
  const han = /\p{Script=Han}/u;
  for (const entry of authored.entries) {
    const actual = [...entry.term].filter(character => han.test(character));
    assert.deepEqual(entry.characters.map(character => character.hanja), actual);
    assert.ok(entry.characters.every(character => character.hun && character.eum));
  }
});
