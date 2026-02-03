#!/usr/bin/env python3
"""
Full classification pipeline: Steps 1–9.
Runs load → prepare → split → train → predict → evaluate → save.
Uses migraine_data.csv and writes artifacts for predictModel.py.
"""

import os
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

from save_model import save_artifacts

# Config
DATA_PATH = "migraine_data.csv"
CATEGORICAL_COLS = ["Location", "Character", "DPF"]
TARGET = "Type"
RANDOM_STATE = 42
TEST_SIZE = 0.2


def step1_load_data(path=DATA_PATH):
    """Step 1: Load the dataset."""
    print("\n" + "=" * 60)
    print("Step 1: Load data")
    print("=" * 60)
    df = pd.read_csv(path)
    print(f"  Loaded {path}: shape {df.shape}")
    return df


def step2_prepare_features_and_target(df):
    """Steps 2–4: Define target, encode categoricals, encode target."""
    print("\n" + "=" * 60)
    print("Steps 2–4: Prepare features and target")
    print("=" * 60)
    X = df.drop(TARGET, axis=1).copy()
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


def step5_split(X, y):
    """Step 5: Train/test split."""
    print("\n" + "=" * 60)
    print("Step 5: Train/test split")
    print("=" * 60)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    print(f"  Train: {X_train.shape[0]}, Test: {X_test.shape[0]}")
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


def run_pipeline(data_path=DATA_PATH):
    """Run the full 9-step pipeline."""
    os.makedirs("artifacts", exist_ok=True)

    df = step1_load_data(data_path)
    X, y, y_encoder, feature_encoders = step2_prepare_features_and_target(df)
    X_train, X_test, y_train, y_test = step5_split(X, y)
    n_classes = len(np.unique(y))
    model = step6_train(X_train, y_train, X_test, y_test, n_classes)
    step7_8_evaluate(model, X_train, X_test, y_train, y_test, y_encoder)
    step9_save(model, y_encoder, feature_encoders, X.columns.tolist())

    print("\n" + "=" * 60)
    print("Pipeline finished. Use predictModel.py for inference.")
    print("=" * 60)


if __name__ == "__main__":
    run_pipeline()
