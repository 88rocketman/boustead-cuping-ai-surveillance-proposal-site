"""Inference runner helpers.

For initial automation this supports:
- passthrough mode: copy existing prediction files
- dummy mode: synthetic detections generated from GT for smoke tests
"""

from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Iterable

from .pipeline_core import now_iso, write_jsonl


def _load_rows(path: Path) -> list:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


def _write_prediction_file(target: Path, rows: Iterable[dict]) -> None:
    write_jsonl(target, rows)


def generate_dummy_predictions(gt_rows: list, model_id: str, base_latency_ms: float = 38.0) -> list:
    rows = []
    for row in gt_rows:
        media_id = row.get("media_id")
        frame_id = row.get("frame_id", 0)
        for label in row.get("labels", []):
            if random.random() < 0.2:
                continue
            cls = label["class"]
            box = label.get("bbox")
            if not box:
                continue
            jitter = [random.uniform(-3, 3) for _ in range(4)]
            pred_box = [
                box[0] + jitter[0],
                box[1] + jitter[1],
                box[2] + jitter[2],
                box[3] + jitter[3],
            ]
            confidence = round(random.uniform(0.62, 0.98), 3)
            rows.append({
                "media_id": media_id,
                "frame_id": frame_id,
                "model_id": model_id,
                "class": cls,
                "bbox": pred_box,
                "confidence": confidence,
                "processing_ms": max(5.0, random.gauss(base_latency_ms, 5.0)),
                "detector_confidence": confidence,
                "vlm_confidence": None,
                "final_decision": "alert" if confidence >= 0.5 else "review",
            })
        # synthetic false positives to keep evaluator robust for stress scenarios
        if random.random() < 0.15:
            rows.append({
                "media_id": media_id,
                "frame_id": frame_id,
                "model_id": model_id,
                "class": random.choice(["person", "vehicle", "smoke", "fire"]),
                "bbox": [10, 10, 50, 60],
                "confidence": round(random.uniform(0.52, 0.9), 3),
                "processing_ms": max(5.0, random.gauss(base_latency_ms, 5.0)),
                "detector_confidence": 0.0,
                "vlm_confidence": None,
                "final_decision": "alert",
            })
    return rows


def run_model(model_cfg: dict, gt_rows: list, output_root: Path, workspace: Path | None = None) -> dict:
    model_id = model_cfg["id"]
    predictions_dir = output_root / "inference" / model_id
    predictions_dir.mkdir(parents=True, exist_ok=True)
    output_file = predictions_dir / "predictions.jsonl"

    source_file = model_cfg.get("prediction_source", "")
    mode = model_cfg.get("mode", "passthrough")

    if mode == "passthrough":
        if not source_file:
            return {
                "model_id": model_id,
                "status": "skipped",
                "reason": "passthrough mode requires prediction_source",
            }
        src = Path(source_file)
        if not src.is_absolute():
            candidate = workspace / src if workspace else src
            if candidate.exists():
                src = candidate
            else:
                src = Path(src)
        if src.exists():
            rows = _load_rows(src)
            _write_prediction_file(output_file, rows)
            return {
                "model_id": model_id,
                "status": "ok",
                "rows": len(rows),
                "path": str(output_file),
                "source": str(src),
            }
        return {
            "model_id": model_id,
            "status": "missing",
            "reason": f"prediction_source not found: {src}",
        }

    if mode == "dummy":
        rows = generate_dummy_predictions(gt_rows, model_id, model_cfg.get("latency_ms", 38))
        _write_prediction_file(output_file, rows)
        return {
            "model_id": model_id,
            "status": "ok",
            "rows": len(rows),
            "path": str(output_file),
            "mode": "dummy",
        }

    return {
        "model_id": model_id,
        "status": "blocked",
        "reason": f"model mode '{mode}' not implemented",
    }
