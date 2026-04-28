"""
FastAPI server: train via run_pipeline (text) and serve XGBoost migraine-type predictions.
Artifacts are read from model/text/ (same layout as run_pipeline Step 9).
"""

from __future__ import annotations

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from starlette.concurrency import run_in_threadpool

# Pipeline modules live next to run_pipeline.py
_TEXT_DIR = Path(__file__).resolve().parent / "text"
if str(_TEXT_DIR) not in sys.path:
    sys.path.insert(0, str(_TEXT_DIR))

from run_pipeline import run_pipeline  # noqa: E402

_serving: dict[str, Any] = {}


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
    _serving.pop("error", None)


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


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_serving_bundle()
    yield


app = FastAPI(title="Migraine model API", lifespan=lifespan)


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


@app.get("/health")
@app.get("/api/health")
def health():
    ok = "model" in _serving
    return {
        "ok": ok,
        "artifacts_dir": str(_TEXT_DIR),
        "has_model_class_ids": _artifact_path("model_class_ids.joblib").is_file(),
        "error": _serving.get("error"),
    }


@app.post("/predict")
def predict(req: PredictRequest):
    return predict_from_records(req.records)


@app.post("/predict/reload")
def predict_reload():
    load_serving_bundle()
    return health()


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


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
