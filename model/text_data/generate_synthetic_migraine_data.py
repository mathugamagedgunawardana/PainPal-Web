#!/usr/bin/env python3
"""
Generate practical migraine training rows from clinical symptom profiles.

Uses sysmptoms.txt (same profiles as the app/pipeline) to sample realistic
attack features per migraine subtype, then combines them with real labeled rows.

Usage:
  python generate_synthetic_migraine_data.py
  python generate_synthetic_migraine_data.py --per-class 400 --seed 42
  python generate_synthetic_migraine_data.py --input traning_data/migraine_data.csv --output traning_data/migraine_data_training.csv
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd

from prepare_pipeline_csv import (
    CANONICAL_SUBTYPES,
    FEATURE_COLUMNS,
    LEGACY_TO_CANONICAL,
    convert_migraine_data,
)

AUGMENT_BOOST_CLASSES = {
    "Migraine_without_aura",
    "Typical_aura_migraine",
    "Brainstem_aura_migraine",
    "Hemiplegic_migraine",
    "Probable_migraine",
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

HEMIPLEGIC_LEGACY = ["Familial hemiplegic migraine", "Sporadic hemiplegic migraine"]

# Map sysmptoms.txt column names -> generation keys used below
PROFILE_KEY_MAP = {
    "Throb": "throb",
    "Nausea": "nausea",
    "Photo": "photo",
    "Phono": "phono",
    "VisualAura": "visual_aura",
    "SensoryAura": "sensory_aura",
    "Speech": "speech",
    "Weakness": "weakness",
    "Vertigo": "vertigo",
    "Tinnitus": "tinnitus",
    "MonoVisionLoss": "mono_vision",
    ">72h": "long_duration",
    "Hormonal": "hormonal",
}


def _script_dir() -> Path:
    return Path(__file__).resolve().parent


def _default_symptoms_path() -> Path:
    return _script_dir().parent / "text" / "sysmptoms.txt"


def _safe_pct(value: str) -> float:
    return float(str(value).strip().replace("%", "") or 0)


def load_symptom_profiles(path: Path) -> dict[str, dict[str, float]]:
    """Parse sysmptoms.txt into per-canonical-type probability profiles (0..100)."""
    if not path.is_file():
        raise FileNotFoundError(f"Symptoms file not found: {path}")

    lines = [ln.strip() for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip()]
    table_lines = [ln for ln in lines if "|" in ln and not ln.startswith("---")]
    if len(table_lines) < 2:
        raise ValueError(f"Invalid symptoms table in {path}")

    headers = [h.strip() for h in table_lines[0].split("|") if h.strip()]
    profiles: dict[str, dict[str, float]] = {}
    for ln in table_lines[1:]:
        parts = [p.strip() for p in ln.split("|") if p.strip()]
        if len(parts) != len(headers):
            continue
        row = dict(zip(headers, parts))
        migraine_type = row.pop("Migraine Type", "").strip()
        row.pop("Explanation", None)
        mapped: dict[str, float] = {}
        for header, key in PROFILE_KEY_MAP.items():
            if header in row:
                mapped[key] = _safe_pct(row[header])
        profiles[migraine_type] = mapped
    return profiles


def _canonical_type(raw: str) -> str:
    label = str(raw).strip()
    if label in CANONICAL_SUBTYPES:
        return label
    if label in LEGACY_TO_CANONICAL:
        return LEGACY_TO_CANONICAL[label]
    raise ValueError(f"Unknown Type label: {raw!r}")


def _bernoulli(rng: np.random.Generator, prob_pct: float) -> int:
    p = float(np.clip(prob_pct / 100.0, 0.02, 0.98))
    return int(rng.random() < p)


def _calibrate_from_real(real_df: pd.DataFrame) -> dict[str, np.ndarray]:
    """Use real attack statistics for age/location when available."""
    stats: dict[str, np.ndarray] = {}
    if real_df is None or real_df.empty:
        return stats
    if "Age" in real_df.columns:
        ages = pd.to_numeric(real_df["Age"], errors="coerce").dropna()
        if len(ages):
            stats["ages"] = ages.to_numpy(dtype=float)
    if "Location" in real_df.columns:
        loc = pd.to_numeric(real_df["Location"], errors="coerce").dropna()
        if len(loc):
            stats["locations"] = loc.to_numpy(dtype=float)
    return stats


def _generate_row(
    rng: np.random.Generator,
    canonical: str,
    profile: dict[str, float],
    *,
    hemiplegic_variant: str = "",
    calib: dict[str, np.ndarray] | None = None,
) -> dict:
    calib = calib or {}

    throb = _bernoulli(rng, profile.get("throb", 60))
    nausea = _bernoulli(rng, profile.get("nausea", 40))
    vomit = int(nausea and rng.random() < 0.55)
    photophobia = _bernoulli(rng, profile.get("photo", 40))
    phonophobia = _bernoulli(rng, profile.get("phono", 30))
    visual_aura = _bernoulli(rng, profile.get("visual_aura", 0))
    sensory_aura = _bernoulli(rng, profile.get("sensory_aura", 0))
    speech = _bernoulli(rng, profile.get("speech", 0))
    weakness = _bernoulli(rng, profile.get("weakness", 0))
    vertigo = _bernoulli(rng, profile.get("vertigo", 0))
    tinnitus = _bernoulli(rng, profile.get("tinnitus", 0))
    vision_loss = _bernoulli(rng, profile.get("mono_vision", 0))
    long_duration = _bernoulli(rng, profile.get("long_duration", 0))
    hormonal = _bernoulli(rng, profile.get("hormonal", 0))

    if canonical == "Chronic_migraine":
        frequency = int(rng.integers(6, 9))
    elif canonical == "Probable_migraine":
        frequency = int(rng.integers(1, 5))
    elif canonical == "Vestibular_migraine":
        frequency = int(rng.integers(2, 7))
    else:
        frequency = int(rng.integers(1, 9))

    if long_duration or canonical == "Status_migrainosus":
        duration = 3
    else:
        duration = int(rng.integers(1, 3))

    if canonical in ("Status_migrainosus", "Chronic_migraine"):
        intensity = int(rng.integers(2, 4))
    elif canonical == "Probable_migraine":
        intensity = int(rng.integers(1, 3))
    elif canonical == "Vestibular_migraine":
        intensity = int(rng.integers(1, 3))
    else:
        intensity = int(rng.integers(1, 4))

    visual = int(rng.integers(1, 5)) if visual_aura else 0
    sensory = int(rng.integers(1, 3)) if sensory_aura else 0

    if canonical == "Migraine_without_aura":
        visual = sensory = 0
        speech = 0
        visual_aura = sensory_aura = False
        frequency = int(rng.integers(1, 6))
        vertigo = int(rng.random() < 0.12)
        tinnitus = int(rng.random() < 0.06)
    elif canonical == "Typical_aura_migraine":
        if not visual_aura and not sensory_aura:
            visual_aura = True
        visual = int(rng.integers(1, 5)) if visual_aura else 0
        sensory = int(rng.integers(1, 3)) if sensory_aura else 0
    elif canonical == "Retinal_migraine":
        vision_loss = 1
        visual = int(rng.integers(1, 4))
    elif canonical == "Menstrual_migraine":
        hormonal = 1
    elif canonical == "Vestibular_migraine":
        vertigo = 1
        tinnitus = int(rng.random() < 0.35)
    elif canonical == "Status_migrainosus":
        long_duration = True
        duration = 3
        intensity = int(rng.integers(2, 4))
    elif canonical == "Chronic_migraine":
        frequency = int(rng.integers(6, 9))
    elif canonical == "Brainstem_aura_migraine":
        vertigo = int(rng.random() < 0.85)
        tinnitus = int(rng.random() < 0.55)
        visual = int(rng.integers(1, 4)) if visual_aura or rng.random() < 0.7 else 0
    elif canonical == "Hemiplegic_migraine":
        weakness = 1
        visual = int(rng.integers(1, 4)) if visual_aura or rng.random() < 0.6 else 0
        sensory = int(rng.integers(1, 3)) if sensory_aura or rng.random() < 0.5 else 0
        speech = int(rng.random() < 0.55)
    elif canonical == "Probable_migraine":
        nausea = int(rng.random() < 0.35)
        photophobia = int(rng.random() < 0.3)
        phonophobia = int(rng.random() < 0.2)

    legacy_type = CANONICAL_TO_LEGACY[canonical]
    if canonical == "Hemiplegic_migraine" and hemiplegic_variant:
        legacy_type = hemiplegic_variant

    if "ages" in calib and len(calib["ages"]):
        age = int(rng.choice(calib["ages"]))
    else:
        age = int(rng.integers(16, 68))

    if "locations" in calib and len(calib["locations"]):
        location = int(rng.choice(calib["locations"]))
    else:
        location = int(rng.choice([1, 1, 1, 2, 0]))

    return {
        "Age": age,
        "Duration": duration,
        "Frequency": frequency,
        "Location": location,
        "Character": 1 if throb else int(rng.choice([0, 2])),
        "Intensity": intensity,
        "Nausea": nausea,
        "Vomit": vomit,
        "Phonophobia": phonophobia,
        "Photophobia": photophobia,
        "Visual": visual,
        "Sensory": sensory,
        "Dysphasia": speech,
        "Dysarthria": int(speech and rng.random() < 0.5),
        "Vertigo": vertigo,
        "Tinnitus": tinnitus,
        "Hypoacusis": int(tinnitus and rng.random() < 0.3),
        "Diplopia": int(vertigo and rng.random() < 0.25),
        "Defect": vision_loss,
        "Ataxia": int(weakness and rng.random() < 0.4),
        "Conscience": int(weakness and rng.random() < 0.2),
        "Paresthesia": 1 if canonical == "Hemiplegic_migraine" else int(weakness and rng.random() < 0.6),
        "DPF": hormonal,
        "Type": legacy_type,
    }


def generate_practical_rows(
    per_class: int,
    *,
    seed: int = 42,
    symptoms_path: Path | None = None,
    calib_df: pd.DataFrame | None = None,
) -> pd.DataFrame:
    """Generate balanced practical rows for all canonical migraine subtypes."""
    profiles = load_symptom_profiles(symptoms_path or _default_symptoms_path())
    missing = [c for c in CANONICAL_SUBTYPES if c not in profiles]
    if missing:
        raise ValueError(f"Missing profiles for: {missing}")

    rng = np.random.default_rng(seed)
    calib = _calibrate_from_real(calib_df)
    records: list[dict] = []
    for canonical in CANONICAL_SUBTYPES:
        for i in range(per_class):
            variant = HEMIPLEGIC_LEGACY[i % 2] if canonical == "Hemiplegic_migraine" else ""
            records.append(
                _generate_row(
                    rng,
                    canonical,
                    profiles[canonical],
                    hemiplegic_variant=variant,
                    calib=calib,
                )
            )
    return pd.DataFrame(records, columns=FEATURE_COLUMNS + ["Type"])


def build_training_dataset(
    input_path: Path,
    output_path: Path,
    *,
    per_class: int = 400,
    weak_class_extra: int = 200,
    weak_class_real_threshold: int = 50,
    seed: int = 42,
    symptoms_path: Path | None = None,
    pipeline_ready: bool = True,
) -> pd.DataFrame:
    """
    Keep all real labeled rows and add profile-based synthetic rows per class
    until each canonical subtype reaches per_class total rows.
    """
    if not input_path.is_file():
        raise FileNotFoundError(f"Real training CSV not found: {input_path}")

    real_df = pd.read_csv(input_path)
    real_df = real_df[[c for c in FEATURE_COLUMNS + ["Type"] if c in real_df.columns]].copy()
    real_df["_canonical"] = real_df["Type"].map(_canonical_type)

    profiles_path = symptoms_path or _default_symptoms_path()
    profiles = load_symptom_profiles(profiles_path)
    rng = np.random.default_rng(seed)
    calib = _calibrate_from_real(real_df)

    parts: list[pd.DataFrame] = [real_df.drop(columns=["_canonical"])]
    for canonical in CANONICAL_SUBTYPES:
        existing = real_df[real_df["_canonical"] == canonical]
        target_rows = (
            per_class + weak_class_extra
            if canonical in AUGMENT_BOOST_CLASSES or len(existing) < weak_class_real_threshold
            else per_class
        )
        need = max(0, target_rows - len(existing))
        if need == 0:
            continue
        generated: list[dict] = []
        for i in range(need):
            variant = HEMIPLEGIC_LEGACY[i % 2] if canonical == "Hemiplegic_migraine" else ""
            generated.append(
                _generate_row(
                    rng,
                    canonical,
                    profiles[canonical],
                    hemiplegic_variant=variant,
                    calib=calib,
                )
            )
        parts.append(pd.DataFrame(generated, columns=FEATURE_COLUMNS + ["Type"]))

    combined = pd.concat(parts, ignore_index=True).sample(frac=1.0, random_state=seed).reset_index(drop=True)
    if pipeline_ready:
        combined = convert_migraine_data(combined)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    combined.to_csv(output_path, index=False)
    return combined


def main(argv: list[str] | None = None) -> int:
    base = _script_dir()
    default_in = base / "traning_data" / "migraine_data.csv"
    default_out = base / "traning_data" / "migraine_data_training.csv"

    parser = argparse.ArgumentParser(description="Generate practical migraine training data")
    parser.add_argument("--input", type=Path, default=default_in, help="Real labeled CSV")
    parser.add_argument("--output", type=Path, default=default_out, help="Combined training CSV")
    parser.add_argument("--per-class", type=int, default=400, help="Target rows per migraine subtype")
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--symptoms", type=Path, default=None, help="Path to sysmptoms.txt")
    parser.add_argument(
        "--synthetic-only",
        type=Path,
        default=None,
        help="Write only generated rows (no real data) to this path",
    )
    args = parser.parse_args(argv)

    if args.synthetic_only:
        synth = generate_practical_rows(
            args.per_class,
            seed=args.seed,
            symptoms_path=args.symptoms,
            calib_df=pd.read_csv(args.input) if args.input.is_file() else None,
        )
        args.synthetic_only.parent.mkdir(parents=True, exist_ok=True)
        synth.to_csv(args.synthetic_only, index=False)
        print(f"Wrote {len(synth)} synthetic-only rows -> {args.synthetic_only}")
        return 0

    if not args.input.is_file():
        print(f"Input file not found: {args.input}", file=sys.stderr)
        return 1

    combined = build_training_dataset(
        args.input,
        args.output,
        per_class=args.per_class,
        seed=args.seed,
        symptoms_path=args.symptoms,
    )
    type_col = "Type" if "Type" in combined.columns else "MigraineType"
    print(f"Wrote {len(combined)} training rows -> {args.output}")
    print(combined[type_col].value_counts().to_string())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
