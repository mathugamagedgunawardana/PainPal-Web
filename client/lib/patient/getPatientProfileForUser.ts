import { prisma } from '@/lib/prisma'
import type { JWTPayload } from '@/lib/auth/jwt'
import { getPatientUserId } from '@/lib/auth/getPatientUserId'

/**
 * Resolves the PatientProfile row for the authenticated JWT user (PATIENT flow).
 */
export async function getPatientProfileForUser(user: JWTPayload) {
  const patientUserId = await getPatientUserId(user)
  if (!patientUserId) {
    return null
  }
  return prisma.patientProfile.findUnique({
    where: { userId: patientUserId },
  })
}
