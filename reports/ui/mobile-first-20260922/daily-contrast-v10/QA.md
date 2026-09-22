# NameOnMyMind Daily Contrast Practice V10 QA

- Date: 2026-09-22
- Scope: pair the daily verified Korean word with a daily nuanced-word comparison exercise
- New image generation: **NONE**
- Public product cards remain C0001–C0005.

## Daily pairing behavior

Daily word for 2026-09-22:
- **멋쩍다**

The app first looks for a SOURCE_VERIFIED contrast set containing the daily word. If found, that set is used. Otherwise it deterministically selects one verified contrast set from the local calendar date.

For `멋쩍다`, the canonical contrast set is:
- ID: **KC007**
- title: **부끄럽다 · 민망하다 · 쑥스럽다 · 멋쩍다**
- choices: 4

Reflection prompt rendered:
“잘못한 느낌인가, 상황이 난처한가, 관심을 받아 쑥스러운가, 그냥 어색한가?”

## Learning boundary

- This is not a scored quiz.
- No option is labeled correct/incorrect.
- Copy explicitly says: “정답을 맞히는 문제가 아닙니다.”
- Each choice links to its canonical Korean emotion-map term.
- The detail link targets `guide=1&compare=KC007`.
- Only SOURCE_VERIFIED contrast sets can be selected.

## Browser QA

- daily term: 멋쩍다 — PASS
- practice card count: 1 — PASS
- practice title: 부끄럽다 · 민망하다 · 쑥스럽다 · 멋쩍다 — PASS
- choice count: 4 — PASS
- all four canonical terms present — PASS
- non-scored guidance present — PASS
- data-level contrast lookup confirms KC007 — PASS

## Current evidence state

- SOURCE_VERIFIED: 116
- DISCOVERY_ONLY: 35
- Level 1: 38/38 verified
- Level 2: 58/72 verified
- Level 3: 20/41 verified
- contrast sets: 16/16 verified

## Mobile evidence

- `daily-contrast-390x844.png`
- viewport: 390×844
