# NameOnMyMind Daily Korean Word V9 QA

- Date: 2026-09-22
- Scope: add a daily verified Korean emotion-word learning entry point to Discover
- New image generation: **NONE**
- Image production policy unchanged: Ego Lite → authenticated Google session → Gemini/Flow → Nano Banana path; non-Google/Codex generation fallback-only.
- Public product cards remain C0001–C0005.

## Behavior

The Korean research summary now renders exactly one **오늘의 한국어 마음말** card.

Selection contract:
- pool: SOURCE_VERIFIED Korean emotion-map expressions only
- ordering: stable by term id
- key: browser-local calendar date
- same date: same term across reload/new browser profile
- no reflection/history/location input
- no diagnostic or recommendation model
- click target: canonical Korean emotion-map deep link

## 2026-09-22 QA result

Selected daily expression: **멋쩍다**

Rendered metadata:
- family: 부끄러움·자기의식
- lexical depth: 섬세
- school-age label: not asserted
- evidence label: 어휘 근거 연결

Prompt:
- asks the user to make one sentence for a moment that fits the word
- does not classify or diagnose the user's emotion

## Browser verification

Two clean Chrome profiles loaded:
- daily card count = 1 / 1
- term = 멋쩍다 / 멋쩍다
- same-day deterministic selection: PASS
- “오늘의 한국어 마음말” label: PASS
- Korean verified summary 116: PASS

## Build-boundary check

A plain `build:public` intentionally omits research-preview surfaces.
The daily Korean card appears only after the explicitly authorized research-preview staging step, matching the GitHub Pages publication boundary.

## Regression state at implementation

- Korean SOURCE_VERIFIED: 116
- DISCOVERY_ONLY: 35
- Level 1: 38/38 verified
- Level 2: 58/72 verified
- Level 3: 20/41 verified
- school-age direct/related: 21 + 1
- contrast sets: 16/16 verified

## Mobile evidence

- `discover-daily-390x844.png`
- viewport: 390×844
