import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'
import { assertDoctorPatientAccess } from '@/lib/doctor/assertDoctorPatientAccess'

function formatDate(d: Date): string {
  return new Date(d).toISOString().slice(0, 10)
}

/**
 * POST /api/patients/[id]/appointments/[appointmentId]/communications
 * Doctor logs a comment or communication tied to this visit.
 */
export async function POST(
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

  const message =
    typeof body.message === 'string' && body.message.trim() ? body.message.trim() : ''
  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  const communicationType =
    typeof body.communicationType === 'string' && body.communicationType.trim()
      ? body.communicationType.trim()
      : 'Comment'
  const channel =
    typeof body.channel === 'string' && body.channel.trim() ? body.channel.trim() : 'In-App'

  const appt = await prisma.appointment.findFirst({
    where: {
      id: appointmentId,
      patientId,
      doctorId: access.doctorProfileId,
    },
  })
  if (!appt) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
  }

  const created = await prisma.communication.create({
    data: {
      patientId,
      doctorId: access.doctorProfileId,
      appointmentId,
      communicationType,
      message,
      channel,
    },
    include: { doctor: { select: { name: true } } },
  })

  return NextResponse.json(
    {
      id: created.id,
      date: formatDate(created.createdAt),
      type: created.communicationType,
      message: created.message,
      channel: created.channel,
      author: created.doctor?.name ?? 'Doctor',
    },
    { status: 201 }
  )
}
