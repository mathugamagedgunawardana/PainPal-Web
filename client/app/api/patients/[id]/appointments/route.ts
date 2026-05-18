import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'
import { assertDoctorPatientAccess } from '@/lib/doctor/assertDoctorPatientAccess'
import {
  appointmentInclude,
  mapAppointmentsList,
} from '@/lib/doctor/formatPatientAppointments'
import { privateApiCacheHeaders } from '@/lib/http/cacheHeaders'
import type { AppointmentStatus } from '@prisma/client'

/** GET /api/patients/[id]/appointments — visit list with nested notes/comms/files (lazy-loaded). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(req, ['ADMIN', 'DOCTOR'])
  if (!auth.authorized) return auth.response!

  const { id: patientId } = await params
  if (!patientId) {
    return NextResponse.json({ error: 'Patient ID required' }, { status: 400 })
  }

  const access = await assertDoctorPatientAccess(auth.user!, patientId)
  if (!access.ok) return access.response

  const [appointmentsRaw, unlinkedNotesRaw, unlinkedCommunicationsRaw] = await Promise.all([
    prisma.appointment.findMany({
      where: { patientId, doctorId: access.doctorProfileId },
      orderBy: { appointmentDate: 'desc' },
      take: 20,
      include: appointmentInclude,
    }),
    prisma.clinicalNote.findMany({
      where: { patientId, doctorId: access.doctorProfileId, appointmentId: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { doctor: { select: { name: true } } },
    }),
    prisma.communication.findMany({
      where: { patientId, doctorId: access.doctorProfileId, appointmentId: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { doctor: { select: { name: true } } },
    }),
  ])

  const formatDate = (d: Date) => new Date(d).toISOString().slice(0, 10)

  return NextResponse.json(
    {
      appointments: mapAppointmentsList(appointmentsRaw),
      unlinkedNotes: unlinkedNotesRaw.map((n) => ({
        id: n.id,
        date: formatDate(n.createdAt),
        note: n.noteContent,
        author: n.doctor?.name ?? 'Doctor',
      })),
      unlinkedCommunications: unlinkedCommunicationsRaw.map((c) => ({
        id: c.id,
        date: formatDate(c.createdAt),
        type: c.communicationType,
        message: c.message,
        channel: c.channel,
        author: c.doctor?.name ?? '—',
      })),
    },
    { headers: privateApiCacheHeaders() }
  )
}

/**
 * POST /api/patients/[id]/appointments — doctor schedules a new appointment (default status SCHEDULED).
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

  const appointmentType =
    typeof body.appointmentType === 'string' && body.appointmentType.trim()
      ? body.appointmentType.trim()
      : ''
  if (!appointmentType) {
    return NextResponse.json({ error: 'appointmentType is required' }, { status: 400 })
  }

  let appointmentDate: Date
  if (typeof body.appointmentDate === 'string' && body.appointmentDate.trim()) {
    appointmentDate = new Date(body.appointmentDate.trim())
  } else {
    return NextResponse.json(
      { error: 'appointmentDate is required (ISO 8601 string)' },
      { status: 400 }
    )
  }
  if (Number.isNaN(appointmentDate.getTime())) {
    return NextResponse.json({ error: 'appointmentDate is not a valid date' }, { status: 400 })
  }

  let status: AppointmentStatus = 'SCHEDULED'
  if (typeof body.status === 'string') {
    const u = body.status.toUpperCase()
    if (u === 'SCHEDULED' || u === 'COMPLETED' || u === 'CANCELLED') {
      status = u as AppointmentStatus
    }
  }

  const notes = typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : null

  const created = await prisma.appointment.create({
    data: {
      patientId,
      doctorId: access.doctorProfileId,
      appointmentDate,
      appointmentType,
      status,
      notes,
      patientPresent: null,
    },
    include: { doctor: { select: { name: true } } },
  })

  return NextResponse.json(
    {
      id: created.id,
      date: created.appointmentDate.toISOString().slice(0, 10),
      type: created.appointmentType,
      doctor: created.doctor?.name ?? 'Doctor',
      status: created.status,
      patientPresent: created.patientPresent,
      notes: created.notes,
    },
    { status: 201 }
  )
}
