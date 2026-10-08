import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createPositiveLearningModel } from '../../src/domain/positive-learning.mjs';

const read = (file) => JSON.parse(fs.readFileSync(new URL(`../../${file}`, import.meta.url)));
const html = fs.readFileSync(new URL('../../src/ui/positive-learning.html', import.meta.url), 'utf8');
const vocabulary = read('content/korean-expression/learning-vocabulary-v1.json');
const policy = read('content/korean-expression/positive-focus-v1.json');
const world = read('content/korean-expression/world-contexts-v1.json');
const uiVocabulary = vocabulary;

test('the page uses selection-owned world entries and disclosure state', () => {
  assert.match(html, /selection\.primaryWorld/);
  assert.match(html, /selection\.secondaryWorld/);
  assert.match(html, /\{\.\.\.world,entries:\[entry\]\}/);
  assert.match(html, /selection\.openComparison/);
  assert.doesNotMatch(html, /world\.find/);
  assert.doesNotMatch(html, /primary_world_ids\.map/);
});

test('all foreign routes preserve one exact requested word and the selected meanings', () => {
  const model = createPositiveLearningModel(uiVocabulary, policy, world);
  for (const entry of world.entries) {
    const selection = model.select(`#${entry.id}`);
    assert.equal(selection.requestedWorld.id, entry.id);
    assert.equal(selection.world.term, entry.term);
    assert.equal(selection.world.meaning, entry.meaning);
  }
  const sad = model.select('#KE0063');
  assert.equal(sad.hero.expression, '기쁘다');
  assert.equal(sad.comparison.expression, '슬프다');
  assert.equal(uiVocabulary.entries.find((row) => row.id === 'KE0042').expression, '그립다');
  assert.equal(world.entries.find((row) => row.id === 'WC01').term, 'saudade');
});

test('comparison search results retain negative definitions and safe source gates', () => {
  const model = createPositiveLearningModel(uiVocabulary, policy, world);
  const result = model.search('불쾌하다')[0];
  assert.equal(result.term.meaning, '기분이 좋지 않고 마음이 언짢다.');
  assert.match(html, /safeLearningSource\(row\.source_url\)/);
  assert.match(html, /href='#'/);
});
