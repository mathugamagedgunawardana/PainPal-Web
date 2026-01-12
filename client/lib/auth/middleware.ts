import { NextRequest, NextResponse } from 'next/server';
import { verifyRequest, JWTPayload } from '@/lib/auth/jwt';

/**
 * Middleware to verify JWT token and attach user to request
 */
export async function authenticateRequest(request: NextRequest): Promise<{
  authenticated: boolean;
  user: JWTPayload | null;
  response?: NextResponse;
}> {
    const payload = await verifyRequest(request);

    if (!payload) {
    return {
      authenticated: false,
      user: null,
      response: NextResponse.json(
        { error: 'Authentication required', message: 'No token provided' },
        { status: 401 }
      ),
    };
  }

  return {
    authenticated: true,
    user: payload,
  };
}

/**
 * Check if user has required role
 */
export function hasRole(
  user: JWTPayload | null,
  allowedRoles: Array<'ADMIN' | 'DOCTOR' | 'PATIENT'>
): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

/**
 * Middleware wrapper for role-based access control
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: Array<'ADMIN' | 'DOCTOR' | 'PATIENT'>
): Promise<{
  authorized: boolean;
  user: JWTPayload | null;
  response?: NextResponse;
}> {
  const auth = await authenticateRequest(request);

  if (!auth.authenticated) {
    return {
      authorized: false,
      user: null,
      response: auth.response,
    };
  }

  if (!hasRole(auth.user, allowedRoles)) {
    return {
      authorized: false,
      user: auth.user,
      response: NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      ),
    };
  }

  return {
    authorized: true,
    user: auth.user,
  };
}
