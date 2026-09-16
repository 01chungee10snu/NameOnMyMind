# NameOnMyMind — WebMCP Agent Interface Architecture

_Last reviewed: 2026-09-16_

## Purpose

NameOnMyMind should be understandable and operable by both humans and AI agents.
The site therefore treats WebMCP as a first-class **agent interface layer**, while keeping the human UI fully functional without WebMCP.

## Current standards position

As of 2026-09-16, WebMCP is a W3C Web Machine Learning Community Group draft. The current browser-side surface is based on `document.modelContext` and structured tools registered with the imperative API. Browser support remains experimental/origin-trial territory, so WebMCP must be implemented as progressive enhancement rather than as a hard runtime dependency.

Primary references:

- https://webmachinelearning.github.io/webmcp/
- https://developer.chrome.com/docs/ai/webmcp/imperative-api
- https://developer.chrome.com/docs/ai/webmcp/secure-tools

## Core design

```text
                         ┌─────────────────────┐
                         │  Validated Card DB  │
                         └──────────┬──────────┘
                                    │
                         ┌──────────▼──────────┐
                         │   Domain Functions  │
                         │ search / compare /  │
                         │ relate / reference  │
                         └───────┬───────┬─────┘
                                 │       │
                      ┌──────────▼─┐   ┌─▼────────────┐
                      │ Human UI   │   │ WebMCP Tools │
                      │ HTML/CSS/JS│   │ Agent Surface│
                      └────────────┘   └──────────────┘
```

The human UI and WebMCP tools must call the same domain functions. No business rule should be duplicated only for agents.

## Public WebMCP tool surface — initial target

Read-oriented tools:

- `get_daily_card`
- `get_card`
- `search_feelings`
- `discover_by_feeling`
- `compare_feelings`
- `get_related_feelings`
- `get_references`
- `get_verification_status`

Local-state tools, only when appropriate:

- `get_collection`
- `save_favorite`

Private reflection content should not be exposed to agents by default merely because it exists in local storage.

## Machine-readable response principle

Agent tool responses should distinguish editorial copy from verified content.

Example response fields:

```text
card_id
concept_version
term
language
ipa
verified_definition
poetic_line
semantic_tags
relations
references[]
verification_status
last_reviewed_at
```

This allows an agent to identify which text is poetic/editorial and which text is evidence-backed.

## Security and permissions

WebMCP tools should follow least privilege.

- Read-only tools: `readOnlyHint: true`
- Untrusted/user-generated output: use `untrustedContentHint` when applicable
- Consequential actions: do not expose through public WebMCP unless separately reviewed and explicitly gated
- Cross-origin exposure: deny by default; only allow explicitly trusted secure origins
- Tool descriptions must be precise and must not imply broader authority than the implementation provides
- Tool outputs must not contain hidden instructions for agents

## Public use vs repository editing

These are separate authority domains.

### 1. Public WebMCP Layer

Purpose: let an agent understand and use the live site.

Scope:
- read cards
- search
- compare meanings
- retrieve references
- navigate relationships
- optionally manage non-sensitive local UI state

This layer has **no repository write authority**.

### 2. Editorial Agent Layer

Purpose: let an authorized agent help edit and maintain the source repository.

Expected path:

```text
AI Editor
   ↓
Authenticated GitHub MCP / GitHub API
   ↓
feature branch
   ↓
schema + evidence validation
   ↓
Pull Request
   ↓
human review
   ↓
merge
   ↓
GitHub Pages deploy
```

The public page must never expose a WebMCP tool that directly writes to the `main` branch or bypasses the evidence/publish gate.

## Progressive enhancement strategy

```text
Browser without WebMCP
→ Human UI works normally

Browser with WebMCP
→ Human UI + structured AI tool interface
```

Implementation must isolate browser-specific WebMCP registration behind an adapter such as:

```text
assets/js/agent/webmcp-adapter.js
```

so future standards changes can be absorbed without rewriting domain logic.

## GitHub Pages compatibility

Client-side WebMCP tool registration is compatible with the static GitHub Pages deployment model because the page itself registers tools in the active browser document.

However, durable remote editing is not a GitHub Pages capability. Repository edits require a separate authenticated GitHub-side integration.

