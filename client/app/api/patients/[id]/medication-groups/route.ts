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
 * POST /api/patients/[id]/medication-groups — doctor creates a protocol with optional structured schedule.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, ['DOCTOR'])
  if (!auth.authorized) return auth.response!

  const { id: patientId } = await params
  if (!patientId) {
    return NextResponse.json({ error: 'Patient ID required' }, { status: 400 })
  }

  const access = await assertDoctorPatientAccess(auth.user!, patientId)
  if (!access.ok) return access.response

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const groupType =
    body.groupType === 'PREVENTIVE' || body.groupType === 'RESCUE'
      ? (body.groupType as MedicationType)
      : 'PREVENTIVE'

  const description = typeof body.description === 'string' ? body.description : undefined
  const color = typeof body.color === 'string' ? body.color : undefined

  const schedule = parseMedicationSchedule(body.medicationSchedule)
  let medications: string[] = []
  let scheduleJson: Prisma.InputJsonValue | undefined

  if (schedule && schedule.length > 0) {
    medications = namesFromSchedule(schedule)
    scheduleJson = schedule as unknown as Prisma.InputJsonValue
  } else if (Array.isArray(body.medications)) {
    medications = (body.medications as unknown[])
      .filter((x): x is string => typeof x === 'string')
      .map((s) => s.trim())
      .filter(Boolean)
  }

  if (medications.length === 0) {
    return NextResponse.json(
      { error: 'Provide medicationSchedule entries or a non-empty medications array' },
      { status: 400 }
    )
  }

  const created = await prisma.medicationGroup.create({
    data: {
      patientId,
      doctorId: access.doctorProfileId,
      name,
      description: description ?? null,
      groupType,
      medications,
      ...(scheduleJson !== undefined ? { medicationSchedule: scheduleJson } : {}),
      color: color ?? null,
    },
  })

  return NextResponse.json(
    {
      id: created.id,
      name: created.name,
      groupType: created.groupType,
      medications: created.medications,
      medicationSchedule: created.medicationSchedule,
    },
    { status: 201 }
  )
}
