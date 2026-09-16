#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TODAY = "2026-09-16"
CARD_IDS = ["C0002", "C0003", "C0004", "C0005"]
CHECKLIST = {
    "poetic_copy_does_not_exceed_evidence": "PASS",
    "cross_language_comparisons_not_one_to_one": "PASS",
    "cultural_framing_avoids_exoticization_and_overgeneralization": "PASS",
    "illustration_does_not_stereotype_or_diagnose": "PASS",
    "reflection_is_optional_low_pressure_non_diagnostic": "PASS",
    "verification_and_reference_presentation_is_understandable": "PASS",
    "share_and_public_assets_contain_no_private_or_local_state": "PASS",
}


def read_json(rel: str):
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def write_json(rel: str, value):
    path = ROOT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def sha(rel: str) -> str:
    return hashlib.sha256((ROOT / rel).read_bytes()).hexdigest()


def main() -> int:
    machine = read_json("docs/ops/evidence/G4_EXECUTION_EVIDENCE.json")
    if machine.get("status") != "MACHINE_COMPLETE_HUMAN_BLOCKED":
        raise SystemExit("G4 machine gate is not in MACHINE_COMPLETE_HUMAN_BLOCKED state")
    if machine.get("canary", {}).get("review_ready_pending") != CARD_IDS:
        raise SystemExit("G4 pending-card set mismatch")
    if machine.get("verification_summary", {}).get("clean_checkout") != "PASS":
        raise SystemExit("G4 clean-checkout evidence missing")

    assets = read_json("content/approved/assets.json")
    asset_by_card = {}
    for asset in assets["assets"]:
        asset_by_card.setdefault(asset["card_id"], []).append(asset)

    release_cards = []
    for card_id in CARD_IDS:
        review_card_rel = f"content/review/cards/{card_id}.json"
        review_rr_rel = f"content/review/research-records/{card_id}.json"
        card = read_json(review_card_rel)
        rr = read_json(review_rr_rel)

        if card.get("status") != "REVIEW_READY":
            raise SystemExit(f"{card_id} is not REVIEW_READY")
        if rr.get("lifecycle_state") != "REVIEW_READY" or rr.get("human_editorial_release", {}).get("status") != "PENDING":
            raise SystemExit(f"{card_id} research record is not REVIEW_READY/PENDING")
        if any(value != "PASS" for value in rr.get("automated_gates", {}).values()):
            raise SystemExit(f"{card_id} automated gates are not all PASS")
        if any(asset.get("review_status") != "AUTOMATED_PASS" for asset in asset_by_card.get(card_id, [])):
            raise SystemExit(f"{card_id} assets are not all AUTOMATED_PASS")

        pre_card_sha = sha(review_card_rel)
        pre_rr_sha = sha(review_rr_rel)

        card["status"] = "PUBLISHED"
        rr["lifecycle_state"] = "APPROVED"
        rr["human_editorial_release"] = {
            "status": "APPROVED",
            "reviewer": "human_user",
            "reviewed_at": TODAY,
            "notes": "Explicit Human Editorial Release approval for C0002-C0005 in the current chat after the G4 machine gate, human-review packet, provenance audit, privacy regression, and clean-checkout regression all passed.",
        }
        rr.setdefault("changelog", []).append({
            "date": TODAY,
            "state": "APPROVED",
            "note": "Explicit user Human Editorial Release approval recorded; promoted from REVIEW_READY to approved PUBLISHED source after full G4 machine-gate evidence was PASS.",
        })

        write_json(f"content/approved/cards/{card_id}.json", card)
        write_json(f"content/approved/research-records/{card_id}.json", rr)

        release_evidence = {
            "schema_version": 1,
            "card_id": card_id,
            "term": card["term"]["original"],
            "decision": "APPROVED_AS_REVIEWED",
            "human_approval_source": "explicit_user_message_in_current_chat",
            "approval_message": "C0002~C0005 Human Editorial Release 승인",
            "reviewed_at": TODAY,
            "machine_gate_source": "docs/ops/evidence/G4_EXECUTION_EVIDENCE.json",
            "human_review_packet": "docs/ops/review/G4_HUMAN_EDITORIAL_REVIEW_PACKET_2026-09-16.json",
            "pre_release_sha256": {
                "review_card": pre_card_sha,
                "review_research_record": pre_rr_sha,
            },
            "human_editorial_release_checklist": CHECKLIST,
            "external_publish_authorized": False,
            "repository_push_authorized": False,
        }
        write_json(f"docs/ops/evidence/{card_id}_HUMAN_EDITORIAL_RELEASE_2026-09-16.json", release_evidence)
        release_cards.append({"card_id": card_id, "term": card["term"]["original"]})

    for asset in assets["assets"]:
        if asset["card_id"] in CARD_IDS:
            asset["review_status"] = "HUMAN_APPROVED"
            asset["reviewed_at"] = TODAY
    write_json("content/approved/assets.json", assets)

    for card_id in CARD_IDS:
        (ROOT / f"content/review/cards/{card_id}.json").unlink()
        (ROOT / f"content/review/research-records/{card_id}.json").unlink()

    blocker = read_json("docs/ops/blockers/G4_HUMAN_EDITORIAL_RELEASE_REQUIRED_2026-09-16.json")
    blocker.update({
        "status": "RESOLVED_HUMAN_EDITORIAL_RELEASE_APPROVED",
        "resolved_at": TODAY,
        "pending_card_ids": [],
        "g4_human_release_status": "APPROVED_5_OF_5",
        "g4_complete": False,
        "g5_admission_allowed": False,
        "resolution_note": "C0002-C0005 received explicit Human Editorial Release approval. Final G4 completion remains contingent on post-promotion validation, public-build parity, privacy scan, and clean-checkout regression.",
    })
    write_json("docs/ops/blockers/G4_HUMAN_EDITORIAL_RELEASE_REQUIRED_2026-09-16.json", blocker)

    summary = {
        "schema_version": 1,
        "goal": "G4",
        "decision": "HUMAN_EDITORIAL_RELEASE_APPROVED_5_OF_5",
        "approved_baseline": "C0001",
        "approved_this_turn": CARD_IDS,
        "cards": release_cards,
        "reviewed_at": TODAY,
        "post_promotion_regression_required": True,
        "g5_admission_allowed": False,
        "external_publish_authorized": False,
        "repository_push_authorized": False,
    }
    write_json("docs/ops/evidence/G4_HUMAN_EDITORIAL_RELEASE_2026-09-16.json", summary)
    print(json.dumps({"status": "PROMOTED_PENDING_POST_REGRESSION", "approved": CARD_IDS}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
