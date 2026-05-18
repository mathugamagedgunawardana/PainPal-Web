import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { resolveBlobToken } from '@/lib/blob'

const MAX_MRI_BYTES = 10 * 1024 * 1024

/**
 * POST /api/mri/upload — Vercel Blob client upload handler (browser direct-to-blob).
 * After upload, call POST /api/mri/predict with { blobPathname, blobUrl, originalFileName, mimeType }.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const req = new NextRequest(request.url, request)
  const auth = await requireRole(req, ['PATIENT', 'ADMIN'])
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = resolveBlobToken()
  if (!token) {
    return NextResponse.json({ error: 'Blob storage is not configured' }, { status: 503 })
  }

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      token,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith('mri/')) {
          throw new Error('Invalid upload path')
        }
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/dicom'],
          maximumSizeInBytes: MAX_MRI_BYTES,
          addRandomSuffix: false,
        }
      },
    })
    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('POST /api/mri/upload failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 }
    )
  }
}
