#!/usr/bin/env python3
"""
Brain image classification pipeline (Steps 1–9).
Binary MRI classification: migraine vs other (ResNet18).
Folders named `migraine` -> migraine; glioma, meningioma, pituitary, no_tumor, etc. -> other.
"""
import os
import sys
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset, Subset, random_split
from torchvision import transforms, models
from PIL import Image

import numpy as np
from sklearn.utils.class_weight import compute_class_weight
from data_loader import (
    get_class_folders,
    count_images,
    list_migraine_vs_other_paths,
    MIGRAINE_FOLDER_NAMES,
    BINARY_MIGRAINE_CLASS_NAMES,
)
from save_model import save_artifacts


class BinaryImageDataset(Dataset):
    """Dataset of (image_path, binary_label) pairs (e.g. migraine=1 vs other=0)."""

    def __init__(self, pairs, transform=None):
        self.pairs = pairs  # list of (path, 0|1)
        self.transform = transform

    def __len__(self):
        return len(self.pairs)

    def __getitem__(self, idx):
        path, label = self.pairs[idx]
        img = Image.open(path).convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img, label

# Config
DATA_DIR = "Data"  # folder with subdirs: migraine/, glioma/, meningioma/, pituitary/, no_tumor/
IMAGE_SIZE = 224
BATCH_SIZE = 64   # larger = faster on GPU (reduce to 32 if out-of-memory)
EPOCHS = 10       # reduce for quicker runs (increase for better accuracy)
LR = 1e-4
RANDOM_STATE = 42
TEST_RATIO = 0.2
VAL_RATIO = 0.1
ARTIFACTS_DIR = "artifacts"
# Use GPU for training if available (set to False to force CPU)
USE_GPU = True
# Mixed precision (AMP) on GPU: ~2x faster, set False if you see NaN loss
USE_AMP = True
# DataLoader workers when using GPU (0 = main process only; 4 typical for GPU)
NUM_WORKERS = 4
# At inference: only predict positive class (migraine) if P >= threshold; else "other"
CONFIDENCE_THRESHOLD = 0.7


def _get_device():
    """Return CUDA device if USE_GPU and available, else CPU."""
    if USE_GPU and torch.cuda.is_available():
        device = torch.device("cuda")
        # Optimize conv layers (faster when input sizes are fixed)
        torch.backends.cudnn.benchmark = True
        return device
    return torch.device("cpu")


def _print_gpu_status(device):
    """Print whether GPU is in use and device name (for debugging)."""
    if device.type == "cuda":
        name = torch.cuda.get_device_name(0)
        mem = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
        print(f"  GPU: Yes  ({name}, {mem:.1f} GB)")
    else:
        print("  GPU: No   (using CPU)")


def step1_load_data(data_dir: str):
    """Step 1: Discover dataset and build binary (migraine vs other) image list."""
    print("\n" + "=" * 60)
    print("Step 1: Load data (binary: migraine vs other)")
    print("=" * 60)
    data_dir = os.path.abspath(data_dir)
    if not os.path.isdir(data_dir):
        raise FileNotFoundError(f"Data directory not found: {data_dir}")
    classes = get_class_folders(data_dir)
    total, _counts = count_images(data_dir)
    pairs = list_migraine_vs_other_paths(data_dir)
    n_migraine = sum(1 for _, l in pairs if l == 1)
    n_other = len(pairs) - n_migraine
    print(f"  Data dir: {data_dir}")
    print(f"  Folders (migraine): {[c for c in classes if c in MIGRAINE_FOLDER_NAMES]}")
    print(f"  Folders (other): {[c for c in classes if c not in MIGRAINE_FOLDER_NAMES]}")
    print(f"  Total images: {total}  (migraine={n_migraine}, other={n_other})")
    return data_dir, pairs, total


def step2_prepare_transforms():
    """Step 2–4: Define preprocessing (ImageNet-style for pretrained ResNet)."""
    print("\n" + "=" * 60)
    print("Steps 2–4: Prepare transforms")
    print("=" * 60)
    train_tf = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    eval_tf = transforms.Compose([
        transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])
    print("  Train: resize, augment, normalize (ImageNet)")
    print("  Eval: resize, normalize")
    return train_tf, eval_tf


def step5_split_dataset(dataset, val_ratio=VAL_RATIO, test_ratio=TEST_RATIO):
    """Step 5: Train / val / test split."""
    print("\n" + "=" * 60)
    print("Step 5: Train / val / test split")
    print("=" * 60)
    n = len(dataset)
    test_n = max(1, int(n * test_ratio))
    val_n = max(1, int(n * val_ratio))
    train_n = n - test_n - val_n
    generator = torch.Generator().manual_seed(RANDOM_STATE)
    train_ds, val_ds, test_ds = random_split(dataset, [train_n, val_n, test_n], generator=generator)
    print(f"  Train: {train_n}, Val: {val_n}, Test: {test_n}")
    return train_ds, val_ds, test_ds


