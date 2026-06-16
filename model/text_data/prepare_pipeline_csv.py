#!/usr/bin/env python3
"""
Convert legacy migraine_data.csv into the format expected by model/text/run_pipeline.py.

Reads the UCI-style dataset (legacy Type labels, numeric symptom codes) and writes a
pipeline-ready CSV with:
  - canonical migraine subtype labels (Migraine_without_aura, Typical_aura_migraine, ...)
  - one-hot target columns for all 10 subtypes used by the app and train_next_attack.py
  - validated feature dtypes (numeric + binary 0/1)

Usage:
  python prepare_pipeline_csv.py
  python prepare_pipeline_csv.py --input migraine_data.csv --output ../text/migraine_data.csv
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

# Mirrors TYPE_CANONICAL_MAP in model/text/run_pipeline.py
LEGACY_TO_CANONICAL = {
    "Migraine without aura": "Migraine_without_aura",
    "Typical aura with migraine": "Typical_aura_migraine",
    "Typical aura without migraine": "Typical_aura_migraine",
    "Basilar-type aura": "Brainstem_aura_migraine",
    "Familial hemiplegic migraine": "Hemiplegic_migraine",
    "Sporadic hemiplegic migraine": "Hemiplegic_migraine",
    "Other": "Probable_migraine",
    # Synthetic / display labels
    "Migraine with aura": "Typical_aura_migraine",
    "Migraine with brainstem aura": "Brainstem_aura_migraine",
    "Hemiplegic migraine": "Hemiplegic_migraine",
    "Retinal migraine": "Retinal_migraine",
    "Chronic migraine": "Chronic_migraine",
    "Menstrual migraine": "Menstrual_migraine",
    "Vestibular migraine": "Vestibular_migraine",
    "Status migrainosus": "Status_migrainosus",
    "Probable migraine": "Probable_migraine",
}

# Already-canonical labels pass through unchanged.
CANONICAL_SUBTYPES = [
    "Migraine_without_aura",
    "Typical_aura_migraine",
    "Brainstem_aura_migraine",
    "Hemiplegic_migraine",
    "Retinal_migraine",
    "Chronic_migraine",
    "Menstrual_migraine",
    "Vestibular_migraine",
    "Status_migrainosus",
    "Probable_migraine",
]

FEATURE_COLUMNS = [
    "Age",
    "Duration",
    "Frequency",
    "Location",
    "Character",
    "Intensity",
    "Nausea",
    "Vomit",
    "Phonophobia",
    "Photophobia",
    "Visual",
    "Sensory",
    "Dysphasia",
    "Dysarthria",
    "Vertigo",
    "Tinnitus",
    "Hypoacusis",
    "Diplopia",
    "Defect",
    "Ataxia",
    "Conscience",
    "Paresthesia",
    "DPF",
]

BINARY_COLUMNS = [
    "Nausea",
    "Vomit",
    "Phonophobia",
    "Photophobia",
    "Visual",
    "Sensory",
    "Dysphasia",
    "Dysarthria",
    "Vertigo",
    "Tinnitus",
    "Hypoacusis",
    "Diplopia",
    "Defect",
    "Ataxia",
    "Conscience",
    "Paresthesia",
]

NUMERIC_COLUMNS = ["Age", "Duration", "Frequency", "Intensity", "Location", "Character", "DPF"]


def _script_dir() -> Path:
    return Path(__file__).resolve().parent


def _default_paths() -> tuple[Path, Path]:
    base = _script_dir()
    return base / "migraine_data.csv", base.parent / "text" / "migraine_data.csv"


def _map_subtype(raw_label: str) -> str:
    label = str(raw_label).strip()
    if label in CANONICAL_SUBTYPES:
        return label
    if label in LEGACY_TO_CANONICAL:
        return LEGACY_TO_CANONICAL[label]
    raise ValueError(f"Unknown migraine Type label: {raw_label!r}")


def _coerce_features(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    missing = [c for c in FEATURE_COLUMNS if c not in out.columns]
    if missing:
        raise ValueError(f"Missing required feature columns: {missing}")

    for col in NUMERIC_COLUMNS:
        out[col] = pd.to_numeric(out[col], errors="coerce")

    for col in BINARY_COLUMNS:
        out[col] = pd.to_numeric(out[col], errors="coerce").fillna(0).clip(0, 1).astype(int)

    if out[NUMERIC_COLUMNS].isnull().any().any():
        bad = out[NUMERIC_COLUMNS].isnull().any()
        raise ValueError(f"Non-numeric values in columns: {bad[bad].index.tolist()}")

    return out


def _resolve_subtype_column(df: pd.DataFrame) -> pd.Series:
    if "Type" in df.columns:
        return df["Type"]
    if "MigraineType" in df.columns:
        return df["MigraineType"]
    present = [c for c in CANONICAL_SUBTYPES if c in df.columns]
    if len(present) >= 2:
        one_hot = df[present].apply(pd.to_numeric, errors="coerce").fillna(0)
        no_positive = one_hot.sum(axis=1) <= 0
        if no_positive.any():
            one_hot.loc[no_positive, present[0]] = 1
        return one_hot.idxmax(axis=1).astype(str)
    raise ValueError("No target column found. Expected 'Type', 'MigraineType', or one-hot subtype columns.")


def convert_migraine_data(df: pd.DataFrame) -> pd.DataFrame:
    """Transform raw migraine rows into pipeline-ready format."""
    raw_labels = _resolve_subtype_column(df)
    canonical = raw_labels.map(_map_subtype)

    unmapped = sorted(set(raw_labels.astype(str).str.strip()) - set(LEGACY_TO_CANONICAL) - set(CANONICAL_SUBTYPES))
    if unmapped:
        raise ValueError(f"Unmapped Type labels: {unmapped}")

    features = _coerce_features(df)
    out = features[FEATURE_COLUMNS].copy()
    out["Type"] = canonical.values
    out["MigraineType"] = canonical.values

    for subtype in CANONICAL_SUBTYPES:
        out[subtype] = (canonical == subtype).astype(int)

    return out


def _print_summary(df: pd.DataFrame) -> None:
    print(f"Rows: {len(df)}")
    print(f"Columns: {len(df.columns)}")
    print("\nCanonical subtype distribution:")
    print(df["Type"].value_counts().to_string())
    print("\nOne-hot column sums:")
    for subtype in CANONICAL_SUBTYPES:
        print(f"  {subtype}: {int(df[subtype].sum())}")


def main(argv: list[str] | None = None) -> int:
    default_in, default_out = _default_paths()
    parser = argparse.ArgumentParser(description="Prepare migraine_data.csv for run_pipeline.py")
    parser.add_argument("--input", type=Path, default=default_in, help="Source CSV path")
    parser.add_argument("--output", type=Path, default=default_out, help="Pipeline-ready CSV path")
    parser.add_argument("--dry-run", action="store_true", help="Validate and print summary without writing")
    args = parser.parse_args(argv)

    if not args.input.is_file():
        print(f"Input file not found: {args.input}", file=sys.stderr)
        return 1

    df = pd.read_csv(args.input)
    converted = convert_migraine_data(df)
    _print_summary(converted)

    if args.dry_run:
        print("\nDry run: no file written.")
        return 0

    args.output.parent.mkdir(parents=True, exist_ok=True)
    converted.to_csv(args.output, index=False)
    print(f"\nWrote pipeline CSV -> {args.output}")
    print("Train with:")
    print(f"  cd {args.output.parent}")
    print(f"  python run_pipeline.py {args.output.name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
