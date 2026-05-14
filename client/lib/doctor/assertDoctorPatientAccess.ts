import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDoctorUserId } from '@/lib/auth/getDoctorUserId'
import type { JWTPayload } from '@/lib/auth/jwt'

export type DoctorPatientAccess =
  | { ok: true; doctorProfileId: string }
  | { ok: false; response: NextResponse }

/**
 * Ensures the doctor (from JWT) has an ACTIVE link to the patient.
 */
export async function assertDoctorPatientAccess(
  user: JWTPayload,
  patientId: string
): Promise<DoctorPatientAccess> {
  if (user.role !== 'DOCTOR') {
    return { ok: false, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  const doctorUserId = await getDoctorUserId(user)
  if (!doctorUserId) {
    return { ok: false, response: NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 }) }
  }

  const doctorProfile = await prisma.doctorProfile.findUnique({
    where: { userId: doctorUserId },
  })
  if (!doctorProfile) {
    return { ok: false, response: NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 }) }
  }

  const link = await prisma.patientDoctorLink.findFirst({
    where: {
      doctorId: doctorProfile.id,
      patientId,
      linkStatus: 'ACTIVE',
    },
  })
  if (!link) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Patient not found or access denied' }, { status: 404 }),
    }
  }

  return { ok: true, doctorProfileId: doctorProfile.id }
}
