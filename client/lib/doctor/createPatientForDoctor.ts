import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth/password'
import type { JWTPayload } from '@/lib/auth/jwt'
import { getDoctorUserId } from '@/lib/auth/getDoctorUserId'

export type CreatePatientInput = {
  name: string
  email: string
  password: string
  dob: string
  gender?: string | null
  phone?: string | null
  address?: string | null
  condition?: string | null
}

export type CreatePatientResult =
  | { ok: true; patient: ReturnType<typeof toListItem> }
  | { ok: false; status: number; error: string; message?: string }

function toListItem(p: {
  id: string
  name: string
  dob: Date
  gender: string | null
  condition: string | null
  phone: string | null
  email: string | null
  address: string | null
}) {
  const now = new Date()
  const age = Math.floor((now.getTime() - new Date(p.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  return {
    id: p.id,
    name: p.name,
    age,
    gender: p.gender ?? undefined,
    condition: p.condition ?? undefined,
    phone: p.phone ?? undefined,
    email: p.email ?? undefined,
    address: p.address ?? undefined,
    riskLevel: 'low' as const,
    migraineDays: 0,
    recentEpisodes: 0,
    triggers: [] as string[],
    currentMeds: [] as string[],
  }
}

export async function createPatientForDoctor(
  user: JWTPayload,
  input: CreatePatientInput
): Promise<CreatePatientResult> {
  const { name, email, password, dob, gender, phone, address, condition } = input

  if (!name?.trim() || !email?.trim() || !password || !dob) {
    return {
      ok: false,
      status: 400,
      error: 'Missing required fields',
      message: 'Name, email, password, and date of birth are required',
    }
  }

  const dobDate = new Date(dob)
  if (Number.isNaN(dobDate.getTime())) {
    return { ok: false, status: 400, error: 'Invalid date of birth' }
  }

  const doctorUserId = await getDoctorUserId(user)
  if (!doctorUserId) {
    return { ok: false, status: 404, error: 'Doctor profile not found' }
  }

  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId: doctorUserId },
  })
  if (!doctorProfile) {
    return { ok: false, status: 404, error: 'Doctor profile not found' }
  }

  const normalizedEmail = email.trim().toLowerCase()
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { patientProfile: true },
  })

  if (existingUser) {
    if (existingUser.role !== 'PATIENT' || !existingUser.patientProfile) {
      return {
        ok: false,
        status: 409,
        error: 'User exists',
        message: 'A user with this email already exists and is not a patient',
      }
    }

    const patientId = existingUser.patientProfile.id
    const existingLink = await prisma.patientDoctorLink.findUnique({
      where: {
        doctorId_patientId: { doctorId: doctorProfile.id, patientId },
      },
    })

    if (existingLink?.linkStatus === 'ACTIVE') {
      return {
        ok: false,
        status: 409,
        error: 'Already linked',
        message: 'This patient is already on your care list',
      }
    }

    if (existingLink?.linkStatus === 'PENDING') {
      await prisma.patientDoctorLink.update({
        where: { id: existingLink.id },
        data: { linkStatus: 'ACTIVE' },
      })
    } else {
      await prisma.patientDoctorLink.create({
        data: {
          doctorId: doctorProfile.id,
          patientId,
          linkStatus: 'ACTIVE',
        },
      })
    }

    return { ok: true, patient: toListItem(existingUser.patientProfile) }
  }

  const passwordHash = await hashPassword(password)

  const created = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: 'PATIENT',
        patientProfile: {
          create: {
            name: name.trim(),
            dob: dobDate,
            gender: gender?.trim() || null,
            phone: phone?.trim() || null,
            email: normalizedEmail,
            address: address?.trim() || null,
            condition: condition?.trim() || null,
          },
        },
      },
      include: { patientProfile: true },
    })

    await tx.patientDoctorLink.create({
      data: {
        doctorId: doctorProfile.id,
        patientId: newUser.patientProfile!.id,
        linkStatus: 'ACTIVE',
      },
    })

    return newUser.patientProfile!
  })

  return { ok: true, patient: toListItem(created) }
}
