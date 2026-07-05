"""Model evaluation with IoU matching and AP metric computation."""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path
from typing import Dict, List, Tuple

from .pipeline_core import calc_iou, summarize_latency_ms


def _safe_divide(num: float, denom: float) -> float:
    if denom <= 0:
        return 0.0
    return float(num) / float(denom)


def _ap_from_precision_recall(precision: List[float], recall: List[float]) -> float:
    if not precision or not recall:
        return 0.0
    order = sorted(range(len(recall)), key=lambda idx: recall[idx])
    recall = [recall[idx] for idx in order]
    precision = [precision[idx] for idx in order]
    area = 0.0
    for i in range(1, len(recall)):
        delta = recall[i] - recall[i - 1]
        if delta > 0:
            area += delta * precision[i]
    return float(area)


def _build_indices(gt_rows: list, pred_rows: list) -> Tuple[Dict[str, List[dict]], Dict[str, List[dict]], set, Dict[str, int]]:
    gt_by_media = defaultdict(list)
    pred_by_media = defaultdict(list)
    class_counts = defaultdict(int)
    class_names = set()

    for row in gt_rows:
        media_id = row.get("media_id")
        for item in row.get("labels", []) or []:
            cls = str(item.get("class", "negative")).strip().lower()
            bbox = item.get("bbox", [])
            if media_id and len(bbox) == 4:
                gt_by_media[media_id].append({"class": cls, "bbox": [float(v) for v in bbox]})
                class_counts[cls] += 1
                class_names.add(cls)

    for row in pred_rows:
        media_id = row.get("media_id")
        cls = str(row.get("class", "negative")).strip().lower()
        bbox = row.get("bbox", [])
        if media_id and len(bbox) == 4:
            pred_by_media[media_id].append({
                "class": cls,
                "bbox": [float(v) for v in bbox],
                "confidence": float(row.get("confidence", 0.0)),
            })

    for media_id in pred_by_media:
        pred_by_media[media_id].sort(key=lambda item: item["confidence"], reverse=True)
    return gt_by_media, pred_by_media, class_names, class_counts


def _match_class_for_media(media_gt: List[dict], media_pred: List[dict], target_class: str, threshold: float) -> Tuple[int, int, int]:
    gt_indexes = [(idx, item) for idx, item in enumerate(media_gt) if item["class"] == target_class]
    if not gt_indexes and not media_pred:
        return 0, 0, 0
    if not gt_indexes:
        fp = len([pred for pred in media_pred if pred["class"] == target_class])
        return 0, fp, 0
    if not media_pred:
        return 0, 0, len(gt_indexes)

    matched = set()
    tp = 0
    fp = 0

    for pred in media_pred:
        if pred["class"] != target_class:
            continue
        best_iou = 0.0
        best_idx = None
        for gt_idx, gt in gt_indexes:
            if gt_idx in matched:
                continue
            score = calc_iou(pred["bbox"], gt["bbox"])
            if score > best_iou and score >= threshold:
                best_iou = score
                best_idx = gt_idx
        if best_idx is None:
            fp += 1
        else:
            matched.add(best_idx)
            tp += 1
    fn = len(gt_indexes) - len(matched)
    return tp, fp, fn


def _evaluate_at_threshold(gt_by_media: Dict[str, List[dict]], pred_by_media: Dict[str, List[dict]], class_names: set, class_counts: Dict[str, int], threshold: float):
    overall_tp = overall_fp = overall_fn = 0
    per_class = defaultdict(lambda: {"tp": 0, "fp": 0, "fn": 0})

    all_media = set(gt_by_media.keys()) | set(pred_by_media.keys())
    for media_id in all_media:
        media_gt = gt_by_media.get(media_id, [])
        media_pred = pred_by_media.get(media_id, [])
        for class_name in class_names:
            tp, fp, fn = _match_class_for_media(media_gt, media_pred, class_name, threshold)
            per_class[class_name]["tp"] += tp
            per_class[class_name]["fp"] += fp
            per_class[class_name]["fn"] += fn
            overall_tp += tp
            overall_fp += fp
            overall_fn += fn

    # AP by class
    per_class_ap = {}
    for class_name in class_names:
        class_preds = []
        for media_id, preds in pred_by_media.items():
            for pred in preds:
                if pred["class"] == class_name:
                    class_preds.append((media_id, pred))
        class_preds.sort(key=lambda item: item[1]["confidence"], reverse=True)

        matched = set()
        precision_curve = []
        recall_curve = []
        cum_tp = 0
        cum_fp = 0
        class_gt_total = class_counts.get(class_name, 0)

        for media_id, pred in class_preds:
            media_gt = gt_by_media.get(media_id, [])
            candidates = [(idx, item) for idx, item in enumerate(media_gt) if item["class"] == class_name]
            match = None
            best_iou = 0.0
            for gt_idx, gt in candidates:
                key = (media_id, gt_idx)
                if key in matched:
                    continue
                iou = calc_iou(pred["bbox"], gt["bbox"])
                if iou > best_iou and iou >= threshold:
                    best_iou = iou
                    match = key
            if match is None:
                cum_fp += 1
            else:
                cum_tp += 1
                matched.add(match)
            precision_curve.append(_safe_divide(cum_tp, cum_tp + cum_fp))
            recall_curve.append(_safe_divide(cum_tp, class_gt_total))

        per_class_ap[class_name] = {
            "tp": per_class[class_name]["tp"],
            "fp": per_class[class_name]["fp"],
            "fn": per_class[class_name]["fn"],
            "precision": _safe_divide(per_class[class_name]["tp"], per_class[class_name]["tp"] + per_class[class_name]["fp"]),
            "recall": _safe_divide(per_class[class_name]["tp"], per_class[class_name]["tp"] + per_class[class_name]["fn"]),
            "ap": _ap_from_precision_recall(precision_curve, recall_curve),
            "predictions": len(class_preds),
            "ground_truth": class_gt_total,
        }

    gt_count = sum(class_counts.values())
    overall = {
        "tp": overall_tp,
        "fp": overall_fp,
        "fn": overall_fn,
        "precision": _safe_divide(overall_tp, overall_tp + overall_fp),
        "recall": _safe_divide(overall_tp, overall_tp + overall_fn),
    }
    overall["f1"] = _safe_divide(2 * overall["precision"] * overall["recall"], overall["precision"] + overall["recall"])
    overall["fpr_per_1000_frames"] = _safe_divide(overall_fp, gt_count or 1) * 1000.0

    return overall, per_class_ap


