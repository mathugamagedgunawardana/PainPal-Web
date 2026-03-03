import type { JWTPayload } from '@/lib/auth/jwt'
import { prisma } from '@/lib/prisma'

const OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i
function isValidObjectId(s: string): boolean {
  return typeof s === 'string' && s.length === 24 && OBJECT_ID_REGEX.test(s)
}

/**
 * Returns the MongoDB User id for the current doctor.
 * If JWT has a non-ObjectId userId (e.g. hardcoded "doctor-001"), looks up User by email.
 */
export async function getDoctorUserId(user: JWTPayload): Promise<string | null> {
  if (isValidObjectId(user.userId)) return user.userId
  const byEmail = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true },
  })
  return byEmail?.id ?? null
}
