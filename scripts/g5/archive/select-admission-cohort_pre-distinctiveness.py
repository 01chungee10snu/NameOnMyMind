#!/usr/bin/env python3
"""Select a *research cohort* for G5 after audio + scholarly admission checks.

The output is not a publication list. It is a bounded research queue. Lexical,
card-specific semantic, comparison, cultural, rights byte-audit, schema, and human
release gates remain downstream requirements.
"""
from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUDIO = ROOT / "content/g5/commons-audio-admission-ledger.json"
SCHOLARLY = ROOT / "content/g5/scholarly-source-map.json"
OUT = ROOT / "content/g5/admission-cohort.json"
TARGET = 45

# Diversity guard: no new language may dominate the 45-card expansion.
MAX_NEW_BY_LANGUAGE = {
    "en-US": 12,
    "de-DE": 5,
    "fr-FR": 5,
    "es-ES": 5,
    "pt-BR": 4,
    "pt-PT": 2,
    "ja-JP": 5,
    "ko-KR": 5,
    "zh-CN": 5,
}
# Prefer script/language diversity before using remaining capacity.
LANGUAGE_PRIORITY = ["ja-JP", "ko-KR", "zh-CN", "de-DE", "fr-FR", "es-ES", "pt-BR", "pt-PT", "en-US"]


def main() -> int:
    if not AUDIO.exists():
        raise SystemExit("audio admission ledger missing; run scan-commons-audio.py first")
    audio = json.loads(AUDIO.read_text(encoding="utf-8"))
    scholarly = json.loads(SCHOLARLY.read_text(encoding="utf-8"))
    support = defaultdict(list)
    for source in scholarly["sources"]:
        for construct in source["supports_constructs"]:
            support[construct].append(source["source_id"])

    eligible = []
    excluded = []
    for item in audio["items"]:
        audio_pass = [x for x in item.get("audio_candidates", []) if x.get("provisional_status") == "PROVISIONAL_PASS"]
        source_ids = support.get(item["construct"], [])
        row = {
            "term": item["term"],
            "language_code": item["language_code"],
            "language_name": item["language_name"],
            "construct": item["construct"],
            "provisional_audio": audio_pass[:2],
            "scholarly_source_ids": source_ids,
        }
        if audio_pass and source_ids:
            eligible.append(row)
        else:
            reasons = []
            if not audio_pass: reasons.append("NO_PROVISIONAL_AUDIO")
            if not source_ids: reasons.append("NO_VERIFIED_SCHOLARLY_CONSTRUCT_SOURCE")
            excluded.append({**row, "exclusion_reasons": reasons})

    chosen = []
    used = Counter()
    remaining = eligible[:]
    # First diversity pass: cycle languages and take at most one each round.
    while len(chosen) < TARGET:
        progress = False
        for lc in LANGUAGE_PRIORITY:
            if len(chosen) >= TARGET: break
            if used[lc] >= MAX_NEW_BY_LANGUAGE.get(lc, 0): continue
            idx = next((i for i, x in enumerate(remaining) if x["language_code"] == lc), None)
            if idx is None: continue
            row = remaining.pop(idx)
            chosen.append(row); used[lc] += 1; progress = True
        if not progress: break
    status = "COHORT_READY" if len(chosen) == TARGET else "COHORT_SHORTFALL"
    out = {
        "schema_version": "1.0.0",
        "status": status,
        "target_new_cards": TARGET,
        "selected_count": len(chosen),
        "selected": [
            {**row, "provisional_card_id": f"C{idx:04d}", "admission_status": "RESEARCH_ADMITTED_NOT_VERIFIED"}
            for idx, row in enumerate(chosen, start=6)
        ],
        "language_counts": dict(sorted(used.items())),
        "eligible_not_selected": remaining,
        "excluded": excluded,
        "boundaries": [
            "Admission does not equal REVIEW_READY or PUBLISHED.",
            "Commons provisional metadata must be re-audited and downloaded bytes hashed before asset linkage.",
            "Authoritative target lexical source is still required.",
            "Card-specific scholarly claim fit is still required even when a construct source is mapped.",
            "Human Editorial Release remains mandatory after all machine gates.",
        ],
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": status, "selected_count": len(chosen), "language_counts": out["language_counts"], "eligible_total": len(eligible)}, ensure_ascii=False, indent=2))
    return 0 if status == "COHORT_READY" else 2

if __name__ == "__main__":
    raise SystemExit(main())
