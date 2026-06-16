#!/usr/bin/env python3
"""
Generate balanced synthetic migraine rows via CTGAN data augmentation (SDV).

Uses expand_migraine_ctgan.py to train CTGAN on real rows and sample balanced
per-subtype data, then converts output to pipeline-ready format via
prepare_pipeline_csv.convert_migraine_data.

Usage:
  python generate_synthetic_migraine_data.py
  python generate_synthetic_migraine_data.py --per-class 2000 --epochs 150
  python generate_synthetic_migraine_data.py --output-only ../text/migraine_data_synthetic.csv
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

from expand_migraine_ctgan import expand_with_ctgan
from prepare_pipeline_csv import convert_migraine_data


def _script_dir() -> Path:
    return Path(__file__).resolve().parent


def generate_synthetic_with_ctgan(
    input_path: Path,
    output_path: Path,
    *,
    per_class: int = 2000,
    epochs: int = 150,
    seed: int = 42,
    pipeline_ready: bool = True,
) -> pd.DataFrame:
    """CTGAN augmentation; optionally convert to pipeline-ready CSV."""
    legacy_path = output_path if not pipeline_ready else output_path.with_suffix(".ctgan_legacy.csv")
    expand_with_ctgan(
        input_path=input_path,
        output_path=legacy_path,
        per_class=per_class,
        epochs=epochs,
        seed=seed,
    )
    if not pipeline_ready:
        return pd.read_csv(legacy_path)

    df = pd.read_csv(legacy_path)
    converted = convert_migraine_data(df)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    converted.to_csv(output_path, index=False)
    if legacy_path != output_path and legacy_path.is_file():
        legacy_path.unlink()
    return converted


def main(argv: list[str] | None = None) -> int:
    default_in = _script_dir() / "migraine_data.csv"
    default_out = _script_dir().parent / "text" / "migraine_data_synthetic.csv"

    parser = argparse.ArgumentParser(description="Generate synthetic migraine data with CTGAN")
    parser.add_argument("--input", type=Path, default=default_in, help="Source CSV for CTGAN training")
    parser.add_argument("--output", type=Path, default=None, help="Pipeline-ready output CSV")
    parser.add_argument("--output-only", type=Path, default=None, help="Alias for --output")
    parser.add_argument("--per-class", type=int, default=2000, help="Rows per migraine subtype")
    parser.add_argument("--epochs", type=int, default=150, help="CTGAN training epochs")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument(
        "--legacy-only",
        action="store_true",
        help="Write legacy Type CSV only (skip prepare_pipeline_csv conversion)",
    )
    args = parser.parse_args(argv)

    out_path = args.output_only or args.output or default_out
    if not args.input.is_file():
        print(f"Input file not found: {args.input}", file=sys.stderr)
        return 1

    converted = generate_synthetic_with_ctgan(
        args.input,
        out_path,
        per_class=args.per_class,
        epochs=args.epochs,
        seed=args.seed,
        pipeline_ready=not args.legacy_only,
    )
    print(f"\nWrote {len(converted)} rows -> {out_path}")
    type_col = "Type" if "Type" in converted.columns else converted.columns[0]
    print(converted[type_col].value_counts().to_string())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
