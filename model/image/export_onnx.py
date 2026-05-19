#!/usr/bin/env python3
"""
Export ResNet18 weights to ONNX for Vercel (run locally where torch is installed).

  cd model/image
  python export_onnx.py

Writes resnet_brain_model.onnx next to resnet_brain_model.pt, then upload via:
  python ../scripts/publish_vercel_artifacts.py
"""

from __future__ import annotations

import json
from pathlib import Path

import torch


def main() -> None:
    base = Path(__file__).resolve().parent
    pt = base / "resnet_brain_model.pt"
    labels = base / "artifacts" / "class_names.json"
    cfg = base / "artifacts" / "transforms_config.json"
    out = base / "resnet_brain_model.onnx"

    if not pt.is_file() or not labels.is_file():
        raise SystemExit(f"Missing {pt} or {labels}. Train MRI pipeline first.")

    from save_model import load_model_for_inference

    device = torch.device("cpu")
    model, class_names, transforms_config = load_model_for_inference(str(base), device)
    model.eval()

    size = int(transforms_config.get("image_size", 224))
    dummy = torch.randn(1, 3, size, size, device=device)
    torch.onnx.export(
        model,
        dummy,
        out,
        input_names=["input"],
        output_names=["logits"],
        dynamic_axes={"input": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=17,
    )
    print(f"Wrote {out} ({out.stat().st_size // (1024 * 1024)} MB)")
    print(f"Classes ({len(class_names)}): {class_names}")
    if cfg.is_file():
        print(f"Config: {json.loads(cfg.read_text())}")


if __name__ == "__main__":
    main()
