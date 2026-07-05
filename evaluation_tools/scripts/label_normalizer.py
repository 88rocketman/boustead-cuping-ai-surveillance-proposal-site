"""Normalize raw labels to internal taxonomy."""

from __future__ import annotations

import json
from pathlib import Path

from .pipeline_core import now_iso, normalize_bbox, write_jsonl


def _resolve_source_root(source: dict, workspace: Path) -> Path:
    annotation_path = source.get("annotation_path")
    if annotation_path:
        candidate = Path(annotation_path)
        if not candidate.is_absolute():
            candidate = workspace / candidate
        if candidate.exists():
            return candidate
    # For local paths declared in source config fallback
    return workspace / "labels" / f"{source['dataset_id']}_normalized.jsonl"


def _load_taxonomy(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    return payload.get("normalization_map", {})


def normalize_class(raw_label: str, mapping: dict) -> str:
    if raw_label is None:
        return "negative"
    return mapping.get(str(raw_label).strip().lower(), str(raw_label).strip().lower())


def normalize_source_labels(source: dict, taxonomy: dict, workspace: Path) -> dict:
    source_id = source["dataset_id"]
    raw_path = _resolve_source_root(source, workspace)
    out_path = workspace / "ground_truth" / f"{source_id}_normalized.jsonl"

    if not raw_path.exists():
        return {
            "dataset_id": source_id,
            "status": "skipped",
            "reason": f"label path missing: {raw_path}",
            "output_path": str(out_path),
            "updated_at": now_iso(),
        }

    mapping = taxonomy
    normalized_count = 0
    warnings = []
    rows = []
    # JSONL format expected by this normalizer by default:
    # {media_id:..., dataset_id:..., labels:[{class:"...",bbox:[x1,y1,x2,y2]}]}
    with raw_path.open("r", encoding="utf-8") as handle:
        for line_number, line in enumerate(handle, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError as error:
                warnings.append(f"{source_id}:{line_number} not valid JSONL: {error}")
                continue

            out_row = dict(row)
            out_row.setdefault("dataset_id", source_id)
            labels = []
            for item in row.get("labels", row.get("annotations", [])) or []:
                if not isinstance(item, dict):
                    continue
                label = normalize_class(item.get("class") or item.get("label"), mapping)
                bbox = normalize_bbox(item.get("bbox", []))
                if len(bbox) != 4:
                    warnings.append(f"{source_id}:{line_number} invalid bbox skipped")
                    continue
                labels.append({
                    "class": label,
                    "subclass": item.get("subclass", ""),
                    "bbox": bbox,
                    "occlusion": item.get("occlusion", ""),
                    "human_verified": bool(item.get("human_verified", False)),
                    "count": item.get("count", 1),
                    "severity": item.get("severity", ""),
                })
                normalized_count += 1
            out_row["labels"] = labels
            rows.append(out_row)

    write_jsonl(out_path, rows)
    return {
        "dataset_id": source_id,
        "status": "ok",
        "output_path": str(out_path),
        "labels_written": normalized_count,
        "warnings": warnings,
        "updated_at": now_iso(),
    }


def normalize_labels(sources: list, taxonomy_config: Path, workspace: Path) -> dict:
    taxonomy = _load_taxonomy(taxonomy_config)
    results = []
    for source in sources:
        results.append(normalize_source_labels(source, taxonomy, workspace))
    return {"generated_at": now_iso(), "results": results}
