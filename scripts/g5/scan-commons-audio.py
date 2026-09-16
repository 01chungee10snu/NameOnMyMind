#!/usr/bin/env python3
"""Discover candidate pronunciation audio from Wikimedia Commons, politely.

Admission research only: discovery output is NEVER product evidence. A later audit
must still confirm exact term, locale, creator, license/rights, and downloaded byte
identity before asset-registry linkage.
"""
from __future__ import annotations

import html
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
POOL = ROOT / "content/g5/candidate-pool.json"
OUT = ROOT / "content/g5/commons-audio-admission-ledger.json"
API = "https://commons.wikimedia.org/w/api.php"
UA = "NameOnMyMind/0.1 (noncommercial pronunciation provenance research)"
REQUEST_GAP_SECONDS = 0.75
PREFIX_HINTS = {
    "en-US": ["En-us-", "en-us-", "En-US-"],
    "de-DE": ["De-", "de-", "De-de-"],
    "fr-FR": ["Fr-", "fr-", "Fr-fr-"],
    "es-ES": ["Es-", "es-", "Es-es-"],
    "pt-BR": ["Pt-br-", "pt-br-", "Pt-"],
    "pt-PT": ["Pt-pt-", "pt-pt-", "Pt-"],
    "ja-JP": ["Ja-", "ja-"],
    "ko-KR": ["Ko-", "ko-"],
    "zh-CN": ["Zh-", "zh-", "Zh-cn-", "zh-cn-"],
}

_last_request_at = 0.0


def api(params: dict, attempts: int = 6) -> dict:
    global _last_request_at
    q = {"format": "json", "formatversion": 2, "maxlag": 5, **params}
    url = API + "?" + urllib.parse.urlencode(q)
    for attempt in range(attempts):
        gap = REQUEST_GAP_SECONDS - (time.monotonic() - _last_request_at)
        if gap > 0:
            time.sleep(gap)
        req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=35) as r:
                _last_request_at = time.monotonic()
                return json.load(r)
        except urllib.error.HTTPError as exc:
            _last_request_at = time.monotonic()
            if exc.code not in (429, 503) or attempt == attempts - 1:
                raise
            retry = exc.headers.get("Retry-After")
            try:
                wait = max(5.0, float(retry)) if retry else 5.0 * (2 ** attempt)
            except ValueError:
                wait = 5.0 * (2 ** attempt)
            print(f"RATE_LIMIT {exc.code}: sleeping {wait:.1f}s", flush=True)
            time.sleep(min(wait, 60.0))
    raise RuntimeError("API retry loop exhausted")


def clean(value) -> str:
    if isinstance(value, dict):
        value = value.get("value", "")
    value = html.unescape(str(value or ""))
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def search_titles(term: str) -> list[str]:
    d = api({"action": "query", "list": "search", "srsearch": f'{term} filetype:audio', "srnamespace": 6, "srlimit": 8})
    titles = []
    seen = set()
    for row in d.get("query", {}).get("search", []):
        title = row.get("title")
        if title and title not in seen:
            seen.add(title); titles.append(title)
    return titles[:8]


def bulk_details(titles: list[str]) -> list[dict]:
    if not titles:
        return []
    d = api({
        "action": "query",
        "prop": "imageinfo",
        "titles": "|".join(titles),
        "iiprop": "url|sha1|mime|mediatype|extmetadata",
    })
    result = []
    for page in d.get("query", {}).get("pages", []):
        if not page.get("imageinfo"):
            continue
        ii = page["imageinfo"][0]
        ext = ii.get("extmetadata", {})
        result.append({
            "title": page.get("title"),
            "url": ii.get("url"),
            "description_url": ii.get("descriptionurl"),
            "sha1": ii.get("sha1"),
            "mime": ii.get("mime"),
            "mediatype": ii.get("mediatype"),
            "creator": clean(ext.get("Artist")),
            "credit": clean(ext.get("Credit")),
            "description": clean(ext.get("ImageDescription")),
            "license_short_name": clean(ext.get("LicenseShortName")),
            "license_url": clean(ext.get("LicenseUrl")),
            "usage_terms": clean(ext.get("UsageTerms")),
            "attribution_required": clean(ext.get("AttributionRequired")),
        })
    order = {t: i for i, t in enumerate(titles)}
    result.sort(key=lambda x: order.get(x["title"], 999))
    return result


