# NameOnMyMind Korean Content Evidence V4 QA

- Date: 2026-09-21
- Scope: Korean contrast-set evidence completion, canonical wording cleanup, learning-level UX, durable visual-generation policy
- New image generation: **NONE**
- Public product cards remain: **C0001–C0005**
- Korean emotion map remains a research/learning surface.

## Evidence completion

Previous state:
- SOURCE_VERIFIED terms: 30
- DISCOVERY_ONLY terms: 121
- SOURCE_VERIFIED contrast sets: 7 / 16

Current state:
- SOURCE_VERIFIED terms: **51**
- DISCOVERY_ONLY terms: **100**
- SOURCE_VERIFIED contrast sets: **16 / 16**
- Evidence registry entries: **51**

Nine previously draft comparison sets were source-first reviewed and promoted:
- KC005 허전하다 · 외롭다 · 쓸쓸하다
- KC006 속상하다 · 안타깝다 · 서럽다
- KC008 화나다 · 분하다 · 억울하다 · 원망스럽다
- KC010 실망하다 · 허탈하다 · 허무하다 · 씁쓸하다
- KC011 설레다 · 기대되다 · 들뜨다
- KC012 안심되다 · 후련하다 · 홀가분하다
- KC013 부럽다 · 샘내다 · 질투하다 · 선망하다
- KC015 착잡하다 · 시원섭섭하다 · 심란하다
- KC016 그립다 · 아련하다 · 애틋하다

## Source capture

Evidence snapshot:
`content/korean-expression/evidence/contrast-source-v2.json`

- Snapshot ID: `KOREAN_CONTRAST_EVIDENCE_V2_2026-09-21`
- Audited comparison expressions: 30
- Primary external source: National Institute of Korean Language Basic Korean Dictionary
- Existing validated NameOnMyMind source-first records are reused where already stronger.
- Polysemous terms use an explicitly selected affective sense where necessary (for example `씁쓸하다`).
- Comparison cues were rewritten when the earlier copy exceeded the dictionary/source boundary.

## Canonicalization

- `샘나다` did not resolve as an exact official dictionary headword in the direct source check.
- Canonical app expression changed to **`샘내다`**.
- Official evidence: KRD ParaWordNo 62760.
- Validator prevents `샘나다` from silently re-entering the canonical map.

## Guided articulation UX

- All 16 comparison sets are now evidence-linked; the old “research draft comparison” opt-in was removed.
- Comparison questions remain horizontal swipe cards.
- Situation text remains optional, non-diagnostic, non-persistent, and not stored in the URL.
- Level labels:
  - Level 1 → **기본**
  - Level 2 → **확장**
  - Level 3 → **섬세**
- UI explicitly states that difficult/literary words are not inherently better words.

## Browser verification

Main Discover:
- “근거 연결 51개”: PASS
- “16개 검증 비교세트”: PASS
- foreign research cards remain 16: PASS

Korean guide, KC013:
- guide sets: 16
- choice buttons: 4
- canonical `샘내다`: visible
- old `샘나다`: absent
- 기본 / 확장 / 섬세 labels: visible
- “검증 16세트”: visible
- draft-comparison toggle: absent
- non-diagnostic wording: visible

## Visual-generation operating policy

`docs/architecture/VISUAL_ART_DIRECTION.md` now locks the default production route:

1. reuse an appropriate Ego Lite browser window/Space;
2. use the authenticated Google session;
3. generate through Google Gemini image generation or Google Flow;
4. prefer the available Nano Banana production path, including Pro-tier variant when appropriate;
5. preserve provenance and pass human visual review before app linkage.

Non-Google/Codex-provided image generation is **fallback only**, not the routine production path.

## Regression

- G1: 12/12 PASS
- G2: 5/5 PASS
- G3: 9/9 PASS
- G4: **17/17 PASS** (includes visual-generation policy contract)
- G5 editorial selection: 9/9 PASS
- G5 research validators: PASS
- Korean expression validator: PASS
- Korean emotion-map validator: PASS
- Privacy violations: 0
- Public product card set: C0001–C0005 only

## Mobile evidence

- `discover-390x844.png`
- `guide-envy-390x844.png`
- Viewport: 390×844
