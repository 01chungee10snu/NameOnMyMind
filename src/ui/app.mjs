import { createCatalog, getCard, getCardAssets, getCardReferences } from '../domain/cards.mjs';
import { canonicalCardHref, discoverByTag, getRelatedCards, searchCards } from '../domain/discovery.mjs';
import { getLocalCollection, listFavorites, markViewed, readReflection, resolveDailyCard, saveReflection, toggleFavorite } from '../local/state.mjs';
import { createReadOnlyAgentApi, registerWebMcpReadOnlyTools } from '../agent/webmcp-adapter.mjs';

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];

async function readJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
  return response.json();
}
function safeExternalLink(url, label) {
  const a = document.createElement('a');
  a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = label;
  return a;
}
function cardLink(card, section = 'meaning') {
  const a = document.createElement('a');
  a.href = canonicalCardHref(card.card_id, section);
  a.textContent = card.term.original;
  return a;
}
function renderComparison(locale, comparison) {
  const article = document.createElement('article'); article.className = 'comparison-card';
  const title = document.createElement('h4'); title.textContent = locale.toUpperCase();
  const terms = document.createElement('p'); terms.className = 'near-terms'; terms.textContent = comparison.near_terms.join(' · ');
  const note = document.createElement('p'); note.textContent = comparison.difference_note;
  article.append(title, terms, note); return article;
}
function focusFragment() {
  if (!location.hash) return;
  const target = document.getElementById(location.hash.slice(1));
  if (target) requestAnimationFrame(() => { target.focus({ preventScroll: true }); target.scrollIntoView({ block: 'start' }); });
}
function showSpace(name) {
  for (const panel of qsa('[data-space-panel]')) panel.hidden = panel.dataset.spacePanel !== name;
  for (const button of qsa('[data-space]')) {
    if (button.dataset.space === name) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  }
}
function renderResultList(root, rows, emptyMessage = '조건에 맞는 카드를 찾지 못했습니다.') {
  root.replaceChildren();
  if (!rows.length) { const p = document.createElement('p'); p.textContent = emptyMessage; root.append(p); return; }
  const list = document.createElement('ul'); list.className = 'result-list';
  for (const row of rows) {
    const li = document.createElement('li');
    const link = cardLink(row.card);
    const reason = document.createElement('span'); reason.className = 'fine-print'; reason.textContent = row.rationale ? ` · ${row.rationale}` : '';
    li.append(link, reason); list.append(li);
  }
  root.append(list);
}
function renderCollection(catalog, storage) {
  const collection = getLocalCollection(catalog, storage);
  const favorites = qs('#favorite-list'); favorites.replaceChildren();
  if (!collection.favorites.length) favorites.textContent = '아직 담아 둔 카드가 없습니다.';
  else { const ul = document.createElement('ul'); for (const card of collection.favorites) { const li = document.createElement('li'); li.append(cardLink(card)); ul.append(li); } favorites.append(ul); }
  const viewed = qs('#viewed-list'); viewed.replaceChildren();
  if (!collection.viewed.length) viewed.textContent = '아직 만난 카드가 없습니다.';
  else { const ul = document.createElement('ul'); for (const row of collection.viewed) { const li = document.createElement('li'); li.append(cardLink(row.card)); const time = document.createElement('span'); time.className='fine-print'; time.textContent=` · ${row.viewed_at.slice(0,10)}`; li.append(time); ul.append(li); } viewed.append(ul); }
}
function renderRelations(catalog, card) {
  const root = qs('#relation-list'); root.replaceChildren();
  const rows = getRelatedCards(catalog, card.card_id);
  if (!rows.length) { root.textContent = '아직 검증된 관계 카드가 연결되지 않았습니다.'; return; }
  const ul = document.createElement('ul');
  for (const row of rows) { const li = document.createElement('li'); const label=document.createElement('span'); label.textContent=`${row.label} · `; li.append(label, cardLink(row.card,'relations')); ul.append(li); }
  root.append(ul);
}

