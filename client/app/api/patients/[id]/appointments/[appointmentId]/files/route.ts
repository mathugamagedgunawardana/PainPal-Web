import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'
import { assertDoctorPatientAccess } from '@/lib/doctor/assertDoctorPatientAccess'

/**
 * POST /api/patients/[id]/appointments/[appointmentId]/files
 * Doctor registers file metadata for this visit (URL to stored object or external link).
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

  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : ''
  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const fileUrl =
    typeof body.fileUrl === 'string' && body.fileUrl.trim() ? body.fileUrl.trim() : null
  const fileName =
    typeof body.fileName === 'string' && body.fileName.trim() ? body.fileName.trim() : null
  const mimeType =
    typeof body.mimeType === 'string' && body.mimeType.trim() ? body.mimeType.trim() : null

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

  const created = await prisma.appointmentFile.create({
    data: {
      appointmentId,
      doctorId: access.doctorProfileId,
      title,
      fileUrl,
      fileName,
      mimeType,
    },
    include: { doctor: { select: { name: true } } },
  })

  return NextResponse.json(
    {
      id: created.id,
      title: created.title,
      fileUrl: created.fileUrl,
      fileName: created.fileName,
      createdAt: created.createdAt.toISOString(),
      uploadedBy: created.doctor?.name ?? 'Doctor',
    },
    { status: 201 }
  )
}