def lexical_match(term: str, title: str, description: str) -> bool:
    t = re.sub(r"[\s_-]+", "", term.casefold())
    hay = re.sub(r"[\s_-]+", "", (title + " " + description).casefold())
    return bool(t) and t in hay


def provisional_status(term: str, language_code: str, row: dict) -> tuple[str, list[str]]:
    reasons = []
    if not row.get("url") or row.get("mediatype") != "AUDIO": reasons.append("not_audio")
    if not row.get("creator"): reasons.append("creator_missing")
    if not row.get("license_short_name"): reasons.append("license_missing")
    if not row.get("sha1"): reasons.append("source_hash_missing")
    if not lexical_match(term, row.get("title", ""), row.get("description", "")): reasons.append("term_fit_unclear")
    title = row.get("title", "").casefold()
    text = " ".join([row.get("description", ""), row.get("credit", "")]).casefold()
    prefixes = PREFIX_HINTS.get(language_code, [])
    locale_signal = any(title.startswith("file:" + p.casefold()) for p in prefixes)
    lang_root = language_code.split("-")[0].casefold()
    if lang_root in text or language_code.casefold() in text:
        locale_signal = True
    if not locale_signal:
        reasons.append("locale_fit_requires_manual_confirmation")
    return ("PROVISIONAL_PASS" if not reasons else "REVIEW_REQUIRED", reasons)


def main() -> int:
    pool = json.loads(POOL.read_text(encoding="utf-8"))
    items = []
    total = len(pool["candidates"])
    for n, cand in enumerate(pool["candidates"], 1):
        try:
            rows = bulk_details(search_titles(cand["term"]))
            for row in rows:
                status, reasons = provisional_status(cand["term"], cand["language_code"], row)
                row["provisional_status"] = status
                row["reasons"] = reasons
            rows.sort(key=lambda x: (x["provisional_status"] != "PROVISIONAL_PASS", len(x["reasons"]), x["title"] or ""))
            item = {**cand, "audio_candidates": rows[:6], "audio_candidate_count": len(rows[:6])}
        except Exception as exc:
            item = {**cand, "audio_candidates": [], "audio_candidate_count": 0, "scan_error": f"{type(exc).__name__}: {exc}"}
        items.append(item)
        pass_count = sum(x["provisional_status"] == "PROVISIONAL_PASS" for x in item["audio_candidates"])
        print(f"[{n:02d}/{total}] {cand['language_code']} {cand['term']}: candidates={item['audio_candidate_count']} provisional={pass_count}", flush=True)
    out = {
        "schema_version": "1.0.0",
        "purpose": "Admission research only; no result is product evidence until source-first manual/structural audit.",
        "source": "Wikimedia Commons MediaWiki Action API",
        "items": items,
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    stats = {"candidate_count": len(items), "with_audio_candidate": 0, "with_provisional_pass": 0, "by_language": {}}
    for x in items:
        has = bool(x["audio_candidates"])
        provisional = any(y["provisional_status"] == "PROVISIONAL_PASS" for y in x["audio_candidates"])
        stats["with_audio_candidate"] += has
        stats["with_provisional_pass"] += provisional
        d = stats["by_language"].setdefault(x["language_code"], {"total": 0, "with_audio": 0, "provisional": 0})
        d["total"] += 1; d["with_audio"] += has; d["provisional"] += provisional
    print(json.dumps(stats, ensure_ascii=False, indent=2), flush=True)
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
