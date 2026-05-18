/**
 * Seed script: uploads the previous mock patient data to MongoDB Atlas at once.
 * Run: npx prisma db seed
 */
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const SALT_ROUNDS = 10
const SEED_PASSWORD = 'SeedPassword123!'
const CSV_SEED_SOURCE = 'trainingData_seed'
const MRI_SEED_FILE_PREFIX = 'seed-mri-'
const MRI_MODEL_LABEL = 'resnet18-migraine-v1'

type TrainingAttackRow = Record<string, string>

function withRowOverrides(
  row: TrainingAttackRow,
  overrides: Partial<Record<string, string>>
): TrainingAttackRow {
  const next: TrainingAttackRow = { ...row }
  for (const [key, value] of Object.entries(overrides)) {
    if (typeof value === 'string') {
      next[key] = value
    }
  }
  return next
}

function diversifiedRowForSeedPatient(
  patientNumber: number,
  row: TrainingAttackRow,
  rowIndex: number
): TrainingAttackRow {
  const alternating = rowIndex % 2 === 0 ? '1' : '0'

  switch (patientNumber) {
    // Sarah: aura-heavy profile
    case 1:
      return withRowOverrides(row, {
        Visual: '1',
        Sensory: '1',
        Dysphasia: alternating,
        Phonophobia: '1',
        Photophobia: '1',
        Vertigo: '0',
        Tinnitus: '0',
        Type: 'Migraine with aura',
      })

    // John: vestibular/brainstem-like profile
    case 2:
      return withRowOverrides(row, {
        Visual: '0',
        Sensory: '0',
        Dysphasia: '0',
        Vertigo: '1',
        Tinnitus: '1',
        Hypoacusis: alternating,
        Diplopia: alternating,
        Defect: '0',
        Type: 'Vestibular migraine',
      })

    // Emily: hormonal/menstrual leaning profile
    case 3:
      return withRowOverrides(row, {
        Visual: '0',
        Sensory: '0',
        Dysphasia: '0',
        Vertigo: '0',
        Tinnitus: '0',
        Nausea: '1',
        Vomit: alternating,
        Frequency: '1',
        Type: 'Menstrual migraine',
      })

    // Michael: chronic without aura profile
    case 4:
      return withRowOverrides(row, {
        Visual: '0',
        Sensory: '0',
        Dysphasia: '0',
        Vertigo: '0',
        Tinnitus: '0',
        Nausea: '1',
        Photophobia: '1',
        Phonophobia: '1',
        Frequency: '1',
        Duration: '1',
        Type: 'Chronic migraine',
      })

    default:
      return row
  }
}

function yearsAgo(years: number): Date {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return d
}

function parseDate(isoDate: string): Date {
  return new Date(isoDate + 'T12:00:00.000Z')
}

/** LCG — deterministic per (patient, row) so re-seeding stays reproducible but dates look varied. */
function createSeededRng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (1664525 * state + 1013904223) >>> 0
    return state / 4294967296
  }
}

/**
 * Random calendar timestamps spread across `spreadMonths` separate months (going backward from anchor).
 */
function randomEpisodeStartUtc(anchor: Date, spreadMonths: number, patientNumber: number, rowIndex: number): Date {
  const rand = createSeededRng((patientNumber * 100003 + rowIndex * 97266353 + spreadMonths) >>> 0)
  const monthPick = Math.floor(rand() * spreadMonths)
  const d = new Date(anchor)
  d.setUTCDate(1)
  d.setUTCHours(12, 0, 0, 0)
  d.setUTCMonth(d.getUTCMonth() - monthPick)

  const y = d.getUTCFullYear()
  const m = d.getUTCMonth()
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  const day = 1 + Math.floor(rand() * daysInMonth)
  const hour = 6 + Math.floor(rand() * 14)
  const minute = Math.floor(rand() * 60)
  return new Date(Date.UTC(y, m, day, hour, minute, 0, 0))
}

function readCsvRows(filePath: string): TrainingAttackRow[] {
  const raw = fs.readFileSync(filePath, 'utf8').trim()
  if (!raw) return []
  const lines = raw.split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim())
    const row: TrainingAttackRow = {}
    headers.forEach((h, i) => {
      row[h] = values[i] ?? ''
    })
    return row
  })
}

function toInt(v: string | undefined): number {
  const n = Number(v ?? 0)
  return Number.isFinite(n) ? n : 0
}

