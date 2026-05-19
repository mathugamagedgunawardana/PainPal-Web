"""ONNX Runtime inference for MRI (no PyTorch on Vercel)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image


def _softmax(x: np.ndarray) -> np.ndarray:
    e = np.exp(x - np.max(x))
    return e / e.sum()


def _preprocess(pil_img: Image.Image, transforms_config: dict[str, Any]) -> np.ndarray:
    size = int(transforms_config.get("image_size", 224))
    mean = np.array(transforms_config.get("mean", [0.485, 0.456, 0.406]), dtype=np.float32)
    std = np.array(transforms_config.get("std", [0.229, 0.224, 0.225]), dtype=np.float32)
    img = pil_img.convert("RGB").resize((size, size), Image.Resampling.BILINEAR)
    arr = np.asarray(img, dtype=np.float32) / 255.0
    arr = (arr - mean) / std
    return np.transpose(arr, (2, 0, 1))[np.newaxis, ...].astype(np.float32)


def load_onnx_bundle(onnx_path: Path, labels_path: Path, cfg_path: Path):
    import onnxruntime as ort

    with labels_path.open(encoding="utf-8") as f:
        class_names = json.load(f)
    transforms_config: dict[str, Any] = {}
    if cfg_path.is_file():
        with cfg_path.open(encoding="utf-8") as f:
            transforms_config = json.load(f)

    session = ort.InferenceSession(
        str(onnx_path),
        providers=["CPUExecutionProvider"],
    )
    return session, class_names, transforms_config


def predict_from_pil_onnx(
    pil_img: Image.Image,
    session,
    class_names: list[str],
    transforms_config: dict[str, Any] | None = None,
) -> tuple[str, list[float]]:
    cfg = transforms_config or {}
    inp = _preprocess(pil_img, cfg)
    input_name = session.get_inputs()[0].name
    logits = session.run(None, {input_name: inp})[0][0]
    probs = _softmax(logits.astype(np.float64)).tolist()

    positive, threshold = _resolve_positive_class_and_threshold(class_names, cfg)
    if positive and len(class_names) == 2:
        pos_idx = class_names.index(positive)
        if probs[pos_idx] < threshold:
            neg = _binary_negative_class(class_names, positive)
            return neg, probs

    idx = int(np.argmax(probs))
    return str(class_names[idx]), probs


def _resolve_positive_class_and_threshold(
    class_names: list[str], transforms_config: dict
) -> tuple[str | None, float]:
    threshold = float(
        transforms_config.get("confidence_threshold", transforms_config.get("tumor_confidence_threshold", 0.7))
    )
    positive = transforms_config.get("positive_class")
    if positive and positive in class_names:
        return positive, threshold
    if "migraine" in class_names:
        return "migraine", threshold
    if "tumor" in class_names:
        return "tumor", threshold
    return None, threshold


def _binary_negative_class(class_names: list[str], positive: str) -> str:
    for c in class_names:
        if c != positive:
            return c
    return class_names[0]
