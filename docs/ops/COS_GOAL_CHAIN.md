# NameOnMyMind — COS Goal Chain

Status: canonical local development orchestration contract

## Purpose

Chat On Steroids (COS) is the development/orchestration controller for NameOnMyMind. The product runtime itself remains an independent static web/PWA application and must not depend on COS.

The chain runs in **Goal** mode, not infinite Loop mode. A single durable objective contains gated phases. COS advances to the next phase only after the current phase's exit criteria pass.

## Workspace

`/Users/01chungee10/Github/NameOnMyMind`

## Goal chain

### Goal 1 — Verified 1-card vertical slice

Deliver one real, evidence-verified card end-to-end.

Exit criteria:
- repository boundaries established (`src/`, `content/approved/`, `schema/`, `scripts/`, `public/`, `tests/`, `private/`)
- versioned card/reference/asset contracts exist and validate
- one real Card Research Record reaches approved state
- one public card passes schema/evidence/pronunciation/cultural/rights gates
- domain functions support card lookup and deterministic daily assignment
- Daily Card Shell and canonical detail/deep-link work locally
- `get_card` and `get_daily_card` WebMCP adapter paths use the same domain semantics
- private reflection/interview data does not enter public output
- focused tests pass from a clean checkout

### Goal 2 — Core human experience

Complete the human-facing MVP flows around the verified content contract.

Exit criteria:
- `오늘의 마음 / 찾아보기 / 내가 만난 마음` navigation works
- deterministic daily card freeze works across same-day returns
- compact reveal → detail reading flow works
- keyword/tag/semantic guided discovery works without diagnostic framing
- favorites/viewed collection and local-only reflection work
- similar/contrast relationships and stable deep links work
- accessibility baseline passes, including keyboard, reduced-motion, non-color-only meaning, and alt-text behavior
- regression tests pass

### Goal 3 — Agent/PWA parity

Complete progressive-enhancement agent and offline layers without changing domain semantics.

Exit criteria:
- public machine-readable card/reference/relations data are versioned
- project-specific `agent-manifest.json` exists
- read-mostly WebMCP tools are registered behind an adapter
- Human UI ↔ WebMCP semantic parity tests pass
- reflection body is not exposed by default to agents
- PWA manifest/service worker/cache versioning work
- graceful offline fallback and freshness signaling work
- prebuilt stable share asset path works
- contract/conformance tests pass

### Goal 4 — Five-card evidence canary

Produce a diverse, fully verified five-card set and run the whole product pipeline against it.

Exit criteria:
- 5/5 schema PASS
- 5/5 minimum evidence PASS
- 5/5 IPA + pronunciation provenance PASS
- 5/5 cultural humility review PASS
- 5/5 ko/en/zh/ja comparison package PASS
- set includes language/script and experience-type diversity plus at least one close semantic pair
- relation graph integrity PASS
- Human UI ↔ WebMCP parity PASS
- public/private leakage = 0
- Human Editorial Release Checklist PASS for all five

A failed candidate is preserved as HOLD/REJECTED with reason and replaced by a newly admitted candidate. Gates are never reduced to preserve the original shortlist.

### Goal 5 — 50-card deploy-ready MVP

Scale only after the five-card canary passes.

Exit criteria:
- 50 cards reach PUBLISHED/REVISED under the same locked contracts
- all 50 have traceable Research Records and registry-first references
- diversity matrix remains within editorial targets
- semantic graph/search/daily selection operate across all 50
- references/assets/public bundle are reproducible from approved source
- automated full quality gate PASS
- Human Editorial Release Checklist PASS
- local production build and clean-checkout regression PASS
- deploy-ready artifact and release notes exist

**Deployment/push is not authorized by this chain.** GitHub push, Pages publication, domain changes, or external release require separate explicit user authorization.

## Advancement policy

At every COS iteration:
1. read the current chain state and authoritative architecture/contracts;
2. determine the first incomplete goal;
3. identify the highest-value currently actionable blocker inside that goal;
4. make the smallest coherent change needed;
5. test/validate it;
6. update immutable/auditable goal state;
7. if the goal exit criteria all pass, mark it COMPLETE and automatically proceed to the next goal;
8. do not work on a later goal if an earlier goal has an unresolved contract or evidence failure.

## Fail-closed rules

Stop automatic advancement and record a blocker when:
- a genuine schema/product-contract conflict cannot be resolved from the 126 approved interview decisions;
- reliable lexical/scholarly/pronunciation/rights evidence is unavailable for a candidate and no valid replacement is currently available;
- an action needs credentials, MFA/CAPTCHA, external publication, paid purchase, or another explicit user authorization;
- a change would require weakening evidence/privacy/accessibility/cultural-review gates;
- current workspace state is inconsistent or another active process would cause duplicate work.

Do not invent evidence, citations, pronunciation, rights, approval, test results, or publication state.

## Product boundaries

- COS governs development; COS is not a runtime dependency.
- Runtime stays standards-first static HTML/CSS/ES Modules/PWA unless a demonstrated need justifies change.
- Human UI and WebMCP share one domain logic layer.
- Personal reflection stays local-first and private by default.
- Public content is evidence-based and citation-rich/copyright-minimal.
- Private interview/evidence notes remain outside the public bundle.
- AI can draft/fix; human editorial review remains required for publication readiness.

## Completion

The durable COS Goal is complete when Goal 5 exit criteria pass locally and the repository is deploy-ready, or when a fail-closed blocker requires explicit human action. It must not create busy-work after either condition is reached.
