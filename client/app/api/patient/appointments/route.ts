import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { getPatientUserId } from '@/lib/auth/getPatientUserId'
import { prisma } from '@/lib/prisma'
import { AppointmentStatus, LinkStatus } from '@prisma/client'

/** GET /api/patient/appointments – this patient's appointments (newest first) */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['PATIENT'])
  if (!auth.authorized) return auth.response!

  const patientUserId = await getPatientUserId(auth.user!)
  if (!patientUserId) {
    return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
  }

  const patient = await prisma.patientProfile.findUnique({
    where: { userId: patientUserId },
  })
  if (!patient) {
    return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
  }

  try {
    const rows = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: {
        doctor: { select: { id: true, name: true, specialization: true } },
      },
      orderBy: { appointmentDate: 'desc' },
      take: 50,
    })

    const appointments = rows.map((a) => ({
      id: a.id,
      doctorId: a.doctorId,
      doctorName: a.doctor.name,
      specialization: a.doctor.specialization,
      appointmentDate: a.appointmentDate.toISOString(),
      appointmentType: a.appointmentType,
      status: a.status,
      notes: a.notes,
    }))

    return NextResponse.json({ appointments })
  } catch (e) {
    console.error('GET /api/patient/appointments:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST /api/patient/appointments – schedule with a linked doctor */
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['PATIENT'])
  if (!auth.authorized) return auth.response!

  const patientUserId = await getPatientUserId(auth.user!)
  if (!patientUserId) {
    return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
  }

  const patient = await prisma.patientProfile.findUnique({
    where: { userId: patientUserId },
  })
  if (!patient) {
    return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
  }

  let body: { doctorId?: string; appointmentDate?: string; appointmentType?: string; notes?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const doctorId = typeof body.doctorId === 'string' ? body.doctorId.trim() : ''
  const dateRaw = typeof body.appointmentDate === 'string' ? body.appointmentDate.trim() : ''
  if (!doctorId || !dateRaw) {
    return NextResponse.json({ error: 'doctorId and appointmentDate (ISO) are required' }, { status: 400 })
  }

  const appointmentDate = new Date(dateRaw)
  if (Number.isNaN(appointmentDate.getTime())) {
    return NextResponse.json({ error: 'Invalid appointmentDate' }, { status: 400 })
  }

  const appointmentType =
    typeof body.appointmentType === 'string' && body.appointmentType.trim().length > 0
      ? body.appointmentType.trim()
      : 'General visit'

  const notes =
    typeof body.notes === 'string' && body.notes.trim().length > 0 ? body.notes.trim() : null

  try {
    const link = await prisma.patientDoctorLink.findFirst({
      where: {
        patientId: patient.id,
        doctorId,
        linkStatus: LinkStatus.ACTIVE,
      },
    })
    if (!link) {
      return NextResponse.json(
        { error: 'Doctor is not linked to your account or link is not active' },
        { status: 403 },
      )
    }

    const created = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId,
        appointmentDate,
        appointmentType,
        status: AppointmentStatus.SCHEDULED,
        notes,
      },
      include: {
        doctor: { select: { name: true, specialization: true } },
      },
    })

    return NextResponse.json({
      id: created.id,
      doctorId: created.doctorId,
      doctorName: created.doctor.name,
      specialization: created.doctor.specialization,
      appointmentDate: created.appointmentDate.toISOString(),
      appointmentType: created.appointmentType,
      status: created.status,
    })
  } catch (e) {
    console.error('POST /api/patient/appointments:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
