"""
FastAPI server: train via run_pipeline (text), serve XGBoost migraine-type predictions,
and optional ResNet18 MRI inference (migraine vs other) from model/image/.
Artifacts for tabular models live under model/text/; MRI weights under model/image/.
"""

from __future__ import annotations

import importlib.util
import logging
import os
import sys
import time
from contextlib import asynccontextmanager
from io import BytesIO
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
import joblib
import numpy as np
import pandas as pd

_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)

_LOG_LEVEL = os.getenv("MODEL_API_LOG_LEVEL", "INFO").strip().upper()
_root_level = getattr(logging, _LOG_LEVEL, logging.INFO)
logging.basicConfig(
    level=_root_level,
    format=os.getenv(
        "MODEL_API_LOG_FORMAT",
        "%(asctime)s %(levelname)s [%(name)s] %(message)s",
    ),
    datefmt="%Y-%m-%d %H:%M:%S",
    force=True,
)
log = logging.getLogger("migraine_model_api")

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

# Pipeline modules live next to run_pipeline.py
_TEXT_DIR = Path(__file__).resolve().parent / "text"
if str(_TEXT_DIR) not in sys.path:
    sys.path.insert(0, str(_TEXT_DIR))

from run_pipeline import run_pipeline  # noqa: E402
from train_next_attack import run_next_attack_pipeline, predict_next_attack  # noqa: E402

_IMAGE_DIR = Path(__file__).resolve().parent / "image"
# Append (not insert) so `run_pipeline` resolves to model/text/, not model/image/run_pipeline.py
if str(_IMAGE_DIR) not in sys.path:
    sys.path.append(str(_IMAGE_DIR))

_serving: dict[str, Any] = {}
_mri: dict[str, Any] = {}


def _parse_cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "").strip()
    if not raw:
        return []
    return [o.strip() for o in raw.split(",") if o.strip()]


def _pipeline_routes_enabled() -> bool:
    """Heavy training endpoints off by default when MODEL_API_ENV=production."""
    explicit = os.getenv("ALLOW_PIPELINE_ROUTES", "").strip().lower()
    if explicit in ("1", "true", "yes"):
        return True
    if explicit in ("0", "false", "no"):
        return False
    return os.getenv("MODEL_API_ENV", "development").strip().lower() != "production"


def _artifact_path(name: str) -> Path:
    return _TEXT_DIR / "artifacts" / name


def _model_path(name: str) -> Path:
    return _TEXT_DIR / name


def load_serving_bundle() -> None:
    """Load model, label encoder, imputers, feature columns, and optional class-id map."""
    model_p = _model_path("xgboost_patient_model.pkl")
    enc_p = _model_path("label_encoder.pkl")
    if not model_p.is_file() or not enc_p.is_file():
        _serving.clear()
        _serving["error"] = (
            f"Missing model files under {_TEXT_DIR}. Run POST /pipeline/run or train locally first."
        )
        log.warning("Serving bundle not loaded: missing %s or %s", model_p, enc_p)
        return

    _serving["model"] = joblib.load(model_p)
    _serving["label_encoder"] = joblib.load(enc_p)
    _serving["feature_columns"] = (
        joblib.load(_artifact_path("feature_columns.joblib"))
        if _artifact_path("feature_columns.joblib").is_file()
        else None
    )
    _serving["num_imputer"] = (
        joblib.load(_artifact_path("num_imputer.joblib"))
        if _artifact_path("num_imputer.joblib").is_file()
        else None
    )
    _serving["cat_imputer"] = (
        joblib.load(_artifact_path("cat_imputer.joblib"))
        if _artifact_path("cat_imputer.joblib").is_file()
        else None
    )
    _serving["model_class_ids"] = (
        joblib.load(_artifact_path("model_class_ids.joblib"))
        if _artifact_path("model_class_ids.joblib").is_file()
        else None
    )
    _serving["next_attack_bundle"] = (
        joblib.load(_artifact_path("next_attack_bundle.joblib"))
        if _artifact_path("next_attack_bundle.joblib").is_file()
        else None
    )
    _serving.pop("error", None)
    log.info(
        "Loaded XGBoost bundle from %s; next_attack=%s",
        model_p,
        _serving["next_attack_bundle"] is not None,
    )


