import { getCard, getDailyCard, localDateKey } from '../domain/cards.mjs';

const KEYS = Object.freeze({
  daily: 'nomm:daily:v1',
  favorites: 'nomm:favorites:v1',
  viewed: 'nomm:viewed:v1',
  reflectionPrefix: 'nomm:reflection:v1:',
});

function readJson(storage, key, fallback) {
  try {
    const raw = storage?.getItem?.(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function writeJson(storage, key, value) {
  storage?.setItem?.(key, JSON.stringify(value));
  return value;
}

export function resolveDailyCard(catalog, { storage, date = new Date(), seed = 'nameonmymind-public-v1' } = {}) {
  const dateKey = localDateKey(date);
  const frozen = readJson(storage, KEYS.daily, null);
  if (frozen?.date === dateKey && frozen.card_id) {
    const card = getCard(catalog, frozen.card_id);
    if (card) return { card, frozen: true, date: dateKey };
  }
  const card = getDailyCard(catalog, { date, seed });
  if (!card) return { card: null, frozen: false, date: dateKey };
  writeJson(storage, KEYS.daily, { date: dateKey, card_id: card.card_id });
  return { card, frozen: false, date: dateKey };
}

export function listFavorites(storage) {
  const ids = readJson(storage, KEYS.favorites, []);
  return Array.isArray(ids) ? [...new Set(ids.filter((x) => /^C\d{4}$/.test(String(x))))] : [];
}
export function toggleFavorite(storage, cardId) {
  const set = new Set(listFavorites(storage));
  const favorited = !set.has(cardId);
  if (favorited) set.add(cardId); else set.delete(cardId);
  writeJson(storage, KEYS.favorites, [...set].sort());
  return favorited;
}

export function listViewed(storage) {
  const rows = readJson(storage, KEYS.viewed, []);
  return Array.isArray(rows) ? rows.filter((x) => /^C\d{4}$/.test(String(x?.card_id)) && typeof x?.viewed_at === 'string') : [];
}
export function markViewed(storage, cardId, now = new Date()) {
  const rows = listViewed(storage).filter((row) => row.card_id !== cardId);
  rows.unshift({ card_id: cardId, viewed_at: now.toISOString() });
  writeJson(storage, KEYS.viewed, rows.slice(0, 200));
  return rows[0];
}

export function readReflection(storage, cardId) {
  const value = storage?.getItem?.(`${KEYS.reflectionPrefix}${cardId}`);
  return typeof value === 'string' ? value : '';
}
export function saveReflection(storage, cardId, body) {
  const value = String(body ?? '');
  storage?.setItem?.(`${KEYS.reflectionPrefix}${cardId}`, value);
  return value;
}

export function getLocalCollection(catalog, storage) {
  return {
    favorites: listFavorites(storage).map((id) => getCard(catalog, id)).filter(Boolean),
    viewed: listViewed(storage).map((row) => ({ ...row, card: getCard(catalog, row.card_id) })).filter((row) => row.card),
  };
}

export { KEYS as LOCAL_STATE_KEYS };
