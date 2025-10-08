# predict_model.py
import pandas as pd
import joblib

# Load trained model and label encoder
model = joblib.load('xgboost_patient_model.pkl')
label_encoder = joblib.load('label_encoder.pkl')

# Example: New patient data (replace with real input)
# Make sure the order of columns matches training data
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
    "DPF": "Pattern1"
}])

# Encode categorical features
categorical_cols = ['Location', 'Character', 'DPF']
for col in categorical_cols:
    # use same encoder as training
    new_patient[col] = new_patient[col].map(
        lambda x: label_encoder.transform([x])[0] if x in label_encoder.classes_ else -1
    )

# Predict
pred_class = model.predict(new_patient)
pred_label = label_encoder.inverse_transform(pred_class)
print("Predicted disease type:", pred_label[0])