function buildSymptomsAndTriggers(row: TrainingAttackRow) {
  const symptomSignals: Array<[key: string, label: string]> = [
    ['Nausea', 'Nausea'],
    ['Vomit', 'Vomiting'],
    ['Phonophobia', 'Phonophobia'],
    ['Photophobia', 'Photophobia'],
    ['Visual', 'Visual aura'],
    ['Sensory', 'Sensory aura'],
    ['Dysphasia', 'Speech difficulty'],
    ['Dysarthria', 'Slurred speech'],
    ['Vertigo', 'Vertigo'],
    ['Tinnitus', 'Tinnitus'],
    ['Hypoacusis', 'Hearing changes'],
    ['Diplopia', 'Double vision'],
    ['Defect', 'Visual field defect'],
    ['Ataxia', 'Loss of balance'],
    ['Conscience', 'Consciousness changes'],
    ['Paresthesia', 'Paresthesia'],
  ]

  const detectedSymptoms = symptomSignals
    .filter(([key]) => toInt(row[key]) > 0)
    .map(([, label]) => label)

  const triggers: string[] = []
  if (toInt(row.Frequency) > 0) triggers.push('Stress')
  if (toInt(row.Duration) > 0) triggers.push('Sleep disruption')
  if (toInt(row.Photophobia) > 0) triggers.push('Bright lights')
  if (toInt(row.Phonophobia) > 0) triggers.push('Loud noise')
  if (toInt(row.Vertigo) > 0) triggers.push('Motion')
  if (toInt(row.DPF) > 0) triggers.push('Dietary pattern')

  return { detectedSymptoms, triggers: Array.from(new Set(triggers)) }
}

function deriveSeverity(row: TrainingAttackRow): number {
  const intensity = toInt(row.Intensity)
  const frequency = toInt(row.Frequency)
  const auraCount = ['Visual', 'Sensory', 'Dysphasia', 'Vertigo'].reduce(
    (acc, key) => acc + toInt(row[key]),
    0
  )
  const raw = 3 + intensity * 4 + frequency * 2 + Math.min(2, auraCount)
  return Math.max(1, Math.min(10, raw))
}

function deriveDurationText(row: TrainingAttackRow): string {
  return toInt(row.Duration) > 0 ? '6 hours' : '2 hours'
}

function deriveEffectiveness(row: TrainingAttackRow): 'LOW' | 'MODERATE' | 'HIGH' {
  const intensity = toInt(row.Intensity)
  const frequency = toInt(row.Frequency)
  if (intensity === 1 && frequency === 1) return 'LOW'
  if (intensity === 0 && frequency === 0) return 'HIGH'
  return 'MODERATE'
}

/** Maps CSV row fields onto MigraineEvent training columns */
function trainingFieldsFromRow(row: TrainingAttackRow, rowIndex: number) {
  const attackRaw = row.attack_id?.trim()
  const attackNum = attackRaw !== undefined && attackRaw !== '' ? Number.parseInt(attackRaw, 10) : NaN
  return {
    csvPatientId: row.patient_id?.trim() || null,
    csvAttackId: Number.isFinite(attackNum) ? attackNum : rowIndex + 1,
    trainingAge: toInt(row.Age),
    trainingDuration: toInt(row.Duration),
    trainingFrequency: toInt(row.Frequency),
    trainingLocation: toInt(row.Location),
    trainingCharacter: toInt(row.Character),
    trainingIntensity: toInt(row.Intensity),
    nausea: toInt(row.Nausea),
    vomit: toInt(row.Vomit),
    phonophobia: toInt(row.Phonophobia),
    photophobia: toInt(row.Photophobia),
    visual: toInt(row.Visual),
    sensory: toInt(row.Sensory),
    dysphasia: toInt(row.Dysphasia),
    dysarthria: toInt(row.Dysarthria),
    vertigo: toInt(row.Vertigo),
    tinnitus: toInt(row.Tinnitus),
    hypoacusis: toInt(row.Hypoacusis),
    diplopia: toInt(row.Diplopia),
    defect: toInt(row.Defect),
    ataxia: toInt(row.Ataxia),
    conscience: toInt(row.Conscience),
    paresthesia: toInt(row.Paresthesia),
    studyType: row.Type?.trim() || null,
    csvMigraineType: row.MigraineType?.trim() || null,
  }
}

/** Remove prior CSV-seeded events: new rows use csvImportMarker; legacy rows stored JSON in symptomsLog */
type MriSeedScan = {
  fileName: string
  predictedLabel: 'migraine' | 'other'
  confidence: number
  probabilities: { other: number; migraine: number }
  daysAgo: number
  mimeType?: string
  fileSizeBytes?: number
}

