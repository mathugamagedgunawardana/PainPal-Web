/**
 * Upload sample brain MRI slices to Vercel Blob (private) per seeded patient,
 * run ResNet18 via MODEL_API_URL, and persist PatientMriScan rows.
 */
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { blobSetupHint, isBlobConfigured, uploadToBlob } from '../blob'
import { callMriPredictApi } from '../model/callMriPredictApi'
import { prepareMriImageBytes } from './prepareMriImageBytes'

const MODEL_LABEL = 'resnet18-migraine-v1'
const SEED_BLOB_PREFIX = 'mri-seed/'

export type SeedMriPatientSpec = {
  email: string
  /** Folder under model/image/Data (e.g. glioma_1) */
  dataFolder: string
  /** Optional specific filename inside folder; otherwise first .tif/.png found */
  fileName?: string
}

const DEFAULT_SPECS: SeedMriPatientSpec[] = [
  { email: 'sarah.chen@email.com', dataFolder: 'glioma_1' },
  { email: 'john.doe@email.com', dataFolder: 'glioma_2' },
  { email: 'emily.smith@email.com', dataFolder: 'glioma_3' },
  { email: 'michael.j@email.com', dataFolder: 'glioma_unknown' },
]

function resolveRepoRoot(): string {
  return path.resolve(__dirname, '..', '..', '..')
}

function pickLocalImage(dataFolder: string, fileName?: string): string {
  const dir = path.join(resolveRepoRoot(), 'model', 'image', 'Data', dataFolder)
  if (!fs.existsSync(dir)) {
    throw new Error(`MRI data folder missing: ${dir}`)
  }
  if (fileName) {
    const p = path.join(dir, fileName)
    if (!fs.existsSync(p)) throw new Error(`MRI file missing: ${p}`)
    return p
  }
  const entries = fs
    .readdirSync(dir)
    .filter((f) => /\.(tif|tiff|png|jpe?g)$/i.test(f))
    .sort()
  if (!entries.length) {
    throw new Error(`No MRI images in ${dir}`)
  }
  return path.join(dir, entries[0])
}

export async function seedPatientMriBlob(
  prisma: PrismaClient,
  specs: SeedMriPatientSpec[] = DEFAULT_SPECS,
): Promise<{ created: number; skipped: string[] }> {
  if (!isBlobConfigured()) {
    throw new Error(blobSetupHint())
  }

  const skipped: string[] = []
  let created = 0

  for (const spec of specs) {
    const profile = await prisma.patientProfile.findFirst({
      where: { email: spec.email },
    })
    if (!profile) {
      skipped.push(`${spec.email}: patient profile not found`)
      continue
    }

    await prisma.patientMriScan.deleteMany({
      where: {
        patientId: profile.id,
        blobPathname: { startsWith: SEED_BLOB_PREFIX },
      },
    })

    const localPath = pickLocalImage(spec.dataFolder, spec.fileName)
    const { pngBytes, originalFileName, mimeType } = await prepareMriImageBytes(localPath)

    const modelResult = await callMriPredictApi(pngBytes, originalFileName, mimeType)

    const blobKey = `${SEED_BLOB_PREFIX}${profile.id}/${Date.now()}-${originalFileName}`
    const uploaded = await uploadToBlob({
      key: blobKey,
      data: pngBytes,
      contentType: mimeType,
      access: 'private',
    })

    await prisma.patientMriScan.create({
      data: {
        patientId: profile.id,
        originalFileName,
        mimeType,
        fileSizeBytes: pngBytes.length,
        blobUrl: uploaded.url,
        blobPathname: uploaded.pathname,
        prediction: modelResult.predicted_label,
        confidence: modelResult.confidence ?? 0,
        modelLabel: MODEL_LABEL,
        probabilities: modelResult.probabilities,
      },
    })

    console.log(
      `  ${spec.email}: blob=${uploaded.pathname} label=${modelResult.predicted_label} conf=${modelResult.confidence}`,
    )
    created++
  }

  return { created, skipped }
}
