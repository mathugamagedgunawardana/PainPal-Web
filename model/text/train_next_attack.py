#!/usr/bin/env python3
"""
Train and serve a next-attack forecasting bundle from migraine tabular data.

For each attack row, this builds a supervised sample where:
  X_t = current attack features
  y_t = next attack outcomes for the same patient (or next global row fallback)
"""

from __future__ import annotations

import math
import os
from typing import Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import accuracy_score, mean_absolute_error
from sklearn.model_selection import train_test_split

from data_loader import (
    load_data_from_data_folder,
    load_data_from_labeled_folder,
    load_data_single,
)

SYNTHETIC_DATA_PATH = "migraine_data_synthetic.csv"
DATA_PATH = "migraine_data.csv"
NEXT_BUNDLE_PATH = os.path.join("artifacts", "next_attack_bundle.joblib")

TYPE_ONE_HOT_COLS = [
    "Migraine_without_aura",
    "Typical_aura_migraine",
    "Brainstem_aura_migraine",
    "Hemiplegic_migraine",
    "Retinal_migraine",
    "Chronic_migraine",
    "Menstrual_migraine",
    "Vestibular_migraine",
    "Status_migrainosus",
    "Probable_migraine",
]

REGRESSION_TARGETS = ["Duration", "Frequency", "Intensity"]
BINARY_TARGETS = [
    "Nausea",
    "Vomit",
    "Photophobia",
    "Phonophobia",
    "Aura",
    "Visual",
    "Sensory",
    "Dysphasia",
    "Vertigo",
    "Tinnitus",
    "Hypoacusis",
    "Diplopia",
    "Defect",
    "Ataxia",
    "Conscience",
]


def _load_training_data(data_path: str | None = None, data_dir: str | None = None) -> pd.DataFrame:
    if data_dir and os.path.isdir(data_dir):
        patient_paths = [
            p for p in os.listdir(data_dir) if p.lower().startswith("patient") and p.lower().endswith(".csv")
        ]
        if patient_paths:
            return load_data_from_data_folder(data_dir)
        return load_data_from_labeled_folder(data_dir)

    resolved = data_path
    if resolved is None:
        resolved = SYNTHETIC_DATA_PATH if os.path.isfile(SYNTHETIC_DATA_PATH) else DATA_PATH
    if not os.path.isfile(resolved):
        raise FileNotFoundError(f"Training CSV not found: {resolved}")
    return load_data_single(resolved)


def _extract_type_label(df: pd.DataFrame) -> pd.Series:
    present = [c for c in TYPE_ONE_HOT_COLS if c in df.columns]
    if not present:
        if "Type" in df.columns:
            return df["Type"].astype(str)
        if "MigraineType" in df.columns:
            return df["MigraineType"].astype(str)
        raise ValueError("No migraine type columns found for next-type target.")

    one_hot = df[present].apply(pd.to_numeric, errors="coerce").fillna(0)
    no_positive = one_hot.sum(axis=1) <= 0
    if no_positive.any():
        one_hot.loc[no_positive, present[0]] = 1
    return one_hot.idxmax(axis=1).astype(str)


def _sort_for_sequence(df: pd.DataFrame) -> pd.DataFrame:
    sort_cols = []
    for col in ["patient_id", "attack_id", "timestamp", "created_at", "date"]:
        if col in df.columns:
            sort_cols.append(col)
    if sort_cols:
        return df.sort_values(sort_cols).reset_index(drop=True)
    return df.reset_index(drop=True)