def step6_train_resnet(train_loader, val_loader, num_classes, device, use_amp=False, class_weights=None):
    """Step 6: Train ResNet18 (pretrained) with new classifier head. use_amp=True for mixed precision. class_weights helps with imbalanced classes."""
    print("\n" + "=" * 60)
    print("Step 6: Train ResNet18")
    print("=" * 60)
    model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    model = model.to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=LR)
    if class_weights is not None:
        class_weights = class_weights.to(device)
        criterion = nn.CrossEntropyLoss(weight=class_weights)
        print("  Using class weights (balanced) for imbalanced data")
    else:
        criterion = nn.CrossEntropyLoss()
    scaler = torch.amp.GradScaler("cuda") if (use_amp and device.type == "cuda") else None
    if use_amp and device.type == "cuda":
        print("  Using mixed precision (AMP) for faster training")

    for epoch in range(EPOCHS):
        model.train()
        running_loss = 0.0
        for images, labels in train_loader:
            images, labels = images.to(device, non_blocking=True), labels.to(device, non_blocking=True)
            opt.zero_grad(set_to_none=True)
            if scaler is not None:
                with torch.amp.autocast("cuda"):
                    out = model(images)
                    loss = criterion(out, labels)
                scaler.scale(loss).backward()
                scaler.step(opt)
                scaler.update()
            else:
                out = model(images)
                loss = criterion(out, labels)
                loss.backward()
                opt.step()
            running_loss += loss.item()
        model.eval()
        correct, total = 0, 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device, non_blocking=True), labels.to(device, non_blocking=True)
                pred = model(images).argmax(dim=1)
                correct += (pred == labels).sum().item()
                total += labels.size(0)
        acc = correct / total if total else 0
        print(f"  Epoch {epoch + 1}/{EPOCHS}  loss={running_loss / len(train_loader):.4f}  val_acc={acc:.4f}")
    print("  Model training completed.")
    return model


def step7_8_evaluate(model, test_loader, class_names, device):
    """Steps 7–8: Predict and evaluate on test set."""
    print("\n" + "=" * 60)
    print("Steps 7–8: Predict and evaluate")
    print("=" * 60)
    model.eval()
    all_pred, all_true = [], []
    with torch.no_grad():
        for images, labels in test_loader:
            images = images.to(device)
            pred = model(images).argmax(dim=1).cpu()
            all_pred.extend(pred.tolist())
            all_true.extend(labels.tolist())
    from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
    acc = accuracy_score(all_true, all_pred)
    print(f"  Test accuracy: {acc:.4f}")
    # Include all classes even if test set has no samples for some (labels=...)
    labels_idx = list(range(len(class_names)))
    print(
        "\n  Classification report:\n",
        classification_report(
            all_true, all_pred, labels=labels_idx, target_names=class_names, zero_division=0
        ),
    )
    print("  Confusion matrix:\n", confusion_matrix(all_true, all_pred, labels=labels_idx))
    return acc


def step9_save(model, class_names, transforms_config=None):
    """Step 9: Save model and label mapping."""
    print("\n" + "=" * 60)
    print("Step 9: Save model and encoders")
    print("=" * 60)
    save_artifacts(model, class_names, transforms_config=transforms_config)


def run_pipeline(data_dir=None):
    """Run full 9-step pipeline. data_dir should contain subdirs: migraine/, glioma/, etc."""
    data_dir = data_dir or DATA_DIR
    data_dir = os.path.abspath(data_dir)
    os.makedirs(ARTIFACTS_DIR, exist_ok=True)

    device = _get_device()
    num_workers = NUM_WORKERS if device.type == "cuda" else 0
    pin_memory = device.type == "cuda"
    _print_gpu_status(device)
    print(f"  Device: {device}  (num_workers={num_workers}, pin_memory={pin_memory})")

    # Step 1: load paths and binary labels (migraine=1, other=0)
    data_dir, pairs, total = step1_load_data(data_dir)
    if total == 0:
        raise ValueError("No images found. Use folder layout: Data/migraine/*.png, Data/glioma/*.png, ...")

    # Step 2–4: transforms and binary dataset
    train_tf, eval_tf = step2_prepare_transforms()
    full_dataset = BinaryImageDataset(pairs, transform=eval_tf)
    full_dataset_train_tf = BinaryImageDataset(pairs, transform=train_tf)
    class_names = BINARY_MIGRAINE_CLASS_NAMES  # ["other", "migraine"]
    num_classes = 2

    # Step 5: split
    train_ds, val_ds, test_ds = step5_split_dataset(full_dataset)
    train_targets = np.array([pairs[i][1] for i in train_ds.indices])
    unique_classes = np.unique(train_targets)
    cw = compute_class_weight("balanced", classes=unique_classes, y=train_targets)
    class_weights = torch.ones(num_classes, dtype=torch.float32)
    for i, c in enumerate(unique_classes):
        class_weights[c] = float(cw[i])
    train_dataset = Subset(full_dataset_train_tf, train_ds.indices)
    loader_kw = dict(
        batch_size=BATCH_SIZE,
        num_workers=num_workers,
        pin_memory=pin_memory,
        persistent_workers=num_workers > 0,
    )
    val_loader = DataLoader(Subset(full_dataset, val_ds.indices), shuffle=False, **loader_kw)
    test_loader = DataLoader(Subset(full_dataset, test_ds.indices), shuffle=False, **loader_kw)
    train_loader = DataLoader(train_dataset, shuffle=True, **loader_kw)

    # Step 6
    use_amp = USE_AMP and device.type == "cuda"
    model = step6_train_resnet(
        train_loader, val_loader, num_classes, device, use_amp=use_amp, class_weights=class_weights
    )

    # Step 7–8
    step7_8_evaluate(model, test_loader, class_names, device)

    # Step 9 (threshold: low P(migraine) -> "other" for ambiguous / OOD slices)
    transforms_config = {
        "image_size": IMAGE_SIZE,
        "mean": [0.485, 0.456, 0.406],
        "std": [0.229, 0.224, 0.225],
        "positive_class": "migraine",
        "confidence_threshold": CONFIDENCE_THRESHOLD,
        # Backward compatibility for older checkpoints / clients
        "tumor_confidence_threshold": CONFIDENCE_THRESHOLD,
    }
    step9_save(model, class_names, transforms_config=transforms_config)

    print("\n" + "=" * 60)
    print("Pipeline finished. Use predict_model.py for inference.")
    print("=" * 60)


if __name__ == "__main__":
    run_pipeline(data_dir=sys.argv[1] if len(sys.argv) > 1 else None)
