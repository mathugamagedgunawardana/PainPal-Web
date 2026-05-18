import { prisma } from '@/lib/prisma'
import { computeMigraineStats, type EventLike } from '@/lib/doctor/migraineStats'

/** Batch-load recent migraine events for list risk stats (avoids 120 events × N patients in one query). */
export async function loadMigraineStatsByPatientId(
  patientIds: string[],
): Promise<Map<string, ReturnType<typeof computeMigraineStats>>> {
  const map = new Map<string, ReturnType<typeof computeMigraineStats>>()
  if (!patientIds.length) return map

  const lookback = new Date()
  lookback.setDate(lookback.getDate() - 120)

  const events = await prisma.migraineEvent.findMany({
    where: {
      patientId: { in: patientIds },
      startDatetime: { gte: lookback },
    },
    select: { patientId: true, startDatetime: true, severity: true },
    orderBy: { startDatetime: 'desc' },
  })

  const byPatient = new Map<string, EventLike[]>()
  for (const e of events) {
    if (!byPatient.has(e.patientId)) byPatient.set(e.patientId, [])
    byPatient.get(e.patientId)!.push({
      startDatetime: e.startDatetime,
      severity: e.severity,
    })
  }

  for (const id of patientIds) {
    map.set(id, computeMigraineStats(byPatient.get(id) ?? []))
  }
  return map
}
