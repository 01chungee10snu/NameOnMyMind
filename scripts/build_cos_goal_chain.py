#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "reports/harness/cos_goal_chain"
LATEST = OUT_DIR / "latest_nameonmymind_goal_chain_packet.json"
CHAIN_DOC = ROOT / "docs/ops/COS_GOAL_CHAIN.md"
ARCH_DOCS = [
    ROOT / "docs/architecture/BRAND_IDENTITY.md",
    ROOT / "docs/architecture/CONTENT_DATA_ARCHITECTURE.md",
    ROOT / "docs/architecture/CONTENT_RESEARCH_WORKFLOW.md",
    ROOT / "docs/architecture/IMPLEMENTATION_BASELINE.md",
    ROOT / "docs/architecture/INTERACTION_PWA_ARCHITECTURE.md",
    ROOT / "docs/architecture/VISUAL_ART_DIRECTION.md",
    ROOT / "docs/architecture/WEBMCP_AGENT_INTERFACE.md",
]
SCHEMA = ROOT / "schema/card.schema.json"


def sha256(path: Path) -> str | None:
    try:
        return hashlib.sha256(path.read_bytes()).hexdigest()
    except Exception:
        return None


def canonical_sha(value: Any) -> str:
    raw = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def src(path: Path) -> dict[str, Any]:
    return {
        "path": str(path.relative_to(ROOT)),
        "exists": path.exists(),
        "sha256": sha256(path),
    }


