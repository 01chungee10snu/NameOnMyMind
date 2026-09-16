#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TODAY = "2026-09-16"


def read_json(rel: str):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def write_json(rel: str, value):
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def ref(reference_id, source_type, title, publisher, url, rights_note, *, authors=None, year=None,
        volume=None, issue=None, pages=None, doi=None, license=None, citation_display=None):
    return {
        "reference_id": reference_id,
        "source_type": source_type,
        "title": title,
        "authors": authors or [],
        "publisher_or_container": publisher,
        "year": year,
        "volume": volume,
        "issue": issue,
        "pages": pages,
        "doi": doi,
        "isbn": None,
        "url": url,
        "accessed_at": TODAY,
        "license": license,
        "rights_note": rights_note,
        "citation_display": citation_display or f"{publisher}. {title}.",
    }


def review(status, summary, refs):
    return {"status": status, "summary": summary, "reference_ids": refs}


def comparison(status, near_terms, difference_note, verification_note, refs):
    return {
        "status": status,
        "near_terms": near_terms,
        "difference_note": difference_note,
        "verification_note": verification_note,
        "reference_ids": refs,
    }


def inventory(ref_id, role, tier="A"):
    return {"reference_id": ref_id, "role": role, "quality_tier": tier}


def claim(n, text, refs, locator):
    return {
        "claim_id": f"CL-{n:03d}",
        "claim": text,
        "reference_ids": refs,
        "evidence_locator": locator,
        "public_safe": True,
    }


