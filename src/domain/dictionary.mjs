// Public dictionary lookup is separate from curated daily learning cards.
export class DictionaryError extends Error {
  constructor(code) { super(code); this.name = 'DictionaryError'; this.code = code; }
}
export function normalizeHeadword(value) {
  const word = String(value ?? '').normalize('NFC').trim().replace(/ +/g, ' ');
  if (!/^[가-힣][가-힣 ·ㆍ-]{0,39}$/.test(word)) throw new DictionaryError('INVALID_QUERY');
  if (/씨발|개새끼|좆|자지|보지|포르노|강간|음란|성교|수간|자위행위/.test(word)) throw new DictionaryError('RESTRICTED_QUERY');
  return word;
}
export function rankDictionaryEntries(entries, query, limit = 12) {
  const q = normalizeHeadword(query);
  const rows = entries.filter(row => row[1].includes(q));
  const score = word => word === q ? 0 : word.startsWith(q) ? 1 : 2;
  rows.sort((a,b) => score(a[1])-score(b[1]) || a[1].length-b[1].length || a[1].localeCompare(b[1],'ko'));
  return { total: rows.length, rows: rows.slice(0, Math.min(50, Math.max(1, limit))) };
}
export function dictionaryArticleUrl(word, revision = null) {
  const title = normalizeHeadword(word);
  return Number.isSafeInteger(revision) && revision > 0
    ? `https://ko.wiktionary.org/w/index.php?title=${encodeURIComponent(title)}&oldid=${revision}`
    : `https://ko.wiktionary.org/wiki/${encodeURIComponent(title)}`;
}
export function validateDictionaryEntry(entry) {
  normalizeHeadword(entry?.word);
  if (!Array.isArray(entry?.senses) || !entry.senses.length || entry.senses.length > 200) throw new DictionaryError('NO_DEFINITIONS');
  for (const sense of entry.senses) {
    if (typeof sense.definition !== 'string' || !sense.definition.trim() || sense.definition.length > 1000) throw new DictionaryError('INVALID_DATA');
  }
  return entry;
}
export function matchWorldContext(world, expression) {
  return world?.entries?.find(row => row.relation === 'PARTIAL_CONTEXT_OVERLAP' && row.anchors?.includes(expression)) || null;
}

