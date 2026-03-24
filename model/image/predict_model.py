"""
Load trained ResNet and predict: tumor vs non_tumor (binary).
"""
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


def predict_image(image_path, model, transform, device, class_names, tumor_confidence_threshold=0.7):
    """
    Predict tumor vs non_tumor. If P(tumor) < threshold, return non_tumor
    so that other / out-of-distribution images are classified as non_tumor.
    """
    img = Image.open(image_path).convert("RGB")
    x = transform(img).unsqueeze(0).to(device)
    with torch.no_grad():
        logits = model(x)
        probs = torch.softmax(logits, dim=1)[0].cpu().tolist()
    prob_dict = dict(zip(class_names, probs))
    tumor_idx = class_names.index("tumor") if "tumor" in class_names else None
    if tumor_idx is not None and prob_dict.get("tumor", 0.0) < tumor_confidence_threshold:
        return "non_tumor", probs
    pred_idx = max(range(len(class_names)), key=lambda i: probs[i])
    return class_names[pred_idx], probs


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

    threshold = transforms_config.get("tumor_confidence_threshold", 0.7)
    pred_label, probs = predict_image(
        image_path, model, transform, device, class_names,
        tumor_confidence_threshold=threshold,
    )
    print("Predicted:", pred_label)
    if pred_label == "non_tumor":
        print("  -> Classified as non_tumor (no tumor / other image).")
    else:
        print("  -> Classified as tumor.")
    print("Probabilities:", dict(zip(class_names, [round(p, 4) for p in probs])))


if __name__ == "__main__":
    main()
