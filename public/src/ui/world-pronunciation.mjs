import { WORLD_PRONUNCIATION_SOURCE, WORLD_PRONUNCIATIONS } from '../domain/world-pronunciation-data.mjs';

const localeOf = value => String(value || '').replaceAll('_', '-').toLowerCase();
const neutralNames = new Set(['Anna', 'Luciana', 'Kyoko', 'Tingting']);
export function selectPronunciationVoice(voices, entry) {
  const allowed = new Set(entry.voice_locales.map(localeOf));
  return Array.from(voices || []).filter(v => v && allowed.has(localeOf(v.lang))).sort((a,b) =>
    Number(b.localService === true) - Number(a.localService === true) ||
    Number(localeOf(b.lang) === localeOf(entry.locale)) - Number(localeOf(a.lang) === localeOf(entry.locale)) ||
    Number(neutralNames.has(b.name)) - Number(neutralNames.has(a.name))
  )[0] || null;
}

export function createPronunciationController({
  speechSynthesis = globalThis.speechSynthesis,
  Utterance = globalThis.SpeechSynthesisUtterance,
  documentObject = globalThis.document,
  windowObject = globalThis,
  Observer = globalThis.MutationObserver,
  setTimeoutFn = globalThis.setTimeout,
  clearTimeoutFn = globalThis.clearTimeout,
  voiceWaitMs = 1800,
  playbackTimeoutMs = 12000,
} = {}) {
  let active = null, lastStatus = null, destroyed = false;
  const statusFor = button => button.closest('.world-context')?.querySelector('.world-pronunciation-status');
  const paintButton = (state, playing) => {
    const label = state.slow ? '천천히' : '듣기';
    state.button.textContent = playing ? '멈춤' : label;
    state.button.setAttribute('aria-label', playing ? `${state.entry.term} 발음 멈추기` : `${state.entry.term} ${state.slow ? '천천히 듣기' : '발음 듣기'}`);
    state.button.setAttribute('aria-pressed', String(playing));
  };
  const message = (state, text) => {
    const node = statusFor(state.button);
    if (node) { node.textContent = text; lastStatus = node; }
  };
  const disarm = state => {
    if (state.timer !== null) clearTimeoutFn(state.timer);
    state.timer = null;
    if (state.listener) speechSynthesis?.removeEventListener?.('voiceschanged', state.listener);
    state.listener = null;
  };
  const finish = (state, text = '', cancel = true) => {
    if (active !== state) return;
    // Clear identity and handlers BEFORE cancel(): engines may synchronously fire onerror.
    active = null;
    disarm(state);
    if (state.utterance) {
      state.utterance.onstart = null;
      state.utterance.onend = null;
      state.utterance.onerror = null;
    }
    paintButton(state, false);
    message(state, text);
    if (cancel && state.utterance) { try { speechSynthesis.cancel(); } catch {} }
  };
  const stop = () => { if (active) finish(active); if (lastStatus) lastStatus.textContent = ''; };
  const fail = (state, text) => finish(state, text);
  const noVoice = state => fail(state, '이 기기에 맞는 언어 음성이 없어요. 한글 읽기 안내를 참고해 주세요.');
  const getVoice = state => selectPronunciationVoice(speechSynthesis.getVoices(), state.entry);
  const speakNow = (state, voice) => {
    if (active !== state || !documentObject.contains(state.button)) return;
    disarm(state);
    try {
      const utterance = new Utterance(state.entry.speech_text);
      utterance.text = state.entry.speech_text;
      utterance.voice = voice;
      utterance.lang = voice.lang.replaceAll('_','-');
      utterance.rate = state.slow ? WORLD_PRONUNCIATION_SOURCE.slow_rate : WORLD_PRONUNCIATION_SOURCE.default_rate;
      utterance.pitch = 1;
      utterance.volume = 1;
      state.utterance = utterance;
      utterance.onstart = () => {
        if (active === state) message(state, state.slow ? '천천히 재생 중이에요.' : '재생 중이에요.');
      };
      utterance.onend = () => finish(state, '', false);
      utterance.onerror = () => fail(state, '음성을 재생하지 못했어요. 소리 설정을 확인하고 다시 눌러 주세요.');
      state.timer = setTimeoutFn(() => fail(state, '음성 응답이 늦어요. 다시 눌러 주세요.'), playbackTimeoutMs);
      speechSynthesis.speak(utterance);
    } catch {
      fail(state, '음성을 재생하지 못했어요. 한글 읽기 안내를 참고해 주세요.');
    }
  };
  const click = button => {
    if (destroyed || !button?.dataset || !documentObject.contains(button) || documentObject.hidden || !button.closest('.world-context')) return;
    const entry = WORLD_PRONUNCIATIONS.get(button.dataset.pronunciationId);
    const mode = button.dataset.pronunciationMode || 'normal';
    if (!entry || !['normal','slow'].includes(mode)) return;
    if (active?.button === button) { stop(); return; }
    stop();
    const state = {button, entry, slow:mode === 'slow', utterance:null, timer:null, listener:null};
    active = state;
    paintButton(state, true);
    message(state, '음성을 준비하고 있어요.');
    if (!speechSynthesis || typeof speechSynthesis.speak !== 'function' || typeof speechSynthesis.getVoices !== 'function' || typeof Utterance !== 'function') {
      fail(state, '이 기기에서는 음성 기능을 지원하지 않아요. 한글 읽기 안내를 참고해 주세요.');
      return;
    }
    try {
      const voice = getVoice(state);
      if (voice) { speakNow(state, voice); return; }
      state.listener = () => {
        if (active !== state) return;
        try { const ready = getVoice(state); if (ready) speakNow(state, ready); }
        catch { noVoice(state); }
      };
      speechSynthesis.addEventListener?.('voiceschanged', state.listener);
      state.timer = setTimeoutFn(() => {
        if (active !== state) return;
        try { const voice = getVoice(state); if (voice) speakNow(state, voice); else noVoice(state); }
        catch { noVoice(state); }
      }, voiceWaitMs);
    } catch { noVoice(state); }
  };
  const onClick = event => {
    const target = event.target?.closest?.('button[data-pronunciation-id]');
    if (target) click(target);
  };
  const onVisibility = () => { if (documentObject.hidden) stop(); };
  const onToggle = event => {
    if (active && event.target?.tagName === 'DETAILS' && !event.target.open && event.target.contains(active.button)) stop();
  };
  const observer = typeof Observer === 'function' && documentObject.body ? new Observer(() => {
    if (active && !documentObject.contains(active.button)) stop();
  }) : null;
  documentObject.addEventListener('click', onClick);
  documentObject.addEventListener('visibilitychange', onVisibility);
  documentObject.addEventListener('toggle', onToggle, true);
  windowObject.addEventListener?.('hashchange', stop);
  windowObject.addEventListener?.('pagehide', stop);
  observer?.observe(documentObject.body, {childList:true, subtree:true});
  return Object.freeze({click, stop, get destroyed() { return destroyed; }, destroy() {
    if (destroyed) return;
    stop(); destroyed = true;
    documentObject.removeEventListener('click', onClick);
    documentObject.removeEventListener('visibilitychange', onVisibility);
    documentObject.removeEventListener('toggle', onToggle, true);
    windowObject.removeEventListener?.('hashchange', stop);
    windowObject.removeEventListener?.('pagehide', stop);
    observer?.disconnect();
  }});
}
const controllers = new WeakMap();
export function mountPronunciationController(documentObject = globalThis.document) {
  let controller = controllers.get(documentObject);
  if (!controller || controller.destroyed) {
    const windowObject = documentObject.defaultView || globalThis;
    controller = createPronunciationController({documentObject, windowObject, speechSynthesis:windowObject.speechSynthesis, Utterance:windowObject.SpeechSynthesisUtterance, Observer:windowObject.MutationObserver});
    controllers.set(documentObject, controller);
  }
  return controller;
}
