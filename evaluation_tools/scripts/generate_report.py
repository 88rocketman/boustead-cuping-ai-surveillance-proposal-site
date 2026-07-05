"""Generate a browser-readable report page from run results."""

from __future__ import annotations

import html
import json
from datetime import datetime
from pathlib import Path
from typing import List

from .pipeline_core import now_iso, write_json


def _metric_badge(value: float, lower_ok: float = 0, higher_ok: float = 0, direction: str = "higher") -> str:
    if direction == "higher":
        return "pass" if value >= lower_ok else "fail"
    if direction == "lower":
        return "pass" if value <= higher_ok else "fail"
    return "neutral"


def _safe_float(value, default: float = 0.0) -> float:
    if isinstance(value, (int, float)):
        try:
            parsed = float(value)
        except (TypeError, ValueError):
            return default
        return parsed if parsed == parsed else default
    return default


def _pick_primary_threshold(thresholds: dict) -> dict:
    if not isinstance(thresholds, dict):
        return {}
    if "0.50" in thresholds:
        return thresholds["0.50"] or {}
    if "0.5" in thresholds:
        return thresholds["0.5"] or {}
    if thresholds:
        normalized = []
        for key, value in thresholds.items():
            try:
                normalized.append((float(key), key))
            except (TypeError, ValueError):
                continue
        if not normalized:
            return {}
        return thresholds[sorted(normalized, key=lambda item: item[0])[0][1]] or {}
    return {}


def _percent(v: float) -> str:
    return f"{_safe_float(v) * 100:.2f}%"


def _to_rows(metrics: list) -> str:
    rows = []
    for item in metrics:
        overall = item.get("overall", {})
        latency = item.get("latency", {})
        throughput = item.get("throughput", {})
        precision = overall.get("precision", 0.0)
        recall = overall.get("recall", 0.0)
        f1 = overall.get("f1", 0.0)
        map50 = overall.get("mAP50", 0.0)
        map50_95 = overall.get("mAP50_95", 0.0)
        fpr = overall.get("fpr_per_1000_frames", 0.0)
        p50 = latency.get("p50_ms", 0.0)
        p95 = latency.get("p95_ms", 0.0)
        fps = throughput.get("fps", 0.0)
        status = item.get("status", "unknown")
        rows.append(
            f"""
            <tr>
              <td>{html.escape(item.get('model_id', ''))}</td>
              <td>{_percent(precision)}</td>
              <td>{_percent(recall)}</td>
              <td>{_percent(f1)}</td>
              <td>{_safe_float(map50):.4f}</td>
              <td>{_safe_float(map50_95):.4f}</td>
              <td>{_safe_float(fpr):.3f}</td>
              <td>{_safe_float(p50):.1f}</td>
              <td>{_safe_float(p95):.1f}</td>
              <td>{_safe_float(fps):.1f}</td>
              <td class=\"{html.escape(str(status))}\">{str(status).upper()}</td>
            </tr>
            """
        )
    return "\n".join(rows)


def _class_table(metrics: list) -> str:
    rows = []
    for item in metrics:
        primary_threshold = _pick_primary_threshold(item.get("thresholds", {})).get("per_class", {})
        for class_name, values in primary_threshold.items():
            model_id = item.get("model_id", "")
            rows.append(
                f"""
                <tr>
                  <td>{html.escape(model_id)}</td>
                  <td>{html.escape(class_name)}</td>
                  <td>{values.get('tp', 0)}</td>
                  <td>{values.get('fp', 0)}</td>
                  <td>{values.get('fn', 0)}</td>
                  <td>{_percent(values.get('precision', 0.0))}</td>
                  <td>{_percent(values.get('recall', 0.0))}</td>
                  <td>{_safe_float(values.get('ap', 0.0)):.4f}</td>
                </tr>
                """
            )
        if not primary_threshold:
            rows.append(
                f"""
                <tr>
                  <td>{html.escape(item.get('model_id', ''))}</td>
                  <td>n/a</td>
                  <td colspan=\"7\">No per-class metrics available.</td>
                </tr>
                """
            )
    return "\n".join(rows)


