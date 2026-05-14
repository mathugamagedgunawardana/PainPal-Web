"""
Step 9: Save ResNet model and label mapping for inference.
"""
import os
import json
import torch
from torchvision import models


def save_artifacts(model, class_names, transforms_config=None, out_dir=".", model_name="resnet_brain_model.pt"):
    """
    Save ResNet state_dict, class names, and transform config.
    """
    os.makedirs(out_dir, exist_ok=True)
    artifacts_dir = os.path.join(out_dir, "artifacts")
    os.makedirs(artifacts_dir, exist_ok=True)

    model_path = os.path.join(out_dir, model_name)
    torch.save(model.state_dict(), model_path)
    print(f"  Saved model state -> {model_path}")

    labels_path = os.path.join(artifacts_dir, "class_names.json")
    with open(labels_path, "w") as f:
        json.dump(class_names, f, indent=2)
    print(f"  Saved class names -> {labels_path}")

    if transforms_config:
        cfg_path = os.path.join(artifacts_dir, "transforms_config.json")
        with open(cfg_path, "w") as f:
            json.dump(transforms_config, f, indent=2)
        print(f"  Saved transforms config -> {cfg_path}")

    print("  Step 9 (Save) completed.")


def load_model_for_inference(artifacts_dir=".", device=None):
    """
    Load ResNet + class names for prediction.
    Returns (model, class_names, transforms_config).
    """
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model_path = os.path.join(artifacts_dir, "resnet_brain_model.pt")
    labels_path = os.path.join(artifacts_dir, "artifacts", "class_names.json")
    cfg_path = os.path.join(artifacts_dir, "artifacts", "transforms_config.json")

    with open(labels_path) as f:
        class_names = json.load(f)
    num_classes = len(class_names)
    model = models.resnet18(weights=None)
    model.fc = torch.nn.Linear(model.fc.in_features, num_classes)
    load_kw = {"map_location": device}
    try:
        state = torch.load(model_path, **load_kw, weights_only=True)
    except TypeError:
        state = torch.load(model_path, **load_kw)
    model.load_state_dict(state)
    model = model.to(device)
    model.eval()

    transforms_config = {}
    if os.path.isfile(cfg_path):
        with open(cfg_path) as f:
            transforms_config = json.load(f)
    return model, class_names, transforms_config
