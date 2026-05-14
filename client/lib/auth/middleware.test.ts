import { describe, expect, it } from 'vitest'
import { hasRole } from './middleware'
import type { JWTPayload } from './jwt'

function user(role: JWTPayload['role']): JWTPayload {
  return {
    userId: 'u1',
    email: 'a@b.com',
    role,
    name: 'Test',
  }
}

describe('hasRole', () => {
  it('returns false for null user', () => {
    expect(hasRole(null, ['PATIENT'])).toBe(false)
  })

  it('returns true when role is allowed', () => {
    expect(hasRole(user('PATIENT'), ['PATIENT', 'DOCTOR'])).toBe(true)
  })

  it('returns false when role is not allowed', () => {
    expect(hasRole(user('ADMIN'), ['PATIENT'])).toBe(false)
  })
})
