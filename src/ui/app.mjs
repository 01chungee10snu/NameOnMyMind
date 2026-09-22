import { createCatalog, getCard, getCardAssets, getCardReferences } from '../domain/cards.mjs';
import { canonicalCardHref, discoverByTag, getRelatedCards, searchCards } from '../domain/discovery.mjs';
import { getLocalCollection, listFavorites, markViewed, readReflection, resolveDailyCard, saveReflection, toggleFavorite } from '../local/state.mjs';
import { createReadOnlyAgentApi, registerWebMcpReadOnlyTools } from '../agent/webmcp-adapter.mjs';

const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];
const researchDiscoveryData = { preview: null, korean: null };

async function readJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
  return response.json();
}
async function readJsonOptional(url) {
  try { return await readJson(url); } catch { return null; }
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
function illustrationFor(catalog, card) {
  return getCardAssets(catalog, card.card_id).find((asset) => asset.asset_type === 'illustration') || null;
}
function renderCardTile(catalog, card, supportingText = '') {
  const link = document.createElement('a');
  link.className = 'discovery-card';
  link.href = canonicalCardHref(card.card_id, 'meaning');
  const asset = illustrationFor(catalog, card);
  if (asset) {
    const media = document.createElement('span'); media.className = 'discovery-card-media';
    const img = document.createElement('img'); img.src = `./${asset.path}`; img.alt = ''; img.loading = 'lazy'; img.decoding = 'async';
    media.append(img); link.append(media);
  }
  const copy = document.createElement('span'); copy.className = 'discovery-card-copy';
  const term = document.createElement('strong'); term.className = 'discovery-card-term'; term.textContent = card.term.original;
  const meta = document.createElement('span'); meta.className = 'discovery-card-meta'; meta.textContent = `${card.term.language_name} · ${card.term.ipa}`;
  const line = document.createElement('span'); line.className = 'discovery-card-line'; line.textContent = supportingText || card.front.poetic_line;
  copy.append(term, meta, line);
  const arrow = document.createElement('span'); arrow.className = 'discovery-card-arrow'; arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '›';
  link.append(copy, arrow);
  return link;
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
function prefersReducedMotion() {
  return globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
function showSpace(name, { animate = false } = {}) {
  let activePanel = null;
  for (const panel of qsa('[data-space-panel]')) {
    const selected = panel.dataset.spacePanel === name;
    panel.hidden = !selected;
    if (selected) activePanel = panel;
  }
  for (const button of qsa('[data-space]')) {
    if (button.dataset.space === name) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  }
  document.documentElement.dataset.activeSpace = name;
  if (activePanel && animate && !prefersReducedMotion()) {
    activePanel.classList.remove('space-entering');
    void activePanel.offsetWidth;
    activePanel.classList.add('space-entering');
    activePanel.addEventListener('animationend', () => activePanel.classList.remove('space-entering'), { once: true });
  }
}
function renderResultList(catalog, root, rows, emptyMessage = '조건에 맞는 카드를 찾지 못했습니다.') {
  root.replaceChildren();
  if (!rows.length) { const p = document.createElement('p'); p.className = 'empty-state'; p.textContent = emptyMessage; root.append(p); return; }
  const list = document.createElement('div'); list.className = 'card-tile-list';
  for (const row of rows) list.append(renderCardTile(catalog, row.card, row.rationale || row.card.front.poetic_line));
  root.append(list);
}
function worldResearchHref(cardId) {
  return `./prototypes/g5-research-preview-20260918/?card=${encodeURIComponent(cardId)}`;
}
function koreanResearchHref(familyId, expression = '', options = {}) {
  const params = new URLSearchParams({ family: familyId });
  if (expression) params.set('term', expression);
  if (options.school) params.set('school', '1');
  return `./prototypes/korean-emotion-map-20260919/?${params.toString()}`;
}
function schoolAgeResearchLabel(term) {
  const value = term.learning_profile?.school_age_evidence;
  if (value === 'GRADE_3_6_SUPPORTED') return '3–6학년 연구';
  if (value === 'GRADE_3_6_RELATED_FORM') return '3–6학년 관련형';
  return '';
}
function koreanDepthLabel(term) {
  return ({ 1: '기본', 2: '확장', 3: '섬세' })[term.level] || `Level ${term.level}`;
}
function koreanDailyVerifiedTerm(data, now = new Date()) {
  const verified = data.terms
    .filter((term) => term.status === 'SOURCE_VERIFIED')
    .sort((a, b) => a.id.localeCompare(b.id, 'en'));
  if (!verified.length) return null;
  const localDayKey = now.getFullYear() * 372 + (now.getMonth() + 1) * 31 + now.getDate();
  return verified[localDayKey % verified.length];
}
function koreanDailyContrastSet(data, dailyTerm, now = new Date()) {
  const verifiedSets = data.contrast_sets.filter((set) => set.status === 'SOURCE_VERIFIED');
  if (!verifiedSets.length) return null;
  const direct = dailyTerm && verifiedSets.find((set) => set.terms.includes(dailyTerm.expression));
  if (direct) return direct;
  const ordered = [...verifiedSets].sort((a, b) => a.id.localeCompare(b.id, 'en'));
  const localDayKey = now.getFullYear() * 372 + (now.getMonth() + 1) * 31 + now.getDate();
  return ordered[localDayKey % ordered.length];
}
function renderResearchWorldCard(card, previewBase) {
  const link = document.createElement('a');
  link.className = 'research-preview-card';
  link.href = worldResearchHref(card.card_id);
  link.setAttribute('aria-label', `${card.term}, ${card.language} 연구 미리보기`);

  const media = document.createElement('span');
  media.className = 'research-preview-media';
  const img = document.createElement('img');
  img.src = new URL(card.image, previewBase).href;
  img.alt = '';
  img.loading = 'lazy';
  img.decoding = 'async';
  media.append(img);

  const copy = document.createElement('span');
  copy.className = 'research-preview-copy';
  const badge = document.createElement('span');
  badge.className = 'research-mini-badge';
  badge.textContent = 'RESEARCH';
  const term = document.createElement('strong');
  term.className = 'research-preview-term';
  term.textContent = card.term;
  const language = document.createElement('span');
  language.className = 'research-preview-language';
  language.textContent = card.language;
  const rendering = document.createElement('span');
  rendering.className = 'research-preview-rendering';
  rendering.textContent = card.korean_rendering;
  copy.append(badge, term, language, rendering);
  link.append(media, copy);
  return link;
}

function renderKoreanResearchSummary(data) {
  const root = qs('#korean-research-summary');
  const verified = data.terms.filter((term) => term.status === 'SOURCE_VERIFIED');
  const schoolAgeLinked = data.terms.filter((term) => schoolAgeResearchLabel(term));
  root.replaceChildren();

  const stats = document.createElement('p');
  stats.className = 'korean-map-stats';
  const level1 = data.terms.filter((term) => term.level === 1);
  const level2 = data.terms.filter((term) => term.level === 2);
  const level3 = data.terms.filter((term) => term.level === 3);
  const level1Verified = level1.filter((term) => term.status === 'SOURCE_VERIFIED').length;
  const level2Verified = level2.filter((term) => term.status === 'SOURCE_VERIFIED').length;
  const level3Verified = level3.filter((term) => term.status === 'SOURCE_VERIFIED').length;
  stats.textContent = `${data.families.length}개 감정 영역 · ${data.terms.length}개 표현 · 근거 연결 ${verified.length}개 · 기본 ${level1Verified}/${level1.length} · 확장 ${level2Verified}/${level2.length} · 섬세 ${level3Verified}/${level3.length} · 3–6학년 연구 연결 ${schoolAgeLinked.length}개 · 비교 ${data.contrast_sets.length}세트`;
  root.append(stats);

  const familyMap = new Map(data.families.map((family) => [family.id, family]));
  const daily = koreanDailyVerifiedTerm(data);
  if (daily) {
    const family = familyMap.get(daily.family_id);
    const dailyLink = document.createElement('a');
    dailyLink.className = 'korean-daily-card';
    dailyLink.href = koreanResearchHref(daily.family_id, daily.expression);
    dailyLink.setAttribute('aria-label', `오늘의 한국어 마음말 ${daily.expression} 자세히 보기`);

    const kicker = document.createElement('span');
    kicker.className = 'korean-daily-kicker';
    kicker.textContent = '오늘의 한국어 마음말';

    const term = document.createElement('strong');
    term.className = 'korean-daily-term';
    term.textContent = daily.expression;

    const meta = document.createElement('span');
    meta.className = 'korean-daily-meta';
    const schoolAge = schoolAgeResearchLabel(daily);
    meta.textContent = `${family?.label || ''} · ${koreanDepthLabel(daily)}${schoolAge ? ` · ${schoolAge}` : ' · 어휘 근거 연결'}`;

    const prompt = document.createElement('span');
    prompt.className = 'korean-daily-prompt';
    prompt.textContent = schoolAge
      ? '뜻의 결을 읽고, 오늘 이 말이 어울린 순간을 한 문장으로 표현해 보세요.'
      : '공식 어휘 근거가 확인된 표현입니다. 오늘 이 말이 어울린 순간을 한 문장으로 표현해 보세요.';

    const arrow = document.createElement('span');
    arrow.className = 'korean-daily-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '›';

    dailyLink.append(kicker, term, meta, prompt, arrow);
    root.append(dailyLink);
  }

  const dailyContrast = koreanDailyContrastSet(data, daily);
  if (dailyContrast) {
    const practice = document.createElement('section');
    practice.className = 'korean-daily-practice';
    practice.setAttribute('aria-labelledby', 'korean-daily-practice-title');

    const kicker = document.createElement('span');
    kicker.className = 'korean-daily-practice-kicker';
    kicker.textContent = '오늘의 비슷한 말 연습';

    const title = document.createElement('strong');
    title.className = 'korean-daily-practice-title';
    title.id = 'korean-daily-practice-title';
    title.textContent = dailyContrast.title;

    const question = document.createElement('p');
    question.className = 'korean-daily-practice-question';
    question.textContent = dailyContrast.reflection_prompt;

    const choices = document.createElement('div');
    choices.className = 'korean-daily-practice-choices';
    for (const expression of dailyContrast.terms) {
      const termData = data.terms.find((term) => term.expression === expression);
      if (!termData) continue;
      const link = document.createElement('a');
      link.href = koreanResearchHref(termData.family_id, termData.expression);
      link.textContent = expression;
      link.setAttribute('aria-label', `${expression} 표현의 뜻과 비슷한 말 차이 보기`);
      choices.append(link);
    }

    const note = document.createElement('span');
    note.className = 'korean-daily-practice-note';
    note.textContent = '정답을 맞히는 문제가 아닙니다. 지금 상황에 가장 가까운 말을 골라 차이를 읽어 보세요.';

    const compare = document.createElement('a');
    compare.className = 'korean-daily-practice-more';
    compare.href = `./prototypes/korean-emotion-map-20260919/?guide=1&compare=${encodeURIComponent(dailyContrast.id)}`;
    compare.textContent = '네 단어 차이 자세히 보기';

    practice.append(kicker, title, question, choices, note, compare);
    root.append(practice);
  }

  const guideLink = document.createElement('a');
  guideLink.className = 'korean-guide-link';
  guideLink.href = './prototypes/korean-emotion-map-20260919/?guide=1';
  const guideTitle = document.createElement('strong');
  guideTitle.textContent = '상황에서 마음말 찾기';
  const guideCopy = document.createElement('span');
  guideCopy.textContent = '16개 검증 비교세트로 비슷한 표현의 차이를 직접 살펴보세요.';
  const guideArrow = document.createElement('span');
  guideArrow.className = 'korean-guide-arrow';
  guideArrow.setAttribute('aria-hidden', 'true');
  guideArrow.textContent = '›';
  guideLink.append(guideTitle, guideCopy, guideArrow);
  root.append(guideLink);

  const schoolLink = document.createElement('a');
  schoolLink.className = 'korean-guide-link';
  schoolLink.href = koreanResearchHref('KF01', '', { school: true });
  const schoolTitle = document.createElement('strong');
  schoolTitle.textContent = '3–6학년 연구 연결 표현 보기';
  const schoolCopy = document.createElement('span');
  schoolCopy.textContent = '해당 연구에 직접 또는 관련형으로 포함된 표현만 좁혀 봅니다. 1–2학년 적합성 판정은 아닙니다.';
  const schoolArrow = document.createElement('span');
  schoolArrow.className = 'korean-guide-arrow';
  schoolArrow.setAttribute('aria-hidden', 'true');
  schoolArrow.textContent = '›';
  schoolLink.append(schoolTitle, schoolCopy, schoolArrow);
  root.append(schoolLink);

  const sample = document.createElement('div');
  sample.className = 'verified-sample-row';
  for (const term of verified.slice(0, 8)) {
    const chip = document.createElement('a');
    chip.href = koreanResearchHref(term.family_id, term.expression);
    chip.textContent = term.expression;
    chip.setAttribute('aria-label', `${term.expression} 표현을 한국어 마음 지도에서 보기`);
    sample.append(chip);
  }
  root.append(sample);

  const familyStrip = qs('#korean-family-strip');
  familyStrip.replaceChildren();
  for (const family of data.families) {
    const chip = document.createElement('a');
    chip.href = koreanResearchHref(family.id);
    chip.className = 'research-family-chip';
    chip.textContent = family.label;
    chip.setAttribute('aria-label', `${family.label} 영역을 한국어 마음 지도에서 보기`);
    familyStrip.append(chip);
  }
}

function createResearchSearchItem({ href, term, meta, description }) {
  const link = document.createElement('a');
  link.className = 'research-search-item';
  link.href = href;
  const strong = document.createElement('strong');
  strong.textContent = term;
  const span = document.createElement('span');
  span.textContent = meta;
  const small = document.createElement('small');
  small.textContent = description;
  link.append(strong, span, small);
  return link;
}

function renderResearchSearch(query) {
  const root = qs('#research-search-results');
  root.replaceChildren();
  const q = query.trim().toLocaleLowerCase();
  if (!q) return 0;

  const section = document.createElement('section');
  section.className = 'research-search-section';
  const heading = document.createElement('div');
  heading.className = 'research-search-heading';
  const title = document.createElement('h2');
  title.textContent = '연구 중인 마음말에서도 찾았어요';
  const badge = document.createElement('span');
  badge.className = 'research-status-pill';
  badge.textContent = '정식 카드 아님';
  heading.append(title, badge);
  section.append(heading);

  let matchCount = 0;
  const preview = researchDiscoveryData.preview;
  if (preview?.cards?.length) {
    const matches = preview.cards.filter((card) =>
      [card.term, card.language, card.korean_rendering].some((value) => String(value || '').toLocaleLowerCase().includes(q))
    ).slice(0, 6);
    if (matches.length) {
      const label = document.createElement('p');
      label.className = 'research-search-label';
      label.textContent = '다른 언어';
      const list = document.createElement('div');
      list.className = 'research-search-list';
      for (const card of matches) {
        list.append(createResearchSearchItem({
          href: worldResearchHref(card.card_id),
          term: card.term,
          meta: card.language,
          description: card.korean_rendering,
        }));
      }
      section.append(label, list);
      matchCount += matches.length;
    }
  }

  const korean = researchDiscoveryData.korean;
  if (korean?.terms?.length) {
    const familyMap = new Map(korean.families.map((family) => [family.id, family]));
    const matches = korean.terms.filter((term) => {
      const family = familyMap.get(term.family_id);
      return [term.expression, family?.label, family?.description, term.note].some((value) => String(value || '').toLocaleLowerCase().includes(q));
    }).slice(0, 8);
    if (matches.length) {
      const label = document.createElement('p');
      label.className = 'research-search-label';
      label.textContent = '한국어 마음 지도';
      const list = document.createElement('div');
      list.className = 'research-search-list';
      for (const term of matches) {
        const family = familyMap.get(term.family_id);
        const status = term.status === 'SOURCE_VERIFIED' ? '근거 연결' : '탐색 중';
        const schoolAge = schoolAgeResearchLabel(term);
        list.append(createResearchSearchItem({
          href: koreanResearchHref(term.family_id, term.expression),
          term: term.expression,
          meta: `${family?.label || ''} · ${status}${schoolAge ? ` · ${schoolAge}` : ''}`,
          description: family?.description || '',
        }));
      }
      section.append(label, list);
      matchCount += matches.length;
    }
  }

  if (matchCount) root.append(section);
  return matchCount;
}

function syncDiscoverQuery(query) {
  const url = new URL(location.href);
  url.searchParams.set('space', 'discover');
  if (query.trim()) url.searchParams.set('q', query.trim()); else url.searchParams.delete('q');
  history.replaceState(null, '', url);
}

async function hydrateResearchDiscovery() {
  const previewManifestUrl = './prototypes/g5-research-preview-20260918/manifest.json';
  const koreanMapUrl = './content/korean-expression/emotion-map-v1.json';
  const [preview, korean] = await Promise.all([
    readJsonOptional(previewManifestUrl),
    readJsonOptional(koreanMapUrl),
  ]);

  researchDiscoveryData.preview = preview;
  researchDiscoveryData.korean = korean;

  let hasResearch = false;
  if (preview?.status === 'RESEARCH_PREVIEW_ONLY' && Array.isArray(preview.cards) && preview.cards.length) {
    const lane = qs('#world-research-lane');
    const root = qs('#world-research-cards');
    const previewBase = new URL('./prototypes/g5-research-preview-20260918/', document.baseURI);
    root.replaceChildren(...preview.cards.map((card) => renderResearchWorldCard(card, previewBase)));
    lane.hidden = false;
    hasResearch = true;
  }

  if (korean?.track_id === 'KOREAN_EMOTION_ARTICULATION' && Array.isArray(korean.families) && Array.isArray(korean.terms)) {
    renderKoreanResearchSummary(korean);
    qs('#korean-research-lane').hidden = false;
    hasResearch = true;
  }

  qs('#research-discovery').hidden = !hasResearch;
}

function renderCollection(catalog, storage) {
  const collection = getLocalCollection(catalog, storage);
  const favorites = qs('#favorite-list'); favorites.replaceChildren();
  if (!collection.favorites.length) favorites.innerHTML = '<p class="empty-state">아직 담아 둔 카드가 없습니다.</p>';
  else { const list = document.createElement('div'); list.className = 'card-tile-list'; for (const card of collection.favorites) list.append(renderCardTile(catalog, card, '마음에 담아 둔 단어')); favorites.append(list); }
  const viewed = qs('#viewed-list'); viewed.replaceChildren();
  if (!collection.viewed.length) viewed.innerHTML = '<p class="empty-state">아직 만난 카드가 없습니다.</p>';
  else { const list = document.createElement('div'); list.className = 'card-tile-list'; for (const row of collection.viewed) list.append(renderCardTile(catalog, row.card, `${row.viewed_at.slice(0,10)}에 만난 단어`)); viewed.append(list); }
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
  qs('#journal-term').textContent = card.term.original;
  qs('#journal-line').textContent = card.front.poetic_line;
  qs('#verified-definition').textContent = card.meaning.verified_definition;
  qs('#usage-context').textContent = card.meaning.usage_context;
  qs('#cultural-context').textContent = card.meaning.cultural_context || '';
  qs('#verification-summary').textContent = `검증 상태 ${card.verification.status} · 마지막 검토 ${card.verification.last_reviewed_at}`;

  const illustrationAsset = getCardAssets(catalog, card.card_id).find((asset) => asset.asset_type === 'illustration');
  const illustrationRoot = qs('#card-illustration'); illustrationRoot.replaceChildren();
  const backgroundDescription = qs('#card-background-description');
  backgroundDescription.textContent = card.assets.alt_text;
  if (illustrationAsset) {
    const illustrationUrl = `./${illustrationAsset.path}`;
    const ambientIllustrationUrl = new URL(illustrationUrl, document.baseURI).href;
    const img=document.createElement('img');
    img.className='card-background-image';
    img.src=illustrationUrl;
    img.alt='';
    img.setAttribute('aria-hidden','true');
    img.setAttribute('role','presentation');
    img.width=1200;
    img.height=896;
    img.decoding='async';
    img.fetchPriority='high';
    illustrationRoot.append(img);
    document.documentElement.style.setProperty('--card-art-image', `url("${ambientIllustrationUrl}")`);
  } else {
    backgroundDescription.textContent = '';
    document.documentElement.style.removeProperty('--card-art-image');
  }

  const compact = qs('#compact-meaning'); compact.textContent = card.meaning.verified_definition;
  const reveal = qs('#reveal-button'); reveal.onclick = () => { const willOpen=compact.hidden; compact.hidden=!willOpen; reveal.setAttribute('aria-expanded',String(willOpen)); reveal.textContent=willOpen?'뜻 접기':'뜻을 살짝 펼쳐보기'; };
  qs('#detail-link').href = canonicalCardHref(card.card_id,'meaning');
  qs('#comparisons').replaceChildren(...['ko','en','zh','ja'].map((locale)=>renderComparison(locale,card.comparisons[locale])));
  renderRelations(catalog, card);

  const references=qs('#reference-list'); references.replaceChildren();
  for (const ref of getCardReferences(catalog,card.card_id)) { const li=document.createElement('li'); li.append(safeExternalLink(ref.url,ref.citation_display||ref.title)); references.append(li); }
  const audioAsset=getCardAssets(catalog,card.card_id).find((asset)=>asset.asset_type==='pronunciation_audio');
  const audio=qs('#pronunciation-audio'); const attribution=qs('#audio-attribution'); const pronunciationButton=qs('#pronunciation-button');
  if(audioAsset){
    audio.hidden=false; audio.src=`./${audioAsset.path}`; attribution.replaceChildren();
    pronunciationButton.hidden=false;
    pronunciationButton.setAttribute('aria-label','발음 듣기');
    pronunciationButton.onclick=()=>{
      audio.currentTime=0;
      pronunciationButton.dataset.playing='true';
      pronunciationButton.setAttribute('aria-label','발음 재생 중');
      audio.play().catch(()=>{ pronunciationButton.dataset.playing='false'; pronunciationButton.setAttribute('aria-label','발음 듣기'); });
    };
    audio.addEventListener('ended',()=>{ pronunciationButton.dataset.playing='false'; pronunciationButton.setAttribute('aria-label','발음 듣기'); });
    const label=document.createElement('span'); label.textContent=`${audioAsset.attribution||'발음 음원'} · `; attribution.append(label);
    if(audioAsset.source_url){ attribution.append(safeExternalLink(audioAsset.source_url,'원본 음원')); attribution.append(document.createTextNode(' · ')); }
    const rights=audioAsset.license_or_rights_basis||'';
    const licenseOptions=[
      [/CC BY-SA 4\.0/i,'https://creativecommons.org/licenses/by-sa/4.0/','CC BY-SA 4.0 라이선스'],
      [/CC BY-SA 3\.0/i,'https://creativecommons.org/licenses/by-sa/3.0/','CC BY-SA 3.0 라이선스'],
      [/CC BY-SA 2\.5/i,'https://creativecommons.org/licenses/by-sa/2.5/','CC BY-SA 2.5 라이선스'],
      [/CC0 1\.0/i,'https://creativecommons.org/publicdomain/zero/1.0/','CC0 1.0 권리 정보'],
    ];
    const license=licenseOptions.find(([pattern])=>pattern.test(rights));
    if(license) attribution.append(safeExternalLink(license[1],license[2])); else attribution.append(document.createTextNode(rights||'권리 정보 확인 필요'));
  } else { audio.hidden=true; pronunciationButton.hidden=true; attribution.textContent='검증된 발음 음원을 사용할 수 없습니다.'; }

  markViewed(storage,card.card_id);
  const favoriteButton=qs('#favorite-button'); const favoriteIcon=qs('#favorite-icon');
  const syncFavorite=()=>{
    const active=listFavorites(storage).includes(card.card_id);
    favoriteButton.setAttribute('aria-pressed',String(active));
    favoriteButton.setAttribute('aria-label',active?'마음에서 빼기':'마음에 담기');
    favoriteIcon.textContent=active?'♥':'♡';
  }; syncFavorite();
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
  const requestedSpace=new URLSearchParams(location.search).get('space');
  const requestedQuery=new URLSearchParams(location.search).get('q') || '';
  const daily=resolveDailyCard(catalog,{storage,date:new Date(),seed:manifest.daily_seed});
  const card=requested?getCard(catalog,requested):daily.card;
  if(!card) throw new Error('요청한 검증 카드를 찾을 수 없습니다.');
  renderCard(catalog,card,manifest,storage);
  if(requestedQuery) showSpace('discover');
  else if(['today','discover','journal','collection'].includes(requestedSpace)) showSpace(requestedSpace);
  else showSpace('today');

  qsa('[data-space]').forEach((button)=>button.addEventListener('click',()=>{
    const targetSpace = button.dataset.space;
    showSpace(targetSpace, { animate: true });
    if(targetSpace==='collection') renderCollection(catalog,storage);
    globalThis.scrollTo({top:0,behavior:'auto'});
  }));
  qs('#journal-jump').addEventListener('click',()=>{
    showSpace('journal', { animate: true });
    globalThis.scrollTo({top:0,behavior:'auto'});
    requestAnimationFrame(()=>qs('#reflection-note').focus());
  });
  const tags=[...new Set(catalog.cards.flatMap((x)=>x.semantic_tags))].sort();
  const tagRoot=qs('#guided-tags'); for(const tag of tags){ const button=document.createElement('button'); button.type='button'; button.className='tag-button'; button.textContent=tag; button.addEventListener('click',()=>{ renderResultList(catalog,qs('#search-results'),discoverByTag(catalog,tag)); qs('#research-search-results').replaceChildren(); syncDiscoverQuery(''); }); tagRoot.append(button); }
  await hydrateResearchDiscovery();
  const searchInput=qs('#search-input');
  const runSearch=(query)=>{
    const publicRows=searchCards(catalog,query);
    const researchMatches=renderResearchSearch(query);
    renderResultList(
      catalog,
      qs('#search-results'),
      publicRows,
      researchMatches ? '정식 카드에서는 찾지 못했습니다. 아래 연구 중인 마음말에서 관련 표현을 찾았습니다.' : '조건에 맞는 카드를 찾지 못했습니다.'
    );
    syncDiscoverQuery(query);
  };
  qs('#search-form').addEventListener('submit',(event)=>{ event.preventDefault(); runSearch(searchInput.value); });
  if(requestedQuery){ searchInput.value=requestedQuery; runSearch(requestedQuery); }

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
