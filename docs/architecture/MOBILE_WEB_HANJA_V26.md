# Mobile web entry points and Hanja helpers — V26

The public deployment adds `stage-mobile-web.mjs` after the existing authorized preview stage. Default builds retain their earlier release boundaries. Explicit mobile publication authorization and the completed build/preview manifests are required. `/` and `/learn/` use deterministic path-rebased copies of the frozen learner; `/cards.html` retains the earlier full-card interface. A fixed-target allowlisted router preserves old product deep links.

The compiler `scripts/korean/build-world-hanja.mjs` validates `world-hanja-v1.json` against exact world IDs/terms, preserves Han-character order, rejects unknown/unsafe source URLs and emits immutable data. `world-hanja.mjs` only renders verified exact term matches. The shared world renderer is used for learner cards and dictionary entries. Hangul-to-Hanja derivation is outside this release.

Sources: Korean Wiktionary character entries for 物, 哀, 捨, 不, 得; Han Dian documents the 舍/捨 relationship in the intended Chinese sense. URLs and licensing are in the authored JSON. Korean labels are learning annotations, not native word pronunciations or word-level translations. IPA, Japanese kana, Chinese pinyin and TTS remain unchanged.

Tests: `test:mobile-web`, `test:world-hanja`, the existing language tests and mobile-browser QA. Every public deployment checks the staged bytes and all source/identity gates. No authentication proxy or user-text transmission is introduced.
