# NameOnMyMind Level 3 Follow-up Evidence V14 QA

- Date: 2026-09-23
- Scope: promote two previously held Level 3 Korean emotion terms using exact NIKL dictionary-entry IDs
- New image generation: **NONE**
- Public product cards remain C0001–C0005.
- Historical evidence snapshots v1/v2 remain unchanged.

## Promotions

| Term | Evidence | Definition |
| --- | --- | --- |
| 낙담하다 | KRD:36830 | 어떤 일이 바라던 대로 되지 않아 크게 실망하다. |
| 격분하다 | KRD:33033 | 몹시 화를 내다. |

Evidence snapshot:
- `content/korean-expression/evidence/level3-followup-source-v3.json`
- ID: `KOREAN_LEVEL3_FOLLOWUP_EVIDENCE_V3_2026-09-23`

## ID-resolution audit

Entry IDs were resolved from the NIKL Basic Korean Dictionary downloadable-data mirror:
- repository: `https://github.com/spellcheck-ko/korean-dict-nikl`
- pinned commit: `42c0d01889f34536e9cf94fe57f62bd2055b1bde`
- `krdict/001.xml`: exact Lemma `격분하다`, LexicalEntry id `33033`, definition `몹시 화를 내다.`
- `krdict/002.xml`: exact Lemma `낙담하다`, LexicalEntry id `36830`, definition `어떤 일이 바라던 대로 되지 않아 크게 실망하다.`

The mirror is used only for deterministic ID resolution. Product evidence URLs remain official `krdict.korean.go.kr` detail URLs.

## Result

| Metric | Before | Current |
| --- | ---: | ---: |
| SOURCE_VERIFIED | 117 | **119** |
| DISCOVERY_ONLY | 34 | **32** |
| Level 2 verified | 58 / 72 | 58 / 72 |
| Level 2 HOLD | 14 | 14 |
| Level 3 verified | 21 / 41 | **23 / 41** |
| Level 3 HOLD | 20 | **18** |
| age-review required | 34 | **32** |

## Stability boundary

- `daily-pool-v1.json` remains exactly 116 term IDs.
- The v3 promotions do not mutate the v1 daily-learning cohort.
- Original exact-audit HOLD lists remain unchanged as historical evidence.
- v3 explicitly supersedes only `낙담하다` and `격분하다`.

## Automated regression

- G5 editorial selection: **9/9 PASS**
- Korean expression validator: **PASS**
- Korean emotion-map validator: **PASS**
- privacy scan: **0 violations**
- externally authorized public build: **PASS**
- research-preview staging: **PASS**
- staged Korean summary: SOURCE_VERIFIED **119**, Level 3 **23/41**, Level 3 HOLD **18**

## Mobile/browser QA

- viewport: **390×844**
- staged Discover summary renders `근거 연결 119개`: **PASS**
- `낙담하다` selected term renders as `SOURCE VERIFIED`: **PASS**
- `격분하다` selected term renders as `SOURCE VERIFIED`: **PASS**
- staged v3 evidence contains `KRD:36830` and `KRD:33033`: **PASS**
- main evidence screenshot: `discover-119-390x844.png`
