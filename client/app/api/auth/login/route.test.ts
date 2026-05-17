import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'

// ---------------------------------------------------------------------------
// Hoisted mocks (must be declared before imports that reference them)
// ---------------------------------------------------------------------------
const {
  signTokenMock,
  setAuthCookieMock,
  comparePasswordMock,
  triggerSeedPredictionSyncMock,
  patientProfileToMobileMock,
  doctorProfileToMobileMock,
  prismaUserFindUniqueMock,
  prismaUserFindFirstMock,
} = vi.hoisted(() => ({
  signTokenMock: vi.fn(),
  setAuthCookieMock: vi.fn(),
  comparePasswordMock: vi.fn(),
  triggerSeedPredictionSyncMock: vi.fn(),
  patientProfileToMobileMock: vi.fn(),
  doctorProfileToMobileMock: vi.fn(),
  prismaUserFindUniqueMock: vi.fn(),
  prismaUserFindFirstMock: vi.fn(),
}))

vi.mock('@/lib/auth/jwt', () => ({
  signToken: signTokenMock,
  setAuthCookie: setAuthCookieMock,
}))

vi.mock('@/lib/auth/password', () => ({
  comparePassword: comparePasswordMock,
}))

vi.mock('@/lib/model/syncSeedPredictions', () => ({
  triggerSeedPredictionSync: triggerSeedPredictionSyncMock,
}))

vi.mock('@/lib/auth/mobileAuthResponse', () => ({
  patientProfileToMobile: patientProfileToMobileMock,
  doctorProfileToMobile: doctorProfileToMobileMock,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: prismaUserFindUniqueMock,
      findFirst: prismaUserFindFirstMock,
    },
  },
}))

// Also mock the dynamic import path used inside the route's getPrismaSafe()
vi.mock('../../../../../../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: prismaUserFindUniqueMock,
      findFirst: prismaUserFindFirstMock,
    },
  },
}))

import { POST } from './route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(body: Record<string, unknown>) {
  return {
    json: async () => body,
  } as ReturnType<typeof Request>
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('POST /api/auth/login – input validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signTokenMock.mockResolvedValue('mock-jwt-token')
    setAuthCookieMock.mockResolvedValue(undefined)
    triggerSeedPredictionSyncMock.mockReturnValue(undefined)
    delete process.env.DATABASE_URL
  })

  it('returns 400 when email is missing', async () => {
    const req = makeRequest({ password: 'Doctor@123' })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Missing credentials')
  })

  it('returns 400 when password is missing', async () => {
    const req = makeRequest({ email: 'doctor@painpal.com' })
    const res = await POST(req as any)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Missing credentials')
  })

  it('returns 400 when both fields are missing', async () => {
    const req = makeRequest({})
    const res = await POST(req as any)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/auth/login – hardcoded users (no DATABASE_URL)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    signTokenMock.mockResolvedValue('mock-jwt-token')
    setAuthCookieMock.mockResolvedValue(undefined)
    triggerSeedPredictionSyncMock.mockReturnValue(undefined)
    delete process.env.DATABASE_URL
  })

  it('returns 200 for hardcoded patient credentials', async () => {
    const req = makeRequest({ email: 'patient@painpal.com', password: 'Patient@123' })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Login successful')
    expect(body.token).toBe('mock-jwt-token')
    expect(body.user.role).toBe('PATIENT')
    expect(body.user.email).toBe('patient@painpal.com')
  })

  it('returns 200 for hardcoded doctor credentials', async () => {
    const req = makeRequest({ email: 'doctor@painpal.com', password: 'Doctor@123' })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Login successful')
    expect(body.user.role).toBe('DOCTOR')
  })

  it('returns 200 for hardcoded admin credentials', async () => {
    const req = makeRequest({ email: 'admin@painpal.com', password: 'Admin@123' })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user.role).toBe('ADMIN')
  })

  it('returns 401 for correct hardcoded email but wrong password', async () => {
    const req = makeRequest({ email: 'patient@painpal.com', password: 'WrongPass' })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Invalid credentials')
  })

  it('calls signToken with correct payload for patient', async () => {
    const req = makeRequest({ email: 'patient@painpal.com', password: 'Patient@123' })
    await POST(req as any)
    expect(signTokenMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'PATIENT', email: 'patient@painpal.com' })
    )
  })

  it('calls setAuthCookie after successful login', async () => {
    const req = makeRequest({ email: 'admin@painpal.com', password: 'Admin@123' })
    await POST(req as any)
    expect(setAuthCookieMock).toHaveBeenCalledWith('mock-jwt-token')
  })
})

describe('POST /api/auth/login – database users', () => {
  const dbPatient = {
    id: 'db-patient-id',
    email: 'real@patient.com',
    passwordHash: '$2b$10$hashedpassword',
    role: 'PATIENT' as const,
    doctorProfile: null,
    patientProfile: {
      id: 'pp-1',
      name: 'Real Patient',
      dob: new Date('1990-01-01'),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    signTokenMock.mockResolvedValue('db-jwt-token')
    setAuthCookieMock.mockResolvedValue(undefined)
    triggerSeedPredictionSyncMock.mockReturnValue(undefined)
    comparePasswordMock.mockResolvedValue(true)
    patientProfileToMobileMock.mockReturnValue({ id: 'pp-1', name: 'Real Patient' })
    process.env.DATABASE_URL = 'mongodb://localhost/test'
  })

  afterEach(() => {
    delete process.env.DATABASE_URL
  })

  it('returns 200 for a valid database user', async () => {
    prismaUserFindUniqueMock.mockResolvedValue(dbPatient)
    const req = makeRequest({ email: 'real@patient.com', password: 'correctPass' })
    const res = await POST(req as any)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toBe('Login successful')
    expect(body.token).toBe('db-jwt-token')
    expect(body.user.id).toBe('db-patient-id')
  })

  it('includes patientProfile in response when present', async () => {
    prismaUserFindUniqueMock.mockResolvedValue(dbPatient)
    const req = makeRequest({ email: 'real@patient.com', password: 'correctPass' })
    const res = await POST(req as any)
    const body = await res.json()
    expect(body.patientProfile).toBeDefined()
    expect(patientProfileToMobileMock).toHaveBeenCalledWith(dbPatient.patientProfile)
  })

  it('returns 401 when password does not match', async () => {
    prismaUserFindUniqueMock.mockResolvedValue(dbPatient)
    comparePasswordMock.mockResolvedValue(false)
    const req = makeRequest({ email: 'real@patient.com', password: 'wrongPass' })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Invalid credentials')
  })

  it('returns 401 when user is not found in DB', async () => {
    prismaUserFindUniqueMock.mockResolvedValue(null)
    const req = makeRequest({ email: 'nobody@example.com', password: 'anything' })
    const res = await POST(req as any)
    expect(res.status).toBe(401)
  })

  it('returns 503 when database lookup throws', async () => {
    prismaUserFindUniqueMock.mockRejectedValue(new Error('ECONNREFUSED'))
    const req = makeRequest({ email: 'real@patient.com', password: 'pass' })
    const res = await POST(req as any)
    expect(res.status).toBe(503)
    const body = await res.json()
    expect(body.error).toBe('Database unavailable')
  })
})

describe('POST /api/auth/login – unexpected errors', () => {
  it('returns 500 when request.json() throws', async () => {
    const req = { json: async () => { throw new Error('parse error') } }
    const res = await POST(req as any)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Internal server error')
  })
})
