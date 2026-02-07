import { NextRequest, NextResponse } from 'next/server'
import { baseCrudHandler } from '../baseRoute/route'
import { requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'DOCTOR'])
  if (!auth.authorized) return auth.response!
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const doctorIdParam = searchParams.get('doctorId')
  const patientIdParam = searchParams.get('patientId')

  try {
    const where: Record<string, unknown> = {}

    if (auth.user?.role === 'DOCTOR') {
      const doctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId: auth.user.userId },
      })
      if (!doctorProfile) {
        return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
      }
      where.doctorId = doctorProfile.id
    } else if (doctorIdParam) {
      where.doctorId = doctorIdParam
    }

    if (patientIdParam) {
      where.patientId = patientIdParam
    }

    if (status) {
      where.linkStatus = status
    }

    const links = await prisma.patientDoctorLink.findMany({
      where,
      include: {
        patient: true,
        doctor: true,
      },
    })

    return NextResponse.json(links)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'DOCTOR'])
  if (!auth.authorized) return auth.response!
  return baseCrudHandler('patientDoctorLink', req)
}

export async function PUT(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'DOCTOR'])
  if (!auth.authorized) return auth.response!
  return baseCrudHandler('patientDoctorLink', req)
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'DOCTOR'])
  if (!auth.authorized) return auth.response!
  return baseCrudHandler('patientDoctorLink', req)
}

export async function DELETE(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'DOCTOR'])
  if (!auth.authorized) return auth.response!
  return baseCrudHandler('patientDoctorLink', req)
}
