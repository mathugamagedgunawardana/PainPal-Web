# predict_model.py
"""
Load model and encoders saved by run_pipeline.py (Step 9 / save_model.py).
Predict migraine type for new patient data.
"""
import os
import pandas as pd
import joblib
import numpy as np

# Load trained model and encoders (from Step 9)
model = joblib.load("xgboost_patient_model.pkl")
label_encoder = joblib.load("label_encoder.pkl")
feature_columns = None
num_imputer = None
cat_imputer = None
if os.path.exists("artifacts/feature_columns.joblib"):
    feature_columns = joblib.load("artifacts/feature_columns.joblib")
if os.path.exists("artifacts/num_imputer.joblib"):
    num_imputer = joblib.load("artifacts/num_imputer.joblib")
if os.path.exists("artifacts/cat_imputer.joblib"):
    cat_imputer = joblib.load("artifacts/cat_imputer.joblib")

# Example: New patient data (replace with real input)
# Column order must match training (use feature_columns if available)
new_patient = pd.DataFrame([{
    "Age": 35,
    "Duration": 4,
    "Frequency": 2,
    "Location": "Unilateral",
    "Character": "Throbbing",
    "Intensity": 8,
    "Nausea": 1,
    "Vomit": 0,
    "Phonophobia": 1,
    "Photophobia": 1,
    "Visual": 0,
    "Sensory": 0,
    "Dysphasia": 0,
    "Dysarthria": 0,
    "Vertigo": 0,
    "Tinnitus": 0,
    "Hypoacusis": 0,
    "Diplopia": 0,
    "Defect": 0,
    "Ataxia": 0,
    "Conscience": 0,
    "Paresthesia": 0,
    "DPF": "Pattern1",
}])

# Feature engineering (must match training)
if "Intensity" in new_patient.columns and "Frequency" in new_patient.columns:
    new_patient["Intensity_x_Freq"] = new_patient["Intensity"] * new_patient["Frequency"]
aura_cols = [c for c in ["Visual", "Sensory", "Dysphasia"] if c in new_patient.columns]
if aura_cols:
    new_patient["has_aura"] = (new_patient[aura_cols].sum(axis=1) > 0).astype(int)

# Impute missing values with training imputers if available
numeric_cols = new_patient.select_dtypes(include=[np.number]).columns.tolist()
categorical_cols = list(new_patient.select_dtypes(include=["object", "category"]).columns)
if num_imputer is not None and numeric_cols:
    new_patient[numeric_cols] = num_imputer.transform(new_patient[numeric_cols])
if cat_imputer is not None and categorical_cols:
    new_patient[categorical_cols] = cat_imputer.transform(new_patient[categorical_cols])
    new_patient[categorical_cols] = new_patient[categorical_cols].astype(str)

# One-hot encode categoricals to align with training columns
if categorical_cols:
    new_patient = pd.get_dummies(new_patient, columns=categorical_cols, dummy_na=True)

# Ensure column order matches training
if feature_columns is not None:
    new_patient = new_patient.reindex(columns=feature_columns, fill_value=0)

# Predict (label_encoder is for target only)
pred_class = model.predict(new_patient)
pred_label = label_encoder.inverse_transform(pred_class)
print("Predicted disease type:", pred_label[0])
