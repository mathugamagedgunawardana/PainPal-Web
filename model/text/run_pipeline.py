#!/usr/bin/env python3
"""
Full classification pipeline: Steps 0–9.

Data stages (default single-CSV flow):
  Step 0:   prepare_pipeline_csv — normalize raw legacy CSV to pipeline format
  Step 0.5: generate_synthetic_migraine_data — profile-based practical augmentation
  Steps 1–9: load → feature prep → split → train → evaluate → save

Supports:
  - Single CSV: migraine_data.csv / migraine_data_synthetic.csv
  - Data folder: all patient_*_migraine_attacks.csv combined (train on each person's attack data).
"""

import os
import sys
import glob
import json
from pathlib import Path
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score, precision_recall_fscore_support
from sklearn.impute import SimpleImputer
from sklearn.utils.class_weight import compute_class_weight

from save_model import save_artifacts
from feature_engineering import apply_engineered_features
from data_loader import (
    load_data_from_data_folder,
    load_data_from_labeled_folder,
    load_data_single,
    ID_COLS,
)

# Config
_TEXT_DIR = Path(__file__).resolve().parent
_TEXT_DATA_DIR = _TEXT_DIR.parent / "text_data"
if str(_TEXT_DATA_DIR) not in sys.path:
    sys.path.insert(0, str(_TEXT_DATA_DIR))

from prepare_pipeline_csv import convert_migraine_data  # noqa: E402
from generate_synthetic_migraine_data import build_training_dataset  # noqa: E402

