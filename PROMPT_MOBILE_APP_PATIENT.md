# Prompt: Patient-Side Mobile App for Migraine Attack Data Collection

Use this prompt to brief a developer or AI agent to build a **patient-facing mobile application** for the LLM project. The app collects migraine attack data that feeds into the existing backend (summary API and XGBoost migraine-type classifier).

---

## Context

- **Project:** LLM — machine learning pipelines for health (brain MRI classification + **migraine attack type** from tabular data). See [INTRO.md](INTRO.md).
- **Backend:** 
  - Flask API `POST /api/summary`: accepts a JSON body with attack symptoms; returns a **text summary** and **predicted migraine type** (Type).
  - Migraine model: XGBoost trained on the same feature set; target column is **Type** (migraine type). The app does **not** collect Type from the patient — the backend **predicts** it and returns it; the app should display it.
- **Goal:** A **mobile app for patients** to log each migraine attack by entering the fields below. Data must be submittable to the existing backend and stored (e.g. per patient, per attack) for history and for training.

---

## Data to Collect From the Patient (Per Attack)

Collect exactly these fields for **each migraine attack**. Use the types and options below so the payload matches the backend and the text pipeline (see `model/text/run_pipeline.py`, `model/main.py`, `model/text/predictModel.py`).

| Field | Type | Description / Options | Required |
|-------|------|------------------------|----------|
| **Duration** | Number | Attack duration in **hours** (e.g. 2, 4.5) | Yes |
| **Frequency** | Number | Attack frequency **per month** (e.g. 2, 8) | Yes |
| **Location** | Categorical | Pain location: **Unilateral** \| **Bilateral** (or 1 = unilateral, 2 = bilateral) | Yes |
| **Character** | Categorical | Pain character: **Throbbing** \| **Pressure** (or 1 = throbbing, 2 = pressure) | Yes |
| **Intensity** | Number | Pain intensity **1–10** (integer) | Yes |
| **Nausea** | Binary | 0 = No, 1 = Yes | Yes |
| **Vomit** | Binary | 0 = No, 1 = Yes | Yes |
| **Phonophobia** | Binary | Sound sensitivity: 0 = No, 1 = Yes | Yes |
| **Photophobia** | Binary | Light sensitivity: 0 = No, 1 = Yes | Yes |
| **Visual** | Binary | Visual aura: 0 = No, 1 = Yes | Yes |
| **Sensory** | Binary | Sensory aura: 0 = No, 1 = Yes | Yes |
| **Dysphasia** | Binary | Speech difficulty: 0 = No, 1 = Yes | Yes |
| **Dysarthria** | Binary | Slurred speech: 0 = No, 1 = Yes | Yes |
| **Vertigo** | Binary | 0 = No, 1 = Yes | Yes |
| **Tinnitus** | Binary | 0 = No, 1 = Yes | Yes |
| **Hypoacusis** | Binary | Hearing loss: 0 = No, 1 = Yes | Yes |
| **Diplopia** | Binary | Double vision: 0 = No, 1 = Yes | Yes |
| **Defect** | Binary | Visual field defect: 0 = No, 1 = Yes | Yes |
| **Ataxia** | Binary | 0 = No, 1 = Yes | Yes |
| **Conscience** | Binary | Consciousness disturbance: 0 = No, 1 = Yes | Yes |
| **Paresthesia** | Binary | Tingling/numbness: 0 = No, 1 = Yes | Yes |
| **DPF** | Categorical | Duration/pattern factor (e.g. **Pattern1**, **Pattern2**, etc. — use same categories as in training data or a fixed list) | Yes |
| **Type** | — | **Do not collect from patient.** This is the **predicted migraine type** returned by the backend; show it in the app after submission. | N/A (output only) |

Optional for backend but useful for the app: **Age** (number), **patient_id**, **attack_id**, and **timestamp** for each logged attack.

---

## Functional Requirements

1. **Log a new attack**  
   Single flow (wizard or form) where the patient enters all fields above (except Type). Group fields logically (e.g. “Attack pattern”, “Pain”, “Associated symptoms”, “Aura / neurological”).

2. **Submit to backend**  
   On submit, send a JSON body to `POST /api/summary` with the exact keys expected by the backend (Duration, Frequency, Location, Character, Intensity, Nausea, Vomit, Phonophobia, Photophobia, Visual, Sensory, Dysphasia, Dysarthria, Vertigo, Tinnitus, Hypoacusis, Diplopia, Defect, Ataxia, Conscience, Paresthesia, DPF; optionally Age).  
   Backend returns: `{ "summary": "...", "predicted_migraine_type": "..." }`.  
   **Display** the summary and the **predicted Type** to the patient after submission.

