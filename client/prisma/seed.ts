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
    dpf: toInt(row.DPF),
    studyType: row.Type?.trim() || null,
    csvMigraineType: row.MigraineType?.trim() || null,
  }
}

/** Remove prior CSV-seeded events: new rows use csvImportMarker; legacy rows stored JSON in symptomsLog */
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
  for (const a of appointments) {
    await prisma.appointment.create({
      data: {
        patientId: patient1Id,
        doctorId: doctor.id,
        appointmentDate: parseDate(a.date),
        appointmentType: a.type,
        status: a.status,
      },
    })
  }
  console.log('Created appointments for first patient')

  // 9. Clinical notes for first patient
  const notes = [
    { date: '2024-12-10', note: 'Patient reports increased frequency. Adjusted medication dosage.', author: 'Dr. Johnson' },
    { date: '2024-11-15', note: 'Initial assessment completed. Prescribed preventive treatment.', author: 'Dr. Johnson' },
  ]
  for (const n of notes) {
    await prisma.clinicalNote.create({
      data: {
        patientId: patient1Id,
        doctorId: doctor.id,
        noteContent: n.note,
      },
    })
  }
  console.log('Created clinical notes for first patient')

  // 10. Communications for first patient
  const comms = [
    { date: '2024-12-12', type: 'Reminder', message: 'Appointment reminder sent', channel: 'SMS' },
    { date: '2024-12-08', type: 'Message', message: 'Medication refill approved', channel: 'Email' },
  ]
  for (const c of comms) {
    await prisma.communication.create({
      data: {
        patientId: patient1Id,
        doctorId: doctor.id,
        communicationType: c.type,
        message: c.message,
        channel: c.channel,
      },
    })
  }
  console.log('Created communications for first patient')

  // 11. Import CSV attack rows from model/text/Data/traningData for seeded patients 1..4
  const trainingDataDir = path.resolve(__dirname, '..', '..', 'model', 'text', 'Data', 'traningData')
  const csvPatientMap = [
    { patientNumber: 1, profileId: patients[0]?.profileId }, // Sarah
    { patientNumber: 2, profileId: patients[1]?.profileId }, // John
    { patientNumber: 3, profileId: patients[2]?.profileId }, // Emily
    { patientNumber: 4, profileId: patients[3]?.profileId }, // Michael
  ].filter((item): item is { patientNumber: number; profileId: string } => !!item.profileId)

  if (fs.existsSync(trainingDataDir)) {
    const baseDate = new Date('2025-01-01T08:00:00.000Z')

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

        const eventDate = new Date(baseDate)
        eventDate.setUTCDate(baseDate.getUTCDate() - i - (item.patientNumber - 1) * 45)

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
    console.warn(`Training data directory not found: ${trainingDataDir}`)
  }

  console.log('\nSeed completed. Doctor patients list and first patient detail will show data from MongoDB.')
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
