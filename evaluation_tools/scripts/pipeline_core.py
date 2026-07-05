"""Core helpers shared across the evaluation pipeline."""

from __future__ import annotations

import csv
import hashlib
import json
import math
import os
import shutil
import statistics
import time
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Sequence


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def load_json(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: Path, payload) -> None:
    ensure_dir(path.parent)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)


def load_jsonl(path: Path) -> List[dict]:
    rows = []
    with path.open("r", encoding="utf-8") as handle:
        for index, line in enumerate(handle, start=1):
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError as error:
                raise ValueError(f"Invalid JSONL line {index} in {path}: {error}") from error
    return rows


def write_jsonl(path: Path, rows: Iterable[dict]) -> None:
    ensure_dir(path.parent)
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row))
            handle.write("\n")


def write_csv(path: Path, rows: Sequence[dict], columns: Sequence[str]) -> None:
    ensure_dir(path.parent)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in columns})


def safe_filename(value: str) -> str:
    safe = "".join(ch if ch.isalnum() or ch in ("-", "_", ".") else "-" for ch in value)
    return safe[:120] if safe else "item"


def file_hash(path: Path, chunk_size: int = 8192) -> str:
    h = hashlib.sha1()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(chunk_size), b""):
            h.update(chunk)
    return h.hexdigest()


def download_file(url: str, destination: Path, timeout: int = 60) -> Path:
    ensure_dir(destination.parent)
    with urllib.request.urlopen(url, timeout=timeout) as response:
        with destination.open("wb") as out_file:
            shutil.copyfileobj(response, out_file)
    return destination


def extract_zip(archive_path: Path, destination: Path) -> None:
    ensure_dir(destination)
    with zipfile.ZipFile(archive_path, "r") as archive:
        archive.extractall(destination)


def calc_iou(box_a: Sequence[float], box_b: Sequence[float]) -> float:
    x1 = max(box_a[0], box_b[0])
    y1 = max(box_a[1], box_b[1])
    x2 = min(box_a[2], box_b[2])
    y2 = min(box_a[3], box_b[3])

    intersection_w = max(0.0, x2 - x1)
    intersection_h = max(0.0, y2 - y1)
    intersection = intersection_w * intersection_h

    area_a = max(0.0, box_a[2] - box_a[0]) * max(0.0, box_a[3] - box_a[1])
    area_b = max(0.0, box_b[2] - box_b[0]) * max(0.0, box_b[3] - box_b[1])
    union = area_a + area_b - intersection

    if union <= 0:
        return 0.0
    return intersection / union


def percentile(values: Sequence[float], pct: float) -> float:
    if not values:
        return 0.0
    if len(values) == 1:
        return float(values[0])
    values = sorted(values)
    if pct <= 0:
        return float(values[0])
    if pct >= 1:
        return float(values[-1])
    pos = (len(values) - 1) * pct
    lower = math.floor(pos)
    upper = math.ceil(pos)
    if lower == upper:
        return float(values[int(pos)])
    weight = pos - lower
    return float(values[lower] * (1 - weight) + values[upper] * weight)


def timestamped_run_id(prefix: str = "run") -> str:
    return f"{prefix}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"


def flatten_gt_labels(row: dict) -> List[dict]:
    labels = row.get("labels", [])
    if isinstance(labels, dict):
        labels = labels.get("annotations", [])
    return [item for item in labels if isinstance(item, dict)]


def normalize_bbox(box: Sequence[float]) -> List[float]:
    if len(box) != 4:
        return []
    x1, y1, x2, y2 = [float(v) for v in box]
    if x2 < x1:
        x1, x2 = x2, x1
    if y2 < y1:
        y1, y2 = y2, y1
    return [x1, y1, x2, y2]


def summarize_latency_ms(rows: Sequence[dict], key: str = "processing_ms") -> dict:
    values = [float(row.get(key, 0.0) or 0.0) for row in rows if isinstance(row.get(key), (int, float))]
    if not values:
        return {
            "count": 0,
            "avg_ms": 0.0,
            "p50_ms": 0.0,
            "p95_ms": 0.0,
            "min_ms": 0.0,
            "max_ms": 0.0,
        }
    return {
        "count": len(values),
        "avg_ms": float(statistics.mean(values)),
        "p50_ms": percentile(values, 0.50),
        "p95_ms": percentile(values, 0.95),
        "min_ms": float(min(values)),
        "max_ms": float(max(values)),
    }


def now_timestamp() -> str:
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
