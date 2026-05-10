import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest, signToken, setAuthCookie } from '@/lib/auth/jwt'

export const dynamic = 'force-dynamic'

/**
 * Issue a new JWT using the current Bearer / cookie token (mobile + web).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing token' },
        { status: 401 }
      )
    }

    const token = await signToken({
      userId: user.userId,
      email: user.email,
      role: user.role,
      name: user.name,
    })
    await setAuthCookie(token)

    return NextResponse.json({ token })
  } catch (e) {
    console.error('Refresh error:', e)
    return NextResponse.json(
      { error: 'Internal server error', message: 'Token refresh failed' },
      { status: 500 }
    )
  }
}