def generate_report(run_id: str, manifest: dict, license_report: dict, gt_report: dict, results: list, out_dir: Path, gates: dict, cost: dict | None = None) -> Path:
    coverage = {
        "ground_truth_rows": gt_report.get("count", 0),
        "datasets": gt_report.get("media_count", 0),
        "models": len(results),
        "timestamp": now_iso(),
    }

    payload = {
        "run_id": run_id,
        "generated_at": now_iso(),
        "manifest": manifest,
        "license": license_report,
        "coverage": coverage,
        "gates": gates or {},
        "results": results,
    }
    payload_path = out_dir / "metrics.json"
    write_json(payload_path, payload)

    html_rows = _to_rows(results)
    class_rows = _class_table(results)

    compliance = sum(1 for item in license_report.get("items", []) if item["status"] == "compliant")
    warning = sum(1 for item in license_report.get("items", []) if item["status"] in {"warning", "blocked"})
    model_ok = sum(1 for item in results if item["status"] == "pass")
    model_fail = len(results) - model_ok

    out_html = Path(__file__).resolve().parent.parent / "report_template.html"
    template = out_html.read_text(encoding="utf-8") if out_html.exists() else ""
    if not template:
        template = """
<!doctype html>
<html>
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>AI Surveillance Evaluation Report</title>
  <style>
    :root { --pass:#0f7a3a; --fail:#9e2c2c; --bg:#0b1020; --card:#131a2d; --text:#d9e6ff; --line:#2a3550; }
    body { margin:0; font-family:system-ui,Segoe UI,Arial; background:#f5f8ff; color:#102a43; padding:24px; }
    .container { max-width: 1200px; margin:0 auto; display:grid; gap:18px;}
    h1,h2,h3 { margin:0; }
    .top { display:flex; justify-content:space-between; align-items:center; gap:16px; }
    .summary { background:white; border:1px solid #dbe7ff; border-radius:10px; padding:14px; display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
    .card { background:#eef4ff; border-radius:8px; padding:10px; }
    .pass { color: var(--pass); font-weight:700; }
    .fail { color: var(--fail); font-weight:700; }
    .panel { background:white; border:1px solid #dbe7ff; border-radius:10px; padding:12px; }
    table { width:100%; border-collapse:collapse; }
    th,td { padding:10px; border-bottom:1px solid #d6e0f5; text-align:left; font-size:14px; }
    tbody tr:hover { background:#f2f8ff; }
    .small { color:#57698d; font-size:13px; }
  </style>
</head>
<body>
<div class=\"container\">
  <div class=\"top\">
    <h1>AI Surveillance Validation Report</h1>
    <div class=\"small\">Run ID: {RUN_ID} | Generated: {GEN_TIME}</div>
  </div>
  <div class=\"summary\">
    <div class=\"card\"><strong>Ground Truth Samples</strong><div>{GT_ROWS}</div></div>
    <div class=\"card\"><strong>License Compliant</strong><div>{LICENSE_OK}</div></div>
    <div class=\"card\"><strong>License Warnings</strong><div>{LICENSE_WARN}</div></div>
    <div class=\"card\"><strong>Model Status</strong><div>{MODEL_OK}/{MODEL_TOTAL}</div></div>
  </div>
  <div class=\"panel\">
    <h2>Model Benchmarks</h2>
    <table>
      <thead><tr>
        <th>Model</th><th>Precision</th><th>Recall</th><th>F1</th><th>mAP@50</th><th>mAP@50-95</th><th>FPR /1000f</th><th>P50 ms</th><th>P95 ms</th><th>FPS/Frame</th><th>Gate</th>
      </tr></thead>
      <tbody>
      {MODEL_ROWS}
      </tbody>
    </table>
  </div>
  <div class=\"panel\">
    <h2>Per-Class Detail</h2>
    <table>
      <thead><tr><th>Model</th><th>Class</th><th>TP</th><th>FP</th><th>FN</th><th>Precision</th><th>Recall</th><th>AP@0.50</th></tr></thead>
      <tbody>{CLASS_ROWS}</tbody>
    </table>
  </div>
</div>
</body>
</html>
        """

    payload_replacements = {
        "RUN_ID": run_id,
        "GEN_TIME": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        "GT_ROWS": str(coverage["ground_truth_rows"]),
        "LICENSE_OK": str(compliance),
        "LICENSE_WARN": str(warning),
        "MODEL_OK": str(model_ok),
        "MODEL_TOTAL": str(len(results)),
        "MODEL_ROWS": html_rows,
        "CLASS_ROWS": class_rows,
    }
    report_html = template
    for key, value in payload_replacements.items():
        report_html = report_html.replace(f"{{{key}}}", value)
    out_path = out_dir / "report.html"
    out_path.write_text(report_html, encoding="utf-8")
    return out_path
