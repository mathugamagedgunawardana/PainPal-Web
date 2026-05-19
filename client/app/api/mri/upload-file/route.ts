import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { blobSetupHint, isBlobConfigured, uploadToBlob } from '@/lib/blob'
import { getPatientProfileForUser } from '@/lib/patient/getPatientProfileForUser'

const MAX_MRI_BYTES = 10 * 1024 * 1024

/**
 * POST /api/mri/upload-file — multipart MRI upload for mobile (Flutter).
 * Stores the image in Vercel Blob (private), then call POST /api/mri/predict with JSON body.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['PATIENT', 'ADMIN'])
  if (!auth.authorized) return auth.response!

  if (!isBlobConfigured()) {
    return NextResponse.json({ error: blobSetupHint() }, { status: 503 })
  }

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
  const mimeType = file.type || 'application/octet-stream'
  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.length > MAX_MRI_BYTES) {
    return NextResponse.json({ error: 'MRI file exceeds 10 MB limit' }, { status: 413 })
  }

  let patientId: string
  if (auth.user!.role === 'PATIENT') {
    const patient = await getPatientProfileForUser(auth.user!)
    if (!patient) {
      return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
    }
    patientId = patient.id
  } else {
    const fromForm = form.get('patient_id')
    patientId =
      typeof fromForm === 'string' && fromForm.trim() ? fromForm.trim() : 'admin'
  }

  const safeName = originalFileName.replace(/[^\w.-]+/g, '_')
  const key = `mri/${patientId}/${Date.now()}-${safeName}`

  try {
    const uploaded = await uploadToBlob({
      key,
      data: buf,
      contentType: mimeType,
      access: 'private',
    })

    return NextResponse.json({
      blobPathname: uploaded.pathname,
      blobUrl: uploaded.url,
      originalFileName,
      mimeType,
    })
  } catch (e) {
    console.error('POST /api/mri/upload-file failed:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Blob upload failed' },
      { status: 502 },
    )
  }
}
