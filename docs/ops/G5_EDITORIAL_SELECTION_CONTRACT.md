# G5 Editorial Selection Contract — semantic distinctiveness first

Status: **LOCKED FOR G5 ADMISSION**
Date: 2026-09-16

## Product-selection correction

The G4 canary proved the evidence/runtime pipeline, but a technically valid card is not automatically a strong final editorial choice.

`envy` (C0004) and `幸福` (C0005) remain valid auditable G4 canary records because they passed the agreed machine and Human Editorial Release gates. Their evidence must not be erased or rewritten. **However, they are canary-only records and are not counted toward the final G5 active 50-card editorial collection.** They remain in the current local public canary until G5 release cutover; after 47 new cards pass every gate and Human Editorial Release, C0004/C0005 are retired from the active/public set while their audit records are preserved.

## New G5 admission principle

The final collection prioritizes **fine-grained lexicalized experiences that reveal a meaningful semantic gap across languages**.

### A. Korean-source cards

A Korean term may enter G5 research when all are true:

1. It expresses a meaningful emotional, feeling, mood, psychological-state, or relational-experience distinction.
2. Its ordinary Korean use contains a nuance that is not cleanly captured by one ordinary English/Chinese/Japanese word in every context.
3. The nuance can be verified from authoritative Korean lexical evidence and scholarly/empirical literature without claiming that only Koreans can feel it.
4. Cross-language comparison explains overlap **and** residual difference rather than declaring the term “untranslatable.”

Priority examples for research include `서운하다`, `아쉽다`, `억울하다`, `뿌듯하다`, `후련하다`, `찜찜하다`, `먹먹하다`, `착잡하다`, `허전하다`, `아련하다`, `애틋하다`, `울컥하다`, `막막하다`, `안쓰럽다`, `시원섭섭하다`, `섭섭하다`, `설레다`, `답답하다`, `민망하다`, `뭉클하다`, `짠하다`, `멋쩍다`, `개운하다`, `씁쓸하다`.

`정`, `한`, `눈치` are **high-risk research candidates** because cultural-generalization and construct-boundary claims can easily exceed the evidence. They may not be admitted merely because they are commonly described as “Korean concepts.”

### B. Non-Korean-source cards

A non-Korean term may enter G5 research only when the nearest Korean expression is demonstrably **partial rather than effectively equivalent**.

Reject or strongly deprioritize a candidate when:

- a common Korean word maps to it with little material semantic residue;
- the only reason for inclusion is that the spelling/language is foreign;
- the concept is merely a basic emotion category already ordinary in Korean (`행복`, `슬픔`, `두려움`, `분노`, `기쁨`, `질투/부러움` etc.);
- “untranslatable” or national-character rhetoric is doing the work instead of evidence.

Priority foreign research candidates include concepts such as `Geborgenheit`, `Fernweh`, `Weltschmerz`, `Vorfreude`, `dépaysement`, `morriña`, `gezelligheid`, `vemod`, `hiraeth`, `hüzün`, `viraha`, `委屈`, `惆怅`, `舍不得`, `心疼`, `欣慰`, `懐かしい`, `切ない`, `もどかしい`, `甘え`, and similar candidates **only if source-first verification passes**.

## Composition target

Because two G4 cards are canary-only planned retirements, G5 requires **47 new editorial cards** so the final active collection still contains exactly 50 cards. The research queue should aim for approximately:

- **20 Korean nuanced terms/expressions**
- **27 non-Korean terms with a material Korean one-word gap**

This is an editorial diversity target, not permission to weaken evidence. If a term fails lexical, scholarly, pronunciation, rights, comparison, cultural-humility, or Human Editorial Release gates, it is replaced rather than forced through.

## Distinctiveness gate

Every new Research Record must include an internal `distinctiveness_review` answering:

- Why is this more than a generic/basic emotion label?
- What is the nearest Korean expression (for foreign terms), or nearest EN/ZH/JA expression (for Korean terms)?
- What semantic/pragmatic residue remains after that comparison?
- Which sources directly support the residue?
- What overclaim must the public copy avoid?

Status is `PASS`, `HOLD`, or `REJECTED_GENERIC_EQUIVALENT`.

## Public wording rule

Never say:

> “Koreans are the only people who feel X”

or

> “This word cannot be translated.”

Prefer:

> “한 단어로 완전히 겹치지는 않는 표현”

and show the nearest terms plus the remaining difference.

## G5 final-release cutover

Before G5 Human Release, C0004/C0005 remain PUBLISHED only to preserve the already-verified G4 canary and regression baseline. After C0006-C0052 have all passed machine gates and explicit Human Editorial Release, the release cutover must:

1. preserve C0004/C0005 card, Research Record, Human Release, and G4 evidence as immutable historical audit material;
2. remove C0004/C0005 from the active `content/approved/cards` projection through a versioned retirement artifact, not deletion;
3. promote the 47 new cards;
4. verify that the active/public bundle contains exactly 50 cards: C0001-C0003 plus C0006-C0052;
5. run full clean-checkout regression before G5 COMPLETE.
