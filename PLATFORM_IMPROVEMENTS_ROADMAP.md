# Platform Improvements: Making It More Useful for Doctors & Patients

This document outlines concrete improvements to make the migraine/healthcare platform more valuable for **doctors** and **patients**, based on the current codebase (schema, APIs, and doctor UI).

---

## Current State (Summary)

- **Doctors**: Full UI under `/doctor/*` (overview, patients list/detail, approvals, analytics, settings). Patient list and detail use real APIs (`/api/patients`, `/api/patients/[id]`). Overview and analytics rely on **mock data**.
- **Patients**: Sidebar and auth redirect to `/patient/*` (overview, episodes, treatments, appointments, reports, messages, settings, notifications), but **no patient pages exist** — patients have no usable UI.
- **Backend**: Schema and APIs support migraine events, medication logs, appointments, clinical notes, communications, AI insights, and doctor–patient links.

---

## 1. Patient-Facing: Build the Missing Patient Experience

**Impact: High — patients currently have no way to use the platform.**

| Priority | Feature | Description |
|----------|---------|-------------|
| **P0** | **Patient layout & dashboard** | Add `app/(roles)/patient/layout.tsx` and redirect to `/patient/overview` or `/patient/dashboard`. Reuse `Sidebar` with `userRole="patient"` so patients see their nav (Overview, My Episodes, Treatments, Appointments, etc.). |
| **P0** | **Patient overview** | Single page: greeting, next appointment, last migraine summary, adherence snapshot, link to “Log episode” and “My treatments”. Use `GET /api/patients` (patient sees only self) and existing APIs for events/meds. |
| **P0** | **Log migraine episode** | Form to create a migraine event: date/time, severity (1–10), duration, symptoms (checkboxes or tags), triggers (multi-select), medications taken (from active medication groups). POST to `/api/migraine-events`. |
| **P0** | **My episodes** | List/timeline of patient’s migraine events (from `/api/migraine-events` or patient-scoped query). Filter by date range; show severity, duration, triggers. Optional: link to “Edit” for recent events. |
| **P1** | **My treatments** | Show medication groups and meds prescribed by their doctor; log “taken” (POST to `/api/medication-logs`). Show adherence (from API or computed). |
| **P1** | **Appointments** | List upcoming/past appointments (from `/api/appointments` or patient-scoped endpoint). Show date, doctor, type, status. Optional: “Request appointment” or link to clinic. |
| **P1** | **Messages / communication** | List communications from doctor (from `/api/communications` or similar). Allow sending a message (if you add POST and in-app channel). |
| **P2** | **Reports** | Placeholder or PDF export of episode history / summary for personal use or to bring to another provider. |
| **P2** | **Request doctor link** | Flow for patient to request link to a doctor (e.g. by code or email); creates PENDING link so doctor can approve in existing Approve UI. |

Implementing **P0** gives patients a real reason to use the app (see their data, log episodes, see treatments). **P1** makes it a full patient companion.

---

## 2. Doctor-Facing: Replace Mock Data & Add Workflow Tools

**Impact: High — doctors need accurate data and less friction.**

| Priority | Feature | Description |
|----------|---------|-------------|
| **P0** | **Overview from real data** | Replace mock data in `doctor/overview/page.tsx` with API calls: e.g. aggregate from `/api/patients` (count, high-risk count), recent activities from migraine events or summaries, upcoming appointments from a dedicated endpoint or from patient list. |
| **P0** | **Analytics from real data** | In `doctor/analytics/page.tsx` and `doctor/patients/analytics/page.tsx`, replace mock stats and charts with: (1) Patient-level aggregates (event count, severity, adherence) from existing APIs; (2) Trigger distribution from `MigraineEvent.perceivedTriggers`; (3) Risk list from real adherence + frequency. |
| **P1** | **In-app “Add note” and “Send message”** | Wire “Add Note” and “Send Message” on the patient detail page to POST to `/api/clinical-notes` and `/api/communications` (or create these endpoints if they don’t exist). So doctors can act without leaving the app. |
| **P1** | **Prescribe / edit medication groups** | From patient detail, allow doctor to add or edit `MedicationGroup` (name, type PREVENTIVE/RESCUE, list of meds). Expose via API if not already (e.g. `POST/GET /api/medication-groups` or under patient). |
| **P1** | **Schedule appointment** | Button to create an appointment for the selected patient (date, type, notes). POST to appointments API. Show in “Next steps” and in Appointments tab. |
| **P2** | **AI summary on demand** | Trigger generation of `DoctorPatientSummary` (or similar) when doctor opens a patient, and show “Weekly summary” / “Treatment outcome” in a dedicated card or tab. |
| **P2** | **Alerts / high-risk list** | Dedicated “High risk” widget or page: patients with recent spike in frequency, low adherence, or `AIDiagnosticInsight.riskAlertLevel === HIGH`. |
| **P2** | **Export for EHR** | Use `Clinic.ehrSystemEndpoint` (and any existing EHR integration) to send summary or key metrics when doctor clicks “Send to EHR”. |

