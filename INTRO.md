# LLM Project – System Introduction

## 1) Project Overview

**LLM** is a healthcare-focused, multi-module system that combines:
- A **role-based clinical web platform** (Admin / Doctor / Patient)
- **Backend APIs** for healthcare records and AI-assisted outputs
- **Machine learning pipelines** for text/tabular and brain image classification
- A **chatbot service** for role-restricted, SQL-based data querying
- A **voice agent starter module** (LiveKit)

The main objective is to support migraine-related tracking and clinical workflows by collecting patient data, generating structured summaries, and providing model-based predictions.

---

## 2) System Goals

1. Enable secure, role-based access to clinical and patient workflows.
2. Capture and manage migraine events, medication usage, and doctor-patient interactions.
3. Generate AI-assisted summaries and migraine-type predictions from symptom data.
4. Provide reproducible ML training and inference pipelines.
5. Maintain modular architecture for easy scaling and future integration.

---

## 3) High-Level Architecture

### A. Client Layer (`client/`)
- Built with **Next.js + TypeScript**.
- Provides dashboards, pages, and API routes.
- Includes responsive UI components for doctor/patient/admin experiences.
- Supports role-aware navigation and protected route flows.

### B. Application/API Layer
- **Next.js API routes** (`client/app/api/*`) for CRUD and domain operations.
- **Flask service** (`model/main.py`) for:
  - `GET /health`
  - `POST /api/summary` (symptom summary + optional predicted migraine type)
- **Flask chatbot service** (`model/chatbot.py`) using Gemini + SQLAlchemy with role checks.

### C. Data Layer
- **Prisma + MongoDB** schema (`client/prisma/schema.prisma`) for users, profiles, events, logs, links, summaries, insights, appointments, and communications.
- Optional MySQL/SQLite path used by the chatbot module.

### D. AI/ML Layer
- **Text Pipeline** (`model/text/`): XGBoost-based migraine type classification.
- **Image Pipeline** (`model/image/`): ResNet18-based brain image classification.
- Artifacts saved for repeatable inference (models, encoders, feature columns, class names, transform configs).

---

## 4) User Roles and Core Responsibilities

### Admin
- Manage users, doctors, patients, and clinics.
- Oversee system-level records and governance workflows.
- Access broad CRUD operations across modules.

### Doctor
- View assigned patients and migraine history.
- Review summaries and AI insights.
- Manage notes, appointments, and treatment-related workflows.

### Patient
- Log migraine events and symptom details.
- Track personal attack history and medication logs. 
- Receive generated summaries and model-supported outputs.

---

## 5) Core Functional Modules

1. **Authentication & Authorization**
   - Role-based access control (RBAC).
   - Token/session-protected API access.
   - Documented path for Clerk integration.

2. **Clinical Data Management**
   - Doctor profiles, patient profiles, clinic management.
   - Patient-doctor links and status handling.
   - Migraine events and medication logs.

3. **AI Summary Generation**
   - Converts structured symptom input into readable clinical-style summaries.
   - Can return predicted migraine type if model artifacts are available.

4. **Migraine Text Classification**
   - End-to-end tabular pipeline:
     - load → preprocess → split → train → evaluate → save → predict.
   - Uses XGBoost and stored encoders/artifacts.

5. **Brain Image Classification**
   - End-to-end image pipeline with ResNet18:
     - dataset discovery → transforms → split → train → evaluate → save.
   - Supports multi-class image outputs based on folder classes.

6. **Chatbot Query Module**
   - Uses generative AI to convert natural language to SQL.
   - Enforces role-based table authorization before query execution.

7. **Responsive Dashboard UI**
   - Mobile, tablet, and desktop breakpoints.
   - Touch-friendly patient interactions and adaptive layouts.

---

## 6) Key Data Entities

Defined primarily in Prisma schema:
- `User` (role, credentials, OAuth fields)
- `DoctorProfile`
- `PatientProfile`
- `Clinic`
- `PatientDoctorLink`
- `MigraineEvent`
- `MedicationLog`
- `MedicationGroup`
- `DoctorPatientSummary`
- `AIDiagnosticInsight`
- `Appointment`
- `ClinicalNote`
- `Communication`

Enums include `Role`, `LinkStatus`, `MedicationType`, `SummaryType`, `RiskAlertLevel`, and others to standardize logic.

---

## 7) APIs and Contracts (Current)

### Flask Summary API
- **Endpoint:** `POST /api/summary`
- **Input:** Migraine symptom JSON (e.g., Duration, Frequency, Location, Character, Intensity, binary symptoms, DPF, optional Age)
- **Output:**
  - `summary`
  - `symptoms_received`
  - optional `predicted_migraine_type`

### Health Check
- `GET /health` returns service status.

### Next.js Domain APIs
- Multiple REST-style routes under `client/app/api/` for doctors, patients, migraine events, medication logs, summaries, insights, users, and related resources.

---

## 8) Non-Functional Characteristics

- **Security:** Role-based authorization and protected endpoints.
- **Usability:** Responsive layouts and patient-friendly interaction patterns.
- **Scalability:** Modular architecture supports incremental expansion.
- **Maintainability:** Separated concerns across UI, API, DB schema, and ML pipelines.
- **Interoperability:** Shared symptom schema across UI/API/model layers.
- **Reliability:** Health endpoint and structured error handling paths.

---

## 9) Development and Runtime Stack

- **Frontend:** Next.js, TypeScript, Tailwind/CSS modules
- **Backend APIs:** Next.js route handlers + Flask
- **ORM/DB:** Prisma with MongoDB (plus SQLAlchemy path for chatbot)
- **ML/Data:** Python, XGBoost, PyTorch (ResNet18), pandas, joblib
- **AI Integration:** Google Gemini (chatbot and text-generation contexts)
- **Agent Module:** LiveKit starter project included under `testproject/`

---

## 10) Current Status (Interim)

Implemented:
- Multi-role data models and API foundations
- Summary API and prediction integration path
- XGBoost and ResNet training/inference pipelines
- Responsive dashboard groundwork

In progress / to harden:
- Full production authentication integration across all flows
- End-to-end offline sync behaviors for patient-first mobile workflows
- Expanded production-grade testing, observability, and scale benchmarking

---

## 11) Safety Disclaimer

This system is intended for **education, research, and self-tracking support**. Any predicted migraine type or AI-generated output is **not a medical diagnosis** and must not replace professional clinical judgment. Users should consult qualified healthcare providers for diagnosis and treatment decisions.
