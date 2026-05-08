import { NextRequest, NextResponse } from 'next/server';
import type { DoctorProfile, PatientProfile } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { signToken, setAuthCookie } from '@/lib/auth/jwt';
import { doctorProfileToMobile, patientProfileToMobile } from '@/lib/auth/mobileAuthResponse';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role, name, phone, avatar, ...profileData } = body;
    const dobInput =
      profileData.dob ?? profileData.dateOfBirth ?? body.dateOfBirth ?? body.dob;

    // Validate required fields
    if (!email || !password || !role || !name) {
      return NextResponse.json(
        { error: 'Missing required fields', message: 'Email, password, role, and name are required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['ADMIN', 'DOCTOR', 'PATIENT'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role', message: 'Role must be ADMIN, DOCTOR, or PATIENT' },
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
          passwordHash: hashedPassword,
          role: 'ADMIN',
        },
      });
    } else if (role === 'DOCTOR') {
      // Doctor requires a clinicId - for now create with a placeholder or require it
      if (!profileData.clinicId) {
        return NextResponse.json(
          { error: 'Missing required field', message: 'Doctor registration requires a clinicId' },
          { status: 400 }
        );
      }
      
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          role: 'DOCTOR',
          doctorProfile: {
            create: {
              name,
              specialization: profileData.specialization || 'General Practice',
              clinicId: profileData.clinicId,
            },
          },
        },
        include: {
          doctorProfile: true,
        },
      });
    } else {
      // PATIENT role
      user = await prisma.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          role: 'PATIENT',
          patientProfile: {
            create: {
              name,
              dob: dobInput ? new Date(dobInput) : new Date(),
              gender: profileData.gender || null,
              phone: phone || null,
              email: email,
              address: profileData.address || null,
              condition: profileData.condition || null,
            },
          },
        },
        include: {
          patientProfile: true,
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

    const baseBody = {
      message: 'Registration successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name,
      },
    };

    if (role === 'PATIENT') {
      const patientProfile = (user as unknown as { patientProfile: PatientProfile }).patientProfile;
      return NextResponse.json(
        {
          ...baseBody,
          patientProfile: patientProfileToMobile(patientProfile),
        },
        { status: 201 }
      );
    }
    if (role === 'DOCTOR') {
      const doctorProfile = (user as unknown as { doctorProfile: DoctorProfile }).doctorProfile;
      return NextResponse.json(
        {
          ...baseBody,
          doctorProfile: doctorProfileToMobile(doctorProfile),
        },
        { status: 201 }
      );
    }

    return NextResponse.json(baseBody, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
