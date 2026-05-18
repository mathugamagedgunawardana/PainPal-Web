# Classification pipeline flow (XGBoost)

All 9 steps and how the files connect.

## Steps overview

| Step | Description | File(s) |
|------|-------------|--------|
| **1** | Load data | `run_pipeline.py` (step1_load_data) / `main.py` / `training_preprocess.py` |
| **2** | Define target | `run_pipeline.py` (step2) / `training_preprocess.py` |
| **3** | Prepare features (encode categoricals, handle missing) | `run_pipeline.py` (step2) / `training_preprocess.py` / `train_xgb.py` |
| **4** | Encode target | `run_pipeline.py` (step2) / `training_preprocess.py` |
| **5** | Train/test split | `run_pipeline.py` (step5_split) |
| **6** | Train model | `run_pipeline.py` (step6_train) / `train_xgb.py` / `trainModel.py` / `main.py` |
| **7** | Predict | `run_pipeline.py` (step7_8) / `predictModel.py` |
| **8** | Evaluate | `run_pipeline.py` (step7_8_evaluate) / `run_xgb_analysis.py` |
| **9** | Save model and encoders | **`save_model.py`** / `run_pipeline.py` (step9_save) |

---

## Recommended flow: single pipeline

Run the full flow (Steps 1–9) with one command:

```bash
cd model/text
python run_pipeline.py
```

- **Input:** `migraine_data.csv`
- **Output:** `xgboost_patient_model.pkl`, `label_encoder.pkl`, `artifacts/feature_encoders.joblib`, `artifacts/feature_columns.joblib`

Then predict on new data:

```bash
python predictModel.py
```

`predictModel.py` loads the artifacts saved in Step 9.

---

## Flow diagram

```
migraine_data.csv
        │
        ▼
┌───────────────────┐
│ Step 1: Load      │  run_pipeline.step1_load_data()
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Steps 2–4: Prepare│  run_pipeline.step2_prepare_features_and_target()
│ (encode, target)  │  or training_preprocess.load_and_preprocess()
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Step 5: Split     │  run_pipeline.step5_split()
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Step 6: Train     │  run_pipeline.step6_train()
│                   │  or train_xgb.train_xgb() / trainModel.py
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Steps 7–8: Eval   │  run_pipeline.step7_8_evaluate()
│                   │  or run_xgb_analysis.py
└─────────┬─────────┘
          ▼
┌───────────────────┐
│ Step 9: Save      │  save_model.save_artifacts()
│                   │  run_pipeline.step9_save()
└─────────┬─────────┘
          ▼
  xgboost_patient_model.pkl
  label_encoder.pkl
  artifacts/
          │
          ▼
┌───────────────────┐
│ Inference         │  predictModel.py
└───────────────────┘
```

---

## Alternative flows

- **Preprocess → train_xgb (5-fold) → save for serving**  
  `training_preprocess.load_and_preprocess("migraine_data.csv")` → save `artifacts/` → `train_xgb(df)` → then `python save_model.py from_artifacts` to write `xgboost_patient_model.pkl` and `label_encoder.pkl` for `predictModel.py`.  
  Note: `train_xgb` uses one-hot (get_dummies); `predictModel.py` expects label-encoded categoricals when using pipeline artifacts. For this path you’d need a predictor that applies the same one-hot and column order (e.g. from `artifacts/xgb_cols.joblib`).

- **Analysis only (no save)**  
  `run_xgb_analysis.py` — load, prepare, split, train, evaluate, feature importance, CV. Does not save the model.

- **Train + save (legacy)**  
  `trainModel.py` — loads `patient_data.csv`, trains XGBoost, saves `xgboost_patient_model.pkl` and `label_encoder.pkl`. `predictModel.py` can use these if you don’t have `artifacts/feature_encoders.joblib`.

---

## File roles

| File | Role |
|------|------|
| **run_pipeline.py** | Orchestrates Steps 1–9; single entry point. |
| **save_model.py** | Step 9: save/load model and encoders. |
| **predictModel.py** | Loads saved artifacts and runs inference. |
| **training_preprocess.py** | Load + impute + scale + encode; writes `artifacts/`. |
| **train_xgb.py** | 5-fold XGBoost training; writes `artifacts/xgb_models.joblib`, `xgb_cols.joblib`. |
| **run_xgb_analysis.py** | Full analysis (no save). |
| **trainModel.py** | Simple train on `patient_data.csv` and save .pkl. |
| **main.py** | Minimal train script on `patient_data.csv`. |
| **train_next_attack.py** | Next-attack RF bundle; inference returns `top_k`, confidence, and history fallback (no retrain required for UI tiers). |

---

## Next-attack forecast (UI)

`POST /predict/next-attack` serves probabilities and optional history fallback when model confidence is low. The Next.js and PainPal clients show top-3 patterns, confidence tiers, and stricter symptom thresholds (≥55%) without retraining the bundle.