def add_references():
    registry = read_json("content/approved/references.json")
    new = [
        ref("R0043", "lexical", "서운하다", "국립국어원 한국어기초사전",
            "https://krdict.korean.go.kr/eng/dicSearch/SearchView?ParaWordNo=62892&nation=eng",
            "Authoritative Korean target-term lexical entry, pronunciation display, examples, and English gloss. Public wording must be original synthesis.",
            citation_display="국립국어원. (n.d.). 서운하다. 한국어기초사전."),
        ref("R0044", "lexical", "아쉽다", "국립국어원 한국어기초사전",
            "https://krdict.korean.go.kr/eng/dicSearch/SearchView?ParaWordNo=14687&nation=eng",
            "Authoritative Korean target-term lexical entry with multiple senses and pronunciation display. Public wording must preserve sense boundaries.",
            citation_display="국립국어원. (n.d.). 아쉽다. 한국어기초사전."),
        ref("R0045", "lexical", "섭섭하다", "국립국어원 한국어기초사전",
            "https://krdict.korean.go.kr/eng/dicSearch/SearchView?ParaWordNo=49056&nation=eng",
            "Authoritative Korean target-term lexical entry; definition explicitly relates 서운하다 and 아쉽다. Public wording must be original synthesis.",
            citation_display="국립국어원. (n.d.). 섭섭하다. 한국어기초사전."),
        ref("R0046", "lexical", "뿌듯하다", "국립국어원 한국어기초사전",
            "https://krdict.korean.go.kr/eng/dicSearch/SearchView?ParaWordNo=62065&nation=eng",
            "Authoritative Korean target-term lexical entry and usage examples. Public wording must be original synthesis.",
            citation_display="국립국어원. (n.d.). 뿌듯하다. 한국어기초사전."),
        ref("R0047", "lexical", "뭉클하다", "국립국어원 한국어기초사전",
            "https://krdict.korean.go.kr/eng/dicSearch/SearchView?ParaWordNo=57774&nation=eng",
            "Authoritative Korean target-term lexical entry and pronunciation display. Public wording must be original synthesis.",
            citation_display="국립국어원. (n.d.). 뭉클하다. 한국어기초사전."),
        ref("R0048", "rights", "한국어기초사전 저작권 정책", "국립국어원 한국어기초사전",
            "https://krdict.korean.go.kr/kor/kboardPolicy/copyRightTermsInfo",
            "General site material is described under open licensing, but multimedia such as sound/pronunciation has file-level commercial-use/modification permissions. This reference documents the HOLD boundary and does not authorize the five research MP3s.",
            citation_display="국립국어원. (n.d.). 한국어기초사전 저작권 정책."),
        ref("R0049", "pronunciation", "서운하다 — Korean pronunciation", "Wiktionary",
            "https://en.wiktionary.org/wiki/%EC%84%9C%EC%9A%B4%ED%95%98%EB%8B%A4",
            "Korean pronunciation template/page used for IPA cross-check; Krdict phonetic Hangul display is separately authoritative for the headword.",
            license="CC BY-SA 4.0 / site terms", citation_display="Wiktionary. (n.d.). 서운하다."),
        ref("R0050", "pronunciation", "아쉽다 — Korean pronunciation", "Wiktionary",
            "https://en.wiktionary.org/wiki/%EC%95%84%EC%89%BD%EB%8B%A4",
            "Korean pronunciation template/page used for IPA cross-check; Krdict phonetic Hangul display is separately authoritative for the headword.",
            license="CC BY-SA 4.0 / site terms", citation_display="Wiktionary. (n.d.). 아쉽다."),
        ref("R0051", "pronunciation", "섭섭하다 — Korean pronunciation", "Wiktionary",
            "https://en.wiktionary.org/wiki/%EC%84%AD%EC%84%AD%ED%95%98%EB%8B%A4",
            "Korean pronunciation template/page used for IPA cross-check; Krdict phonetic Hangul display is separately authoritative for the headword.",
            license="CC BY-SA 4.0 / site terms", citation_display="Wiktionary. (n.d.). 섭섭하다."),
        ref("R0052", "pronunciation", "Template:ko-IPA — expansion for 뿌듯하다", "Wiktionary",
            "https://en.wiktionary.org/wiki/Template:ko-IPA",
            "Pronunciation template expansion with page title 뿌듯하다 was used because a stable direct headword page was unavailable; output was cross-checked against Krdict phonetic Hangul [뿌드타다].",
            license="CC BY-SA 4.0 / site terms", citation_display="Wiktionary. (n.d.). Template:ko-IPA (expansion for 뿌듯하다)."),
        ref("R0053", "pronunciation", "뭉클하다 — Korean pronunciation", "Wiktionary",
            "https://en.wiktionary.org/wiki/%EB%AD%89%ED%81%B4%ED%95%98%EB%8B%A4",
            "Korean pronunciation template/page used for IPA cross-check; Krdict phonetic Hangul display is separately authoritative for the headword.",
            license="CC BY-SA 4.0 / site terms", citation_display="Wiktionary. (n.d.). 뭉클하다."),
        ref("R0054", "scholarly", "한국어 감정단어의 목록 작성과 차원 탐색", "한국심리학회지: 사회및성격",
            "https://www.kci.go.kr/kciportal/landing/article.kci?arti_id=ART000958746",
            "Scholarly evidence for a structured Korean emotion-term inventory and underlying dimensions; does not establish cultural exclusivity.",
            authors=["박인조", "민경환"], year=2005, volume="19", issue="1", pages="109-129",
            citation_display="박인조, 민경환. (2005). 한국어 감정단어의 목록 작성과 차원 탐색. 한국심리학회지: 사회및성격, 19(1), 109-129."),
        ref("R0055", "scholarly", "한국어 감정표현단어의 추출과 범주화", "감성과학",
            "https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART001649824",
            "Scholarly Korean feeling-word extraction/categorization evidence; target-term claims still require term-specific lexical support.",
            authors=["손선주", "박미숙", "박지은", "손진훈"], year=2012, volume="15", issue="1", pages="105-120",
            citation_display="손선주, 박미숙, 박지은, 손진훈. (2012). 한국어 감정표현단어의 추출과 범주화. 감성과학, 15(1), 105-120."),
        ref("R0056", "scholarly", "한국어교육에서 감정형용사의 제시 방안 - ‘아쉽다’, ‘안타깝다’, ‘아깝다’, ‘섭섭하다’, ‘서운하다’를 중심으로", "한국언어문학",
            "https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART001480364",
            "Term-specific semantic, situational, and corpus-based differentiation among Korean near-synonymous emotion adjectives.",
            authors=["서희정"], year=2010, issue="74", pages="31-59",
            citation_display="서희정. (2010). 한국어교육에서 감정형용사의 제시 방안: ‘아쉽다’, ‘안타깝다’, ‘아깝다’, ‘섭섭하다’, ‘서운하다’를 중심으로. 한국언어문학, 74, 31-59."),
        ref("R0057", "scholarly", "한국어 감정형용사의 중국어 대응 양상 연구 - ‘아쉽다, 섭섭하다, 서운하다, 안타깝다, 아깝다’를 중심으로-", "언어와 문화",
            "https://www.kci.go.kr/kciportal/landing/article.kci?arti_id=ART002934709",
            "Corpus/translation evidence showing multiple Chinese correspondence patterns for the target Korean emotion adjectives; supports non-one-to-one comparison framing.",
            authors=["백효동"], year=2023, volume="19", issue="1", pages="53-86", doi="10.18842/klaces.2023.19.1.003",
            citation_display="백효동. (2023). 한국어 감정형용사의 중국어 대응 양상 연구. 언어와 문화, 19(1), 53-86. https://doi.org/10.18842/klaces.2023.19.1.003"),
        ref("R0058", "scholarly", "한국어교육을 위한 감정형용사 유의어 변별 연구 - ‘만족스럽다’류의 의미적·통사적·화용적 변별을 중심으로 -", "언어사실과 관점",
            "https://www.kci.go.kr/kciportal/landing/article.kci?arti_id=ART002935183",
            "Term-specific evidence distinguishing 뿌듯하다 from 만족스럽다/흐뭇하다/흡족하다 on semantic, syntactic, and pragmatic grounds.",
            authors=["이원이", "이미혜"], year=2023, volume="58", pages="277-305", doi="10.20988/lfp.2023.58..277",
            citation_display="이원이, 이미혜. (2023). 한국어교육을 위한 감정형용사 유의어 변별 연구. 언어사실과 관점, 58, 277-305. https://doi.org/10.20988/lfp.2023.58..277"),
        ref("R0059", "scholarly", "한국어 감동 표현 감정형용사의 유의어 교육 연구 : 유의어 변별 기제를 중심으로", "서울대학교 대학원 학위논문",
            "https://s-space.snu.ac.kr/handle/10371/169933",
            "Term-specific corpus/speaker-data evidence differentiating 감격스럽다, 벅차다, 뭉클하다, 찡하다, 뿌듯하다. Public claims must remain conservative and original.",
            authors=["이슬"], year=2020,
            citation_display="이슬. (2020). 한국어 감동 표현 감정형용사의 유의어 교육 연구: 유의어 변별 기제를 중심으로 [학위논문, 서울대학교 대학원]."),
    ]
    ja = [("R0060","서운하다",62892),("R0061","아쉽다",14687),("R0062","섭섭하다",49056),("R0063","뿌듯하다",62065),("R0064","뭉클하다",57774)]
    zh = [("R0065","서운하다",62892),("R0066","아쉽다",14687),("R0067","섭섭하다",49056),("R0068","뿌듯하다",62065),("R0069","뭉클하다",57774)]
    for rid, term, no in ja:
        new.append(ref(rid, "lexical", f"{term} — 日本語対訳ページ", "国立国語院 韓国語基礎辞典",
                       f"https://krdict.korean.go.kr/jpn/dicSearch/SearchView?ParaWordNo={no}&nation=jpn",
                       "Official multilingual dictionary page used to verify Japanese near expressions; public comparison must be original synthesis.",
                       citation_display=f"国立国語院. (n.d.). {term}. 韓国語基礎辞典（日本語対訳）."))
    for rid, term, no in zh:
        new.append(ref(rid, "lexical", f"{term} — 中文对译页", "国立国语院 韩国语基础词典",
                       f"https://krdict.korean.go.kr/chn/dicSearch/SearchView?ParaWordNo={no}&nation=chn",
                       "Official multilingual dictionary page used to verify Chinese near expressions; public comparison must be original synthesis.",
                       citation_display=f"国立国语院. (n.d.). {term}. 韩国语基础词典（中文对译）."))
    merged = {x["reference_id"]: x for x in registry["references"]}
    for x in new:
        merged[x["reference_id"]] = x
    registry["references"] = [merged[k] for k in sorted(merged)]
    write_json("content/approved/references.json", registry)


