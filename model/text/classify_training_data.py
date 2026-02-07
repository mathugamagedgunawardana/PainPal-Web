#!/usr/bin/env python3
"""
Classify migraine attack rows into migraine types using symptom-based probabilities.
Reads per-patient CSVs from Data/traningData and writes labeled copies to Data/traningData_labeled.
"""
import os
import glob
import math
import argparse
import pandas as pd

# Symptom probabilities (%) per migraine type
MIGRAINE_TYPES = {
    "Migraine without aura": {
        "Throbbing Headache": 90,
        "Nausea/Vomiting": 70,
        "Photo-phobia": 80,
        "Phono-phobia": 70,
        "Visual Aura": 0,
        "Sensory Aura": 0,
        "Speech Disturbance": 0,
        "Weakness/Paralysis": 0,
        "Dizziness/Vertigo": 10,
        "Tinnitus": 5,
        "Monocular Vision Loss": 0,
        "Duration >72h": 0,
        "Hormonal Trigger": 0,
    },
    "Typical aura migraine": {
        "Throbbing Headache": 90,
        "Nausea/Vomiting": 70,
        "Photo-phobia": 80,
        "Phono-phobia": 70,
        "Visual Aura": 90,
        "Sensory Aura": 60,
        "Speech Disturbance": 30,
        "Weakness/Paralysis": 0,
        "Dizziness/Vertigo": 10,
        "Tinnitus": 5,
        "Monocular Vision Loss": 0,
        "Duration >72h": 0,
        "Hormonal Trigger": 0,
    },
    "Brainstem aura migraine": {
        "Throbbing Headache": 80,
        "Nausea/Vomiting": 60,
        "Photo-phobia": 70,
        "Phono-phobia": 60,
        "Visual Aura": 70,
        "Sensory Aura": 20,
        "Speech Disturbance": 40,
        "Weakness/Paralysis": 0,
        "Dizziness/Vertigo": 80,
        "Tinnitus": 50,
        "Monocular Vision Loss": 0,
        "Duration >72h": 0,
        "Hormonal Trigger": 0,
    },
    "Hemiplegic migraine": {
        "Throbbing Headache": 80,
        "Nausea/Vomiting": 60,
        "Photo-phobia": 70,
        "Phono-phobia": 60,
        "Visual Aura": 60,
        "Sensory Aura": 50,
        "Speech Disturbance": 50,
        "Weakness/Paralysis": 90,
        "Dizziness/Vertigo": 20,
        "Tinnitus": 10,
        "Monocular Vision Loss": 0,
        "Duration >72h": 0,
        "Hormonal Trigger": 0,
    },
    "Retinal migraine": {
        "Throbbing Headache": 70,
        "Nausea/Vomiting": 50,
        "Photo-phobia": 60,
        "Phono-phobia": 50,
        "Visual Aura": 50,
        "Sensory Aura": 0,
        "Speech Disturbance": 0,
        "Weakness/Paralysis": 0,
        "Dizziness/Vertigo": 10,
        "Tinnitus": 5,
        "Monocular Vision Loss": 90,
        "Duration >72h": 0,
        "Hormonal Trigger": 0,
    },
    "Chronic migraine": {
        "Throbbing Headache": 100,
        "Nausea/Vomiting": 80,
        "Photo-phobia": 80,
        "Phono-phobia": 70,
        "Visual Aura": 0,
        "Sensory Aura": 0,
        "Speech Disturbance": 0,
        "Weakness/Paralysis": 0,
        "Dizziness/Vertigo": 10,
        "Tinnitus": 5,
        "Monocular Vision Loss": 0,
        "Duration >72h": 0,
        "Hormonal Trigger": 0,
    },
    "Menstrual migraine": {
        "Throbbing Headache": 90,
        "Nausea/Vomiting": 70,
        "Photo-phobia": 70,
        "Phono-phobia": 60,
        "Visual Aura": 0,
        "Sensory Aura": 0,
        "Speech Disturbance": 0,
        "Weakness/Paralysis": 0,
        "Dizziness/Vertigo": 10,
        "Tinnitus": 5,
        "Monocular Vision Loss": 0,
        "Duration >72h": 0,
        "Hormonal Trigger": 100,
    },
    "Vestibular migraine": {
        "Throbbing Headache": 40,
        "Nausea/Vomiting": 60,
        "Photo-phobia": 30,
        "Phono-phobia": 20,
        "Visual Aura": 10,
        "Sensory Aura": 10,
        "Speech Disturbance": 0,
        "Weakness/Paralysis": 0,
        "Dizziness/Vertigo": 90,
        "Tinnitus": 10,
        "Monocular Vision Loss": 0,
        "Duration >72h": 0,
        "Hormonal Trigger": 0,
    },
    "Status migrainosus": {
        "Throbbing Headache": 100,
        "Nausea/Vomiting": 90,
        "Photo-phobia": 90,
        "Phono-phobia": 80,
        "Visual Aura": 20,
        "Sensory Aura": 10,
        "Speech Disturbance": 5,
        "Weakness/Paralysis": 0,
        "Dizziness/Vertigo": 20,
        "Tinnitus": 10,
        "Monocular Vision Loss": 0,
        "Duration >72h": 100,
        "Hormonal Trigger": 0,
    },
    "Probable migraine": {
        "Throbbing Headache": 60,
        "Nausea/Vomiting": 30,
        "Photo-phobia": 30,
        "Phono-phobia": 20,
        "Visual Aura": 10,
        "Sensory Aura": 10,
        "Speech Disturbance": 5,
        "Weakness/Paralysis": 0,
        "Dizziness/Vertigo": 10,
        "Tinnitus": 5,
        "Monocular Vision Loss": 0,
        "Duration >72h": 0,
        "Hormonal Trigger": 0,
    },
}

