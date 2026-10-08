# Positive-first public learner V27

Date: 2026-10-08. Public scope: `/NameOnMyMind/` and `/NameOnMyMind/learn/`.

## Behavior

The headline, next-word cycle and two related-word links draw only from 61 editorially selected encouraging/pleasant/relational expressions. This is a display preference, not a validated emotion taxonomy or an assessment of a reader's feelings.
Negative or mixed expressions remain available as secondary learning material. A comparison panel is closed by default. An explicit search or original Korean hash opens the requested term below a positive headline, with its original meaning and example intact. Unknown relationships are labelled '찾아본 말' rather than assigned an invented antonym.
Four lexical antonym pairs are source-backed: 기쁘다–슬프다, 유쾌하다–불쾌하다, 행복하다–불행하다, 편안하다–괴롭다. Twenty-eight additional editorial comparisons are explicitly labelled '대비되는 마음', not lexical antonyms. Three new comparison-only entries do not enter the positive daily cycle.
All seven foreign companions remain searchable by original spelling or WC ID. Two appear as primary companions when relevant; mixed/absence-related companions stay in a secondary disclosure. Their meanings are not rewritten to manufacture positive opposites. IPA, Hangul reading aids, TTS/slow playback and the existing two Han-character guides are retained.
The old vocabulary, maps, schedules, world/pronunciation/hanja sources and historical learner prototype are unchanged. The new display source is `src/ui/positive-learning.html`; the old prototype remains an archival view. Existing legacy card routes are preserved.
The official-first and fallback dictionary searches are unchanged. No credentials were accessed. User-written sentences remain page-memory only; input never triggers speech, network transmission or persistent storage.

## Source review

The four Wiktionary records explicitly list the relevant antonym relation; their canonical pages were re-read and revision IDs matched on 2026-10-08. Relations and links, not full articles, are included. The UI exposes source attribution and CC BY-SA 4.0 under '뜻 출처'.

- 기쁘다: https://ko.wiktionary.org/w/index.php?title=기쁘다&oldid=4214169
- 유쾌하다: https://ko.wiktionary.org/w/index.php?title=유쾌하다&oldid=4188387
- 불행하다: https://ko.wiktionary.org/w/index.php?title=불행하다&oldid=4184970
- 편안하다: https://ko.wiktionary.org/w/index.php?title=편안하다&oldid=4381623

The 28 contextual pairs are authored comparisons of existing meanings, with per-entry provenance in `positive-focus-v1.json`. A word without a substantiated antonym is not silently promoted to one.

## Repair and review

Recovered the earlier unfinished V27 draft instead of discarding it. A project-local ignored backup preserves its incoming state. Copilot repaired the scoped UI; supervisor review fixed primary-source disclosure clutter, missing relation attribution, exact-query source validation and source-preserving tests. In particular, the legitimate `searchKeywordTo` parameter is not an API credential, and world data is an object with `entries`, not an array.
All default comparisons stay closed. Return-to-today, next-positive navigation and repeated same-hash searches are tested. Source hashes protect the original vocabulary and world data; malformed policy data fails visibly. Failure to load the optional world file no longer prevents Korean reading.

## Executed validation

143 code tests passed (135 Node + 8 Python).
360 original/comparison routes tested across anonymous WebKit/iPhone 13 and Chromium/Pixel 7 profiles; every main heading and related link stayed inside the positive set.
14 foreign routes retained exact requested terms, IPA, two speech controls, and existing Han-character guidance where applicable.
Both public paths loaded directly. Default disclosure state, source links, return/next controls, repeat searches, official dictionary results and 320px width passed.
Typing/reflection produced zero app requests and zero speech requests; no browser cookies or persistent entries were introduced.
Actual desktop speech start/end events were observed for Geborgenheit (de-DE) and もののあわれ (ja-JP) on the new public-style page, without replacing the native synthesis engine.

## Reproduction and limits

Run `npm run check:g5-research`, `npm run check:korean-language`, and `npm run test:mobile-web` before authorized build, research staging and mobile staging. Then run `scripts/korean/qa-positive-learning.py` using Python with Playwright installed. `NOMM_PUBLIC_QA_URL` can point to the deployed site and `NOMM_QA_OUT` can isolate deployment evidence.

These are browser device profiles and desktop speech-engine events, not physical-phone testing or a native-speaker pronunciation assessment. Child comprehension is not claimed. Publication is verified separately from this pre-publication QA record.
