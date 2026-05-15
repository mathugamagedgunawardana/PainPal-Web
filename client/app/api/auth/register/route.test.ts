import { beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------
const {
  hashPasswordMock,
  signTokenMock,
  setAuthCookieMock,
  patientProfileToMobileMock,
  doctorProfileToMobileMock,
  prismaUserFindUniqueMock,
  prismaUserCreateMock,
} = vi.hoisted(() => ({
  hashPasswordMock: vi.fn(),
  signTokenMock: vi.fn(),
  setAuthCookieMock: vi.fn(),
  patientProfileToMobileMock: vi.fn(),
  doctorProfileToMobileMock: vi.fn(),
  prismaUserFindUniqueMock: vi.fn(),
  prismaUserCreateMock: vi.fn(),
}))

vi.mock('@/lib/auth/password', () => ({
  hashPassword: hashPasswordMock,
}))

vi.mock('@/lib/auth/jwt', () => ({
  signToken: signTokenMock,
  setAuthCookie: setAuthCookieMock,
}))

vi.mock('@/lib/auth/mobileAuthResponse', () => ({
  patientProfileToMobile: patientProfileToMobileMock,
  doctorProfileToMobile: doctorProfileToMobileMock,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: prismaUserFindUniqueMock,
      create: prismaUserCreateMock,
    },
  },
}))

import { POST } from './route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(body: Record<string, unknown>) {
  return { json: async () => body } as ReturnType<typeof Request>
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('POST /api/auth/register – input validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when email is missing', async () => {
    const res = await POST(makeRequest({ password: 'P@ss1', role: 'PATIENT', name: 'John' }) as any)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Missing required fields')
  })

  it('returns 400 when password is missing', async () => {
    const res = await POST(makeRequest({ email: 'a@b.com', role: 'PATIENT', name: 'John' }) as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 when role is missing', async () => {
    const res = await POST(makeRequest({ email: 'a@b.com', password: 'P@ss1', name: 'John' }) as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 when name is missing', async () => {
    const res = await POST(makeRequest({ email: 'a@b.com', password: 'P@ss1', role: 'PATIENT' }) as any)
    expect(res.status).toBe(400)
  })

  it('returns 400 for an unrecognised role', async () => {
    const res = await POST(
      makeRequest({ email: 'a@b.com', password: 'P@ss1', role: 'NURSE', name: 'John' }) as any
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Invalid role')
  })
})

describe('POST /api/auth/register – conflict detection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaUserFindUniqueMock.mockResolvedValue({ id: 'existing-id', email: 'taken@b.com' })
  })

  it('returns 409 when email is already taken', async () => {
    const res = await POST(
      makeRequest({ email: 'taken@b.com', password: 'P@ss1', role: 'PATIENT', name: 'John' }) as any
    )
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toBe('User exists')
  })
})

describe('POST /api/auth/register – PATIENT registration', () => {
  const createdPatient = {
    id: 'patient-id-1',
    email: 'jane@example.com',
    role: 'PATIENT' as const,
    patientProfile: {
      id: 'pp-1',
      userId: 'patient-id-1',
      name: 'Jane Doe',
      dob: new Date('1995-05-10'),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    prismaUserFindUniqueMock.mockResolvedValue(null)
    hashPasswordMock.mockResolvedValue('$2b$10$hashed')
    signTokenMock.mockResolvedValue('reg-jwt-token')
    setAuthCookieMock.mockResolvedValue(undefined)
    prismaUserCreateMock.mockResolvedValue(createdPatient)
    patientProfileToMobileMock.mockReturnValue({ id: 'pp-1', name: 'Jane Doe' })
  })

  it('returns 201 on successful patient registration', async () => {
    const res = await POST(
      makeRequest({ email: 'jane@example.com', password: 'P@ss1', role: 'PATIENT', name: 'Jane Doe' }) as any
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.message).toBe('Registration successful')
    expect(body.token).toBe('reg-jwt-token')
    expect(body.user.role).toBe('PATIENT')
  })

  it('includes patientProfile in the response', async () => {
    const res = await POST(
      makeRequest({ email: 'jane@example.com', password: 'P@ss1', role: 'PATIENT', name: 'Jane Doe' }) as any
    )
    const body = await res.json()
    expect(body.patientProfile).toBeDefined()
    expect(patientProfileToMobileMock).toHaveBeenCalledWith(createdPatient.patientProfile)
  })

  it('hashes the password before storing', async () => {
    await POST(
      makeRequest({ email: 'jane@example.com', password: 'P@ss1', role: 'PATIENT', name: 'Jane Doe' }) as any
    )
    expect(hashPasswordMock).toHaveBeenCalledWith('P@ss1')
    expect(prismaUserCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ passwordHash: '$2b$10$hashed' }),
      })
    )
  })

  it('sets auth cookie after registration', async () => {
    await POST(
      makeRequest({ email: 'jane@example.com', password: 'P@ss1', role: 'PATIENT', name: 'Jane Doe' }) as any
    )
    expect(setAuthCookieMock).toHaveBeenCalledWith('reg-jwt-token')
  })
})

