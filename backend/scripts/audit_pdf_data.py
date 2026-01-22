import json
import re
import csv
from pathlib import Path
from collections import Counter, defaultdict

# -----------------------------
# Config
# -----------------------------
DEFAULT_JSON_PATH = Path("data/pdf_data.json")

# Key corpora we expect in a Pakistani legal platform
EXPECTED_LAWS = [
    ("Pakistan Penal Code", ["PENAL CODE", "PPC", "ACT XLV OF 1860", "ACT 45 OF 1860"]),
    ("Code of Criminal Procedure", ["CRIMINAL PROCEDURE", "CrPC", "CR.P.C", "ACT V OF 1898", "ACT 5 OF 1898"]),
    ("Code of Civil Procedure", ["CIVIL PROCEDURE", "CPC", "ACT V OF 1908", "ACT 5 OF 1908"]),
    ("Constitution of Pakistan 1973", ["CONSTITUTION OF PAKISTAN", "1973"]),
    ("Qanun-e-Shahadat Order 1984", ["QANUN-E-SHAHADAT", "SHAHADAT", "1984"]),
    ("Muslim Family Laws Ordinance 1961", ["MUSLIM FAMILY LAWS", "1961"]),
    ("Family Courts Act 1964", ["FAMILY COURTS ACT", "1964"]),
    ("Guardians and Wards Act 1890", ["GUARDIANS AND WARDS", "1890"]),
]

# Specific sections/articles that matter for common workflows
EXPECTED_SECTIONS = [
    ("PPC 268 (Public Nuisance)", [r"\bSECTION\s*268\b", r"\b268\.\s*Public nuisance\b", r"\b268\b.*\bnuisance\b"]),
    ("PPC 290 (Punishment for nuisance)", [r"\bSECTION\s*290\b", r"\b290\b.*\bnuisance\b"]),
    ("PPC 291 (Continuance after injunction)", [r"\bSECTION\s*291\b", r"\b291\b.*\bnuisance\b"]),
    ("CrPC 497 (Post-arrest bail)", [r"\bSECTION\s*497\b", r"\b497\b.*\bCr\.?P\.?C\b", r"\b497\b.*\bbail\b"]),
    ("CrPC 498 (Pre-arrest bail)", [r"\bSECTION\s*498\b", r"\b498\b.*\bCr\.?P\.?C\b", r"\b498\b.*\bbail\b"]),
    ("Constitution Art 199 (Writ)", [r"\bARTICLE\s*199\b", r"\bART\.?\s*199\b"]),
    ("PPC 489F (Cheque dishonour)", [r"\b489\s*[-]?\s*F\b", r"\b489F\b"]),
]

# Corruption heuristics thresholds (tweak if needed)
SPACED_LETTER_RUN_RE = re.compile(r"(?:\b[a-zA-Z]\s+){8,}[a-zA-Z]\b")
SOFT_HYPHEN = "\u00ad"
UNICODE_ESCAPES_RE = re.compile(r"\\u[0-9a-fA-F]{4}")
NON_ASCII_RE = re.compile(r"[^\x09\x0A\x0D\x20-\x7E]")  # excludes common whitespace; catches odd chars
MULTI_SPACE_RE = re.compile(r"[ \t]{4,}")
LOW_WORD_RE = re.compile(r"\b[a-zA-Z]{1,2}\b")

ACT_HINTS = [
    "PENAL CODE", "CRIMINAL PROCEDURE", "CIVIL PROCEDURE", "CONSTITUTION",
    "QANUN-E-SHAHADAT", "FAMILY COURTS", "GUARDIANS AND WARDS", "MUSLIM FAMILY LAWS",
    "ORDINANCE", "ACT", "ORDER", "REGULATION"
]

def safe_int(n, d=0):
    try:
        return int(n)
    except Exception:
        return d

def snippet(text: str, maxlen=200) -> str:
    t = re.sub(r"\s+", " ", text).strip()
    return t[:maxlen] + ("…" if len(t) > maxlen else "")

