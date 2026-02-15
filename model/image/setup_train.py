#!/usr/bin/env python3
"""
Setup and run the classification pipeline on DataSet 2.
1) Split Data/DataSet 2/kaggle_3m into Data/train/glioma_1, glioma_2, glioma_3, glioma_unknown
2) Train ResNet on Data/train

Requires: pip install -r requirements.txt (torch, torchvision, Pillow, scikit-learn)
"""
import os
import subprocess
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


def main():
    try:
        import torch
        import torchvision
    except ImportError:
        print("PyTorch not found. Install dependencies first:")
        print("  pip install -r requirements.txt")
        print("  (requirements: torch, torchvision, Pillow, scikit-learn)")
        sys.exit(1)
    os.chdir(SCRIPT_DIR)
    # Step 1: Split DataSet 2 into class folders
    print("Step 1: Splitting DataSet 2 into class folders (Data/train/...)")
    r = subprocess.run([sys.executable, "split_data_into_classes.py"], cwd=SCRIPT_DIR)
    if r.returncode != 0:
        sys.exit(r.returncode)
    # Step 2: Train ResNet pipeline
    print("\nStep 2: Training ResNet pipeline on Data/train")
    r = subprocess.run([sys.executable, "run_pipeline.py", "Data/train"], cwd=SCRIPT_DIR)
    sys.exit(r.returncode if r.returncode is not None else 0)


if __name__ == "__main__":
    main()