describe('POST /api/auth/register – DOCTOR registration', () => {
  const createdDoctor = {
    id: 'doctor-id-1',
    email: 'dr@clinic.com',
    role: 'DOCTOR' as const,
    doctorProfile: {
      id: 'dp-1',
      userId: 'doctor-id-1',
      name: 'Dr. Smith',
      specialization: 'Neurology',
      clinicId: 'clinic-abc',
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    prismaUserFindUniqueMock.mockResolvedValue(null)
    hashPasswordMock.mockResolvedValue('$2b$10$hashed')
    signTokenMock.mockResolvedValue('doctor-token')
    setAuthCookieMock.mockResolvedValue(undefined)
    prismaUserCreateMock.mockResolvedValue(createdDoctor)
    doctorProfileToMobileMock.mockReturnValue({ id: 'dp-1', name: 'Dr. Smith' })
  })

  it('returns 400 when clinicId is missing for DOCTOR', async () => {
    const res = await POST(
      makeRequest({ email: 'dr@clinic.com', password: 'P@ss1', role: 'DOCTOR', name: 'Dr. Smith' }) as any
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toContain('clinicId')
  })

  it('returns 201 with doctorProfile when clinicId is provided', async () => {
    const res = await POST(
      makeRequest({
        email: 'dr@clinic.com',
        password: 'P@ss1',
        role: 'DOCTOR',
        name: 'Dr. Smith',
        clinicId: 'clinic-abc',
      }) as any
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.doctorProfile).toBeDefined()
    expect(doctorProfileToMobileMock).toHaveBeenCalledWith(createdDoctor.doctorProfile)
  })
})

describe('POST /api/auth/register – ADMIN registration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaUserFindUniqueMock.mockResolvedValue(null)
    hashPasswordMock.mockResolvedValue('$2b$10$hashed')
    signTokenMock.mockResolvedValue('admin-token')
    setAuthCookieMock.mockResolvedValue(undefined)
    prismaUserCreateMock.mockResolvedValue({ id: 'admin-id', email: 'admin@app.com', role: 'ADMIN' })
  })

  it('returns 201 without a profile for ADMIN', async () => {
    const res = await POST(
      makeRequest({ email: 'admin@app.com', password: 'P@ss1', role: 'ADMIN', name: 'Admin' }) as any
    )
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.patientProfile).toBeUndefined()
    expect(body.doctorProfile).toBeUndefined()
  })
})

describe('POST /api/auth/register – unexpected errors', () => {
  it('returns 500 when prisma.user.create throws', async () => {
    prismaUserFindUniqueMock.mockResolvedValue(null)
    hashPasswordMock.mockResolvedValue('$2b$10$hashed')
    prismaUserCreateMock.mockRejectedValue(new Error('db write failure'))

    const res = await POST(
      makeRequest({ email: 'a@b.com', password: 'P@ss1', role: 'PATIENT', name: 'John' }) as any
    )
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Internal server error')
  })

  it('returns 500 when request.json() throws', async () => {
    const req = { json: async () => { throw new Error('bad json') } }
    const res = await POST(req as any)
    expect(res.status).toBe(500)
  })
})
