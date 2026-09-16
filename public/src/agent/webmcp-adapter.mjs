import { getCard, getCardReferences, getDailyCard, toPublicCardSemantics } from '../domain/cards.mjs';
import { discoverByTag, getRelatedCards, searchCards } from '../domain/discovery.mjs';

export const AGENT_CONTRACT_VERSION = '1.1.0';

function ok(data, meta = {}) {
  return { ok: true, agent_contract_version: AGENT_CONTRACT_VERSION, ...meta, data };
}
function error(code, message) {
  return { ok: false, agent_contract_version: AGENT_CONTRACT_VERSION, error: { code, message } };
}
function publicSearchRow(row) {
  return { card: toPublicCardSemantics(row.card), rationale: row.rationale };
}

export function createReadOnlyAgentApi({
  catalog,
  clock = () => new Date(),
  dailySeed = 'nameonmymind-anonymous-v1',
  dailyResolver = null,
  dataSnapshotVersion = null,
} = {}) {
  if (!catalog) throw new TypeError('catalog is required');
  const resolveDaily = () => dailyResolver?.() || getDailyCard(catalog, { date: clock(), seed: dailySeed });
  const meta = { data_snapshot_version: dataSnapshotVersion };
  return Object.freeze({
    get_card({ card_id } = {}) {
      const card = getCard(catalog, card_id);
      if (!card) return error('CARD_NOT_FOUND', 'The requested card does not exist in the validated dataset.');
      return ok(toPublicCardSemantics(card), meta);
    },
    get_daily_card() {
      const card = resolveDaily();
      if (!card) return error('NOT_VERIFIED', 'No validated card is available.');
      return ok(toPublicCardSemantics(card), meta);
    },
    search_feelings({ query } = {}) {
      if (!String(query || '').trim()) return error('INVALID_QUERY', 'A non-empty search query is required.');
      return ok(searchCards(catalog, query).map(publicSearchRow), meta);
    },
    discover_by_feeling({ tag } = {}) {
      if (!String(tag || '').trim()) return error('INVALID_QUERY', 'A non-empty semantic tag is required.');
      return ok(discoverByTag(catalog, tag).map(publicSearchRow), meta);
    },
    get_related_feelings({ card_id } = {}) {
      const card = getCard(catalog, card_id);
      if (!card) return error('CARD_NOT_FOUND', 'The requested card does not exist in the validated dataset.');
      return ok(getRelatedCards(catalog, card_id).map((row) => ({
        relation: row.relation,
        label: row.label,
        card: toPublicCardSemantics(row.card),
      })), meta);
    },
    get_references({ card_id } = {}) {
      const card = getCard(catalog, card_id);
      if (!card) return error('CARD_NOT_FOUND', 'The requested card does not exist in the validated dataset.');
      return ok(getCardReferences(catalog, card_id), meta);
    },
    get_verification_status({ card_id } = {}) {
      const card = getCard(catalog, card_id);
      if (!card) return error('CARD_NOT_FOUND', 'The requested card does not exist in the validated dataset.');
      return ok({ card_id: card.card_id, concept_version: card.concept_version, verification: structuredClone(card.verification) }, meta);
    },
  });
}

function tool({ name, description, inputSchema, execute }) {
  return {
    name,
    description,
    inputSchema,
    annotations: { readOnlyHint: true, consequentialHint: false, untrustedContentHint: false },
    execute,
  };
}
const emptyInput = { type: 'object', additionalProperties: false };
const cardIdInput = {
  type: 'object', additionalProperties: false, required: ['card_id'],
  properties: { card_id: { type: 'string', pattern: '^C[0-9]{4}$' } },
};
const nonEmptyString = { type: 'string', minLength: 1, maxLength: 200 };

export function buildReadOnlyTools(api) {
  return [
    tool({ name: 'get_card', description: 'Return one validated Name On My Mind card by stable card_id. Read-only; no repository or publication authority.', inputSchema: cardIdInput, execute: (args) => api.get_card(args) }),
    tool({ name: 'get_daily_card', description: 'Return the same daily card resolved for the current human browser experience. Read-only.', inputSchema: emptyInput, execute: () => api.get_daily_card() }),
    tool({ name: 'search_feelings', description: 'Search validated public cards by term, semantic tag, verified meaning, or cross-language near-term. Results explain the match and are not emotional diagnoses.', inputSchema: { type: 'object', additionalProperties: false, required: ['query'], properties: { query: nonEmptyString } }, execute: (args) => api.search_feelings(args) }),
    tool({ name: 'discover_by_feeling', description: 'Browse validated cards by an explicit semantic tag. Read-only and non-diagnostic.', inputSchema: { type: 'object', additionalProperties: false, required: ['tag'], properties: { tag: nonEmptyString } }, execute: (args) => api.discover_by_feeling(args) }),
    tool({ name: 'get_related_feelings', description: 'Return validated semantic relations for a card using the same relation graph as the human UI.', inputSchema: cardIdInput, execute: (args) => api.get_related_feelings(args) }),
    tool({ name: 'get_references', description: 'Return public bibliographic metadata for the references attached to a validated card.', inputSchema: cardIdInput, execute: (args) => api.get_references(args) }),
    tool({ name: 'get_verification_status', description: 'Return the public verification status and review date for a validated card.', inputSchema: cardIdInput, execute: (args) => api.get_verification_status(args) }),
  ];
}

export function registerWebMcpReadOnlyTools({ api, modelContext = globalThis.document?.modelContext } = {}) {
  if (!api || !modelContext || typeof modelContext.registerTool !== 'function') return { supported: false, registered: [] };
  const tools = buildReadOnlyTools(api);
  const registered = [];
  for (const definition of tools) {
    modelContext.registerTool(definition);
    registered.push(definition.name);
  }
  return { supported: true, registered };
}
