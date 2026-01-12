import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';

/**
 * Verify token and return current user info
 */
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);

  if (!auth.authenticated || !auth.user) {
    return auth.response;
  }

  return NextResponse.json(
    {
      message: 'Token is valid',
      user: auth.user,
    },
    { status: 200 }
  );
}
