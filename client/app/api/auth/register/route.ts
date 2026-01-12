import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { signToken, setAuthCookie } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role, name, phone, avatar, ...profileData } = body;

    // Validate required fields
    if (!email || !password || !role || !name) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'Email, password, role, and name are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['ADMIN', 'TEACHER', 'STUDENT'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role', message: 'Role must be ADMIN, TEACHER, or STUDENT' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User exists', message: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with profile based on role
    let user;

    // Split name into first and last name if needed
    const nameParts = name.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    if (role === 'ADMIN') {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'ADMIN',
          admin: {
            create: {
              name,
              phone: phone || null,
              avatar: avatar || null,
            },
          },
        },
        include: {
          admin: true,
        },
      });
    } else if (role === 'TEACHER') {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'TEACHER',
          teacher: {
            create: {
              employeeId: profileData.employeeId || `EMP${Date.now()}`,
              firstName,
              lastName,
              phone: phone || '',
              address: profileData.address || null,
              department: profileData.department || null,
              subject: profileData.subject || null,
              avatar: avatar || null,
            },
          },
        },
        include: {
          teacher: true,
        },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'STUDENT',
          student: {
            create: {
              studentId: profileData.studentId || `STU${Date.now()}`,
              firstName,
              lastName,
              dateOfBirth: profileData.dateOfBirth ? new Date(profileData.dateOfBirth) : new Date(),
              phone: phone || '',
              address: profileData.address || '',
              parentName: profileData.parentName || '',
              parentEmail: profileData.parentEmail || '',
              parentPhone: profileData.parentPhone || '',
              enrollmentDate: new Date(),
              avatar: avatar || null,
            },
          },
        },
        include: {
          student: true,
        },
      });
    }

    // Generate JWT token
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name,
    });

    // Set auth cookie
    await setAuthCookie(token);

    return NextResponse.json(
      {
        message: 'Registration successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
