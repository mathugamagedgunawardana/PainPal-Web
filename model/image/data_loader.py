"""
Load brain MRI images from a folder structure for migraine vs tumor classification.
Expected layout: data_dir / class_name / *.png (or *.jpg, *.jpeg)
  e.g. Data/migraine/, Data/glioma/, Data/meningioma/, Data/pituitary/, Data/no_tumor/
"""
import os
import glob
from pathlib import Path

# Default class names: migraine vs tumor types (or no_tumor)
DEFAULT_CLASSES = ["migraine", "glioma", "meningioma", "pituitary", "no_tumor"]
IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".bmp", ".tif", ".tiff")

# Folder names that count as TUMOR (all others = non_tumor) for legacy binary classification
TUMOR_FOLDER_NAMES = {
    "glioma", "glioma_1", "glioma_2", "glioma_3", "glioma_unknown",
    "meningioma", "pituitary",
}
BINARY_CLASS_NAMES = ["non_tumor", "tumor"]  # label 0 = non_tumor, 1 = tumor

# MRI: migraine vs any other folder (other diseases / controls, e.g. glioma, no_tumor)
MIGRAINE_FOLDER_NAMES = frozenset({"migraine"})
BINARY_MIGRAINE_CLASS_NAMES = ["other", "migraine"]  # label 0 = other, 1 = migraine


def get_class_folders(data_dir: str):
    """Return sorted list of subdirs in data_dir that contain images (each = one class)."""
    data_dir = os.path.abspath(data_dir)
    if not os.path.isdir(data_dir):
        raise FileNotFoundError(f"Data directory not found: {data_dir}")
    classes = []
    for name in sorted(os.listdir(data_dir)):
        path = os.path.join(data_dir, name)
        if not os.path.isdir(path):
            continue
        for f in os.listdir(path):
            if f.lower().endswith(IMAGE_EXTENSIONS):
                classes.append(name)
                break
    return classes


def list_image_paths_by_class(data_dir: str):
    """
    Scan data_dir and return a dict: class_name -> list of full paths to images.
    """
    data_dir = os.path.abspath(data_dir)
    classes = get_class_folders(data_dir)
    out = {}
    for cls in classes:
        folder = os.path.join(data_dir, cls)
        paths = []
        for ext in IMAGE_EXTENSIONS:
            paths.extend(glob.glob(os.path.join(folder, "*" + ext)))
        out[cls] = sorted(paths)
    return out


def count_images(data_dir: str):
    """Return total image count and per-class counts."""
    by_class = list_image_paths_by_class(data_dir)
    total = sum(len(p) for p in by_class.values())
    counts = {k: len(v) for k, v in by_class.items()}
    return total, counts


def list_binary_image_paths(data_dir: str, tumor_folder_names=None):
    """
    Return list of (image_path, binary_label) for tumor vs non_tumor.
    binary_label: 0 = non_tumor, 1 = tumor.
    Folder names in tumor_folder_names (default TUMOR_FOLDER_NAMES) -> 1, else -> 0.
    """
    tumor_folder_names = tumor_folder_names or TUMOR_FOLDER_NAMES
    by_class = list_image_paths_by_class(data_dir)
    pairs = []
    for folder_name, paths in by_class.items():
        label = 1 if folder_name in tumor_folder_names else 0
        for p in paths:
            pairs.append((p, label))
    return pairs


def list_migraine_vs_other_paths(data_dir: str, migraine_folder_names=None):
    """
    Return (path, label) for migraine (1) vs other brain MRI classes (0).
    Any folder not in migraine_folder_names (default MIGRAINE_FOLDER_NAMES) is labeled 0.
    """
    positive = migraine_folder_names or MIGRAINE_FOLDER_NAMES
    by_class = list_image_paths_by_class(data_dir)
    pairs = []
    for folder_name, paths in by_class.items():
        label = 1 if folder_name in positive else 0
        for p in paths:
            pairs.append((p, label))
    return pairs