def _build_next_attack_pairs(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    base = _sort_for_sequence(df.copy())
    base["_type_label"] = _extract_type_label(base)
    all_targets = REGRESSION_TARGETS + BINARY_TARGETS
    available_targets = [c for c in all_targets if c in base.columns]
    if not available_targets:
        raise ValueError("No next-attack target columns available in dataset.")

    if "patient_id" in base.columns:
        grouped = []
        for _, g in base.groupby("patient_id", sort=False):
            g = g.reset_index(drop=True)
            shifted = g[available_targets].shift(-1)
            shifted["_next_type"] = g["_type_label"].shift(-1)
            merged = g.copy()
            for c in available_targets:
                merged[f"_next_{c}"] = shifted[c]
            merged["_next_type"] = shifted["_next_type"]
            grouped.append(merged.iloc[:-1])
        seq = pd.concat(grouped, ignore_index=True) if grouped else pd.DataFrame()
    else:
        seq = base.copy()
        for c in available_targets:
            seq[f"_next_{c}"] = seq[c].shift(-1)
        seq["_next_type"] = seq["_type_label"].shift(-1)
        seq = seq.iloc[:-1]

    seq = seq.dropna(subset=["_next_type"]).reset_index(drop=True)
    if seq.empty:
        raise ValueError("Unable to build sequence pairs. Need at least 2 attacks per sequence.")

    feature_drop = set(TYPE_ONE_HOT_COLS + ["Type", "MigraineType", "_type_label"])
    feature_df = seq.drop(columns=[c for c in feature_drop if c in seq.columns], errors="ignore")
    for c in available_targets:
        feature_df = feature_df.drop(columns=[f"_next_{c}"], errors="ignore")
    feature_df = feature_df.drop(columns=["_next_type"], errors="ignore")
    target_df = seq[[*(f"_next_{c}" for c in available_targets), "_next_type"]].copy()
    return feature_df, target_df


def _fit_feature_frame(X: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, Any]]:
    df = X.copy()
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = [c for c in df.columns if c not in numeric_cols]

    numeric_fill = {c: float(df[c].median()) if not df[c].dropna().empty else 0.0 for c in numeric_cols}
    for c, value in numeric_fill.items():
        df[c] = df[c].fillna(value)

    categorical_fill = {}
    for c in categorical_cols:
        mode = df[c].mode(dropna=True)
        fill = str(mode.iloc[0]) if not mode.empty else "missing"
        categorical_fill[c] = fill
        df[c] = df[c].fillna(fill).astype(str)

    if categorical_cols:
        df = pd.get_dummies(df, columns=categorical_cols, dummy_na=True)

    artifacts = {
        "numeric_fill": numeric_fill,
        "categorical_fill": categorical_fill,
        "feature_columns": df.columns.tolist(),
    }
    return df, artifacts


def _transform_feature_frame(X: pd.DataFrame, feature_artifacts: dict[str, Any]) -> pd.DataFrame:
    df = X.copy()
    numeric_fill = feature_artifacts.get("numeric_fill", {})
    categorical_fill = feature_artifacts.get("categorical_fill", {})

    for c, value in numeric_fill.items():
        if c not in df.columns:
            df[c] = value
        df[c] = pd.to_numeric(df[c], errors="coerce").fillna(value)

    for c, value in categorical_fill.items():
        if c not in df.columns:
            df[c] = value
        df[c] = df[c].fillna(value).astype(str)

    cat_cols = list(categorical_fill.keys())
    if cat_cols:
        df = pd.get_dummies(df, columns=cat_cols, dummy_na=True)

    return df.reindex(columns=feature_artifacts["feature_columns"], fill_value=0)


def _extract_numeric_history(records: list[dict[str, Any]], key: str) -> list[float]:
    """Collect finite positive values for a field across the patient's model rows."""
    out: list[float] = []
    for r in records:
        if key not in r:
            continue
        try:
            v = float(r[key])
        except (TypeError, ValueError):
            continue
        if math.isfinite(v) and v > 0:
            out.append(v)
    return out


def _adjust_duration_hours(records: list[dict[str, Any]], raw: float) -> float:
    """
    Anchor predicted duration to this patient's logged hours so RF extrapolation
    does not drift far from observed attack lengths (e.g. 1–2 h vs 12 h).
    """
    durs = sorted(_extract_numeric_history(records, "Duration"))
    raw = float(raw)
    if not durs:
        return float(max(0.5, min(72.0, raw)))

    med = float(np.median(durs))
    p25 = float(np.percentile(durs, 25))
    p75 = float(np.percentile(durs, 75))
    iqr = max(p75 - p25, 0.25)
    # Weight heavily toward the patient's typical duration; allow modest model nudge.
    blended = 0.12 * raw + 0.88 * med
    lo = max(0.25, min(p25 - 0.25 * iqr, med * 0.5))
    hi = min(72.0, max(p75 + 1.5 * iqr, med * 2.0 + 0.5))
    return float(round(max(lo, min(hi, blended)) * 10) / 10)


