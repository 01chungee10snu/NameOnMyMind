import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCatalog } from '../../src/domain/cards.mjs';
import { canonicalCardHref, discoverByTag, getRelatedCards, searchCards } from '../../src/domain/discovery.mjs';
import { getLocalCollection, listFavorites, listViewed, readReflection, resolveDailyCard, saveReflection, toggleFavorite, markViewed } from '../../src/local/state.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/approved/cards/C0001.json'), 'utf8'));

class MemoryStorage {
  #map = new Map();
  getItem(key) { return this.#map.has(key) ? this.#map.get(key) : null; }
  setItem(key, value) { this.#map.set(key, String(value)); }
  removeItem(key) { this.#map.delete(key); }
}
function card(id, term, tags = ['longing']) {
  const c = structuredClone(base);
  c.card_id = id; c.term.original = term; c.semantic_tags = tags;
  c.relations = { similar_to: [], partially_overlaps: [], contrasts_with: [], broader_than: [], narrower_than: [], often_confused_with: [] };
  return c;
}

test('same-day daily assignment freezes in local state across later catalog/seed changes', () => {
  const storage = new MemoryStorage();
  const date = new Date(2026, 8, 16, 9, 0, 0);
  const firstCatalog = createCatalog({ cards: [card('C0001','saudade'), card('C0002','two')] });
  const first = resolveDailyCard(firstCatalog, { storage, date, seed: 'initial' });
  assert.equal(first.frozen, false);
  const expanded = createCatalog({ cards: [card('C0001','saudade'), card('C0002','two'), card('C0003','three')] });
  const again = resolveDailyCard(expanded, { storage, date: new Date(2026,8,16,23,59), seed: 'changed' });
  assert.equal(again.frozen, true);
  assert.equal(again.card.card_id, first.card.card_id);
});

test('favorites viewed history and reflection remain local storage state', () => {
  const storage = new MemoryStorage();
  const catalog = createCatalog({ cards: [base] });
  assert.equal(toggleFavorite(storage,'C0001'), true);
  assert.deepEqual(listFavorites(storage), ['C0001']);
  markViewed(storage,'C0001',new Date('2026-09-16T10:00:00Z'));
  assert.equal(listViewed(storage)[0].card_id,'C0001');
  saveReflection(storage,'C0001','나만 보는 기록');
  assert.equal(readReflection(storage,'C0001'),'나만 보는 기록');
  const collection=getLocalCollection(catalog,storage);
  assert.equal(collection.favorites[0].card_id,'C0001');
  assert.equal(collection.viewed[0].card.card_id,'C0001');
  assert.equal(JSON.stringify(collection).includes('나만 보는 기록'), false);
});

test('search and guided discovery are explainable and non-diagnostic', () => {
  const catalog=createCatalog({cards:[base]});
  const rows=searchCards(catalog,'longing');
  assert.equal(rows[0].card.card_id,'C0001');
  assert.match(rows[0].rationale,/태그|가까운 표현|검증된 의미/);
  assert.doesNotMatch(rows[0].rationale,/진단|당신은|증상/);
  const guided=discoverByTag(catalog,'memory');
  assert.equal(guided[0].card.card_id,'C0001');
});

test('relation lookup and canonical deep links use stable card ids', () => {
  const a=card('C0001','one'); const b=card('C0002','two');
  a.relations.similar_to=['C0002'];
  const catalog=createCatalog({cards:[a,b]});
  const related=getRelatedCards(catalog,'C0001');
  assert.equal(related.length,1); assert.equal(related[0].card.card_id,'C0002'); assert.equal(related[0].relation,'similar_to');
  assert.equal(canonicalCardHref('C0002','relations'),'?card=C0002#relations');
  assert.equal(canonicalCardHref('C0002','unknown'),'?card=C0002#meaning');
});

test('three-space UI and accessibility baseline are present', () => {
  const html=fs.readFileSync(path.join(ROOT,'src/ui/index.html'),'utf8');
  const css=fs.readFileSync(path.join(ROOT,'assets/css/styles.css'),'utf8');
  const app=fs.readFileSync(path.join(ROOT,'src/ui/app.mjs'),'utf8');
  for (const text of ['오늘의 마음','찾아보기','내가 만난 마음']) assert.match(html,new RegExp(text));
  for (const id of ['space-today','space-discover','space-collection','reflection-note','search-input','relations']) assert.match(html,new RegExp(`id="${id}"`));
  assert.match(html,/label[^>]*for="reflection-note"/);
  assert.match(html,/role="search"/);
  assert.match(css,/focus-visible/); assert.match(css,/prefers-reduced-motion/); assert.match(css,/forced-colors/);
  assert.match(app,/localStorage/); assert.match(app,/resolveDailyCard/); assert.match(app,/searchCards/); assert.match(app,/saveReflection/);
});
