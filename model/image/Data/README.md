# Brain image data for classification

## Pipeline setup (DataSet 2 → train → ResNet)

Images in **Data/DataSet 2/kaggle_3m/** are split into class folders under **Data/train/** and used to train the ResNet classifier.

### 1. Install dependencies

From `model/image`:

```bash
pip install -r requirements.txt
```

(Requires: torch, torchvision, Pillow, scikit-learn.)

### 2. Split DataSet 2 into class folders

Reads `Data/DataSet 2/kaggle_3m/data.csv` (Patient → histological_type) and copies non-mask `.tif` images into **Data/train/**:

```bash
python split_data_into_classes.py
```

Result:

| Data/train/   | Description           | Images |
|---------------|-----------------------|--------|
| **glioma_1**  | LGG histological type 1 | 979  |
| **glioma_2**  | LGG histological type 2 | 1,032 |
| **glioma_3**  | LGG histological type 3 | 1,830 |
| **glioma_unknown** | Missing type in CSV | 88 |

### 3. Train the ResNet model

```bash
python run_pipeline.py Data/train
```

### One command (split + train)

```bash
python setup_train.py
```

This runs the split then trains on `Data/train`. Ensure PyTorch is installed first (`pip install -r requirements.txt`).

## Adding migraine images later

Create `Data/train/migraine/` and add migraine brain MRI images, then re-run the pipeline so the model has a migraine class.
