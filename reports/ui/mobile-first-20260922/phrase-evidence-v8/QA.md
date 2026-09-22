# NameOnMyMind Phrase Evidence V8 QA

- Date: 2026-09-22
- Scope: resolve selected phrase/collocation HOLDs and one canonical-form correction
- New image generation: **NONE**
- Image production policy unchanged: Ego Lite → authenticated Google session → Gemini/Flow → Nano Banana path; non-Google/Codex generation fallback-only.
- Public product cards remain C0001–C0005.

## Result

| Metric | Before | Current |
| --- | ---: | ---: |
| SOURCE_VERIFIED | 112 | **116** |
| DISCOVERY_ONLY | 39 | **35** |
| Level 1 verified | 38 / 38 | 38 / 38 |
| Level 2 verified | 55 / 72 | **58 / 72** |
| Level 2 HOLD | 17 | **14** |
| Level 3 verified | 19 / 41 | **20 / 41** |
| Level 3 HOLD | 22 | **21** |

## Phrase evidence snapshot

`content/korean-expression/evidence/phrase-source-v1.json`

Snapshot ID:
`KOREAN_PHRASE_EVIDENCE_V1_2026-09-22`

This batch deliberately supersedes selected HOLD entries from the earlier exact-headword audits rather than rewriting the old snapshots.

Promoted:
- `마음을 졸이다` — official idiom evidence under `마음`
- `마음에 걸리다` — official idiom evidence under `마음`
- `가슴이 철렁하다` — official example/evidence under `철렁하다`
- `조바심하다` — canonical official headword

Canonicalization:
- old exploratory form: `조바심나다`
- canonical app form: **`조바심하다`**
- evidence: KRD ParaWordNo 75299

## Historical audit integrity

Earlier snapshots remain unchanged:
- `level2-exact-source-v1.json` still records 17 originally unresolved Level 2 expressions.
- `level3-exact-source-v1.json` still records 22 originally unresolved Level 3 expressions.
- `phrase-source-v1.json` explicitly records which previous HOLDs are superseded.

Current remaining HOLD counts are enforced separately:
- Level 2: 14
- Level 3: 21

## Browser QA

Main Discover:
- 근거 연결 116개: PASS
- 확장 58/72: PASS
- 섬세 20/41: PASS

`마음을 졸이다`:
- selected expression visible: PASS
- SOURCE VERIFIED: PASS
- phrase evidence link visible: PASS

`조바심하다`:
- canonical expression visible: PASS
- old `조바심나다` absent: PASS
- SOURCE VERIFIED: PASS

HOLD boundary:
- `한숨 돌리다`: visible
- DISCOVERY · 추가 검증 중: PASS

Evidence route:
- `content/korean-expression/evidence/phrase-source-v1.json`: HTTP 200
- snapshot ID present: PASS
- evidence rows: 4

## Regression

- Korean emotion validator: PASS
- SOURCE_VERIFIED: 116
- DISCOVERY_ONLY: 35
- Level 2 verified/HOLD: 58 / 14
- Level 3 verified/HOLD: 20 / 21
- G1: 12/12 PASS
- G2: 5/5 PASS
- G3: 9/9 PASS
- G4: 17/17 PASS
- G5 editorial selection: 9/9 PASS
- G5 research validators: PASS
- privacy violations: 0

## Mobile evidence

- `discover-390x844.png`
- `mind-390x844.png`
- `joba-390x844.png`
- `hold-390x844.png`
