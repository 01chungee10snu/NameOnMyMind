# NameOnMyMind Level 1 + School-Age Evidence V5 QA

- Date: 2026-09-22
- Scope: complete Level 1 lexical verification, separate school-age evidence axis, school-age filter/search UX, public evidence staging
- New image generation: **NONE**
- Image production policy remains: Ego Lite → authenticated Google session → Gemini or Flow → Nano Banana path; non-Google/Codex generation fallback-only.
- Public product cards remain: **C0001–C0005**

## Before / After

| Metric | Before | Current |
| --- | ---: | ---: |
| Korean expressions | 151 | 151 |
| SOURCE_VERIFIED | 51 | **77** |
| DISCOVERY_ONLY | 100 | **74** |
| Level 1 terms | 38 | 38 |
| Level 1 verified | 12 | **38 / 38** |
| Verified contrast sets | 16 | **16 / 16** |
| Grade 3–6 direct research links | 0 structured | **21** |
| Grade 3–6 related-form links | 0 structured | **1** |

## Level 1 lexical evidence

Evidence snapshot:
- `content/korean-expression/evidence/level1-source-v1.json`
- ID: `KOREAN_LEVEL1_LEXICAL_EVIDENCE_V1_2026-09-21`
- Newly audited Level 1 expressions: **26**
- Provider: National Institute of Korean Language Basic Korean Dictionary

Exact-headword evidence is preferred. Phrase/collocation evidence is explicitly marked for:
- `마음이 놓이다` → headword `놓이다`
- `마음이 상하다` → headword `상하다`
- `가슴이 두근거리다` → headword `두근거리다`
- `짜증이 나다` → headword `짜증`

Canonical cleanup:
- old exploratory form: `짜증나다`
- canonical app form: **`짜증이 나다`**
- evidence: KRD ParaWordNo 71579

## School-age evidence

Evidence snapshot:
- `content/korean-expression/evidence/school-age-v1.json`
- Evidence ID: `KICCE:2026:PR2012`
- KCI article ID: `ART003331358`
- DOI: `10.5718/kcep.2026.20.1.29`

Source:
김도형. (2026). 학령기 아동의 감정 측정을 위한 정서 어휘 선정 및 군집구조 분석: 3~6학년을 대상으로. *육아정책연구, 20*(1), 29–52. https://doi.org/10.5718/kcep.2026.20.1.29

Source boundaries verified from the paper:
- participants: elementary grades 3–6
- 2016 analyzed N=233; 2025 analyzed N=133
- lower grades excluded due to self-report reliability / mixed-emotion comprehension considerations
- convenience sampling and unbalanced grade/sex distribution require cautious generalization
- preliminary vocabulary: 16 positive + 12 negative terms

This evidence is **not** treated as a pass/fail age-suitability rating.

## Learning profile contract

Every one of the 151 terms now has:
- `lexical_depth`: BASIC / EXPANDED / NUANCED
- `school_age_evidence`: GRADE_3_6_SUPPORTED / GRADE_3_6_RELATED_FORM / LEXICAL_ONLY / AGE_REVIEW_REQUIRED
- `evidence_refs`
- `school_age_source_form`

Current school-age distribution:
- GRADE_3_6_SUPPORTED: **21**
- GRADE_3_6_RELATED_FORM: **1**
- LEXICAL_ONLY: **56**
- AGE_REVIEW_REQUIRED: **73**

## UI changes

Korean emotion map:
- added `3–6학년` filter
- filter only includes direct or related-form research links
- UI explicitly states this does not establish grades 1–2 suitability
- term cards show the research label when applicable
- selected-term status shows lexical and school-age evidence scopes separately
- evidence JSON can be opened from the UI

Main Discover:
- summary now shows **근거 연결 77개**
- summary now shows **3–6학년 연구 연결 22개**
- added a direct entry to the school-age-filtered map
- Korean research search metadata shows `3–6학년 연구` or `3–6학년 관련형`

## Browser verification

Main Discover:
- verified count 77: PASS
- school-age linked count 22: PASS
- school-age entry link: PASS
- foreign research cards remain 16: PASS

School-age filter, KF01:
- school-age filter pressed: PASS
- rendered term cards: 5
- grade 3–6 label visible: PASS
- grades 1–2 boundary visible: PASS
- evidence link visible: PASS

Search `짜증`:
- canonical `짜증이 나다`: PASS
- old `짜증나다`: absent
- `3–6학년 관련형` label: PASS

Public evidence routes:
- `content/korean-expression/evidence/school-age-v1.json`: HTTP 200
- `content/korean-expression/evidence/level1-source-v1.json`: HTTP 200

## Regression

- G1: 12/12 PASS
- G2: 5/5 PASS
- G3: 9/9 PASS
- G4: 17/17 PASS
- G5 editorial selection: 9/9 PASS
- G5 research validators: PASS
- Korean expression validator: PASS
- Korean emotion-map validator: PASS
- Privacy violations: 0
- Public product card set: C0001–C0005 only

## Mobile evidence

- `discover-390x844.png`
- `school-filter-390x844.png`
- `search-annoyance-390x844.png`
- viewport: 390×844
