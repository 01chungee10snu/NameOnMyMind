# NameOnMyMind — Interaction & PWA Architecture

Status: Product baseline

## 1. Interaction principle

NameOnMyMind uses the metaphor of a card, but does not require a literal 3D card flip.

Core principle:

> Front = feel first. Detail = understand more deeply.

The interaction should favor accessible reveal, expansion, and navigation over decorative flipping.

## 2. Front-card behavior

The first card view should remain quiet and compact:

1. illustration;
2. one or two short poetic lines / scene cue;
3. original term + language;
4. one light reflection question;
5. a clear `더 알아보기` action.

Long definitions, etymology, cross-language comparison, relation graphs, and references belong in deeper layers.

## 3. Detail transition

Default implementation should be compatible with:

- touch;
- keyboard;
- screen readers;
- browser history;
- stable card URLs;
- WebMCP card retrieval.

Do not make literal 3D flip state a prerequisite for accessing detail content.

## 4. Quiet motion

Use motion only to communicate state changes.

Recommended uses:

- card reveal;
- detail opening/closing;
- favorite/save confirmation;
- light page transition.

Avoid:

- parallax;
- autoplay decorative sequences;
- emotion-specific theatrical motion;
- motion that carries meaning unavailable in static form.

Honor `prefers-reduced-motion` and provide equivalent no-motion states.

## 5. PWA role

PWA capability is an enhancement, not a dependency.

The core site must remain functional as an ordinary static website without service-worker support.

## 6. Versioned offline snapshot

Separate app-shell caching from validated content-data caching.

Suggested namespaces:

```text
shell-cache-vN
content-cache-<validated-snapshot>
asset-cache-<asset-version>
```

Rules:

- retain the last known valid public snapshot until a new validated snapshot is fully available;
- avoid destructive cache replacement before validation/version checks succeed;
- previously opened cards and a minimal discovery index may be available offline;
- private reflections are not part of public content caches;
- a service-worker failure must not block normal online use.

## 7. Daily-card stability

The user's daily selection remains fixed for the local day once chosen, even if the site receives a newer public data snapshot during that day.

Daily-card selection state and public content cache state are separate concerns.

## 8. Deep links and sharing

Detailed card reading should support stable card URLs independent of UI transition style. Shared links must resolve directly to the public card concept without exposing local-state information.

## 9. Testing expectations

Interaction/PWA regression checks should include:

- detail accessible without motion;
- keyboard and screen-reader reachable actions;
- reduced-motion behavior;
- stale public cache never overrides a newer validated version after activation;
- failed service worker leaves online site usable;
- daily-card choice remains stable within the day;
- reflection data is excluded from public/cache/share outputs.


## Hybrid detail reading rhythm

The primary card keeps its emotional quietness. `더 알아보기` first reveals a compact core meaning in place. A second explicit action opens the deeper reading surface containing definitions, cross-language comparisons, cultural context, relations, and references.

## Stable detail information architecture

Use stable section anchors so human navigation, deep links, search, and WebMCP can address the same conceptual sections:

- `meaning`
- `similar`
- `languages`
- `culture`
- `usage`
- `relations`
- `evidence`

A stable concept URL may add a section fragment without changing concept identity.

## Explainable search results

Search results should show concise rationale for the match where useful, such as a matching tag, keyword, or nearby verified meaning. Do not present search matching as an emotional diagnosis.

## Graceful offline fallback

When a detailed card asset is unavailable offline, preserve the cached summary and provide a quiet connectivity/freshness notice rather than a hard error. Never imply that stale cached evidence is the current verified snapshot when its version is known to be older.


## Mobile-first primary navigation

Use three primary product spaces across mobile and desktop:

1. `오늘의 마음`
2. `찾아보기`
3. `내가 만난 마음`

Mobile should prefer a simple bottom navigation or an equivalent three-destination pattern. Desktop may expand layout, but should not invent a different information architecture.

### Space responsibilities

`오늘의 마음`
- daily deterministic card
- compact reveal
- reflection question and optional local note
- similar/different discovery entry points

`찾아보기`
- keyword/tag search
- guided discovery
- semantic browsing

`내가 만난 마음`
- viewed cards
- favorites
- timeline and meaning-group views

All three spaces open the same canonical card detail surface.

## Entry behavior

- First visit: short onboarding, then today's card.
- Returning visit: land directly on today's card.
- Same-day returns preserve the assigned daily card.
- Shared/deep links open the requested card/section directly, with a clear route back to the main daily experience.
- Do not aggressively restore transient exploration state when it would make return behavior confusing.


## Daily Card Shell v1

Recommended front-screen order:
1. small brand/today marker;
2. illustration;
3. short poetic line;
4. original term + language;
5. reflection question;
6. compact reveal action;
7. favorite/share secondary actions;
8. primary navigation.

Long definitions, taxonomy, and references remain outside the primary front-card composition.
