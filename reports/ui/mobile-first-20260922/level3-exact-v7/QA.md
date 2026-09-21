# NameOnMyMind Level 3 Exact Evidence V7 QA

- Date: 2026-09-22
- Scope: conservative Level 3 exact-headword evidence promotion
- New image generation: **NONE**
- Image production policy unchanged: Ego Lite → authenticated Google session → Gemini/Flow → Nano Banana path; non-Google/Codex generation fallback-only.
- Public product cards remain C0001–C0005.

## Result

| Metric | Before | Current |
| --- | ---: | ---: |
| SOURCE_VERIFIED | 99 | **112** |
| DISCOVERY_ONLY | 52 | **39** |
| Level 1 verified | 38 / 38 | 38 / 38 |
| Level 2 verified | 55 / 72 | 55 / 72 |
| Level 3 verified | 6 / 41 | **19 / 41** |
| Level 3 DISCOVERY_ONLY | 35 | **22** |

## Admission rule

Evidence snapshot:
`content/korean-expression/evidence/level3-exact-source-v1.json`

Snapshot ID:
`KOREAN_LEVEL3_EXACT_EVIDENCE_V1_2026-09-22`

This batch admits only 13 Level 3 expressions whose exact official headword identity and affect-relevant dictionary meaning were cross-checked.

### Promoted

장하다, 고요하다, 정겹다, 공허하다, 고독하다, 비통하다, 참담하다, 허망하다, 노심초사하다, 무력하다, 뉘우치다, 경이롭다, 의아하다

### Deliberately held

희열을 느끼다, 고대하다, 애잔하다, 애절하다, 야속하다, 적적하다, 적막하다, 침울하다, 처연하다, 애석하다, 낙담하다, 조바심나다, 섬뜩하다, 진퇴양난이다, 노엽다, 격분하다, 울화가 치밀다, 분통이 터지다, 괘씸하다, 낯뜨겁다, 송구하다, 시기하다

The Korean dictionary server was intermittently throttled/time-out during broad auditing. A timeout was **not** interpreted as lexical absence.

## Browser QA

Main Discover:
- 근거 연결 112개: PASS
- 기본 38/38: PASS
- 확장 55/72: PASS
- 섬세 19/41: PASS

Verified example:
- 경이롭다 selected: PASS
- SOURCE VERIFIED: PASS
- 어휘 근거만: PASS
- Level 3 evidence link: PASS

Held example:
- 애잔하다 selected: PASS
- DISCOVERY · 추가 검증 중: PASS
- 연령 검토 필요: PASS

Evidence route:
- `content/korean-expression/evidence/level3-exact-source-v1.json`: HTTP 200
- snapshot ID present: PASS
- unresolved count 22 present: PASS

## Regression

- Korean validator: PASS
- SOURCE_VERIFIED: 112
- DISCOVERY_ONLY: 39
- Level 3 verified: 19
- Level 3 HOLD: 22
- G1: 12/12 PASS
- G2: 5/5 PASS
- G3: 9/9 PASS
- G4: 17/17 PASS
- G5 editorial selection: 9/9 PASS
- G5 research validators: PASS
- privacy violations: 0

## Mobile evidence

- discover-390x844.png
- verified-390x844.png
- hold-390x844.png