def build() -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    goal = (
        "NameOnMyMind를 COS-governed development workflow로 완성한다. 제품 runtime은 COS와 독립적인 "
        "standards-first static HTML/CSS/ES Modules/PWA로 유지한다. 아래 5개 Goal을 순서대로 진행하며, "
        "각 Goal의 exit criteria가 모두 PASS한 경우에만 다음 Goal로 자동 승계한다. Goal 1은 검증된 실제 카드 "
        "1개의 end-to-end vertical slice, Goal 2는 core human experience, Goal 3은 WebMCP/PWA parity, Goal 4는 "
        "5-card evidence canary, Goal 5는 50-card deploy-ready MVP다. evidence/privacy/accessibility/cultural/rights "
        "gate를 낮추지 않고, public content는 검증된 근거만 사용한다. GitHub push/Pages 공개는 이 Goal의 권한 밖이다."
    )
    phases = [
        {
            "id": "G1",
            "name": "Verified 1-card vertical slice",
            "exit": [
                "repository boundaries established",
                "versioned card/reference/asset contracts validated",
                "one real Card Research Record approved",
                "one real public card passes schema/evidence/pronunciation/cultural/rights gates",
                "domain lookup and deterministic daily assignment work",
                "Daily Card Shell and canonical detail/deep-link work locally",
                "get_card/get_daily_card share domain semantics with Human UI",
                "private leakage 0",
                "clean-checkout focused regression PASS",
            ],
        },
        {
            "id": "G2",
            "name": "Core human experience",
            "exit": [
                "three-space navigation works",
                "same-day deterministic daily card freeze works",
                "reveal to detail flow works",
                "search and guided discovery work without diagnostic framing",
                "favorites/viewed/local reflection work",
                "relations and stable deep links work",
                "accessibility baseline PASS",
                "regression PASS",
            ],
        },
        {
            "id": "G3",
            "name": "Agent/PWA parity",
            "exit": [
                "versioned public machine-readable data exist",
                "agent-manifest.json exists",
                "read-mostly WebMCP tools registered behind adapter",
                "UI-Agent semantic parity PASS",
                "reflection body default agent exposure 0",
                "PWA manifest/service-worker/cache versioning PASS",
                "graceful offline fallback works",
                "share asset path works",
                "contract conformance PASS",
            ],
        },
        {
            "id": "G4",
            "name": "Five-card evidence canary",
            "exit": [
                "5/5 schema PASS",
                "5/5 minimum evidence PASS",
                "5/5 IPA and pronunciation provenance PASS",
                "5/5 cultural humility review PASS",
                "5/5 ko/en/zh/ja comparison PASS",
                "diversity and close semantic pair present",
                "relation graph integrity PASS",
                "UI-Agent parity PASS",
                "private leakage 0",
                "Human Editorial Release Checklist 5/5 PASS",
            ],
        },
        {
            "id": "G5",
            "name": "50-card deploy-ready MVP",
            "exit": [
                "50 cards PUBLISHED/REVISED under same contracts",
                "50 traceable Research Records and registry-first references",
                "diversity matrix maintained",
                "semantic graph/search/daily selection work across all 50",
                "reproducible references/assets/public bundle",
                "full automated quality gate PASS",
                "Human Editorial Release Checklist PASS",
                "local production build and clean-checkout regression PASS",
                "deploy-ready artifact and release notes exist",
            ],
        },
    ]
    hard = [
        "Do not skip a goal or work around a failed exit criterion.",
        "Do not weaken evidence, pronunciation, privacy, accessibility, cultural-humility, rights, or schema gates.",
        "Do not expose private interviews, private research notes, or personal reflections in public output.",
        "Do not fabricate citations, pronunciation, rights, review, test, or publication state.",
        "Do not make COS a product runtime dependency.",
        "Do not push to GitHub, enable Pages, publish externally, purchase services, or change domains without explicit user authorization.",
        "Do not overwrite/erase failed research evidence merely to make a canary pass; preserve HOLD/REJECTED reason and admit a replacement candidate.",
        "Do not duplicate work if another active NameOnMyMind pipeline/process is detected.",
    ]
    loop = [
        "1. Read current git/process state and the canonical Goal-chain/architecture/schema sources before changes.",
        "2. Determine the first incomplete Goal; do not start later goals while an earlier Goal has unresolved exit criteria.",
        "3. Select the highest-value currently actionable blocker inside that Goal and make the smallest coherent change.",
        "4. Validate with deterministic tests, schema/contract checks, privacy leakage checks, and clean-checkout reproduction when meaningful.",
        "5. For content work, use source-first research, registry-first references, pronunciation provenance, cultural-humility review, and rights checks; HOLD rather than guess.",
        "6. Update auditable Goal state and record evidence for completed exit criteria.",
        "7. When all exit criteria for the current Goal PASS, mark it COMPLETE and immediately continue with the next Goal.",
        "8. If an explicit-human-action blocker occurs, write a blocker artifact and stop Goal automation rather than inventing progress.",
        "9. When G5 is locally deploy-ready, stop. Do not push or publish externally without separate authorization.",
    ]
    stop = [
        "All G1-G5 exit criteria pass locally and deploy-ready artifacts exist.",
        "A genuine product-contract conflict cannot be resolved from the approved interview/architecture contracts.",
        "A required step needs credentials, MFA/CAPTCHA, paid purchase, GitHub push/Pages publication, domain mutation, or other explicit authorization.",
        "Required evidence/provenance/rights cannot be verified and no valid replacement candidate is currently available.",
        "Duplicate active work would make continuation unsafe.",
    ]
    sources = [src(CHAIN_DOC), src(SCHEMA), *[src(p) for p in ARCH_DOCS]]
    current_state = {
        "workspace": str(ROOT),
        "git_branch": "main",
        "initial_commit_exists": (ROOT / ".git/refs/heads/main").exists(),
        "interview_complete": True,
        "interview_question_count": 126,
        "external_publish_authorized": False,
    }
    core = {
        "schema_version": 1,
        "request_type": "SET_NAMEONMYMIND_GOAL_CHAIN",
        "generated_at_utc": now.isoformat(),
        "goal_mode": "goal",
        "loop_mode_requested": False,
        "loop_embedded_in_goal": True,
        "goal": goal,
        "phases": phases,
        "loop": loop,
        "hard_boundaries": hard,
        "stop_conditions": stop,
        "current_state": current_state,
        "source_lineage": sources,
        "external_publish_authorized": False,
        "repository_push_authorized": False,
    }
    packet_sha = canonical_sha(core)
    event_id = f"NOMM-COS-GOALCHAIN-{now.strftime('%Y%m%dT%H%M%SZ')}-{packet_sha[:8]}"
    return {"event_id": event_id, "packet_sha256": packet_sha, **core}


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    packet = build()
    raw = json.dumps(packet, ensure_ascii=False, indent=2) + "\n"
    event = OUT_DIR / f"{packet['event_id']}.packet.json"
    event.write_text(raw, encoding="utf-8")
    LATEST.write_text(raw, encoding="utf-8")
    print(json.dumps({
        "event_id": packet["event_id"],
        "packet_sha256": packet["packet_sha256"],
        "goal_mode": packet["goal_mode"],
        "phase_count": len(packet["phases"]),
        "external_publish_authorized": False,
        "output": str(LATEST),
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
