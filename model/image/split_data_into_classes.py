#!/usr/bin/env python3
"""
Separate LGG brain MRI data into class folders for training the ResNet classifier.
Reads data.csv (Patient -> histological_type), copies non-mask .tif images into
Data/glioma_1/, Data/glioma_2/, Data/glioma_3/ (and glioma_unknown if type missing).
Creates Data/migraine/ as empty placeholder for when you add migraine images.
"""
import os
import re
import shutil
import pandas as pd
from pathlib import Path

# Paths (run from model/image/)
SCRIPT_DIR = Path(__file__).resolve().parent
DATA_SET2 = SCRIPT_DIR / "Data" / "DataSet 2"
KAGGLE_3M = DATA_SET2 / "kaggle_3m"
CSV_PATH = KAGGLE_3M / "data.csv"
# Class folders for run_pipeline: Data/train/glioma_1, ... (only class dirs, no DataSet 2)
OUT_ROOT = SCRIPT_DIR / "Data" / "train"

SKIP_MASK = True  # skip *_mask.tif (segmentation masks)


def patient_id_from_folder(folder_name: str) -> str:
    """TCGA_CS_4941_19960909 -> TCGA_CS_4941 (match data.csv Patient column)"""
    parts = folder_name.split("_")
    if len(parts) >= 3 and parts[0] == "TCGA":
        return "_".join(parts[:3])
    return folder_name


def main():
    if not CSV_PATH.exists():
        print("Not found:", CSV_PATH)
        return
    df = pd.read_csv(CSV_PATH)
    # Patient column may have trailing spaces
    df["Patient"] = df["Patient"].astype(str).str.strip()
    patient_to_type = dict(zip(df["Patient"], df["histological_type"]))

    # Map histological_type (1,2,3) to folder name; empty -> glioma_unknown
    def class_folder(ht):
        if pd.isna(ht) or ht == "":
            return "glioma_unknown"
        return f"glioma_{int(ht)}"

    # Create output class dirs (glioma only for training; add migraine later if needed)
    classes = {"glioma_1", "glioma_2", "glioma_3", "glioma_unknown"}
    for c in classes:
        (OUT_ROOT / c).mkdir(parents=True, exist_ok=True)

    copied = {c: 0 for c in classes}
    if not KAGGLE_3M.exists():
        print("Not found:", KAGGLE_3M)
        return

    for folder_name in sorted(os.listdir(KAGGLE_3M)):
        folder_path = KAGGLE_3M / folder_name
        if not folder_path.is_dir():
            continue
        patient_id = patient_id_from_folder(folder_name)
        ht = patient_to_type.get(patient_id)
        cls = class_folder(ht)
        out_dir = OUT_ROOT / cls
        for f in os.listdir(folder_path):
            if not f.lower().endswith(".tif"):
                continue
            if SKIP_MASK and "_mask.tif" in f.lower():
                continue
            src = folder_path / f
            if not src.is_file():
                continue
            # Unique name to avoid collisions across patients
            dest_name = f"{folder_name}_{f}"
            dest = out_dir / dest_name
            shutil.copy2(src, dest)
            copied[cls] += 1
        if copied[cls] % 500 == 0 and copied[cls] > 0:
            print(f"  {cls}: {copied[cls]} files so far...")

    print("\nDone. Summary:")
    for c in sorted(copied.keys()):
        print(f"  {c}: {copied[c]} images")
    print(f"\nClass folders under: {OUT_ROOT}")
    print("Train with: python run_pipeline.py Data/train")


if __name__ == "__main__":
    main()