def _adjust_frequency_per_month(records: list[dict[str, Any]], raw: float) -> int:
    """Episodes per month style metric: integer, grounded in recent logged rates when possible."""
    hist = _extract_numeric_history(records, "Frequency")
    raw = float(raw)
    if hist:
        med = float(np.median(hist))
        blended = 0.35 * raw + 0.65 * med
    else:
        blended = raw
    return int(max(0, min(31, round(blended))))


def _intensity_training_to_severity10(raw: float) -> float:
    """
    Training CSV Intensity is 1–3 (coarse); map to an approximate 1–10 severity for UI.
    Aligns with severityToTrainingIntensity bands used when building records.
    """
    t = float(np.clip(raw, 1.0, 3.0))
    sev = 1.0 + (t - 1.0) * 4.5
    return float(round(float(np.clip(sev, 1.0, 10.0)) * 10) / 10)


TYPE_LOW_CONF_THRESHOLD = 0.25
_HISTORY_TYPE_WINDOW = 10


def _dominant_type_from_history(records: list[dict[str, Any]]) -> str | None:
    """Mode of non-empty Type from the last N records."""
    window = records[-_HISTORY_TYPE_WINDOW:] if len(records) > _HISTORY_TYPE_WINDOW else records
    counts: dict[str, int] = {}
    for r in window:
        t = str(r.get("Type") or "").strip()
        if not t:
            continue
        counts[t] = counts.get(t, 0) + 1
    if not counts:
        return None
    return max(counts.items(), key=lambda x: x[1])[0]


def _apply_type_fallback(
    model_label: str,
    proba_dict: dict[str, float],
    records: list[dict[str, Any]],
) -> tuple[str, dict[str, Any]]:
    """When model confidence is low, prefer the patient's dominant logged type."""
    meta: dict[str, Any] = {
        "model_label": model_label,
        "low_confidence": False,
        "history_fallback": False,
    }
    if not proba_dict:
        return model_label, meta
    max_prob = float(max(proba_dict.values()))
    meta["confidence"] = max_prob
    meta["low_confidence"] = max_prob < TYPE_LOW_CONF_THRESHOLD
    if max_prob >= TYPE_LOW_CONF_THRESHOLD:
        return model_label, meta
    history = _dominant_type_from_history(records)
    typed_count = sum(1 for r in records if str(r.get("Type") or "").strip())
    if history and typed_count >= 2:
        meta["history_fallback"] = True
        return history, meta
    return model_label, meta


def _adjust_intensity_from_history(records: list[dict[str, Any]], raw: float) -> float:
    """Blend RF intensity with median training-scale intensity from episode history."""
    hist = _extract_numeric_history(records, "Intensity")
    model_sev = _intensity_training_to_severity10(max(0.0, raw))
    if not hist:
        return model_sev
    med_train = float(np.median(hist))
    hist_sev = _intensity_training_to_severity10(med_train)
    blended = 0.25 * model_sev + 0.75 * hist_sev
    return float(round(float(np.clip(blended, 1.0, 10.0)) * 10) / 10)


def _top_k_types(proba_dict: dict[str, float], k: int = 3) -> list[dict[str, Any]]:
    items = sorted(proba_dict.items(), key=lambda x: x[1], reverse=True)[:k]
    return [{"label": str(label), "probability": float(prob)} for label, prob in items]


