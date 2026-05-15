import { describe, expect, it } from 'vitest'
import { hashPassword, comparePassword } from './password'

describe('hashPassword', () => {
  it('returns a non-empty string', async () => {
    const hash = await hashPassword('MyP@ssw0rd!')
    expect(typeof hash).toBe('string')
    expect(hash.length).toBeGreaterThan(0)
  })

  it('produces a bcrypt hash (starts with $2)', async () => {
    const hash = await hashPassword('SomeSecret')
    expect(hash).toMatch(/^\$2[ab]?\$/)
  })

  it('two hashes of the same password are different (different salts)', async () => {
    const pw = 'samePassword'
    const h1 = await hashPassword(pw)
    const h2 = await hashPassword(pw)
    expect(h1).not.toBe(h2)
  })
})

describe('comparePassword', () => {
  it('returns true when password matches its hash', async () => {
    const pw = 'CorrectHorse#Battery9'
    const hash = await hashPassword(pw)
    expect(await comparePassword(pw, hash)).toBe(true)
  })

  it('returns false when password does not match', async () => {
    const hash = await hashPassword('rightPassword')
    expect(await comparePassword('wrongPassword', hash)).toBe(false)
  })

  it('is case-sensitive', async () => {
    const hash = await hashPassword('Secret123')
    expect(await comparePassword('secret123', hash)).toBe(false)
  })

  it('empty string does not match a non-empty password hash', async () => {
    const hash = await hashPassword('notEmpty')
    expect(await comparePassword('', hash)).toBe(false)
  })
})
