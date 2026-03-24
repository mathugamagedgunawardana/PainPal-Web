import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { hashPassword } from '@/lib/auth/password'
import { prisma } from '@/lib/prisma'

/** PATCH /api/admin/users/[id] – update user (ADMIN only). Body: { email?, role?, newPassword? } */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, ['ADMIN'])
  if (!auth.authorized) return auth.response!

  const { id: userId } = await params
  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim() : undefined
    const role = body.role
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : undefined

    if (email !== undefined && !email) {
      return NextResponse.json({ error: 'Email cannot be empty' }, { status: 400 })
    }
    if (role !== undefined && !['ADMIN', 'DOCTOR', 'PATIENT'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    if (newPassword !== undefined && newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const updateData: { email?: string; role?: 'ADMIN' | 'DOCTOR' | 'PATIENT'; passwordHash?: string } = {}
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (newPassword !== undefined) {
      updateData.passwordHash = await hashPassword(newPassword)
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }
    console.error('PATCH /api/admin/users/[id] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
