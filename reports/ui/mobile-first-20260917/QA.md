# Mobile-first UX QA — 2026-09-17

## Scope

- Mobile-first app canvas: max 540px
- Four bottom tabs: 오늘 / 찾기 / 기록 / 보관함
- Safe-area aware bottom navigation
- 4:3 image-led Daily Card hero
- Pronunciation and favorite quick actions
- Image-led discovery/collection cards
- Dedicated local-only journal space
- `?space=` deep-link support for QA and app navigation

## Browser canaries

- `390x844`: C0001 Today
- `390x844`: C0001 Journal
- `430x932`: C0002 Today

Screenshots in this directory are verification artifacts, not product assets.

## Verification

- `npm run check:g5-research`: PASS
- privacy check: PASS, violations 0
- public card set unchanged: C0001–C0005
- content snapshot unchanged: `4952b4fe18c503ee`
- runtime/UI snapshot: `8e37210a7f2d3f61`
- browser requests for HTML, CSS, JS, app icon, manifest, service worker, data files, and card illustration: HTTP 200/304

## Asset boundary

The approved illustration files and their SHA-256 values were intentionally not replaced in this UI change. C0002–C0005 remain the previously human-approved abstract SVGs. New high-fidelity mobile artwork must enter as new candidate assets and receive human review before replacing the currently approved illustration bytes/registry hashes.
