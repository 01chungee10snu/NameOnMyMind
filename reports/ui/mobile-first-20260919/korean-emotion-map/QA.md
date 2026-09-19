# Korean Emotion Map Mobile Prototype QA

- Date: 2026-09-19
- Prototype: `prototypes/korean-emotion-map-20260919/index.html`
- Target viewport: 390×844
- Status: **LOCAL RESEARCH PROTOTYPE**
- Product publication authorized: **NO**

## Content coverage

- Emotion families: 22
- Korean expressions: 151
- Contrast sets: 16
- Source-verified terms: 30
- Discovery-only terms: 121
- Source-verified contrast sets: 7
- Learning levels: 1 / 2 / 3

## Learning flow

1. 감정 영역 고르기
2. 가까운 말 펼치기
3. 비슷한 말 비교하기
4. 자기 문장으로 말하기

## Safety / pedagogical boundary

- No diagnosis or personality labeling.
- No normal/abnormal emotion scoring.
- No punitive language-policing.
- Difficult/formal/literary words are not framed as superior to everyday words.
- Discovery-only terms are visibly labeled as research candidates.
- The user may skip a feeling or change the selected expression freely.

## Rendering verification

- Local prototype HTTP: 200
- Emotion-map JSON HTTP: 200
- Mobile viewport screenshot: `preview-390x844.png`
- Responsive max width: 540px
- Default family: 관계의 상처
- Default selected expression: 서운하다

## Evidence boundary

`SOURCE_VERIFIED` entries must resolve through:
- existing NameOnMyMind Korean source-first research records, or
- official National Institute of Korean Language dictionary evidence.

Evidence registry:
`content/korean-expression/evidence/registry.json`

## Publication boundary

This prototype has not been staged into the GitHub Pages artifact. It must not be treated as a released child-learning product until the remaining discovery terms and contrast cues are reviewed.
