# Positive-first learner V27

`positive-focus-v1.json` is a versioned editorial display policy over the immutable 177-word learner vocabulary. It selects 61 focus words, 4 source-backed lexical-antonym pairs and 28 explicit contextual comparisons, with three comparison-only extra words. It never classifies an individual user.

`positive-learning.mjs` validates and clones source data, handles a local-calendar cycle, keeps all headline and related links in the focus set, and resolves original KE/AX/WC links into primary and secondary reading slots. Its four antonym sources are pinned by `validate-positive-learning.mjs`; immutable original data hashes are checked separately. Unsupported lexical relations remain unclaimed.

`positive-learning.html` is the new public renderer. `stage-mobile-web.mjs` rebases it for the root and /learn without modifying archived prototypes. Broad dictionary searching stays in its original optional panel. All foreign companions, pronunciation, TTS and Hanja modules remain available. No new service, credential flow, tracking or persistent personal-text storage was added.

Required checks: `validate:positive-learning`, `test:positive-learning`, the existing Korean/public suites and `qa-positive-learning.py`. Evidence is in `reports/ui/positive-focus-v27-20261008/`.