def load_mri_bundle() -> None:
    """Load ResNet18 checkpoint from model/image/ (migraine vs other). Safe if files missing."""
    try:
        import torch
        from predict_model import get_transform, predict_from_pil
        from save_model import load_model_for_inference
    except ImportError as exc:
        _mri.clear()
        _mri["error"] = f"MRI stack unavailable ({exc}). Install torch, torchvision, Pillow."
        log.warning("MRI stack unavailable: %s", exc)
        return

    base = str(_IMAGE_DIR.resolve())
    model_pt = _IMAGE_DIR / "resnet_brain_model.pt"
    labels_json = _IMAGE_DIR / "artifacts" / "class_names.json"
    if not model_pt.is_file() or not labels_json.is_file():
        _mri.clear()
        _mri["error"] = (
            f"Missing MRI weights. Expected {model_pt} and {labels_json}. "
            "Train under model/image with run_pipeline.py (folder layout: migraine/, glioma/, ...)."
        )
        log.warning("MRI model not loaded: missing weights or labels under %s", _IMAGE_DIR)
        return

    try:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model, class_names, transforms_config = load_model_for_inference(base, device)
        transform = get_transform(transforms_config)
    except Exception as exc:
        _mri.clear()
        _mri["error"] = f"Failed to load MRI model: {exc}"
        log.exception("Failed to load MRI model")
        return

    _mri["model"] = model
    _mri["transform"] = transform
    _mri["device"] = device
    _mri["class_names"] = class_names
    _mri["transforms_config"] = transforms_config
    _mri["predict_from_pil"] = predict_from_pil
    _mri.pop("error", None)
    log.info("Loaded MRI ResNet bundle on device %s", device)


def predict_mri_from_bytes(image_bytes: bytes) -> dict[str, Any]:
    """Run ResNet inference on raw image bytes (PNG/JPEG, ...)."""
    if "model" not in _mri:
        raise HTTPException(status_code=503, detail=_mri.get("error", "MRI model not loaded."))
    from PIL import Image

    predict_from_pil = _mri["predict_from_pil"]
    try:
        img = Image.open(BytesIO(image_bytes)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {exc}") from exc

    pred_label, probs = predict_from_pil(
        img,
        _mri["model"],
        _mri["transform"],
        _mri["device"],
        _mri["class_names"],
        _mri["transforms_config"],
    )
    names = _mri["class_names"]
    conf = max(probs) if probs else None
    return {
        "predicted_label": pred_label,
        "confidence": float(conf) if conf is not None else None,
        "probabilities": {str(names[i]): float(probs[i]) for i in range(len(names))},
        "class_names": [str(x) for x in names],
        "disclaimer": "Research and education only; not for clinical diagnosis.",
    }


def preprocess_features(df: pd.DataFrame) -> pd.DataFrame:
    """Match predictModel / run_pipeline inference-time transforms."""
    out = df.copy()
    if "Intensity" in out.columns and "Frequency" in out.columns:
        out["Intensity_x_Freq"] = out["Intensity"] * out["Frequency"]
    aura_cols = [c for c in ["Visual", "Sensory", "Dysphasia"] if c in out.columns]
    if aura_cols:
        out["has_aura"] = (out[aura_cols].sum(axis=1) > 0).astype(int)

    numeric_cols = out.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = list(out.select_dtypes(include=["object", "category"]).columns)

    if _serving.get("num_imputer") is not None and numeric_cols:
        expected = getattr(_serving["num_imputer"], "feature_names_in_", None)
        expected_cols = [str(x) for x in expected.tolist()] if expected is not None else []
        if expected_cols:
            if "Aura" in expected_cols and "Aura" not in out.columns:
                out["Aura"] = out.get("has_aura", 0).astype(int) if "has_aura" in out.columns else 0
            aligned_numeric = out.reindex(columns=expected_cols, fill_value=0)
            out[expected_cols] = _serving["num_imputer"].transform(aligned_numeric)
        else:
            out[numeric_cols] = _serving["num_imputer"].transform(out[numeric_cols])
    if _serving.get("cat_imputer") is not None and categorical_cols:
        out[categorical_cols] = _serving["cat_imputer"].transform(out[categorical_cols])
        out[categorical_cols] = out[categorical_cols].astype(str)

    if categorical_cols:
        out = pd.get_dummies(out, columns=categorical_cols, dummy_na=True)

    feature_columns = _serving.get("feature_columns")
    if feature_columns is not None:
        out = out.reindex(columns=feature_columns, fill_value=0)
    return out


def predict_from_records(records: list[dict[str, Any]]) -> dict[str, Any]:
    if "model" not in _serving:
        raise HTTPException(status_code=503, detail=_serving.get("error", "Model not loaded."))

    model = _serving["model"]
    label_encoder = _serving["label_encoder"]
    model_class_ids = _serving.get("model_class_ids")

    raw = pd.DataFrame(records)
    X = preprocess_features(raw)
    pred_local = model.predict(X).astype(int)

    if model_class_ids is not None:
        pred_encoded = np.array([int(model_class_ids[i]) for i in pred_local], dtype=int)
    else:
        pred_encoded = pred_local

    labels = label_encoder.inverse_transform(pred_encoded)
    out: dict[str, Any] = {
        "predicted_type": [str(x) for x in labels],
        "predicted_class_index": pred_encoded.tolist(),
    }

    if hasattr(model, "predict_proba"):
        proba = model.predict_proba(X)
        class_names = None
        if model_class_ids is not None:
            class_names = [
                str(label_encoder.classes_[int(j)]) for j in np.asarray(model_class_ids).flatten()
            ]
        elif hasattr(label_encoder, "classes_"):
            class_names = [str(c) for c in label_encoder.classes_]
        if class_names and proba.shape[1] == len(class_names):
            out["probabilities"] = [
                {class_names[j]: float(row[j]) for j in range(len(class_names))}
                for row in proba
            ]
    return out


def predict_next_from_records(records: list[dict[str, Any]]) -> dict[str, Any]:
    bundle = _serving.get("next_attack_bundle")
    if bundle is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Next-attack model not loaded. Run POST /pipeline/run-next "
                "or train locally with text/train_next_attack.py first."
            ),
        )
    try:
        return predict_next_attack(records, bundle)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_serving_bundle()
    load_mri_bundle()
    yield


