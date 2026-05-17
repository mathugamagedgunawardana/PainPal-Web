import { getModelApiBaseUrl, tryGetModelApiBaseUrl } from '@/lib/env/modelApiUrl'

export type MriPredictApiResult = {
  predicted_label: string
  confidence: number | null
  probabilities: Record<string, number>
  class_names: string[]
  disclaimer?: string
}

export class MriPredictApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message)
    this.name = 'MriPredictApiError'
  }
}

/**
 * POST multipart image to Python FastAPI POST /predict/mri (model/main.py).
 */
export async function callMriPredictApi(
  imageBytes: Buffer,
  filename: string,
  mimeType?: string,
): Promise<MriPredictApiResult> {
  const base = getModelApiBaseUrl()
  const form = new FormData()
  const blob = new Blob([new Uint8Array(imageBytes)], {
    type: mimeType || 'application/octet-stream',
  })
  form.append('file', blob, filename || 'mri.png')

  let res: Response
  try {
    res = await fetch(`${base}/predict/mri`, {
      method: 'POST',
      body: form,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    throw new MriPredictApiError(
      `Could not reach MRI model API at ${base}. Is the Python server running? (${msg})`,
    )
  }

  let body: unknown
  try {
    body = await res.json()
  } catch {
    body = null
  }

  if (!res.ok) {
    const detail =
      body && typeof body === 'object' && 'detail' in body
        ? String((body as { detail: unknown }).detail)
        : `MRI model API error (${res.status})`
    throw new MriPredictApiError(detail, res.status)
  }

  const data = body as Partial<MriPredictApiResult>
  if (!data.predicted_label || typeof data.predicted_label !== 'string') {
    throw new MriPredictApiError('MRI model API returned an invalid response.')
  }

  return {
    predicted_label: data.predicted_label,
    confidence: typeof data.confidence === 'number' ? data.confidence : null,
    probabilities:
      data.probabilities && typeof data.probabilities === 'object'
        ? (data.probabilities as Record<string, number>)
        : {},
    class_names: Array.isArray(data.class_names)
      ? data.class_names.map(String)
      : Object.keys(data.probabilities ?? {}),
    disclaimer: typeof data.disclaimer === 'string' ? data.disclaimer : undefined,
  }
}

export async function fetchMriModelHealth(): Promise<{
  available: boolean
  reason: string | null
}> {
  const base = tryGetModelApiBaseUrl()
  if (!base) {
    return { available: false, reason: 'MODEL_API_URL is not configured.' }
  }
  try {
    const res = await fetch(`${base}/health`, { cache: 'no-store' })
    if (!res.ok) {
      return { available: false, reason: `Model API health check failed (${res.status}).` }
    }
    const data = (await res.json()) as { has_mri_model?: boolean; mri_error?: string | null }
    if (!data.has_mri_model) {
      return {
        available: false,
        reason: data.mri_error ?? 'MRI ResNet18 weights are not loaded on the model server.',
      }
    }
    return { available: true, reason: null }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { available: false, reason: `Could not reach model API: ${msg}` }
  }
}
