/**
 * Upload MRI samples to Vercel Blob + run ResNet18 for each seeded patient.
 *
 * Requires in client/.env:
 *   BLOB_READ_WRITE_TOKEN=...   (from Vercel Blob store → read/write token)
 *   MODEL_API_URL=http://127.0.0.1:8000
 *   DATABASE_URL=...
 *
 * Run: npm run seed:mri-blob
 */
import { PrismaClient } from '@prisma/client'
import { seedPatientMriBlob } from '../lib/mri/seedPatientMriBlob'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding patient MRI → Vercel Blob → ResNet18 …')
  const { created, skipped } = await seedPatientMriBlob(prisma)
  if (skipped.length) {
    console.warn('Skipped:', skipped.join('; '))
  }
  console.log(`Done. Created ${created} MRI scan(s) with live model output.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
