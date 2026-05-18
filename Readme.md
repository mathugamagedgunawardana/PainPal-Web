# LLM Project — Introduction

A repository of **machine learning pipelines and applications** focused on health-related classification: brain MRI (tumor vs non-tumor) and migraine attack type prediction, plus a Next.js client and LiveKit agent components.

---

## What’s in this repo

| Area | Description |
|------|--------------|
| **model/image** | Brain MRI **binary classification** (tumor vs non_tumor) using PyTorch and ResNet18. Train on folder-organized images; run inference on single images. |
| **model/text** | **Migraine attack type** classification from tabular/CSV data using XGBoost. Supports single CSV or per-patient files. |
| **client** | Next.js frontend (student management app) with Prisma, MongoDB, Tailwind, and React. |
| **model/liveAgent** | LiveKit-based agent components for real-time/voice interactions. |

---

## Project structure

```
LLM/
├── INTRO.md                 # This file
├── FIVERR_GIG_CONTENT.md    # Fiverr gig copy for the image model
├── model/
│   ├── image/               # Brain MRI classifier (PyTorch, ResNet18)
│   │   ├── run_pipeline.py  # Full train → evaluate → save pipeline
│   │   ├── predict_model.py # Single-image inference
│   │   ├── data_loader.py   # Load images by class folders
│   │   ├── save_model.py    # Save/load model and config
│   │   ├── PIPELINE.md      # Image pipeline details
│   │   └── requirements.txt
│   ├── text/                # Migraine type classifier (XGBoost)
│   │   ├── run_pipeline.py  # Load → train → evaluate → save
│   │   ├── trainModel.py
│   │   ├── predictModel.py
│   │   ├── data_loader.py   # CSV / per-patient CSVs
│   │   └── save_model.py
│   ├── requirements.txt     # Shared Python deps (image + text)
│   └── liveAgent/           # LiveKit agents (Node)
│       └── package.json
└── client/                  # Next.js app
    └── package.json
```

---

## Brain MRI (image) pipeline

- **Task:** Binary classification: **tumor** vs **non_tumor** from brain MRI images.
- **Model:** ResNet18 (ImageNet-pretrained), fine-tuned with optional class weights and mixed-precision (AMP).
- **Data layout:** One folder per “class” under `Data/`:
  - **Tumor:** e.g. `glioma/`, `meningioma/`, `pituitary/`
  - **Non-tumor:** e.g. `no_tumor/`, `migraine/`, or any other folder name  
  Images: PNG, JPG, JPEG, BMP, TIFF.

**Run training (from repo root):**

```bash
cd model/image
pip install -r ../requirements.txt
python run_pipeline.py
# Or with custom data path:
python run_pipeline.py /path/to/Data
```

**Run inference:**

```bash
python predict_model.py /path/to/brain_image.png
```

Output: predicted label (`tumor` or `non_tumor`) and per-class probabilities. See `model/image/PIPELINE.md` for full steps and file roles.

---

## Migraine (text/tabular) pipeline

- **Task:** Classify **migraine attack type** from tabular features (e.g. location, character, DPF, etc.).
- **Model:** XGBoost; optional GPU; class-weighted training for imbalanced data.
- **Data:** Single CSV (`migraine_data.csv`) or a folder of per-patient CSVs (e.g. `patient_*_migraine_attacks.csv`).

**Run (from repo root):**

```bash
cd model/text
pip install -r ../requirements.txt
python run_pipeline.py
```

Config in `run_pipeline.py`: `DATA_PATH`, `DATA_DIR`, `LABELED_DIR`, `TARGET`, etc.

---

## Model API (FastAPI)

Serves `/predict`, `/predict/next-attack`, `/predict/mri`, and `/health` from `model/main.py`.

**Setup (once):**

```bash
cd model
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements-ml.txt
cp .env.example .env       # set MODEL_API_ENV, CORS_ORIGINS, etc.
```

**Development** (single process, auto-reload when `MODEL_API_ENV` is not `production`):

```bash
cd model
npm run dev
# or: python main.py
```

**Production** (like `npm run start` in Next.js — no reload, `MODEL_API_ENV=production`, pipeline routes off):

```bash
cd model
npm run start
# or: bash scripts/start-prod.sh
```

Set `MODEL_API_URL` / `MODEL_SERVER_PORT` on the Next.js client to this host (e.g. `http://127.0.0.1:8000` locally). On Render/Railway, use their `PORT` env var; the start script reads it automatically.

---

## Client (Next.js)

- **Stack:** Next.js 16, React 19, Prisma, MongoDB, Tailwind, Recharts.
- **Run:**

```bash
cd client
npm install
npm run dev
```

---

## LiveKit agent

- **Stack:** `@livekit/agents`, `@livekit/rtc-node`.
- **Use:** Real-time/voice agent logic. See `model/liveAgent/` for setup.

---

## Tech stack summary

| Component | Languages / frameworks | Key libraries |
|-----------|------------------------|----------------|
| Image model | Python 3 | PyTorch, torchvision (ResNet18), scikit-learn, Pillow |
| Text model | Python 3 | XGBoost, scikit-learn, pandas |
| Client | TypeScript | Next.js, React, Prisma, MongoDB, Tailwind |
| LiveAgent | Node | LiveKit agents, RTC |

Shared Python dependencies (image + text) are in `model/requirements.txt` (PyTorch, XGBoost, Flask, Google APIs, etc.).

---

## Disclaimer

The brain MRI and migraine models are for **education and research** only. They are not medical devices and must not be used as the sole basis for clinical or diagnostic decisions.

---

*For Fiverr-style gig text describing the brain MRI classifier, see [FIVERR_GIG_CONTENT.md](FIVERR_GIG_CONTENT.md).*
