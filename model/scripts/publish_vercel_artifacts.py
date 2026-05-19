#!/usr/bin/env python3
"""
Upload local model files to Vercel Blob and print MODEL_ARTIFACTS_JSON for the model project.

Requires: pip install vercel-blob python-dotenv (or use @vercel/blob from Node).

  cd model
  export BLOB_READ_WRITE_TOKEN=...
  python scripts/publish_vercel_artifacts.py

Use a compact next_attack bundle on Vercel (under ~80MB):
  NEXT_ATTACK_N_EST_REG=50 NEXT_ATTACK_N_EST_BIN=50 NEXT_ATTACK_N_EST_TYPE=80 \\
    python text/train_next_attack.py
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

MODEL_ROOT = Path(__file__).resolve().parents[1]
TEXT = MODEL_ROOT / "text"
IMAGE = MODEL_ROOT / "image"

FILES: list[tuple[str, Path]] = [
    ("text/xgboost_patient_model.pkl", TEXT / "xgboost_patient_model.pkl"),
    ("text/label_encoder.pkl", TEXT / "label_encoder.pkl"),
    ("text/artifacts/feature_columns.joblib", TEXT / "artifacts" / "feature_columns.joblib"),
    ("text/artifacts/num_imputer.joblib", TEXT / "artifacts" / "num_imputer.joblib"),
    ("text/artifacts/cat_imputer.joblib", TEXT / "artifacts" / "cat_imputer.joblib"),
    ("text/artifacts/model_class_ids.joblib", TEXT / "artifacts" / "model_class_ids.joblib"),
    ("text/artifacts/next_attack_bundle.joblib", TEXT / "artifacts" / "next_attack_bundle.joblib"),
    ("image/resnet_brain_model.onnx", IMAGE / "resnet_brain_model.onnx"),
    ("image/artifacts/class_names.json", IMAGE / "artifacts" / "class_names.json"),
    ("image/artifacts/transforms_config.json", IMAGE / "artifacts" / "transforms_config.json"),
]


def _normalize_blob_token(raw: str) -> str:
    token = raw.strip().strip('"').strip("'")
    while token.endswith("."):
        token = token[:-1]
    return token


def _load_blob_token() -> str:
    token = os.getenv("BLOB_READ_WRITE_TOKEN", "").strip()
    if token:
        return _normalize_blob_token(token)
    for env_path in (
        MODEL_ROOT.parent / "client" / ".env",
        MODEL_ROOT.parent / "client" / ".env.local",
        MODEL_ROOT / ".env",
    ):
        if not env_path.is_file():
            continue
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("BLOB_READ_WRITE_TOKEN="):
                return _normalize_blob_token(line.split("=", 1)[1])
    raise SystemExit("Set BLOB_READ_WRITE_TOKEN or add it to client/.env")


def _upload(path: Path, pathname: str) -> str:
    try:
        from vercel_blob import put
    except ImportError as exc:
        raise SystemExit("Install vercel-blob: pip install vercel-blob") from exc

    token = _load_blob_token()
    size_mb = path.stat().st_size / (1024 * 1024)
    with path.open("rb") as f:
        data = f.read()
    result = put(
        pathname,
        data,
        options={"token": token, "allowOverwrite": "true"},
        timeout=max(60, int(size_mb * 3)),
        multipart=size_mb >= 5,
        verbose=True,
    )
    url = result.get("downloadUrl") or result.get("url") if isinstance(result, dict) else getattr(result, "url", None)
    if not url:
        raise RuntimeError(f"Upload failed for {pathname}: {result}")
    return str(url)


def main() -> None:
    manifest: dict[str, str] = {}
    missing: list[str] = []

    for rel, local in FILES:
        if not local.is_file():
            missing.append(rel)
            continue
        size_mb = local.stat().st_size / (1024 * 1024)
        if size_mb > 450:
            print(f"WARNING: {rel} is {size_mb:.0f}MB — too large for reliable Vercel cold start.", file=sys.stderr)
        pathname = f"ml-artifacts/{rel.replace('/', '_')}"
        print(f"Uploading {rel} ({size_mb:.1f} MB)...")
        manifest[rel] = _upload(local, pathname)

    if missing:
        print("\nSkipped (not found):", ", ".join(missing), file=sys.stderr)

    if not manifest:
        raise SystemExit("No files uploaded. Train models locally first.")

    manifest_line = "MODEL_ARTIFACTS_JSON=" + json.dumps(manifest, separators=(",", ":"))
    out_path = MODEL_ROOT / "vercel-artifacts.env"
    out_path.write_text(
        manifest_line
        + "\nMODEL_USE_ONNX=true\nMODEL_API_ENV=production\nALLOW_PIPELINE_ROUTES=false\n",
        encoding="utf-8",
    )

    print("\n--- Add to painpal-model Vercel project ---\n")
    print(manifest_line)
    print("\nMODEL_USE_ONNX=true")
    print("MODEL_API_ENV=production")
    print("ALLOW_PIPELINE_ROUTES=false")
    print(f"\n(Wrote {out_path})")


if __name__ == "__main__":
    main()
