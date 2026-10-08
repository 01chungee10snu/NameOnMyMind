// Generated from world-hanja-v1.json. Rebuild with build:world-hanja.
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
export const WORLD_HANJA_SOURCE = freeze({
  "schema_version": "1.0.0",
  "version": "WORLD_HANJA_V1_2026-10-08",
  "purpose": "Separate Korean hun/eum labels for each actual Han character in currently displayed foreign companions. Not a word-by-word translation, native pronunciation, or inferred etymology for Hangul-only words. Kana are not treated as Han characters.",
  "checked_at": "2026-10-08",
  "source_name": "한국어 위키낱말사전 한자 항목 · 汉典 간체 대응",
  "license": "CC BY-SA 4.0",
  "license_url": "https://creativecommons.org/licenses/by-sa/4.0/",
  "adaptation_note": "훈을 한국식 한자 안내 형식으로 정리(슬프다→슬플, 버리다→버릴, 아니다→아닐, 얻다→얻을). 한자 뜻을 단어 전체의 뜻으로 해석하지 않음.",
  "entries": [
    {
      "world_id": "WC06",
      "term": "物の哀れ",
      "characters": [
        {
          "display": "物",
          "hanja": "物",
          "hun": "물건",
          "eum": "물",
          "source_url": "https://ko.wiktionary.org/wiki/%E7%89%A9"
        },
        {
          "display": "哀",
          "hanja": "哀",
          "hun": "슬플",
          "eum": "애",
          "source_url": "https://ko.wiktionary.org/wiki/%E5%93%80"
        }
      ],
      "note": "",
      "scope": "KOREAN_HANJA_LABELS_NOT_JAPANESE_PRONUNCIATION"
    },
    {
      "world_id": "WC07",
      "term": "舍不得",
      "characters": [
        {
          "display": "舍(捨)",
          "hanja": "舍",
          "reference_form": "捨",
          "hun": "버릴",
          "eum": "사",
          "source_url": "https://ko.wiktionary.org/wiki/%E6%8D%A8",
          "variant_source_url": "https://zdic.net/hans/%E8%88%8D"
        },
        {
          "display": "不",
          "hanja": "不",
          "hun": "아닐",
          "eum": "불/부",
          "source_url": "https://ko.wiktionary.org/wiki/%E4%B8%8D"
        },
        {
          "display": "得",
          "hanja": "得",
          "hun": "얻을",
          "eum": "득",
          "source_url": "https://ko.wiktionary.org/wiki/%E5%BE%97"
        }
      ],
      "note": "舍는 여기서 捨의 간체자예요.",
      "scope": "KOREAN_HANJA_LABELS_NOT_MANDARIN_PRONUNCIATION"
    }
  ]
});
export const WORLD_HANJA = Object.freeze({
  get: (worldId, term) => WORLD_HANJA_SOURCE.entries.find(entry => entry.world_id === worldId && entry.term === term),
  keys: () => WORLD_HANJA_SOURCE.entries.map(entry => entry.world_id).values(),
  size: WORLD_HANJA_SOURCE.entries.length,
});
