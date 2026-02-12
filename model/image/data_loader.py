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
