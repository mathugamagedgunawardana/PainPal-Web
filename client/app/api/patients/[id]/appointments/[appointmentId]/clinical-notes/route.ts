import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'
import { assertDoctorPatientAccess } from '@/lib/doctor/assertDoctorPatientAccess'

function formatDate(d: Date): string {
  return new Date(d).toISOString().slice(0, 10)
}

/**
 * POST /api/patients/[id]/appointments/[appointmentId]/clinical-notes
 * Doctor adds a clinical note scoped to this visit.
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

  const noteContent =
    typeof body.noteContent === 'string' && body.noteContent.trim() ? body.noteContent.trim() : ''
  if (!noteContent) {
    return NextResponse.json({ error: 'noteContent is required' }, { status: 400 })
  }

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

  const created = await prisma.clinicalNote.create({
    data: {
      patientId,
      doctorId: access.doctorProfileId,
      appointmentId,
      noteContent,
    },
    include: { doctor: { select: { name: true } } },
  })

  return NextResponse.json(
    {
      id: created.id,
      date: formatDate(created.createdAt),
      note: created.noteContent,
      author: created.doctor?.name ?? 'Doctor',
    },
    { status: 201 }
  )
}
