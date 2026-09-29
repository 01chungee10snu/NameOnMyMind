# NameOnMyMind Korean Learning V21

Date: 2026-09-29
Scope: `/learn/` and its Korean learning prototype. The foreign-card app and research views remain unchanged.

## What changed

The main view is word → short meaning → original example → two comparison words.
Writing, search and source details are collapsed. Search and comparison links open the selected word in this same view.
All 151 entries have editorial meanings, fictional examples and explicit comparison pairs.
No new images, dependencies, diagnosis, scoring, tracking or persistent sentence storage were added.

## Editorial provenance

`content/korean-expression/learning-copy-v1.json` is the authored source; `simple-meanings-v1.json` is its deterministic public build.
Old display wording remains in the authored source for audit. It is not a claim that the old sense was always correct.
The builder no longer fetches the first dictionary sense. Missing copy, long text, duplicate IDs and invalid comparison pairs fail validation.
`벅차다` and `민망하다` use their emotional/contextual second senses, checked against the official Korean Basic Dictionary on 2026-09-29.
`맥이 빠지다` and `애가 타다` now explain the complete expressions rather than only `맥` and `애`.
Comparison pairs are editorial learning choices, not claims of interchangeable synonyms.
Existing evidence records, school-age flags, frozen learning pools and five-card release boundaries were not changed.

## Executed checks

- Existing G1–G5 and new learning tests: 56 passed, 0 failed.
- Korean language validators, deterministic copy check, research validators and private-leakage check: PASS.
- Browser rendering: 320×740, 390×844, 768×1024 and 1280×900: no horizontal overflow.
- Every one of 151 words at 320px and 390px: 302 checks passed, including exact meanings/examples and two related words.
- Search and browser-back navigation stay on the learning surface.
- Typing: no network requests; browser storage remains empty; drafts survive word switches only in memory and clear on reload.
- Input labels, minimum 44px touch targets, no-result input and visible fetch-failure recovery: PASS.
- Initial legacy test scripts interpreted directories as entrypoint files. They now use explicit `*.test.mjs` globs; the full suite was rerun successfully.

## Evidence and reproduction

`checks.log`, `browser-qa.json` and the three PNG screenshots are in this directory.
Run `npm run build:korean-copy`, `npm run check:g5-research`, and `npm run check:korean-language`.
Build and stage the previously authorized public preview before running `python3 scripts/korean/qa-learning-page.py` (requires installed Python Playwright).
Browser QA uses a temporary loopback-only server and closes it when finished.

## Remaining human check

This is a model-edited copy review and Chromium viewport test, not a child comprehension study or a physical iOS/Android test.
A child should read several unfamiliar meanings and use the words in their own situations before age-level suitability is claimed.
