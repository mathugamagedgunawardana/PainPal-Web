# Brain image classification pipeline (ResNet)

Same 9-step flow as the text (XGB) pipeline: **load → prepare → split → train → evaluate → save**.

## Task

- **Classify brain images:** Migraine vs not migraine.
- **If not migraine:** predict tumor/condition type (e.g. glioma, meningioma, pituitary, no_tumor).

Single ResNet multi-class model; classes are inferred from folder names under `Data/`.

## Data layout

Put images in one folder per class:

```
model/image/Data/
  migraine/          # migraine
    img1.png
    img2.jpg
  glioma/
    ...
  meningioma/
    ...
  pituitary/
    ...
  no_tumor/          # no tumor
    ...
```

Supported extensions: `.png`, `.jpg`, `.jpeg`, `.bmp`, `.tif`, `.tiff`.

## Steps (like XGB pipeline)

| Step | Description | File |
|------|-------------|------|
| 1 | Load data (discover classes and image paths) | `run_pipeline.step1_load_data()` |
| 2–4 | Prepare transforms (resize, normalize for ImageNet) | `step2_prepare_transforms()` |
| 5 | Train / val / test split | `step5_split_dataset()` |
| 6 | Train ResNet18 (pretrained) | `step6_train_resnet()` |
| 7–8 | Predict and evaluate | `step7_8_evaluate()` |
| 9 | Save model and class names | `save_model.save_artifacts()` |

## Run

```bash
cd model/image
pip install -r requirements.txt
python run_pipeline.py
# or
python run_pipeline.py /path/to/Data
```

## Inference

```bash
python predict_model.py /path/to/brain_image.png
```

Output: predicted class (e.g. `migraine` or `glioma`) and per-class probabilities.

## Files

| File | Role |
|------|------|
| `data_loader.py` | Discover classes and list image paths by folder |
| `run_pipeline.py` | Full 9-step pipeline (ResNet18) |
| `save_model.py` | Save/load ResNet state and class names |
| `predict_model.py` | Load model and predict on a single image |

## Outputs (Step 9)

- `resnet_brain_model.pt` – ResNet state dict
- `artifacts/class_names.json` – list of class names (e.g. migraine, glioma, …)
- `artifacts/transforms_config.json` – image size and normalization for inference
