import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'
import { getPatientProfileForUser } from '@/lib/patient/getPatientProfileForUser'

/**
 * GET /api/patient/mri-scans — MRI upload history for the logged-in patient (Flutter History).
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['PATIENT'])
  if (!auth.authorized) return auth.response!

  const patient = await getPatientProfileForUser(auth.user!)
  if (!patient) {
    return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10) || 50))

  try {
    const rows = await prisma.patientMriScan.findMany({
      where: { patientId: patient.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const scans = rows.map((row) => ({
      id: row.id,
      imagePath: '',
      imageUrl: row.blobPathname ? `/api/patient/mri-scans/${row.id}/image` : null,
      prediction: row.prediction,
      predictedLabel: row.prediction,
      confidence: row.confidence,
      probabilities: row.probabilities,
      timestamp: row.createdAt.toISOString(),
      patientId: row.patientId,
      originalFileName: row.originalFileName,
      mimeType: row.mimeType,
      fileSizeBytes: row.fileSizeBytes,
      modelLabel: row.modelLabel,
    }))

    return NextResponse.json({ scans })
  } catch (e) {
    console.error('GET /api/patient/mri-scans error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