3. **Save attacks locally and/or to your backend**  
   Persist each attack with patient_id and attack_id (or equivalent) so the same schema can be used for the text pipeline (e.g. `patient_*_migraine_attacks.csv` or a REST API that exports the same columns). Optionally sync to a server that stores per-patient attack history.

4. **Attack history**  
   List past attacks (date, duration, intensity, predicted type) and allow viewing full details or re-sending to the summary API if needed.

5. **UX for during an attack**  
   - Minimal taps: large targets, clear labels, sensible defaults (e.g. binary toggles or Yes/No).  
   - Optional: save draft and complete later.  
   - Optional: dark/low-brightness mode (photophobia).  
   - Accessible labels (e.g. “Sound sensitivity” for Phonophobia, “Light sensitivity” for Photophobia).

6. **Offline / connectivity**  
   If possible, allow saving attacks locally when offline and syncing when online; otherwise require network for submit and show a clear error.

---

## Technical Suggestions

- **Platform:** React Native, Flutter, or native (iOS/Android) as per team preference. Prefer one codebase for both platforms.
- **State:** Store form state and list of attacks (e.g. SQLite, AsyncStorage, or local DB); sync to backend when configured.
- **API base URL:** Configurable (e.g. env or in-app settings) pointing to the Flask `POST /api/summary` endpoint.
- **Validation:** Validate numeric ranges (e.g. Intensity 1–10, Duration ≥ 0, Frequency ≥ 0) and required fields before submit. Send categoricals as strings (e.g. "Unilateral", "Throbbing", "Pattern1") or as numbers (1/2) if the backend accepts both (see `model/main.py` and `model/text/predictModel.py`).

---

## Backend Contract (Reference)

- **Endpoint:** `POST /api/summary`  
- **Request:** `Content-Type: application/json`, body: object with keys (Duration, Frequency, Location, Character, Intensity, Nausea, Vomit, Phonophobia, Photophobia, Visual, Sensory, Dysphasia, Dysarthria, Vertigo, Tinnitus, Hypoacusis, Diplopia, Defect, Ataxia, Conscience, Paresthesia, DPF; optionally Age).  
- **Response:** `{ "summary": "string", "predicted_migraine_type": "string" (if available), "symptoms_received": ["..."] }`.  
- **Note:** Backend may use the same feature set to call the XGBoost migraine-type model and return the predicted **Type** as `predicted_migraine_type`. The app should not ask the user for Type; it is an output only.

---

## Data Schema (CSV / Export)

For compatibility with `model/text` (e.g. `run_pipeline.py`, `data_loader.py`), exported or synced data should support columns:

- **patient_id**, **attack_id** (or equivalent identifiers)  
- **Duration, Frequency, Location, Character, Intensity**,  
- **Nausea, Vomit, Phonophobia, Photophobia, Visual, Sensory, Dysphasia, Dysarthria, Vertigo, Tinnitus, Hypoacusis, Diplopia, Defect, Ataxia, Conscience, Paresthesia, DPF**  
- **Type** (filled by backend prediction when submitted; leave blank for drafts or legacy records if needed).

---

## Disclaimer for the App

Include a short disclaimer that the app is for **education and self-tracking only**, that the predicted migraine type is **not a medical diagnosis**, and that users should seek a healthcare provider for diagnosis and treatment. Align with [INTRO.md](INTRO.md) disclaimer.

---

## Summary for the Developer / AI Agent

**Build a patient-facing mobile app that:**

1. Collects one record per migraine attack with: **Duration, Frequency, Location, Character, Intensity**, and all **binary symptom fields** (Nausea, Vomit, Phonophobia, Photophobia, Visual, Sensory, Dysphasia, Dysarthria, Vertigo, Tinnitus, Hypoacusis, Diplopia, Defect, Ataxia, Conscience, Paresthesia) plus **DPF**.
2. Does **not** ask the user for **Type**; receives and displays the **predicted migraine type** from `POST /api/summary`.
3. Submits to the existing Flask `/api/summary` endpoint and shows the returned summary and predicted type.
4. Saves attacks locally (and optionally to a server) with patient_id/attack_id and supports attack history.
5. Is optimized for use during or right after an attack (simple UI, minimal taps, optional draft and dark mode).
6. Exports or syncs data in a schema compatible with the LLM text pipeline (same column names and types).

Use the table and backend contract above as the single source of truth for field names, types, and allowed values.
