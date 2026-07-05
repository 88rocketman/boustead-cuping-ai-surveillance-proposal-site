# AI Surveillance Evaluation Tools

This folder is a reusable, automation-first evaluation toolkit for open and client
data.  It supports:

- Dataset source registry ingestion.
- License and metadata validation.
- Label normalization to one internal taxonomy.
- Ground-truth assembly from COCO / JSONL / CSV sources.
- Deterministic evaluation of one or more model outputs.
- Auto-generated client-ready HTML/PDF-ready report output (HTML in this package).

## Quick start

1. Edit `config/sources.json`, `config/models.json`, and optionally
   `config/taxonomy.json`.
2. Run:

```bash
C:\Python314\python.exe -m evaluation_tools.scripts.run_pipeline --workspace evaluation_tools
```

3. Open the generated report file at:

`evaluation_tools/runs/<run_id>/report.html`

For a smoke validation (auto-generated synthetic labels + predictions):

```bash
C:\Python314\python.exe -m evaluation_tools.scripts.run_pipeline --workspace evaluation_tools --smoke
```

To run a single model from `config/models.json`:

```bash
C:\Python314\python.exe -m evaluation_tools.scripts.run_pipeline --workspace evaluation_tools --model yolo11_baseline
```

### What is automated

- `dataset_downloader` can pull:
  - local folders
  - zipped public sources via URL
  - manifest-based sources (CSV/JSON lists of media URLs)

Use `source_type` in `config/sources.json`:

- `local`: pulls from a local folder you place under repository or absolute path
- `http_zip`: downloads and extracts remote ZIP
- `manifest_http`: reads JSON/CSV manifest that references media URLs

Set `media_root`, `download_url`, `downloaded_as`, and `labels.path`/`labels.url`
to point to the source site export endpoints or your mirror storage.
- `evaluate` computes:
  - Precision, recall, F1
  - AP@50 and AP@50-95
- `generate_report` builds an operator-facing report page and exports machine-readable
  `metrics.json`.

### Notes

- If a source site requires credentials (Kaggle, Roboflow, etc.), keep the
  entries in `sources.json` but provide a manual fallback command in
  `source.fetch_hint` first, then run once the environment is ready.
- For the first successful pilot, use `model.mode: dummy` in `models.json` to run an
  automated synthetic inference smoke check.
