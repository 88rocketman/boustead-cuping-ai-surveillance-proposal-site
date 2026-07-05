"""Dataset downloader and media manifest builder."""

from __future__ import annotations

import csv
import json
import urllib.request
import urllib.error
from urllib.parse import urlsplit, unquote
import zipfile
from pathlib import Path
from typing import Dict, List

from .pipeline_core import (
    ensure_dir,
    download_file,
    extract_zip,
    now_iso,
    write_json,
    write_jsonl,
)


def detect_media_files(folder: Path, media_type: str = "image") -> List[str]:
    extensions = {
        "image": {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".gif"},
        "video": {".mp4", ".mov", ".avi", ".mkv", ".ts"},
    }
    if media_type not in extensions:
        extensions["image"] = extensions["image"] | {".jpg", ".jpeg", ".png"}
    exts = extensions.get(media_type, extensions["image"])
    return [
        str(file.relative_to(folder).as_posix())
        for file in folder.rglob("*")
        if file.suffix.lower() in exts and file.is_file()
    ]


def load_remote_manifest(manifest_url: str) -> List[dict]:
    with urllib.request.urlopen(manifest_url, timeout=60) as response:
        payload = response.read().decode("utf-8")
    if not payload.strip():
        return []
    if manifest_url.lower().endswith(".json") or payload.lstrip().startswith(("[", "{")):
        data = json.loads(payload)
        if isinstance(data, list):
            return data
        if isinstance(data, dict) and "items" in data and isinstance(data["items"], list):
            return data["items"]
        raise ValueError("Manifest JSON not in expected list or {items: []} format.")
    reader = csv.DictReader(payload.splitlines())
    return [dict(row) for row in reader]


def _normalize_metadata(source: dict) -> dict:
    source_id = source["id"]
    return {
        "dataset_id": source_id,
        "dataset_name": source.get("dataset_name", source_id),
        "source": source.get("source", "unknown"),
        "license": source.get("license", ""),
        "commercial_use": bool(source.get("commercial_use", True)),
        "version": source.get("version", ""),
        "use_case": source.get("use_case", []),
        "source_type": source.get("source_type", "local"),
    }


def _annotation_refs(source: dict) -> tuple[str, str | None]:
    annotation = source.get("labels", {}) or source.get("annotations", {})
    if not isinstance(annotation, dict):
        annotation = {}
    return (
        annotation.get("path"),
        annotation.get("url"),
    )

def _resolve_workspace_path(value: str | None, workspace: Path) -> str | None:
    if not value:
        return None
    path = Path(value)
    if path.is_absolute():
        return str(path)
    return str((workspace / path).resolve())


def _resolve_annotation_reference(
    source: dict,
    annotation_path: str | None,
    annotation_url: str | None,
    asset_workspace: Path,
    run_workspace: Path,
) -> tuple[str | None, str | None]:
    annotation_path = _resolve_workspace_path(annotation_path, asset_workspace)
    if annotation_path and Path(annotation_path).exists():
        return annotation_path, "local"
    if annotation_url:
        annotation_ext = Path(urlsplit(annotation_url).path).suffix or ".jsonl"
        saved = ensure_dir(run_workspace / "sources" / source["id"] / "annotations") / f"labels{annotation_ext}"
        try:
            download_file(annotation_url, saved)
            return str(saved), "remote"
        except Exception:
            return None, None
    return annotation_path, None


def _build_source_report(source: dict, status: str, media_rows: List[dict], error: str | None = None, annotation_url: str | None = None, annotation_path: str | None = None, source_note: str | None = None) -> dict:
    return {
        **_normalize_metadata(source),
        "status": status,
        "source_type": source.get("source_type", "local"),
        "media_count": len(media_rows),
        "updated_at": now_iso(),
        "files": media_rows,
        "annotation_path": annotation_path,
        "annotation_url": annotation_url,
        "error": error,
        "source_note": source_note,
    }


def _copy_local(source: dict, asset_workspace: Path, run_workspace: Path) -> dict:
    source_root = source.get("media_root")
    if not source_root:
        return _build_source_report(source, "error", [], error="source_type local but media_root missing")

    src_root = Path(_resolve_workspace_path(source_root, asset_workspace))
    if not src_root.exists():
        return _build_source_report(source, "error", [], error=f"media_root not found: {src_root}")

    annotation_path, annotation_url = _annotation_refs(source)
    annotation_path, _annotation_source_type = _resolve_annotation_reference(
        source,
        annotation_path,
        annotation_url,
        asset_workspace=asset_workspace,
        run_workspace=run_workspace,
    )
    rows: List[dict] = []
    media_type = source.get("media_type", "image")
    split = source.get("split", "test")
    for rel in detect_media_files(src_root, media_type):
        rows.append({
            "media_id": f"{source['id']}_{Path(rel).name}",
            "dataset_id": source["id"],
            "media_path": str((src_root / rel).resolve()),
            "media_type": media_type,
            "split": split,
            "frame_id": 0,
            "source_type": "local",
        })
    return _build_source_report(source, "ok", rows, annotation_path=annotation_path, annotation_url=annotation_url)


