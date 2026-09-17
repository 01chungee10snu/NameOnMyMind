# NameOnMyMind G5 Research Preview QA

- Date: 2026-09-18
- Status: **RESEARCH_PREVIEW_ONLY**
- Public release authorized: **NO**
- Flow project: `7e035e7b-73f2-4d6f-a9c4-5990c4f7b97d`
- Observed image model: **Google Flow / Nano Banana 2**
- Candidate count: **16**
- Candidate image size: **1200×896** each

## Boundary

- Existing approved/public cards remain C0001–C0005.
- Preview cards remain `HOLD` research candidates.
- No candidate image in this preview is registered in `content/approved/assets.json`.
- Promotion still requires pronunciation/rights, complete multilingual comparison, visual Human Review, and Human Editorial Release.

## Candidate set

| Card | Term | Language | Flow media title | SHA-256 |
|---|---|---|---|---|
| C0016 | Geborgenheit | Deutsch | Reading nook with warm lamplight | `0d7dc21c9c03a65af83b8a2efd63596bb85c950e774cff79d1e3a846072b5051` |
| C0018 | Weltschmerz | Deutsch | Globe resting on desk | `010c21b286641065dec25406291a58285d95cb8c12502b9ad781a07cd99fc6c7` |
| C0019 | 切ない | 日本語 | Empty seats at twilight station | `984066c3c374355e7a418af1b57dadf5a8f27094e520608933b4482651cfb8b8` |
| C0021 | Torschlusspanik | Deutsch | Closing doorway in hallway | `a9483b9ffeba3c6a0bd1d27ef0bc73c68f1204066dae13451a59362108fa7628` |
| C0022 | 舍不得 | 中文 | Object left outside moving box | `212c1eaa371d73047937bb383e0a4a2a066a909b14b999e4ab4405a521e5f216` |
| C0023 | тоска | Русский | Empty room at dusk illustration | `ba1eb3ad4c6e2f4e01471219201d2ac32ae1a166f1b710d49d2c4f11457c1c1d` |
| C0024 | обида | Русский | Shared table showing relational grievance | `eaa631682a21a0357946848a863b6c3468d05f8fe07c726e6a1dfb7b647b0298` |
| C0025 | طَرَب | العربية | Instrument resting on chair | `7041979911efa8adf577854a4e0d3fbe728c0bbd94283500b3289469d20b41b3` |
| C0026 | gigil | Filipino / Tagalog | Compressed cushions depicting intense contained affect | `4a64a6f7d1fc59baefd183659790442ef807ea57406b9206ee7905ce8e0be011` |
| C0027 | פִרְגּוּן | עברית | Shared workspace celebrating success | `e3f69fb38c02793e0e5568a150c097ef236a5adbedcce50f9fb46d48fc505405` |
| C0028 | gezelligheid | Nederlands | Illustration of cozy dining table | `6bbe1779d3ddd620200c788b5e7ff2220b81075af0fed86f99670ceaa80e0e08` |
| C0029 | dépaysement | Français | Room with unpacked bag dawn | `490d1be3c4eaec3b0120c62aee33ab29367ec77e9a0f9287baab8cb4132ff1dd` |
| C0030 | やるせない | 日本語 | Empty room with closed window | `70de4387d50ccde31fc46295802d97f9bd239c1b1b30bef8b2cfa2891d9eaa77` |
| C0031 | غُرْبَة | العربية | Illustration depicting ghurba and dislocation | `43d4a16bde34c24844a60fd95eae58091dde68c2423a6d22fbbd350a414b9037` |
| C0032 | hiraeth | Cymraeg | Hiraeth in old room interior | `5ca7e4e99d424dcbee09b55a9baae92d5aa703fdf86a4c6cb1978edc1f89f449` |
| C0033 | viraha | संस्कृतम् | Two separated objects connected by warm light | `f6d2d4b1e989abf99f38dd14a9250a86d9c49d053ac46c41a6106abbc374c045` |

## Prepared next-generation backlog

- `C0034 tampo`: submitted once to Flow; no completed image was observed during this run, so it is **not** included in the preview.
- `C0035 querencia`, `C0036 saṃvega`, `C0037 甘え`, `C0038 憋屈`, `C0039 limerence`, `C0040 compersion`: image prompts prepared but intentionally not submitted after C0034 stalled.
- No retry or duplicate submission was made for C0034.

## Prototype

- Local URL: `http://127.0.0.1:4181/prototypes/g5-research-preview-20260918/`
- Target viewport: 390×844
- Navigation: horizontal scroll-snap cards with position indicator.
- Research-state warning is visible at the top of the page.

## Verification

- HTML card order equals manifest card order.
- Candidate SHA-256 values are unique.
- Candidate files resolve over local HTTP.
- Full `npm run check:g5-research`: **PASS** after the 16-card update (G1–G5 + privacy).
- G1: 12/12 PASS; G2: 5/5 PASS; G3: 9/9 PASS; G4: 16/16 PASS; G5 selection: 8/8 PASS; all G5 research validators PASS.
- Privacy violations: **0**.
- Approved/public output remains **C0001–C0005 only** with `external_publish_authorized=false`.
- Runtime snapshot remains `a1c474f884d64648`.
- Content snapshot remains `867d91c0737e29c7`.
