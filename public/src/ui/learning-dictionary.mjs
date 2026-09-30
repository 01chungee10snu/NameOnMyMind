// Optional dictionary/world context enhancements; no reflection input is read here.
import { createDictionaryClient, normalizeHeadword, matchWorldContext } from '../domain/dictionary.mjs';
const escapeText = (s='') => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const allowedSource = value => {
  try { const u=new URL(value); return u.protocol==='https:' && !u.username && !u.password && ['dicionario.priberam.org','www.wales.com','www.duden.de','kotobank.jp','zdic.net','ko.wiktionary.org','creativecommons.org'].includes(u.hostname); } catch { return false; }
};
export function worldMarkup(world, expression) {
  const row=matchWorldContext(world,expression);
  if(!row)return '';
  return `<section class="world-context" aria-label="다른 언어의 마음말"><h2>다른 언어의 마음말</h2><p class="world-title"><bdi lang="${escapeText(row.lang)}">${escapeText(row.term)}</bdi><span>${escapeText(row.language)}</span></p><p class="world-meaning">${escapeText(row.meaning)}</p></section>`;
}
export function worldSourceMarkup(world, expression) {
  const row=matchWorldContext(world,expression);
  if(!row)return '';
  return `<p class="source-note">${escapeText(row.difference)}</p><p class="source-note">${escapeText(world.cultural_note)}</p>${allowedSource(row.source_url)?`<a class="source-link" href="${escapeText(row.source_url)}" target="_blank" rel="noopener noreferrer">${escapeText(row.source_name)}</a>`:''}`;
}
const messages={
  INVALID_QUERY:'한글 낱말을 40자 이내로 입력해 주세요.',
  RESTRICTED_QUERY:'이 낱말은 여기에서 표시하지 않아요.',
  NOT_FOUND:'이 낱말은 사전에서 찾지 못했어요.',
  NO_DEFINITIONS:'현재 이 항목에는 가져올 수 있는 한국어 뜻이 없어요.',
  RATE_LIMITED:'사전의 요청 한도에 도달했어요. 잠시 뒤 다시 이용해 주세요.',
  SNAPSHOT_MISMATCH:'사전 자료가 갱신되고 있어요. 페이지를 다시 열어 주세요.',
};
export function mountDictionarySearch({host, searchInput, world, baseUrl}) {
  const client=createDictionaryClient(baseUrl);
  host.innerHTML=`<div class="dictionary-actions"><button type="button" id="dictionary-search" class="dictionary-button">사전에서 더 찾기</button><button type="button" id="dictionary-live" class="dictionary-button secondary">최신 사전 조회</button></div>
    <p class="hint dictionary-help">더 찾기는 일반 어휘도 보여줘요. 최신 조회를 누를 때만 입력한 낱말을 위키낱말사전에 보내요.</p>
    <p class="hint" id="dictionary-status" role="status"></p><div id="dictionary-results"></div><div id="dictionary-detail"></div>`;
  const status=host.querySelector('#dictionary-status'),results=host.querySelector('#dictionary-results'),detail=host.querySelector('#dictionary-detail');
  let controller=null,ticket=0;
  const cancel=()=>{ticket++;controller?.abort();controller=null;status.textContent='';results.replaceChildren();detail.replaceChildren();host.removeAttribute('aria-busy')};
  searchInput.addEventListener('input',cancel);
  window.addEventListener('hashchange',cancel);
  function renderEntry(entry, isLive=false) {
    const source=entry.source_url;
    if(!allowedSource(source))throw new Error('Invalid source URL');
    results.replaceChildren();
    detail.innerHTML=`<article class="dictionary-entry"><p class="dictionary-label">${isLive?'현재 사전에서 찾은 말':'사전에서 찾은 말'}</p><h3 tabindex="-1">${escapeText(entry.word)}</h3><ol class="dictionary-senses">${entry.senses.map(s=>`<li>${s.pos?`<span class="dictionary-pos">${escapeText(s.pos)}</span>`:''}${escapeText(s.definition)}</li>`).join('')}</ol>
      ${worldMarkup(world,entry.word)}
      <p class="hint">사전 뜻을 그대로 보여줘요. 어린이용으로 다듬은 설명은 아니에요.</p>
      <p class="dictionary-credit"><a href="${escapeText(source)}" target="_blank" rel="noopener noreferrer">위키낱말사전 원문·기여자</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a></p>
      <p class="dictionary-credit">국립국어원 자료가 포함된 항목은 원문의 저작자·이용 조건도 확인해 주세요. 뜻 추출·정규화, 예문·미디어 제외.</p>
      ${worldSourceMarkup(world,entry.word)}</article>`;
    detail.querySelector('h3').focus({preventScroll:true});
  }
  async function operate(kind, id=null) {
    let query;
    try{query=normalizeHeadword(searchInput.value)}catch(e){status.textContent=messages[e.code];return}
    controller?.abort();controller=new AbortController();const mine=++ticket,signal=controller.signal;
    host.setAttribute('aria-busy','true');status.textContent=kind==='live'?'최신 사전에서 찾고 있어요.':'사전에서 찾고 있어요.';
    detail.replaceChildren();if(kind!=='entry')results.replaceChildren();
    const activeController=controller;
    const timer=setTimeout(()=>activeController.abort(),kind==='live'?8000:18000);
    try {
      if(kind==='entry') {
        const entry=await client.entry(id,signal);if(mine!==ticket)return;renderEntry(entry);status.textContent='';
      } else if(kind==='live') {
        const entry=await client.live(query,signal);if(mine!==ticket)return;renderEntry(entry,true);status.textContent='';
      } else {
        const found=await client.search(query,signal);if(mine!==ticket)return;
        status.textContent=found.total?`${found.total.toLocaleString('ko-KR')}개 중 ${found.rows.length}개를 보여줘요.`:'저장된 사전에는 없어요. 최신 사전 조회로 확인할 수 있어요.';
        for(const [id,word] of found.rows){
          const button=document.createElement('button');button.type='button';button.className='dictionary-result';button.textContent=word;button.addEventListener('click',()=>operate('entry',id));results.append(button);
        }
      }
    } catch(error) {
      if(mine!==ticket)return;
      status.textContent=messages[error.code] || (signal.aborted?'연결이 늦어지고 있어요. 저장된 사전이나 기존 마음말을 이용해 주세요.':'사전에 연결하지 못했어요. 저장된 사전이나 기존 마음말은 계속 이용할 수 있어요.');
    } finally {clearTimeout(timer);if(mine===ticket)host.removeAttribute('aria-busy')}
  }
  host.querySelector('#dictionary-search').addEventListener('click',()=>operate('snapshot'));
  host.querySelector('#dictionary-live').addEventListener('click',()=>operate('live'));
  return {cancel};
}
