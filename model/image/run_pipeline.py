#!/usr/bin/env python3
"""
Brain image classification pipeline (Steps 1–9).
ResNet: classify Migraine vs Not Migraine; if not migraine, tumor type (glioma, meningioma, pituitary, no_tumor).
Same flow as text/run_pipeline: load → prepare → split → train → evaluate → save.
"""
import os
import sys
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Subset, random_split
from torchvision import transforms, datasets, models

from data_loader import get_class_folders, count_images
from save_model import save_artifacts

# Config
DATA_DIR = "Data"  # folder with subdirs: migraine/, glioma/, meningioma/, pituitary/, no_tumor/
IMAGE_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 15
LR = 1e-4
RANDOM_STATE = 42
TEST_RATIO = 0.2
VAL_RATIO = 0.1
ARTIFACTS_DIR = "artifacts"


def step1_load_data(data_dir: str):
    """Step 1: Discover dataset (image folders per class)."""
    print("\n" + "=" * 60)
    print("Step 1: Load data (brain image folders)")
    print("=" * 60)
    data_dir = os.path.abspath(data_dir)
    if not os.path.isdir(data_dir):
        raise FileNotFoundError(f"Data directory not found: {data_dir}")
    classes = get_class_folders(data_dir)
    total, counts = count_images(data_dir)
    print(f"  Data dir: {data_dir}")
    print(f"  Classes: {classes}")
    print(f"  Counts: {counts}")
    print(f"  Total images: {total}")
    return data_dir, classes, total


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


def step6_train_resnet(train_loader, val_loader, num_classes, device):
    """Step 6: Train ResNet18 (pretrained) with new classifier head."""
    print("\n" + "=" * 60)
    print("Step 6: Train ResNet18")
    print("=" * 60)
    model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
    model.fc = nn.Linear(model.fc.in_features, num_classes)
    model = model.to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=LR)
    criterion = nn.CrossEntropyLoss()

    for epoch in range(EPOCHS):
        model.train()
        running_loss = 0.0
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            opt.zero_grad()
            out = model(images)
            loss = criterion(out, labels)
            loss.backward()
            opt.step()
            running_loss += loss.item()
        model.eval()
        correct, total = 0, 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
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
    print("\n  Classification report:\n", classification_report(all_true, all_pred, target_names=class_names))
    print("  Confusion matrix:\n", confusion_matrix(all_true, all_pred))
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

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"  Device: {device}")

    # Step 1
    data_dir, classes, total = step1_load_data(data_dir)
    if total == 0:
        raise ValueError("No images found. Use folder layout: Data/migraine/*.png, Data/glioma/*.png, ...")

    # Step 2–4: datasets and transforms (allow_empty=True for placeholder classes e.g. migraine)
    train_tf, eval_tf = step2_prepare_transforms()
    full_dataset = datasets.ImageFolder(data_dir, transform=eval_tf, allow_empty=True)
    full_dataset_train_tf = datasets.ImageFolder(data_dir, transform=train_tf, allow_empty=True)
    class_names = full_dataset.classes
    num_classes = len(class_names)

    # Step 5: split (we need consistent indices; ImageFolder same order)
    train_ds, val_ds, test_ds = step5_split_dataset(full_dataset)
    # Rebuild train with train_tf
    train_dataset = Subset(
        full_dataset_train_tf,
        train_ds.indices,
    )
    val_loader = DataLoader(Subset(full_dataset, val_ds.indices), batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    test_loader = DataLoader(Subset(full_dataset, test_ds.indices), batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)

    # Step 6
    model = step6_train_resnet(train_loader, val_loader, num_classes, device)

    # Step 7–8
    step7_8_evaluate(model, test_loader, class_names, device)

    # Step 9
    transforms_config = {"image_size": IMAGE_SIZE, "mean": [0.485, 0.456, 0.406], "std": [0.229, 0.224, 0.225]}
    step9_save(model, class_names, transforms_config=transforms_config)

    print("\n" + "=" * 60)
    print("Pipeline finished. Use predict_model.py for inference.")
    print("=" * 60)


if __name__ == "__main__":
    run_pipeline(data_dir=sys.argv[1] if len(sys.argv) > 1 else None)
