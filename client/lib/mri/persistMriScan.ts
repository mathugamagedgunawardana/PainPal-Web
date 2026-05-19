import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { isBlobConfigured, readPrivateBlob, uploadToBlob } from '@/lib/blob'
import { callMriPredictApi, type MriPredictApiResult } from '@/lib/model/callMriPredictApi'

export const MRI_MODEL_LABEL = 'resnet18-migraine-v1'

export type PersistMriScanInput = {
  patientId: string
  imageBytes: Buffer
  originalFileName: string
  mimeType?: string
  blobKeyPrefix?: string
}

export type PersistMriScanFromBlobInput = {
  patientId: string
  blobPathname: string
  blobUrl?: string
  originalFileName: string
  mimeType?: string
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
  const contentType = mimeType ?? 'application/octet-stream'

  let blobUrl: string | undefined
  let blobPathname: string | undefined

  if (isBlobConfigured()) {
    const safeName = originalFileName.replace(/[^\w.-]+/g, '_')
    const key = `${blobKeyPrefix}/${patientId}/${Date.now()}-${safeName}`
    const uploaded = await uploadToBlob({
      key,
      data: imageBytes,
      contentType,
      access: 'private',
    })
    blobUrl = uploaded.url
    blobPathname = uploaded.pathname
  }

  const modelResult = await callMriPredictApi(imageBytes, originalFileName, contentType)

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

/** Predict from an existing private Blob (client uploaded via /api/mri/upload). */
export async function persistMriScanFromBlob(
  input: PersistMriScanFromBlobInput,
): Promise<PersistMriScanResult> {
  const { patientId, blobPathname, blobUrl, originalFileName, mimeType } = input
  const { buffer, contentType } = await readPrivateBlob(blobPathname)

  const modelResult = await callMriPredictApi(
    buffer,
    originalFileName,
    mimeType ?? contentType ?? 'application/octet-stream',
  )

  const row = await prisma.patientMriScan.create({
    data: {
      patientId,
      originalFileName,
      mimeType: mimeType ?? contentType ?? null,
      fileSizeBytes: buffer.length,
      blobUrl: blobUrl ?? null,
      blobPathname,
      prediction: modelResult.predicted_label,
      confidence: modelResult.confidence ?? 0,
      modelLabel: MRI_MODEL_LABEL,
      probabilities: modelResult.probabilities as Prisma.InputJsonValue,
    },
  })

  return {
    ...modelResult,
    scanId: row.id,
    blobUrl: blobUrl ?? undefined,
    blobPathname,
  }
}