def record(card_id, term, experience_type, lexical_id, pronunciation_id, scholarly_ids,
           near_ko, near_en, near_zh, near_ja, ja_ref, zh_ref, ipa, residue, overclaim,
           semantic_summary, cultural_summary, relations=None):
    refs = [lexical_id, pronunciation_id, "R0048", *scholarly_ids, ja_ref, zh_ref]
    # Use lexical target page for English gloss and Korean target-term meaning.
    source_inventory = [inventory(lexical_id, "lexical"), inventory(pronunciation_id, "pronunciation", "B"), inventory("R0048", "rights")]
    source_inventory += [inventory(x, "scholarly") for x in scholarly_ids]
    source_inventory += [inventory(ja_ref, "lexical"), inventory(zh_ref, "lexical")]
    comparisons = {
        "ko": comparison("PASS", near_ko, "한국어 내부의 가까운 표현과 겹치지만 사용 상황과 의미 초점이 완전히 같지 않다.", "Target lexical entry plus Korean near-synonym scholarship supports a within-Korean distinction rather than synonym collapse.", [lexical_id, *scholarly_ids]),
        "en": comparison("PASS", near_en, "영어의 가까운 표현들이 일부 의미를 나누어 담지만 한 표현이 모든 한국어 용례를 대체한다고 보지 않는다.", "Krdict English gloss is used as a near-expression anchor, not as proof of one-to-one equivalence.", [lexical_id]),
        "zh": comparison("PASS", near_zh, "중국어 대역은 실제 번역 가능성을 보여 주지만 문맥별 대응이 달라 완전한 일대일 대응으로 취급하지 않는다.", "Official Krdict Chinese page and Korean-Chinese comparison scholarship support a non-one-to-one framing.", [zh_ref, *(["R0057"] if "R0057" in scholarly_ids else [])]),
        "ja": comparison("PASS", near_ja, "일본어 대역은 가까운 의미를 제공하지만 한국어 표제어의 모든 화용·관계적 결을 하나의 표현으로 고정하지 않는다.", "Official Krdict Japanese page provides near expressions; public wording preserves residual difference.", [ja_ref]),
    }
    return {
        "schema_version": "2.0.0",
        "research_id": f"RR-{card_id}-KO",
        "card_id": card_id,
        "candidate": {"term": term, "language_code": "ko-KR", "language_name": "한국어", "experience_type": experience_type},
        "lifecycle_state": "HOLD",
        "source_inventory": source_inventory,
        "lexical_verification": review("PASS", f"국립국어원 한국어기초사전의 {term} 표제어로 핵심 의미와 실제 용례 범위를 확인했다.", [lexical_id]),
        "semantic_definition_and_boundaries": review("PASS", semantic_summary, [lexical_id, *scholarly_ids]),
        "cultural_context_review": review("PASS", cultural_summary, [lexical_id, *scholarly_ids]),
        "comparisons": comparisons,
        "pronunciation_verification": {
            "status": "HOLD",
            "ipa": ipa,
            "locale": "ko-KR",
            "reference_ids": [lexical_id, pronunciation_id, "R0048"],
            "audio_asset_id": None,
            "notes": "Krdict phonetic Hangul and Wiktionary IPA cross-check are available, but the official MP3's exact file-level commercial-use/modification permissions remain unresolved. The local MP3 research copy is intentionally not registered as a product asset.",
        },
        "claim_source_map": [
            claim(1, f"{term} has an authoritative Korean lexical definition and attested usage examples.", [lexical_id], "Korean Basic Dictionary headword definition and examples."),
            claim(2, residue, [lexical_id, *scholarly_ids], "Target lexical entry plus Korean emotion/near-synonym scholarship."),
            claim(3, "Cross-language glosses are treated as partial mappings rather than exact equivalents.", [lexical_id, ja_ref, zh_ref, *(["R0057"] if "R0057" in scholarly_ids else [])], "Official multilingual dictionary pages and, where applicable, Korean-Chinese correspondence study."),
        ],
        "relations": relations or [],
        "illustration_brief": review("HOLD", "Illustration brief has not yet been finalized because the card cannot enter REVIEW_READY before pronunciation-audio rights are resolved. Future art must remain anonymous, non-diagnostic, and avoid Korean-culture stereotypes.", [lexical_id, *scholarly_ids]),
        "editorial_copy": review("HOLD", "Public poetic line, scene, and reflection question have not yet been finalized; semantic boundaries are researched first and editorial copy is deferred until all product gates can be evaluated together.", [lexical_id, *scholarly_ids]),
        "automated_gates": {"schema": "PASS", "evidence": "PASS", "pronunciation": "HOLD", "cultural_humility": "PASS", "rights": "HOLD", "privacy": "PASS"},
        "distinctiveness_review": {
            "status": "PASS",
            "track": "KOREAN_NUANCE",
            "generic_basic_emotion": False,
            "nearest_cross_language_terms": {"ko": near_ko, "en": near_en, "zh": near_zh, "ja": near_ja},
            "semantic_residue": residue,
            "residue_reference_ids": [lexical_id, *scholarly_ids],
            "overclaim_to_avoid": overclaim,
        },
        "human_editorial_release": {"status": "PENDING", "reviewer": None, "reviewed_at": None, "notes": "Research-stage HOLD. Human Editorial Release cannot begin until pronunciation/rights and remaining illustration/editorial gates are resolved."},
        "changelog": [
            {"date": TODAY, "state": "RESEARCH", "note": "Source-first Korean lexical, scholarly, multilingual comparison, and IPA research structured under G5 Research Record v2."},
            {"date": TODAY, "state": "HOLD", "note": "Distinctiveness/evidence gates pass for research admission, but pronunciation-audio file-level rights are unresolved; REVIEW_READY is prohibited."},
        ],
    }


