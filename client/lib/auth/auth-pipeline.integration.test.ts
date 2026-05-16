/**
 * INTEGRATION TESTS – Auth Pipeline
 *
 * Scope: password hashing + JWT signing/verification + role middleware all
 * wired together with NO vi.mock() calls for internal modules.
 * Only process.env is manipulated to control test vs. production behaviour.
 *
 * What is NOT mocked: hashPassword, comparePassword, signToken, verifyToken,
 *   extractTokenFromHeader, verifyRequest (cookie path), hasRole, requireRole.
 * What IS mocked: nothing – all internal auth utilities run for real.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { hashPassword, comparePassword } from './password'
import {
  signToken,
  verifyToken,
  extractTokenFromHeader,
  verifyRequest,
} from './jwt'
import { hasRole, authenticateRequest, requireRole } from './middleware'
import type { JWTPayload } from './jwt'

// ---------------------------------------------------------------------------
// Environment bootstrap
// ---------------------------------------------------------------------------
const TEST_SECRET = 'integration-test-secret-32-chars-long!!'

beforeEach(() => {
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = TEST_SECRET
})

afterEach(() => {
  delete process.env.JWT_SECRET
})

// ---------------------------------------------------------------------------
// 1. Password ↔ JWT sign-up → sign-in pipeline (no mocks)
// ---------------------------------------------------------------------------
describe('Integration – complete sign-up to sign-in auth pipeline', () => {
  it('hashes password, validates it, then issues and verifies a JWT', async () => {
    // Step 1: Registration – password is hashed before storage
    const plainPw = 'Secure#Pass2026!'
    const hash = await hashPassword(plainPw)
    expect(hash).toMatch(/^\$2[ab]?\$/)
    expect(hash).not.toBe(plainPw)

    // Step 2: Sign-in – compare submitted password against stored hash
    const matches = await comparePassword(plainPw, hash)
    expect(matches).toBe(true)

    // Step 3: Successful sign-in → issue JWT
    const payload: JWTPayload = {
      userId: 'user-int-001',
      email: 'jane@hospital.org',
      role: 'PATIENT',
      name: 'Jane Doe',
    }
    const token = await signToken(payload)
    expect(typeof token).toBe('string')
    expect(token.split('.').length).toBe(3) // valid JWT structure

    // Step 4: Subsequent request – verify token
    const decoded = await verifyToken(token)
    expect(decoded).not.toBeNull()
    expect(decoded?.userId).toBe('user-int-001')
    expect(decoded?.email).toBe('jane@hospital.org')
    expect(decoded?.role).toBe('PATIENT')
  })

  it('incorrect password does not produce a valid session token', async () => {
    const hash = await hashPassword('correctPassword')
    const matches = await comparePassword('wrongPassword', hash)
    expect(matches).toBe(false)
    // No token should be issued when passwords do not match
  })

  it('tampered JWT fails verification after issuance', async () => {
    const token = await signToken({
      userId: 'u1', email: 'a@b.com', role: 'PATIENT', name: 'Test',
    })
    // Tamper last 5 chars of the signature segment
    const tampered = token.slice(0, -5) + 'ZZZZZ'
    const result = await verifyToken(tampered)
    expect(result).toBeNull()
  })

  it('expired-looking garbage token returns null', async () => {
    expect(await verifyToken('not.a.real.jwt')).toBeNull()
    expect(await verifyToken('')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// 2. Bearer header → token extraction → verification pipeline
// ---------------------------------------------------------------------------
describe('Integration – Authorization header to decoded payload', () => {
  it('extractTokenFromHeader + verifyToken returns correct payload', async () => {
    const payload: JWTPayload = {
      userId: 'doc-007', email: 'dr@clinic.com', role: 'DOCTOR', name: 'Dr X',
    }
    const token = await signToken(payload)
    const extracted = extractTokenFromHeader(`Bearer ${token}`)
    expect(extracted).toBe(token)

    const decoded = await verifyToken(extracted!)
    expect(decoded?.role).toBe('DOCTOR')
    expect(decoded?.userId).toBe('doc-007')
  })

  it('extractTokenFromHeader returns null for malformed header', () => {
    expect(extractTokenFromHeader(null)).toBeNull()
    expect(extractTokenFromHeader('Token abc')).toBeNull()
    expect(extractTokenFromHeader('')).toBeNull()
  })

  it('header token from a different secret does not verify', async () => {
    // Issue token with current secret
    const token = await signToken({
      userId: 'u1', email: 'x@y.com', role: 'ADMIN', name: 'Admin',
    })
    // Simulate secret rotation – new secret cannot verify old token
    process.env.JWT_SECRET = 'completely-different-secret-32-chars-long!!'
    const result = await verifyToken(token)
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// 3. verifyRequest (real) ↔ NextRequest (Authorization header path)
// ---------------------------------------------------------------------------
describe('Integration – verifyRequest reads Authorization header (real JWT)', () => {
  function makeReq(authHeader?: string) {
    return {
      cookies: { get: () => undefined },
      headers: { get: (name: string) => (name === 'authorization' ? authHeader ?? null : null) },
    } as any
  }

  it('returns payload when a valid Bearer token is present', async () => {
    const token = await signToken({
      userId: 'patient-99', email: 'p@clinic.com', role: 'PATIENT', name: 'P',
    })
    const result = await verifyRequest(makeReq(`Bearer ${token}`))
    expect(result?.userId).toBe('patient-99')
  })

  it('returns null when no Authorization header is provided', async () => {
    const result = await verifyRequest(makeReq())
    expect(result).toBeNull()
  })

  it('returns null for a Bearer token signed with wrong secret', async () => {
    const token = await signToken({ userId: 'u', email: 'e@f', role: 'PATIENT', name: 'N' })
    process.env.JWT_SECRET = 'wrong-secret-value-that-is-32-chars-!!'
    const result = await verifyRequest(makeReq(`Bearer ${token}`))
    expect(result).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// 4. hasRole + requireRole (real) integrated with real JWT verification
// ---------------------------------------------------------------------------
describe('Integration – hasRole and requireRole with real JWT payloads', () => {
  function makeReq(token: string) {
    return {
      cookies: { get: () => undefined },
      headers: { get: (name: string) => (name === 'authorization' ? `Bearer ${token}` : null) },
    } as any
  }

  it('PATIENT role is authorized for PATIENT-only route', async () => {
    const token = await signToken({
      userId: 'p1', email: 'p@test.com', role: 'PATIENT', name: 'Pat',
    })
    const auth = await requireRole(makeReq(token), ['PATIENT'])
    expect(auth.authorized).toBe(true)
    expect(auth.user?.role).toBe('PATIENT')
  })

  it('DOCTOR is forbidden from PATIENT-only route', async () => {
    const token = await signToken({
      userId: 'd1', email: 'd@test.com', role: 'DOCTOR', name: 'Doc',
    })
    const auth = await requireRole(makeReq(token), ['PATIENT'])
    expect(auth.authorized).toBe(false)
    expect(auth.response?.status).toBe(403)
  })

  it('ADMIN can access a multi-role route (ADMIN | DOCTOR)', async () => {
    const token = await signToken({
      userId: 'a1', email: 'admin@test.com', role: 'ADMIN', name: 'Admin',
    })
    const auth = await requireRole(makeReq(token), ['ADMIN', 'DOCTOR'])
    expect(auth.authorized).toBe(true)
  })

  it('missing token returns 401 unauthenticated from requireRole', async () => {
    const noTokenReq = {
      cookies: { get: () => undefined },
      headers: { get: () => null },
    } as any
    const auth = await requireRole(noTokenReq, ['PATIENT'])
    expect(auth.authorized).toBe(false)
    expect(auth.response?.status).toBe(401)
  })

  it('hasRole returns false for null user regardless of allowed roles', () => {
    expect(hasRole(null, ['PATIENT', 'DOCTOR', 'ADMIN'])).toBe(false)
  })
})
