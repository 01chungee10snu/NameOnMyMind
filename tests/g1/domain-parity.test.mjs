import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCatalog, getCard, getDailyCard, selectDailyCardId, toPublicCardSemantics } from '../../src/domain/cards.mjs';
import { createReadOnlyAgentApi, registerWebMcpReadOnlyTools } from '../../src/agent/webmcp-adapter.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const card = read('content/approved/cards/C0001.json');
const references = read('content/approved/references.json').references;
const assets = read('content/approved/assets.json').assets;
const catalog = createCatalog({ cards: [card], references, assets });
const fixedDate = new Date(2026, 8, 16, 9, 0, 0);
const seed = 'g1-test-seed';

test('stable lookup returns the canonical card without mutating source', () => {
  const found = getCard(catalog, 'C0001');
  assert.equal(found.card_id, 'C0001');
  found.term.original = 'mutated';
  assert.equal(getCard(catalog, 'C0001').term.original, 'saudade');
  assert.equal(getCard(catalog, 'C9999'), null);
});

test('daily assignment is deterministic for the same local day and seed', () => {
  assert.equal(selectDailyCardId(catalog, { date: fixedDate, seed }), 'C0001');
  assert.equal(selectDailyCardId(catalog, { date: new Date(2026, 8, 16, 23, 59, 59), seed }), 'C0001');
  assert.deepEqual(getDailyCard(catalog, { date: fixedDate, seed }), getCard(catalog, 'C0001'));
});

test('agent get_card uses identical domain semantics to human lookup', () => {
  const api = createReadOnlyAgentApi({ catalog, clock: () => fixedDate, dailySeed: seed });
  assert.deepEqual(api.get_card({ card_id: 'C0001' }).data, toPublicCardSemantics(getCard(catalog, 'C0001')));
});

test('agent get_daily_card uses identical domain semantics to daily UI selection', () => {
  const api = createReadOnlyAgentApi({ catalog, clock: () => fixedDate, dailySeed: seed });
  assert.deepEqual(api.get_daily_card().data, toPublicCardSemantics(getDailyCard(catalog, { date: fixedDate, seed })));
});

test('WebMCP registration preserves G1 read-only card tools as the agent surface expands', () => {
  const api = createReadOnlyAgentApi({ catalog, clock: () => fixedDate, dailySeed: seed });
  const captured = [];
  const result = registerWebMcpReadOnlyTools({ api, modelContext: { registerTool(tool) { captured.push(tool); } } });
  assert.equal(result.registered.includes('get_card'), true);
  assert.equal(result.registered.includes('get_daily_card'), true);
  assert.equal(captured.every((tool) => tool.annotations?.readOnlyHint === true), true);
  assert.equal(captured.every((tool) => tool.annotations?.consequentialHint === false), true);
  assert.equal(captured.some((tool) => /write|publish|repository mutation/i.test(tool.name)), false);
});
