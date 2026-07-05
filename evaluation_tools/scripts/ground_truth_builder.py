"""Build a consolidated ground-truth repository from multiple source label files."""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Dict, List

from .pipeline_core import flatten_gt_labels, normalize_bbox, now_iso, write_jsonl


def _load_source_annotations(source: dict, workspace: Path) -> List[dict]:
    path = source.get("annotation_path")
    if not path:
        return []
    annotation_path = Path(path)
    if not annotation_path.is_absolute():
        annotation_path = workspace / annotation_path
    if not annotation_path.exists():
        return []

    ext = annotation_path.suffix.lower()
    if ext == ".jsonl":
        with annotation_path.open("r", encoding="utf-8") as handle:
            return [json.loads(line) for line in handle if line.strip()]
    if ext == ".json":
        payload = json.loads(annotation_path.read_text(encoding="utf-8"))
        # COCO-like
        if isinstance(payload, dict) and {"images", "annotations", "categories"} <= payload.keys():
            return _convert_coco(payload, source["dataset_id"])
        if isinstance(payload, list):
            return payload
    if ext == ".csv":
        rows = []
        with annotation_path.open("r", encoding="utf-8") as handle:
            reader = csv.DictReader(handle)
            for row in reader:
                rows.append(row)
        return rows
    return []


def _convert_coco(payload: dict, dataset_id: str) -> List[dict]:
    image_lookup = {}
    for image in payload.get("images", []):
        image_lookup[image["id"]] = {
            "media_id": str(image.get("file_name") or image.get("id")),
            "dataset_id": dataset_id,
            "split": "test",
            "source": payload.get("dataset", ""),
            "labels": [],
            "width": image.get("width"),
            "height": image.get("height"),
        }

    cat_lookup = {item["id"]: item.get("name", "unknown") for item in payload.get("categories", [])}
    for annotation in payload.get("annotations", []):
        image = image_lookup.get(annotation.get("image_id"))
        if not image:
            continue
        # COCO bbox -> [x,y,w,h] convert to [x1,y1,x2,y2]
        box = annotation.get("bbox", [0, 0, 0, 0])
        x, y, w, h = [float(v) for v in box[:4]]
        image["labels"].append({
            "class": cat_lookup.get(annotation.get("category_id", 0), "unknown"),
            "bbox": [x, y, x + w, y + h],
            "occlusion": annotation.get("iscrowd", 0),
            "count": 1,
            "human_verified": True,
            "segmentation": annotation.get("segmentation"),
        })
    return [value for value in image_lookup.values() if value["labels"]]


def _normalize_row(row: dict, dataset_id: str, use_case: str) -> dict:
    media_id = row.get("media_id") or row.get("file_name") or row.get("image_id")
    if not media_id:
        return {}
    labels = []
    for label in flatten_gt_labels(row):
        label_class = str(label.get("class", row.get("class", "negative")).strip().lower())
        box = normalize_bbox(label.get("bbox", []))
        if len(box) != 4:
            continue
        labels.append({
            "class": label_class,
            "subclass": label.get("subclass", ""),
            "bbox": box,
            "segmentation": label.get("segmentation"),
            "count": label.get("count", 1),
            "occlusion": label.get("occlusion", ""),
            "human_verified": bool(label.get("human_verified", False)),
            "severity": label.get("severity", ""),
        })

    return {
        "media_id": str(media_id),
        "dataset_id": row.get("dataset_id", dataset_id),
        "source": row.get("source", "unknown"),
        "license": row.get("license", ""),
        "use_case": row.get("use_case", use_case or ""),
        "split": row.get("split", "test"),
        "timestamp": row.get("timestamp", now_iso()),
        "resolution": row.get("resolution", ""),
        "camera_type": row.get("camera_type", ""),
        "day_night": row.get("day_night", ""),
        "weather": row.get("weather", ""),
        "labels": labels,
    }


def build_ground_truth(sources: list, normalized_labels: list, workspace: Path, use_case: str = "") -> dict:
    source_lookup = {item["dataset_id"]: item for item in normalized_labels}
    combined = []
    for source in sources:
        rows = _load_source_annotations(source_lookup.get(source["dataset_id"], source), workspace)
        # if normalized labels file exists and load_source_annotations returns empty,
        # use fallback from source-level normalized jsonl file.
        if not rows:
            fallback = Path(source_lookup[source["dataset_id"]].get("output_path", "")) if source["dataset_id"] in source_lookup else None
            if fallback and Path(fallback).exists():
                try:
                    rows = []
                    with Path(fallback).open("r", encoding="utf-8") as handle:
                        for line in handle:
                            if line.strip():
                                rows.append(json.loads(line))
                except Exception:
                    rows = []

        for row in rows:
            normalized = _normalize_row(row, source["dataset_id"], use_case)
            if not normalized.get("media_id"):
                continue
            if not normalized["labels"]:
                # keep empty-label frames so negatives are counted in coverage
                normalized["labels"] = []
            combined.append(normalized)

    out_path = workspace / "ground_truth" / "ground_truth.jsonl"
    write_jsonl(out_path, combined)
    return {
        "status": "ok",
        "count": len(combined),
        "path": str(out_path),
        "media_count": len({row["media_id"] for row in combined}),
    }
