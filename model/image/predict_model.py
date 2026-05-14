"""
Load trained ResNet18 and predict migraine vs other (binary), or legacy tumor vs non_tumor.
"""
from __future__ import annotations

import os
import sys
import torch
from torchvision import transforms
from PIL import Image

from save_model import load_model_for_inference


def get_transform(transforms_config):
    """Build eval transform from config."""
    size = transforms_config.get("image_size", 224)
    mean = transforms_config.get("mean", [0.485, 0.456, 0.406])
    std = transforms_config.get("std", [0.229, 0.224, 0.225])
    return transforms.Compose([
        transforms.Resize((size, size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=mean, std=std),
    ])


def _resolve_positive_class_and_threshold(class_names: list[str], transforms_config: dict) -> tuple[str | None, float]:
    """Binary threshold gating: require P(positive_class) >= threshold to predict that class."""
    cfg = transforms_config or {}
    threshold = float(cfg.get("confidence_threshold", cfg.get("tumor_confidence_threshold", 0.7)))
    positive = cfg.get("positive_class")
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


def predict_from_pil(
    pil_img: Image.Image,
    model,
    transform,
    device,
    class_names: list[str],
    transforms_config: dict | None = None,
):
    """
    Return (predicted_label, probabilities list aligned with class_names).
    For binary checkpoints with a configured positive_class, if P(positive) < threshold
    the other class is returned (conservative for OOD / ambiguous slices).
    """
    transforms_config = transforms_config or {}
    x = transform(pil_img).unsqueeze(0).to(device)
    with torch.no_grad():
        logits = model(x)
        probs = torch.softmax(logits, dim=1)[0].cpu().tolist()
    positive, threshold = _resolve_positive_class_and_threshold(class_names, transforms_config)
    if positive is not None and len(class_names) == 2:
        p_pos = dict(zip(class_names, probs)).get(positive, 0.0)
        if p_pos < threshold:
            return _binary_negative_class(class_names, positive), probs
    pred_idx = max(range(len(class_names)), key=lambda i: probs[i])
    return class_names[pred_idx], probs


def predict_image(
    image_path: str,
    model,
    transform,
    device,
    class_names: list[str],
    transforms_config: dict | None = None,
):
    """Predict from file path (RGB)."""
    img = Image.open(image_path).convert("RGB")
    return predict_from_pil(img, model, transform, device, class_names, transforms_config)


def main():
    base = os.path.dirname(os.path.abspath(__file__))
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model, class_names, transforms_config = load_model_for_inference(base, device)
    transform = get_transform(transforms_config)

    if len(sys.argv) < 2:
        print("Usage: python predict_model.py <path_to_brain_image.png>")
        print("Classes:", class_names)
        return
    image_path = sys.argv[1]
    if not os.path.isfile(image_path):
        print("File not found:", image_path)
        return

    pred_label, probs = predict_image(
        image_path, model, transform, device, class_names, transforms_config
    )
    print("Predicted:", pred_label)
    print("Probabilities:", dict(zip(class_names, [round(p, 4) for p in probs])))


if __name__ == "__main__":
    main()
