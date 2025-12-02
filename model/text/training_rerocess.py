# train_preprocess.py
"""
Data preprocessing pipeline for migraine classification model.
This script handles data loading, cleaning, feature engineering, and preprocessing
for training a machine learning model to classify migraine types.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import SimpleImputer
import joblib

# Feature categories for preprocessing
NUMERIC = ['Age','Duration','Frequency','Intensity']  # Numerical features that need scaling
CATEGORICAL = ['Location','Character','DPF']  # Categorical features that need encoding
BINARY = ['Nausea','Vomit','Phonophobia','Photophobia','Visual','Sensory','Dysphasia','Dysarthria','Vertigo','Tinnitus','Hypoacusis','Diplopia','Defect','Ataxia','Conscience','Paresthesia']  # Binary symptom features (0/1)
TARGET = 'Type'  # Target variable for classification (migraine type)

def load_and_preprocess(path):
    """
    Load and preprocess the clinical migraine dataset.

    Args:
        path (str): Path to the CSV file containing clinical data

    Returns:
        pd.DataFrame: Preprocessed dataframe ready for model training
    """
    df = pd.read_csv(path)

    # Basic imputation - Handle missing values
    # Use median for numerical features (robust to outliers)
    num_imp = SimpleImputer(strategy='median')
    df[NUMERIC] = num_imp.fit_transform(df[NUMERIC])

    # Use 'missing' for categorical features
    cat_imp = SimpleImputer(strategy='constant', fill_value='missing')
    df[CATEGORICAL] = cat_imp.fit_transform(df[CATEGORICAL])

    # Encode target variable - Convert migraine types to numerical labels
    le = LabelEncoder()
    df[TARGET] = le.fit_transform(df[TARGET])

    # Feature engineering - Create new features from existing ones
    # Intensity x Frequency: Combined measure of migraine severity and occurrence
    df['Intensity_x_Freq'] = df['Intensity'] * df['Frequency']

    # Has aura: Binary feature indicating presence of aura symptoms
    # Aura includes visual, sensory, or speech disturbances
    df['has_aura'] = ((df['Visual'] == 1) | (df['Sensory'] == 1) | (df['Dysphasia'] == 1)).astype(int)

    # Scale numerical features for neural network training
    # Standardization (mean=0, std=1) helps with gradient descent convergence
    scaler = StandardScaler()
    df[NUMERIC + ['Intensity_x_Freq']] = scaler.fit_transform(df[NUMERIC + ['Intensity_x_Freq']])

    # Save preprocessing artifacts for later use in inference
    # These will be needed to preprocess new data the same way
    joblib.dump(num_imp, 'artifacts/num_imputer.joblib')  # Numerical imputer
    joblib.dump(cat_imp, 'artifacts/cat_imputer.joblib')  # Categorical imputer
    joblib.dump(le, 'artifacts/label_encoder.joblib')      # Label encoder for target
    joblib.dump(scaler, 'artifacts/scaler.joblib')         # Feature scaler

    return df

if __name__ == '__main__':
    # Create artifacts directory if it doesn't exist
    import os
    os.makedirs('artifacts', exist_ok=True)

    # Run preprocessing pipeline
    df = load_and_preprocess('data/clinical.csv')

    # Save processed data in efficient parquet format
    df.to_parquet('data/processed.parquet')
    print('Preprocessed saved to data/processed.parquet')