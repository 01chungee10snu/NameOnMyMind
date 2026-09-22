# NameOnMyMind Korean Evidence V16 QA

- Date: 2026-09-23
- Scope: continue the remaining Korean emotion HOLD audit using fixed NIKL Basic Korean Dictionary evidence; separate exact-headword admissions from phrase/example admissions
- New image generation: **NONE**
- Dictionary ID-resolution mirror commit: `42c0d01889f34536e9cf94fe57f62bd2055b1bde`
- Product evidence URLs: official `krdict.korean.go.kr` detail pages only

## Evidence batches

### Exact headword follow-up
- Level 2: 3 promoted
  - `오싹하다` → `KRD:68033`
  - `막막하다` → `KRD:49986`
  - `찡하다` → `KRD:80169`
- Level 3: 12 promoted
  - `애잔하다` → `KRD:601309`
  - `애절하다` → `KRD:66706`
  - `적적하다` → `KRD:74148`
  - `적막하다` → `KRD:74593`
  - `침울하다` → `KRD:80819`
  - `처연하다` → `KRD:78737`
  - `애석하다` → `KRD:66697`
  - `섬뜩하다` → `KRD:63314`
  - `노엽다` → `KRD:42882`
  - `괘씸하다` → `KRD:30833`
  - `송구하다` → `KRD:64658`
  - `시기하다` → `KRD:65852`

Homonym guard:
- `송구하다` affective adjective is `KRD:64658`
- `KRD:64659` is the ball-pass/throw verb and is not used
- `찡하다` affective adjective is `KRD:80169`; the verb homonym `KRD:80165` is not used as the canonical affective evidence

### Phrase/example follow-up
9 exact product expressions were found as official NIKL examples/collocations and promoted:
- `희열을 느끼다` → `KRD:88885`
- `미련이 남다` → `KRD:56276`
- `맥이 빠지다` → `KRD:55231`
- `애가 타다` → `KRD:14663`
- `울화가 치밀다` → `KRD:79235`
- `분통이 터지다` → `KRD:60251`
- `목이 메다` → `KRD:93397`
- `가슴이 벅차다` → `KRD:58356`
- `가슴이 먹먹하다` → `KRD:54807`

## Final Korean map baseline

| Metric | Before | After |
| --- | ---: | ---: |
| Total expressions | 151 | 151 |
| SOURCE_VERIFIED | 119 | **143** |
| DISCOVERY_ONLY | 32 | **8** |
| Level 1 | 38/38 | **38/38** |
| Level 2 verified | 58/72 | **67/72** |
| Level 2 HOLD | 14 | **5** |
| Level 3 verified | 23/41 | **38/41** |
| Level 3 HOLD | 18 | **3** |
| age review required | 32 | **8** |
| verified contrast sets | 16/16 | **16/16** |

Remaining HOLD:
- Level 2: `한숨 돌리다`, `마음이 남다`, `죄책감이 들다`, `배가 아프다`, `갈등되다`
- Level 3: `야속하다`, `진퇴양난이다`, `낯뜨겁다`

These remain HOLD because the fixed dictionary export did not provide a sufficiently direct exact-headword or exact affective phrase basis for this batch.

## Daily-pool boundary

- `content/korean-expression/daily-pool-v1.json`: **unchanged**
- `term_count`: **116**
- no same-day cohort mutation
- new admissions are not inserted into V1

## Automated validation

- Korean expressive choice validator: **PASS**
- Korean emotion validator: **PASS**
  - SOURCE_VERIFIED 143
  - DISCOVERY_ONLY 8
  - Level 2 67/72
  - Level 3 38/41
  - evidence registry 140
- G1: **12/12 PASS**
- G2: **5/5 PASS**
- G3: **9/9 PASS**
- G4: **17/17 PASS**
- G5 editorial selection: **9/9 PASS**
- privacy scan: **0 violations**
- `git diff --check`: **PASS**
- authorized public build boundary: **PASS**
- research-preview staging: **PASS**
- staged Korean summary: SOURCE_VERIFIED **143**, Level 2 **67/72**, Level 3 **38/41**
- staged evidence includes the three new files: **PASS**

Regression note:
- The first full G5 run failed only because a test still pinned the old expected count `119`.
- The G5 contract and Pages publication boundary were updated to the evidence-backed `143/8` baseline, then the complete test chain passed.

## Mobile/browser QA

- viewport: **390×844**
- isolated `file://` render with module/file access enabled: **PASS**
- Discover summary renders `근거 연결 143개`: **PASS**
- Discover search for `송구하다` resolves to the Korean map: **PASS**
- Korean-map detail renders `송구하다`: **PASS**
- Korean-map detail renders `SOURCE VERIFIED`: **PASS**
- screenshots:
  - `discover-143-390x844.png`
  - `songu-390x844.png`

Environment note:
- `/opt/homebrew/bin/google-chrome` had a stale framework-relative launcher path in this environment.
- QA used the installed binary `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` directly.
- Headless Chrome emitted macOS display-link diagnostics after writing screenshots; the PNG artifacts were written at the target 390×844 dimensions.

## Publication boundary

- approved product cards remain C0001–C0005
- research preview remains `product_release_authorized: false`
- Korean emotion map remains a research-preview surface
- new Korean evidence files are staged by the Pages workflow but do not promote G5 HOLD cards into approved product data
