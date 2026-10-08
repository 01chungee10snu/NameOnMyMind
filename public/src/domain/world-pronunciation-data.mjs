// Generated from world-pronunciations-v1.json. Rebuild with build:world-pronunciation-data.
const freeze = value => { if(value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
export const WORLD_PRONUNCIATION_SOURCE = freeze({
  "schema_version": "1.0.0",
  "version": "WORLD_PRONUNCIATION_V25_2026-10-08",
  "purpose": "IPA and original Korean approximations for seven existing context companions. Device TTS is a pronunciation aid, not an exact rendering of IPA. Held G5 cards and audio releases are unchanged.",
  "korean_guide_note": "한글은 원음에 가까운 소리를 적은 안내예요.",
  "speech_note": "듣기를 누르면 해당 낱말만 기기의 음성 기능으로 읽어요. 온라인 음성은 기기 제공자의 서버를 사용할 수 있어요. 음성과 지역에 따라 실제 발음은 달라질 수 있어요.",
  "default_rate": 0.85,
  "slow_rate": 0.6,
  "entries": [
    {
      "world_id": "WC01",
      "term": "saudade",
      "speech_text": "saudade",
      "locale": "pt-BR",
      "voice_locales": [
        "pt-BR"
      ],
      "ipa": "/sawˈda.d͡ʒi/",
      "korean_guide": "사우다지",
      "reading": "sau·da·de",
      "variant": "브라질 포르투갈어",
      "practice_tip": "‘다’를 조금 세게 읽고, 끝은 ‘지’에 가깝게 읽어요.",
      "source_url": "https://en.wiktionary.org/wiki/saudade#Portuguese",
      "source_name": "Wiktionary · saudade",
      "source_locator": "Portuguese > Pronunciation > Brazil",
      "checked_at": "2026-10-08",
      "ipa_provenance": "TRANSCRIBED_FROM_LINKED_PRONUNCIATION",
      "guide_provenance": "EDITORIAL_APPROXIMATION_NOT_STANDARD_KOREAN_TRANSCRIPTION",
      "license": "CC BY-SA 4.0",
      "license_url": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
      "world_id": "WC02",
      "term": "hiraeth",
      "speech_text": "hiraeth",
      "locale": "cy-GB",
      "voice_locales": [
        "cy-GB",
        "cy"
      ],
      "ipa": "/ˈhiːrai̯θ/",
      "korean_guide": "히라이스",
      "reading": "hi·raeth",
      "variant": "남부 웨일스어의 한 발음",
      "practice_tip": "첫소리 ‘히’를 길게 읽어요. 끝은 혀끝을 윗니에 살짝 대고 바람을 내요.",
      "source_url": "https://en.wiktionary.org/wiki/hiraeth#Welsh",
      "source_name": "Wiktionary · hiraeth",
      "source_locator": "Welsh > Pronunciation > South Wales, standard; first listed variant",
      "checked_at": "2026-10-08",
      "ipa_provenance": "TRANSCRIBED_FROM_LINKED_PRONUNCIATION",
      "guide_provenance": "EDITORIAL_APPROXIMATION_NOT_STANDARD_KOREAN_TRANSCRIPTION",
      "license": "CC BY-SA 4.0",
      "license_url": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
      "world_id": "WC03",
      "term": "Geborgenheit",
      "speech_text": "Geborgenheit",
      "locale": "de-DE",
      "voice_locales": [
        "de-DE",
        "de"
      ],
      "ipa": "[ɡəˈbɔʁɡn̩haɪ̯t]",
      "korean_guide": "거보르근하이트",
      "reading": "Ge·bor·gen·heit",
      "variant": "독일어",
      "practice_tip": "‘보르’를 조금 세게 읽어요. 한글로 옮기기 어려운 r 소리가 있어요.",
      "source_url": "https://de.wiktionary.org/wiki/Geborgenheit",
      "source_name": "Wiktionary · Geborgenheit",
      "source_locator": "Deutsch > Aussprache > first IPA variant",
      "checked_at": "2026-10-08",
      "ipa_provenance": "TRANSCRIBED_FROM_LINKED_PRONUNCIATION",
      "guide_provenance": "EDITORIAL_APPROXIMATION_NOT_STANDARD_KOREAN_TRANSCRIPTION",
      "license": "CC BY-SA 4.0",
      "license_url": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
      "world_id": "WC04",
      "term": "Fernweh",
      "speech_text": "Fernweh",
      "locale": "de-DE",
      "voice_locales": [
        "de-DE",
        "de"
      ],
      "ipa": "[ˈfɛʁnˌveː]",
      "korean_guide": "페른베",
      "reading": "Fern·weh",
      "variant": "독일어",
      "practice_tip": "‘페른’을 세게, 끝의 ‘베’를 길게 읽어요.",
      "source_url": "https://de.wiktionary.org/wiki/Fernweh",
      "source_name": "Wiktionary · Fernweh",
      "source_locator": "Deutsch > Aussprache",
      "checked_at": "2026-10-08",
      "ipa_provenance": "TRANSCRIBED_FROM_LINKED_PRONUNCIATION",
      "guide_provenance": "EDITORIAL_APPROXIMATION_NOT_STANDARD_KOREAN_TRANSCRIPTION",
      "license": "CC BY-SA 4.0",
      "license_url": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
      "world_id": "WC05",
      "term": "Torschlusspanik",
      "speech_text": "Torschlusspanik",
      "locale": "de-DE",
      "voice_locales": [
        "de-DE",
        "de"
      ],
      "ipa": "[ˈtoːɐ̯ʃlʊsˌpaːnɪk]",
      "korean_guide": "토어슐루스파니크",
      "reading": "Tor·schluss·pa·nik",
      "variant": "독일어",
      "practice_tip": "토어 · 슐루스 · 파니크로 나눠 연습한 뒤 이어 읽어요.",
      "source_url": "https://de.wiktionary.org/wiki/Torschlusspanik",
      "source_name": "Wiktionary · Torschlusspanik",
      "source_locator": "Deutsch > Aussprache",
      "checked_at": "2026-10-08",
      "ipa_provenance": "TRANSCRIBED_FROM_LINKED_PRONUNCIATION",
      "guide_provenance": "EDITORIAL_APPROXIMATION_NOT_STANDARD_KOREAN_TRANSCRIPTION",
      "license": "CC BY-SA 4.0",
      "license_url": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
      "world_id": "WC06",
      "term": "物の哀れ",
      "speech_text": "もののあわれ",
      "locale": "ja-JP",
      "voice_locales": [
        "ja-JP",
        "ja"
      ],
      "ipa": "[mo̞no̞ no̞ a̠β̞a̠ɾe̞]",
      "korean_guide": "모노노 아와레",
      "reading": "もののあわれ",
      "variant": "일본어",
      "practice_tip": "모노노 · 아와레로 나눠서 읽어요. 영어식 강세는 넣지 않아요.",
      "source_url": "https://en.wiktionary.org/wiki/物の哀れ#Japanese",
      "source_name": "Wiktionary · 物の哀れ",
      "source_locator": "Japanese > Pronunciation > IPA and Tokyo reading",
      "checked_at": "2026-10-08",
      "ipa_provenance": "TRANSCRIBED_FROM_LINKED_PRONUNCIATION",
      "guide_provenance": "EDITORIAL_APPROXIMATION_NOT_STANDARD_KOREAN_TRANSCRIPTION",
      "license": "CC BY-SA 4.0",
      "license_url": "https://creativecommons.org/licenses/by-sa/4.0/"
    },
    {
      "world_id": "WC07",
      "term": "舍不得",
      "speech_text": "舍不得",
      "locale": "zh-CN",
      "voice_locales": [
        "zh-CN",
        "zh-SG",
        "zh-Hans",
        "zh-Hans-CN",
        "cmn",
        "cmn-CN",
        "cmn-Hans-CN"
      ],
      "ipa": "/ʂɤ²¹⁴ b̥u⁴ d̥ə¹/",
      "korean_guide": "셔부더",
      "reading": "shěbude",
      "variant": "중국어 보통화",
      "practice_tip": "shě는 3성이고, bu와 de는 가볍게 읽는 발음이에요. 한글에는 성조가 표시되지 않아요.",
      "source_url": "https://en.wiktionary.org/wiki/捨不得#Chinese",
      "source_name": "Wiktionary · 捨不得(舍不得)",
      "source_locator": "Mandarin > Standard Chinese, standard in Mainland; shěbude",
      "checked_at": "2026-10-08",
      "ipa_provenance": "TRANSCRIBED_FROM_LINKED_PRONUNCIATION",
      "guide_provenance": "EDITORIAL_APPROXIMATION_NOT_STANDARD_KOREAN_TRANSCRIPTION",
      "license": "CC BY-SA 4.0",
      "license_url": "https://creativecommons.org/licenses/by-sa/4.0/"
    }
  ]
});
// A read-only lookup facade; Object.freeze(new Map()) would still permit .set().
export const WORLD_PRONUNCIATIONS = Object.freeze({
  get: id => WORLD_PRONUNCIATION_SOURCE.entries.find(entry => entry.world_id === id),
  keys: () => WORLD_PRONUNCIATION_SOURCE.entries.map(entry => entry.world_id).values(),
  size: WORLD_PRONUNCIATION_SOURCE.entries.length,
});
