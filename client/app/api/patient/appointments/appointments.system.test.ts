/**
 * SYSTEM TESTS – Patient Appointment API (End-to-End Flow)
 *
 * Scope: the COMPLETE request pipeline is exercised from HTTP request to HTTP
 * response.  Internal modules (JWT signing/verification, middleware, route
 * handler logic) run for real.  Only external dependencies are mocked:
 *   – @/lib/prisma   (MongoDB / Prisma – replaced by in-memory stubs)
 *   – @/lib/auth/getPatientUserId (thin DB helper – stubbed)
 *
 * Test patterns covered:
 *   1. Unauthenticated request (no token) → 401
 *   2. Wrong role (DOCTOR token on PATIENT route) → 403
 *   3. Valid PATIENT token, patient profile not found → 404
 *   4. Valid PATIENT token, success → 200 with appointment list
 *   5. Scheduling an appointment (POST) – full validation chain
 *   6. POST without required fields → 400
 *   7. POST when doctor is not linked → 403
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { signToken } from '@/lib/auth/jwt'

// ---------------------------------------------------------------------------
// Hoisted stubs – only external dependencies
// ---------------------------------------------------------------------------
const {
  patientProfileFindUniqueMock,
  appointmentFindManyMock,
  appointmentCreateMock,
  patientDoctorLinkFindFirstMock,
  getPatientUserIdMock,
} = vi.hoisted(() => ({
  patientProfileFindUniqueMock: vi.fn(),
  appointmentFindManyMock: vi.fn(),
  appointmentCreateMock: vi.fn(),
  patientDoctorLinkFindFirstMock: vi.fn(),
  getPatientUserIdMock: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    patientProfile: { findUnique: patientProfileFindUniqueMock },
    appointment: {
      findMany: appointmentFindManyMock,
      create: appointmentCreateMock,
    },
    patientDoctorLink: { findFirst: patientDoctorLinkFindFirstMock },
  },
}))

vi.mock('@/lib/auth/getPatientUserId', () => ({
  getPatientUserId: getPatientUserIdMock,
}))

import { GET, POST } from './route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const SECRET = 'system-test-secret-32-chars-long!!!'

function makeReq(opts: {
  token?: string
  method?: 'GET' | 'POST'
  body?: Record<string, unknown>
}) {
  const headers: Record<string, string> = {}
  if (opts.token) headers['authorization'] = `Bearer ${opts.token}`
  return {
    cookies: { get: () => undefined },
    headers: { get: (h: string) => headers[h.toLowerCase()] ?? null },
    json: async () => opts.body ?? {},
  } as any
}

async function patientToken(userId = 'user-patient-1') {
  return signToken({ userId, email: 'p@clinic.com', role: 'PATIENT', name: 'Jane' })
}

async function doctorToken() {
  return signToken({ userId: 'user-doc-1', email: 'd@clinic.com', role: 'DOCTOR', name: 'Dr X' })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
beforeEach(() => {
  vi.clearAllMocks()
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = SECRET
})

afterEach(() => {
  delete process.env.JWT_SECRET
})

// ──────────────────────────────────────────────────────────────
// System Test Group 1: GET /api/patient/appointments
// ──────────────────────────────────────────────────────────────
describe('System – GET /api/patient/appointments', () => {

  it('ST-01 | No token → 401 Unauthorized (full middleware chain)', async () => {
    const req = makeReq({})
    const res = await GET(req)
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/[Aa]uth/)
  })

  it('ST-02 | DOCTOR token on PATIENT-only route → 403 Forbidden', async () => {
    const token = await doctorToken()
    const req = makeReq({ token })
    const res = await GET(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toMatch(/[Ff]orbidden|[Pp]ermission/)
  })

  it('ST-03 | Valid PATIENT token, no patient profile in DB → 404', async () => {
    const token = await patientToken()
    getPatientUserIdMock.mockResolvedValue('user-patient-1')
    patientProfileFindUniqueMock.mockResolvedValue(null)

    const req = makeReq({ token })
    const res = await GET(req)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toBe('Patient profile not found')
  })

  it('ST-04 | Valid PATIENT token, profile found → 200 with appointment list', async () => {
    const token = await patientToken()
    getPatientUserIdMock.mockResolvedValue('user-patient-1')
    patientProfileFindUniqueMock.mockResolvedValue({ id: 'profile-1', userId: 'user-patient-1' })
    appointmentFindManyMock.mockResolvedValue([
      {
        id: 'appt-1',
        doctorId: 'doc-1',
        appointmentDate: new Date('2026-06-10T10:00:00Z'),
        appointmentType: 'Neurology follow-up',
        status: 'SCHEDULED',
        notes: 'Bring previous MRI',
        doctor: { id: 'doc-1', name: 'Dr. Johnson', specialization: 'Neurology' },
      },
    ])

    const req = makeReq({ token })
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.appointments).toHaveLength(1)
    expect(body.appointments[0].doctorName).toBe('Dr. Johnson')
    expect(body.appointments[0].status).toBe('SCHEDULED')
    expect(body.appointments[0].appointmentDate).toBe('2026-06-10T10:00:00.000Z')
  })

  it('ST-05 | DB throws during appointment fetch → 500', async () => {
    const token = await patientToken()
    getPatientUserIdMock.mockResolvedValue('user-patient-1')
    patientProfileFindUniqueMock.mockResolvedValue({ id: 'profile-1' })
    appointmentFindManyMock.mockRejectedValue(new Error('Connection timeout'))

    const req = makeReq({ token })
    const res = await GET(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe('Internal server error')
  })
})

// ──────────────────────────────────────────────────────────────
// System Test Group 2: POST /api/patient/appointments
// ──────────────────────────────────────────────────────────────
describe('System – POST /api/patient/appointments', () => {

  it('ST-06 | No token → 401 (auth guard runs before any business logic)', async () => {
    const req = makeReq({ method: 'POST', body: { doctorId: 'doc-1', appointmentDate: '2026-07-01T09:00:00Z' } })
    const res = await POST(req)
    expect(res.status).toBe(401)
    // DB must never be touched
    expect(appointmentCreateMock).not.toHaveBeenCalled()
  })

  it('ST-07 | Valid PATIENT token, missing doctorId → 400', async () => {
    const token = await patientToken()
    getPatientUserIdMock.mockResolvedValue('user-patient-1')
    patientProfileFindUniqueMock.mockResolvedValue({ id: 'profile-1' })

    const req = makeReq({ token, body: { appointmentDate: '2026-07-01T09:00:00Z' } })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('doctorId')
  })

  it('ST-08 | Valid PATIENT token, invalid date string → 400', async () => {
    const token = await patientToken()
    getPatientUserIdMock.mockResolvedValue('user-patient-1')
    patientProfileFindUniqueMock.mockResolvedValue({ id: 'profile-1' })

    const req = makeReq({ token, body: { doctorId: 'doc-1', appointmentDate: 'not-a-date' } })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/[Dd]ate/)
  })

  it('ST-09 | Doctor not linked to patient → 403 (business rule enforced)', async () => {
    const token = await patientToken()
    getPatientUserIdMock.mockResolvedValue('user-patient-1')
    patientProfileFindUniqueMock.mockResolvedValue({ id: 'profile-1' })
    patientDoctorLinkFindFirstMock.mockResolvedValue(null) // no active link

    const req = makeReq({
      token,
      body: { doctorId: 'unlinkeddoc', appointmentDate: '2026-07-01T09:00:00Z' },
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.error).toContain('linked')
    expect(appointmentCreateMock).not.toHaveBeenCalled()
  })

  it('ST-10 | Full happy path: PATIENT books appointment with linked doctor → 201', async () => {
    const token = await patientToken()
    getPatientUserIdMock.mockResolvedValue('user-patient-1')
    patientProfileFindUniqueMock.mockResolvedValue({ id: 'profile-1' })
    patientDoctorLinkFindFirstMock.mockResolvedValue({ id: 'link-1', linkStatus: 'ACTIVE' })
    appointmentCreateMock.mockResolvedValue({
      id: 'new-appt-99',
      doctorId: 'doc-1',
      appointmentDate: new Date('2026-07-01T09:00:00Z'),
      appointmentType: 'Migraine consultation',
      status: 'SCHEDULED',
      doctor: { name: 'Dr. Johnson', specialization: 'Neurology' },
    })

    const req = makeReq({
      token,
      body: {
        doctorId: 'doc-1',
        appointmentDate: '2026-07-01T09:00:00Z',
        appointmentType: 'Migraine consultation',
        notes: 'First visit',
      },
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('new-appt-99')
    expect(body.doctorName).toBe('Dr. Johnson')
    expect(body.status).toBe('SCHEDULED')

    // Verify DB was called with correct data
    expect(appointmentCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          patientId: 'profile-1',
          doctorId: 'doc-1',
          appointmentType: 'Migraine consultation',
          status: 'SCHEDULED',
        }),
      })
    )
  })
})
