import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'
import { assertDoctorPatientAccess } from '@/lib/doctor/assertDoctorPatientAccess'
import { getPatientProfileForUser } from '@/lib/patient/getPatientProfileForUser'
import { readPrivateBlob } from '@/lib/blob'

/**
 * GET /api/patients/:id/mri-scans/:scanId/image — stream private Blob MRI for doctor/patient.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; scanId: string }> },
) {
  const auth = await requireRole(req, ['DOCTOR', 'ADMIN', 'PATIENT'])
  if (!auth.authorized) return auth.response!

  const { id: patientId, scanId } = await params

  const scan = await prisma.patientMriScan.findFirst({
    where: { id: scanId, patientId },
  })
  if (!scan?.blobPathname) {
    return NextResponse.json({ error: 'MRI image not found' }, { status: 404 })
  }

  if (auth.user!.role === 'DOCTOR') {
    const access = await assertDoctorPatientAccess(auth.user!, patientId)
    if (!access.ok) return access.response
  } else if (auth.user!.role === 'PATIENT') {
    const patient = await getPatientProfileForUser(auth.user!)
    if (!patient || patient.id !== patientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
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
    console.error('MRI image proxy error:', e)
    return NextResponse.json({ error: 'Failed to load MRI image' }, { status: 502 })
  }
}
