import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { getPatientUserId } from '@/lib/auth/getPatientUserId'
import { prisma } from '@/lib/prisma'
import { migraineEventsToModelRecords, type MigraineEventDbInput } from '@/lib/model/migraineModelRecords'
import { getCachedNextAttack } from '@/lib/model/patientModelCache'
import { privateApiCacheHeaders } from '@/lib/http/cacheHeaders'

/** GET /api/patient/analytics – aggregated analytics for the current patient (PATIENT role only) */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['PATIENT'])
  if (!auth.authorized) return auth.response!

  const patientUserId = await getPatientUserId(auth.user!)
  if (!patientUserId) {
    return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
  }

  const patient = await prisma.patientProfile.findUnique({
    where: { userId: patientUserId },
  })
  if (!patient) {
    return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const ninetyDaysAgo = new Date(now)
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  try {
    const [events, medicationLogs, medicationGroups] = await Promise.all([
      prisma.migraineEvent.findMany({
        where: { patientId: patient.id, startDatetime: { gte: ninetyDaysAgo } },
        orderBy: { startDatetime: 'asc' },
      }),
      prisma.medicationLog.findMany({
        where: { patientId: patient.id, datetimeTaken: { gte: thirtyDaysAgo } },
      }),
      prisma.medicationGroup.findMany({
        where: { patientId: patient.id, isActive: true },
      }),
    ])

    // Episodes in last 30 days
    const recentEvents = events.filter((e) => new Date(e.startDatetime) >= thirtyDaysAgo)
    const episodesLast30Days = recentEvents.length

    // Episodes by week (last 12 weeks)
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const weeks: { weekLabel: string; count: number; start: Date }[] = []
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getTime() - (i + 1) * weekMs)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start.getTime() + weekMs)
      const count = events.filter((e) => {
        const t = new Date(e.startDatetime).getTime()
        return t >= start.getTime() && t < end.getTime()
      }).length
      weeks.push({
        weekLabel: `W${12 - i}`,
        count,
        start,
      })
    }
    const episodesByWeek = weeks.map((w) => ({
      label: w.weekLabel,
      fullLabel: `${w.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      count: w.count,
    }))

    // Severity distribution (1–10)
    const severityBuckets: Record<number, number> = {}
    for (let i = 1; i <= 10; i++) severityBuckets[i] = 0
    events.forEach((e) => {
      const s = Math.min(10, Math.max(1, e.severity))
      severityBuckets[s] = (severityBuckets[s] ?? 0) + 1
    })
    const severityDistribution = Object.entries(severityBuckets).map(([level, count]) => ({
      level: Number(level),
      count,
      label: level === '10' ? '10 (Severe)' : level,
    }))

    // Average severity
    const avgSeverity =
      events.length > 0
        ? Math.round((events.reduce((s, e) => s + e.severity, 0) / events.length) * 10) / 10
        : 0

    // Triggers: parse perceivedTriggers (comma-separated or JSON)
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
    const triggers = Object.entries(triggerCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Adherence: from medication groups or logs
    let adherencePercent: number | null = null
    if (medicationGroups.length > 0 && medicationGroups.some((g) => g.adherenceRate != null)) {
      const sum = medicationGroups.reduce((s, g) => s + (g.adherenceRate ?? 0), 0)
      adherencePercent = Math.round(sum / medicationGroups.length)
    } else if (medicationLogs.length > 0 && medicationLogs.some((l) => l.adherenceRate != null)) {
      const sum = medicationLogs.reduce((s, l) => s + (l.adherenceRate ?? 0), 0)
      adherencePercent = Math.round(sum / medicationLogs.length)
    }

    // Migraine days this month (days with at least one event)
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const migraineDaysThisMonth = new Set(
      events.filter((e) => new Date(e.startDatetime) >= thisMonthStart).map((e) => {
        const d = new Date(e.startDatetime)
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      })
    ).size

    const refresh = req.nextUrl.searchParams.get('refresh') === 'true'
    const patientDob = new Date(patient.dob)
    const eventsInput = events as MigraineEventDbInput[]

    const nextAttackResult = await getCachedNextAttack({
      patientId: patient.id,
      patientDob,
      events: eventsInput,
      refresh,
    })
    const nextAttack = nextAttackResult.dto

    return NextResponse.json(
      {
      summary: {
        episodesLast30Days,
        migraineDaysThisMonth,
        avgSeverity,
        adherencePercent,
      },
      episodesByWeek,
      severityDistribution,
      triggers,
      totalEpisodes: events.length,
      nextAttack,
      nextAttackUnavailableReason: nextAttackResult.unavailableReason,
      nextAttackDisclaimer:
        'Forecasts are probabilistic and for decision support only—not a diagnosis or emergency guidance.',
    },
      { headers: privateApiCacheHeaders() }
    )
  } catch (error) {
    console.error('GET /api/patient/analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
