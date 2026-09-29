# NameOnMyMind vocabulary expansion V22

Date: 2026-09-30
Scope: the approved simple `/learn/` surface. Typography, spacing, colors and the three collapsed sections are unchanged from V21.

## Delivered

- Learner vocabulary: 151 → 177; 26 additions with short editorial meanings, original fictional examples and two comparison words each.
- New comparison links from existing words make every addition reachable without adding interface sections.
- Search includes all 177 entries immediately.
- The expanded daily cycle starts on the viewer's local 2026-10-01. The first word is `아늑하다`.
- Previous dates retain their published word. Future selection advances by actual calendar days across month/year/leap-day boundaries.
- The original emotion map, editorial copy, simple meanings and v1/v2 daily pools/registry remain byte-for-byte unchanged; six source hashes are checked.
- The approved five foreign-language cards and research-release boundaries remain unchanged.

## Added expressions

평온·가벼움: 아늑하다, 가뿐하다, 차분하다, 담담하다, 여유롭다, 푸근하다.
기쁨·감동: 황홀하다, 감격하다, 감탄하다, 통쾌하다, 상쾌하다, 흔쾌하다.
관계·친밀감: 살갑다, 살뜰하다, 미덥다, 정답다, 정들다, 끌리다.
어색함·부끄러움: 어색하다, 서먹하다, 머쓱하다, 무안하다, 수줍다, 겸연쩍다.
마음의 아픔: 쓰리다, 아리다.
These are editorial groupings, not a validated emotion taxonomy.

## Source and meaning review

All 26 exact headwords and selected senses were read from the National Institute of Korean Language's Korean Basic Dictionary.
The source snapshot records the official URL, retrieved headword, selected short definition at its original sense number, retrieval timestamp and HTML SHA-256.
For 가뿐하다(4), 푸근하다(2), 황홀하다(2), 끌리다(2), 머쓱하다(2), 쓰리다(3), 아리다(3), the relevant contextual/emotional sense was explicitly selected instead of the first physical sense.
Short meanings and examples are editorial content. Dictionary verification does not establish child age suitability.
During the 60-candidate capture, later public dictionary requests timed out. Remaining requests were cancelled; 34 unverified candidates were excluded rather than promoted. They are recorded only as a deferred research list.
No new images, external services, analytics, diagnosis, scoring or persistent personal-text storage were introduced.

## Executed checks

- Existing tests plus 8 expansion tests: 64 passed, 0 failed.
- Korean/research validators, deterministic vocabulary build, original-source hash preservation and public privacy checks: PASS.
- 177 words × 2 mobile widths (320 and 390px): 354 exact meaning/example/layout checks passed.
- New-word search/open checks: 26 passed, staying on the same learner surface.
- Viewports: 320×740, 390×844, 768×1024 and 1280×900; no horizontal overflow.
- Browser date fixtures: 2026-10-01, 2026-10-31, 2027-01-01 and 2028-02-29: correct daily selection.
- No JavaScript page errors. Typing sent zero network requests and created no browser-storage entries; drafts clear on reload.
- Source-data failure displays a recovery control; input labels and 44px touch targets remain usable.
- CSS extracted from the learning page is byte-identical to approved commit `061b3a4`.

## Reproduction

`npm run build:learning-vocabulary`
`npm run check:g5-research && npm run check:korean-language`
Build and stage the previously authorized public preview, then run `python3 scripts/korean/qa-learning-page.py` with installed Playwright.
Evidence: `checks.log`, `browser-qa.json`, `browser-run.log` and PNG screenshots in this directory.
Source records: `content/korean-expression/evidence/learning-expansion-source-v1.json`.

## Remaining limitation

Copy was model-edited and browser-tested. No child comprehension study or physical iOS/Android test was performed.
