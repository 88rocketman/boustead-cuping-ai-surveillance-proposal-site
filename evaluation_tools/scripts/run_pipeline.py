#!/usr/bin/env python
"""Run end-to-end automated evaluation pipeline."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from .dataset_downloader import collect_sources, write_ingest_report, write_media_manifest
from .generate_report import generate_report
from .ground_truth_builder import build_ground_truth
from .label_normalizer import normalize_labels
from .license_checker import check_licenses
from .pipeline_core import now_iso, timestamped_run_id, write_json, load_json, load_jsonl
from .run_detector import run_model
from .evaluate import evaluate_model


def _load_configs(workspace: Path, source_config: str, model_config: str, taxonomy_config: str):
    sources = load_json(workspace / source_config)
    models = load_json(workspace / model_config)
    taxonomy_path = workspace / taxonomy_config
    return sources, models, taxonomy_path


def run_full_pipeline(workspace: Path, run_id: str | None = None, do_smoke: bool = False, model_filter: str | None = None):
    run_id = run_id or timestamped_run_id("run")
    out_root = workspace / "runs" / run_id
    out_root.mkdir(parents=True, exist_ok=True)

    sources_cfg, models_cfg, taxonomy_path = _load_configs(workspace, "config/sources.json", "config/models.json", "config/taxonomy.json")
    gates = models_cfg.get("gates", {})
    iou_thresholds = [0.50, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.95]

    # 1) Source collection
    collected = collect_sources(sources_cfg, asset_workspace=workspace, run_workspace=out_root)
    ingest_report_path = out_root / "data_manifest.json"
    write_ingest_report(out_root, run_id, collected, ingest_report_path)
    media_manifest_path = out_root / "media_manifest.jsonl"
    write_media_manifest(out_root, collected, media_manifest_path)

    # 2) License checks
    license_report = check_licenses(collected, out_root, run_id)

    # 3) Label normalization
    norm_result = normalize_labels(collected, taxonomy_path, out_root)
    norm_report_path = out_root / "normalized_labels.json"
    write_json(norm_report_path, norm_result)

    # 4) Build consolidated ground truth
    gt_report = build_ground_truth(collected, norm_result.get("results", []), out_root, use_case="")
    gt_report["source"] = {
        "run_id": run_id,
        "created_at": now_iso(),
        "data_manifest": str(ingest_report_path),
    }
    gt_path = out_root / "ground_truth" / "ground_truth.jsonl"

    # 4b) Optional quick smoke test with synthetic data
    if do_smoke and not gt_path.exists():
        # if no GT found, create tiny synthetic GT
        synthetic = [
            {
                "media_id": "SMOKE_0001",
                "dataset_id": "SYNTHETIC_SMOKE",
                "source": "smoke",
                "license": "internal",
                "use_case": "fire",
                "split": "test",
                "timestamp": now_iso(),
                "labels": [
                    {"class": "fire", "bbox": [30, 45, 180, 220], "human_verified": True},
                    {"class": "person", "bbox": [250, 60, 300, 190], "human_verified": True},
                ],
            }
        ]
        from .pipeline_core import write_jsonl
        write_jsonl(gt_path, synthetic)
        gt_report = {"count": len(synthetic), "path": str(gt_path), "media_count": 1, "status": "ok"}

    # 5) Run model(s)
    gt_rows = load_jsonl(gt_path) if gt_path.exists() else []
    model_results = []
    selected_models = models_cfg.get("models", [])
    if model_filter:
        selected_models = [item for item in selected_models if item.get("id") == model_filter or item.get("detector") == model_filter]
    for model_cfg in selected_models:
        inference = run_model(model_cfg, gt_rows, out_root, workspace=workspace)
        model_cfg["inference"] = inference
        prediction_path = Path(inference.get("path", "")) if inference.get("path") else None
        thresholds = model_cfg.get("iou_thresholds", iou_thresholds)
        if do_smoke:
            thresholds = [0.50]

        if inference["status"] == "ok" and prediction_path and prediction_path.exists():
            model_result = evaluate_model(
                gt_path=gt_path,
                pred_path=prediction_path,
                model_label=model_cfg["id"],
                gates=gates,
                iou_thresholds=thresholds,
            )
        else:
            model_result = {
                "model_id": model_cfg.get("id"),
                "status": "skipped",
                "reasons": [inference.get("reason", "no valid predictions")],
                "overall": {},
            }
        model_results.append(model_result)

    # cost summary for operational sizing
    for idx, model_cfg in enumerate(selected_models):
        cost = model_cfg.get("cost_per_camera_usd_per_month")
        if cost is None:
            continue
        model_results[idx]["cost"] = {
            "cost_per_camera_usd_per_month": cost,
            "cost_per_100_cameras_usd_per_month": round(float(cost) * 100.0, 2),
        }

    result_summary = {
        "run_id": run_id,
        "timestamp": now_iso(),
        "datasets": len(collected),
        "license": license_report,
        "gt": gt_report,
        "models": model_results,
        "config": {
            "sources": str(workspace / "config/sources.json"),
            "models": str(workspace / "config/models.json"),
            "iou_thresholds": iou_thresholds,
            "smoke": do_smoke,
        },
    }
    summary_path = out_root / "run_summary.json"
    write_json(summary_path, result_summary)

    # 6) Report
    report_path = generate_report(run_id, {"count": len(collected), "items": collected}, license_report, gt_report, model_results, out_root, gates)
    return {
        "run_id": run_id,
        "run_dir": str(out_root),
        "summary": str(summary_path),
        "report": str(report_path),
        "license_report": str(out_root / "license_report.json"),
        "ground_truth": str(gt_path),
    }


def build_arg_parser():
    parser = argparse.ArgumentParser(description="Run AI surveillance validation pipeline.")
    parser.add_argument("--workspace", default="evaluation_tools", help="Base folder for config and outputs.")
    parser.add_argument("--run-id", default=None, help="Optional run identifier.")
    parser.add_argument("--smoke", action="store_true", help="Generate synthetic GT if empty for pipeline smoke test.")
    parser.add_argument("--model", default=None, help="Run only a selected model id or detector name.")
    return parser


def main():
    parser = build_arg_parser()
    args = parser.parse_args()

    workspace = Path(args.workspace)
    if not workspace.exists():
        raise FileNotFoundError(f"Workspace not found: {workspace}")

    output = run_full_pipeline(workspace, run_id=args.run_id, do_smoke=args.smoke, model_filter=args.model)
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
