/**
 * Python migraine model FastAPI base URL (no trailing slash).
 *
 * Production (Vercel): set MODEL_API_URL to https://painpal-model.vercel.app
 * (runs main.py on Vercel with weights from MODEL_ARTIFACTS_JSON on the model project).
 *
 * Local: http://127.0.0.1:8000 after `cd model && python main.py`
 */
export function tryGetModelApiBaseUrl(): string | null {
  const raw = process.env.MODEL_API_URL?.trim()
  if (!raw) return null
  const url = raw.replace(/\/+$/, '')
  if (
    process.env.VERCEL === '1' &&
    (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i.test(url) || /^https?:\/\/0\.0\.0\.0(:\d+)?/i.test(url))
  ) {
    console.warn(
      'MODEL_API_URL points to localhost in Vercel. Set it to https://painpal-model.vercel.app (or your model deployment URL).',
    )
    return null
  }
  return url
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
