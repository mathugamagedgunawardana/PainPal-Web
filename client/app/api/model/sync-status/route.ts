import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'
import { getSeedPredictionSyncStatus } from '@/lib/model/syncSeedPredictions'

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['DOCTOR', 'ADMIN'])
  if (!auth.authorized) return auth.response!

  try {
    const status = await getSeedPredictionSyncStatus(prisma)
    return NextResponse.json(status, {
      headers: {
        'Cache-Control': status.running ? 'private, no-cache' : 'private, max-age=30',
      },
    })
  } catch (error) {
    console.error('GET /api/model/sync-status failed:', error)
    return NextResponse.json({ error: 'Failed to load model sync status' }, { status: 500 })
  }
}
