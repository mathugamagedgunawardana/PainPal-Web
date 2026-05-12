import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'
import { getPatientUserId } from '@/lib/auth/getPatientUserId'
import { getPatientProfileForUser } from '@/lib/patient/getPatientProfileForUser'
import type { MedicationScheduleEntry } from '@/lib/doctor/medicationSchedule'

function coerceSchedule(raw: unknown): MedicationScheduleEntry[] {
  if (raw == null || !Array.isArray(raw)) return []
  const out: MedicationScheduleEntry[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const name = typeof r.name === 'string' ? r.name.trim() : ''
    if (!name) continue
    const tablets =
      typeof r.tablets === 'number' && Number.isFinite(r.tablets) && r.tablets > 0
        ? Math.min(99, Math.floor(r.tablets))
        : 1
    const time = typeof r.time === 'string' ? r.time.trim() : ''
    out.push({ name, tablets, time })
  }
  return out
}

/**
 * GET /api/patient/medication-schedule — active prescribed protocols for reminders (mobile).
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['PATIENT'])
  if (!auth.authorized) return auth.response!

  const userId = await getPatientUserId(auth.user!)
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const patient = await getPatientProfileForUser(auth.user!)
  if (!patient) {
    return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
  }

  const groups = await prisma.medicationGroup.findMany({
    where: { patientId: patient.id, isActive: true },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      groupType: true,
      medications: true,
      medicationSchedule: true,
    },
  })

  const schedules = groups.map((g) => {
    const structured = coerceSchedule(g.medicationSchedule)
    const entries =
      structured.length > 0
        ? structured
        : (g.medications ?? []).map((name) => ({
            name,
            tablets: 1,
            time: '',
          }))
    return {
      groupId: g.id,
      groupName: g.name,
      groupType: g.groupType,
      entries,
    }
  })

  return NextResponse.json({ groups: schedules })
}
