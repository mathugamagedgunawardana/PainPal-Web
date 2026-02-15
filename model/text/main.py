# Step 1: Import libraries
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import xgboost as xgb

# Step 2: Load the dataset
df = pd.read_csv("patient_data.csv")

# Step 3: Encode categorical features
categorical_cols = ['Location', 'Character', 'DPF']  # Add more if needed
for col in categorical_cols:
    df[col] = LabelEncoder().fit_transform(df[col].astype(str))

# Encode the target label
label_encoder = LabelEncoder()
df['Type'] = label_encoder.fit_transform(df['Type'].astype(str))

# Step 4: Split features and target
X = df.drop('Type', axis=1)
y = df['Type']

# Step 5: Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# Step 6: Initialize and train XGBoost (use device="cuda" for GPU, "cpu" for CPU)
model = xgb.XGBClassifier(
    objective='multi:softmax',  # Multi-class classification
    num_class=len(df['Type'].unique()),
    eval_metric='mlogloss',
    use_label_encoder=False,
    random_state=42,
    tree_method="hist",
    device="cuda",
)

model.fit(X_train, y_train)

# Step 7: Predictions
y_pred = model.predict(X_test)

# Step 8: Evaluation
print("Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n", classification_report(y_test, y_pred))
print("\nConfusion Matrix:\n", confusion_matrix(y_test, y_pred))

# Optional: Map predictions back to original labels
y_pred_labels = label_encoder.inverse_transform(y_pred)
