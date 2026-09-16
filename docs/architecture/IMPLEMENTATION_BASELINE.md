# NameOnMyMind — MVP Implementation Baseline

Status: Architecture baseline before feature implementation

## 1. Runtime target

The MVP remains a static GitHub Pages application.

- semantic HTML
- CSS custom properties and responsive layout
- vanilla JavaScript ES Modules
- static validated JSON
- PWA manifest + service worker
- WebMCP isolated behind an adapter

Do not introduce a SPA framework until product complexity demonstrates a concrete need.

## 2. Layering

```text
Validated content/data
        ↓
Domain functions
   ├─ Human UI
   └─ WebMCP adapter
        ↓
Browser / PWA
```

UI code must not become the canonical place for card semantics, filtering, recommendation rules, or evidence state.

## 3. Repository boundaries

Target layout:

```text
NameOnMyMind/
├── src/                    # application source
├── content/
│   └── approved/           # publishable approved editorial records
├── schema/                 # versioned data contracts
├── scripts/                # validation/build tools
├── public/                 # reproducible generated site/data bundle
├── docs/
│   └── architecture/
└── private/                # local-only notes/evidence/interviews; ignored by Git
```

`public/` is generated output, not editorial source-of-truth.

## 4. Card contract

Public card records use JSON Schema 2020-12. Stable concept IDs and explicit schema/concept versions are mandatory. Human UI and WebMCP should consume equivalent canonical card semantics.

## 5. Build gate

A publishable build must fail closed when any required contract is violated.

Minimum checks:
1. card schema validation;
2. unique stable IDs;
3. required references for published cards;
4. complete `ko/en/zh/ja` comparison package;
5. verification status and review date;
6. illustration, alt-text, and share-asset linkage;
7. valid relation targets;
8. no private/internal fields in public output;
9. Human UI ↔ WebMCP semantic parity regression;
10. PWA manifest/service-worker sanity checks.

The last valid public bundle remains authoritative when a new build fails.

## 6. Dependency posture

Prefer browser standards and small build-time utilities over runtime dependencies. Validation tooling may use a focused JSON Schema validator, but the browser app should not depend on the validation package at runtime.


## 7. Contract-first vertical slice

Implement the MVP in this order:

1. card schema + one verified sample card;
2. domain functions for card lookup, search, relations, and daily assignment;
3. Daily Card Shell v1;
4. canonical detail view + deep links;
5. search and local collection;
6. WebMCP adapter;
7. PWA/offline behavior;
8. share assets;
9. five-card canary;
10. scale toward the first validated 50-card collection.

The first milestone is not visual completeness. It is one end-to-end verified card working through data contract, human UI, and agent interface.

## 8. Design tokens

Use CSS custom properties as role-based design tokens for surfaces, ink, borders, accents, typography roles, spacing, radii, and motion. Components should not hard-code arbitrary visual values when a shared role token exists.


## 9. Five-card evidence canary

The first five production cards are selected for diversity and validation stress, not popularity alone. The set should exercise multiple language/experience types, at least one close semantic relation, non-Latin or pronunciation complexity, and at least one culturally easy-to-misrepresent expression.

Synthetic fixtures remain confined to tests. Human-facing demos, canaries, WebMCP public output, and published bundles use verified content only.


## 10. Set-level five-card canary gate

Treat the first five cards as one release canary. Promotion requires all five cards and their shared flows to pass schema, evidence, pronunciation, cultural review, relation integrity, UI-Agent parity, privacy leakage, and asset linkage checks. Partial card success does not make the canary ready.

Automated checks do not replace final human editorial release review.


## 11. Canary replacement discipline

The canary target is five fully verified cards, not five preselected names. If a candidate fails a non-negotiable evidence, rights, pronunciation, semantic, or cultural gate, preserve its explicit HOLD/REJECTED state and admit a replacement candidate. Never reduce the gate to preserve the original shortlist.