def score_corruption(text: str) -> dict:
    """Return metrics and a simple corruption score."""
    if not text:
        return {
            "chars": 0,
            "spaced_letter_runs": 0,
            "soft_hyphens": 0,
            "unicode_escapes": 0,
            "non_ascii": 0,
            "multi_spaces": 0,
            "short_word_ratio": 0.0,
            "score": 0.0,
        }

    chars = len(text)
    spaced = len(SPACED_LETTER_RUN_RE.findall(text))
    soft = text.count(SOFT_HYPHEN) + text.count("­")  # include visible soft hyphen variants
    uesc = len(UNICODE_ESCAPES_RE.findall(text))
    non_ascii = len(NON_ASCII_RE.findall(text))
    multi_spaces = len(MULTI_SPACE_RE.findall(text))

    words = re.findall(r"\b\w+\b", text)
    short_words = LOW_WORD_RE.findall(text)
    short_ratio = (len(short_words) / max(1, len(words)))

    # Simple weighted score (0..1-ish)
    # spaced letters is the strongest sign of OCR damage
    score = 0.0
    score += min(1.0, spaced / 5.0) * 0.45
    score += min(1.0, soft / 200.0) * 0.15
    score += min(1.0, uesc / 100.0) * 0.10
    score += min(1.0, non_ascii / 2000.0) * 0.10
    score += min(1.0, multi_spaces / 200.0) * 0.05
    score += min(1.0, short_ratio / 0.35) * 0.15

    return {
        "chars": chars,
        "spaced_letter_runs": spaced,
        "soft_hyphens": soft,
        "unicode_escapes": uesc,
        "non_ascii": non_ascii,
        "multi_spaces": multi_spaces,
        "short_word_ratio": round(short_ratio, 4),
        "score": round(min(1.0, score), 4),
    }

def detect_act_markers(text_upper: str) -> list:
    found = []
    for k in ACT_HINTS:
        if k in text_upper:
            found.append(k)
    return found[:12]

def regex_any(text_upper: str, patterns: list[str]) -> bool:
    for pat in patterns:
        if re.search(pat, text_upper, flags=re.IGNORECASE):
            return True
    return False

