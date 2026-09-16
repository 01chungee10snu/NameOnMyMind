import { getCard, getDailyCard, toPublicCardSemantics } from '../domain/cards.mjs';

export const AGENT_CONTRACT_VERSION = '1.0.0';

function ok(data) {
  return { ok: true, agent_contract_version: AGENT_CONTRACT_VERSION, data };
}

function error(code, message) {
  return { ok: false, agent_contract_version: AGENT_CONTRACT_VERSION, error: { code, message } };
}

export function createReadOnlyAgentApi({ catalog, clock = () => new Date(), dailySeed = 'nameonmymind-anonymous-v1' }) {
  return Object.freeze({
    get_card({ card_id } = {}) {
      const card = getCard(catalog, card_id);
      if (!card) return error('CARD_NOT_FOUND', 'The requested card does not exist in the validated dataset.');
      return ok(toPublicCardSemantics(card));
    },
    get_daily_card() {
      const card = getDailyCard(catalog, { date: clock(), seed: dailySeed });
      if (!card) return error('NOT_VERIFIED', 'No validated card is available.');
      return ok(toPublicCardSemantics(card));
    },
  });
}

export function registerWebMcpReadOnlyTools({ api, modelContext = globalThis.document?.modelContext } = {}) {
  if (!api || !modelContext || typeof modelContext.registerTool !== 'function') {
    return { supported: false, registered: [] };
  }

  const tools = [
    {
      name: 'get_card',
      description: 'Return one validated Name On My Mind card by stable card_id. Read-only; no repository or publication authority.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['card_id'],
        properties: { card_id: { type: 'string', pattern: '^C[0-9]{4}$' } },
      },
      annotations: { readOnlyHint: true },
      execute: (args) => api.get_card(args),
    },
    {
      name: 'get_daily_card',
      description: 'Return the deterministic daily Name On My Mind card from the same domain semantics used by the human UI. Read-only.',
      inputSchema: { type: 'object', additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: () => api.get_daily_card(),
    },
  ];

  const registered = [];
  for (const tool of tools) {
    modelContext.registerTool(tool);
    registered.push(tool.name);
  }
  return { supported: true, registered };
}