/** ResNet18-style outputs for doctor MRI card (matches model/main.py POST /predict/mri). */
const MRI_SCANS_BY_PATIENT: Record<number, MriSeedScan[]> = {
  // Sarah Chen — chronic migraine with aura
  1: [
    {
      fileName: `${MRI_SEED_FILE_PREFIX}sarah-axial-t2.png`,
      predictedLabel: 'migraine',
      confidence: 0.91,
      probabilities: { other: 0.09, migraine: 0.91 },
      daysAgo: 4,
      fileSizeBytes: 245_120,
    },
    {
      fileName: `${MRI_SEED_FILE_PREFIX}sarah-flair-slice.jpg`,
      predictedLabel: 'migraine',
      confidence: 0.84,
      probabilities: { other: 0.16, migraine: 0.84 },
      daysAgo: 18,
      mimeType: 'image/jpeg',
      fileSizeBytes: 198_400,
    },
  ],
  // John Doe — episodic migraine
  2: [
    {
      fileName: `${MRI_SEED_FILE_PREFIX}john-t1-weighted.png`,
      predictedLabel: 'migraine',
      confidence: 0.78,
      probabilities: { other: 0.22, migraine: 0.78 },
      daysAgo: 7,
    },
  ],
  // Emily Smith — menstrual migraine
  3: [
    {
      fileName: `${MRI_SEED_FILE_PREFIX}emily-mri-cycle.png`,
      predictedLabel: 'migraine',
      confidence: 0.88,
      probabilities: { other: 0.12, migraine: 0.88 },
      daysAgo: 2,
    },
  ],
  // Michael Johnson — mixed: older migraine, latest flagged as other (tumor-like folder in training)
  4: [
    {
      fileName: `${MRI_SEED_FILE_PREFIX}michael-followup.png`,
      predictedLabel: 'other',
      confidence: 0.82,
      probabilities: { other: 0.82, migraine: 0.18 },
      daysAgo: 5,
    },
    {
      fileName: `${MRI_SEED_FILE_PREFIX}michael-baseline.png`,
      predictedLabel: 'migraine',
      confidence: 0.73,
      probabilities: { other: 0.27, migraine: 0.73 },
      daysAgo: 45,
    },
  ],
}

function daysAgoUtc(days: number): Date {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  d.setUTCHours(14, 30, 0, 0)
  return d
}

async function deleteSeededMriScans(profileIds: string[]) {
  if (!profileIds.length) return
  const deleted = await prisma.patientMriScan.deleteMany({
    where: {
      patientId: { in: profileIds },
      originalFileName: { startsWith: MRI_SEED_FILE_PREFIX },
    },
  })
  if (deleted.count > 0) {
    console.log(`Removed ${deleted.count} prior seed MRI scan(s)`)
  }
}

async function seedMriScansForPatients(
  csvPatientMap: { patientNumber: number; profileId: string }[]
) {
  const profileIds = csvPatientMap.map((p) => p.profileId)
  await deleteSeededMriScans(profileIds)

  let created = 0
  for (const { patientNumber, profileId } of csvPatientMap) {
    const scans = MRI_SCANS_BY_PATIENT[patientNumber]
    if (!scans?.length) continue

    for (const scan of scans) {
      await prisma.patientMriScan.create({
        data: {
          patientId: profileId,
          originalFileName: scan.fileName,
          mimeType: scan.mimeType ?? 'image/png',
          fileSizeBytes: scan.fileSizeBytes ?? 220_000,
          prediction: scan.predictedLabel,
          confidence: scan.confidence,
          modelLabel: MRI_MODEL_LABEL,
          probabilities: scan.probabilities,
          createdAt: daysAgoUtc(scan.daysAgo),
        },
      })
      created++
    }
  }

  console.log(
    `Created ${created} seed MRI scan(s) with ResNet18 labels (migraine vs other) for patients 1..${csvPatientMap.length}`
  )
}

