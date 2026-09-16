# NameOnMyMind — Visual Art Direction

Status: Product baseline

## Brand display

- Technical/repository/product identifier: `NameOnMyMind`
- Editorial/user-facing sentence form may use: `Name On My Mind`
- Primary Korean tagline baseline: `이 마음에도 이름이 있을까요?`

## Illustration language

Core medium:
- pencil drawing
- light watercolor
- visible paper-like softness
- generous negative space
- scene-first rather than face-first emotional depiction

## Human presence

Default: anonymous traces of people rather than explicit portraiture.

Preferred devices:
- back view
- silhouette
- hands
- partial figure
- empty chair / recently used object
- relational spacing between figures

Direct human scenes are allowed where the relational context is necessary to understand the experience. Avoid making one demographic appearance the visual prototype of an emotion.

## Color

Use a shared neutral/paper baseline with subtle per-card shifts in color temperature and accent. Color supports atmosphere but must never be the only carrier of semantic category.

## Scene Contract

Every illustration brief should satisfy:
1. one primary emotional situation or tension;
2. no diagnostic facial shorthand as the sole explanation;
3. no unsupported cultural symbol or stereotype;
4. room for user projection;
5. semantic consistency with the verified card meaning;
6. compatibility with alt-text description;
7. human editorial review before publication.

## Accessibility

Alt text describes the visible scene rather than diagnosing the emotion.

Bad:
`A lonely person feeling homesick.`

Better:
`A person seen from behind sits beside a packed suitcase near a window, with evening light falling across the floor.`

The emotional definition remains in structured card content, separate from the accessibility description.

## Share assets

Create stable prebuilt share images per card during the validated build.

- primary Open Graph target: 1200×630
- optional square/portrait variants later
- no private reflection, history, favorite state, or device identifiers
- assets remain versioned separately from stable card concept IDs
- share images participate in Asset Provenance Registry

## Typography

Use a mixed editorial system rather than one universal voice.

- Emotional display, original terms, and poetic lines: serif-oriented role
- Navigation, buttons, tags, body explanations, verification metadata, and references: sans-serif-oriented role
- Define role tokens rather than binding the design contract to a single font family
- Maintain resilient fallback chains across Korean, Latin, Chinese, and Japanese glyph coverage
- Font loading must never block core reading or interaction

Suggested canonical tokens:

- `font-display-emotion`
- `font-ui`
- `font-reading`
- `font-reference`

## Motion

Motion should be quiet and functional.

- use brief transitions for reveal, navigation, and save feedback;
- avoid parallax and emotionally theatrical animation;
- respect `prefers-reduced-motion`;
- ensure every state change remains understandable with motion disabled.
