# Seed: Upload previous mock patient data to MongoDB Atlas

This seed inserts the **previous mock patient data** (from the doctor patients page) into MongoDB Atlas in one run.

## What gets created

- **1 Clinic** – Headache & Migraine Center
- **1 Doctor** – Dr. Johnson (User + DoctorProfile)
- **4 Patients** – Sarah Chen, John Doe, Emily Smith, Michael Johnson (User + PatientProfile each)
- **4 Patient–doctor links** – ACTIVE links so the doctor sees all 4 patients
- **First patient (Sarah Chen) only:**
  - 3 Medication groups (Acute Treatment, Preventive Care, Alternative Relief)
  - 4 Migraine events (episode history with most intense symptoms, meds during period, notes in `symptomsLog` JSON)
  - 3 Medication logs
  - 3 Appointments (Follow-up, Regular Check-up, Initial Consultation)
  - 2 Clinical notes
  - 2 Communications

## Prerequisites

1. **MongoDB Atlas** (or local MongoDB): create a `.env` in the **client** directory with your connection string:
   ```env
   DATABASE_URL="mongodb+srv://user:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority"
   ```

2. Generate the Prisma client (if not already done):
   ```bash
   cd client
   npx prisma generate
   ```

## Run the seed

From the **client** directory:

```bash
npx prisma db seed
```

Or from repo root:

```bash
cd client && npx prisma db seed
```

Seed user password (for login flows): **SeedPassword123!**  
Doctor email: **dr.johnson@clinic.example.com**

## Notes

- The seed uses **bcrypt** to hash the seed password; all seed users share the same password.
- If you run the seed multiple times, it will create **duplicate** users and data (emails must be unique; second run will fail on duplicate email). To reset and re-seed, clear the relevant collections in Atlas or use a fresh database.
