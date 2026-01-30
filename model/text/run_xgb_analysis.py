#!/usr/bin/env python3
"""
XGBoost Model Analysis for Migraine Data
Analyzes migraine_data.csv using XGBoost classifier
"""

import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

# Set style for plots
sns.set_style("whitegrid")

# Step 1: Load the dataset
print("=" * 60)
print("Loading migraine dataset...")
print("=" * 60)

df = pd.read_csv("migraine_data.csv")
print(f"Dataset shape: {df.shape}")
print(f"\nFirst few rows:\n{df.head()}")
print(f"\nColumn names:\n{df.columns.tolist()}")
print(f"\nData types:\n{df.dtypes}")
print(f"\nMissing values:\n{df.isnull().sum().sum()}")

# Step 2: Analyze the target variable
print("\n" + "=" * 60)
print("Target Variable Analysis")
print("=" * 60)
print(f"\nTarget distribution:\n{df['Type'].value_counts()}")
print(f"\nTarget value proportions:\n{df['Type'].value_counts(normalize=True)}")

# Step 3: Prepare the data
print("\n" + "=" * 60)
print("Preparing data for modeling...")
print("=" * 60)

# Encode categorical features
label_encoders = {}
categorical_cols = ['Location', 'Character', 'DPF']

X = df.drop('Type', axis=1).copy()

for col in categorical_cols:
    if col in X.columns:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col].astype(str))
        label_encoders[col] = le
        print(f"Encoded {col}: {dict(zip(le.classes_, le.transform(le.classes_)))}")

# Encode the target label
y_encoder = LabelEncoder()
y = y_encoder.fit_transform(df['Type'].astype(str))
print(f"\nTarget encoding: {dict(zip(y_encoder.classes_, y_encoder.transform(y_encoder.classes_)))}")

print(f"\nFeatures shape: {X.shape}")
print(f"Target shape: {y.shape}")

# Step 4: Split the data
print("\n" + "=" * 60)
print("Splitting data (80/20 train/test)...")
print("=" * 60)

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Training set size: {X_train.shape[0]}")
print(f"Test set size: {X_test.shape[0]}")
print(f"Training set class distribution:\n{pd.Series(y_train).value_counts()}")
print(f"Test set class distribution:\n{pd.Series(y_test).value_counts()}")

# Step 5: Train XGBoost model
print("\n" + "=" * 60)
print("Training XGBoost Classifier...")
print("=" * 60)

model = xgb.XGBClassifier(
    objective='multi:softmax',
    num_class=len(np.unique(y)),
    eval_metric='mlogloss',
    use_label_encoder=False,
    random_state=42,
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    verbosity=0
)

model.fit(
    X_train, 
    y_train,
    eval_set=[(X_test, y_test)],
    verbose=False
)

print("✓ Model training completed")

# Step 6: Make predictions
print("\n" + "=" * 60)
print("Making predictions...")
print("=" * 60)

y_pred_train = model.predict(X_train)
y_pred_test = model.predict(X_test)

train_accuracy = accuracy_score(y_train, y_pred_train)
test_accuracy = accuracy_score(y_test, y_pred_test)

print(f"Training Accuracy: {train_accuracy:.4f}")
print(f"Test Accuracy: {test_accuracy:.4f}")

# Step 7: Detailed evaluation
print("\n" + "=" * 60)
print("Classification Report (Test Set)")
print("=" * 60)

print("\n", classification_report(
    y_test, 
    y_pred_test,
    target_names=y_encoder.classes_
))

# Step 8: Confusion Matrix
print("=" * 60)
print("Confusion Matrix (Test Set)")
print("=" * 60)

cm = confusion_matrix(y_test, y_pred_test)
print(f"\n{cm}")

# Step 9: Feature importance
print("\n" + "=" * 60)
print("Feature Importance (Top 10)")
print("=" * 60)

feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': model.feature_importances_
}).sort_values('importance', ascending=False)

print(f"\n{feature_importance.head(10).to_string()}")

# Step 10: Cross-validation
print("\n" + "=" * 60)
print("Cross-Validation Analysis (5-fold)")
print("=" * 60)

cv_scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')
print(f"CV Scores: {cv_scores}")
print(f"Mean CV Accuracy: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")

# Step 11: Summary statistics
print("\n" + "=" * 60)
print("ANALYSIS SUMMARY")
print("=" * 60)

print(f"""
Dataset Statistics:
- Total samples: {len(df)}
- Number of features: {X.shape[1]}
- Number of classes: {len(np.unique(y))}
- Training samples: {len(X_train)}
- Test samples: {len(X_test)}

Model Performance:
- Training Accuracy: {train_accuracy:.4f}
- Test Accuracy: {test_accuracy:.4f}
- Cross-validation Mean: {cv_scores.mean():.4f}

Target Classes:
{chr(10).join([f'  - {cls}' for cls in y_encoder.classes_])}

Top Features:
{chr(10).join([f'  {i+1}. {row[0]}: {row[1]:.4f}' for i, row in enumerate(feature_importance.head(5).values)])}
""")

print("=" * 60)
print("✓ Analysis completed successfully!")
print("=" * 60)
