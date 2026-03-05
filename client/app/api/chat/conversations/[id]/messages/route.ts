import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { getDoctorUserId } from '@/lib/auth/getDoctorUserId'
import { getPatientUserId } from '@/lib/auth/getPatientUserId'
import { prisma } from '@/lib/prisma'

async function getConversationAccess(
  conversationId: string,
  user: { role: string; userId?: string; email?: string }
): Promise<{ conversation: { id: string; doctorId: string; patientId: string } | null; error?: NextResponse }> {
  if (user.role === 'DOCTOR' || user.role === 'ADMIN') {
    const doctorUserId = await getDoctorUserId(user as { userId: string; email: string; role: string })
    if (!doctorUserId) return { conversation: null, error: NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 }) }
    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId } })
    if (!doctorProfile) return { conversation: null, error: NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 }) }
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, doctorId: doctorProfile.id },
    })
    return { conversation }
  }
  if (user.role === 'PATIENT') {
    const patientUserId = await getPatientUserId(user as { userId: string; email: string; role: string })
    if (!patientUserId) return { conversation: null, error: NextResponse.json({ error: 'Patient profile not found' }, { status: 404 }) }
    const patientProfile = await prisma.patientProfile.findUnique({ where: { userId: patientUserId } })
    if (!patientProfile) return { conversation: null, error: NextResponse.json({ error: 'Patient profile not found' }, { status: 404 }) }
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, patientId: patientProfile.id },
    })
    return { conversation }
  }
  return { conversation: null, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
}

/** GET /api/chat/conversations/[id]/messages – list messages (paginated) */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, ['ADMIN', 'DOCTOR', 'PATIENT'])
  if (!auth.authorized) return auth.response!

  const { id: conversationId } = await params
  if (!conversationId) {
    return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
  }

  const { conversation, error } = await getConversationAccess(conversationId, auth.user!)
  if (error) return error
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 100)
  const before = searchParams.get('before') // cursor: message id or createdAt

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(before ? { cursor: { id: before }, skip: 1 } : {}),
    })

    const hasMore = messages.length > limit
    const list = (hasMore ? messages.slice(0, limit) : messages).reverse()

    return NextResponse.json({
      messages: list.map((m) => ({
        id: m.id,
        senderRole: m.senderRole,
        content: m.content,
        createdAt: m.createdAt,
        readAt: m.readAt,
      })),
      hasMore,
      nextCursor: hasMore ? list[0]?.id : null,
    })
  } catch (e) {
    console.error('GET /api/chat/conversations/[id]/messages error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST /api/chat/conversations/[id]/messages – send a message */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, ['ADMIN', 'DOCTOR', 'PATIENT'])
  if (!auth.authorized) return auth.response!

  const { id: conversationId } = await params
  if (!conversationId) {
    return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 })
  }

  const { conversation, error } = await getConversationAccess(conversationId, auth.user!)
  if (error) return error
  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const content = typeof body.content === 'string' ? body.content.trim() : ''
  if (!content) {
    return NextResponse.json({ error: 'content required' }, { status: 400 })
  }

  const role = auth.user!.role
  const senderRole = role === 'DOCTOR' || role === 'ADMIN' ? 'DOCTOR' : 'PATIENT'
  const senderUserId = auth.user!.userId

  try {
    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderRole,
        senderUserId,
        content,
      },
    })
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })
    return NextResponse.json({
      id: message.id,
      senderRole: message.senderRole,
      content: message.content,
      createdAt: message.createdAt,
    })
  } catch (e) {
    console.error('POST /api/chat/conversations/[id]/messages error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
