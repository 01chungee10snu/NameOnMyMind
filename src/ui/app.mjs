import { createCatalog, getCard, getCardAssets, getCardReferences, getDailyCard } from '../domain/cards.mjs';
import { createReadOnlyAgentApi, registerWebMcpReadOnlyTools } from '../agent/webmcp-adapter.mjs';

const qs = (selector) => document.querySelector(selector);

async function readJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
  return response.json();
}

function safeExternalLink(url, label) {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.textContent = label;
  return a;
}

function renderComparison(locale, comparison) {
  const article = document.createElement('article');
  article.className = 'comparison-card';
  const title = document.createElement('h4');
  title.textContent = locale.toUpperCase();
  const terms = document.createElement('p');
  terms.className = 'near-terms';
  terms.textContent = comparison.near_terms.join(' · ');
  const note = document.createElement('p');
  note.textContent = comparison.difference_note;
  article.append(title, terms, note);
  return article;
}

function focusFragment() {
  if (!location.hash) return;
  const target = document.getElementById(location.hash.slice(1));
  if (target) requestAnimationFrame(() => target.focus({ preventScroll: true }));
}

function renderCard(catalog, card, manifest) {
  document.title = `${card.term.original} — Name On My Mind`;
  qs('#card-term').textContent = card.term.original;
  qs('#card-language').textContent = `${card.term.language_name} · ${card.term.ipa}`;
  qs('#poetic-line').textContent = card.front.poetic_line;
  qs('#reflection-question').textContent = card.front.reflection_question;
  qs('#verified-definition').textContent = card.meaning.verified_definition;
  qs('#usage-context').textContent = card.meaning.usage_context;
  qs('#cultural-context').textContent = card.meaning.cultural_context || '';
  qs('#verification-summary').textContent = `검증 상태 ${card.verification.status} · 마지막 검토 ${card.verification.last_reviewed_at}`;

  const illustrationAsset = getCardAssets(catalog, card.card_id).find((asset) => asset.asset_type === 'illustration');
  const illustrationRoot = qs('#card-illustration');
  illustrationRoot.replaceChildren();
  if (illustrationAsset) {
    const img = document.createElement('img');
    img.src = `./${illustrationAsset.path}`;
    img.alt = card.assets.alt_text;
    img.width = 1200;
    img.height = 900;
    illustrationRoot.append(img);
  }

  const compact = qs('#compact-meaning');
  compact.textContent = card.meaning.verified_definition;
  const reveal = qs('#reveal-button');
  reveal.addEventListener('click', () => {
    const willOpen = compact.hidden;
    compact.hidden = !willOpen;
    reveal.setAttribute('aria-expanded', String(willOpen));
    reveal.textContent = willOpen ? '뜻 접기' : '뜻을 살짝 펼쳐보기';
  });

  const canonical = new URL(location.href);
  canonical.search = `?card=${encodeURIComponent(card.card_id)}`;
  canonical.hash = 'meaning';
  qs('#detail-link').href = `${canonical.search}${canonical.hash}`;

  const comparisons = qs('#comparisons');
  comparisons.replaceChildren(...['ko', 'en', 'zh', 'ja'].map((locale) => renderComparison(locale, card.comparisons[locale])));

  const references = qs('#reference-list');
  references.replaceChildren();
  for (const ref of getCardReferences(catalog, card.card_id)) {
    const li = document.createElement('li');
    li.append(safeExternalLink(ref.url, ref.citation_display || ref.title));
    references.append(li);
  }

  const audioAsset = getCardAssets(catalog, card.card_id).find((asset) => asset.asset_type === 'pronunciation_audio');
  const audio = qs('#pronunciation-audio');
  const attribution = qs('#audio-attribution');
  if (audioAsset) {
    audio.src = `./${audioAsset.path}`;
    attribution.textContent = audioAsset.attribution || audioAsset.license_or_rights_basis;
  } else {
    audio.hidden = true;
    attribution.textContent = '검증된 발음 음원을 사용할 수 없습니다.';
  }

  document.documentElement.dataset.cardId = card.card_id;
  document.documentElement.dataset.snapshotVersion = manifest.snapshot_version;
  focusFragment();
}

async function main() {
  const [manifest, cardsData, referencesData, assetsData] = await Promise.all([
    readJson('./data/manifest.json'),
    readJson('./data/cards-index.json'),
    readJson('./data/references.json'),
    readJson('./data/assets.json'),
  ]);
  const catalog = createCatalog({ cards: cardsData.cards, references: referencesData.references, assets: assetsData.assets });
  const requested = new URLSearchParams(location.search).get('card');
  const card = requested ? getCard(catalog, requested) : getDailyCard(catalog, { date: new Date(), seed: manifest.daily_seed });
  if (!card) throw new Error('요청한 검증 카드를 찾을 수 없습니다.');
  renderCard(catalog, card, manifest);

  const api = createReadOnlyAgentApi({ catalog, clock: () => new Date(), dailySeed: manifest.daily_seed });
  globalThis.NameOnMyMind = Object.freeze({
    domain: Object.freeze({ getCard: (id) => getCard(catalog, id), getDailyCard: () => getDailyCard(catalog, { date: new Date(), seed: manifest.daily_seed }) }),
    agent: api,
  });
  registerWebMcpReadOnlyTools({ api });
}

main().catch((error) => {
  console.error(error);
  const app = qs('#app');
  if (app) app.innerHTML = '<section class="error-state" role="alert"><h1>카드를 불러오지 못했습니다</h1><p>검증된 로컬 데이터를 다시 확인해 주세요.</p></section>';
});
