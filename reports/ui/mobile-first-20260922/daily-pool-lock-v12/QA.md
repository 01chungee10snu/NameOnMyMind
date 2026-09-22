# NameOnMyMind Daily Korean Pool Lock V12 QA

- Date: 2026-09-22
- Scope: stabilize the daily Korean learning assignment against same-day evidence/catalog growth
- New image generation: **NONE**
- Public product cards remain C0001–C0005.

## Issue found

The first daily-Korean implementation selected from the full current SOURCE_VERIFIED list.

On 2026-09-22:
- at 116 verified expressions, the daily word was **멋쩍다**
- after `고대하다` was verified and the pool grew to 117, the same date recalculated to **평온하다**

That violates the intended “one Korean word for the day” experience.

## Fix

A versioned immutable pool was added:

`content/korean-expression/daily-pool-v1.json`

Contract:
- pool id: `KOREAN_DAILY_VERIFIED_V1_2026-09-22`
- effective date: `2026-09-22`
- source commit: `f1a1d6518bec48c0d4c8aa7b71a96a2367b27af4`
- term count: **116**
- pool contains exactly the SOURCE_VERIFIED term IDs available when the daily Korean feature was released
- later evidence promotions do not mutate v1
- future pool changes require a new pool version and future effective date

`고대하다` / `KE0012`, verified later, is intentionally **not** present in v1.

## Current content state

The content map itself remains current:
- SOURCE_VERIFIED: **117**
- DISCOVERY_ONLY: **34**
- Level 1: 38/38
- Level 2: 58/72
- Level 3: 21/41
- contrast sets: 16/16
- school-age direct/related: 21 + 1

The daily pool being 116 does not reduce or hide the 117th verified term from search, the map, or evidence views. It only freezes the daily-assignment cohort.

## Browser QA

Two independent clean Chrome profiles on the same local date:
- profile 1 daily word: **멋쩍다**
- profile 2 daily word: **멋쩍다**
- same-day stable: PASS
- current “근거 연결 117개” summary: PASS
- daily contrast practice visible: PASS

Public-staging daily pool route:
- HTTP 200
- pool id present: PASS
- term_count 116: PASS
- KE0012 absent: PASS

## Automated gates

- validator requires exact pool ID, effective date, source commit, count 116
- validator rejects duplicate IDs
- every v1 term ID must still resolve to a current SOURCE_VERIFIED term
- UI loads `daily-pool-v1.json` separately from the live Korean map
- staging manifest exposes `daily_pool_path`
- Pages publication gate requires the pool file

## Mobile evidence

- `discover-daily-pool-390x844.png`
- viewport: 390×844
