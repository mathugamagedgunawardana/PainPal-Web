import { NextRequest, NextResponse } from 'next/server'
import { baseCrudHandler } from '../baseRoute/route'
import { requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'PATIENT', 'DOCTOR'])
  if (!auth.authorized) return auth.response!
  if (auth.user?.role === 'DOCTOR') {
    try {
      const doctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId: auth.user.userId },
      })
      if (!doctorProfile) {
        return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
      }

      const links = await prisma.patientDoctorLink.findMany({
        where: {
          doctorId: doctorProfile.id,
          linkStatus: 'ACTIVE',
        },
        include: {
          patient: true,
        },
      })

      const patients = links.map((link) => link.patient)
      return NextResponse.json(patients)
    } catch (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  return baseCrudHandler('patientProfile', req)
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN'])
  if (!auth.authorized) return auth.response!
  return baseCrudHandler('patientProfile', req)
}

export async function PUT(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'PATIENT'])
  if (!auth.authorized) return auth.response!
  return baseCrudHandler('patientProfile', req)
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'PATIENT'])
  if (!auth.authorized) return auth.response!
  return baseCrudHandler('patientProfile', req)
}

export async function DELETE(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN'])
  if (!auth.authorized) return auth.response!
  return baseCrudHandler('patientProfile', req)
}
