"""
Load migraine attack data from a single CSV or from Data folder (one CSV per patient).
"""
import os
import re
import glob
import pandas as pd


def _patient_sort_key(path: str) -> tuple:
    """Sort patient_1, patient_2, ... patient_10 in numeric order."""
    base = os.path.basename(path)
    m = re.search(r"patient[_\-]?(\d+)", base, re.I)
    return (int(m.group(1)), path) if m else (0, path)

# ID columns to drop when building feature matrix X (not features)
ID_COLS = ["patient_id", "attack_id"]
# Target column
TARGET = "Type"


def load_data_from_data_folder(data_dir: str, pattern: str = "patient*migraine*.csv"):
    """
    Load and combine all per-patient migraine attack CSVs from a directory.

    Each file should have columns: [patient_id, attack_id], feature cols..., Type.
    ID columns are dropped so the combined dataframe matches the single-file schema
    (features + Type only).

    Args:
        data_dir: Path to folder containing patient_*_migraine_attacks.csv (or similar).
        pattern: Glob pattern for CSV files (default: patient*migraine*.csv).

    Returns:
        pd.DataFrame with feature columns + Type. Optional column _patient_id is added
        if present in files (for stratification), then dropped before training.
    """
    data_dir = os.path.abspath(data_dir)
    if not os.path.isdir(data_dir):
        raise FileNotFoundError(f"Data directory not found: {data_dir}")

    # Support both patient_1_migraine_attacks.csv and patient_01.csv style
    paths = glob.glob(os.path.join(data_dir, pattern))
    if not paths:
        paths = glob.glob(os.path.join(data_dir, "patient_*.csv"))
    if not paths:
        raise FileNotFoundError(f"No files matching '{pattern}' in {data_dir}")
    paths = sorted(paths, key=_patient_sort_key)

    frames = []
    for path in paths:
        try:
            df = pd.read_csv(path)
            # Drop only attack_id; keep patient_id for optional stratification
            if "attack_id" in df.columns:
                df = df.drop(columns=["attack_id"])
            frames.append(df)
        except Exception as e:
            raise RuntimeError(f"Failed to read {path}: {e}") from e

    combined = pd.concat(frames, axis=0, ignore_index=True)

    # Ensure Type exists
    if TARGET not in combined.columns:
        raise ValueError(f"Target column '{TARGET}' not found. Columns: {combined.columns.tolist()}")

    # Coerce target to string for consistent encoding (handles 0/1 or class names)
    combined[TARGET] = combined[TARGET].astype(str)

    return combined


def load_data_single(path: str) -> pd.DataFrame:
    """Load a single CSV (e.g. migraine_data.csv)."""
    df = pd.read_csv(path)
    for col in ID_COLS:
        if col in df.columns:
            df = df.drop(columns=[col])
    if TARGET in df.columns:
        df[TARGET] = df[TARGET].astype(str)
    return df
