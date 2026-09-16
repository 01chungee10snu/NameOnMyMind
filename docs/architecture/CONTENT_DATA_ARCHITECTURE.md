# NameOnMyMind — Content & Data Architecture

Status: Product architecture baseline

## 1. Purpose

NameOnMyMind separates rigorous editorial evidence from the quiet card experience shown to users. The public site is a validated static projection of a richer private editorial source.

```text
Private Editorial Source
        ↓
Schema / Evidence / Cultural / Rights validation
        ↓
Deterministic Public Build
        ↓
GitHub Pages + WebMCP / machine-readable access
```

## 2. Public data layout

Target shape:

```text
public/data/
├── manifest.json
├── cards-index.json
├── cards/
│   ├── C0001.json
│   └── ...
├── references.json
└── relations.json
```

### Stable per-card documents

- `card_id` identifies a stable concept, not a file revision.
- Each public card JSON follows the same canonical schema used by the WebMCP `get_card` tool.
- Card concept versions may change while the stable card ID remains the same unless the underlying concept identity was wrong.

## 3. Reference Registry

The canonical bibliography is structured rather than stored only as rendered APA text.

- Stable `reference_id`, e.g. `R0001`
- CSL-JSON-compatible bibliographic fields where applicable
- DOI / ISBN / URL and other identifiers
- APA 7 rendering is derived from canonical metadata
- Claim-to-source mappings and evidence locators are modeled separately from bibliography records

This supports later Zotero, BibTeX, or CSL interoperability without making any one external tool mandatory.

## 4. Claim and evidence separation

A card can contain multiple kinds of text:

- verified definition
- cultural/usage claims
- cross-language comparison
- poetic/editorial line
- reflection question

Poetic/editorial text must never be mistaken for the verified definition. Claims should retain machine-readable links to supporting references and evidence locators.

## 5. Asset Provenance Registry

Illustrations and pronunciation audio are versioned assets independent from the stable card concept.

Recommended internal metadata:

- `asset_id`
- `card_id`
- `asset_type`
- `source_or_generation_method`
- `creator_or_model`
- `license_or_rights_basis`
- `created_at`
- `reviewed_at`
- `human_review_status`
- generation/prompt version for AI-assisted assets where useful
- source/pronunciation provenance where applicable

Internal prompts, reviewer notes, and other non-public production metadata do not belong in the public bundle.

## 6. Reproducible validated build

The public site is generated only from approved inputs.

```text
approved editorial records
+ schemas
+ reference registry
+ approved assets
        ↓
validation
        ↓
deterministic build
        ↓
public bundle
        ↓
BUILD_MANIFEST.json
```

The build manifest should record enough version/hash information to identify the exact input contract and published snapshot. A failed build must not replace the last valid public bundle.

## 7. Privacy boundary

Private reflections are not editorial source data and are not inputs to the public build. They remain local-first and outside ordinary WebMCP output unless the user explicitly requests access.

## 8. Rights boundary

Public evidence is citation-rich and copyright-minimal. Bibliographic metadata and evidence locators may be exposed, but copyrighted source text, long dictionary definitions, private reviewer notes, and internal excerpts are not automatically copied into public JSON.


## 9. Localization boundary

UI localization and semantic comparison are separate layers.

- Preserve the original-language term in every locale.
- Localize navigation, labels, explanatory chrome, and accessibility UI independently.
- Keep `ko`, `en`, `zh`, and `ja` comparison records as semantic content rather than UI translations.
- Never fill an unverified semantic comparison with opportunistic machine translation.
- Use explicit fallback locales when a UI translation is missing.


## 10. Registry-first evidence workflow

Sources are registered before cards reference them. Assign stable reference IDs, normalize bibliographic identifiers, attach claim-level evidence locators, and derive APA 7 display text from structured metadata. Avoid repeating manually edited citation strings across cards.

## 11. Pronunciation publication contract

Published/revised cards require both:
- verified IPA in the term record;
- a pronunciation audio asset with source/provenance in the asset registry.

If trustworthy pronunciation evidence is unavailable, the card remains DRAFT/HOLD rather than shipping with an unverified substitute.
