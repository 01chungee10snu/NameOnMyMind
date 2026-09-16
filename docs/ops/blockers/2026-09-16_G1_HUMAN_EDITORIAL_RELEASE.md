# G1 Blocker — Human Editorial Release Required

Status: `FAIL_CLOSED / HUMAN_ACTION_REQUIRED`
Date: 2026-09-16
Goal: G1 — Verified 1-card vertical slice
Card: `C0001` (`saudade`)

## Why automation stopped

The G1 implementation has reached the human editorial boundary. The canonical content workflow requires a human editorial release review before a card can move from validated review material into public `PUBLISHED/REVISED` state. Automation is not authorized to manufacture that approval.

Accordingly:

- `content/review/cards/C0001.json` remains `REVIEW_READY`;
- `content/review/research-records/C0001.json` keeps `human_editorial_release.status = PENDING`;
- no `content/approved/cards/C0001.json` has been created;
- no public deployable bundle has been generated;
- `scripts/build-public.mjs` fails closed while no human-released public card exists;
- G2 admission is blocked because G1 is not COMPLETE.

## Machine-actionable work completed before stop

- repository layer separation implemented;
- versioned card/reference/asset/research-record contracts implemented;
- source-first real `saudade` research record prepared;
- lexical, scholarly, pronunciation, cultural-humility, rights and privacy gates implemented and validated;
- real pronunciation audio provenance and license metadata recorded;
- deterministic card lookup/daily assignment implemented;
- local Daily Card Shell and stable `?card=C0001#meaning` detail path implemented;
- Human UI and `get_card` / `get_daily_card` share the same domain module;
- local review preview generated with `deployable=false`;
- private-leakage scan passed with zero violations;
- focused G1 regression passed 10/10;
- clean-checkout regression passed from commit `78ec4ff` with npm audit 0 vulnerabilities.

## Human review required

A human reviewer must explicitly review the release checklist for `C0001`, including:

1. whether the poetic line exceeds the evidence;
2. whether ko/en/zh/ja comparisons could be mistaken for one-to-one translations;
3. whether cultural framing exoticizes or overgeneralizes Portuguese-speaking contexts;
4. whether the illustration over-determines the experience or stereotypes it;
5. whether the reflection question feels optional, low-pressure and non-diagnostic;
6. whether verification/reference presentation is understandable;
7. whether share/public assets contain no private/local-state material.

Only an explicit human approval may change the research record to `APPROVED`, promote the card to `PUBLISHED`, and allow the public build path to open.

## Safety state

- external publish authorized: `false`
- repository push authorized: `false`
- GitHub Pages publication: not performed
- domain mutation: not performed
- credentials/MFA handling: not performed
- G2/G3/G4/G5: not started
