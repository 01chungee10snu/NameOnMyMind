const CARD_ID_RE = /^C\d{4}$/;

function assertCatalog(catalog) {
  if (!catalog || !Array.isArray(catalog.cards)) throw new TypeError('catalog.cards must be an array');
}

function clone(value) {
  return value == null ? value : structuredClone(value);
}

export function createCatalog({ cards, references = [], assets = [] }) {
  const cardMap = new Map();
  for (const card of cards) {
    if (!CARD_ID_RE.test(card.card_id)) throw new Error(`invalid card id: ${card.card_id}`);
    if (cardMap.has(card.card_id)) throw new Error(`duplicate card id: ${card.card_id}`);
    cardMap.set(card.card_id, clone(card));
  }
  const referenceMap = new Map(references.map((ref) => [ref.reference_id, clone(ref)]));
  const assetMap = new Map(assets.map((asset) => [asset.asset_id, clone(asset)]));
  return Object.freeze({
    cards: Object.freeze([...cardMap.values()]),
    cardMap,
    referenceMap,
    assetMap,
  });
}

export function getCard(catalog, cardId) {
  assertCatalog(catalog);
  if (!CARD_ID_RE.test(String(cardId || ''))) return null;
  return clone(catalog.cardMap.get(cardId) || null);
}

export function getCardReferences(catalog, cardId) {
  const card = getCard(catalog, cardId);
  if (!card) return [];
  return card.reference_ids.map((id) => clone(catalog.referenceMap.get(id))).filter(Boolean);
}

export function getCardAssets(catalog, cardId) {
  const card = getCard(catalog, cardId);
  if (!card) return [];
  const ids = [card.assets.illustration_asset_id, card.assets.share_asset_id, card.assets.audio_asset_id];
  return ids.map((id) => clone(catalog.assetMap.get(id))).filter(Boolean);
}

function fnv1a32(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function selectDailyCardId(catalog, { date = new Date(), seed = 'nameonmymind-anonymous-v1' } = {}) {
  assertCatalog(catalog);
  if (catalog.cards.length === 0) return null;
  const ids = catalog.cards.map((card) => card.card_id).sort();
  const key = `${localDateKey(date)}|${seed}|${ids.join(',')}`;
  return ids[fnv1a32(key) % ids.length];
}

export function getDailyCard(catalog, options = {}) {
  const cardId = selectDailyCardId(catalog, options);
  return cardId ? getCard(catalog, cardId) : null;
}

export function toPublicCardSemantics(card) {
  if (!card) return null;
  return {
    schema_version: card.schema_version,
    card_id: card.card_id,
    concept_version: card.concept_version,
    status: card.status,
    term: clone(card.term),
    experience_type: card.experience_type,
    front: clone(card.front),
    meaning: clone(card.meaning),
    comparisons: clone(card.comparisons),
    semantic_tags: clone(card.semantic_tags),
    relations: clone(card.relations),
    reference_ids: clone(card.reference_ids),
    verification: clone(card.verification),
    assets: clone(card.assets),
  };
}
