# World pronunciation V25

The authored seven-entry pronunciation registry is separate from the frozen meaning/context data.
`build-world-pronunciation-data.mjs` verifies identities, exact spoken texts, locale allowlists and source attribution, then generates a deeply frozen runtime module and read-only lookup facade.
The shared world renderer displays IPA, approximate Korean, optional kana/pinyin and two buttons. The main page HTML/CSS remains unchanged.

`world-pronunciation.mjs` installs one delegated controller per document. It resolves button IDs to reviewed data rather than reading arbitrary DOM/search/reflection text.
It selects a matching locale explicitly, prefers local-service voices, and never substitutes a different language. It has no fetch, credential, microphone or persistent storage path.
The engine may use provider infrastructure for non-local voices; the existing source disclosure states this limitation.

State is scoped to one playback token. Timers and voice-list listeners are removed before transitions. Utterance handlers and active identity are cleared before calling cancel, preventing synchronous cancellation and stale-event races. Navigation, hidden pages, detached controls and closed details stop playback; destroy detaches every listener/observer.

Supported engine behavior is not a guarantee of installed voices. No matching voice yields a Korean status while retaining readable IPA/guide. The macOS test machine supports the four relevant large-language locales but has no Welsh voice.

Unit tests cover source generation, wrong-language rejection, allowed text, readiness, race conditions, unsupported/error/timeout recovery, cleanup, immutability and preserved contexts.
Browser QA covers 28 layouts, six actual native-voice start/end pairs, missing Welsh, slower/keyboard playback, dynamic dictionary results, and private-writing separation. No native-speaker or phone-hardware evaluation is claimed.

Sources: each IPA record links to the exact Wiktionary language/pronunciation section. Korean guides and practice tips are editorial approximations, not copied dictionary definitions. Device synthesis is not a release of held G5 recorded media.
