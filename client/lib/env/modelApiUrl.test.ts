import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getModelApiBaseUrl, tryGetModelApiBaseUrl } from './modelApiUrl'

describe('modelApiUrl', () => {
  const orig = process.env.MODEL_API_URL

  afterEach(() => {
    if (orig === undefined) {
      delete process.env.MODEL_API_URL
    } else {
      process.env.MODEL_API_URL = orig
    }
  })

  it('tryGetModelApiBaseUrl returns null when unset', () => {
    delete process.env.MODEL_API_URL
    expect(tryGetModelApiBaseUrl()).toBeNull()
  })

  it('tryGetModelApiBaseUrl trims and strips trailing slashes', () => {
    process.env.MODEL_API_URL = '  http://127.0.0.1:8000///  '
    expect(tryGetModelApiBaseUrl()).toBe('http://127.0.0.1:8000')
  })

  it('getModelApiBaseUrl throws when unset', () => {
    delete process.env.MODEL_API_URL
    expect(() => getModelApiBaseUrl()).toThrow(/MODEL_API_URL/)
  })

  it('getModelApiBaseUrl returns normalized URL', () => {
    process.env.MODEL_API_URL = 'https://model.example.com/'
    expect(getModelApiBaseUrl()).toBe('https://model.example.com')
  })
})
