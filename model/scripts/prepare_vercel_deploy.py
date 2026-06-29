#!/usr/bin/env python3
"""Copy trained weights into bundled_artifacts/ for Vercel deploy (no Blob required)."""

from __future__ import annotations

import shutil
from pathlib import Path

MODEL_ROOT = Path(__file__).resolve().parents[1]
BUNDLE = MODEL_ROOT / "bundled_artifacts"

COPIES: list[tuple[Path, Path]] = [
    (MODEL_ROOT / "text/xgboost_patient_model.pkl", BUNDLE / "text/xgboost_patient_model.pkl"),
    (MODEL_ROOT / "text/label_encoder.pkl", BUNDLE / "text/label_encoder.pkl"),
    (MODEL_ROOT / "text/artifacts/feature_columns.joblib", BUNDLE / "text/artifacts/feature_columns.joblib"),
    (MODEL_ROOT / "text/artifacts/num_imputer.joblib", BUNDLE / "text/artifacts/num_imputer.joblib"),
    (MODEL_ROOT / "text/artifacts/model_class_ids.joblib", BUNDLE / "text/artifacts/model_class_ids.joblib"),
    (MODEL_ROOT / "text/artifacts/model_metrics.json", BUNDLE / "text/artifacts/model_metrics.json"),
    (MODEL_ROOT / "text/artifacts/next_attack_bundle.joblib", BUNDLE / "text/artifacts/next_attack_bundle.joblib"),
    (MODEL_ROOT / "image/artifacts/class_names.json", BUNDLE / "image/artifacts/class_names.json"),
    (MODEL_ROOT / "image/artifacts/transforms_config.json", BUNDLE / "image/artifacts/transforms_config.json"),
    (MODEL_ROOT / "image/resnet_brain_model.onnx", BUNDLE / "image/resnet_brain_model.onnx"),
]


def main() -> None:
    copied = 0
    missing: list[str] = []
    for src, dest in COPIES:
        if not src.is_file():
            missing.append(str(src.relative_to(MODEL_ROOT)))
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
        mb = dest.stat().st_size / (1024 * 1024)
        print(f"  {dest.relative_to(MODEL_ROOT)} ({mb:.1f} MB)")
        copied += 1

    if missing:
        print("\nMissing (optional for partial deploy):", ", ".join(missing))

    if copied == 0:
        raise SystemExit("Nothing copied. Train tabular models first: cd text && python run_pipeline.py")

    total = sum(f.stat().st_size for f in BUNDLE.rglob("*") if f.is_file()) / (1024 * 1024)
    print(f"\n{copied} files, {total:.0f} MB total in bundled_artifacts/")
    print("Deploy: cd model && vercel --prod  (from this machine; folder is gitignored)")


if __name__ == "__main__":
    main()
