# save_model.py
"""
Step 9: Save model and encoders for inference.
Saves trained XGBoost model, target label encoder, optional feature encoders,
and feature column names so predictModel.py can load and predict.
"""

import os
import joblib


def save_artifacts(
    model,
    target_encoder,
    feature_encoders=None,
    feature_names=None,
    out_dir=".",
    model_name="xgboost_patient_model.pkl",
    encoder_name="label_encoder.pkl",
):
    """
    Save model and encoders for later use in prediction.

    Args:
        model: Trained XGBoost model (e.g. xgb.XGBClassifier or first fold from train_xgb).
        target_encoder: LabelEncoder fitted on target (Type).
        feature_encoders: Optional dict of {col_name: LabelEncoder} for categorical features.
        feature_names: Optional list of feature column names in model order.
        out_dir: Directory to write files (default current dir).
        model_name: Filename for the model.
        encoder_name: Filename for the target label encoder.
    """
    os.makedirs(out_dir, exist_ok=True)
    artifacts_dir = os.path.join(out_dir, "artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)

    model_path = os.path.join(out_dir, model_name)
    encoder_path = os.path.join(out_dir, encoder_name)

    joblib.dump(model, model_path)
    joblib.dump(target_encoder, encoder_path)
    print(f"  Saved model -> {model_path}")
    print(f"  Saved target encoder -> {encoder_path}")

    if feature_encoders is not None:
        enc_path = os.path.join(artifacts_dir, "feature_encoders.joblib")
        joblib.dump(feature_encoders, enc_path)
        print(f"  Saved feature encoders -> {enc_path}")

    if feature_names is not None:
        cols_path = os.path.join(artifacts_dir, "feature_columns.joblib")
        joblib.dump(feature_names, cols_path)
        print(f"  Saved feature columns -> {cols_path}")

    print("  Step 9 (Save) completed.")


def load_serving_artifacts(from_artifacts_dir=False):
    """
    Load model and encoders saved by save_artifacts (for use in predict script).
    If from_artifacts_dir=True, loads from artifacts/ (e.g. after train_xgb pipeline).
    """
    if from_artifacts_dir:
        model = joblib.load("artifacts/xgb_models.joblib")[0]
        target_encoder = joblib.load("artifacts/label_encoder.joblib")
        feature_names = joblib.load("artifacts/xgb_cols.joblib")
        feature_encoders = None
        return model, target_encoder, feature_encoders, feature_names

    model = joblib.load("xgboost_patient_model.pkl")
    target_encoder = joblib.load("label_encoder.pkl")
    feature_encoders = None
    feature_names = None
    if os.path.exists("artifacts/feature_encoders.joblib"):
        feature_encoders = joblib.load("artifacts/feature_encoders.joblib")
    if os.path.exists("artifacts/feature_columns.joblib"):
        feature_names = joblib.load("artifacts/feature_columns.joblib")
    return model, target_encoder, feature_encoders, feature_names


if __name__ == "__main__":
    # Example: load from pipeline artifacts and re-save as serving files
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "from_artifacts":
        model, target_encoder, _, feature_names = load_serving_artifacts(from_artifacts_dir=True)
        save_artifacts(model, target_encoder, feature_names=feature_names)
