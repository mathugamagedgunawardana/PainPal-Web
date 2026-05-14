import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { getPatientUserId } from '@/lib/auth/getPatientUserId'
import { prisma } from '@/lib/prisma'
import { LinkStatus } from '@prisma/client'

/** GET /api/patient/linked-doctors – ACTIVE linked doctors for the current patient */
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
    const links = await prisma.patientDoctorLink.findMany({
      where: {
        patientId: patient.id,
        linkStatus: LinkStatus.ACTIVE,
      },
      include: {
        doctor: {
          include: { clinic: { select: { id: true, name: true, address: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const doctors = links.map((l) => ({
      doctorId: l.doctor.id,
      name: l.doctor.name,
      specialization: l.doctor.specialization,
      clinicName: l.doctor.clinic.name,
      clinicAddress: l.doctor.clinic.address,
    }))

    return NextResponse.json({ doctors })
  } catch (e) {
    console.error('GET /api/patient/linked-doctors:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
