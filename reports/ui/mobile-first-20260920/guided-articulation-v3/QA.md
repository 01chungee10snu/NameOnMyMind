# NameOnMyMind Guided Articulation V3 QA

- Date: 2026-09-20
- Scope: situation → verified comparison → candidate expression → self-expression
- New image generation: **NONE**
- Public product cards remain: **C0001–C0005**
- Korean emotion map remains a research surface.

## Product change

The Korean emotion map now includes a guided articulation flow before the full 22-family map:

1. User may optionally write a situation.
2. App shows evidence-linked contrast questions by default.
3. User chooses the comparison question that feels closest.
4. App shows 3–4 candidate expressions with the existing contrast cues.
5. User chooses a provisional expression.
6. The selected expression is carried into the existing family/term/contrast/self-sentence flow.
7. The user may change the term at any time.

The app does **not** classify or diagnose the user from their free text.

## Default evidence boundary

- Verified contrast sets shown by default: **7**
  - KC001
  - KC002
  - KC003
  - KC004
  - KC007
  - KC009
  - KC014
- Research-draft comparison sets require an explicit “연구 중 비교도 보기” opt-in.
- The opt-in does not promote those sets to verified status.

## Privacy boundary

- Situation entry is optional.
- Situation text is not written to localStorage.
- Situation text is not written to the URL.
- Situation text exists only in current page memory and may be copied into the self-expression textarea for the current session.

## Browser verification

URL:
`/prototypes/korean-emotion-map-20260919/?guide=1&compare=KC004`

Observed:
- verified guide sets: 7
- KC004 choice buttons: 3
- selected comparison: 불안하다 · 조마조마하다 · 초조하다
- research-draft toggle default: false
- non-diagnostic wording visible: PASS
- “선택 사항 · 저장하지 않음” visible: PASS
- app Discover → guided articulation link: PASS
- existing 16 foreign research cards remain visible in Discover: PASS

## Mobile evidence

- Screenshot: `guide-anxiety-390x844.png`
- Viewport: 390×844

## Regression

- `git diff --check`: PASS
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
- Pages guided-articulation publication gate: PASS
- Public product card set: C0001–C0005 only

## Learning principle

The guide offers distinctions and questions; it does not decide what the user feels. The final expression remains the user's own provisional choice.
