#!/usr/bin/env python3
"""
Split per-patient migraine CSVs into train/test folders (80/20 by patient).
Keeps each patient's attacks together to avoid leakage.
"""
import os
import glob
import random
import shutil
import argparse


def ensure_dir(path: str) -> None:
    os.makedirs(path, exist_ok=True)


def split_files(data_dir: str, train_dir: str, test_dir: str, seed: int = 42, test_ratio: float = 0.2) -> None:
    pattern = os.path.join(data_dir, "patient*_migraine*.csv")
    paths = glob.glob(pattern)
    if not paths:
        paths = glob.glob(os.path.join(data_dir, "patient_*.csv"))
    if not paths:
        raise FileNotFoundError(f"No patient CSVs found in {data_dir}")

    rng = random.Random(seed)
    rng.shuffle(paths)
    n_test = max(1, int(len(paths) * test_ratio))
    test_paths = set(paths[:n_test])
    train_paths = [p for p in paths if p not in test_paths]

    ensure_dir(train_dir)
    ensure_dir(test_dir)

    for src in train_paths:
        shutil.copy2(src, os.path.join(train_dir, os.path.basename(src)))
    for src in test_paths:
        shutil.copy2(src, os.path.join(test_dir, os.path.basename(src)))

    print(f"Total patients: {len(paths)}")
    print(f"Train patients: {len(train_paths)} → {train_dir}")
    print(f"Test patients: {len(test_paths)} → {test_dir}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Split per-patient migraine CSVs into train/test folders.")
    parser.add_argument("--data-dir", default="Data", help="Folder containing patient CSVs")
    parser.add_argument("--train-dir", default=None, help="Output train folder (default: <data-dir>/train)")
    parser.add_argument("--test-dir", default=None, help="Output test folder (default: <data-dir>/test)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--test-ratio", type=float, default=0.2, help="Test split ratio")
    args = parser.parse_args()

    data_dir = os.path.abspath(args.data_dir)
    train_dir = os.path.abspath(args.train_dir or os.path.join(data_dir, "train"))
    test_dir = os.path.abspath(args.test_dir or os.path.join(data_dir, "test"))

    split_files(data_dir, train_dir, test_dir, seed=args.seed, test_ratio=args.test_ratio)


if __name__ == "__main__":
    main()
