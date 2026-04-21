import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'
import { getPatientProfileForUser } from '@/lib/patient/getPatientProfileForUser'

const DEMO_PREDICTION =
  'Demo: no acute intracranial abnormality detected. Consult a radiologist for clinical reads.'
const DEMO_CONFIDENCE = 0.82
const MODEL_LABEL = 'demo-stub-v1'

/**
 * POST /api/mri/predict — multipart MRI upload (Flutter). Persists metadata to MongoDB for PATIENT users.
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
  const fileSizeBytes = buf.length

  const prediction = DEMO_PREDICTION
  const confidence = DEMO_CONFIDENCE

  if (auth.user!.role === 'PATIENT') {
    const patient = await getPatientProfileForUser(auth.user!)
    if (patient) {
      try {
        await prisma.patientMriScan.create({
          data: {
            patientId: patient.id,
            originalFileName,
            mimeType,
            fileSizeBytes,
            prediction,
            confidence,
            modelLabel: MODEL_LABEL,
          },
        })
      } catch (e) {
        console.error('POST /api/mri/predict persist error:', e)
        return NextResponse.json({ error: 'Failed to save MRI record' }, { status: 500 })
      }
    }
  }

  return NextResponse.json({
    prediction,
    confidence,
  })
}
