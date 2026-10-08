import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createPositiveLearningModel } from '../../src/domain/positive-learning.mjs';

const read = (file) => JSON.parse(fs.readFileSync(new URL(`../../${file}`, import.meta.url)));
const vocabulary = read('content/korean-expression/learning-vocabulary-v1.json');
const policy = read('content/korean-expression/positive-focus-v1.json');
const world = read('content/korean-expression/world-contexts-v1.json');
const model = () => createPositiveLearningModel(vocabulary, policy, world);

test('the complete 61-day cycle is positive and crosses calendar boundaries', () => {
  const m = model();
  for (let i = 0; i < 61; i++) {
    const date = new Date(Date.UTC(2026, 9, 8 + i, 12));
    assert.match(m.daily(date).id, /^KE\d{4}$/);
  }
  assert.equal(m.daily(new Date('2026-10-07T23:00:00')).id, 'KE0001');
  assert.equal(m.daily(new Date('2028-02-29T12:00:00')).id, policy.daily_ids[(Date.UTC(2028, 1, 29) - Date.UTC(2026, 9, 8)) / 86400000 % 61]);
  assert.equal(m.daily(new Date('2029-01-01T12:00:00')).id, policy.daily_ids[(Date.UTC(2029, 0, 1) - Date.UTC(2026, 9, 8)) / 86400000 % 61]);
});

test('all original, comparison-only, and world IDs are reachable', () => {
  const m = model();
  for (const row of vocabulary.entries) assert.ok(m.select(`#${row.id}`).hero);
  for (const row of policy.comparison_only_entries) {
    const selection = m.select(`#${row.id}`);
    assert.match(selection.hero.id, /^KE/);
    assert.equal(selection.comparison.id, row.id);
  }
  for (const row of world.entries) assert.equal(m.select(`#${row.id}`).requestedWorld.id, row.id);
});

test('positive results lead search and every hero has two positive links', () => {
  const m = model();
  for (const id of m.focusIds()) {
    const selection = m.select(`#${id}`);
    assert.equal(selection.focus.related_ids.length, 2);
    assert.ok(selection.focus.related_ids.every((related) => m.focusIds().includes(related)));
  }
  assert.equal(m.search('기쁘다')[0].type, 'positive');
  assert.equal(m.search('불쾌하다')[0].label, '반대말');
});

test('lexical and contextual relations keep distinct labels', () => {
  const m = model();
  assert.equal(m.select('#AX0001').comparison_label, '반대말');
  assert.equal(m.select('#KE0077').comparison_label, '대비되는 마음');
  assert.equal(m.select('#KE0010').comparison_label, '찾아본 말');
});

test('invalid declared sources and daily IDs fail closed', () => {
  const badSource = structuredClone(policy);
  badSource.relations[0].source_url = 'http://evil.example/';
  assert.throws(() => createPositiveLearningModel(vocabulary, badSource, world), /Invalid positive learning policy/);
  const badDaily = structuredClone(policy);
  badDaily.daily_ids[0] = 'AX0001';
  assert.throws(() => createPositiveLearningModel(vocabulary, badDaily, world), /Invalid positive learning policy/);
});

test('writing remains private and typing does not invoke a request', () => {
  const html = fs.readFileSync(new URL('../../src/ui/positive-learning.html', import.meta.url), 'utf8');
  assert.match(html, /drafts=new Map/);
  assert.match(html, /저장되지 않아요/);
  assert.doesNotMatch(html, /sentence\.addEventListener\(['"]input['"][\s\S]*fetch/);
});