function renderCard(catalog, card, manifest, storage) {
  document.title = `${card.term.original} — Name On My Mind`;
  const releaseBanner = qs('#release-banner'); if (releaseBanner) releaseBanner.hidden = manifest.release_mode !== 'REVIEW_ONLY';
  document.documentElement.dataset.releaseMode = manifest.release_mode;
  qs('#card-term').textContent = card.term.original;
  qs('#card-language').textContent = `${card.term.language_name} · ${card.term.ipa}`;
  qs('#poetic-line').textContent = card.front.poetic_line;
  qs('#reflection-question').textContent = card.front.reflection_question;
  qs('#verified-definition').textContent = card.meaning.verified_definition;
  qs('#usage-context').textContent = card.meaning.usage_context;
  qs('#cultural-context').textContent = card.meaning.cultural_context || '';
  qs('#verification-summary').textContent = `검증 상태 ${card.verification.status} · 마지막 검토 ${card.verification.last_reviewed_at}`;

  const illustrationAsset = getCardAssets(catalog, card.card_id).find((asset) => asset.asset_type === 'illustration');
  const illustrationRoot = qs('#card-illustration'); illustrationRoot.replaceChildren();
  if (illustrationAsset) { const img=document.createElement('img'); img.src=`./${illustrationAsset.path}`; img.alt=card.assets.alt_text; img.width=1200; img.height=900; illustrationRoot.append(img); }

  const compact = qs('#compact-meaning'); compact.textContent = card.meaning.verified_definition;
  const reveal = qs('#reveal-button'); reveal.onclick = () => { const willOpen=compact.hidden; compact.hidden=!willOpen; reveal.setAttribute('aria-expanded',String(willOpen)); reveal.textContent=willOpen?'뜻 접기':'뜻을 살짝 펼쳐보기'; };
  qs('#detail-link').href = canonicalCardHref(card.card_id,'meaning');
  qs('#comparisons').replaceChildren(...['ko','en','zh','ja'].map((locale)=>renderComparison(locale,card.comparisons[locale])));
  renderRelations(catalog, card);

  const references=qs('#reference-list'); references.replaceChildren();
  for (const ref of getCardReferences(catalog,card.card_id)) { const li=document.createElement('li'); li.append(safeExternalLink(ref.url,ref.citation_display||ref.title)); references.append(li); }
  const audioAsset=getCardAssets(catalog,card.card_id).find((asset)=>asset.asset_type==='pronunciation_audio');
  const audio=qs('#pronunciation-audio'); const attribution=qs('#audio-attribution');
  if(audioAsset){
    audio.hidden=false; audio.src=`./${audioAsset.path}`; attribution.replaceChildren();
    const label=document.createElement('span'); label.textContent=`${audioAsset.attribution||'발음 음원'} · `; attribution.append(label);
    if(audioAsset.source_url){ attribution.append(safeExternalLink(audioAsset.source_url,'원본 음원')); attribution.append(document.createTextNode(' · ')); }
    const licenseUrl=/CC BY-SA 4\.0/i.test(audioAsset.license_or_rights_basis||'')?'https://creativecommons.org/licenses/by-sa/4.0/':null;
    if(licenseUrl) attribution.append(safeExternalLink(licenseUrl,'CC BY-SA 4.0 라이선스')); else attribution.append(document.createTextNode(audioAsset.license_or_rights_basis||'권리 정보 확인 필요'));
  } else { audio.hidden=true; attribution.textContent='검증된 발음 음원을 사용할 수 없습니다.'; }

  markViewed(storage,card.card_id);
  const favoriteButton=qs('#favorite-button'); const syncFavorite=()=>{ const active=listFavorites(storage).includes(card.card_id); favoriteButton.setAttribute('aria-pressed',String(active)); favoriteButton.textContent=active?'담아 둔 마음':'마음에 담기'; }; syncFavorite();
  favoriteButton.onclick=()=>{ toggleFavorite(storage,card.card_id); syncFavorite(); renderCollection(catalog,storage); };
  const note=qs('#reflection-note'); note.value=readReflection(storage,card.card_id);
  qs('#save-reflection').onclick=()=>{ saveReflection(storage,card.card_id,note.value); qs('#reflection-status').textContent='이 기기에 저장했습니다.'; };
  renderCollection(catalog,storage);
  document.documentElement.dataset.cardId=card.card_id; document.documentElement.dataset.snapshotVersion=manifest.snapshot_version;
  focusFragment();
}

async function main() {
  const [manifest,cardsData,referencesData,assetsData]=await Promise.all([readJson('./data/manifest.json'),readJson('./data/cards-index.json'),readJson('./data/references.json'),readJson('./data/assets.json')]);
  const catalog=createCatalog({cards:cardsData.cards,references:referencesData.references,assets:assetsData.assets});
  const storage=globalThis.localStorage;
  const requested=new URLSearchParams(location.search).get('card');
  const daily=resolveDailyCard(catalog,{storage,date:new Date(),seed:manifest.daily_seed});
  const card=requested?getCard(catalog,requested):daily.card;
  if(!card) throw new Error('요청한 검증 카드를 찾을 수 없습니다.');
  renderCard(catalog,card,manifest,storage);

  qsa('[data-space]').forEach((button)=>button.addEventListener('click',()=>{ showSpace(button.dataset.space); if(button.dataset.space==='collection') renderCollection(catalog,storage); }));
  const tags=[...new Set(catalog.cards.flatMap((x)=>x.semantic_tags))].sort();
  const tagRoot=qs('#guided-tags'); for(const tag of tags){ const button=document.createElement('button'); button.type='button'; button.className='tag-button'; button.textContent=tag; button.addEventListener('click',()=>renderResultList(qs('#search-results'),discoverByTag(catalog,tag))); tagRoot.append(button); }
  qs('#search-form').addEventListener('submit',(event)=>{ event.preventDefault(); renderResultList(qs('#search-results'),searchCards(catalog,qs('#search-input').value)); });

  const dailyResolver=()=>resolveDailyCard(catalog,{storage,date:new Date(),seed:manifest.daily_seed}).card;
  const api=createReadOnlyAgentApi({catalog,clock:()=>new Date(),dailySeed:manifest.daily_seed,dailyResolver,dataSnapshotVersion:manifest.snapshot_version});
  globalThis.NameOnMyMind=Object.freeze({domain:Object.freeze({getCard:(id)=>getCard(catalog,id),getDailyCard:dailyResolver,search:(q)=>searchCards(catalog,q)}),agent:api});
  registerWebMcpReadOnlyTools({api});

  const freshness=qs('#freshness-status');
  const syncFreshness=()=>{ if(freshness) freshness.textContent=`콘텐츠 스냅샷 ${manifest.snapshot_version}${navigator.onLine?'':' · 오프라인 — 마지막 검증본을 표시합니다.'}`; };
  syncFreshness();
  globalThis.addEventListener('online',syncFreshness);
  globalThis.addEventListener('offline',syncFreshness);
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('./service-worker.js').catch(()=>{ if(freshness) freshness.textContent=`콘텐츠 스냅샷 ${manifest.snapshot_version} · 오프라인 기능을 사용할 수 없지만 온라인 읽기는 계속됩니다.`; });
  }
}

main().catch((error)=>{ console.error(error); const app=qs('#main-content'); if(app) app.innerHTML='<section class="error-state" role="alert"><h1>카드를 불러오지 못했습니다</h1><p>검증된 로컬 데이터를 다시 확인해 주세요.</p></section>'; });
