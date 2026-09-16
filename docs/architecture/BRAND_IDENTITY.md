# NameOnMyMind — Brand Identity Baseline

Status: Product baseline

## Brand naming

- Technical/repository identifier: `NameOnMyMind`
- User-facing editorial form: `Name On My Mind`
- Korean tagline baseline: `이 마음에도 이름이 있을까요?`

## Brand architecture

Use a mixed system:
- PWA/app icon: compact proprietary symbol
- Web header/editorial contexts: symbol + wordmark or wordmark alone
- Technical identifiers remain `NameOnMyMind`

## Symbol principles

### Monochrome-first

The symbol must work in one color before color variants are considered.

- recognizable at small sizes
- no dependence on gradients or illustration detail
- no generic heart-only solution
- no diagnostic/emotion-category encoding
- no medical/counseling visual cues

### Semantic restraint

The symbol should suggest the act of giving shape or a name to an inner experience, not claim to diagnose emotion. It may lightly evoke:
- a contour or undefined inner shape
- a label/name marker
- a card/page
- negative space where meaning can be projected

Avoid overloading the symbol with too many literal meanings.

## Asset source of truth

Maintain one canonical vector master. Generate downstream assets from that source rather than editing each asset independently.

Typical derivative families:
- favicon
- PWA icons
- maskable icon
- touch icon
- share/OG mark
- monochrome/high-contrast mark

Each derivative should retain source/version provenance.

## Light and dark contexts

Keep the same symbol geometry in light and dark mode. Adjust foreground/background contrast and approved color tokens only. Do not create different semantic variants for themes.

## Relationship to illustration system

The brand symbol is not one of the daily card illustrations. Daily illustrations can be expressive and textured; the brand symbol remains simpler, repeatable, and UI-safe.


## Symbol metaphor baseline

The preferred metaphor is an abstract, soft, not-yet-defined inner contour receiving a small label/dot, with only a faint suggestion of a card/page boundary. The mark should communicate `giving a name to an ambiguous inner experience`, not a literal heart, medical state, or emotion category.


## Symbol geometry baseline

Use a hybrid geometry:
- rounded card/frame as the stable outer container;
- asymmetric soft inner contour representing an unnamed inner experience;
- small label/dot marking the moment of naming.

### Construction rules

- square master viewBox;
- stable outer-frame proportion;
- minimum inset between inner contour and frame;
- label/dot must not visually merge with the border;
- simplified micro-icon variant may be used at very small sizes;
- maintain at least one internal-unit of clear space around the mark.


## Label-tab form baseline

Use a hybrid marker: visually close to a small dot at app-icon sizes, but with a very short tab-like attachment visible at larger sizes. It should suggest `naming` without becoming a literal luggage/name tag icon.


## Label placement and optical variants

Place the label marker between the upper-right corner and the vertical midpoint, slightly attached to the outer frame. At small sizes it should read as a dot; at larger sizes the short tab attachment can remain visible.

Maintain two optical cuts from one geometry family:
- standard mark for normal UI and editorial use;
- micro mark for favicon/small-icon use with simplified inner contour and label detail.


## Inner-contour character

The inner contour uses controlled organic asymmetry. Keep the overall silhouette calm and soft, with only a slight off-center tension. Prefer a small number of smooth curvature changes; avoid spikes, waveform-like repetition, or visual cues that can resemble distress/medical monitoring.

## Brand color boundary

Keep brand identity and card-specific emotional atmosphere separate:
- brand surfaces: neutral paper/ink family;
- one restrained brand accent family;
- per-card emotional accents live in content/design tokens and may vary subtly;
- color never acts as the sole semantic classifier.


## Brand accent baseline

Use a low-saturation terracotta/coral family as the primary brand accent over the neutral paper/ink system. Keep this accent distinct from per-card emotional color tokens so the brand remains stable while card atmosphere may vary.
