# predict_model.py
"""
Load model and encoders saved by run_pipeline.py (Step 9 / save_model.py).
Predict migraine type for new patient data.
"""
import os
import pandas as pd
import joblib

# Load trained model and encoders (from Step 9)
model = joblib.load("xgboost_patient_model.pkl")
label_encoder = joblib.load("label_encoder.pkl")
feature_encoders = None
if os.path.exists("artifacts/feature_encoders.joblib"):
    feature_encoders = joblib.load("artifacts/feature_encoders.joblib")
feature_columns = None
if os.path.exists("artifacts/feature_columns.joblib"):
    feature_columns = joblib.load("artifacts/feature_columns.joblib")

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

# Encode categorical features (use saved encoders from pipeline if available)
categorical_cols = ["Location", "Character", "DPF"]
if feature_encoders:
    for col in categorical_cols:
        if col in feature_encoders and col in new_patient.columns:
            le = feature_encoders[col]
            new_patient[col] = new_patient[col].astype(str).map(
                lambda x: le.transform([x])[0] if x in le.classes_ else -1
            )
else:
    for col in categorical_cols:
        if col in new_patient.columns:
            new_patient[col] = new_patient[col].map(
                lambda x: label_encoder.transform([x])[0] if x in label_encoder.classes_ else -1
            )

# Ensure column order matches training
if feature_columns is not None:
    new_patient = new_patient.reindex(columns=feature_columns, fill_value=0)

# Predict (label_encoder is for target only)
pred_class = model.predict(new_patient)
pred_label = label_encoder.inverse_transform(pred_class)
print("Predicted disease type:", pred_label[0])