def run_next_attack_pipeline(data_path: str | None = None, data_dir: str | None = None) -> dict[str, Any]:
    """
    Train next-attack models and save a bundle under artifacts/next_attack_bundle.joblib.
    """
    os.makedirs("artifacts", exist_ok=True)
    df = _load_training_data(data_path=data_path, data_dir=data_dir)
    X_raw, y = _build_next_attack_pairs(df)
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X_raw, y, test_size=0.2, random_state=42
    )

    X_train, feature_artifacts = _fit_feature_frame(X_train_raw)
    X_test = _transform_feature_frame(X_test_raw, feature_artifacts)

    models_reg: dict[str, Any] = {}
    models_bin: dict[str, Any] = {}
    metrics: dict[str, Any] = {"regression_mae": {}, "binary_accuracy": {}}

    for col in REGRESSION_TARGETS:
        target_col = f"_next_{col}"
        if target_col not in y_train.columns:
            continue
        reg = RandomForestRegressor(n_estimators=300, random_state=42)
        reg.fit(X_train, y_train[target_col].astype(float))
        pred = reg.predict(X_test)
        metrics["regression_mae"][col] = float(
            mean_absolute_error(y_test[target_col].astype(float), pred)
        )
        models_reg[col] = reg

    for col in BINARY_TARGETS:
        target_col = f"_next_{col}"
        if target_col not in y_train.columns:
            continue
        clf = RandomForestClassifier(n_estimators=300, random_state=42, class_weight="balanced")
        clf.fit(X_train, y_train[target_col].astype(int))
        pred = clf.predict(X_test)
        metrics["binary_accuracy"][col] = float(
            accuracy_score(y_test[target_col].astype(int), pred)
        )
        models_bin[col] = clf

    type_clf = RandomForestClassifier(n_estimators=400, random_state=42, class_weight="balanced")
    type_clf.fit(X_train, y_train["_next_type"].astype(str))
    type_pred = type_clf.predict(X_test)
    metrics["next_type_accuracy"] = float(accuracy_score(y_test["_next_type"].astype(str), type_pred))

    bundle = {
        "feature_artifacts": feature_artifacts,
        "models_reg": models_reg,
        "models_bin": models_bin,
        "model_type": type_clf,
        "regression_targets": [k for k in REGRESSION_TARGETS if k in models_reg],
        "binary_targets": [k for k in BINARY_TARGETS if k in models_bin],
        "type_classes": [str(c) for c in type_clf.classes_],
        "metrics": metrics,
        "train_rows": int(X_train.shape[0]),
        "test_rows": int(X_test.shape[0]),
    }
    joblib.dump(bundle, NEXT_BUNDLE_PATH)
    return {
        "status": "completed",
        "saved_to": NEXT_BUNDLE_PATH,
        "metrics": metrics,
        "train_rows": int(X_train.shape[0]),
        "test_rows": int(X_test.shape[0]),
    }


def predict_next_attack(records: list[dict[str, Any]], bundle: dict[str, Any]) -> dict[str, Any]:
    """
    Predict next attack outcomes from attack history records.
    Uses the latest record as the predictor row.
    """
    if not records:
        raise ValueError("records must contain at least one attack.")

    latest = pd.DataFrame([records[-1]])
    X = _transform_feature_frame(latest, bundle["feature_artifacts"])

    out: dict[str, Any] = {
        "based_on_records": len(records),
        "next_attack": {
            "type": {},
            "regression": {},
            "symptoms": {},
        },
    }

    type_model = bundle["model_type"]
    model_type_label = str(type_model.predict(X)[0])
    proba_dict: dict[str, float] = {}
    if hasattr(type_model, "predict_proba"):
        proba = type_model.predict_proba(X)[0]
        proba_dict = {
            str(type_model.classes_[i]): float(proba[i]) for i in range(len(type_model.classes_))
        }
        out["next_attack"]["type"]["probabilities"] = proba_dict

    display_label, type_meta = _apply_type_fallback(model_type_label, proba_dict, records)
    out["next_attack"]["type"]["label"] = display_label
    out["next_attack"]["type"]["model_label"] = model_type_label
    out["next_attack"]["type"]["low_confidence"] = type_meta.get("low_confidence", False)
    out["next_attack"]["type"]["history_fallback"] = type_meta.get("history_fallback", False)
    if "confidence" in type_meta:
        out["next_attack"]["type"]["confidence"] = type_meta["confidence"]
    if proba_dict:
        out["next_attack"]["type"]["top_k"] = _top_k_types(proba_dict, 3)

    for col, model in bundle.get("models_reg", {}).items():
        raw = float(model.predict(X)[0])
        if col == "Duration":
            pred = _adjust_duration_hours(records, raw)
        elif col == "Frequency":
            pred = int(_adjust_frequency_per_month(records, raw)) if len(records) > 1 else 0
        elif col == "Intensity":
            pred = _adjust_intensity_from_history(records, raw)
        else:
            pred = max(0.0, raw)
        out["next_attack"]["regression"][col] = pred

    for col, model in bundle.get("models_bin", {}).items():
        label = int(model.predict(X)[0])
        symptom_obj: dict[str, Any] = {"value": label}
        if hasattr(model, "predict_proba"):
            proba_row = model.predict_proba(X)[0]
            prob = float(proba_row[1]) if proba_row.shape[0] > 1 else float(label)
            symptom_obj["probability"] = prob
        out["next_attack"]["symptoms"][col] = symptom_obj

    return out
