function clone(value) {
  return value == null ? value : structuredClone(value);
}

function normalize(value) {
  return String(value ?? '').normalize('NFKC').trim().toLocaleLowerCase();
}

export function searchCards(catalog, query) {
  const q = normalize(query);
  if (!q) return [];
  const results = [];
  for (const card of catalog.cards) {
    const reasons = [];
    if (normalize(card.term.original).includes(q)) reasons.push('단어');
    const tag = card.semantic_tags.find((value) => normalize(value).includes(q));
    if (tag) reasons.push(`태그 · ${tag}`);
    if (normalize(card.meaning.verified_definition).includes(q)) reasons.push('검증된 의미');
    const comparisonLocale = ['ko', 'en', 'zh', 'ja'].find((locale) =>
      card.comparisons[locale].near_terms.some((term) => normalize(term).includes(q)),
    );
    if (comparisonLocale) reasons.push(`${comparisonLocale.toUpperCase()} 가까운 표현`);
    if (reasons.length) results.push({ card: clone(card), rationale: reasons.join(' · ') });
  }
  return results.sort((a, b) => a.card.card_id.localeCompare(b.card.card_id));
}

export function discoverByTag(catalog, tag) {
  const target = normalize(tag);
  if (!target) return [];
  return catalog.cards
    .filter((card) => card.semantic_tags.some((value) => normalize(value) === target))
    .map((card) => ({ card: clone(card), rationale: `태그 · ${tag}` }));
}

export function getRelatedCards(catalog, cardId) {
  const card = catalog.cardMap.get(cardId);
  if (!card) return [];
  const groups = [
    ['similar_to', '비슷한 마음'],
    ['partially_overlaps', '일부 겹치는 마음'],
    ['contrasts_with', '대조되는 마음'],
    ['broader_than', '더 넓은 마음'],
    ['narrower_than', '더 구체적인 마음'],
    ['often_confused_with', '헷갈리기 쉬운 마음'],
  ];
  const out = [];
  for (const [relation, label] of groups) {
    for (const targetId of card.relations?.[relation] || []) {
      const target = catalog.cardMap.get(targetId);
      if (target) out.push({ relation, label, card: clone(target) });
    }
  }
  return out;
}

export function canonicalCardHref(cardId, section = 'meaning') {
  const safeSection = ['meaning', 'languages', 'culture', 'relations', 'evidence'].includes(section) ? section : 'meaning';
  return `?card=${encodeURIComponent(cardId)}#${safeSection}`;
}
