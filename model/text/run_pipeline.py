#!/usr/bin/env python3
"""
Full classification pipeline: Steps 1–9.
Runs load → prepare → split → train → predict → evaluate → save.
Supports:
  - Single CSV: migraine_data.csv
  - Data folder: all patient_*_migraine_attacks.csv combined (train on each person's attack data).
"""

import os
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

from save_model import save_artifacts
from data_loader import load_data_from_data_folder, load_data_single, ID_COLS

# Config
DATA_PATH = "migraine_data.csv"
DATA_DIR = "Data"  # folder with patient_*_migraine_attacks.csv
CATEGORICAL_COLS = ["Location", "Character", "DPF"]
TARGET = "Type"
RANDOM_STATE = 42
TEST_SIZE = 0.2
# When using Data folder: split by patient so test set = unseen patients
STRATIFY_BY_PATIENT = True


def step1_load_data(path=None, data_dir=None):
    """Step 1: Load the dataset from a single CSV or from Data folder (all patient attack files)."""
    print("\n" + "=" * 60)
    print("Step 1: Load data")
    print("=" * 60)
    if data_dir and os.path.isdir(data_dir):
        df = load_data_from_data_folder(data_dir)
        print(f"  Loaded {len(df)} rows from {data_dir} (all patient attack CSVs combined)")
    else:
        path = path or DATA_PATH
        df = load_data_single(path) if path and os.path.isfile(path) else pd.read_csv(path)
        print(f"  Loaded {path}: shape {df.shape}")
    print(f"  Shape: {df.shape}")
    return df


def step2_prepare_features_and_target(df):
    """Steps 2–4: Define target, encode categoricals, encode target. Drops ID columns from features."""
    print("\n" + "=" * 60)
    print("Steps 2–4: Prepare features and target")
    print("=" * 60)
    # Drop target and any ID columns (patient_id, attack_id) so they are not used as features
    drop_cols = [TARGET]
    for c in ID_COLS:
        if c in df.columns:
            drop_cols.append(c)
    X = df.drop(columns=[c for c in drop_cols if c in df.columns]).copy()
    y_series = df[TARGET].astype(str)

    label_encoders = {}
    for col in CATEGORICAL_COLS:
        if col in X.columns:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            label_encoders[col] = le

    y_encoder = LabelEncoder()
    y = y_encoder.fit_transform(y_series)
    print(f"  Features shape: {X.shape}, target shape: {y.shape}")
    return X, y, y_encoder, label_encoders


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
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
        )
    print(f"  Train: {X_train.shape[0]} rows, Test: {X_test.shape[0]} rows")
    return X_train, X_test, y_train, y_test


def step6_train(X_train, y_train, X_test, y_test, n_classes):
    """Step 6: Train XGBoost."""
    print("\n" + "=" * 60)
    print("Step 6: Train XGBoost")
    print("=" * 60)
    model = xgb.XGBClassifier(
        objective="multi:softmax",
        num_class=n_classes,
        eval_metric="mlogloss",
        use_label_encoder=False,
        random_state=RANDOM_STATE,
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        verbosity=0,
    )
    model.fit(
        X_train,
        y_train,
        eval_set=[(X_test, y_test)],
        verbose=False,
    )
    print("  Model training completed.")
    return model


def step7_8_evaluate(model, X_train, X_test, y_train, y_test, y_encoder):
    """Steps 7–8: Predict and evaluate."""
    print("\n" + "=" * 60)
    print("Steps 7–8: Predict and evaluate")
    print("=" * 60)
    y_pred_test = model.predict(X_test)
    test_acc = accuracy_score(y_test, y_pred_test)
    print(f"  Test accuracy: {test_acc:.4f}")
    print("\n  Classification report:\n", classification_report(y_test, y_pred_test, target_names=y_encoder.classes_))
    print("  Confusion matrix:\n", confusion_matrix(y_test, y_pred_test))
    return test_acc


def step9_save(model, target_encoder, feature_encoders, feature_names):
    """Step 9: Save model and encoders."""
    print("\n" + "=" * 60)
    print("Step 9: Save model and encoders")
    print("=" * 60)
    save_artifacts(
        model=model,
        target_encoder=target_encoder,
        feature_encoders=feature_encoders,
        feature_names=feature_names,
    )


def run_pipeline(data_path=None, data_dir=None, stratify_by_patient=STRATIFY_BY_PATIENT):
    """
    Run the full 9-step pipeline.

    Args:
        data_path: Single CSV path (e.g. migraine_data.csv). Ignored if data_dir is set.
        data_dir: Folder with patient_*_migraine_attacks.csv; all are loaded and combined.
        stratify_by_patient: If True and data from data_dir, split by patient (test = unseen patients).
    """
    os.makedirs("artifacts", exist_ok=True)

    # Prefer Data folder when no args and Data/ exists (train on each person's attack data)
    if data_dir is None and data_path is None and os.path.isdir(DATA_DIR):
        data_dir = DATA_DIR
    if data_dir is None:
        data_dir = None
    df = step1_load_data(path=data_path or DATA_PATH, data_dir=data_dir)
    X, y, y_encoder, feature_encoders = step2_prepare_features_and_target(df)
    X_train, X_test, y_train, y_test = step5_split(
        X, y, df=df, stratify_by_patient=stratify_by_patient and "patient_id" in df.columns
    )
    n_classes = len(np.unique(y))
    model = step6_train(X_train, y_train, X_test, y_test, n_classes)
    step7_8_evaluate(model, X_train, X_test, y_train, y_test, y_encoder)
    step9_save(model, y_encoder, feature_encoders, X.columns.tolist())

    print("\n" + "=" * 60)
    print("Pipeline finished. Use predictModel.py for inference.")
    print("=" * 60)


if __name__ == "__main__":
    import sys
    # Train on Data folder (per-person attack files) if Data/ exists and no arg given
    if len(sys.argv) > 1 and os.path.isfile(sys.argv[1]):
        run_pipeline(data_path=sys.argv[1])
    elif os.path.isdir(DATA_DIR):
        run_pipeline(data_dir=DATA_DIR)
    else:
        run_pipeline()