def add_records():
    configs = [
        ("C0006", "서운하다", "relational_experience", "R0043", "R0049", ["R0054","R0055","R0056","R0057"],
         ["섭섭하다","아쉽다"], ["sorry","remorseful"], ["可惜","不舍"], ["さびしい","名残惜しい"], "R0060", "R0065", "[sʰʌ̹unɦa̠da̠]",
         "기대했던 반응·관계·상황이 마음처럼 되지 않아 생기는 불만족과 관계적 마음상함, 이별의 마음 남음이 문맥에 따라 겹친다. 한국어 안에서도 섭섭하다·아쉽다와 사용 조건이 구별된다.",
         "한국인만 느끼는 감정 또는 다른 언어로 번역 불가능한 감정이라고 주장하지 않는다.",
         "사전은 기대와 다른 결과에서 오는 불만족을 핵심으로 제시하고, 유의어·대응 연구는 아쉽다·섭섭하다와의 문맥 차이를 분석한다.",
         "한국어 내부의 미묘한 관계 정서 구분을 설명하되 이를 민족적 성향이나 문화적 본질로 확대하지 않는다.", ["C0008","C0007"]),
        ("C0007", "아쉽다", "mixed_experience", "R0044", "R0050", ["R0054","R0055","R0056","R0057"],
         ["서운하다","섭섭하다","안타깝다","아깝다"], ["lacking","sad","sorry","regretful"], ["缺","紧缺","可惜"], ["物足りない","惜しい"], "R0061", "R0066", "[a̠ʃʰɥip̚t͈a̠]",
         "필요한 것이 모자라 만족스럽지 않은 상태와, 끝나거나 떠나는 대상에 마음이 남아 서운한 상태가 한 단어의 복수 의미로 어휘화되어 있다. 단순 regret나 부족함 하나로 환원하기 어렵다.",
         "모든 아쉬움을 상실·후회로 동일시하거나 다른 언어에 대응 표현이 없다고 주장하지 않는다.",
         "사전의 복수 의미와 한국어 유의어 연구를 함께 보존하여 부족함·마음 남음·서운함의 경계를 한 의미로 뭉개지 않는다.",
         "한국어 의미 분화를 설명하되 ‘한국인 특유’라는 문화적 독점 주장을 하지 않는다.", ["C0006","C0008"]),
        ("C0008", "섭섭하다", "relational_experience", "R0045", "R0051", ["R0054","R0055","R0056","R0057"],
         ["서운하다","아쉽다"], ["sorry","regrettable","disappointed"], ["难舍","不舍","惋惜"], ["寂しい","心残り"], "R0062", "R0067", "[sʰʌ̹ps͈ʌ̹pʰa̠da̠]",
         "사전 자체가 서운함과 아쉬움이 함께 있는 상태로 풀이하며, 사람의 태도·무관심·헤어짐 같은 관계 문맥에서 사용된다. 단순 sadness나 regret보다 관계적 기대와 마음 남음의 결합을 보존할 필요가 있다.",
         "서운하다와 완전한 동의어로 취급하거나 모든 섭섭함을 관계 갈등으로 진단하지 않는다.",
         "사전 정의와 유의어 연구는 서운하다·아쉽다와의 중첩 및 사용 상황 차이를 함께 보여 준다.",
         "관계적 용례가 많다는 사실을 한국 문화 전체의 관계주의 성향으로 일반화하지 않는다.", ["C0006","C0007"]),
        ("C0009", "뿌듯하다", "feeling", "R0046", "R0052", ["R0054","R0055","R0058","R0059"],
         ["만족스럽다","흐뭇하다","벅차다"], ["proud","satisfied","fulfilled","moved"], ["满足","充实","自豪"], ["胸一杯だ","誇らしい","満足した"], "R0063", "R0068", "[p͈udɯtʰa̠da̠]",
         "기쁨·감격이 마음에 가득한 상태이면서 실제 용례와 유의어 연구에서는 노력·성취 뒤의 충만한 만족이 두드러진다. ordinary pride, satisfaction, being moved 중 어느 하나만으로 모든 용례를 포괄하기 어렵다.",
         "뿌듯함을 자기과시적 pride나 단순 happiness와 동일시하지 않는다.",
         "사전은 기쁨·감격이 가득한 상태를 제시하며, 유의어 연구는 만족스럽다·흐뭇하다 등과의 의미·화용 차이를 분석한다.",
         "한국어 어휘의 세밀한 성취·감동 결을 보여 주되 한국인에게 고유한 심리라고 주장하지 않는다.", []),
        ("C0010", "뭉클하다", "feeling", "R0047", "R0053", ["R0054","R0055","R0059"],
         ["벅차다","찡하다","감격스럽다"], ["moved","touched","choked up"], ["心头一热","感动","感慨"], ["じいんとする","こみ上げる"], "R0064", "R0069", "[muŋkxɯɾɦa̠da̠]",
         "강한 감정이 갑자기 마음과 가슴을 채우는 체감까지 포함하며, 단순 moving/touching보다 신체적으로 차오르는 느낌이 두드러진다. 한국어 내부의 벅차다·찡하다·감격스럽다와도 화용 차이가 있다.",
         "눈물이나 슬픔을 필수 조건으로 만들거나 뭉클함을 긍정 정서 하나로 고정하지 않는다.",
         "사전은 강한 감정이 마음에 생겨 가슴에 꽉 차는 느낌을 제시하고, 감동 표현 유의어 연구는 벅차다·찡하다·감격스럽다·뿌듯하다와의 구분을 분석한다.",
         "강한 감동 표현을 한국 문화 특유의 정서로 과장하지 않고 실제 어휘 의미와 용례 범위만 설명한다.", []),
    ]
    for cfg in configs:
        rec = record(*cfg)
        write_json(f"content/g5/research-records/{rec['card_id']}.json", rec)


if __name__ == "__main__":
    add_references()
    add_records()
    print(json.dumps({"status": "PASS", "references_added_through": "R0069", "records": [f"C{i:04d}" for i in range(6,11)], "lifecycle": "HOLD", "review_ready": False}, ensure_ascii=False))
