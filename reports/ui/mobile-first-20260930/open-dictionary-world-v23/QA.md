# Open dictionary and foreign-context implementation V23

Date: 2026-09-30
Surface: `/learn/`. The curated 177-word catalog and its historical schedules remain unchanged.

## Implemented

- General Korean dictionary: 31,710 unique headwords, 40,518 separate definitions, adapted from the Korean Wiktionary edition of Kaikki's public dump. These counts are not validated emotion-word counts.
- Snapshot search: compact headword index, lazy on explicit action; 32 definition shards, version and SHA-256 validation, source attribution and CC BY-SA notice.
- Real external API: anonymous Korean Wiktionary MediaWiki lookup from the browser, including CORS. Each explicit latest-lookup action requests the provider. No network request on typing.
- Foreign companions: seven text-only contextual expressions across five languages. One appears for explicitly associated Korean words; unrelated cards show none. Original-script local search also finds the companions.
- Contexts: saudade, hiraeth, Geborgenheit, Fernweh, Torschlusspanik, 物の哀れ, 舍不得. Source links and difference notes are in the existing source disclosure.
- NIKL adapter: separate environment-keyed XML collector with bounded requests and redacted failures. No key was available; official keyed collection has NOT been live-tested or activated. Fixture tests are not a claim of live-provider success.
- Manual GitHub source-refresh workflow: review artifact only, no auto-publication or promotion of dictionary entries into daily cards.

## Executed validation (latest source)

- Core repository checks: 52 Node tests passed (`core-checks.log`).
- Korean and new dictionary checks: 20 Node tests plus 5 Python fixture tests passed (`korean-checks.log`). Total: 72 Node + 5 Python, no failures in the documented final sequence.
- Existing 177 words at 320px and 390px: 354 rendered checks passed, plus the existing four viewport/date/privacy/search checks (`browser-qa.json`).
- Seven foreign companions at two mobile widths: 14 checks passed.
- Search for `망설이다` outside the 177-card pool loaded an actual dictionary definition and its source/credit.
- Live anonymous browser API lookup of `설레다`: PASS with the real returned Korean definition (`dictionary-browser-qa.json`).
- Original-script `saudade` search: PASS.
- No external requests while entering either the search text or a reflective sentence. Browser storage remains empty.
- Inert HTML/XSS and language-boundary checks, response limits, cancellation, 429 backoff and failed-live/snapshot fallback: PASS.
- Source data failure retains a visible recovery path. No new images, audio, tracking, diagnosis or scoring was added.

## Validation ordering and incident notes

The existing core tests rebuild `public/`. They must run before staging the research preview and browser QA. An ad hoc all-tests run after staging triggered an existing release-boundary assertion and a subsequent browser attempt found the unstaged page. No assertion was weakened. The documented sequence was rerun: core checks → Korean checks → stage preview → browser QA, all successfully.
A grouped tool command was rejected before execution. It is not counted as an executed or passed check. The subsequent scoped commands and results are the basis of this report.
The early `checks.log` is retained as an initial-run record; `core-checks.log`, `korean-checks.log`, the browser JSONs and `validation-summary.json` are the final local evidence.

## Preserved boundaries

- Base evidence map, base copy, 177 curated records and daily schedules remain unchanged.
- G5 full-card lifecycle states, audio/illustration rights gates and five-card product release remain unchanged. The new contextual explanations are a separate text-only learner feature, not a promotion of HOLD cards.
- Raw dictionary examples, literary quotations, media and translations are not redistributed. Source definitions are labeled separately from the edited learning cards.
- Reflective writing remains page-memory only; dictionary code does not read that input. Spellcheck is disabled on it.

## Limitations

General dictionary contents are not a validated child vocabulary. The partial display filter is not a complete age-suitability review. No physical iOS/Android test or child comprehension study was performed. Network/provider availability can vary; a previously loaded snapshot is not a promise of fully offline operation from a fresh session. NIKL requires a privately configured repository secret and a live collection/review step before it becomes an active source.

See `docs/architecture/OPEN_DICTIONARY_WORLD_V23.md` for data rights, runtime design, source-refresh and secure NIKL setup.
