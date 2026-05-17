import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isBlobConfigured, uploadToBlob } from '@/lib/blob'
import { callMriPredictApi, type MriPredictApiResult } from '@/lib/model/callMriPredictApi'

export const MRI_MODEL_LABEL = 'resnet18-migraine-v1'

export type PersistMriScanInput = {
  patientId: string
  imageBytes: Buffer
  originalFileName: string
  mimeType?: string
  blobKeyPrefix?: string
}

export type PersistMriScanResult = MriPredictApiResult & {
  scanId?: string
  blobUrl?: string
  blobPathname?: string
}

/**
 * Run ResNet18, optionally upload to Vercel Blob (private), and save PatientMriScan.
 */
export async function persistMriScanWithModel(
  input: PersistMriScanInput,
): Promise<PersistMriScanResult> {
  const { patientId, imageBytes, originalFileName, mimeType, blobKeyPrefix = 'mri' } = input

  const modelResult = await callMriPredictApi(
    imageBytes,
    originalFileName,
    mimeType ?? 'application/octet-stream',
  )

  let blobUrl: string | undefined
  let blobPathname: string | undefined

  if (isBlobConfigured()) {
    const safeName = originalFileName.replace(/[^\w.-]+/g, '_')
    const key = `${blobKeyPrefix}/${patientId}/${Date.now()}-${safeName}`
    const uploaded = await uploadToBlob({
      key,
      data: imageBytes,
      contentType: mimeType ?? 'application/octet-stream',
      access: 'private',
    })
    blobUrl = uploaded.url
    blobPathname = uploaded.pathname
  }

  const row = await prisma.patientMriScan.create({
    data: {
      patientId,
      originalFileName,
      mimeType: mimeType ?? null,
      fileSizeBytes: imageBytes.length,
      blobUrl: blobUrl ?? null,
      blobPathname: blobPathname ?? null,
      prediction: modelResult.predicted_label,
      confidence: modelResult.confidence ?? 0,
      modelLabel: MRI_MODEL_LABEL,
      probabilities: modelResult.probabilities as Prisma.InputJsonValue,
    },
  })

  return {
    ...modelResult,
    scanId: row.id,
    blobUrl,
    blobPathname,
  }
}
