# Mobile public web + Hanja labels V26

Date: 2026-10-08

## Delivered scope

- The public root `/NameOnMyMind/` and `/NameOnMyMind/learn/` directly render the approved simple learner, with no sign-in, app install, iframe or prototype redirect.
- Normal `#KE...` links work at either address. Legacy approved `?card=C0001`–`C0005` and known `?space=...` links route to same-origin `cards.html`. The original prototype URL remains valid.
- The original learner source, context meanings, daily schedules, pronunciation data and reviewed official dictionary are unchanged. Staging rebases relative paths at build time and adds only metadata/resource links and a fixed-target legacy router.
- WC06 `物の哀れ`: separate Korean Hanja labels `物 물건 물 · 哀 슬플 애` below its meaning.
- WC07 `舍不得`: `舍(捨) 버릴 사 · 不 아닐 불/부 · 得 얻을 득`, plus the word-specific simplified/traditional note. This is not a general replacement of all instances of 舍 by 捨.
- Kana are not classified as Han characters. Latin words have no empty Hanja panel. Hangul-only Korean etymologies are not guessed. This release covers the two existing foreign companions containing Han characters, not all Sino-Korean vocabulary.
- Hanja labels are distinct from native-language IPA/readings and never enter TTS text. Character-source links and CC BY-SA attribution appear in the existing source disclosure.

## Executed verification

- 116 Node tests and 8 Python fixture tests passed; zero failures in the final run.
- Anonymous WebKit/iPhone 13 profile and Chromium/Pixel 7 profile: root and learn routes 200, direct rendering, no login/cookies, no horizontal overflow, native zoom not disabled.
- All seven world companions rendered in each engine (14 checks), including both Hanja blocks in correct order. 320px compact viewport checked.
- Hanja is also shown in dynamically loaded official-dictionary results; correct official priority remains.
- Reflection typing caused zero requests and no browser storage. Unknown redirect parameters do not redirect outside the site. Existing card/prototype links passed.
- Native desktop speech regression: 6 words produced start/end events; Welsh voice absent and correctly rejected rather than read in English. Slow speech and dynamic dictionary speech passed. No assertion of audible/native-speaker review.
- New CLI --check tests actually execute staging in an isolated temporary tree: missing authorization/prerequisites fail; second staging is identical; modified output fails without overwriting it. A realpath-sensitive main-guard defect was found and corrected during independent testing.
- Earlier mobile test counted browser cancellations during the legacy redirect as failures. Router placement was moved before module parsing; the final mobile run recorded zero cancelled or failed requests.

## Evidence

`checks.log`, `mobile-browser-qa.json`, `browser-run.log`, screenshots and `tts-regression/` in this directory. Public production verification is performed after deployment and is not inferred from local results.

## Reproduction

Run `npm run check:g5-research`, `npm run check:korean-language`, and `npm run test:mobile-web`.
Build with the existing explicit public authorization; stage the authorized research preview; then `NAMEONMYMIND_MOBILE_WEB_PUBLISH_AUTHORIZED=1 npm run stage:mobile-web`.
Check with `NAMEONMYMIND_MOBILE_WEB_PUBLISH_AUTHORIZED=1 node scripts/stage-mobile-web.mjs --check`.
Run `scripts/korean/qa-mobile-web.py` using Python with Playwright and WebKit/Chromium installed. `NOMM_PUBLIC_QA_URL` and `NOMM_QA_OUT` select production and a separate evidence directory.

## Limits

These are real browser engines with mobile profiles, not physical iOS/Android devices. Network access is required. TTS availability and voice quality depend on the viewer's browser/device. No new paid service, backend, microphone permission, credentials or automatic audio was added.
