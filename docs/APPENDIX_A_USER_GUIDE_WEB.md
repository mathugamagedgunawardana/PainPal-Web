# Appendix A — User Guide: Web Dashboard (PainPal / Next.js)

This document covers the **web dashboard** in the `LLM/client` project: system setup, environment, database, APIs, role-based login, and suggested screenshots for documentation or demos.

---

## 1. System requirements

| Component | Notes |
|-----------|--------|
| **Operating system** | Linux, macOS, or Windows (WSL2 recommended on Windows for shell parity). |
| **Node.js** | **20.x or newer** (LTS recommended). Matches typical Next.js 16 tooling. |
| **npm** | Bundled with Node; `pnpm` / `yarn` work if you prefer, using the same scripts. |
| **MongoDB** | **MongoDB Atlas** or local MongoDB compatible with Prisma’s MongoDB provider. |
| **Browser** | Current Chrome, Firefox, Safari, or Edge (JavaScript enabled). |
| **Optional: Python model API** | **Python 3.11+** if you run migraine/MRI inference via `LLM/model/main.py` (FastAPI on port **8000** by default). |

---

## 2. Installation (web client)

From the repository root:

```bash
cd client
npm install
```

`postinstall` runs `prisma generate` so the Prisma client is available after install.

---

## 3. How to run the web dashboard

**Development (hot reload):**

```bash
cd client
npm run dev
```

Open **http://localhost:3000** (or the host/port shown in the terminal).

**Production-style run (after build):**

```bash
cd client
npm run build
npm start
```

---

## 4. Backend setup (overview)

The “backend” for the web app is primarily:

1. **Next.js App Router + Route Handlers** under `client/app/api/` (REST-style JSON APIs, JWT cookies for browser sessions).
2. **MongoDB** accessed through **Prisma** (`client/prisma/schema.prisma`).
3. **Optional FastAPI service** (`LLM/model/main.py`) for XGBoost migraine-type and MRI-related model calls; the Next app reaches it using **`MODEL_API_URL`** (see below).

For full AI summaries you may optionally set OpenAI keys in `client/.env` (see `.env.example`).

---

## 5. Environment variables (web)

Copy the example file and edit values:

```bash
cd client
cp .env.example .env
```

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | **Yes** (for persisted users, clinics, events) | Prisma MongoDB connection string. |
| `JWT_SECRET` | **Yes in production** (`NODE_ENV=production`) | Signing key for JWTs; use at least 32 random characters, e.g. `openssl rand -base64 32`. |
| `MODEL_API_URL` | Recommended | Base URL of the Python FastAPI server (**no trailing slash**), e.g. `http://127.0.0.1:8000`. |
| `OPENAI_API_KEY` | Optional | Richer patient AI summaries. |
| `OPENAI_MODEL` | Optional | Defaults described in `.env.example`. |

Never commit real `.env` files or live secrets.

---

## 6. Database configuration

1. Create a MongoDB database (Atlas cluster or local).
2. Put the connection string in **`client/.env`** as `DATABASE_URL=...` (see Prisma docs for MongoDB URL format).
3. Generate the client (if needed):

   ```bash
   cd client
   npx prisma generate
   ```

4. Push the schema to the database (MongoDB uses `db push` rather than SQL migrations):

   ```bash
   npx prisma db push
   ```

5. **Optional seed** (demo clinic, doctor, patients, sample migraine data): see `client/prisma/SEED_README.md`.

   ```bash
   cd client
   npm run seed
   ```

   Seeded login (when using seed users): email **`dr.johnson@clinic.example.com`**, password **`SeedPassword123!`** (all seed users share that password per `SEED_README.md`).

---

## 7. API setup

- **Base URL (local):** `http://localhost:3000` (or your deployed origin).
- **Auth:** `POST /api/auth/login` with JSON `{ "email", "password" }` returns a **Bearer token** and sets an auth cookie for browser flows. See `client/API_AUTH.md` for curl examples and route-level role rules.
- **Python model API:** start from `LLM/model`:

  ```bash
  cd model
  pip install -r requirements.txt
  python main.py
  ```

  Defaults: host `0.0.0.0`, port **8000** (overridable via `model/.env` — see `model/.env.example`). Set **`CORS_ORIGINS`** in `model/.env` if the browser calls FastAPI directly (comma-separated origins, e.g. `http://localhost:3000`).

---

## 8. Login instructions (web)

Open the sign-in page: **http://localhost:3000/signin**

### 8.1 Admin (development)

| Field | Value |
|-------|--------|
| Email | `admin@painpal.com` |
| Password | `Admin@123` |

After login, the app routes you according to role (e.g. admin areas under `/admin/...`).

### 8.2 Doctor (development)

| Field | Value |
|-------|--------|
| Email | `doctor@painpal.com` |
| Password | `Doctor@123` |

If MongoDB is configured and the Prisma seed has been run, this account may be **mapped to the seeded doctor** (`dr.johnson@clinic.example.com`) so JWT `userId` matches real `ObjectId`s for doctor APIs.

### 8.3 Patient (development)

| Field | Value |
|-------|--------|
| Email | `patient@painpal.com` |
| Password | `Patient@123` |

With DB + seed, the patient may map to the **first seeded patient** profile for patient-scoped APIs.

> **Note:** Hardcoded credentials are for **development and testing** only. Replace with proper user provisioning and secrets in production.

---

## 9. Basic workflows (web)

### 9.1 Creating a migraine log (patient-facing web)

Typical path: sign in as **patient**, open the patient dashboard / logging UI, complete severity, symptoms, triggers, and time fields, then submit. Data is stored via Prisma on MongoDB and may trigger model sync or summaries depending on configuration.

### 9.2 Viewing AI predictions / analytics

- **Patient:** `/patient/analytics` — charts and summaries derived from stored events.
- **Doctor:** `/doctor/analytics` or per-patient views under `/doctor/patients/...` — aggregated insights for linked patients.

### 9.3 Doctor reviewing patient reports

1. Sign in as **doctor**.
2. Open **Patients** (`/doctor/patients`).
3. Select a patient to open detail, history, approvals, or analytics sub-pages as implemented (e.g. `/doctor/patients/analytics`, `/doctor/patients/approve`).

### 9.4 Admin operations

- Sign in as **admin**.
- Use **`/admin/dashboard`**, **`/admin/overview`**, **`/admin/users`** for user and system management per your deployment.

---

## 10. Basic workflow screenshots (placeholders)

Add images under `LLM/docs/screenshots/web/` and reference them here (or embed in PDF/HTML exports).

| # | Suggested capture | File name (example) |
|---|-------------------|---------------------|
| 1 | Sign-in page with email/password fields | `web-01-signin.png` |
| 2 | Patient: migraine log form (filled) | `web-02-patient-migraine-log.png` |
| 3 | Patient: analytics / AI summary panel | `web-03-patient-analytics.png` |
| 4 | Doctor: patient list | `web-04-doctor-patients.png` |
| 5 | Doctor: patient detail or report review | `web-05-doctor-patient-report.png` |
| 6 | Admin: users or dashboard | `web-06-admin-users.png` |

Example markdown after you drop files in place:

```markdown
![Sign-in](screenshots/web/web-01-signin.png)
```

---

## 11. Disclaimer

Brain MRI and migraine models, and any AI-generated text in the product, are for **education and research / self-management support** only. They are not a substitute for professional medical advice, diagnosis, or emergency care.
