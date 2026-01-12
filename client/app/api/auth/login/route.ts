import { NextRequest, NextResponse } from 'next/server';
import { signToken, setAuthCookie } from '@/lib/auth/jwt';

// Hardcoded test users for development
const HARDCODED_USERS = {
  doctor: {
    userId: 'doctor-001',
    email: 'doctor@painpal.com',
    password: 'Doctor@123',
    role: 'DOCTOR' as const,
    name: 'Dr. John Smith',
  },
  patient: {
    userId: 'patient-001',
    email: 'patient@painpal.com',
    password: 'Patient@123',
    role: 'PATIENT' as const,
    name: 'Jane Doe',
  },
  admin: {
    userId: 'admin-001',
    email: 'admin@painpal.com',
    password: 'Admin@123',
    role: 'ADMIN' as const,
    name: 'Admin User',
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing credentials', message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find hardcoded user by email
    const user = Object.values(HARDCODED_USERS).find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials', message: 'Email or password is incorrect' },
        { status: 401 }
      );
    }

    // Simple password check (hardcoded for development)
    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid credentials', message: 'Email or password is incorrect' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await signToken({
      userId: user.userId,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    // Set auth cookie
    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: 'Login successful',
        token,
        user: {
          id: user.userId,
          email: user.email,
          role: user.role,
          name: user.name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
