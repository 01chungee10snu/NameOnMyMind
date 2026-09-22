# NameOnMyMind Level 3 Follow-up Evidence V11 QA

- Date: 2026-09-22
- Scope: resolve one previously held Level 3 term after official dictionary indexing became directly available
- New image generation: **NONE**
- Public product cards remain C0001–C0005.

## Promotion

Promoted:
- **고대하다**
- evidence: `KRD:25588`
- selected definition: `몹시 기다리다.`
- official source: National Institute of Korean Language Basic Korean Dictionary

Evidence snapshot:
- `content/korean-expression/evidence/level3-followup-source-v2.json`
- ID: `KOREAN_LEVEL3_FOLLOWUP_EVIDENCE_V2_2026-09-22`

This follow-up snapshot supersedes only the earlier `고대하다` HOLD entry. The original Level 3 exact-audit snapshot is preserved unchanged.

## Result

| Metric | Before | Current |
| --- | ---: | ---: |
| SOURCE_VERIFIED | 116 | **117** |
| DISCOVERY_ONLY | 35 | **34** |
| Level 2 verified | 58 / 72 | 58 / 72 |
| Level 3 verified | 20 / 41 | **21 / 41** |
| Level 3 HOLD | 21 | **20** |

## Boundary checks

Canonical data:
- `고대하다`: SOURCE_VERIFIED, `KRD:25588`
- `애잔하다`: remains DISCOVERY_ONLY

Validator:
- old Level 3 HOLD snapshot remains 22 entries
- phrase evidence supersedes `조바심나다`
- follow-up evidence supersedes `고대하다`
- current Level 3 HOLD baseline is exactly 20

## Browser / staging QA

Discover:
- 근거 연결 117개: PASS
- 섬세 21/41: PASS

Korean map:
- `고대하다` page renders: PASS
- follow-up evidence link visible: PASS
- `애잔하다` page renders as the retained HOLD comparison target: PASS

Evidence route:
- `content/korean-expression/evidence/level3-followup-source-v2.json`: HTTP 200
- snapshot id present: PASS
- `KRD:25588` present: PASS

## Regression

- Korean validator: PASS
- G1: 12/12 PASS
- G2: 5/5 PASS
- G3: 9/9 PASS
- G4: 17/17 PASS
- G5 editorial selection: 9/9 PASS
- G5 research validators: PASS
- privacy violations: 0

## Mobile evidence

- `discover-390x844.png`
- `godae-390x844.png`
- `hold-390x844.png`
