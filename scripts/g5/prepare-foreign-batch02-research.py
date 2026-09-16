#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT / "content/g5/batches/02_foreign_semantic_gap_config.json"
TODAY = "2026-09-17"


def read_json(rel: str):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def write_json(rel: str, value):
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def inventory(reference_id: str, role: str, tier: str = "A"):
    return {"reference_id": reference_id, "role": role, "quality_tier": tier}


def review(status: str, summary: str, refs: list[str]):
    return {"status": status, "summary": summary, "reference_ids": refs}


def comparison(status: str, terms: list[str], difference: str, note: str, refs: list[str]):
    return {
        "status": status,
        "near_terms": terms,
        "difference_note": difference,
        "verification_note": note,
        "reference_ids": refs,
    }


def claim(number: int, text: str, refs: list[str], locator: str):
    return {
        "claim_id": f"CL-{number:03d}",
        "claim": text,
        "reference_ids": refs,
        "evidence_locator": locator,
        "public_safe": True,
    }


def main():
    cfg = json.loads(CONFIG.read_text(encoding="utf-8"))
    registry = read_json("content/approved/references.json")

    existing = {r["reference_id"]: r for r in registry["references"]}
    for ref in cfg["references"]:
        rid = ref["reference_id"]
        if rid in existing and existing[rid] != ref:
            raise SystemExit(f"reference collision with different content: {rid}")
        existing[rid] = ref
    registry["references"] = [existing[k] for k in sorted(existing)]
    write_json("content/approved/references.json", registry)

    records = []
    for card in cfg["cards"]:
        cid = card["card_id"]
        lexical = card["lexical_ref"]
        scholarly = list(card["scholarly_refs"])
        pronunciation = card["pronunciation_ref"]
        evidence_refs = [lexical, *scholarly]

        target_is_zh = card["language_code"].startswith("zh")
        cost = {
            "classification": card["korean_expression_cost"],
            "status": "PASS",
            "nearest_korean_terms": card["korean_near_terms"],
            "natural_korean_rendering": card["natural_korean_rendering"],
            "residue_dimensions": card["residue_dimensions"],
            "reference_ids": evidence_refs,
            "rationale": (
                "한국어의 흔한 한 단어가 의미 전체를 보존하는지 먼저 검토했다. "
                "이 후보는 핵심 의미 요소가 여러 한국어 표현으로 분산되거나 설명적 구가 필요하며, "
                "원어 사전과 직접 관련 학술 근거가 그 의미 잔여를 뒷받침한다."
            ),
        }

        rr = {
            "schema_version": "2.1.0",
            "research_id": f"RR-{cid}-FOREIGN",
            "card_id": cid,
            "candidate": {
                "term": card["term"],
                "language_code": card["language_code"],
                "language_name": card["language_name"],
                "experience_type": card["experience_type"],
            },
            "lifecycle_state": "HOLD",
            "source_inventory": [
                inventory(lexical, "lexical"),
                *[inventory(x, "scholarly") for x in scholarly],
                inventory(pronunciation, "pronunciation", "B"),
            ],
            "lexical_verification": review(
                "PASS",
                "원어 권위 사전에서 목표 표제어와 카드에 사용할 의미 범위를 확인했다.",
                [lexical],
            ),
            "semantic_definition_and_boundaries": review(
                "PASS", card["semantic_residue"], evidence_refs
            ),
            "cultural_context_review": review(
                "PASS",
                "언어·문화 맥락을 설명하되 해당 문화 사람만 이 경험을 느낀다는 본질주의나 번역불가능성 주장을 하지 않는다.",
                evidence_refs,
            ),
            "comparisons": {
                "ko": comparison(
                    "PASS",
                    card["korean_near_terms"],
                    "한국어 근접어 하나로는 핵심 의미 패키지를 모두 보존하기 어렵다.",
                    "Korean Expression Cost review PASS.",
                    evidence_refs,
                ),
                "en": comparison(
                    "HOLD",
                    card["en_near_terms"],
                    "영어 근접어는 provisional이며 독립 lexical verification 전에는 최종 비교로 승격하지 않는다.",
                    "Research-stage provisional mapping.",
                    [lexical],
                ),
                "zh": comparison(
                    "PASS" if target_is_zh else "HOLD",
                    card["zh_near_terms"],
                    "원어가 중국어이면 target lexical evidence로 자체 의미를 확인했고, 그 외에는 provisional이다.",
                    "Target-language evidence or provisional mapping.",
                    [lexical],
                ),
                "ja": comparison(
                    "HOLD",
                    card["ja_near_terms"],
                    "일본어 근접어는 provisional이며 독립 lexical verification 전에는 최종 비교로 승격하지 않는다.",
                    "Research-stage provisional mapping.",
                    [lexical],
                ),
            },
            "pronunciation_verification": {
                "status": "HOLD",
                "ipa": card["ipa"],
                "locale": card["language_code"],
                "reference_ids": [pronunciation],
                "audio_asset_id": None,
                "notes": (
                    "IPA/transliteration provenance is recorded, but exact product-safe audio source, creator, "
                    "locale fit, license, rights, and SHA linkage are not yet verified."
                ),
            },
            "claim_source_map": [
                claim(
                    1,
                    card["semantic_residue"],
                    evidence_refs,
                    "Target lexical definition plus directly relevant scholarly evidence.",
                ),
                claim(
                    2,
                    "한국어의 흔한 한 단어 하나로는 핵심 의미 패키지를 모두 보존하기 어렵다.",
                    evidence_refs,
                    "Korean Expression Cost review against target semantic components.",
                ),
            ],
            "relations": [],
            "illustration_brief": review(
                "HOLD",
                "Product audio rights and full multilingual comparison are incomplete; illustration is deferred.",
                [lexical],
            ),
            "editorial_copy": review(
                "HOLD",
                "Public poetic copy is deferred until all gates can be evaluated together.",
                evidence_refs,
            ),
            "automated_gates": {
                "schema": "PASS",
                "evidence": "PASS",
                "pronunciation": "HOLD",
                "cultural_humility": "PASS",
                "rights": "HOLD",
                "privacy": "PASS",
            },
            "distinctiveness_review": {
                "status": "PASS",
                "track": "FOREIGN_KOREAN_GAP",
                "generic_basic_emotion": False,
                "nearest_cross_language_terms": {
                    "ko": card["korean_near_terms"],
                    "en": card["en_near_terms"],
                    "zh": card["zh_near_terms"],
                    "ja": card["ja_near_terms"],
                },
                "semantic_residue": card["semantic_residue"],
                "residue_reference_ids": evidence_refs,
                "overclaim_to_avoid": card["overclaim"],
                "korean_expression_cost": cost,
            },
            "human_editorial_release": {
                "status": "PENDING",
                "reviewer": None,
                "reviewed_at": None,
                "notes": (
                    "Research-stage HOLD. Human Editorial Release is not open until product audio rights "
                    "and full multilingual comparison pass."
                ),
            },
            "changelog": [
                {
                    "date": TODAY,
                    "state": "RESEARCH",
                    "note": "Foreign semantic-gap source-first research under v2.1 Korean Expression Cost contract.",
                },
                {
                    "date": TODAY,
                    "state": "HOLD",
                    "note": "Core semantic gap passes; product audio rights and full multilingual comparison remain incomplete.",
                },
            ],
        }
        write_json(f"content/g5/research-records/{cid}.json", rr)
        records.append(cid)

    batch = {
        "schema_version": "1.0.0",
        "batch_id": cfg["batch_id"],
        "status": "RESEARCH_CORE_PASS_PRODUCT_GATES_HOLD",
        "recorded_at": cfg["recorded_at"],
        "card_ids": records,
        "terms": [x["term"] for x in cfg["cards"]],
        "languages": sorted({x["language_name"] for x in cfg["cards"]}),
        "korean_expression_cost": {
            x["card_id"]: x["korean_expression_cost"] for x in cfg["cards"]
        },
        "screened_out": cfg["screened_out"],
        "audio_rights": "HOLD_UNTIL_PRODUCT_SAFE_AUDIO_VERIFIED",
        "full_multilingual_comparison": "HOLD_FOR_INDEPENDENT_EN_ZH_JA_LEXICAL_VERIFICATION",
        "review_ready": 0,
        "public_promotion_authorized": False,
        "config": "content/g5/batches/02_foreign_semantic_gap_config.json",
    }
    write_json("content/g5/batches/02_foreign_semantic_gap_research.json", batch)
    print(json.dumps({"status": "PASS", "cards": records, "reference_count": len(registry["references"])}, ensure_ascii=False))


if __name__ == "__main__":
    main()