def _copy_zip(source: dict, asset_workspace: Path, run_workspace: Path) -> dict:
    download_url = source.get("download_url") or source.get("downloaded_as") or source.get("source_url")
    if not download_url:
        return _build_source_report(source, "error", [], error="http_zip source_type requires download_url")

    destination = ensure_dir(run_workspace / "sources" / source["id"])
    media_root = destination / "media"
    annotation_path, annotation_url = _annotation_refs(source)
    annotation_path, _annotation_source_type = _resolve_annotation_reference(
        source,
        annotation_path=annotation_path,
        annotation_url=annotation_url,
        asset_workspace=asset_workspace,
        run_workspace=run_workspace,
    )
    try:
        download_file(download_url, destination / f"{source['id']}.zip")
    except (OSError, urllib.error.URLError) as error:
        return _build_source_report(source, "error", [], error=f"download failed: {error}")

    zip_path = destination / f"{source['id']}.zip"
    try:
        extract_zip(zip_path, media_root)
    except zipfile.BadZipFile:
        pass

    media_rows = []
    media_type = source.get("media_type", "image")
    split = source.get("split", "test")
    for rel in detect_media_files(media_root, media_type):
        media_rows.append({
            "media_id": f"{source['id']}_{Path(rel).name}",
            "dataset_id": source["id"],
            "media_path": str((media_root / rel).resolve()),
            "media_type": media_type,
            "split": split,
            "frame_id": 0,
            "source_type": "http_zip",
        })
    return _build_source_report(source, "ok", media_rows, annotation_path=annotation_path, annotation_url=annotation_url)


def _copy_manifest(source: dict, asset_workspace: Path, run_workspace: Path) -> dict:
    manifest_url = source.get("download_url") or source.get("source_url")
    if not manifest_url:
        return _build_source_report(source, "error", [], error=f"{source.get('source_type', 'manifest')} source requires download_url")
    annotation_path, annotation_url = _annotation_refs(source)
    annotation_path, annotation_url = _resolve_annotation_reference(
        source,
        annotation_path,
        annotation_url,
        asset_workspace=asset_workspace,
        run_workspace=run_workspace,
    )
    destination = ensure_dir(run_workspace / "sources" / source["id"] / "media")
    media_rows = []
    split = source.get("split", "test")
    media_type = source.get("media_type", "image")

    try:
        manifest = load_remote_manifest(manifest_url)
    except Exception as error:
        return _build_source_report(source, "error", [], error=f"manifest load failed: {error}")

    for item in manifest:
        if not isinstance(item, dict):
            continue
        media_url = item.get("media_url") or item.get("url") or item.get("file") or item.get("path") or item.get("download_url")
        if not media_url:
            continue
        url_path = unquote(urlsplit(media_url).path)
        filename = Path(url_path).name or f"{source['id']}_{item.get('frame_id', 'frame')}.bin"
        media_id = item.get("media_id") or f"{source['id']}_{filename}"
        media_file = destination / filename
        if not media_file.exists():
            try:
                download_file(media_url, media_file)
            except Exception:
                continue
        media_rows.append({
            "media_id": media_id,
            "dataset_id": source["id"],
            "media_path": str(media_file.resolve()),
            "media_type": media_type,
            "split": split,
            "frame_id": int(item.get("frame_id", 0) or 0),
            "source_type": source.get("source_type"),
            "capture_time": item.get("capture_time"),
        })
    return _build_source_report(source, "ok", media_rows, annotation_path=annotation_path, annotation_url=annotation_url)


def download_source(source: dict, asset_workspace: Path, run_workspace: Path) -> dict:
    source_type = source.get("source_type", "local")
    if source_type == "local":
        return _copy_local(source, asset_workspace, run_workspace)
    if source_type == "http_zip":
        return _copy_zip(source, asset_workspace, run_workspace)
    if source_type in {"manifest_http", "coco_http", "jsonl_http"}:
        return _copy_manifest(source, asset_workspace, run_workspace)
    return _build_source_report(
        source,
        "blocked",
        [],
        error="unimplemented_source_type",
        source_note=source.get("fetch_hint") or "Provider requires dedicated adapter/credentials.",
    )


def collect_sources(config: dict, asset_workspace: Path, run_workspace: Path) -> List[dict]:
    results = []
    for source in config.get("sources", []):
        if not source.get("enabled", True):
            continue
        results.append(download_source(source, asset_workspace, run_workspace))
    return results


def write_ingest_report(workspace: Path, run_id: str, collected: List[dict], out_file: Path) -> None:
    write_json(out_file, {
        "run_id": run_id,
        "generated_at": now_iso(),
        "datasets": len(collected),
        "sources": collected,
    })


def write_media_manifest(workspace: Path, collected: List[dict], out_file: Path) -> None:
    rows: List[dict] = []
    for source in collected:
        rows.extend(source.get("files", []))
    write_jsonl(out_file, rows)
