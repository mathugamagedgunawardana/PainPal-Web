import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'
import { assertDoctorPatientAccess } from '@/lib/doctor/assertDoctorPatientAccess'
import type { AppointmentStatus } from '@prisma/client'

/**
 * PATCH /api/patients/[id]/appointments/[appointmentId]
 * Doctor updates attendance (patientPresent) and/or status (e.g. mark completed after visit).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; appointmentId: string }> }
) {
  const auth = await requireRole(req, ['DOCTOR'])
  if (!auth.authorized) return auth.response!

  const { id: patientId, appointmentId } = await params
  if (!patientId || !appointmentId) {
    return NextResponse.json({ error: 'Patient and appointment IDs required' }, { status: 400 })
  }

  const access = await assertDoctorPatientAccess(auth.user!, patientId)
  if (!access.ok) return access.response

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const existing = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      patientId,
      doctorId: access.doctorProfileId,
    },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
  }

  const data: {
    patientPresent?: boolean | null
    status?: AppointmentStatus
    notes?: string | null
  } = {}

  if ('patientPresent' in body) {
    const v = body.patientPresent
    if (v === null) {
      data.patientPresent = null
    } else if (typeof v === 'boolean') {
      data.patientPresent = v
    } else {
      return NextResponse.json({ error: 'patientPresent must be boolean or null' }, { status: 400 })
    }
  }

  if (typeof body.status === 'string') {
    const allowed: AppointmentStatus[] = ['SCHEDULED', 'COMPLETED', 'CANCELLED']
    if (!allowed.includes(body.status as AppointmentStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    data.status = body.status as AppointmentStatus
  }

  if (body.markCompleted === true) {
    data.status = 'COMPLETED'
  }

  if ('notes' in body) {
    if (body.notes === null) {
      data.notes = null
    } else if (typeof body.notes === 'string') {
      data.notes = body.notes
    } else {
      return NextResponse.json({ error: 'notes must be string or null' }, { status: 400 })
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data,
    include: { doctor: { select: { name: true } } },
  })

  return NextResponse.json({
    id: updated.id,
    patientPresent: updated.patientPresent,
    status: updated.status,
    appointmentDate: updated.appointmentDate.toISOString(),
    appointmentType: updated.appointmentType,
    doctor: updated.doctor?.name ?? 'Doctor',
    notes: updated.notes,
  })
}
