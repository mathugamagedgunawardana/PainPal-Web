import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { getDoctorUserId } from '@/lib/auth/getDoctorUserId'
import { getPatientUserId } from '@/lib/auth/getPatientUserId'
import { prisma } from '@/lib/prisma'

/** GET /api/chat/conversations – list conversations for the current user (doctor or patient) */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'DOCTOR', 'PATIENT'])
  if (!auth.authorized) return auth.response!

  try {
    if (auth.user?.role === 'DOCTOR' || auth.user?.role === 'ADMIN') {
      const doctorUserId = await getDoctorUserId(auth.user)
      if (!doctorUserId) {
        return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
      }
      const doctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId: doctorUserId },
      })
      if (!doctorProfile) {
        return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
      }

      const conversations = await prisma.conversation.findMany({
        where: { doctorId: doctorProfile.id },
        include: {
          patient: { select: { id: true, name: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      })

      const list = conversations.map((c) => ({
        id: c.id,
        otherParty: { id: c.patient.id, name: c.patient.name },
        lastMessage: c.messages[0]
          ? {
              content: c.messages[0].content.slice(0, 80),
              createdAt: c.messages[0].createdAt,
              senderRole: c.messages[0].senderRole,
            }
          : null,
        updatedAt: c.updatedAt,
      }))

      return NextResponse.json(list)
    }

    if (auth.user?.role === 'PATIENT') {
      const patientUserId = await getPatientUserId(auth.user)
      if (!patientUserId) {
        return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
      }
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { userId: patientUserId },
      })
      if (!patientProfile) {
        return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
      }

      const conversations = await prisma.conversation.findMany({
        where: { patientId: patientProfile.id },
        include: {
          doctor: { select: { id: true, name: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      })

      const list = conversations.map((c) => ({
        id: c.id,
        otherParty: { id: c.doctor.id, name: c.doctor.name },
        lastMessage: c.messages[0]
          ? {
              content: c.messages[0].content.slice(0, 80),
              createdAt: c.messages[0].createdAt,
              senderRole: c.messages[0].senderRole,
            }
          : null,
        updatedAt: c.updatedAt,
      }))

      return NextResponse.json(list)
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } catch (error) {
    console.error('GET /api/chat/conversations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST /api/chat/conversations – find or create a conversation (doctor sends patientId, patient sends doctorId) */
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'DOCTOR', 'PATIENT'])
  if (!auth.authorized) return auth.response!

  try {
    const body = await req.json().catch(() => ({}))
    const patientId = body.patientId as string | undefined
    const doctorId = body.doctorId as string | undefined

    if (auth.user?.role === 'DOCTOR' || auth.user?.role === 'ADMIN') {
      if (!patientId) {
        return NextResponse.json({ error: 'patientId required' }, { status: 400 })
      }
      const doctorUserId = await getDoctorUserId(auth.user)
      if (!doctorUserId) {
        return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
      }
      const doctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId: doctorUserId },
      })
      if (!doctorProfile) {
        return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
      }

      const link = await prisma.patientDoctorLink.findFirst({
        where: {
          doctorId: doctorProfile.id,
          patientId,
          linkStatus: 'ACTIVE',
        },
      })
      if (!link) {
        return NextResponse.json({ error: 'Patient not linked or access denied' }, { status: 403 })
      }

      let conv = await prisma.conversation.findUnique({
        where: {
          doctorId_patientId: { doctorId: doctorProfile.id, patientId },
        },
      })
      if (!conv) {
        conv = await prisma.conversation.create({
          data: { doctorId: doctorProfile.id, patientId },
        })
      }
      return NextResponse.json({ id: conv.id, doctorId: conv.doctorId, patientId: conv.patientId })
    }

    if (auth.user?.role === 'PATIENT') {
      if (!doctorId) {
        return NextResponse.json({ error: 'doctorId required' }, { status: 400 })
      }
      const patientUserId = await getPatientUserId(auth.user)
      if (!patientUserId) {
        return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
      }
      const patientProfile = await prisma.patientProfile.findUnique({
        where: { userId: patientUserId },
      })
      if (!patientProfile) {
        return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
      }

      const link = await prisma.patientDoctorLink.findFirst({
        where: {
          doctorId,
          patientId: patientProfile.id,
          linkStatus: 'ACTIVE',
        },
      })
      if (!link) {
        return NextResponse.json({ error: 'Doctor not linked or access denied' }, { status: 403 })
      }

      let conv = await prisma.conversation.findUnique({
        where: {
          doctorId_patientId: { doctorId, patientId: patientProfile.id },
        },
      })
      if (!conv) {
        conv = await prisma.conversation.create({
          data: { doctorId, patientId: patientProfile.id },
        })
      }
      return NextResponse.json({ id: conv.id, doctorId: conv.doctorId, patientId: conv.patientId })
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  } catch (error) {
    console.error('POST /api/chat/conversations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