app = FastAPI(title="Migraine & MRI model API", lifespan=lifespan)

_cors_origins = _parse_cors_origins()
if _cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


class PredictRequest(BaseModel):
    """One or more rows with the same columns as training CSV (no target column required)."""

    records: list[dict[str, Any]] = Field(..., min_length=1, description="Feature rows as JSON objects.")


def _resolve_under_text(p: str | None) -> str | None:
    if p is None:
        return None
    path = Path(p)
    if not path.is_absolute():
        path = (_TEXT_DIR / path).resolve()
    return str(path)


@app.get("/")
def root():
    return {
        "service": "migraine-model-api",
        "docs": "/docs",
        "health": "/health",
        "predict_mri": "/predict/mri",
    }


@app.get("/health")
def health():
    ok = "model" in _serving
    return {
        "ok": ok,
        "artifacts_dir": str(_TEXT_DIR),
        "has_model_class_ids": _artifact_path("model_class_ids.joblib").is_file(),
        "has_next_attack_bundle": _artifact_path("next_attack_bundle.joblib").is_file(),
        "error": _serving.get("error"),
        "has_mri_model": "model" in _mri,
        "mri_error": _mri.get("error"),
    }


@app.get("/api/health")
def api_health():
    """Tiny probe for scripts, proxies, or smoke tests (GET only)."""
    return {"status": "ok", "service": "migraine-model-api"}


@app.post("/predict/next-attack")
def predict_next_attack_endpoint(req: PredictRequest):
    return predict_next_from_records(req.records)


@app.post("/predict_next_attack")
def predict_next_attack_no_slash(req: PredictRequest):
    """Alias for proxies or older clients; same handler as /predict/next-attack."""
    return predict_next_from_records(req.records)


@app.post("/predict")
def predict(req: PredictRequest):
    return predict_from_records(req.records)


@app.post("/predict/reload")
def predict_reload():
    load_serving_bundle()
    load_mri_bundle()
    return health()


