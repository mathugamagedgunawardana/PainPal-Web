import { SignJWT, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);
const JWT_EXPIRES_IN = '1d'; // Token expires in 7 days

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'DOCTOR' | 'PATIENT';
  name: string;
}

export interface TokenResponse {
  token: string;
  user: JWTPayload;
}

/**
 * Generate a JWT token with user payload
 */
export async function signToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET);
  
  return token;
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Get token from cookies
 */
export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token');
  return token?.value || null;
}

/**
 * Set auth token in cookies
 */
export async function setAuthCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Remove auth token from cookies
 */
export async function removeAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}

/**
 * Middleware to verify JWT from request
 */
export async function verifyRequest(request: NextRequest): Promise<JWTPayload | null> {
  // Try to get token from cookie first
  const cookieToken = request.cookies.get('auth-token')?.value;
  
  // If no cookie, try Authorization header
  const authHeader = request.headers.get('authorization');
  const headerToken = extractTokenFromHeader(authHeader);
  
  const token = cookieToken || headerToken;
  
  if (!token) {
    return null;
  }
  
  return await verifyToken(token);
}

/**
 * Role-based access control middleware
 */
export function requireRole(...allowedRoles: Array<'ADMIN' | 'TEACHER' | 'STUDENT'>) {
  return async (request: NextRequest) => {
    const user = await verifyRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - No valid token' },
        { status: 401 }
      );
    }
    
    if (!allowedRoles.includes(user.role as any)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Attach user to request for use in route handlers
    return { user };
  };
}

/**
 * Higher-order function to protect API routes
 */
export function withAuth(
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>,
  allowedRoles?: Array<'ADMIN' | 'DOCTOR' | 'PATIENT'>
) {
  return async (request: NextRequest) => {
    const user = await verifyRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      );
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role as any)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }
    
    return handler(request, user);
  };
}
