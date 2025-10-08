# train_model.py
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import xgboost as xgb
import joblib

# Load dataset
df = pd.read_csv("patient_data.csv")

# Encode categorical features
categorical_cols = ['Location', 'Character', 'DPF']  # update if needed
for col in categorical_cols:
    df[col] = LabelEncoder().fit_transform(df[col].astype(str))

# Encode target
label_encoder = LabelEncoder()
df['Type'] = label_encoder.fit_transform(df['Type'].astype(str))

# Save label encoder for later
joblib.dump(label_encoder, 'label_encoder.pkl')

# Split features and target
X = df.drop('Type', axis=1)
y = df['Type']

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Initialize XGBoost model
model = xgb.XGBClassifier(
    objective='multi:softmax',
    num_class=len(df['Type'].unique()),
    eval_metric='mlogloss',
    use_label_encoder=False,
    random_state=42
)

# Train
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n", classification_report(y_test, y_pred))

# Save model
joblib.dump(model, 'xgboost_patient_model.pkl')
print("Model saved as xgboost_patient_model.pkl")
