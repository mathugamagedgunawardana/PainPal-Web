#!/usr/bin/env python3
"""
Expand migraine_data.csv to a target size using CTGAN (SDV).

Trains CTGAN on feature columns + canonical Type, then samples balanced rows
per subtype via reject sampling (SDV 1.x CTGAN has no conditional sample API).

Usage:
  python expand_migraine_ctgan.py
  python expand_migraine_ctgan.py --target-rows 20000 --per-class 2000 --epochs 150
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

from prepare_pipeline_csv import LEGACY_TO_CANONICAL, CANONICAL_SUBTYPES, FEATURE_COLUMNS

BINARY_COLUMNS = [
    "Nausea",
    "Vomit",
    "Phonophobia",
    "Photophobia",
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

ORDINAL_RANGES = {
    "Age": (15, 77),
    "Duration": (1, 3),
    "Frequency": (1, 8),
    "Location": (0, 2),
    "Character": (0, 2),
    "Intensity": (0, 3),
    "Visual": (0, 4),
    "Sensory": (0, 2),
}

CANONICAL_TO_LEGACY = {
    "Migraine_without_aura": "Migraine without aura",
    "Typical_aura_migraine": "Typical aura with migraine",
    "Brainstem_aura_migraine": "Basilar-type aura",
    "Hemiplegic_migraine": "Familial hemiplegic migraine",
    "Retinal_migraine": "Retinal migraine",
    "Chronic_migraine": "Chronic migraine",
    "Menstrual_migraine": "Menstrual migraine",
    "Vestibular_migraine": "Vestibular migraine",
    "Status_migrainosus": "Status migrainosus",
    "Probable_migraine": "Other",
}


def _script_dir() -> Path:
    return Path(__file__).resolve().parent


def _to_canonical_type(raw: str) -> str:
    label = str(raw).strip()
    if label in CANONICAL_SUBTYPES:
        return label
    if label in LEGACY_TO_CANONICAL:
        return LEGACY_TO_CANONICAL[label]
    raise ValueError(f"Unknown Type label: {raw!r}")


def load_and_normalize(path: Path) -> pd.DataFrame:
    df = pd.read_csv(path)
    df = df[[c for c in FEATURE_COLUMNS if c in df.columns] + ["Type"]].copy()
    df["Type_canonical"] = df["Type"].map(_to_canonical_type)
    return df


def _build_metadata(train_df: pd.DataFrame):
    from sdv.metadata import SingleTableMetadata

    metadata = SingleTableMetadata()
    metadata.detect_from_dataframe(train_df)
    metadata.update_column("Type_canonical", sdtype="categorical")
    for col in BINARY_COLUMNS:
        metadata.update_column(col, sdtype="numerical")
    for col in ORDINAL_RANGES:
        metadata.update_column(col, sdtype="numerical")
    return metadata


def _prepare_for_sdv(df: pd.DataFrame) -> pd.DataFrame:
    out = df.copy()
    for col in BINARY_COLUMNS:
        if col in out.columns:
            out[col] = pd.to_numeric(out[col], errors="coerce").fillna(0).clip(0, 1).astype(int)
    return out


def _postprocess(sample: pd.DataFrame) -> pd.DataFrame:
    out = sample.copy()
    for col, (lo, hi) in ORDINAL_RANGES.items():
        if col in out.columns:
            out[col] = out[col].round().clip(lo, hi).astype(int)
    for col in BINARY_COLUMNS:
        if col in out.columns:
            out[col] = out[col].round().clip(0, 1).astype(int)
    if "Type_canonical" in out.columns:
        out["Type_canonical"] = out["Type_canonical"].astype(str)
        out["Type"] = out["Type_canonical"].map(CANONICAL_TO_LEGACY)
    return out


def _train_ctgan(train_df: pd.DataFrame, metadata, epochs: int):
    from sdv.single_table import CTGANSynthesizer

    synthesizer = CTGANSynthesizer(
        metadata,
        epochs=epochs,
        batch_size=min(500, max(100, len(train_df) // 2)),
        verbose=True,
    )
    synthesizer.fit(train_df)
    return synthesizer


def _sample_reject_global(synthesizer, subtype: str, n: int, max_rounds: int = 200) -> pd.DataFrame:
    """Sample rows matching subtype from a globally trained CTGAN."""
    collected: list[pd.DataFrame] = []
    total = 0
    for round_i in range(max_rounds):
        if total >= n:
            break
        batch_size = min(5000, max(500, (n - total) * 10))
        batch = synthesizer.sample(num_rows=batch_size)
        match = batch[batch["Type_canonical"].astype(str) == subtype]
        if len(match):
            collected.append(match)
            total += len(match)
        if round_i % 10 == 0:
            print(f"    reject sampling round {round_i + 1}: have {min(total, n)}/{n}")
    if total < n:
        raise RuntimeError(f"Reject sampling produced only {total}/{n} rows for {subtype}")
    return pd.concat(collected, ignore_index=True).head(n)


def _sample_per_class(train_subset: pd.DataFrame, metadata, n: int, epochs: int) -> pd.DataFrame:
    """Train CTGAN on a single class and sample feature rows."""
    from sdv.metadata import SingleTableMetadata

    features_only = _prepare_for_sdv(train_subset[FEATURE_COLUMNS].copy())
    meta = SingleTableMetadata()
    meta.detect_from_dataframe(features_only)
    for col in FEATURE_COLUMNS:
        meta.update_column(col, sdtype="numerical")

    local_epochs = min(epochs, max(50, epochs * 200 // max(len(features_only), 1)))
    synth = _train_ctgan(features_only, meta, local_epochs)
    generated = synth.sample(num_rows=n)
    generated["Type_canonical"] = train_subset["Type_canonical"].iloc[0]
    return generated


def expand_with_ctgan(
    input_path: Path,
    output_path: Path,
    per_class: int,
    epochs: int,
    seed: int,
) -> pd.DataFrame:
    source = load_and_normalize(input_path)
    train_df = _prepare_for_sdv(source[FEATURE_COLUMNS + ["Type_canonical"]].copy())
    metadata = _build_metadata(train_df)

    print(f"Training global CTGAN on {len(train_df)} rows, epochs={epochs} ...")
    synthesizer = _train_ctgan(train_df, metadata, epochs)

    parts: list[pd.DataFrame] = []
    for subtype in CANONICAL_SUBTYPES:
        existing = source[source["Type_canonical"] == subtype][FEATURE_COLUMNS + ["Type_canonical"]].copy()
        keep_n = min(per_class, len(existing))
        need = per_class - keep_n

        if keep_n:
            kept = existing.head(keep_n).copy()
            kept["Type"] = kept["Type_canonical"].map(CANONICAL_TO_LEGACY)
            parts.append(kept[FEATURE_COLUMNS + ["Type"]])

        print(f"  {subtype}: keep {keep_n}, generate {need}")
        if need == 0:
            continue

        try:
            generated = _sample_reject_global(synthesizer, subtype, need)
            parts.append(_postprocess(generated)[FEATURE_COLUMNS + ["Type"]])
        except RuntimeError as exc:
            print(f"    fallback to per-class CTGAN ({exc})")
            generated = _sample_per_class(existing if len(existing) else source.iloc[:200], metadata, need, epochs)
            parts.append(_postprocess(generated)[FEATURE_COLUMNS + ["Type"]])

    combined = pd.concat(parts, ignore_index=True)
    combined = combined.sample(frac=1.0, random_state=seed).reset_index(drop=True)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    combined.to_csv(output_path, index=False)
    print(f"\nWrote {len(combined)} rows -> {output_path}")
    print("\nType distribution:")
    print(combined["Type"].value_counts().to_string())
    return combined


def main(argv: list[str] | None = None) -> int:
    default_in = _script_dir() / "migraine_data.csv"
    default_out = _script_dir() / "migraine_data_ctgan_20k.csv"

    parser = argparse.ArgumentParser(description="Expand migraine CSV with CTGAN")
    parser.add_argument("--input", type=Path, default=default_in)
    parser.add_argument("--output", type=Path, default=default_out)
    parser.add_argument("--per-class", type=int, default=2000)
    parser.add_argument("--epochs", type=int, default=150)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args(argv)

    if not args.input.is_file():
        print(f"Input not found: {args.input}", file=sys.stderr)
        return 1

    expand_with_ctgan(
        input_path=args.input,
        output_path=args.output,
        per_class=args.per_class,
        epochs=args.epochs,
        seed=args.seed,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
