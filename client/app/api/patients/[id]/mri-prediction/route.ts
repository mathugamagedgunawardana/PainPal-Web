import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'
import { assertDoctorPatientAccess } from '@/lib/doctor/assertDoctorPatientAccess'
import { getBlobSignedDownloadUrl } from '@/lib/blob'
import { privateApiCacheHeaders } from '@/lib/http/cacheHeaders'

function parseProbabilities(value: Prisma.JsonValue | null): Record<string, number> | null {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return null
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v
  }
  return Object.keys(out).length > 0 ? out : null
}

/**
 * GET /api/patients/:id/mri-prediction — latest patient MRI ResNet18 result for doctor view.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireRole(req, ['DOCTOR', 'ADMIN'])
  if (!auth.authorized) return auth.response!

  const { id: patientId } = await params

  if (auth.user!.role === 'DOCTOR') {
    const access = await assertDoctorPatientAccess(auth.user!, patientId)
    if (!access.ok) return access.response
  }

  const latest = await prisma.patientMriScan.findFirst({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
  })

  if (!latest) {
    return NextResponse.json(
      {
        scan: null,
        modelAvailable: true,
        modelUnavailableReason: null,
      },
      { headers: privateApiCacheHeaders() }
    )
  }

  const imageUrl = latest.blobUrl
    ? getBlobSignedDownloadUrl(latest.blobUrl)
    : latest.blobPathname
      ? `/api/patients/${patientId}/mri-scans/${latest.id}/image`
      : null

  return NextResponse.json(
    {
    scan: {
      id: latest.id,
      originalFileName: latest.originalFileName,
      predictedLabel: latest.prediction,
      confidence: latest.confidence,
      probabilities: parseProbabilities(latest.probabilities),
      modelLabel: latest.modelLabel,
      createdAt: latest.createdAt.toISOString(),
      mimeType: latest.mimeType,
      fileSizeBytes: latest.fileSizeBytes,
      blobUrl: latest.blobUrl,
      imageUrl,
    },
    modelAvailable: true,
    modelUnavailableReason: null,
  },
    { headers: privateApiCacheHeaders() }
  )
}
