# Open dictionary and world context layer — V23

## Scope

The simple `/learn/` page retains the 177 curated daily cards. A separate search layer contains general Korean dictionary headwords; these are not 31,710 validated emotion cards. Dictionary entries never enter a daily schedule automatically.

The public dictionary is adapted from Korean Wiktionary via Kaikki's documented Korean-edition JSONL dump. The importer retains headwords and distinct definitions, not examples, literary quotations, translations, images or audio. Missing definitions and malformed rows are omitted. A limited inappropriate-language display filter is not a child-suitability guarantee. See `content/dictionary/ATTRIBUTION.md` and each source article for attribution/share-alike and third-party notices.

## Runtime

- Initial page load fetches only the curated learning data and the small world-context file. The general dictionary is lazy-loaded on `사전에서 더 찾기`.
- The compact headword index searches exact, prefix and substring matches. It is not a full-text search across every dictionary definition. The original curated search still supports meanings.
- Detail files are split into 32 SHA-linked shards. Source versions and hashes must match. Normalized definitions retain separate senses and part of speech.
- `최신 사전 조회` makes an anonymous, explicit, exact-headword request to the public Korean Wiktionary MediaWiki API. The typed headword is sent only on button activation; not while typing. Cookies and referrer are omitted.
- Live lookup is bounded, abortable and rate-limit-aware. Failure leaves the packaged dictionary and curated cards available; there is no claim that a new offline session can load unvisited resources without a network.
- Returned HTML is parsed in a detached inert template. Only plain text from the Korean definition section is extracted. External HTML, images, scripts and translations are never inserted into the page.
- Reflective sentences remain in the existing page-local Map only. Dictionary code never reads the sentence input. Spellcheck is disabled on that input; no persistent storage, logging or transmission is added.

## Foreign context companions

`world-contexts-v1.json` contains seven independent, text-only contextual companions in five languages. One is shown only for explicitly mapped Korean expressions. The full G5 records, audio and illustration release states remain untouched. A `PARTIAL_CONTEXT_OVERLAP` mapping is not a dictionary translation-equivalence claim. Source and difference notes are available in the existing source disclosure. Terms can also be found using their original spelling in the local search.

Current texts: saudade, hiraeth, Geborgenheit, Fernweh, Torschlusspanik, 物の哀れ, 舍不得.
All explanatory Korean copy is newly authored paraphrase, not copied native dictionary text. No exclusive-cultural-emotion or absolute-untranslatability claim is made.

## Source refresh

Local: `python3 scripts/dictionary/import-open-dictionary.py --download`.
GitHub: manually dispatch `Refresh dictionary source (review artifact)` with provider `open-wiktionary`. It produces a seven-day review artifact, not an automatic main-branch commit or deployment. Review the import, counts and rights before replacing the published source.
The downloaded raw archive stays in ignored `.tmp/`. Only the normalized licensed dataset is versioned.

## Official NIKL API (credential required)

The repository has no KRDICT API key as of this implementation. `collect-nikl.py` implements XML decoding, sense preservation, strict request budgets, no retries on errors, and redaction of credentials. It has fixture tests but the official keyed API has not been live-tested. Do not describe it as active.

1. Obtain an official Korean Basic Dictionary API key through the NIKL account flow.
2. Store it as repository Actions secret `KRDICT_API_KEY`, never in HTML, committed files, query logs or this chat. `gh secret set KRDICT_API_KEY` offers a private interactive entry route.
3. Dispatch the refresh workflow with provider `nikl`, or run the collector with the environment key. Its output is a review-only candidate artifact with separate meaning numbers. It is not automatically merged into the published dictionary or live browser provider.

There is no paid backend, credential proxy or new cloud account in this implementation. Direct browser requests to the official keyed NIKL API are intentionally absent.

## Validation

Run `npm run check:g5-research && npm run check:korean-language`.
Build/stage the previously authorized preview and run both browser QA scripts:
`python3 scripts/korean/qa-learning-page.py`
`python3 scripts/dictionary/qa-open-dictionary.py`
The second script makes one real anonymous public API request and records success or failure explicitly. Core parsing, malformed inputs, hashes, XSS, cancellation, cookies/referrer, rate limits and missing keys are checked separately.


## V24 후속 상태

이 문서는 V23 구현 시점의 기록이다. 국립국어원 인증과 수집은 이후 성공했으며, 검토된 공식 자료가 우선 검색 출처로 연결되었다. 현재 구조와 적용 범위는 `NIKL_PRIORITY_V24.md`를 참조한다. 브라우저의 실시간 조회는 위키낱말사전으로 유지된다.