@app.post("/predict/mri")
async def predict_mri(file: UploadFile = File(..., description="Brain MRI slice (PNG, JPEG, etc.).")):
    """ResNet18: migraine vs other brain MRI classes (requires trained weights under model/image/)."""
    raw = await file.read()
    if not raw:
        raise HTTPException(status_code=400, detail="Empty upload.")

    def _run():
        return predict_mri_from_bytes(raw)

    return await run_in_threadpool(_run)


@app.post("/predict/mri/reload")
def predict_mri_reload():
    load_mri_bundle()
    return {
        "has_mri_model": "model" in _mri,
        "mri_error": _mri.get("error"),
    }


@app.post("/pipeline/run")
async def pipeline_run(
    data_path: str | None = None,
    data_dir: str | None = None,
    stratify_by_patient: bool | None = None,
):
    """
    Run the full training pipeline (writes pkls and artifacts under model/text).
    Paths are resolved relative to model/text when not absolute.
    """
    if not _pipeline_routes_enabled():
        raise HTTPException(status_code=403, detail="Pipeline routes are disabled in this environment.")
    data_path = _resolve_under_text(data_path)
    data_dir = _resolve_under_text(data_dir)
    stratify = stratify_by_patient

    def _run():
        old = os.getcwd()
        try:
            os.chdir(_TEXT_DIR)
            kwargs: dict[str, Any] = {}
            if data_path is not None:
                kwargs["data_path"] = data_path
            if data_dir is not None:
                kwargs["data_dir"] = data_dir
            if stratify is not None:
                kwargs["stratify_by_patient"] = stratify
            run_pipeline(**kwargs)
        finally:
            os.chdir(old)

    await run_in_threadpool(_run)
    load_serving_bundle()
    return {"status": "completed", "health": health()}


@app.api_route("/pipeline/run-next", methods=["GET", "POST"])
async def pipeline_run_next(
    data_path: str | None = None,
    data_dir: str | None = None,
):
    """
    Train next-attack forecasting bundle under model/text/artifacts.

    Use POST from scripts/curl; GET is supported so you can trigger training from a browser
    during local development (e.g. http://127.0.0.1:8000/pipeline/run-next ).
    """
    if not _pipeline_routes_enabled():
        raise HTTPException(status_code=403, detail="Pipeline routes are disabled in this environment.")
    data_path = _resolve_under_text(data_path)
    data_dir = _resolve_under_text(data_dir)

    def _run():
        old = os.getcwd()
        try:
            os.chdir(_TEXT_DIR)
            kwargs: dict[str, Any] = {}
            if data_path is not None:
                kwargs["data_path"] = data_path
            if data_dir is not None:
                kwargs["data_dir"] = data_dir
            return run_next_attack_pipeline(**kwargs)
        finally:
            os.chdir(old)

    result = await run_in_threadpool(_run)
    load_serving_bundle()
    return {"status": "completed", "next_attack_training": result, "health": health()}


def _resolve_under_image(p: str | None) -> str | None:
    if p is None:
        return None
    path = Path(p)
    if not path.is_absolute():
        path = (_IMAGE_DIR / path).resolve()
    return str(path)


@app.post("/pipeline/run-mri")
async def pipeline_run_mri(data_dir: str | None = None):
    """
    Train the MRI ResNet18 pipeline (migraine vs other) under model/image.
    `data_dir` is resolved relative to model/image when not absolute (default: image/Data).
    """
    if not _pipeline_routes_enabled():
        raise HTTPException(status_code=403, detail="Pipeline routes are disabled in this environment.")

    def _run():
        ip = _IMAGE_DIR / "run_pipeline.py"
        spec = importlib.util.spec_from_file_location("mri_image_run_pipeline", str(ip))
        if spec is None or spec.loader is None:
            raise RuntimeError("Could not load MRI training module.")
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        old = os.getcwd()
        try:
            os.chdir(str(_IMAGE_DIR))
            resolved = _resolve_under_image(data_dir)
            if resolved is not None:
                mod.run_pipeline(data_dir=resolved)
            else:
                mod.run_pipeline()
        finally:
            os.chdir(old)

    await run_in_threadpool(_run)
    load_mri_bundle()
    return {"status": "completed", "health": health()}


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("MODEL_SERVER_HOST", "0.0.0.0")
    port = int(os.getenv("MODEL_SERVER_PORT", "8000"))
    uvicorn.run(app, host=host, port=port)
