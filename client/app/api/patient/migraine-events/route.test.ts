import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'

const { requireRoleMock, getPatientProfileForUserMock, findManyMock } = vi.hoisted(() => ({
  requireRoleMock: vi.fn(),
  getPatientProfileForUserMock: vi.fn(),
  findManyMock: vi.fn(),
}))

vi.mock('@/lib/auth/middleware', () => ({
  requireRole: requireRoleMock,
}))

vi.mock('@/lib/patient/getPatientProfileForUser', () => ({
  getPatientProfileForUser: getPatientProfileForUserMock,
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    migraineEvent: {
      findMany: findManyMock,
    },
  },
}))

import { GET } from './route'

describe('GET /api/patient/migraine-events', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns auth response when user is unauthorized', async () => {
    const unauthorized = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    requireRoleMock.mockResolvedValue({
      authorized: false,
      response: unauthorized,
    })

    const response = await GET({ url: 'http://localhost/api/patient/migraine-events' } as any)

    expect(response.status).toBe(401)
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' })
    expect(findManyMock).not.toHaveBeenCalled()
  })

  it('returns 404 when patient profile is missing', async () => {
    requireRoleMock.mockResolvedValue({
      authorized: true,
      user: { id: 'u1' },
    })
    getPatientProfileForUserMock.mockResolvedValue(null)

    const response = await GET({ url: 'http://localhost/api/patient/migraine-events' } as any)

    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({ error: 'Patient profile not found' })
    expect(findManyMock).not.toHaveBeenCalled()
  })

  it('maps rows and clamps limit query param', async () => {
    requireRoleMock.mockResolvedValue({
      authorized: true,
      user: { id: 'u1' },
    })
    getPatientProfileForUserMock.mockResolvedValue({ id: 'patient-1' })
    findManyMock.mockResolvedValue([
      {
        id: 'e1',
        startDatetime: new Date('2026-01-01T10:00:00.000Z'),
        trainingDuration: null,
        duration: '3 hours',
        trainingFrequency: 2,
        episodeNotes: '{"location":"left","character":"throbbing","durationHours":5,"dpf":"3 days"}',
        severity: 8,
        migraineType: 'migraine-with-aura',
        csvMigraineType: null,
        nausea: 1,
        vomit: 0,
        phonophobia: 1,
        photophobia: 1,
        visual: 0,
        sensory: 0,
        dysphasia: 0,
        dysarthria: 0,
        vertigo: 0,
        tinnitus: 0,
        hypoacusis: 0,
        diplopia: 0,
        defect: 0,
        ataxia: 0,
        conscience: 0,
        paresthesia: 0,
        dpf: null,
      },
      {
        id: 'e2',
        startDatetime: new Date('2026-01-02T10:00:00.000Z'),
        trainingDuration: 4,
        duration: null,
        trainingFrequency: null,
        episodeNotes: 'brief episode',
        severity: 5,
        migraineType: null,
        csvMigraineType: 'fallback-type',
        nausea: null,
        vomit: null,
        phonophobia: null,
        photophobia: null,
        visual: null,
        sensory: null,
        dysphasia: null,
        dysarthria: null,
        vertigo: null,
        tinnitus: null,
        hypoacusis: null,
        diplopia: null,
        defect: null,
        ataxia: null,
        conscience: null,
        paresthesia: null,
        dpf: 7,
      },
    ])

    const response = await GET({ url: 'http://localhost/api/patient/migraine-events?limit=500' } as any)

    expect(findManyMock).toHaveBeenCalledWith({
      where: { patientId: 'patient-1' },
      orderBy: { startDatetime: 'desc' },
      take: 200,
    })
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      events: [
        {
          id: 'e1',
          timestamp: '2026-01-01T10:00:00.000Z',
          durationHours: 5,
          frequencyPerMonth: 2,
          location: 'left',
          character: 'throbbing',
          intensity: 8,
          type: 'migraine-with-aura',
          summary: null,
          nausea: 1,
          vomit: 0,
          phonophobia: 1,
          photophobia: 1,
          visual: 0,
          sensory: 0,
          dysphasia: 0,
          dysarthria: 0,
          vertigo: 0,
          tinnitus: 0,
          hypoacusis: 0,
          diplopia: 0,
          defect: 0,
          ataxia: 0,
          conscience: 0,
          paresthesia: 0,
          dpf: '3 days',
        },
        {
          id: 'e2',
          timestamp: '2026-01-02T10:00:00.000Z',
          durationHours: 4,
          frequencyPerMonth: 0,
          location: '',
          character: '',
          intensity: 5,
          type: 'fallback-type',
          summary: 'brief episode',
          nausea: 0,
          vomit: 0,
          phonophobia: 0,
          photophobia: 0,
          visual: 0,
          sensory: 0,
          dysphasia: 0,
          dysarthria: 0,
          vertigo: 0,
          tinnitus: 0,
          hypoacusis: 0,
          diplopia: 0,
          defect: 0,
          ataxia: 0,
          conscience: 0,
          paresthesia: 0,
          dpf: '7',
        },
      ],
    })
  })

  it('returns 500 when prisma throws', async () => {
    requireRoleMock.mockResolvedValue({
      authorized: true,
      user: { id: 'u1' },
    })
    getPatientProfileForUserMock.mockResolvedValue({ id: 'patient-1' })
    findManyMock.mockRejectedValue(new Error('db failure'))

    const response = await GET({ url: 'http://localhost/api/patient/migraine-events' } as any)

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'Internal server error' })
  })
})
