# NameOnMyMind Korean Learning Page V19 QA

- Date: 2026-09-23
- Scope: user-facing mobile Korean learning page
- Public alias: `/learn/`
- Prototype source: `prototypes/korean-daily-learning-20260923/index.html`
- Target viewport: **390×844**
- New image generation: **NONE**

## Page flow

1. 오늘의 한국어 마음말
2. 감정 영역 설명
3. 비슷한 말 비교
4. 오늘의 한 문장
5. 151개 마음말 탐색

## Current-day render

Local date: **2026-09-23**

- selected pool: `KOREAN_DAILY_VERIFIED_V1_2026-09-22`
- pool size: **116**
- daily expression: **난처하다**
- family: **부끄러움·자기의식**
- depth: **확장**
- lexical evidence: **KRD:40743**
- comparison set: **부끄럽다 · 민망하다 · 쑥스럽다 · 멋쩍다**

## Browser QA

Local HTTP route:
- `http://127.0.0.1:8127/public/prototypes/korean-daily-learning-20260923/`: **HTTP 200**

Hydrated DOM verified:
- `난처하다`: **PASS**
- `116개 검증 표현`: **PASS**
- `부끄럽다 · 민망하다 · 쑥스럽다 · 멋쩍다`: **PASS**
- `151개 마음말`: **PASS**
- 12 / 151 initial explorer count: **PASS**
- `공식 어휘 근거 보기`: **PASS**
- official KRD id `40743`: **PASS**
- reflection input does not use localStorage: **PASS**
- explicit no-save/no-send framing: **PASS**

Successful screenshot:
- `learn-http-390x844.png`
- dimensions: **390×844**

## Evidence-link privacy boundary

An initial implementation attempted to fetch the full internal `evidence/registry.json`, which is not part of the public research stage because it may contain local research-record paths.

Repair:
- removed public dependency on the internal registry
- KRD evidence links are derived only from public `KRD:<id>`
- Standard Dictionary evidence links are derived only from public `STD:<id>`
- unknown/non-official evidence types do not expose a link

Result:
- no internal evidence registry was newly published
- current `난처하다` official link resolves from `KRD:40743`

## Product boundaries

- page does not diagnose emotion
- no score or correct/incorrect judgment
- text reflection is not saved locally
- text reflection is not transmitted
- current daily assignment remains controlled by immutable date-effective daily pools
- Korean learning page remains inside the authorized research-preview boundary

## Entry points

- direct alias: `/learn/`
- main app Korean research section: `오늘의 마음말 한 화면에서 해보기`
- full Korean map remains available separately at `/korean/`
