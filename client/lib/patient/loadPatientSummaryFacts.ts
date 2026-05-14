import { prisma } from '@/lib/prisma'
import {
  fetchNextAttackPredictionWithReason,
  migraineEventsToModelRecords,
  type MigraineEventDbInput,
} from '@/lib/model/migraineModelRecords'

export type PatientSummaryFacts = {
  patientId: string
  patientName: string
  episodesLast30Days: number
  migraineDaysThisMonth: number
  avgSeverity: number
  adherencePercent: number | null
  totalEpisodes90d: number
  topTriggers: { name: string; count: number }[]
  nextAttackPredictedType: string | null
}

/** Loads episode aggregates used for AI summaries (mirrors patient analytics windows). */
export async function loadPatientSummaryFacts(patientId: string): Promise<PatientSummaryFacts | null> {
  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    select: { id: true, name: true, dob: true },
  })
  if (!patient) return null

  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const ninetyDaysAgo = new Date(now)
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const [events, medicationLogs, medicationGroups] = await Promise.all([
    prisma.migraineEvent.findMany({
      where: { patientId, startDatetime: { gte: ninetyDaysAgo } },
      orderBy: { startDatetime: 'asc' },
    }),
    prisma.medicationLog.findMany({
      where: { patientId, datetimeTaken: { gte: thirtyDaysAgo } },
    }),
    prisma.medicationGroup.findMany({
      where: { patientId, isActive: true },
    }),
  ])

  const recentEvents = events.filter((e) => new Date(e.startDatetime) >= thirtyDaysAgo)
  const episodesLast30Days = recentEvents.length

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const migraineDaysThisMonth = new Set(
    events.filter((e) => new Date(e.startDatetime) >= thisMonthStart).map((e) => {
      const d = new Date(e.startDatetime)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    })
  ).size

  const avgSeverity =
    events.length > 0
      ? Math.round((events.reduce((s, e) => s + e.severity, 0) / events.length) * 10) / 10
      : 0

  const triggerCounts: Record<string, number> = {}
  events.forEach((e) => {
    if (!e.perceivedTriggers?.trim()) return
    let list: string[] = []
    try {
      const parsed = JSON.parse(e.perceivedTriggers)
      list = Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      list = e.perceivedTriggers.split(',').map((t) => t.trim()).filter(Boolean)
    }
    list.forEach((t) => {
      triggerCounts[t] = (triggerCounts[t] ?? 0) + 1
    })
  })
  const topTriggers = Object.entries(triggerCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  let adherencePercent: number | null = null
  if (medicationGroups.length > 0 && medicationGroups.some((g) => g.adherenceRate != null)) {
    const sum = medicationGroups.reduce((s, g) => s + (g.adherenceRate ?? 0), 0)
    adherencePercent = Math.round(sum / medicationGroups.length)
  } else if (medicationLogs.length > 0 && medicationLogs.some((l) => l.adherenceRate != null)) {
    const sum = medicationLogs.reduce((s, l) => s + (l.adherenceRate ?? 0), 0)
    adherencePercent = Math.round(sum / medicationLogs.length)
  }

  const recordsForNextAttack = migraineEventsToModelRecords(
    events as MigraineEventDbInput[],
    new Date(patient.dob)
  )
  const nextAttackResult =
    recordsForNextAttack.length > 0
      ? await fetchNextAttackPredictionWithReason(recordsForNextAttack)
      : { dto: null, unavailableReason: null as string | null }

  return {
    patientId: patient.id,
    patientName: patient.name?.trim() || 'Patient',
    episodesLast30Days,
    migraineDaysThisMonth,
    avgSeverity,
    adherencePercent,
    totalEpisodes90d: events.length,
    topTriggers,
    nextAttackPredictedType: nextAttackResult.dto?.predictedType ?? null,
  }
}
