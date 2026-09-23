# NameOnMyMind Korean Learning Simple V20 QA

- Date: 2026-09-24
- Scope: simplify the child-facing Korean daily learning page after direct user feedback
- Public alias: `/learn/`
- Viewport: **390×844**
- New image generation: **NONE**

## Design correction

Removed from the primary child-facing surface:
- daily-pool count
- SOURCE_VERIFIED / verification-state wording
- 151/151 badge
- lexical depth labels
- emotion-family explanation block
- research/school-age metadata
- long instructional paragraphs
- always-visible 151-term catalog

Primary flow is now only:

1. 오늘의 마음말
2. 뜻
3. 비슷한 말
4. 내 문장

Other-word search and evidence source are collapsed by default.

## 2026-09-24 render

- daily expression: **고요하다**
- meaning: **시끄럽거나 어지럽지 않고 조용하다.**
- similar words:
  - 평온하다 — 걱정이나 탈이 없고 조용하다.
  - 느긋하다 — 서두르지 않고 마음의 여유가 있다.
  - 포근하다 — 느낌이나 분위기가 보드랍고 따뜻하여 편안하다.
- reflection prompt: **오늘 있었던 일에 이 말을 한 번 써보세요.**
- privacy copy: **여기에 쓴 글은 저장되지 않아요.**

## Meaning data

New public data:
- `content/korean-expression/simple-meanings-v1.json`
- total: **151 / 151**
- source-definition wording: **145**
- concise editorial simplification grounded in existing verified research: **6**
- missing meanings: **0**

The current `고요하다` meaning is the National Institute of Korean Language Basic Korean Dictionary definition associated with `KRD:18788`.

## Regression guards

Automated tests now require the page to contain:
- `오늘의 마음말`
- visible `뜻`
- `비슷한 말`
- `내 문장`
- collapsed `다른 마음말 찾기`
- `simple-meanings-v1.json`
- no localStorage use

Automated tests reject reintroduction of:
- `오늘의 학습 풀`
- `151/151`
- `근거 연결`

## Browser QA

Local HTTP render: **PASS**

Verified hydrated DOM:
- `고요하다`: PASS
- `시끄럽거나 어지럽지 않고 조용하다.`: PASS
- `비슷한 말`: PASS
- `내 문장`: PASS
- internal metadata clutter absent: PASS

Screenshot:
- `learn-390x844.png`
- dimensions: **390×844**

## Product boundary

- no emotion diagnosis
- no score or right/wrong judgment
- sentence input is not persisted
- sentence input is not transmitted
- evidence source remains available only under collapsed `뜻 출처`
