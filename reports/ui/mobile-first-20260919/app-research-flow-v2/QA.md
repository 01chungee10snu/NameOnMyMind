# NameOnMyMind Research Flow V2 QA

- Date: 2026-09-19
- Scope: app discovery search + research deep-link continuity
- New image generation: **NONE**
- Public product cards: **C0001–C0005 only**
- Research surfaces: **RESEARCH_PREVIEW_ONLY / HOLD**

## Changes

1. Main-app search now checks:
   - approved public cards through the existing canonical search,
   - the 16 image-backed foreign research candidates,
   - the Korean emotion map.
2. Research matches are rendered in a visibly separate research block.
3. Research-only matches no longer terminate at an empty public-card state; the UI explains that the match is research-stage.
4. Search state is shareable through `?space=discover&q=...`.
5. Foreign research-card links preserve the selected card through `?card=C00xx`.
6. Korean emotion-map links preserve `family` and `term` in the URL.
7. Korean verified-expression chips now deep-link to the exact expression.
8. Research search rendering uses DOM text nodes rather than injecting content strings as HTML.

## Browser execution verification

### Main research-integrated search
URL:
`/?space=discover&q=그리움`

- Discover surface active: PASS
- Research search section rendered: PASS
- Research result items: 10
- Direct link to `hiraeth` / C0032 present: PASS

### Foreign research card deep link
URL:
`/prototypes/g5-research-preview-20260918/?card=C0032`

- C0032 exists: PASS
- Card position restored: 15 / 16
- Active counter restored: PASS

### Korean emotion-map deep link
URL:
`/prototypes/korean-emotion-map-20260919/?family=KF12&term=조마조마하다`

- Family restored: 걱정·불안
- Selected expression restored: 조마조마하다
- Self-expression sentence reflects selected term: PASS

## Mobile evidence

- `search-grief-390x844.png`
- `korean-jomajoma-390x844.png`
- Viewport: 390×844

## Regression

- G1: 12/12 PASS
- G2: 5/5 PASS
- G3: 9/9 PASS
- G4: 16/16 PASS
- G5 editorial selection: 9/9 PASS
- G5 research validators: PASS
- Korean expression validator: PASS
- Korean emotion-map validator: PASS
- Privacy violations: 0
- Staged public research boundary: PASS

## Boundary

Searchability and deep linking do not promote research candidates into the product catalog. The canonical daily-card, collection and agent-facing product catalog remain limited to the five human-released public cards.