# Map symptoms to dataset columns (adjust if your schema differs)
SYMPTOM_TO_COLUMNS = {
    "Throbbing Headache": ["Character"],
    "Nausea/Vomiting": ["Nausea", "Vomit"],
    "Photo-phobia": ["Photophobia"],
    "Phono-phobia": ["Phonophobia"],
    "Visual Aura": ["Visual"],
    "Sensory Aura": ["Sensory"],
    "Speech Disturbance": ["Dysphasia", "Dysarthria"],
    "Weakness/Paralysis": ["Ataxia", "Paresthesia"],
    "Dizziness/Vertigo": ["Vertigo"],
    "Tinnitus": ["Tinnitus"],
    "Monocular Vision Loss": ["Defect"],
    "Duration >72h": ["Duration"],
    "Hormonal Trigger": ["DPF"],
}


def symptom_present(row: pd.Series, cols: list[str]) -> int | None:
    values = []
    for col in cols:
        if col in row:
            try:
                values.append(int(row[col]))
            except Exception:
                values.append(0)
    if not values:
        return None
    return 1 if any(v == 1 for v in values) else 0


def score_row(row: pd.Series) -> str:
    best_type = None
    best_score = -1e9

    for mtype, probs in MIGRAINE_TYPES.items():
        score = 0.0
        used = 0
        for symptom, prob in probs.items():
            cols = SYMPTOM_TO_COLUMNS.get(symptom, [])
            present = symptom_present(row, cols)
            if present is None:
                continue
            used += 1
            p = max(0.01, min(0.99, prob / 100.0))
            # Bernoulli log-likelihood
            if present == 1:
                score += math.log(p)
            else:
                score += math.log(1.0 - p)
        # Prefer types with more matched signals if scores tie
        score += used * 0.001
        if score > best_score:
            best_score = score
            best_type = mtype
    return best_type or "Probable migraine"


def _slug(name: str) -> str:
    return "_".join(name.lower().replace("/", " ").replace(">", " ").split())


def classify_folder(data_dir: str, output_dir: str) -> None:
    pattern = os.path.join(data_dir, "patient*_migraine*.csv")
    paths = glob.glob(pattern)
    if not paths:
        paths = glob.glob(os.path.join(data_dir, "patient_*.csv"))
    if not paths:
        raise FileNotFoundError(f"No patient CSVs found in {data_dir}")

    os.makedirs(output_dir, exist_ok=True)

    labeled_frames = []
    for path in paths:
        df = pd.read_csv(path)
        df["MigraineType"] = df.apply(score_row, axis=1)
        labeled_frames.append(df)

    if not labeled_frames:
        raise RuntimeError("No data loaded from training files.")

    combined = pd.concat(labeled_frames, axis=0, ignore_index=True)

    for mtype, group in combined.groupby("MigraineType"):
        type_folder = os.path.join(output_dir, _slug(mtype))
        os.makedirs(type_folder, exist_ok=True)
        out_path = os.path.join(type_folder, f"{_slug(mtype)}.csv")
        group.to_csv(out_path, index=False)
        print(f"Saved: {out_path}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Classify migraine types for training data.")
    parser.add_argument("--data-dir", default="Data/traningData", help="Input folder")
    parser.add_argument("--output-dir", default="Data/traningData_labeled", help="Output folder")
    args = parser.parse_args()

    classify_folder(args.data_dir, args.output_dir)


if __name__ == "__main__":
    main()
