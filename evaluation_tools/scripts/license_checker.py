"""License compliance checks for dataset sources."""

from __future__ import annotations

from pathlib import Path

from .pipeline_core import now_iso, write_json


KNOWN_COMMERCIAL_FRIENDLY = {
    "cc by 4.0",
    "cc-by 4.0",
    "cc by 4.0",
    "cc0",
    "cc0 1.0",
    "public domain",
    "public-domain",
    "client_license",
    "proprietary",
    "bsd",
    "mit",
    "apache 2.0",
}


def check_licenses(sources: list, workspace: Path, run_id: str) -> dict:
    report = {
        "run_id": run_id,
        "generated_at": now_iso(),
        "total": len(sources),
        "compliant": 0,
        "blocked": 0,
        "warnings": 0,
        "items": [],
    }

    for source in sources:
        lic = (source.get("license") or "").strip().lower()
        commercial = bool(source.get("commercial_use", True))
        if source.get("status") != "ok":
            report["warnings"] += 1
            status = "warning"
            notes = source.get("error") or "download blocked"
        elif "commercial use" in lic and "allowed" in lic:
            report["compliant"] += 1
            status = "compliant"
            notes = "explicit commercial use allowed"
        elif commercial:
            if lic in KNOWN_COMMERCIAL_FRIENDLY or not lic:
                report["compliant"] += 1
                status = "compliant"
                notes = "matched allowed list or explicit commercial policy"
            else:
                report["warnings"] += 1
                status = "warning"
                notes = "license text is non-standard, requires legal review"
        else:
            report["blocked"] += 1
            status = "blocked"
            notes = "commercial_use is false"

        report["items"].append({
            "dataset_id": source.get("dataset_id"),
            "source": source.get("source_type", "unknown"),
            "license": source.get("license"),
            "commercial_use": commercial,
            "status": status,
            "notes": notes,
        })

    out = workspace / "license_report.json"
    write_json(out, report)
    return report

