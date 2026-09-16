# G5 Editorial Selection Contract — foreign semantic-gap first

Status: **LOCKED FOR G5 ADMISSION**
Date revised: 2026-09-17

## Product identity

NameOnMyMind primarily discovers **emotion, feeling, mood, psychological-state, and relational-experience expressions in other languages that Korean usually needs a longer phrase or explanation to render without losing important meaning**.

The product is not a catalogue of generic foreign emotion words and it is not a Korean-emotion dictionary. Korean nuanced terms remain a small reciprocal anchor that helps show that every language lexicalizes experience differently.

`envy` (C0004) and `幸福` (C0005) remain auditable G4 canary records, but they are planned retirements from the final active G5 collection because ordinary Korean `질투/부러움` and `행복` already provide close everyday lexical coverage.

## Final active-50 composition

The final active set targets:

- **45 foreign-language semantic-gap cards**
  - existing: C0001 `saudade`, C0002 `Sehnsucht`, C0003 `Schadenfreude`
  - new: **42 foreign cards**, reserved from C0016 onward
- **5 Korean nuance anchor cards**
  - C0006 `서운하다`
  - C0007 `아쉽다`
  - C0008 `섭섭하다`
  - C0009 `뿌듯하다`
  - C0010 `뭉클하다`

C0011–C0015 are preserved as **SECONDARY_RESEARCH_ONLY** Korean records. They are useful evidence but are not part of the final active-50 target.

Thus the final target is:

`C0001-C0003 + C0006-C0010 + 42 verified foreign semantic-gap cards = 50 active cards`.

Card IDs that already have auditable research history are never silently reassigned. C0011-C0015 remain reserved to their Korean research records; new foreign card IDs begin at C0016.

## Foreign semantic-gap admission gate

A non-Korean candidate enters G5 research only when all are true:

1. **Lexical reality** — an authoritative source-language dictionary or equivalent lexical authority confirms the term and relevant sense.
2. **Actual emotion/experience construct** — the target sense denotes a feeling, mood, psychological state, relational experience, or tightly coupled experiential state rather than merely an activity, object, aesthetic label, or personality trait.
3. **Korean Expression Cost** — ordinary Korean does not offer one common word that preserves the same central semantic package.
4. **Semantic residue** — at least one important component remains after giving the nearest Korean expression(s), and the residue is supported by direct lexical, corpus, or scholarly evidence.
5. **Usage boundary** — archaic, literary, regional, clinical, spiritual, or culture-specific usage is explicitly fenced when applicable.
6. **Pronunciation and rights** — IPA/pronunciation provenance and product-safe audio rights pass before REVIEW_READY.
7. **Cross-language comparison** — KO/EN/ZH/JA nearest expressions are presented as overlap + difference, never flat translations.
8. **Cultural humility** — no national-character essentialism and no claim that speakers of other languages cannot feel the experience.

## Korean Expression Cost

Each foreign candidate is classified before card admission:

- `ONE_WORD_EQUIVALENT` — one common Korean word captures the central meaning with little residue → **REJECTED_GENERIC_EQUIVALENT**.
- `SHORT_PHRASE_PARTIAL` — Korean has a short phrase, but it loses a material semantic component → eligible if residue is directly evidenced.
- `EXPLANATORY_PHRASE_REQUIRED` — a natural Korean rendering needs multiple semantic components or a sentence-like explanation → **priority candidate**.
- `UNCLEAR` — evidence is insufficient → HOLD.

The test is semantic, not word-count theatre. An artificially long Korean paraphrase cannot manufacture distinctiveness.

Examples of strong candidate shapes include:

- `Geborgenheit`: being protected, emotionally secure, warm, accepted, and safely held in a place/relationship;
- `Fernweh`: longing directed toward faraway or even unknown places;
- `切ない`: a chest-tightening, painful poignancy involving sadness/longing and an ideal–reality gap;
- `委屈`: hurt/grievance rooted in being treated unfairly, misunderstood, or unable to vindicate oneself;
- `舍不得`: reluctance to part with, give up, or let go of someone/something one values.

These examples remain candidates until their own source-first gates pass.

## Discovery sources vs publication evidence

Cross-cultural lexicographies and community lists may be used to discover candidates. They never substitute for target-language lexical verification. Lomas-style cross-cultural lexicography is treated as a research map, not a publication authority for the final card definition.

For each card, publication still requires:

- authoritative target-language lexical source >= 1;
- scholarly source >= 1 materially relevant to the construct/semantic boundary;
- direct extra evidence for cultural claims;
- corpus/usage evidence when modern usage is claimed;
- pronunciation provenance and rights;
- KO/EN/ZH/JA comparison trace;
- Human Editorial Release.

## Korean anchor policy

The five Korean anchor cards exist to demonstrate reciprocity: Korean also lexicalizes shades that other languages distribute differently. They must not expand into the dominant content track during G5.

C0011-C0015 are retained only as secondary research because they were already source-first structured before this correction. They do not consume final active slots.

## Public wording rule

Never say:

> “This word cannot be translated.”

or

> “Only people from X culture feel this.”

Prefer:

> “한국어에서는 보통 여러 표현으로 나누어 설명하는 마음”

or

> “가까운 한국어 표현은 있지만, 이 단어가 한데 묶는 의미가 조금 더 남아 있어요.”

Then show the nearest Korean terms and the evidenced residue.

## G5 final-release cutover

Before G5 Human Release, C0004/C0005 remain PUBLISHED only to preserve the verified G4 canary baseline. At final cutover:

1. preserve C0004/C0005 card, Research Record, Human Release, and G4 evidence as historical audit material;
2. retire C0004/C0005 from the active/public projection through a versioned retirement artifact, never deletion;
3. keep C0011-C0015 as non-public secondary research only;
4. promote exactly the five Korean anchors C0006-C0010 and 42 Human-approved foreign semantic-gap cards beginning at C0016;
5. verify **45 foreign + 5 Korean = 50 active cards**;
6. run full clean-checkout regression before G5 COMPLETE.
