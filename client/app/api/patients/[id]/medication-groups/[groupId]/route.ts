import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'
import { assertDoctorPatientAccess } from '@/lib/doctor/assertDoctorPatientAccess'
import {
  namesFromSchedule,
  parseMedicationSchedule,
} from '@/lib/doctor/medicationSchedule'
import type { MedicationType } from '@prisma/client'

/**
 * PATCH /api/patients/[id]/medication-groups/[groupId] — update protocol, names, schedule, tablets, times.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  const auth = await requireRole(req, ['DOCTOR'])
  if (!auth.authorized) return auth.response!

  const { id: patientId, groupId } = await params
  if (!patientId || !groupId) {
    return NextResponse.json({ error: 'Patient and group IDs required' }, { status: 400 })
  }

  const access = await assertDoctorPatientAccess(auth.user!, patientId)
  if (!access.ok) return access.response

  const existing = await prisma.medicationGroup.findFirst({
    where: {
      id: groupId,
      patientId,
      doctorId: access.doctorProfileId,
    },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Medication group not found' }, { status: 404 })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const data: {
    name?: string
    description?: string | null
    groupType?: MedicationType
    medications?: string[]
    medicationSchedule?: Prisma.InputJsonValue | null
    isActive?: boolean
  } = {}

  if (typeof body.name === 'string' && body.name.trim()) {
    data.name = body.name.trim()
  }
  if (body.description === null) {
    data.description = null
  } else if (typeof body.description === 'string') {
    data.description = body.description
  }
  if (body.groupType === 'PREVENTIVE' || body.groupType === 'RESCUE') {
    data.groupType = body.groupType
  }
  if (typeof body.isActive === 'boolean') {
    data.isActive = body.isActive
  }

  if ('medicationSchedule' in body) {
    if (body.medicationSchedule === null) {
      data.medicationSchedule = null
    } else {
      const schedule = parseMedicationSchedule(body.medicationSchedule)
      if (!schedule || schedule.length === 0) {
        return NextResponse.json({ error: 'medicationSchedule must be a non-empty array of rows' }, { status: 400 })
      }
      data.medicationSchedule = schedule as unknown as Prisma.InputJsonValue
      data.medications = namesFromSchedule(schedule)
    }
  } else if (Array.isArray(body.medications)) {
    const meds = (body.medications as unknown[])
      .filter((x): x is string => typeof x === 'string')
      .map((s) => s.trim())
      .filter(Boolean)
    if (meds.length === 0) {
      return NextResponse.json({ error: 'medications must be a non-empty array of strings' }, { status: 400 })
    }
    data.medications = meds
    data.medicationSchedule = null
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const updated = await prisma.medicationGroup.update({
    where: { id: groupId },
    data,
  })

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    groupType: updated.groupType,
    medications: updated.medications,
    medicationSchedule: updated.medicationSchedule,
    isActive: updated.isActive,
    description: updated.description,
  })
}
