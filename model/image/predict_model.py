"""
Load trained ResNet and predict: Migraine vs tumor type (glioma, meningioma, pituitary, no_tumor).
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


def predict_image(image_path, model, transform, device, class_names):
    """Predict class for one image path."""
    img = Image.open(image_path).convert("RGB")
    x = transform(img).unsqueeze(0).to(device)
    with torch.no_grad():
        logits = model(x)
        probs = torch.softmax(logits, dim=1)
        pred_idx = logits.argmax(dim=1).item()
    return class_names[pred_idx], probs[0].cpu().tolist()


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

    pred_label, probs = predict_image(image_path, model, transform, device, class_names)
    print("Predicted:", pred_label)
    if pred_label.lower() == "migraine":
        print("  -> Patient is classified as Migraine.")
    else:
        print(f"  -> Not migraine. Tumor/condition: {pred_label}.")
    print("Probabilities:", dict(zip(class_names, [round(p, 4) for p in probs])))


if __name__ == "__main__":
    main()
