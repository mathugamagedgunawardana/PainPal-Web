import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'
import { getPatientProfileForUser } from '@/lib/patient/getPatientProfileForUser'
import { getBlobSignedDownloadUrl, readPrivateBlob } from '@/lib/blob'

/**
 * GET /api/patient/mri-scans/:scanId/image — signed Blob URL for the logged-in patient's scan.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ scanId: string }> },
) {
  const auth = await requireRole(req, ['PATIENT'])
  if (!auth.authorized) return auth.response!

  const patient = await getPatientProfileForUser(auth.user!)
  if (!patient) {
    return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
  }

  const { scanId } = await params
  const scan = await prisma.patientMriScan.findFirst({
    where: { id: scanId, patientId: patient.id },
  })
  if (!scan?.blobPathname) {
    return NextResponse.json({ error: 'MRI image not found' }, { status: 404 })
  }

  if (scan.blobUrl) {
    const signed = getBlobSignedDownloadUrl(scan.blobUrl)
    return NextResponse.redirect(signed, 302)
  }

  try {
    const { buffer, contentType } = await readPrivateBlob(scan.blobPathname)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType ?? scan.mimeType ?? 'image/png',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (e) {
    console.error('Patient MRI image error:', e)
    return NextResponse.json({ error: 'Failed to load MRI image' }, { status: 502 })
  }
}
