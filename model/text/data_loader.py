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
# Target columns
TARGET = "Type"
MIGRAINE_TYPE_COL = "MigraineType"


def _find_patient_csvs(data_dir: str, pattern: str) -> list[str]:
    paths = glob.glob(os.path.join(data_dir, pattern))
    if not paths:
        paths = glob.glob(os.path.join(data_dir, "patient_*.csv"))
    return sorted(paths, key=_patient_sort_key)


def _find_any_csvs(data_dir: str) -> list[str]:
    return sorted(glob.glob(os.path.join(data_dir, "**", "*.csv"), recursive=True))


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
    paths = _find_patient_csvs(data_dir, pattern)
    if not paths:
        raise FileNotFoundError(f"No files matching '{pattern}' in {data_dir}")

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


def load_data_from_labeled_folder(data_dir: str) -> pd.DataFrame:
    """
    Load and combine labeled migraine CSVs from a folder with subfolders per class.

    Expected layout:
      Data/traningData_labeled/<migraine_type>/*.csv

    Each CSV can include MigraineType. If missing, the folder name is used.
    """
    data_dir = os.path.abspath(data_dir)
    if not os.path.isdir(data_dir):
        raise FileNotFoundError(f"Labeled data directory not found: {data_dir}")

    paths = _find_any_csvs(data_dir)
    if not paths:
        raise FileNotFoundError(f"No CSVs found under {data_dir}")

    frames = []
    for path in paths:
        try:
            df = pd.read_csv(path)
        except Exception as e:
            raise RuntimeError(f"Failed to read {path}: {e}") from e

        # Drop attack_id to avoid leakage; keep patient_id for optional stratification
        if "attack_id" in df.columns:
            df = df.drop(columns=["attack_id"])

        if MIGRAINE_TYPE_COL not in df.columns:
            folder = os.path.basename(os.path.dirname(path))
            label = folder.replace("_", " ").strip()
            df[MIGRAINE_TYPE_COL] = label

        frames.append(df)

    combined = pd.concat(frames, axis=0, ignore_index=True)

    if MIGRAINE_TYPE_COL not in combined.columns:
        raise ValueError(
            f"Target column '{MIGRAINE_TYPE_COL}' not found. Columns: {combined.columns.tolist()}"
        )

    combined[MIGRAINE_TYPE_COL] = combined[MIGRAINE_TYPE_COL].astype(str)
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
