import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'

/** GET /api/admin/users – list all users (ADMIN only). Excludes passwordHash; includes profile names. */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN'])
  if (!auth.authorized) return auth.response!

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        doctorProfile: { select: { name: true } },
        patientProfile: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    const list = users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      name: u.doctorProfile?.name ?? u.patientProfile?.name ?? u.email.split('@')[0],
    }))

    return NextResponse.json(list)
  } catch (error) {
    console.error('GET /api/admin/users error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
