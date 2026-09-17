# NameOnMyMind approved layered-background QA

Date: 2026-09-17

## Decision

The five selected Flow-generated JPEGs are approved only as visual background assets. This decision does not constitute human re-verification of foreign-language semantics, translations, pronunciation, or cultural interpretation.

## Layer contract

- Generated raster JPEG: background visual only.
- Visible term, language, IPA, poetic line, labels: DOM text only.
- Gradient/scrim: CSS layer only.
- Pronunciation/favorite controls: HTML buttons overlaid above the raster.
- Background description: separate screen-reader text (`#card-background-description`), while the raster `<img>` is `aria-hidden` and presentational.
- Candidate source files remain in review/archive paths and are not copied to public output.

## Selected generated backgrounds

| Card | Selected candidate | Canonical asset |
|---|---|---|
| C0001 saudade | C0001-v2 | `assets/media/illustrations/generated/C0001.jpg` |
| C0002 Sehnsucht | C0002-v1 | `assets/media/illustrations/generated/C0002.jpg` |
| C0003 Schadenfreude | C0003-v1 | `assets/media/illustrations/generated/C0003.jpg` |
| C0004 envy | C0004-v1 | `assets/media/illustrations/generated/C0004.jpg` |
| C0005 幸福 | C0005-v1 | `assets/media/illustrations/generated/C0005.jpg` |

All five canonical JPEGs are 1200×896 and are referenced through `content/approved/assets.json` with `HUMAN_APPROVED` illustration status.

## Browser verification

Viewport: 390×844.

- C0001 background request: HTTP 200
- C0002 background request: HTTP 200
- C0003 background request: HTTP 200
- C0004 background request: HTTP 200
- C0005 background request: HTTP 200
- Source regression contract confirms raster background and DOM overlay separation.

Screenshots:

- `C0001-390x844.png`
- `C0002-390x844.png`
- `C0003-390x844.png`
- `C0004-390x844.png`
- `C0005-390x844.png`
- `approved-layered-contact-sheet.jpg`

## Regression

`npm run check:g5-research`: PASS

- G1 PASS
- G2 PASS
- G3 PASS
- G4 PASS
- G5 selection PASS
- G5 research validators PASS
- Privacy PASS, violations = 0

Public build snapshots after the approved visual release:

- runtime snapshot: `bc1e74d4143c17ff`
- content snapshot: `867d91c0737e29c7`

The content snapshot baseline is explicitly recorded in `content/approved/public-content-baseline.json`; future G5 research cannot change it without another explicit approved public-content release.
