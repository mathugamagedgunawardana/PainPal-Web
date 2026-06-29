"""Shared feature engineering for training and inference."""

from __future__ import annotations

import os
from pathlib import Path

import numpy as np
import pandas as pd

SYMPTOMS_PATH = "sysmptoms.txt"

PROFILE_KEY_MAP = {
    "Throb": "Throb",
    "Nausea": "Nausea",
    "Photo": "Photo",
    "Phono": "Phono",
    "VisualAura": "VisualAura",
    "SensoryAura": "SensoryAura",
    "Speech": "Speech",
    "Weakness": "Weakness",
    "Vertigo": "Vertigo",
    "Tinnitus": "Tinnitus",
    "MonoVisionLoss": "MonoVisionLoss",
    ">72h": ">72h",
    "Hormonal": "Hormonal",
}


def _safe_float(value, default: float = 0.0) -> float:
    try:
        if pd.isna(value):
            return default
        return float(value)
    except Exception:
        return default


def _safe_pct(value) -> float:
    if isinstance(value, str):
        value = value.strip().replace("%", "")
    try:
        return float(value)
    except Exception:
        return 0.0


def load_symptom_profiles(path: str | Path | None = None) -> dict:
    symptoms_path = Path(path or SYMPTOMS_PATH)
    if not symptoms_path.is_file():
        raise FileNotFoundError(f"Symptoms file not found: {symptoms_path}")

    lines = [ln.strip() for ln in symptoms_path.read_text(encoding="utf-8").splitlines() if ln.strip()]
    table_lines = [ln for ln in lines if "|" in ln and not ln.startswith("---")]
    if len(table_lines) < 2:
        raise ValueError(f"Invalid symptoms table format in {symptoms_path}")

    headers = [h.strip() for h in table_lines[0].split("|") if h.strip()]
    profiles = {}
    for ln in table_lines[1:]:
        parts = [p.strip() for p in ln.split("|") if p.strip()]
        if len(parts) != len(headers):
            continue
        row = dict(zip(headers, parts))
        migraine_type = row.pop("Migraine Type", "").strip()
        row.pop("Explanation", None)
        symptom_weights = {k: _safe_pct(v) for k, v in row.items()}
        profiles[migraine_type] = {"symptoms": symptom_weights}
    return profiles


def extract_patient_signal(sample_row: pd.Series) -> dict:
    duration = _safe_float(sample_row.get("Duration", 0))
    duration_over_72h = duration >= 3 or duration >= 72
    weakness = max(
        _safe_float(sample_row.get("Paresthesia", 0)),
        _safe_float(sample_row.get("Ataxia", 0)),
        _safe_float(sample_row.get("Conscience", 0)),
    )
    return {
        "Throb": 100.0 if _safe_float(sample_row.get("Character", 0)) == 1 else 40.0,
        "Nausea": _safe_float(sample_row.get("Nausea", 0)) * 100.0,
        "Photo": _safe_float(sample_row.get("Photophobia", 0)) * 100.0,
        "Phono": _safe_float(sample_row.get("Phonophobia", 0)) * 100.0,
        "VisualAura": min(100.0, _safe_float(sample_row.get("Visual", 0)) * 50.0),
        "SensoryAura": min(100.0, _safe_float(sample_row.get("Sensory", 0)) * 50.0),
        "Speech": min(100.0, _safe_float(sample_row.get("Dysphasia", 0)) * 100.0),
        "Weakness": min(100.0, weakness * 100.0),
        "Vertigo": _safe_float(sample_row.get("Vertigo", 0)) * 100.0,
        "Tinnitus": _safe_float(sample_row.get("Tinnitus", 0)) * 100.0,
        "MonoVisionLoss": _safe_float(sample_row.get("Defect", 0)) * 100.0,
        ">72h": 100.0 if duration_over_72h else 0.0,
        "Hormonal": _safe_float(sample_row.get("DPF", 0)) * 100.0,
    }


def apply_base_features(X: pd.DataFrame) -> pd.DataFrame:
    out = X.copy()
    if "Intensity" in out.columns and "Frequency" in out.columns:
        out["Intensity_x_Freq"] = out["Intensity"] * out["Frequency"]
    aura_cols = [c for c in ["Visual", "Sensory", "Dysphasia"] if c in out.columns]
    if aura_cols:
        aura_sum = out[aura_cols].sum(axis=1)
        out["has_aura"] = (aura_sum > 0).astype(int)
        out["aura_total"] = aura_sum.astype(int)
        out["no_aura"] = (aura_sum == 0).astype(int)
    return out


def apply_profile_score_features(X: pd.DataFrame, symptoms_path: str | Path | None = None) -> pd.DataFrame:
    path = Path(symptoms_path or SYMPTOMS_PATH)
    if not path.is_file():
        return X

    profiles = load_symptom_profiles(path)
    out = X.copy()
    score_rows = []
    for _, row in out.iterrows():
        signal = extract_patient_signal(row)
        scores = {}
        for migraine_type, profile in profiles.items():
            symptoms = profile["symptoms"]
            if not symptoms:
                score = 0.0
            else:
                matches = [
                    1.0 - abs(signal.get(name, 0.0) - expected) / 100.0
                    for name, expected in symptoms.items()
                ]
                score = float(np.clip(np.mean(matches), 0.0, 1.0))
            scores[f"profile_score_{migraine_type}"] = score
        score_rows.append(scores)

    return pd.concat([out, pd.DataFrame(score_rows, index=out.index)], axis=1)


def apply_engineered_features(X: pd.DataFrame, symptoms_path: str | Path | None = None) -> pd.DataFrame:
    return apply_profile_score_features(apply_base_features(X), symptoms_path=symptoms_path)
