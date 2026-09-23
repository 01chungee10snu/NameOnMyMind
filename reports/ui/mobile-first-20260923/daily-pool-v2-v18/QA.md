# NameOnMyMind Daily Korean Pool V2 V18 QA

- Date: 2026-09-23
- Scope: introduce an immutable 151-term Daily Korean Pool V2 with a future effective date while preserving V1 and the current-day assignment
- V1 effective date: **2026-09-22**
- V2 effective date: **2026-09-24**
- Registry snapshot: `KOREAN_DAILY_POOL_REGISTRY_V1_2026-09-23`

## Core result

The daily learning pool is now versioned by local effective date.

| Local date | Selected pool | Pool size | Deterministic daily term |
| --- | --- | ---: | --- |
| 2026-09-23 | KOREAN_DAILY_VERIFIED_V1_2026-09-22 | 116 | 난처하다 (KE0116) |
| 2026-09-24 | KOREAN_DAILY_VERIFIED_V2_2026-09-24 | 151 | 고요하다 (KE0033) |

Therefore the V2 deployment does **not** alter the 2026-09-23 daily assignment. V2 begins only on the future effective date.

## Immutable pool artifacts

### V1
- path: `content/korean-expression/daily-pool-v1.json`
- term count: 116
- SHA-256: `b3deb74eccb9ce983d728776659a290e4fe36fed2f48272c56d19b18bb22ef74`
- unchanged from the V12 lock

### V2
- path: `content/korean-expression/daily-pool-v2.json`
- pool id: `KOREAN_DAILY_VERIFIED_V2_2026-09-24`
- source commit: `a05fbc7a901b50d1673db6b830bb05338bf9dc38`
- term count: 151
- SHA-256: `9493387eb67b1da7d09d94ce71c6d2a4bba2b69227d6886d619dee020e0071c9`
- contains all 151 current emotion-map term IDs
- contains every V1 ID

### Registry
- path: `content/korean-expression/daily-pools.json`
- SHA-256: `3a431c1bb013f6130af7cc0bbd5974357a18d9c8ec35db2b8ceaaa462c479fb9`
- fallback pool: V1
- selection: latest `effective_date <= user's local YYYY-MM-DD`
- equal-date tie break: `version_order`

## Runtime design

New shared domain module:
- `src/domain/korean-daily.mjs`

Functions:
- `localDateStamp(now)`
- `selectEffectiveKoreanDailyPool(registry, now)`
- `resolveKoreanDailyVerifiedTerm(data, pool, now)`

The app loads the registry plus V1 fallback first. If a future-effective pool is selected, it loads the referenced immutable pool and verifies the pool id/effective date before using it. Registry or V2 load failure falls back safely to V1.

## Regression validation

- Korean expressive choice validator: **PASS**
- Korean emotion validator: **PASS**
  - SOURCE_VERIFIED 151 / 151
  - Level 1 38 / 38
  - Level 2 72 / 72
  - Level 3 41 / 41
  - DISCOVERY_ONLY 0
- V1 immutability contract: **PASS**
- V2 full-map coverage: **PASS**
- V2 preserves every V1 ID: **PASS**
- 2026-09-23 registry selection -> V1: **PASS**
- 2026-09-24 registry selection -> V2: **PASS**
- G1: **12/12 PASS**
- G2: **5/5 PASS**
- G3: **9/9 PASS**
- G4: **17/17 PASS**
- G5: **9/9 PASS**
- privacy scan: **0 violations**
- research-preview staging: **PASS**
- `git diff --check`: **PASS**

## PWA/offline regression

Initial inspection found that the new domain module was copied into `public/` but was not yet in the service-worker shell precache list.

Repair:
- added `./src/domain/korean-daily.mjs` to `src/pwa/service-worker.template.js`
- extended the G3 PWA test to require it

Final:
- generated `public/service-worker.js` contains `./src/domain/korean-daily.mjs`: **PASS**
- public runtime module exists: **PASS**
- G3 PWA suite: **PASS**

## Mobile evidence

- screenshot: `today-v1-390x844.png`
- viewport: **390×844**
- current local date: 2026-09-23
- selected pool by deterministic module test: **V1**
- current daily term: **난처하다**
- screenshot file dimensions independently verified: **PASS**

Headless Chrome on macOS emits display-link/GPU diagnostics and can remain alive after writing the screenshot; the generated PNG was independently checked after process cancellation.

## Publication boundary

- approved product card set remains C0001–C0005
- Korean map remains a research-preview surface
- Daily Pool V2 changes only Korean daily-learning selection from its future effective date
- no G5 HOLD research card is promoted by this change
- reflection input remains neither stored nor transmitted
