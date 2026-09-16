# NameOnMyMind — Content Research Workflow

Status: Editorial/research baseline

## 1. Principle

A public card is a projection of a richer internal research record. Research evidence, editorial judgment, and publishable content remain distinct layers.

## 2. Card Research Record

Each candidate should have a research record containing, as applicable:

- candidate/research ID
- target term and language
- source inventory
- lexical verification
- semantic claims
- claim-to-source mapping
- evidence locators
- cultural-context review
- cross-language comparison notes for ko/en/zh/ja
- pronunciation verification and source
- semantic relation candidates
- illustration brief
- editorial copy iterations
- cultural humility review
- approval status/change log

The public card JSON is generated only from approved parts of this record.

## 3. Candidate lifecycle

```text
CANDIDATE
→ RESEARCH
→ REVIEW
→ HOLD | REJECTED | APPROVED
→ PUBLISHED / REVISED
```

Evidence gaps remain HOLD rather than being filled with unsupported prose.

## 4. Five-card canary

The first canary is a set-level test. All five cards must satisfy the common evidence contract and jointly exercise:

- language/script diversity
- experience-type diversity
- at least one close semantic pair
- pronunciation complexity
- cultural-humility risk
- relation graph
- Human UI / WebMCP parity

Any unresolved gate keeps the set `NOT_READY`.

## 5. Human Editorial Release Checklist

Even after automated PASS, a human reviewer checks:

- poetic copy does not exceed the evidence;
- cross-language comparisons do not imply false one-to-one equivalence;
- cultural framing avoids exoticization or generalization;
- illustration leaves interpretive room and does not stereotype emotion;
- reflection question is optional-feeling, non-diagnostic, and low-pressure;
- verification/reference presentation is understandable;
- public/share assets contain no private reflection or local-state data.

## 6. Release rule

Automation may block publication. Automation does not grant final editorial approval. Human release review remains required.


## 7. Canonical Card Research Record template

Use the same template from the five-card canary through the 50-card MVP:

1. Candidate identity
2. Lexical verification
3. Semantic definition and boundaries
4. Cultural-context claims
5. ko/en/zh/ja comparison
6. Pronunciation verification
7. Claim–Source Map and Evidence Locators
8. Semantic relations
9. Illustration brief and alt-text draft
10. Editorial copy
11. Review checklist, state, and changelog

## 8. Fail-closed research triage

When a candidate cannot pass a gate, preserve the record and classify the reason rather than weakening the standard. Example states include `HOLD_LEXICAL`, `HOLD_SEMANTIC`, `HOLD_CULTURAL`, `HOLD_PRONUNCIATION`, `HOLD_COMPARISON`, `HOLD_RIGHTS`, `REJECTED_NOT_DISTINCT`, and `REJECTED_NOT_VERIFIABLE`.

A failed canary candidate may be replaced by a newly admitted candidate, but the failed record and reason remain available for screening lessons and audit.