async function responseText(response, maxBytes) {
  if (!response.ok) throw new DictionaryError(response.status === 429 ? 'RATE_LIMITED' : 'UNAVAILABLE');
  if (Number(response.headers.get('content-length') || 0) > maxBytes) throw new DictionaryError('OVERSIZED_RESPONSE');
  const reader = response.body.getReader();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.length;
      if (size > maxBytes) throw new DictionaryError('OVERSIZED_RESPONSE');
      chunks.push(value);
    }
  } catch (error) { await reader.cancel(); throw error; }
  const bytes = new Uint8Array(size); let at = 0;
  for (const part of chunks) { bytes.set(part, at); at += part.length; }
  return { text: new TextDecoder().decode(bytes), bytes };
}
async function getJson(url, { signal, limit = 2_000_000, expectedHash = null } = {}) {
  const response = await fetch(url, { signal, credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-cache' });
  const { text, bytes } = await responseText(response, limit);
  if (expectedHash) {
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');
    if (hash !== expectedHash) throw new DictionaryError('SNAPSHOT_MISMATCH');
  }
  try { return JSON.parse(text); } catch { throw new DictionaryError('INVALID_DATA'); }
}

export function parseWiktionaryPayload(payload, requestedWord, documentObject = globalThis.document) {
  const word = normalizeHeadword(requestedWord);
  if (payload.error) throw new DictionaryError(payload.error.code === 'missingtitle' ? 'NOT_FOUND' : 'UNAVAILABLE');
  const parsed = payload.parse;
  if (!parsed || parsed.title !== word || typeof parsed.text !== 'string' || parsed.text.length > 1_000_000) throw new DictionaryError('INVALID_DATA');
  // Detached templates are inert. Never insert source HTML or media into the page.
  const template = documentObject.createElement('template');
  template.innerHTML = parsed.text;
  const content = template.content.querySelector('.mw-parser-output') || template.content;
  let inKorean = false, pos = ''; const senses = [];
  for (const element of content.children) {
    const heading2 = element.matches('h2') ? element : element.querySelector(':scope > h2');
    if (heading2) {
      if (inKorean) break;
      inKorean = heading2.id === '한국어' || heading2.textContent.replace(/\[.*?\]/g,'').trim() === '한국어';
      continue;
    }
    if (!inKorean) continue;
    const heading3 = element.matches('h3') ? element : element.querySelector(':scope > h3');
    if (heading3) { pos = heading3.textContent.replace(/\[.*?\]/g,'').trim(); continue; }
    if (element.tagName !== 'OL') continue;
    for (const li of element.children) {
      if (li.tagName !== 'LI') continue;
      const copy = li.cloneNode(true);
      copy.querySelectorAll('ul,ol,dl,table,script,style,sup,.reference').forEach(node=>node.remove());
      const definition = copy.textContent.replace(/\s+/g,' ').trim();
      if (definition.length < 3 || definition.length > 650) continue;
      if (/성교|성행위|성적인 흥분|남성의 성기|여성의 성기|음란|강간|비하하여|욕설|낮잡아|비속어/.test(definition)) continue;
      senses.push({ pos, sense: senses.length + 1, definition });
    }
  }
  const result = { word, senses, source: 'ko-wiktionary-live', status: 'DICTIONARY_SEARCH_ONLY', revision: parsed.revid,
    source_url: dictionaryArticleUrl(word, parsed.revid), has_nikl_notice: parsed.text.includes('국립국어원') };
  return validateDictionaryEntry(result);
}

export function createDictionaryClient(baseUrl) {
  let snapshot = null, index = null, liveBlockedUntil = 0;
  const shards = new Map();
  const base = new URL(baseUrl, globalThis.location?.href || 'http://localhost/');
  async function ensureIndex(signal) {
    if (index) return index;
    const manifest = await getJson(new URL('manifest.json',base), { signal, limit: 50_000 });
    if (!manifest.version || !manifest.files?.['index.json'] || manifest.status !== 'DICTIONARY_SEARCH_ONLY') throw new DictionaryError('INVALID_DATA');
    const fetched = await getJson(new URL('index.json',base), { signal, limit: 12_000_000, expectedHash: manifest.files['index.json'].sha256 });
    if (fetched.version !== manifest.version || fetched.entries.length !== manifest.searchable_headwords) throw new DictionaryError('SNAPSHOT_MISMATCH');
    if (fetched.entries.some(row=>!/^WD[a-f0-9]{16}$/.test(row[0]) || !/^[01][a-f0-9]$/.test(row[2]) || typeof row[1] !== 'string')) throw new DictionaryError('INVALID_DATA');
    snapshot = manifest; index = fetched.entries;
    return index;
  }
  return {
    async search(query, signal) { return rankDictionaryEntries(await ensureIndex(signal), query); },
    async entry(id, signal) {
      const data = await ensureIndex(signal), row = data.find(row=>row[0]===id);
      if (!row) throw new DictionaryError('NOT_FOUND');
      if (!shards.has(row[2])) {
        const file = `entries/${row[2]}.json`;
        const data = await getJson(new URL(file,base), { signal, limit: 2_000_000, expectedHash: snapshot.files[file]?.sha256 });
        if (data.version !== snapshot.version) throw new DictionaryError('SNAPSHOT_MISMATCH');
        shards.set(row[2],data.entries);
      }
      const entry = shards.get(row[2])[id];
      if (!entry || entry.word !== row[1]) throw new DictionaryError('INVALID_DATA');
      return validateDictionaryEntry({ ...entry, source_url: dictionaryArticleUrl(entry.word) });
    },
    async live(query, signal) {
      const word = normalizeHeadword(query);
      if (Date.now() < liveBlockedUntil) throw new DictionaryError('RATE_LIMITED');
      const url = new URL('https://ko.wiktionary.org/w/api.php');
      url.search = new URLSearchParams({ action:'parse', page:word, prop:'text|revid', format:'json', formatversion:'2', origin:'*', maxlag:'5' });
      try {
        const result = parseWiktionaryPayload(await getJson(url,{signal,limit:1_200_000}),word);
        return result;
      } catch (error) {
        if (error.code === 'RATE_LIMITED') liveBlockedUntil=Date.now()+60_000;
        throw error;
      }
    },
    get manifest() { return snapshot; }
  };
}