def evaluate_model(gt_path: Path, pred_path: Path, model_label: str, gates: dict, iou_thresholds: List[float] | None = None) -> dict:
    gt_rows = [json.loads(line) for line in gt_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    pred_rows = [json.loads(line) for line in pred_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    iou_thresholds = iou_thresholds or [0.50]

    gt_by_media, pred_by_media, class_names, class_counts = _build_indices(gt_rows, pred_rows)
    threshold_reports = {}
    for iou in iou_thresholds:
        overall, per_class = _evaluate_at_threshold(gt_by_media, pred_by_media, class_names, class_counts, iou)
        threshold_reports[str(iou)] = {
            "overall": overall,
            "per_class": per_class,
        }

    primary = threshold_reports[str(iou_thresholds[0])]
    primary_overall = primary["overall"]
    primary_class = primary["per_class"]
    map50 = _safe_divide(sum(v.get("ap", 0.0) for v in primary_class.values()), len(primary_class) or 1)

    map50_95 = map50
    if len(iou_thresholds) > 1:
        map_scores = []
        for item in threshold_reports.values():
            values = item["per_class"]
            map_scores.append(_safe_divide(sum(v.get("ap", 0.0) for v in values.values()), len(values) or 1))
        map50_95 = _safe_divide(sum(map_scores), len(map_scores) or 1)

    latency = summarize_latency_ms(pred_rows, key="processing_ms")
    total_ms = sum(float(row.get("processing_ms", 0.0) or 0.0) for row in pred_rows)
    fps = _safe_divide(len(pred_rows) * 1000.0, total_ms)
    media_count = len(gt_by_media)

    status = "pass"
    reasons = []
    if gates:
        if primary_overall["recall"] < gates.get("recall_min", -1):
            status = "fail"
            reasons.append("recall below threshold")
        if primary_overall["precision"] < gates.get("precision_min", -1):
            status = "fail"
            reasons.append("precision below threshold")
        if primary_overall["fpr_per_1000_frames"] > gates.get("fpr_per_1000_frames_max", float("inf")):
            status = "fail"
            reasons.append("fpr per 1000 frames above threshold")
        if latency["p95_ms"] > gates.get("p95_latency_ms_max", float("inf")):
            status = "fail"
            reasons.append("p95 latency above threshold")

    return {
        "model_id": model_label,
        "status": status,
        "reasons": reasons,
        "overall": {
            "precision": primary_overall["precision"],
            "recall": primary_overall["recall"],
            "f1": primary_overall["f1"],
            "mAP50": map50,
            "mAP50_95": map50_95,
            "fpr_per_1000_frames": primary_overall["fpr_per_1000_frames"],
            "tp": primary_overall["tp"],
            "fp": primary_overall["fp"],
            "fn": primary_overall["fn"],
            "gt_count": sum(class_counts.values()),
            "media_count": media_count,
        },
        "latency": latency,
        "throughput": {
            "fps": fps,
            "p50_ms": latency["p50_ms"],
            "p95_ms": latency["p95_ms"],
            "avg_ms": latency["avg_ms"],
            "sample_count": latency["count"],
        },
        "thresholds": threshold_reports,
        "prediction_count": len(pred_rows),
    }
