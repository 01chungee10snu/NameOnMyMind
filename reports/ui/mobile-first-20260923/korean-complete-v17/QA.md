# NameOnMyMind Korean Evidence Complete V17 QA

- Date: 2026-09-23
- Scope: close the remaining eight Korean emotion-map HOLD expressions using direct National Institute of Korean Language Standard Korean Language Dictionary evidence
- New image generation: **NONE**
- Final Korean emotion-map status: **151 / 151 SOURCE_VERIFIED**
- Final DISCOVERY_ONLY count: **0**

## Final eight resolutions

| Previous discovery expression | Final expression | Evidence | Evidence type |
| --- | --- | --- | --- |
| 한숨 돌리다 | 한숨을 돌리다 | STD:499708 | official idiom canonicalization |
| 마음이 남다 | 여운 | STD:234001 | precise official headword replacement |
| 야속하다 | 야속하다 | STD:221152 | exact official headword |
| 진퇴양난이다 | 진퇴양난 | STD:485260 | canonical official headword |
| 낯뜨겁다 | 낯부끄럽다 | STD:408108 | precise official headword replacement |
| 죄책감이 들다 | 죄책감 | STD:480124 | canonical emotion-noun headword |
| 배가 아프다 | 배가 아프다 | STD:429286 | official idiom |
| 갈등되다 | 갈등하다 | STD:516128 | official verb, psychological sense |

### Selected official meanings

- `한숨(을) 돌리다`: 힘겨운 고비를 넘기고 좀 여유를 갖다.
- `여운`: 아직 가시지 않고 남아 있는 운치.
- `야속하다`: 무정한 행동이나 그런 행동을 한 사람이 섭섭하게 여겨져 언짢다.
- `진퇴양난`: 이러지도 저러지도 못하는 어려운 처지.
- `낯부끄럽다`: 염치가 없어 얼굴을 보이기가 부끄럽다.
- `죄책감`: 저지른 잘못에 대하여 책임을 느끼는 마음.
- `배(가) 아프다`: 남이 잘되어 심술이 나다.
- `갈등하다` psychological sense: 두 가지 이상의 상반되는 요구나 욕구, 기회 또는 목표에 직면하였을 때, 선택을 하지 못하고 괴로워하다.

## Final baseline

| Metric | V16 | V17 |
| --- | ---: | ---: |
| Total expressions | 151 | **151** |
| SOURCE_VERIFIED | 143 | **151** |
| DISCOVERY_ONLY | 8 | **0** |
| Level 1 verified | 38/38 | **38/38** |
| Level 2 verified | 67/72 | **72/72** |
| Level 2 HOLD | 5 | **0** |
| Level 3 verified | 38/41 | **41/41** |
| Level 3 HOLD | 3 | **0** |
| AGE_REVIEW_REQUIRED | 8 | **0** |
| verified contrast sets | 16/16 | **16/16** |

## Daily-pool boundary

`content/korean-expression/daily-pool-v1.json` remains unchanged at 116 IDs.

The eight formerly held IDs are not present in V1:
- KE0026
- KE0048
- KE0051
- KE0098
- KE0117
- KE0121
- KE0130
- KE0144

Therefore this evidence-completion batch cannot change the current day's deterministic daily term.

## Automated validation

- Korean expressive choice validator: **PASS**
- Korean emotion validator: **PASS**
  - SOURCE_VERIFIED: 151
  - DISCOVERY_ONLY: 0
  - Level 1: 38/38
  - Level 2: 72/72
  - Level 3: 41/41
  - evidence registry: 148
  - AGE_REVIEW_REQUIRED: 0
- G1: **12/12 PASS**
- G2: **5/5 PASS**
- G3: **9/9 PASS**
- G4: **17/17 PASS**
- G5 editorial selection: **9/9 PASS**
- privacy scan: **0 violations**
- `git diff --check`: **PASS**
- authorized public build boundary: **PASS**
- research-preview staging: **PASS**
- staged Korean counts: **151 / 151 verified**
- standard-dictionary follow-up evidence staged: **PASS**

## Canonicalization guard

The following old discovery expressions are absent from the final staged map:
- `한숨 돌리다`
- `마음이 남다`
- `진퇴양난이다`
- `낯뜨겁다`
- `죄책감이 들다`
- `갈등되다`

Their canonical replacements are present and SOURCE_VERIFIED.

## Mobile/browser QA

- viewport: **390×844**
- Discover capture: `discover-151-390x844.png`
- Korean-map detail capture: `galdeung-390x844.png`
- both PNG files: exact **390×844**
- staged map resolves `갈등하다` as SOURCE_VERIFIED / `STD:516128`: **PASS**
- staged map contains all eight final expressions: **PASS**
- staged map contains none of the six superseded discovery forms: **PASS**

Environment note:
- the installed Chrome binary at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` wrote both screenshots successfully.
- macOS headless display-link diagnostics can delay process exit; screenshot file existence and dimensions were independently verified after generation.

## Publication boundary

- approved public product cards remain C0001–C0005
- research preview remains `product_release_authorized: false`
- Korean emotion map remains a research-preview surface
- evidence completion does not auto-promote G5 research HOLD cards
