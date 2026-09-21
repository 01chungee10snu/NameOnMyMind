# NameOnMyMind Level 2 Exact-Headword Evidence V6 QA

- Date: 2026-09-22
- Scope: conservative Level 2 source-first promotion
- New image generation: **NONE**
- Image production policy unchanged: Ego Lite → authenticated Google session → Gemini/Flow → Nano Banana path; non-Google/Codex generation fallback-only.
- Public product cards remain C0001–C0005.

## Result

| Metric | Before | Current |
| --- | ---: | ---: |
| SOURCE_VERIFIED | 77 | **99** |
| DISCOVERY_ONLY | 74 | **52** |
| Level 1 verified | 38 / 38 | 38 / 38 |
| Level 2 verified | 33 / 72 | **55 / 72** |
| Level 2 DISCOVERY_ONLY | 39 | **17** |
| Level 3 verified | 6 / 41 | 6 / 41 |

## Admission rule

Evidence snapshot:
`content/korean-expression/evidence/level2-exact-source-v1.json`

Snapshot ID:
`KOREAN_LEVEL2_EXACT_EVIDENCE_V1_2026-09-22`

This batch intentionally admits only **22 exact official headwords** directly resolved in the National Institute of Korean Language Basic Korean Dictionary.

The remaining **17 phrase/idiom forms remain DISCOVERY_ONLY** because direct official evidence was not conclusively resolved in this audit. A dictionary-network timeout was not treated as evidence of absence.

### Promoted exact headwords

유쾌하다, 흥겹다, 보람차다, 평온하다, 느긋하다, 포근하다, 든든하다, 안정되다, 친근하다, 다정하다, 서글프다, 울적하다, 아찔하다, 갑갑하다, 좌절하다, 성나다, 못마땅하다, 난처하다, 죄송하다, 후회스럽다, 얼떨떨하다, 미묘하다

### Deliberately held

한숨 돌리다, 미련이 남다, 마음이 남다, 맥이 빠지다, 마음을 졸이다, 오싹하다, 가슴이 철렁하다, 막막하다, 애가 타다, 죄책감이 들다, 마음에 걸리다, 배가 아프다, 갈등되다, 찡하다, 목이 메다, 가슴이 벅차다, 가슴이 먹먹하다

## Browser QA

Main Discover:
- 근거 연결 99개: PASS
- 기본 38/38: PASS
- 확장 55/72: PASS

Verified example:
- 유쾌하다 selected: PASS
- SOURCE VERIFIED: PASS
- 3–6학년 연구 label: PASS
- Level 2 evidence link: PASS

Held example:
- 한숨 돌리다 selected: PASS
- DISCOVERY · 추가 검증 중: PASS
- 연령 검토 필요: PASS

Evidence route:
- `content/korean-expression/evidence/level2-exact-source-v1.json`: HTTP 200
- snapshot ID present: PASS
- unresolved count 17 present: PASS

## Regression

- Korean validator: PASS
- SOURCE_VERIFIED: 99
- DISCOVERY_ONLY: 52
- Level 2 verified: 55
- Level 2 HOLD: 17
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
