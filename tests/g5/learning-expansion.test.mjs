import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { validateLearningVocabulary, resolveExpandedLearningDaily } from '../../src/domain/korean-learning.mjs';
import { resolveKoreanDailyVerifiedTerm } from '../../src/domain/korean-daily.mjs';
const read = p => JSON.parse(fs.readFileSync(new URL(`../../content/korean-expression/${p}`, import.meta.url), 'utf8'));
const data = read('emotion-map-v1.json');
const oldPool = read('daily-pool-v2.json');
const vocabulary = read('learning-vocabulary-v1.json');
const expansion = read('learning-expansion-v1.json');
const evidence = read('evidence/learning-expansion-source-v1.json');
const schedule = read('learning-daily-v3.json');
const clone = value => structuredClone(value);

test('The learner vocabulary expands from 151 to 177 with 26 nonduplicate source-backed words', () => {
  assert.equal(vocabulary.term_count, 177);
  assert.equal(vocabulary.base_term_count, 151);
  assert.equal(vocabulary.added_term_count, 26);
  assert.equal(validateLearningVocabulary(vocabulary).size, 177);
  assert.equal(vocabulary.child_usability_tested, false);
  assert.equal(vocabulary.product_release_authorized, false);
  assert.equal(evidence.verified_count, 26);
  for (const word of expansion.entries) {
    const source = evidence.entries.find(row => row.expression === word.expression);
    assert.equal(source.headword, word.expression);
    assert.equal(source.url, word.source_url);
    assert.equal(source.definitions[word.sense_number - 1], word.selected_definition);
    assert.equal(source.selected_sense_number, word.sense_number);
    assert.equal(word.evidence_scope, 'DICTIONARY_SENSE_ONLY');
    assert.equal(word.age_review_status, 'AGE_REVIEW_REQUIRED');
  }
});

test('Physical and nonemotional dictionary senses cannot replace selected emotional senses', () => {
  const expected = { '가뿐하다': 4, '푸근하다': 2, '황홀하다': 2, '끌리다': 2, '머쓱하다': 2, '쓰리다': 3, '아리다': 3 };
  for (const [word, sense] of Object.entries(expected)) assert.equal(expansion.entries.find(row => row.expression === word).sense_number, sense);
  assert.match(expansion.entries.find(row => row.expression === '머쓱하다').meaning, /창피|어색/);
  assert.doesNotMatch(expansion.entries.find(row => row.expression === '머쓱하다').meaning, /키가/);
  assert.match(expansion.entries.find(row => row.expression === '끌리다').meaning, /관심|마음/);
});

test('Previously published maps, copy and v1/v2 daily schedules are byte-for-byte preserved', () => {
  assert.equal(Object.keys(expansion.preserved_source_sha256).length, 6);
  for (const [file, expected] of Object.entries(expansion.preserved_source_sha256)) {
    const bytes = fs.readFileSync(new URL(`../../content/korean-expression/${file}`, import.meta.url));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), expected, file);
  }
});

test('All new words are reachable through existing comparison links without new UI sections', () => {
  const byId = validateLearningVocabulary(vocabulary);
  const visited = new Set(data.terms.map(row => row.id));
  const queue = [...visited];
  while (queue.length) for (const id of byId.get(queue.shift()).related_ids) if (!visited.has(id)) { visited.add(id); queue.push(id); }
  assert.equal(visited.size, 177);
  const html = fs.readFileSync(new URL('../../prototypes/korean-daily-learning-20260923/index.html', import.meta.url), 'utf8');
  assert.equal((html.match(/<details id=/g) || []).length, 3);
  assert.match(html, /learning-vocabulary-v1\.json/);
  assert.doesNotMatch(html, /localStorage|sessionStorage|sendBeacon|177개|151\/151/);
});

test('Before October 1 the published daily word does not change', () => {
  for (const now of [new Date(2026, 8, 24), new Date(2026, 8, 29), new Date(2026, 8, 30, 23, 59, 59)]) {
    const legacy = resolveKoreanDailyVerifiedTerm(data, oldPool, now);
    assert.equal(resolveExpandedLearningDaily(vocabulary, schedule, legacy, now).id, legacy.id);
  }
});

test('The future cycle includes all 177 words once and begins with a new word', () => {
  const first = resolveExpandedLearningDaily(vocabulary, schedule, null, new Date(2026, 9, 1));
  assert.equal(first.expression, '아늑하다');
  const selected = Array.from({ length: 177 }, (_, offset) => resolveExpandedLearningDaily(vocabulary, schedule, null, new Date(2026, 9, 1 + offset)).id);
  assert.equal(new Set(selected).size, 177);
  assert.deepEqual(selected, schedule.term_ids);
  assert.equal(resolveExpandedLearningDaily(vocabulary, schedule, null, new Date(2026, 9, 178)).id, first.id);
});

test('Month/year/leap-day boundaries advance by a single local calendar day', () => {
  for (const day of [new Date(2026, 9, 31), new Date(2026, 11, 31), new Date(2028, 1, 28), new Date(2028, 1, 29)]) {
    const next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    const a = resolveExpandedLearningDaily(vocabulary, schedule, null, day).id;
    const b = resolveExpandedLearningDaily(vocabulary, schedule, null, next).id;
    assert.equal((schedule.term_ids.indexOf(a) + 1) % 177, schedule.term_ids.indexOf(b));
  }
});

test('Missing meanings, broken links, unknown IDs and invalid schedules fail closed', () => {
  for (const mutate of [v => v.entries.push(v.entries[0]), v => v.entries[0].meaning = '', v => v.entries[0].related_ids = ['KE9999', 'KE0001']]) {
    const broken = clone(vocabulary); mutate(broken); assert.throws(() => validateLearningVocabulary(broken));
  }
  for (const mutate of [s => s.term_ids[0] = s.term_ids[1], s => s.effective_date = '2026-02-30', s => s.vocabulary_id = 'WRONG', s => s.term_ids.pop()]) {
    const broken = clone(schedule); mutate(broken); assert.throws(() => resolveExpandedLearningDaily(vocabulary, broken, null, new Date(2026, 9, 1)));
  }
});