def main(json_path: Path):
    if not json_path.exists():
        raise SystemExit(f"ERROR: File not found: {json_path.resolve()}")

    data = json.loads(json_path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise SystemExit("ERROR: pdf_data.json must be a list of {file_name, text} objects")

    rows = []
    corpus_upper_join_sample = []  # small sample to detect global presence quickly
    act_counter = Counter()

    total_chars = 0
    empty_count = 0

    for i, item in enumerate(data):
        file_name = str(item.get("file_name", f"index_{i}"))
        text = str(item.get("text", "") or "")
        total_chars += len(text)
        if not text.strip():
            empty_count += 1

        metrics = score_corruption(text)
        text_upper = text.upper()
        act_markers = detect_act_markers(text_upper)
        for am in act_markers:
            act_counter[am] += 1

        # sample for global scanning (avoid huge memory)
        if len(corpus_upper_join_sample) < 500:
            corpus_upper_join_sample.append(text_upper[:4000])

        rows.append({
            "index": i,
            "file_name": file_name,
            "chars": metrics["chars"],
            "corruption_score": metrics["score"],
            "spaced_letter_runs": metrics["spaced_letter_runs"],
            "soft_hyphens": metrics["soft_hyphens"],
            "unicode_escapes": metrics["unicode_escapes"],
            "non_ascii": metrics["non_ascii"],
            "multi_spaces": metrics["multi_spaces"],
            "short_word_ratio": metrics["short_word_ratio"],
            "act_markers": ";".join(act_markers),
            "preview": snippet(text, 220),
        })

    # Sort by corruption
    worst = sorted(rows, key=lambda r: r["corruption_score"], reverse=True)[:30]
    biggest = sorted(rows, key=lambda r: r["chars"], reverse=True)[:20]
    smallest_nonempty = sorted([r for r in rows if r["chars"] > 0], key=lambda r: r["chars"])[:20]

    # Global presence checks
    global_text = "\n".join(corpus_upper_join_sample)

    law_presence = {}
    for law_name, hints in EXPECTED_LAWS:
        law_presence[law_name] = any(h.upper() in global_text for h in hints)

    section_presence = {}
    # we need to search entire corpus for section checks; do a controlled scan
    # NOTE: for speed, search on a bounded concatenation of upper samples + full scan only if needed
    for sec_name, patterns in EXPECTED_SECTIONS:
        # fast check on sample
        present = regex_any(global_text, patterns)
        section_presence[sec_name] = present

    # If some are missing in sample, do a deeper scan (still efficient) for those only
    missing_sections = [k for k, v in section_presence.items() if not v]
    if missing_sections:
        # Deep scan only those missing
        for sec_name in missing_sections:
            patterns = dict(EXPECTED_SECTIONS)[sec_name]
            found = False
            for item in data:
                t = str(item.get("text", "") or "")
                if not t:
                    continue
                if regex_any(t, patterns):
                    found = True
                    break
            section_presence[sec_name] = found

    # Missing laws (based on hint presence)
    missing_laws = [law for law, present in law_presence.items() if not present]
    missing_secs = [sec for sec, present in section_presence.items() if not present]

    # Build report
    report = {
        "file": str(json_path.resolve()),
        "summary": {
            "entries": len(rows),
            "total_chars": total_chars,
            "empty_entries": empty_count,
            "avg_chars_per_entry": round(total_chars / max(1, len(rows)), 2),
        },
        "top_act_markers": act_counter.most_common(25),
        "expected_laws_presence": law_presence,
        "expected_sections_presence": section_presence,
        "missing_laws": missing_laws,
        "missing_sections": missing_secs,
        "worst_corruption_examples": [
            {
                "file_name": r["file_name"],
                "corruption_score": r["corruption_score"],
                "spaced_letter_runs": r["spaced_letter_runs"],
                "soft_hyphens": r["soft_hyphens"],
                "unicode_escapes": r["unicode_escapes"],
                "non_ascii": r["non_ascii"],
                "preview": r["preview"],
            }
            for r in worst[:10]
        ],
        "largest_documents": [
            {"file_name": r["file_name"], "chars": r["chars"], "corruption_score": r["corruption_score"]}
            for r in biggest[:10]
        ],
        "smallest_nonempty_documents": [
            {"file_name": r["file_name"], "chars": r["chars"], "corruption_score": r["corruption_score"]}
            for r in smallest_nonempty[:10]
        ],
    }

    # Write outputs
    out_json = json_path.parent / "pdf_data_audit_report.json"
    out_csv = json_path.parent / "pdf_data_audit_rows.csv"

    out_json.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")

    with open(out_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)

    # Console summary
    print("\n=== PDF_DATA.JSON AUDIT REPORT ===")
    print(f"File: {json_path.resolve()}")
    print(f"Entries: {len(rows)} | Empty: {empty_count} | Total chars: {total_chars}")
    print(f"Average chars/entry: {report['summary']['avg_chars_per_entry']}")
    print("\nTop act markers (rough signals):")
    for k, v in report["top_act_markers"][:12]:
        print(f"  - {k}: {v}")

    print("\nExpected law corpora presence:")
    for law, present in law_presence.items():
        print(f"  - {law}: {'YES' if present else 'NO'}")

    print("\nExpected key sections/articles presence:")
    for sec, present in section_presence.items():
        print(f"  - {sec}: {'YES' if present else 'NO'}")

    if missing_laws:
        print("\nMISSING (likely not present in corpus):")
        for m in missing_laws:
            print(f"  - {m}")

    if missing_secs:
        print("\nMISSING SECTIONS/ARTICLES (not found by regex scan):")
        for m in missing_secs:
            print(f"  - {m}")

    print("\nWorst corruption examples (top 5):")
    for r in worst[:5]:
        print(f"  - {r['file_name']} | score={r['corruption_score']} | spaced_runs={r['spaced_letter_runs']} | soft_hyphens={r['soft_hyphens']}")

    print(f"\nWrote: {out_json}")
    print(f"Wrote: {out_csv}")
    print("Done.\n")


if __name__ == "__main__":
    # You can edit path here if running from a different working directory:
    main(DEFAULT_JSON_PATH)
