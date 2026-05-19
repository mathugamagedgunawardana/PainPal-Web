"""
Download model weights into MODEL_ARTIFACTS_DIR (default /tmp/painpal-artifacts) for Vercel.

Set MODEL_ARTIFACTS_JSON to a JSON object mapping relative paths to HTTPS URLs, e.g.:
{
  "text/xgboost_patient_model.pkl": "https://....public.blob.vercel-storage.com/...",
  "text/label_encoder.pkl": "...",
  "text/artifacts/feature_columns.joblib": "...",
  "text/artifacts/next_attack_bundle.joblib": "...",
  "image/resnet_brain_model.onnx": "...",
  "image/artifacts/class_names.json": "...",
  "image/artifacts/transforms_config.json": "..."
}

Or set individual env vars: MODEL_ARTIFACT_XGBOOST_URL, MODEL_ARTIFACT_LABEL_ENCODER_URL, etc.
"""

from __future__ import annotations

import json
import logging
import os
import urllib.error
import urllib.request
from pathlib import Path

log = logging.getLogger("migraine_model_api.artifacts")

_READY_MARKER = ".artifacts_ready"

# relative path under artifacts root -> env var for URL override
_ARTIFACT_ENV_KEYS: dict[str, str] = {
    "text/xgboost_patient_model.pkl": "MODEL_ARTIFACT_XGBOOST_URL",
    "text/label_encoder.pkl": "MODEL_ARTIFACT_LABEL_ENCODER_URL",
    "text/artifacts/feature_columns.joblib": "MODEL_ARTIFACT_FEATURE_COLUMNS_URL",
    "text/artifacts/num_imputer.joblib": "MODEL_ARTIFACT_NUM_IMPUTER_URL",
    "text/artifacts/cat_imputer.joblib": "MODEL_ARTIFACT_CAT_IMPUTER_URL",
    "text/artifacts/model_class_ids.joblib": "MODEL_ARTIFACT_CLASS_IDS_URL",
    "text/artifacts/next_attack_bundle.joblib": "MODEL_ARTIFACT_NEXT_ATTACK_URL",
    "image/resnet_brain_model.onnx": "MODEL_ARTIFACT_MRI_ONNX_URL",
    "image/resnet_brain_model.pt": "MODEL_ARTIFACT_MRI_PT_URL",
    "image/artifacts/class_names.json": "MODEL_ARTIFACT_MRI_CLASS_NAMES_URL",
    "image/artifacts/transforms_config.json": "MODEL_ARTIFACT_MRI_TRANSFORMS_URL",
}


def _bundled_root() -> Path:
    return Path(__file__).resolve().parent / "bundled_artifacts"


def artifacts_root() -> Path:
    raw = os.getenv("MODEL_ARTIFACTS_DIR", "/tmp/painpal-artifacts").strip()
    return Path(raw)


def bundled_artifacts_root() -> Path | None:
    root = _bundled_root()
    marker = root / "text" / "xgboost_patient_model.pkl"
    return root if marker.is_file() else None


def is_vercel_runtime() -> bool:
    return os.getenv("VERCEL", "").strip() == "1"


def artifacts_ready() -> bool:
    return (artifacts_root() / _READY_MARKER).is_file()


def _manifest_urls() -> dict[str, str]:
    raw = os.getenv("MODEL_ARTIFACTS_JSON", "").strip()
    if not raw:
        return {}
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Invalid MODEL_ARTIFACTS_JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise RuntimeError("MODEL_ARTIFACTS_JSON must be a JSON object of path -> url")
    return {str(k): str(v) for k, v in data.items() if v}


def normalize_blob_token(raw: str) -> str:
    """Strip whitespace and accidental trailing punctuation from .env copies."""
    token = raw.strip().strip('"').strip("'")
    while token.endswith("."):
        token = token[:-1]
    return token


def blob_auth_token() -> str | None:
    raw = os.getenv("BLOB_READ_WRITE_TOKEN", "").strip()
    if not raw:
        return None
    return normalize_blob_token(raw)


def _collect_download_map() -> dict[str, str]:
    urls: dict[str, str] = {}
    urls.update(_manifest_urls())
    for rel, env_key in _ARTIFACT_ENV_KEYS.items():
        val = os.getenv(env_key, "").strip()
        if val:
            urls[rel] = val
    return urls


def _download_file(url: str, dest: Path, timeout: float) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    download_url = url
    if "private.blob.vercel-storage.com" in url and "download=" not in url:
        download_url = f"{url}{'&' if '?' in url else '?'}download=1"

    headers: dict[str, str] = {}
    token = blob_auth_token()
    if token and "blob.vercel-storage.com" in download_url:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(download_url, method="GET", headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = resp.read()
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Failed to download {download_url}: {exc}") from exc
    dest.write_bytes(data)
    log.info("Downloaded artifact %s (%s bytes)", dest.name, len(data))


def ensure_artifacts(force: bool = False) -> Path:
    """
    Ensure configured remote artifacts exist under artifacts_root().
    No-op when no URLs are configured (local dev with files on disk).
    """
    root = artifacts_root()
    marker = root / _READY_MARKER
    if marker.is_file() and not force:
        return root

    download_map = _collect_download_map()
    if not download_map:
        return root

    timeout = float(os.getenv("MODEL_ARTIFACT_DOWNLOAD_TIMEOUT", "120"))
    log.info("Syncing %s model artifact(s) to %s", len(download_map), root)

    for rel, url in download_map.items():
        dest = root / rel
        if dest.is_file() and not force:
            continue
        _download_file(url, dest, timeout)

    marker.write_text("ok\n", encoding="utf-8")
    return root


def resolve_text_path(text_dir: Path, name: str) -> Path:
    """Prefer bundled deploy copy, downloaded artifact, then local text_dir file."""
    bundled = bundled_artifacts_root()
    if bundled is not None:
        p = bundled / "text" / name
        if p.is_file():
            return p
    root = artifacts_root()
    remote = root / "text" / name
    if remote.is_file():
        return remote
    return text_dir / name


def resolve_text_artifact(text_dir: Path, name: str) -> Path:
    bundled = bundled_artifacts_root()
    if bundled is not None:
        p = bundled / "text" / "artifacts" / name
        if p.is_file():
            return p
    root = artifacts_root()
    remote = root / "text" / "artifacts" / name
    if remote.is_file():
        return remote
    return text_dir / "artifacts" / name


def resolve_image_path(image_dir: Path, name: str) -> Path:
    bundled = bundled_artifacts_root()
    if bundled is not None:
        p = bundled / "image" / name
        if p.is_file():
            return p
    root = artifacts_root()
    remote = root / "image" / name
    if remote.is_file():
        return remote
    return image_dir / name


def resolve_image_artifact(image_dir: Path, name: str) -> Path:
    bundled = bundled_artifacts_root()
    if bundled is not None:
        p = bundled / "image" / "artifacts" / name
        if p.is_file():
            return p
    root = artifacts_root()
    remote = root / "image" / "artifacts" / name
    if remote.is_file():
        return remote
    return image_dir / "artifacts" / name