DEFAULT_RAW_DATA_PATH = str(_TEXT_DATA_DIR / "traning_data" / "migraine_data.csv")
PREPARED_DATA_PATH = "migraine_data_prepared.csv"
TRAINING_DATA_PATH = "migraine_data_training.csv"
DATA_PATH = "migraine_data_training.csv"
# Profile-based augmentation: target rows per migraine subtype in training set
AUGMENT_PER_CLASS = 400
WEAK_CLASS_EXTRA_ROWS = 250
WEAK_CLASS_REAL_THRESHOLD = 50
WEAK_RECALL_CLASSES = {
    "Migraine_without_aura",
    "Brainstem_aura_migraine",
    "Probable_migraine",
}
AUGMENT_BOOST_CLASSES = WEAK_RECALL_CLASSES | {"Typical_aura_migraine", "Hemiplegic_migraine"}
WEAK_CLASS_WEIGHT_MULTIPLIER = 2.2
DEPLOY_MIN_ACCURACY = 0.75
DEPLOY_MIN_MACRO_F1 = 0.75
DEPLOY_MIN_CLASS_RECALL = 0.65
METRICS_EXPORT_PATH = os.path.join("artifacts", "model_metrics.json")
DATA_DIR = "Data"  # folder with patient_*_migraine_attacks.csv
LABELED_DIR = os.path.join("Data", "traningData_labeled")
CATEGORICAL_COLS = ["Location", "Character", "DPF"]
TARGET = "Type"
ONE_HOT_TARGET_COLS = [
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
LEGACY_ONE_HOT_TARGET_COLS = [
    "Migraine without aura",
    "Basilar-type aura",
    "Typical aura with migraine",
]
RANDOM_STATE = 42
TEST_SIZE = 0.2
# When using Data folder: split by patient so test set = unseen patients
STRATIFY_BY_PATIENT = True
# Use GPU for XGBoost if available (set to "cpu" to force CPU)
USE_GPU = True
SYMPTOMS_PATH = "sysmptoms.txt"
ANALYTICS_EXPORT_PATH = os.path.normpath(
    os.path.join("..", "..", "client", "public", "model", "patient_analytics_prediction.json")
)

TYPE_CANONICAL_MAP = {
    "Migraine_without_aura": "Migraine_without_aura",
    "Typical_aura_migraine": "Typical_aura_migraine",
    "Brainstem_aura_migraine": "Brainstem_aura_migraine",
    "Hemiplegic_migraine": "Hemiplegic_migraine",
    "Retinal_migraine": "Retinal_migraine",
    "Chronic_migraine": "Chronic_migraine",
    "Menstrual_migraine": "Menstrual_migraine",
    "Vestibular_migraine": "Vestibular_migraine",
    "Status_migrainosus": "Status_migrainosus",
    "Probable_migraine": "Probable_migraine",
    "Migraine without aura": "Migraine_without_aura",
    "Typical aura with migraine": "Typical_aura_migraine",
    "Typical aura without migraine": "Typical_aura_migraine",
    "Basilar-type aura": "Brainstem_aura_migraine",
    "Familial hemiplegic migraine": "Hemiplegic_migraine",
    "Sporadic hemiplegic migraine": "Hemiplegic_migraine",
    "Other": "Probable_migraine",
}

TYPE_DISPLAY_MAP = {
    "Migraine_without_aura": "Migraine without aura",
    "Typical_aura_migraine": "Migraine with aura",
    "Brainstem_aura_migraine": "Migraine with brainstem aura",
    "Hemiplegic_migraine": "Hemiplegic migraine",
    "Retinal_migraine": "Retinal migraine",
    "Chronic_migraine": "Chronic migraine",
    "Menstrual_migraine": "Menstrual migraine",
    "Vestibular_migraine": "Vestibular migraine",
    "Status_migrainosus": "Status migrainosus",
    "Probable_migraine": "Probable migraine",
}


def _xgb_device():
    """Return 'cuda' for GPU, else 'cpu'. Set USE_GPU=False to force CPU."""
    return "cuda" if USE_GPU else "cpu"


def _safe_pct(value) -> float:
    if isinstance(value, str):
        value = value.strip().replace("%", "")
    try:
        return float(value)
    except Exception:
        return 0.0


def _safe_float(value, default: float = 0.0) -> float:
    try:
        if pd.isna(value):
            return default
        return float(value)
    except Exception:
        return default


def _load_symptom_profiles(path: str) -> dict:
    """Parse sysmptoms.txt markdown table into canonical profile dict."""
    if not os.path.isfile(path):
        raise FileNotFoundError(f"Symptoms file not found: {path}")

    lines = [ln.strip() for ln in open(path, "r", encoding="utf-8").read().splitlines() if ln.strip()]
    table_lines = [ln for ln in lines if "|" in ln and not ln.startswith("---")]
    if len(table_lines) < 2:
        raise ValueError(f"Invalid symptoms table format in {path}")

    headers = [h.strip() for h in table_lines[0].split("|") if h.strip()]
    profiles = {}
    for ln in table_lines[1:]:
        parts = [p.strip() for p in ln.split("|") if p.strip()]
        if len(parts) != len(headers):
            continue
        row = dict(zip(headers, parts))
        migraine_type = row.pop("Migraine Type", "").strip()
        explanation = row.pop("Explanation", "").strip()
        symptom_weights = {k: _safe_pct(v) for k, v in row.items()}
        profiles[migraine_type] = {"explanation": explanation, "symptoms": symptom_weights}
    return profiles


def _extract_patient_signal(sample_row: pd.Series) -> dict:
    """Map dataset columns to symptom signal strengths (0..100)."""
    duration = _safe_float(sample_row.get("Duration", 0))
    duration_over_72h = duration >= 3 or duration >= 72
    weakness = max(
        _safe_float(sample_row.get("Paresthesia", 0)),
        _safe_float(sample_row.get("Ataxia", 0)),
        _safe_float(sample_row.get("Conscience", 0)),
    )
    return {
        "Throb": 100.0 if _safe_float(sample_row.get("Character", 0)) == 1 else 40.0,
        "Nausea": _safe_float(sample_row.get("Nausea", 0)) * 100.0,
        "Photo": _safe_float(sample_row.get("Photophobia", 0)) * 100.0,
        "Phono": _safe_float(sample_row.get("Phonophobia", 0)) * 100.0,
        "VisualAura": min(100.0, _safe_float(sample_row.get("Visual", 0)) * 50.0),
        "SensoryAura": min(100.0, _safe_float(sample_row.get("Sensory", 0)) * 50.0),
        "Speech": min(100.0, _safe_float(sample_row.get("Dysphasia", 0)) * 100.0),
        "Weakness": min(100.0, weakness * 100.0),
        "Vertigo": _safe_float(sample_row.get("Vertigo", 0)) * 100.0,
        "Tinnitus": _safe_float(sample_row.get("Tinnitus", 0)) * 100.0,
        "MonoVisionLoss": _safe_float(sample_row.get("Defect", 0)) * 100.0,
        ">72h": 100.0 if duration_over_72h else 0.0,
        "Hormonal": _safe_float(sample_row.get("DPF", 0)) * 100.0,
    }


def _add_symptom_profile_features(X: pd.DataFrame) -> pd.DataFrame:
    """Add clinical similarity scores from sysmptoms.txt as model features."""
    if not os.path.isfile(SYMPTOMS_PATH):
        return X

    profiles = _load_symptom_profiles(SYMPTOMS_PATH)
    out = X.copy()
    score_rows = []
    for _, row in out.iterrows():
        signal = _extract_patient_signal(row)
        scores = {}
        for migraine_type, profile in profiles.items():
            symptoms = profile["symptoms"]
            if not symptoms:
                score = 0.0
            else:
                matches = [
                    1.0 - abs(signal.get(name, 0.0) - expected) / 100.0
                    for name, expected in symptoms.items()
                ]
                score = float(np.clip(np.mean(matches), 0.0, 1.0))
            scores[f"profile_score_{migraine_type}"] = score
        score_rows.append(scores)

    score_df = pd.DataFrame(score_rows, index=out.index)
    return pd.concat([out, score_df], axis=1)


def _impact_from_symptoms(symptoms: dict, patient_signal: dict) -> dict:
    """Build chart-ready impact categories expected by frontend."""
    def weighted(names):
        vals = [symptoms.get(n, 0.0) * (0.65 + 0.35 * (patient_signal.get(n, 0.0) / 100.0)) for n in names]
        return float(np.mean(vals)) if vals else 0.0

    pain = weighted(["Throb", "Nausea", "Photo", "Phono"])
    aura = weighted(["VisualAura", "SensoryAura", "Speech"])
    neuro = weighted(["Speech", "Weakness", "Vertigo", "Tinnitus"])
    vestibular = weighted(["Vertigo", "Tinnitus"])
    vision = weighted(["VisualAura", "MonoVisionLoss", "Photo"])
    hormonal = weighted(["Hormonal"])
    duration_signal = 100.0 if patient_signal.get(">72h", 0.0) >= 100 else min(100.0, patient_signal.get(">72h", 0.0) + 40.0)
    frequency = float(np.clip((symptoms.get(">72h", 0.0) * 0.35) + duration_signal * 0.65, 0, 100))

    return {
        "pain": round(np.clip(pain, 0, 100), 1),
        "aura": round(np.clip(aura, 0, 100), 1),
        "neuro": round(np.clip(neuro, 0, 100), 1),
        "frequency": round(np.clip(frequency, 0, 100), 1),
        "hormonal": round(np.clip(hormonal, 0, 100), 1),
        "vestibular": round(np.clip(vestibular, 0, 100), 1),
        "vision": round(np.clip(vision, 0, 100), 1),
    }


def _export_patient_analytics_json(
    model,
    X_test,
    y_encoder,
    df_raw: pd.DataFrame,
    test_idx: np.ndarray,
    model_class_ids: np.ndarray | None = None,
):
    """Export model+symptom-based analytics payload for frontend charts."""
    if X_test.shape[0] == 0:
        print("  Skipping analytics export: empty test set")
        return

    symptom_profiles = _load_symptom_profiles(SYMPTOMS_PATH)
    canonical_types = list(symptom_profiles.keys())

    proba = model.predict_proba(X_test)
    confidence = proba.max(axis=1)
    best_i = int(np.argmax(confidence))
    best_row_index = int(X_test.index[best_i])
    sample_row = df_raw.loc[best_row_index]
    patient_signal = _extract_patient_signal(sample_row)

    class_probs = {}
    class_ids = (
        np.array(model_class_ids, dtype=int)
        if model_class_ids is not None
        else np.arange(len(y_encoder.classes_), dtype=int)
    )
    for local_idx, original_class_idx in enumerate(class_ids):
        class_name = y_encoder.classes_[int(original_class_idx)]
        canonical = TYPE_CANONICAL_MAP.get(str(class_name), str(class_name))
        class_probs[canonical] = class_probs.get(canonical, 0.0) + float(proba[best_i, local_idx])

    # Normalize model probabilities over known mapped classes
    model_total = sum(class_probs.values()) or 1.0
    class_probs = {k: v / model_total for k, v in class_probs.items()}

    # Build symptom-similarity score for all canonical classes so classes not
    # represented in training still receive clinically plausible non-zero mass.
    similarity_raw = {}
    for canonical in canonical_types:
        symptoms = symptom_profiles[canonical]["symptoms"]
        keys = list(symptoms.keys())
        if not keys:
            similarity_raw[canonical] = 0.0
            continue
        score = float(
            np.mean(
                [
                    (symptoms.get(k, 0.0) / 100.0)
                    * (0.45 + 0.55 * (patient_signal.get(k, 0.0) / 100.0))
                    for k in keys
                ]
            )
        )
        similarity_raw[canonical] = max(0.0, score)
    sim_total = sum(similarity_raw.values()) or 1.0
    similarity_probs = {k: v / sim_total for k, v in similarity_raw.items()}

    # Blend model prediction and similarity score (real-world friendly fallback)
    blended = {}
    for canonical in canonical_types:
        model_part = class_probs.get(canonical, 0.0)
        sim_part = similarity_probs.get(canonical, 0.0)
        blended[canonical] = 0.75 * model_part + 0.25 * sim_part
    blend_total = sum(blended.values()) or 1.0
    class_probs = {k: v / blend_total for k, v in blended.items()}

    predictions = []
    for canonical in canonical_types:
        profile = symptom_profiles[canonical]
        symptoms = profile["symptoms"]
        impact = _impact_from_symptoms(symptoms, patient_signal)

        # symptom-level effect (symptom template x patient signal x probability)
        symptom_effects = {
            k: (symptoms.get(k, 0.0) / 100.0)
            * (0.4 + 0.6 * (patient_signal.get(k, 0.0) / 100.0))
            * class_probs.get(canonical, 0.0)
            for k in symptoms.keys()
        }
        top_symptoms = [k for k, _ in sorted(symptom_effects.items(), key=lambda kv: kv[1], reverse=True)[:3]]

        predictions.append(
            {
                "type": TYPE_DISPLAY_MAP.get(canonical, canonical.replace("_", " ")),
                "probability": round(class_probs.get(canonical, 0.0) * 100.0, 1),
                "summary": profile["explanation"],
                "keySymptoms": top_symptoms,
                "impact": impact,
            }
        )

    predictions.sort(key=lambda x: x["probability"], reverse=True)
    top_pred = predictions[0]

    os.makedirs(os.path.dirname(ANALYTICS_EXPORT_PATH), exist_ok=True)
    payload = {
        "generatedAt": pd.Timestamp.utcnow().isoformat(),
        "source": "run_pipeline.py + sysmptoms.txt",
        "selectedSampleIndex": best_row_index,
        "predictedType": top_pred["type"],
        "confidence": top_pred["probability"],
        "summary": top_pred["summary"],
        "keySymptoms": top_pred["keySymptoms"],
        "predictions": predictions,
    }
    with open(ANALYTICS_EXPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"  Exported analytics JSON -> {ANALYTICS_EXPORT_PATH}")


def step0_prepare_pipeline_csv(raw_path: str, output_path: str) -> str:
    """Step 0: Convert raw/legacy migraine CSV into pipeline-ready format."""
    print("\n" + "=" * 60)
    print("Step 0: Prepare pipeline CSV (prepare_pipeline_csv)")
    print("=" * 60)
    if not os.path.isfile(raw_path):
        raise FileNotFoundError(f"Raw data file not found: {raw_path}")
    df = pd.read_csv(raw_path)
    converted = convert_migraine_data(df)
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    converted.to_csv(output_path, index=False)
    print(f"  Rows: {len(converted)}, columns: {len(converted.columns)}")
    print(f"  Wrote prepared CSV -> {output_path}")
    return output_path


def step0_generate_practical_data(
    input_path: str,
    output_path: str,
    per_class: int = AUGMENT_PER_CLASS,
    seed: int = RANDOM_STATE,
) -> str:
    """Step 0.5: Combine real rows with profile-based synthetic migraine data."""
    print("\n" + "=" * 60)
    print("Step 0.5: Practical data generation (generate_synthetic_migraine_data)")
    print("=" * 60)
    if not os.path.isfile(input_path):
        raise FileNotFoundError(f"Training source CSV not found: {input_path}")

    converted = build_training_dataset(
        Path(input_path),
        Path(output_path),
        per_class=per_class,
        weak_class_extra=WEAK_CLASS_EXTRA_ROWS,
        weak_class_real_threshold=WEAK_CLASS_REAL_THRESHOLD,
        seed=seed,
        pipeline_ready=True,
    )
    print(f"  Wrote training CSV -> {output_path}")
    print(f"  Rows: {len(converted)}, columns: {len(converted.columns)}")
    return output_path


def _run_data_stages(
    raw_path: str | None = None,
    *,
    prepare_data: bool = False,
    augment_data: bool = True,
    per_class: int = AUGMENT_PER_CLASS,
) -> str:
    """Run Step 0 and/or Step 0.5; return the CSV path to use for training."""
    raw = raw_path or DEFAULT_RAW_DATA_PATH

    if augment_data:
        return step0_generate_practical_data(raw, TRAINING_DATA_PATH, per_class=per_class)

    if prepare_data:
        return step0_prepare_pipeline_csv(raw, PREPARED_DATA_PATH)

    return raw


def step1_load_data(path=None, data_dir=None):
    """Step 1: Load the dataset from a single CSV or from Data folder (all patient attack files)."""
    print("\n" + "=" * 60)
    print("Step 1: Load data")
    print("=" * 60)
    if data_dir and os.path.isdir(data_dir):
        patient_paths = glob.glob(os.path.join(data_dir, "patient*migraine*.csv"))
        if not patient_paths:
            patient_paths = glob.glob(os.path.join(data_dir, "patient_*.csv"))

        if patient_paths:
            df = load_data_from_data_folder(data_dir)
            print(f"  Loaded {len(df)} rows from {data_dir} (all patient attack CSVs combined)")
        else:
            df = load_data_from_labeled_folder(data_dir)
            print(f"  Loaded {len(df)} rows from {data_dir} (labeled migraine folders)")
    else:
        path = path or DATA_PATH
        df = load_data_single(path) if path and os.path.isfile(path) else pd.read_csv(path)
        print(f"  Loaded {path}: shape {df.shape}")
    print(f"  Shape: {df.shape}")
    return df


def _resolve_target_spec(df: pd.DataFrame) -> tuple[str | None, list[str]]:
    one_hot_target_cols = [c for c in ONE_HOT_TARGET_COLS if c in df.columns]
    legacy_one_hot_target_cols = [c for c in LEGACY_ONE_HOT_TARGET_COLS if c in df.columns]
    if len(one_hot_target_cols) >= 2:
        return None, one_hot_target_cols
    if len(legacy_one_hot_target_cols) >= 2:
        return None, legacy_one_hot_target_cols
    if "MigraineType" in df.columns:
        return "MigraineType", []
    if TARGET in df.columns:
        return TARGET, []
    raise ValueError(
        "No target column found. Expected one-hot columns "
        f"{ONE_HOT_TARGET_COLS}, or 'MigraineType', or 'Type'."
    )


def _extract_features_and_target(
    df: pd.DataFrame,
    target_col: str | None,
    one_hot_target_cols: list[str] | None = None,
) -> tuple[pd.DataFrame, pd.Series]:
    using_one_hot_targets = bool(one_hot_target_cols)
    if using_one_hot_targets:
        one_hot_df = df[one_hot_target_cols].copy()
        one_hot_df = one_hot_df.apply(pd.to_numeric, errors="coerce").fillna(0)
        no_positive = one_hot_df.sum(axis=1) <= 0
        if no_positive.any():
            one_hot_df.loc[no_positive, one_hot_target_cols[0]] = 1
        y_series = one_hot_df.idxmax(axis=1).astype(str)
        drop_cols = list(one_hot_target_cols)
    else:
        y_series = df[target_col].astype(str)
        drop_cols = [target_col]

    known_target_cols = set(ONE_HOT_TARGET_COLS) | set(LEGACY_ONE_HOT_TARGET_COLS) | {TARGET, "MigraineType"}
    drop_cols.extend([c for c in known_target_cols if c in df.columns])
    for c in ID_COLS:
        if c in df.columns:
            drop_cols.append(c)

    X = df.drop(columns=[c for c in drop_cols if c in df.columns]).copy()
    X = apply_engineered_features(X, symptoms_path=SYMPTOMS_PATH)
    return X, y_series


def _fit_feature_frame(X: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    detected_cat_cols = X.select_dtypes(include=["object", "category"]).columns.tolist()
    explicit_cat_cols = [c for c in CATEGORICAL_COLS if c in X.columns and c not in numeric_cols]
    categorical_cols = list({*detected_cat_cols, *explicit_cat_cols})

    X_out = X.copy()
    num_imputer = None
    if numeric_cols:
        num_imputer = SimpleImputer(strategy="median")
        X_out[numeric_cols] = num_imputer.fit_transform(X_out[numeric_cols])

    cat_imputer = None
    if categorical_cols:
        cat_imputer = SimpleImputer(strategy="constant", fill_value="missing")
        X_out[categorical_cols] = cat_imputer.fit_transform(X_out[categorical_cols])
        X_out[categorical_cols] = X_out[categorical_cols].astype(str)
        X_out = pd.get_dummies(X_out, columns=categorical_cols, dummy_na=True)

    artifacts = {
        "numeric_cols": numeric_cols,
        "categorical_cols": categorical_cols,
        "num_imputer": num_imputer,
        "cat_imputer": cat_imputer,
        "feature_names": X_out.columns.tolist(),
    }
    return X_out, artifacts


def _transform_feature_frame(X: pd.DataFrame, artifacts: dict) -> pd.DataFrame:
    X_out = X.copy()
    numeric_cols = [c for c in artifacts["numeric_cols"] if c in X_out.columns]
    categorical_cols = [c for c in artifacts["categorical_cols"] if c in X_out.columns]

    if numeric_cols and artifacts["num_imputer"] is not None:
        X_out[numeric_cols] = artifacts["num_imputer"].transform(X_out[numeric_cols])

    if categorical_cols and artifacts["cat_imputer"] is not None:
        X_out[categorical_cols] = artifacts["cat_imputer"].transform(X_out[categorical_cols])
        X_out[categorical_cols] = X_out[categorical_cols].astype(str)
        X_out = pd.get_dummies(X_out, columns=categorical_cols, dummy_na=True)

    return X_out.reindex(columns=artifacts["feature_names"], fill_value=0)


def step2_prepare_features_and_target(df, target_col, one_hot_target_cols=None):
    """Steps 2–4: Define target, engineer features, impute, one-hot encode, encode target."""
    print("\n" + "=" * 60)
    print("Steps 2–4: Prepare features and target")
    print("=" * 60)
    X_raw, y_series = _extract_features_and_target(df, target_col, one_hot_target_cols)
    X, artifacts = _fit_feature_frame(X_raw)
    y_encoder = LabelEncoder()
    y = y_encoder.fit_transform(y_series)
    print(f"  Features shape: {X.shape}, target shape: {y.shape}")
    return X, y, y_encoder, artifacts["num_imputer"], artifacts["cat_imputer"]


def step2_prepare_explicit_train_test(
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame, np.ndarray, np.ndarray, LabelEncoder, SimpleImputer | None, SimpleImputer | None]:
    """Prepare train/test CSVs without fitting feature preprocessing on test data."""
    print("\n" + "=" * 60)
    print("Steps 2–4: Prepare explicit train/test data")
    print("=" * 60)

    train_target_col, train_one_hot_cols = _resolve_target_spec(train_df)
    test_target_col, test_one_hot_cols = _resolve_target_spec(test_df)
    X_train_raw, y_train_series = _extract_features_and_target(train_df, train_target_col, train_one_hot_cols)
    X_test_raw, y_test_series = _extract_features_and_target(test_df, test_target_col, test_one_hot_cols)

    X_train, artifacts = _fit_feature_frame(X_train_raw)
    X_test = _transform_feature_frame(X_test_raw, artifacts)

    y_encoder = LabelEncoder()
    y_encoder.fit(pd.concat([y_train_series, y_test_series], ignore_index=True).astype(str))
    y_train = y_encoder.transform(y_train_series.astype(str))
    y_test = y_encoder.transform(y_test_series.astype(str))

    print(f"  Train features: {X_train.shape}, target: {y_train.shape}")
    print(f"  Test features: {X_test.shape}, target: {y_test.shape}")
    train_classes = sorted(set(y_train_series.astype(str)))
    unseen_test_classes = sorted(set(y_test_series.astype(str)) - set(train_classes))
    if unseen_test_classes:
        print("  Warning: test contains classes not present in training:")
        print(f"    {unseen_test_classes}")
    return (
        X_train,
        X_test,
        y_train,
        y_test,
        y_encoder,
        artifacts["num_imputer"],
        artifacts["cat_imputer"],
    )


def step5_split(X, y, df=None, stratify_by_patient=False):
    """
    Step 5: Train/test split.
    If stratify_by_patient and df has patient_id, split by unique patients so
    all attacks of a patient are either in train or test (evaluate on unseen patients).
    """
    print("\n" + "=" * 60)
    print("Step 5: Train/test split")
    print("=" * 60)
    if stratify_by_patient and df is not None and "patient_id" in df.columns:
        patients = df["patient_id"].unique()
        n_test = max(1, int(len(patients) * TEST_SIZE))
        rng = np.random.default_rng(RANDOM_STATE)
        rng.shuffle(patients)
        test_patients = set(patients[:n_test])
        train_idx = np.where(~df["patient_id"].isin(test_patients))[0]
        test_idx = np.where(df["patient_id"].isin(test_patients))[0]
        X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
        y_train, y_test = y[train_idx], y[test_idx]
        print(f"  Split by patient: {len(patients) - n_test} train patients, {n_test} test patients")
    else:
        unique, counts = np.unique(y, return_counts=True)
        min_count = int(counts.min()) if len(counts) else 0
        use_stratify = min_count >= 2
        if not use_stratify:
            print(
                "  Warning: Some classes have fewer than 2 samples; "
                "falling back to non-stratified split."
            )
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=TEST_SIZE,
            random_state=RANDOM_STATE,
            stratify=y if use_stratify else None,
        )
        train_idx = np.array(X_train.index)
        test_idx = np.array(X_test.index)
    print(f"  Train: {X_train.shape[0]} rows, Test: {X_test.shape[0]} rows")
    return X_train, X_test, y_train, y_test, train_idx, test_idx


def step6_train(X_train, y_train, X_test, y_test, y_encoder):
    """Step 6: Train XGBoost."""
    print("\n" + "=" * 60)
    print("Step 6: Train XGBoost")
    print("=" * 60)
    train_class_ids = np.unique(y_train)
    class_to_local = {int(c): i for i, c in enumerate(train_class_ids)}
    y_train_local = np.array([class_to_local[int(c)] for c in y_train], dtype=int)
    y_test_local = np.array([class_to_local.get(int(c), -1) for c in y_test], dtype=int)

    class_weights = compute_class_weight(
        class_weight="balanced",
        classes=np.unique(y_train_local),
        y=y_train_local,
    )
    weight_map = dict(zip(np.unique(y_train_local), class_weights))
    for local_idx, original_class_id in enumerate(train_class_ids):
        class_name = str(y_encoder.classes_[int(original_class_id)])
        multiplier = WEAK_CLASS_WEIGHT_MULTIPLIER
        if class_name == "Migraine_without_aura":
            multiplier = 2.6
        if class_name in WEAK_RECALL_CLASSES or class_name == "Typical_aura_migraine":
            weight_map[int(local_idx)] = weight_map.get(int(local_idx), 1.0) * multiplier
    sample_weight = np.array([weight_map[class_to_local[int(c)]] for c in y_train], dtype=float)

    device = _xgb_device()
    print(f"  GPU: {'Yes' if device == 'cuda' else 'No'}  (XGBoost device={device})")
    model = xgb.XGBClassifier(
        objective="multi:softprob",
        num_class=len(train_class_ids),
        eval_metric="mlogloss",
        use_label_encoder=False,
        random_state=RANDOM_STATE,
        n_estimators=900,
        max_depth=3,
        learning_rate=0.04,
        subsample=0.9,
        colsample_bytree=0.9,
        min_child_weight=1,
        reg_lambda=2.0,
        verbosity=0,
        tree_method="hist",
        device=device,
    )
    eval_mask = y_test_local >= 0
    eval_set = [(X_test.iloc[eval_mask], y_test_local[eval_mask])] if eval_mask.any() else None
    model.fit(X_train, y_train_local, sample_weight=sample_weight, eval_set=eval_set, verbose=False)
    print("  Model training completed.")
    return model, train_class_ids


def step7_8_evaluate(model, X_train, X_test, y_train, y_test, y_encoder, model_class_ids):
    """Steps 7–8: Predict and evaluate."""
    print("\n" + "=" * 60)
    print("Steps 7–8: Predict and evaluate")
    print("=" * 60)
    y_pred_test_local = model.predict(X_test).astype(int)
    y_pred_test = np.array([int(model_class_ids[i]) for i in y_pred_test_local], dtype=int)
    test_acc = accuracy_score(y_test, y_pred_test)
    print(f"  Test accuracy: {test_acc:.4f}")

    all_labels = sorted(set(np.unique(y_test).tolist()) | set(np.unique(y_pred_test).tolist()))
    target_names = [y_encoder.classes_[i] for i in all_labels]
    print(
        "\n  Classification report:\n",
        classification_report(
            y_test,
            y_pred_test,
            labels=all_labels,
            target_names=target_names,
            zero_division=0,
        ),
    )
    print("  Confusion matrix:\n", confusion_matrix(y_test, y_pred_test, labels=all_labels))

    precision, recall, f1, support = precision_recall_fscore_support(
        y_test,
        y_pred_test,
        labels=all_labels,
        zero_division=0,
    )
    macro_f1 = float(f1_score(y_test, y_pred_test, labels=all_labels, average="macro", zero_division=0))
    per_class = {
        str(target_names[i]): {
            "precision": float(precision[i]),
            "recall": float(recall[i]),
            "f1": float(f1[i]),
            "support": int(support[i]),
        }
        for i in range(len(all_labels))
    }
    weak_recalls = {
        name: per_class[name]["recall"]
        for name in per_class
        if name in WEAK_RECALL_CLASSES
    }
    min_weak_recall = min(weak_recalls.values()) if weak_recalls else 0.0
    min_recall = min((v["recall"] for v in per_class.values()), default=0.0)

    checks = {
        "accuracy": {"value": test_acc, "threshold": DEPLOY_MIN_ACCURACY, "pass": test_acc >= DEPLOY_MIN_ACCURACY},
        "macro_f1": {"value": macro_f1, "threshold": DEPLOY_MIN_MACRO_F1, "pass": macro_f1 >= DEPLOY_MIN_MACRO_F1},
        "min_class_recall": {
            "value": min_recall,
            "threshold": DEPLOY_MIN_CLASS_RECALL,
            "pass": min_recall >= DEPLOY_MIN_CLASS_RECALL,
        },
        "weak_class_recall": {
            "value": min_weak_recall,
            "threshold": DEPLOY_MIN_CLASS_RECALL,
            "pass": min_weak_recall >= DEPLOY_MIN_CLASS_RECALL,
            "by_class": weak_recalls,
        },
        "artifacts_saved": {
            "model": False,
            "label_encoder": False,
            "feature_columns": False,
            "num_imputer": False,
            "model_class_ids": False,
        },
    }
    deployment_ready = all(
        checks[key]["pass"]
        for key in ("accuracy", "macro_f1", "min_class_recall", "weak_class_recall")
    )

    metrics = {
        "accuracy": test_acc,
        "macro_f1": macro_f1,
        "min_class_recall": min_recall,
        "min_weak_class_recall": min_weak_recall,
        "per_class": per_class,
        "weak_class_recall": weak_recalls,
        "deployment_ready": deployment_ready,
        "checks": checks,
    }
    os.makedirs(os.path.dirname(METRICS_EXPORT_PATH) or ".", exist_ok=True)
    with open(METRICS_EXPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print(f"  Exported metrics JSON -> {METRICS_EXPORT_PATH}")
    print(f"  Deployment ready: {'yes' if deployment_ready else 'no'}")
    if not deployment_ready:
        print("  Deployment blockers:")
        for name, check in checks.items():
            if name == "artifacts_saved":
                missing = [k for k, ok in check.items() if not ok]
                if missing:
                    print(f"    - missing artifacts: {missing}")
            elif not check.get("pass", False):
                print(f"    - {name}: {check.get('value', 0):.4f} < {check.get('threshold', 0):.4f}")
    return metrics


def step9_save(model, target_encoder, feature_names, num_imputer=None, cat_imputer=None, model_class_ids=None):
    """Step 9: Save model and encoders."""
    print("\n" + "=" * 60)
    print("Step 9: Save model and encoders")
    print("=" * 60)
    save_artifacts(
        model=model,
        target_encoder=target_encoder,
        feature_encoders=None,
        feature_names=feature_names,
        num_imputer=num_imputer,
        cat_imputer=cat_imputer,
        model_class_ids=model_class_ids,
    )


def step10_finalize_deployment(metrics: dict) -> dict:
    """Mark deployment readiness after artifacts are written."""
    print("\n" + "=" * 60)
    print("Step 10: Deployment validation")
    print("=" * 60)
    artifact_checks = {
        "model": os.path.isfile("xgboost_patient_model.pkl"),
        "label_encoder": os.path.isfile("label_encoder.pkl"),
        "feature_columns": os.path.isfile(os.path.join("artifacts", "feature_columns.joblib")),
        "num_imputer": os.path.isfile(os.path.join("artifacts", "num_imputer.joblib")),
        "model_class_ids": os.path.isfile(os.path.join("artifacts", "model_class_ids.joblib")),
        "metrics_json": os.path.isfile(METRICS_EXPORT_PATH),
    }
    metrics["checks"]["artifacts_saved"] = artifact_checks
    metrics["deployment_ready"] = (
        metrics.get("deployment_ready", False) and all(artifact_checks.values())
    )
    with open(METRICS_EXPORT_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print(f"  Artifacts: {sum(artifact_checks.values())}/{len(artifact_checks)} present")
    print(f"  Deployment ready: {'yes' if metrics['deployment_ready'] else 'no'}")
    if not metrics["deployment_ready"]:
        print("  Remaining blockers:")
        for name, check in metrics["checks"].items():
            if name == "artifacts_saved":
                missing = [k for k, ok in check.items() if not ok]
                if missing:
                    print(f"    - missing artifacts: {missing}")
            elif isinstance(check, dict) and not check.get("pass", True):
                print(f"    - {name}: {check.get('value', 0):.4f} < {check.get('threshold', 0):.4f}")
    return metrics


def run_pipeline(
    data_path=None,
    data_dir=None,
    stratify_by_patient=STRATIFY_BY_PATIENT,
    *,
    train_data_path: str | None = None,
    test_data_path: str | None = None,
    prepare_data: bool | None = None,
    augment_data: bool | None = None,
    raw_data_path: str | None = None,
    per_class: int = AUGMENT_PER_CLASS,
):
    """
    Run the full pipeline (Steps 0–9 when using default single-CSV flow).

    Args:
        data_path: Single CSV path (e.g. migraine_data.csv). Ignored if data_dir is set.
        data_dir: Folder with patient_*_migraine_attacks.csv; all are loaded and combined.
        stratify_by_patient: If True and data from data_dir, split by patient (test = unseen patients).
        train_data_path: CSV used only for model fitting.
        test_data_path: CSV used only for evaluation.
        prepare_data: Run prepare_pipeline_csv on raw data (default False when augmenting).
        augment_data: Run profile-based augmentation (default True for default CSV flow).
        raw_data_path: Real labeled CSV for Steps 0–0.5 (default: text_data/traning_data/migraine_data.csv).
        per_class: Target rows per migraine subtype in the training dataset.
    """
    os.makedirs("artifacts", exist_ok=True)

    if train_data_path or test_data_path:
        if not train_data_path or not test_data_path:
            raise ValueError("Both train_data_path and test_data_path are required for explicit train/test mode.")
        print("\n" + "=" * 60)
        print("Explicit train/test mode")
        print("=" * 60)
        train_df = step1_load_data(path=train_data_path)
        test_df = step1_load_data(path=test_data_path)
        train_df = convert_migraine_data(train_df)
        test_df = convert_migraine_data(test_df)
        print("  Normalized train/test labels to canonical pipeline format.")
        X_train, X_test, y_train, y_test, y_encoder, num_imputer, cat_imputer = step2_prepare_explicit_train_test(
            train_df,
            test_df,
        )
        model, model_class_ids = step6_train(X_train, y_train, X_test, y_test, y_encoder)
        metrics = step7_8_evaluate(model, X_train, X_test, y_train, y_test, y_encoder, model_class_ids)
        step9_save(
            model,
            y_encoder,
            X_train.columns.tolist(),
            num_imputer=num_imputer,
            cat_imputer=cat_imputer,
            model_class_ids=model_class_ids,
        )
        step10_finalize_deployment(metrics)
        _export_patient_analytics_json(
            model,
            X_test,
            y_encoder,
            test_df.reset_index(drop=True),
            np.arange(len(test_df)),
            model_class_ids=model_class_ids,
        )
        print("\n" + "=" * 60)
        print("Pipeline finished. Use predictModel.py for inference.")
        print("=" * 60)
        return

    use_default_csv_flow = data_dir is None and data_path is None
    if prepare_data is None:
        prepare_data = False
    if augment_data is None:
        augment_data = use_default_csv_flow

    if use_default_csv_flow and (prepare_data or augment_data):
        data_path = _run_data_stages(
            raw_data_path,
            prepare_data=prepare_data,
            augment_data=augment_data,
            per_class=per_class,
        )
    elif data_dir is None and data_path is None:
        data_path = TRAINING_DATA_PATH if os.path.isfile(TRAINING_DATA_PATH) else DATA_PATH

    df = step1_load_data(path=data_path or DATA_PATH, data_dir=data_dir)

    one_hot_target_cols = [c for c in ONE_HOT_TARGET_COLS if c in df.columns]
    legacy_one_hot_target_cols = [c for c in LEGACY_ONE_HOT_TARGET_COLS if c in df.columns]
    if len(one_hot_target_cols) >= 2:
        target_col = None
    elif len(legacy_one_hot_target_cols) >= 2:
        one_hot_target_cols = legacy_one_hot_target_cols
        target_col = None
    elif "MigraineType" in df.columns:
        target_col = "MigraineType"
    elif TARGET in df.columns:
        target_col = TARGET
    else:
        raise ValueError(
            "No target column found. Expected one-hot columns "
            f"{ONE_HOT_TARGET_COLS}, or 'MigraineType', or 'Type'."
        )

    X, y, y_encoder, num_imputer, cat_imputer = step2_prepare_features_and_target(
        df,
        target_col=target_col,
        one_hot_target_cols=one_hot_target_cols if target_col is None else None,
    )
    X_train, X_test, y_train, y_test, _train_idx, test_idx = step5_split(
        X, y, df=df, stratify_by_patient=stratify_by_patient and "patient_id" in df.columns
    )
    model, model_class_ids = step6_train(X_train, y_train, X_test, y_test, y_encoder)
    metrics = step7_8_evaluate(model, X_train, X_test, y_train, y_test, y_encoder, model_class_ids)
    step9_save(
        model,
        y_encoder,
        X.columns.tolist(),
        num_imputer=num_imputer,
        cat_imputer=cat_imputer,
        model_class_ids=model_class_ids,
    )
    step10_finalize_deployment(metrics)
    _export_patient_analytics_json(model, X_test, y_encoder, df, test_idx, model_class_ids=model_class_ids)

    print("\n" + "=" * 60)
    print("Pipeline finished. Use predictModel.py for inference.")
    print("=" * 60)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Run migraine text classification pipeline (Steps 0–9)")
    parser.add_argument(
        "path",
        nargs="?",
        default=None,
        help="CSV file or Data folder (optional; default runs augment + train)",
    )
    parser.add_argument("--skip-prep", action="store_true", help="Skip Step 0 (prepare_pipeline_csv)")
    parser.add_argument("--skip-augment", action="store_true", help="Skip Step 0.5 (profile-based augmentation)")
    parser.add_argument("--raw-data", default=None, help="Real labeled CSV for Steps 0–0.5")
    parser.add_argument("--train-data", default=None, help="CSV to fit the model on")
    parser.add_argument("--test-data", default=None, help="CSV to evaluate the model on")
    parser.add_argument("--per-class", type=int, default=AUGMENT_PER_CLASS, help="Training rows per subtype")
    parser.add_argument("--no-stratify-patient", action="store_true", help="Disable patient-level split")
    args = parser.parse_args()

    pipeline_kwargs = {
        "prepare_data": not args.skip_prep and args.skip_augment,
        "augment_data": not args.skip_augment,
        "raw_data_path": args.raw_data,
        "per_class": args.per_class,
        "stratify_by_patient": not args.no_stratify_patient,
    }

    if args.train_data or args.test_data:
        run_pipeline(
            train_data_path=args.train_data,
            test_data_path=args.test_data,
            stratify_by_patient=pipeline_kwargs["stratify_by_patient"],
        )
    elif args.path:
        if os.path.isdir(args.path):
            run_pipeline(data_dir=args.path, prepare_data=False, augment_data=False, stratify_by_patient=pipeline_kwargs["stratify_by_patient"])
        elif os.path.isfile(args.path):
            run_pipeline(data_path=args.path, prepare_data=False, augment_data=False, stratify_by_patient=pipeline_kwargs["stratify_by_patient"])
        else:
            print(f"Path not found: {args.path!r}; using default data flow.")
            run_pipeline(**pipeline_kwargs)
    else:
        run_pipeline(**pipeline_kwargs)
