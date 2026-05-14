/**
 * Python migraine model FastAPI base URL (no trailing slash).
 * Set MODEL_API_URL in Next.js server env (e.g. client/.env.local).
 */
export function tryGetModelApiBaseUrl(): string | null {
  const raw = process.env.MODEL_API_URL?.trim()
  if (!raw) return null
  return raw.replace(/\/+$/, '')
}

export function getModelApiBaseUrl(): string {
  const url = tryGetModelApiBaseUrl()
  if (!url) {
    throw new Error(
      'MODEL_API_URL is not set. Add it to .env or .env.local (e.g. http://127.0.0.1:8000).',
    )
  }
  return url
}
