import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { signToken, verifyToken } from './jwt'
import type { JWTPayload } from './jwt'

const payload: JWTPayload = {
  userId: 'user-1',
  email: 't@example.com',
  role: 'PATIENT',
  name: 'Tester',
}

describe('jwt sign / verify', () => {
  const origNodeEnv = process.env.NODE_ENV
  const origSecret = process.env.JWT_SECRET

  afterEach(() => {
    process.env.NODE_ENV = origNodeEnv
    if (origSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = origSecret
  })

  beforeEach(() => {
    process.env.NODE_ENV = 'test'
    process.env.JWT_SECRET = 'unit-test-secret-at-least-32-chars!!'
  })

  it('round-trips a token', async () => {
    const token = await signToken(payload)
    const decoded = await verifyToken(token)
    expect(decoded).toMatchObject({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      name: payload.name,
    })
  })

  it('verifyToken returns null for garbage', async () => {
    expect(await verifyToken('not.a.jwt')).toBeNull()
  })
})

describe('jwt production secret guard', () => {
  const origNodeEnv = process.env.NODE_ENV
  const origSecret = process.env.JWT_SECRET

  afterEach(() => {
    process.env.NODE_ENV = origNodeEnv
    if (origSecret === undefined) delete process.env.JWT_SECRET
    else process.env.JWT_SECRET = origSecret
  })

  it('rejects missing JWT_SECRET in production', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.JWT_SECRET
    await expect(signToken(payload)).rejects.toThrow(/JWT_SECRET/)
  })

  it('rejects short JWT_SECRET in production', async () => {
    process.env.NODE_ENV = 'production'
    process.env.JWT_SECRET = 'short'
    await expect(signToken(payload)).rejects.toThrow(/JWT_SECRET/)
  })
})
