import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'
import { getPatientProfileForUser } from '@/lib/patient/getPatientProfileForUser'

/**
 * GET /api/patient/migraine-events — migraine rows for the logged-in patient (Flutter History).
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['PATIENT'])s
  if (!auth.authorized) return auth.response!

  const patient = await getPatientProfileForUser(auth.user!)
  if (!patient) {
    return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') ?? '100', 10) || 100))

  try {
    const rows = await prisma.migraineEvent.findMany({
      where: { patientId: patient.id },
      orderBy: { startDatetime: 'desc' },
      take: limit,
    })

    const events = rows.map((row) => {
      let meta: Record<string, unknown> = {}
      if (row.episodeNotes?.trim()) {
        try {
          meta = JSON.parse(row.episodeNotes) as Record<string, unknown>
        } catch {
          meta = {}
        }
      }
      const durationH =
        row.trainingDuration ??
        (typeof meta.durationHours === 'number' ? meta.durationHours : null) ??
        parseDurationHours(row.duration)

      return {
        id: row.id,
        timestamp: row.startDatetime.toISOString(),
        durationHours: durationH ?? 0,
        frequencyPerMonth: row.trainingFrequency ?? 0,
        location: (meta.location as string) || '',
        character: (meta.character as string) || '',
        intensity: row.severity,
        type: row.migraineType ?? row.csvMigraineType ?? '',
        summary: row.episodeNotes?.startsWith('{') ? null : row.episodeNotes,
        nausea: row.nausea ?? 0,
        vomit: row.vomit ?? 0,
        phonophobia: row.phonophobia ?? 0,
        photophobia: row.photophobia ?? 0,
        visual: row.visual ?? 0,
        sensory: row.sensory ?? 0,
        dysphasia: row.dysphasia ?? 0,
        dysarthria: row.dysarthria ?? 0,
        vertigo: row.vertigo ?? 0,
        tinnitus: row.tinnitus ?? 0,
        hypoacusis: row.hypoacusis ?? 0,
        diplopia: row.diplopia ?? 0,
        defect: row.defect ?? 0,
        ataxia: row.ataxia ?? 0,
        conscience: row.conscience ?? 0,
        paresthesia: row.paresthesia ?? 0,
        dpf: row.dpf != null ? String(row.dpf) : (meta.dpf as string) || '',
      }
    })

    return NextResponse.json({ events })
  } catch (e) {
    console.error('GET /api/patient/migraine-events error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function parseDurationHours(duration: string | null): number | null {
  if (!duration) return null
  const m = duration.match(/(\d+)/)
  if (!m) return null
  return parseInt(m[1], 10)
}