These changes make the doctor dashboard trustworthy (real data) and actionable (notes, messages, prescriptions, appointments).

---

## 3. Cross-Cutting: Shared Value for Both

| Priority | Feature | Description |
|----------|---------|-------------|
| **P1** | **Notifications** | Notifications table or service: e.g. “New episode logged”, “Doctor added a note”, “Appointment in 24h”. Show in header/sidebar for both roles; optional email/push later. |
| **P1** | **Unified “View analytics”** | Ensure “View Analytics” from patient detail goes to a patient-specific analytics page that loads that patient’s ID (e.g. `/doctor/patients/analytics?patientId=...`) and that page uses real API data for that patient. |
| **P2** | **AI insights on patient detail** | Surface `AIDiagnosticInsight` (risk level, key contributors) on the patient detail view so doctors see diagnostic hints at a glance. |
| **P2** | **Patient-facing insights** | Optional “Your insights” for patients: e.g. “Your triggers this month”, “Adherence trend”, from same data the doctor sees (read-only, patient-scoped). |
| **P2** | **Mobile-friendly / PWA** | Responsive layout and optional PWA so patients can quickly log an episode or check meds on their phone. |

---

## 4. Quick Wins (Low Effort, High Perceived Value)

1. **Patient 404 fix**  
   Create a minimal `app/(roles)/patient/layout.tsx` and `app/(roles)/patient/overview/page.tsx` (or `dashboard/page.tsx`) that shows “Welcome, [name]” and a single card: “Your care team” or “Log your first episode” with a link. Prevents 404 after login and sets the stage for full patient UI.

2. **Doctor: real “Recent activity”**  
   On doctor overview, replace mock `recentActivities` with last N events: e.g. “Patient X logged an episode”, “Note added for Patient Y”, from your DB.

3. **Doctor: “Next appointment” link**  
   On patient detail, make “Next appointment” (and “View Analytics”) open the correct page with `patientId` so the doctor doesn’t have to re-select the patient.

4. **Adherence and risk from API**  
   Ensure patient list and detail always compute risk and adherence from real `MigraineEvent` and `MedicationGroup`/`MedicationLog` data (you already do part of this in `/api/patients`); remove any remaining mock risk labels.

---

## 5. Suggested Implementation Order

1. **Patient:** Layout + overview (or dashboard) so patient login lands on a real page.
2. **Patient:** Log episode + My episodes (core value).
3. **Doctor:** Overview and analytics from real APIs (trust).
4. **Doctor:** Add note + Send message + (if needed) appointments and medication groups (actionability).
5. **Patient:** My treatments + Appointments + Messages (full loop).
6. **Both:** Notifications, then AI summaries and EHR/export as needed.

---

## 6. Technical Notes

- **APIs:** Patient-scoped reads: ensure `GET /api/patients` for role PATIENT returns only the current user’s profile (or a single-patient payload). Same for events, logs, appointments — filter by `patientId` from auth.
- **Auth:** `AuthContext` already redirects PATIENT to `/patient/dashboard`; either create that route or change redirect to `/patient/overview` and create that page.
- **Schema:** You already have `MigraineEvent`, `MedicationLog`, `MedicationGroup`, `Appointment`, `ClinicalNote`, `Communication`, `AIDiagnosticInsight`. Most improvements need only API usage and UI; add endpoints where missing (e.g. communications POST, medication-groups CRUD).

This roadmap should make the platform meaningfully more useful for both doctors and patients while staying aligned with your existing schema and APIs.
