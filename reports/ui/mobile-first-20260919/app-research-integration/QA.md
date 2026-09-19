# NameOnMyMind App Research Integration QA

- Date: 2026-09-19
- Scope: existing validated research assets integrated into the app discovery experience
- Image generation in this change: **NONE**
- Canonical public cards remain: **C0001–C0005**
- Research candidates remain: **RESEARCH_PREVIEW_ONLY / HOLD**

## Integrated surfaces

### Main app · Discover
- Existing public-card search and tag discovery preserved.
- Added a clearly separated `RESEARCH PREVIEW` section.
- Added a horizontal world-word research lane using the existing 16 validated preview images.
- Added Korean emotion-map summary and 22 family navigation chips.
- Research content is not merged into the public-card catalog or daily-card resolver.

### World-word research preview
- Existing 16 image-backed candidates remain HOLD.
- Added a return path to the app Discover surface.

### Korean emotion map
- 22 emotion families.
- 151 expressions.
- 30 SOURCE_VERIFIED expressions.
- 121 DISCOVERY_ONLY expressions.
- 16 contrast sets.
- Added `근거✓` filter for SOURCE_VERIFIED-only browsing.
- Added a return path to the app Discover surface.

## Verification

- `git diff --check`: PASS
- `node --check src/ui/app.mjs`: PASS
- `node --check scripts/stage-research-preview.mjs`: PASS
- G1: 12/12 PASS
- G2: 5/5 PASS
- G3: 9/9 PASS
- G4: 16/16 PASS
- G5 editorial selection: 9/9 PASS (including research-surface separation regression)
- G5 research validators: PASS
- Korean expression validator: PASS
- Korean emotion-map validator: PASS
- Privacy violations: 0
- Public-card set after build: C0001–C0005 only
- Dynamic DOM: 16 research preview cards rendered
- Dynamic DOM: 22 Korean family chips rendered
- Local HTTP routes checked: 200
- Pages publication-boundary gate including Korean staging: PASS
- Mobile viewport evidence: 390×844 screenshot generated

## Evidence

- Screenshot: `reports/ui/mobile-first-20260919/app-research-integration/discover-390x844.png`
- Public research manifest: `public/RESEARCH_PREVIEW_MANIFEST.json`

## Release boundary

The research preview is web-visible as a research surface, but this does not constitute product promotion or Human Editorial Release for any research candidate. Public product cards remain C0001–C0005.
