import { NextRequest, NextResponse } from 'next/server';
import { signToken, setAuthCookie } from '@/lib/auth/jwt';
import { comparePassword } from '@/lib/auth/password';
import { doctorProfileToMobile, patientProfileToMobile } from '@/lib/auth/mobileAuthResponse';
import { triggerSeedPredictionSync } from '@/lib/model/syncSeedPredictions';

async function getPrismaSafe() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    return prisma;
  } catch (error) {
    console.error('Prisma initialization failed:', error);
    return null;
  }
}

// Hardcoded test users for development (used when not in DB)
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

    // 1. Try hardcoded users (development).
    // Map DOCTOR/PATIENT to seeded DB ids when Prisma is available so JWT userId is a real ObjectId
    // and patient APIs (Bearer token) resolve PatientProfile correctly.
    const hardcoded = Object.values(HARDCODED_USERS).find(u => u.email === email);
    if (hardcoded && hardcoded.password === password) {
      let userId = hardcoded.userId;
      let name = hardcoded.name;
      let useEmail = hardcoded.email;
      let patientProfileJson: ReturnType<typeof patientProfileToMobile> | undefined;
      let doctorProfileJson: ReturnType<typeof doctorProfileToMobile> | undefined;

      const prisma = await getPrismaSafe();
      if (prisma && hardcoded.role === 'DOCTOR') {
        void triggerSeedPredictionSync(prisma);
        const seedDoctor = await prisma.user.findUnique({
          where: { email: 'dr.johnson@clinic.example.com' },
          include: { doctorProfile: true },
        });
        if (seedDoctor?.doctorProfile) {
          userId = seedDoctor.id;
          name = seedDoctor.doctorProfile.name;
          useEmail = seedDoctor.email;
          doctorProfileJson = doctorProfileToMobile(seedDoctor.doctorProfile);
        }
      } else if (prisma && hardcoded.role === 'PATIENT') {
        void triggerSeedPredictionSync(prisma);
        const seedPatientUser = await prisma.user.findFirst({
          where: { role: 'PATIENT' },
          include: { patientProfile: true },
          orderBy: { createdAt: 'asc' },
        });
        if (seedPatientUser?.patientProfile) {
          userId = seedPatientUser.id;
          name = seedPatientUser.patientProfile.name;
          useEmail = seedPatientUser.email;
          patientProfileJson = patientProfileToMobile(seedPatientUser.patientProfile);
        }
      }

      const token = await signToken({
        userId,
        email: useEmail,
        role: hardcoded.role,
        name,
      });
      await setAuthCookie(token);
      return NextResponse.json(
        {
          message: 'Login successful',
          token,
          user: {
            id: userId,
            email: useEmail,
            role: hardcoded.role,
            name,
          },
          ...(patientProfileJson ? { patientProfile: patientProfileJson } : {}),
          ...(doctorProfileJson ? { doctorProfile: doctorProfileJson } : {}),
        },
        { status: 200 }
      );
    }

    // 2. Try database users (e.g. seed doctor: dr.johnson@clinic.example.com / SeedPassword123!)
    const prisma = await getPrismaSafe();
    const dbUser = prisma
      ? await prisma.user.findUnique({
          where: { email },
          include: {
            doctorProfile: true,
            patientProfile: true,
          },
        })
      : null;
    if (dbUser && await comparePassword(password, dbUser.passwordHash)) {
      if (prisma) {
        void triggerSeedPredictionSync(prisma);
      }
      const name =
        dbUser.doctorProfile?.name ??
        dbUser.patientProfile?.name ??
        email.split('@')[0];
      const token = await signToken({
        userId: dbUser.id,
        email: dbUser.email,
        role: dbUser.role,
        name,
      });
      await setAuthCookie(token);
      return NextResponse.json(
        {
          message: 'Login successful',
          token,
          user: {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
            name,
          },
          ...(dbUser.patientProfile
            ? { patientProfile: patientProfileToMobile(dbUser.patientProfile) }
            : {}),
          ...(dbUser.doctorProfile
            ? { doctorProfile: doctorProfileToMobile(dbUser.doctorProfile) }
            : {}),
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid credentials', message: 'Email or password is incorrect' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