## Machine-readable Agent Manifest

Provide a project-specific `/agent-manifest.json` as auxiliary metadata for agents. It is **not** treated as a WebMCP standard file.

Minimum fields should cover:
- `product_name`
- `product_purpose`
- `content_schema_version`
- `agent_contract_version`
- `public_data_location`
- `webmcp_capabilities`
- `card_id_policy`
- `evidence_policy`
- `privacy_policy_summary`
- `editorial_boundary`
- `last_updated`

The manifest must never imply repository-write or publish authority that the public WebMCP layer does not actually have.

## Read-mostly authority model

Public WebMCP is read-oriented by default. Local browser state actions may be added only when their privacy and consequence level is explicit.

Allowed direction:
- read/search/compare public cards
- retrieve references and verification status
- navigate semantic relations
- optionally mutate non-sensitive local browser state

Disallowed from the public layer:
- repository mutation
- remote storage mutation
- publish-state mutation
- bypassing schema/evidence/cultural review gates

## Initial implementation phases

### Phase A — Agent-readable domain
- finalize public card schema
- make domain functions deterministic and side-effect-light
- expose machine-readable reference/provenance fields

### Phase B — Read-only WebMCP
- `get_card`
- `search_feelings`
- `compare_feelings`
- `get_related_feelings`
- `get_references`

### Phase C — Local-state agent actions
- collection/favorite tools after privacy review

### Phase D — Editorial MCP workflow
- authorized GitHub MCP integration
- branch + PR only
- no direct publish bypass

## Non-goals for MVP

- No autonomous publication by an AI agent
- No direct repository mutation from the public website
- No agent access to private reflections by default
- No dependency on WebMCP for ordinary human use
- No assumption that WebMCP is universally supported across browsers


## Sensitive local reflection boundary

Personal reflection text is treated as sensitive local content.

- Public agents do not receive reflection text by default.
- Reflection read/write requires an explicit user-directed action.
- Reflection content is not silently used for search, recommendation, personalization, sharing, or telemetry.
- Public card sharing and normal WebMCP outputs must never include reflection text.

## Versioned agent contract

Agent-facing responses should include explicit version metadata where relevant:

- `agent_contract_version`
- `content_schema_version`
- `data_snapshot_version`
- `card_id`
- `concept_version`

Prefer structured errors such as `CARD_NOT_FOUND`, `CARD_RETIRED`, `NOT_VERIFIED`, `PERMISSION_DENIED`, `LOCAL_STATE_UNAVAILABLE`, and `UNSUPPORTED_CAPABILITY` over UI-text parsing.

## Fail-closed editorial validation

An editorial agent may repair a failed validation result, but may not weaken or bypass the validation policy itself. Evidence minimums, reference checks, cultural-review requirements, and publication gates remain authoritative.

## Dual agent access surface

WebMCP is the preferred in-browser tool interface, not the only machine-readable access path. Publish a static `agent-manifest.json`, versioned public card data, and stable card URLs as a read-only fallback for agents without WebMCP support. Both surfaces must derive from the same validated public schema.

## Copyright boundary

Public provenance should be citation-rich and copyright-minimal. Expose bibliographic identifiers and evidence locators, but do not republish full copyrighted source text or long dictionary definitions. Public card prose should be original synthesis grounded in validated evidence. Preserve license metadata for assets and source-dependent material.

## Agent contract conformance tests

Treat the agent interface as a tested public contract. Automated checks should verify schema completeness, WebMCP/public-data consistency, read-only authority boundaries, reflection non-disclosure, structured errors, version metadata, and manifest/tool capability consistency.


## Semantic UI-Agent parity

Human UI actions and WebMCP tools must share the same domain semantics even when their presentation differs.

Target mapping:

- Daily card UI ↔ `get_daily_card`
- Card detail UI ↔ `get_card`
- Search UI ↔ `search_feelings`
- Related-feelings UI ↔ `get_related_feelings`
- Reference section ↔ `get_references`

Parity means the same filters, concept IDs, verification state, authority boundaries, and core domain rules apply to both surfaces. Regression tests should detect semantic drift between human-visible behavior and agent-visible behavior.