async function deleteCsvSeededEventsForPatient(profileId: string) {
  await prisma.migraineEvent.deleteMany({
    where: {
      patientId: profileId,
      csvImportMarker: CSV_SEED_SOURCE,
    },
  })
  const url = process.env.DATABASE_URL
  if (!url) return
  const { MongoClient, ObjectId } = await import('mongodb')
  const client = new MongoClient(url)
  try {
    await client.connect()
    const db = client.db()
    await db.collection('MigraineEvent').deleteMany({
      patientId: new ObjectId(profileId),
      symptomsLog: { $regex: CSV_SEED_SOURCE },
    })
  } catch (e) {
    console.warn('Legacy CSV seed cleanup (symptomsLog) skipped:', e)
  } finally {
    await client.close()
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS)

  // 1. Clinic (idempotent: use existing if present)
  let clinic = await prisma.clinic.findFirst({
    where: { name: 'Headache & Migraine Center' },
  })
  if (!clinic) {
    clinic = await prisma.clinic.create({
      data: {
        name: 'Headache & Migraine Center',
        address: '100 Medical Plaza, San Francisco, CA',
      },
    })
    console.log('Created clinic:', clinic.name)
  } else {
    console.log('Using existing clinic:', clinic.name)
  }

  // 2. Doctor user + profile (idempotent)
  const doctorEmail = 'dr.johnson@clinic.example.com'
  let doctorUser = await prisma.user.findUnique({
    where: { email: doctorEmail },
  })
  if (!doctorUser) {
    doctorUser = await prisma.user.create({
      data: {
        email: doctorEmail,
        passwordHash,
        role: 'DOCTOR',
        googleId: 'seed-dr.johnson@clinic.example.com',
      },
    })
  }
  let doctor = await prisma.doctorProfile.findUnique({
    where: { userId: doctorUser.id },
  })
  if (!doctor) {
    doctor = await prisma.doctorProfile.create({
      data: {
        userId: doctorUser.id,
        name: 'Dr. Johnson',
        specialization: 'Neurology / Migraine',
        clinicId: clinic.id,
      },
    })
    console.log('Created doctor:', doctor.name)
  } else {
    console.log('Using existing doctor:', doctor.name)
  }

  // 3. Patient users + profiles (previous mock data)
  const patientsData = [
    {
      email: 'sarah.chen@email.com',
      name: 'Sarah Chen',
      age: 34,
      gender: 'Female',
      phone: '+1 (555) 123-4567',
      address: '123 Oak Street, San Francisco, CA',
      condition: 'Chronic Migraine with Aura',
    },
    {
      email: 'john.doe@email.com',
      name: 'John Doe',
      age: 42,
      gender: 'Male',
      phone: '+1 (555) 234-5678',
      address: '456 Maple Ave, Los Angeles, CA',
      condition: 'Episodic Migraine',
    },
    {
      email: 'emily.smith@email.com',
      name: 'Emily Smith',
      age: 28,
      gender: 'Female',
      phone: '+1 (555) 345-6789',
      address: '789 Pine Rd, Seattle, WA',
      condition: 'Menstrual Migraine',
    },
    {
      email: 'michael.j@email.com',
      name: 'Michael Johnson',
      age: 51,
      gender: 'Male',
      phone: '+1 (555) 456-7890',
      address: '321 Elm St, Boston, MA',
      condition: 'Chronic Migraine',
    },
  ]

  const patients: { userId: string; profileId: string }[] = []
  for (const p of patientsData) {
    let user = await prisma.user.findUnique({
      where: { email: p.email },
    })
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: p.email,
          passwordHash,
          role: 'PATIENT',
          googleId: `seed-${p.email}`,
        },
      })
    }
    let profile = await prisma.patientProfile.findUnique({
      where: { userId: user.id },
    })
    if (!profile) {
      profile = await prisma.patientProfile.create({
        data: {
          userId: user.id,
          name: p.name,
          dob: yearsAgo(p.age),
          gender: p.gender,
          phone: p.phone,
          address: p.address,
          condition: p.condition,
          email: p.email,
        },
      })
    }
    patients.push({ userId: user.id, profileId: profile.id })
  }
  console.log('Created or found', patients.length, 'patients')

  // 4. Patient–doctor links (ACTIVE) – idempotent
  for (const { profileId } of patients) {
    const existing = await prisma.patientDoctorLink.findFirst({
      where: { doctorId: doctor.id, patientId: profileId },
    })
    if (!existing) {
      await prisma.patientDoctorLink.create({
        data: {
          doctorId: doctor.id,
          patientId: profileId,
          linkStatus: 'ACTIVE',
        },
      })
    }
  }
  console.log('Created or found patient–doctor links')

  const patient1Id = patients[0].profileId

  // 5. Medication groups for first patient (Sarah Chen) – from previous mock
  const medGroup1 = await prisma.medicationGroup.create({
    data: {
      patientId: patient1Id,
      doctorId: doctor.id,
      name: 'Acute Treatment Protocol',
      groupType: 'RESCUE',
      medications: ['Sumatriptan 50mg', 'Topiramate 25mg'],
      medicationSchedule: [
        { name: 'Sumatriptan 50mg', tablets: 1, time: '09:00' },
        { name: 'Topiramate 25mg', tablets: 1, time: '21:00' },
      ],
      color: 'blue',
      adherenceRate: 78,
    },
  })
  const medGroup2 = await prisma.medicationGroup.create({
    data: {
      patientId: patient1Id,
      doctorId: doctor.id,
      name: 'Preventive Care Regimen',
      groupType: 'PREVENTIVE',
      medications: ['Topiramate 25mg'],
      color: 'purple',
      adherenceRate: 92,
    },
  })
  const medGroup3 = await prisma.medicationGroup.create({
    data: {
      patientId: patient1Id,
      doctorId: doctor.id,
      name: 'Alternative Relief Protocol',
      groupType: 'RESCUE',
      medications: ['Ibuprofen 400mg'],
      color: 'teal',
      adherenceRate: 85,
    },
  })
  console.log('Created medication groups for first patient')

  // 6. Migraine events now come from CSV import below.

  // 7. Medication logs for first patient
  const medLogs = [
    { name: 'Sumatriptan 50mg', frequency: 'As needed', adherence: 78, lastTaken: '2024-12-15', type: 'RESCUE' as const, groupId: medGroup1.id },
    { name: 'Topiramate 25mg', frequency: 'Daily', adherence: 92, lastTaken: '2024-12-16', type: 'PREVENTIVE' as const, groupId: medGroup1.id },
    { name: 'Ibuprofen 400mg', frequency: 'As needed', adherence: 85, lastTaken: '2024-12-14', type: 'RESCUE' as const, groupId: medGroup3.id },
  ]
  for (const m of medLogs) {
    await prisma.medicationLog.create({
      data: {
        patientId: patient1Id,
        medicationGroupId: m.groupId,
        medicationName: m.name,
        medicationType: m.type,
        datetimeTaken: parseDate(m.lastTaken),
        dosage: m.name.split(' ').pop() || '—',
        frequency: m.frequency,
        adherenceRate: m.adherence,
      },
    })
  }
  console.log('Created medication logs for first patient')

  // 8. Appointments for first patient
  const appointments = [
    { date: '2024-12-20', type: 'Follow-up', status: 'SCHEDULED' as const },
    { date: '2024-12-10', type: 'Regular Check-up', status: 'COMPLETED' as const },
    { date: '2024-11-15', type: 'Initial Consultation', status: 'COMPLETED' as const },
  ]
  const createdAppointmentIds: string[] = []
  for (const a of appointments) {
    const row = await prisma.appointment.create({
      data: {
        patientId: patient1Id,
        doctorId: doctor.id,
        appointmentDate: parseDate(a.date),
        appointmentType: a.type,
        status: a.status,
      },
    })
    createdAppointmentIds.push(row.id)
  }
  const apptFollowUpId = createdAppointmentIds[0]
  const apptRegularId = createdAppointmentIds[1]
  const apptInitialId = createdAppointmentIds[2]
  console.log('Created appointments for first patient')

  // 9. Clinical notes linked to visits
  await prisma.clinicalNote.create({
    data: {
      patientId: patient1Id,
      doctorId: doctor.id,
      appointmentId: apptRegularId,
      noteContent: 'Patient reports increased frequency. Adjusted medication dosage.',
    },
  })
  await prisma.clinicalNote.create({
    data: {
      patientId: patient1Id,
      doctorId: doctor.id,
      appointmentId: apptInitialId,
      noteContent: 'Initial assessment completed. Prescribed preventive treatment.',
    },
  })
  console.log('Created clinical notes for first patient')

  // 10. Communications linked to visits
  await prisma.communication.create({
    data: {
      patientId: patient1Id,
      doctorId: doctor.id,
      appointmentId: apptFollowUpId,
      communicationType: 'Reminder',
      message: 'Appointment reminder sent',
      channel: 'SMS',
    },
  })
  await prisma.communication.create({
    data: {
      patientId: patient1Id,
      doctorId: doctor.id,
      appointmentId: apptRegularId,
      communicationType: 'Message',
      message: 'Medication refill approved',
      channel: 'Email',
    },
  })
  console.log('Created communications for first patient')

  if (apptInitialId) {
    await prisma.appointmentFile.create({
      data: {
        appointmentId: apptInitialId,
        doctorId: doctor.id,
        title: 'Baseline intake questionnaire',
        fileUrl: 'https://example.com/patient-intake.pdf',
        fileName: 'intake.pdf',
        mimeType: 'application/pdf',
      },
    })
    console.log('Created sample appointment file for first patient')
  }

  // 11. Optional: import CSV rows from local training data (never required on Vercel/production).
  // Set SEED_TRAINING_CSV_DIR to a folder of patient_*_migraine_attacks.csv files, or use default in dev only.
  const defaultTrainingDir = path.resolve(__dirname, '..', '..', 'model', 'text', 'Data', 'traningData')
  const trainingDataDir =
    process.env.SEED_TRAINING_CSV_DIR?.trim() ||
    (process.env.NODE_ENV !== 'production' && fs.existsSync(defaultTrainingDir)
      ? defaultTrainingDir
      : '')
  const csvPatientMap = [
    { patientNumber: 1, profileId: patients[0]?.profileId }, // Sarah
    { patientNumber: 2, profileId: patients[1]?.profileId }, // John
    { patientNumber: 3, profileId: patients[2]?.profileId }, // Emily
    { patientNumber: 4, profileId: patients[3]?.profileId }, // Michael
  ].filter((item): item is { patientNumber: number; profileId: string } => !!item.profileId)

  if (trainingDataDir && fs.existsSync(trainingDataDir)) {
    /** Episodes land in random days across this many past months (relative to seed run time). */
    const EPISODE_MONTH_SPREAD = 15
    const episodeAnchor = new Date()
    episodeAnchor.setUTCMinutes(0, 0, 0)

    for (const item of csvPatientMap) {
      const csvPath = path.join(trainingDataDir, `patient_${item.patientNumber}_migraine_attacks.csv`)
      if (!fs.existsSync(csvPath)) {
        console.warn(`CSV file missing for patient_${item.patientNumber}: ${csvPath}`)
        continue
      }

      const rows = readCsvRows(csvPath)
      if (!rows.length) continue

      await deleteCsvSeededEventsForPatient(item.profileId)

      for (let i = 0; i < rows.length; i++) {
        const row = diversifiedRowForSeedPatient(item.patientNumber, rows[i], i)
        const { detectedSymptoms, triggers } = buildSymptomsAndTriggers(row)

        const eventDate = randomEpisodeStartUtc(
          episodeAnchor,
          EPISODE_MONTH_SPREAD,
          item.patientNumber,
          i
        )

        await prisma.migraineEvent.create({
          data: {
            patientId: item.profileId,
            startDatetime: eventDate,
            severity: deriveSeverity(row),
            duration: deriveDurationText(row),
            perceivedTriggers: triggers.join(', '),
            detectedSymptoms,
            effectiveness: deriveEffectiveness(row),
            csvImportMarker: CSV_SEED_SOURCE,
            ...trainingFieldsFromRow(row, i),
          },
        })
      }
    }

    console.log('Imported CSV symptom rows from traningData for seeded patients 1..4')
  } else {
    console.warn(
      'Skipped CSV training import (set SEED_TRAINING_CSV_DIR for local seed data; not used on Vercel).'
    )
  }

  // 12. MRI → Vercel Blob + live ResNet18 (requires BLOB_READ_WRITE_TOKEN + MODEL_API_URL)
  if (process.env.BLOB_READ_WRITE_TOKEN?.trim() && process.env.MODEL_API_URL?.trim()) {
    try {
      const { seedPatientMriBlob } = await import('../lib/mri/seedPatientMriBlob')
      const { created, skipped } = await seedPatientMriBlob(prisma)
      if (skipped.length) console.warn('MRI blob seed skipped:', skipped.join('; '))
      console.log(`MRI blob + ResNet18: ${created} scan(s) uploaded for seeded patients`)
    } catch (e) {
      console.warn('MRI blob seed failed (static fallback):', e)
      await seedMriScansForPatients(csvPatientMap)
    }
  } else {
    console.warn(
      'BLOB_READ_WRITE_TOKEN or MODEL_API_URL unset — using static MRI seed. Run: npm run seed:mri-blob',
    )
    await seedMriScansForPatients(csvPatientMap)
  }

  console.log('\nSeed completed. Doctor patients list and first patient detail will show data from MongoDB.')
  console.log('MRI card: /doctor/patients — live scans need npm run seed:mri-blob with Blob + model API.')
  console.log('Doctor login email:', doctorUser.email, '(use your auth flow; seed password:', SEED_PASSWORD + ')')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
