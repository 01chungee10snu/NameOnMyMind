# NameOnMyMind Flow clipboard identity QA

Date: 2026-09-18  
Status: **PASS — SAME FLOW RESULTS CONFIRMED**

## Purpose

Re-open the existing Google Flow project inside an AI-controllable Ego Lite Space and independently verify the six mobile illustration results that were already recorded on 2026-09-17.

This check does **not** introduce a new generated-background selection and does **not** change the Beauty V2 lock.

## Browser / generation state confirmed

- Flow project: `7e035e7b-73f2-4d6f-a9c4-5990c4f7b97d`
- Authenticated Flow workspace: PRO account session was active.
- Observed image model in the project UI: **Nano Banana 2**.
- Six media tiles were present:
  - `Balanced stones with soft glow`
  - `Abstract still life representing…`
  - `Dominoes tipping on tabletop`
  - `Open window with map and suitcas…`
  - `Empty chair by open window`
  - `Empty chair with letter by windo…`

## Recovery method

Flow's media context menu exposes `Copy` plus a download menu with `1K original size`, `2K upscaled`, and `4K upscaled` options. No 2K/4K upscale was invoked.

For a deterministic recovery check, each media tile was copied through Flow's `Copy` action. Before every copy, the macOS clipboard was replaced with a unique text sentinel and polled until a PNG representation appeared. The PNG representation was then saved temporarily and compared against **all six** previously archived JPG candidates.

## Identity result

Every recovered PNG was 1200×896. For the correct candidate pair:

- full RGB mean absolute error: **0.0**
- RGB correlation: **1.0**
- 64-bit dHash Hamming distance: **0**

The expected pair was the unique zero-error match in the 6×6 comparison matrix.

| Recovered Flow image | Existing candidate | Pixel identity | Current release status |
|---|---|---:|---|
| saudade A | `C0001-v1.jpg` | exact | not selected |
| saudade B | `C0001-v2.jpg` | exact | selected → `generated/C0001.jpg` |
| Sehnsucht | `C0002-v1.jpg` | exact | selected → `generated/C0002.jpg` |
| Schadenfreude | `C0003-v1.jpg` | exact | selected → `generated/C0003.jpg` |
| envy | `C0004-v1.jpg` | exact | selected → `generated/C0004.jpg` |
| 幸福 | `C0005-v1.jpg` | exact | selected → `generated/C0005.jpg` |

## Interpretation

The PNG clipboard representation is **not a newly generated image and not a higher-fidelity source original**. It contains the exact same decoded RGB pixels as the already archived JPG candidate. Keeping both would only duplicate repository weight.

Therefore:

- current `HUMAN_APPROVED` generated JPG backgrounds remain canonical;
- `content/approved/assets.json` is unchanged;
- the Beauty V2 mobile baseline remains locked;
- the recovered PNG duplicates are removed after hashing/comparison;
- no external publication or repository push is authorized by this QA.

## Post-check regression

`npm run check:g5-research`: **PASS**

- G1: PASS
- G2: PASS
- G3: PASS
- G4: PASS
- G5 selection: PASS
- G5 research validators: PASS
- Privacy violations: **0**
- Runtime snapshot: `a1c474f884d64648`
- Content snapshot: `867d91c0737e29c7`

The content snapshot therefore remains identical to the locked Beauty V2 baseline.

Machine-readable evidence: `docs/ops/evidence/FLOW_CLIPBOARD_IDENTITY_2026-09-18.json`.
