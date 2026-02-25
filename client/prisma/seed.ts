/**
 * Seed script: uploads the previous mock patient data to MongoDB Atlas at once.
 * Run: npx prisma db seed
 */
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SALT_ROUNDS = 10
const SEED_PASSWORD = 'SeedPassword123!'

function yearsAgo(years: number): Date {
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return d
}

function parseDate(isoDate: string): Date {
  return new Date(isoDate + 'T12:00:00.000Z')
}

async function main() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, SALT_ROUNDS)

  // 1. Clinic
  const clinic = await prisma.clinic.create({
    data: {
      name: 'Headache & Migraine Center',
      address: '100 Medical Plaza, San Francisco, CA',
    },
  })
  console.log('Created clinic:', clinic.name)

  // 2. Doctor user + profile
  const doctorUser = await prisma.user.create({
    data: {
      email: 'dr.johnson@clinic.example.com',
      passwordHash,
      role: 'DOCTOR',
    },
  })
  const doctor = await prisma.doctorProfile.create({
    data: {
      userId: doctorUser.id,
      name: 'Dr. Johnson',
      specialization: 'Neurology / Migraine',
      clinicId: clinic.id,
    },
  })
  console.log('Created doctor:', doctor.name)

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
    const user = await prisma.user.create({
      data: {
        email: p.email,
        passwordHash,
        role: 'PATIENT',
      },
    })
    const profile = await prisma.patientProfile.create({
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
    patients.push({ userId: user.id, profileId: profile.id })
  }
  console.log('Created', patients.length, 'patients')

  // 4. Patient–doctor links (ACTIVE)
  for (const { profileId } of patients) {
    await prisma.patientDoctorLink.create({
      data: {
        doctorId: doctor.id,
        patientId: profileId,
        linkStatus: 'ACTIVE',
      },
    })
  }
  console.log('Created patient–doctor links')

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

  // 6. Migraine events (episode history) for first patient – from previous mock
  const episodes = [
    {
      date: '2024-12-15',
      severity: 8, // Severe
      duration: '6 hours',
      triggers: 'Stress, Sleep',
      symptomsLog: JSON.stringify({
        mostIntenseSymptoms: ['Throbbing pain (R temple)', 'Nausea', 'Photophobia', 'Phonophobia'],
        medicationsTakenDuringPeriod: ['Sumatriptan 50mg', 'Topiramate 25mg', 'Ibuprofen 400mg'],
        notes: 'Pain peaked at hour 2. Sumatriptan taken at onset.',
      }),
      effectiveness: 'LOW' as const,
      medicationGroupId: medGroup1.id,
    },
    {
      date: '2024-12-10',
      severity: 5,
      duration: '4 hours',
      triggers: 'Weather',
      symptomsLog: JSON.stringify({
        mostIntenseSymptoms: ['Pressure pain (bilateral)', 'Light sensitivity'],
        medicationsTakenDuringPeriod: ['Sumatriptan 50mg', 'Topiramate 25mg'],
      }),
      effectiveness: 'MODERATE' as const,
      medicationGroupId: medGroup1.id,
    },
    {
      date: '2024-12-05',
      severity: 2,
      duration: '2 hours',
      triggers: 'Caffeine',
      symptomsLog: JSON.stringify({
        mostIntenseSymptoms: ['Mild throbbing', 'Tiredness'],
        medicationsTakenDuringPeriod: ['Ibuprofen 400mg'],
      }),
      effectiveness: 'HIGH' as const,
      medicationGroupId: medGroup3.id,
    },
    {
      date: '2024-11-28',
      severity: 9,
      duration: '8 hours',
      triggers: 'Stress, Bright Lights',
      symptomsLog: JSON.stringify({
        mostIntenseSymptoms: ['Severe throbbing', 'Nausea', 'Vomiting', 'Visual aura', 'Photophobia'],
        medicationsTakenDuringPeriod: ['Sumatriptan 100mg', 'Topiramate 25mg', 'Metoclopramide 10mg'],
        notes: 'Aura preceded headache by ~20 min.',
      }),
      effectiveness: 'LOW' as const,
      medicationGroupId: medGroup1.id,
    },
  ]

  for (const ep of episodes) {
    await prisma.migraineEvent.create({
      data: {
        patientId: patient1Id,
        startDatetime: parseDate(ep.date),
        severity: ep.severity,
        duration: ep.duration,
        perceivedTriggers: ep.triggers,
        symptomsLog: ep.symptomsLog,
        medicationGroupId: ep.medicationGroupId,
        effectiveness: ep.effectiveness,
      },
    })
  }
  console.log('Created migraine events (episode history) for first patient')

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
