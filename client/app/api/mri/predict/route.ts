import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { getPatientProfileForUser } from '@/lib/patient/getPatientProfileForUser'
import { persistMriScanWithModel } from '@/lib/mri/persistMriScan'
import { callMriPredictApi, MriPredictApiError } from '@/lib/model/callMriPredictApi'

/**
 * POST /api/mri/predict — multipart MRI upload (Flutter).
 * Uploads to Vercel Blob (private), runs ResNet18 via MODEL_API_URL, persists scan for patients.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['PATIENT', 'ADMIN'])
  if (!auth.authorized) return auth.response!

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid multipart body' }, { status: 400 })
  }

  const file = form.get('file')
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing file field' }, { status: 400 })
  }

  const originalFileName = file instanceof File ? file.name : 'upload'
  const mimeType = file.type || undefined
  const buf = Buffer.from(await file.arrayBuffer())

  try {
    if (auth.user!.role === 'ADMIN') {
      const modelResult = await callMriPredictApi(buf, originalFileName, mimeType)
      return NextResponse.json({
        prediction: modelResult.predicted_label,
        predicted_label: modelResult.predicted_label,
        confidence: modelResult.confidence,
        probabilities: modelResult.probabilities,
        class_names: modelResult.class_names,
        disclaimer: modelResult.disclaimer,
      })
    }

    const patient = await getPatientProfileForUser(auth.user!)
    if (!patient) {
      return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
    }

    const result = await persistMriScanWithModel({
      patientId: patient.id,
      imageBytes: buf,
      originalFileName,
      mimeType,
      blobKeyPrefix: 'mri',
    })

    return NextResponse.json({
      prediction: result.predicted_label,
      predicted_label: result.predicted_label,
      confidence: result.confidence,
      probabilities: result.probabilities,
      class_names: result.class_names,
      disclaimer: result.disclaimer,
      scanId: result.scanId,
      blobUrl: result.blobUrl,
    })
  } catch (e) {
    const status = e instanceof MriPredictApiError && e.status ? e.status : 503
    const message =
      e instanceof MriPredictApiError
        ? e.message
        : e instanceof Error
          ? e.message
          : 'MRI model prediction failed.'
    return NextResponse.json({ error: message }, { status })
  }
}
