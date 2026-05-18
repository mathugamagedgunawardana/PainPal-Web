import { NextRequest, NextResponse } from 'next/server'
import { formatDistanceToNow } from 'date-fns'
import type { MigraineTypeClassification, MedicationEffectiveness } from '@prisma/client'
import { requireRole } from '@/lib/auth/middleware'
import { getDoctorUserId } from '@/lib/auth/getDoctorUserId'
import { prisma } from '@/lib/prisma'
import { computeMigraineStats } from '@/lib/doctor/migraineStats'
import { privateApiCacheHeaders } from '@/lib/http/cacheHeaders'

const DOCTOR_404 = {
  error: 'Doctor profile not found',
  message:
    'Log in with a registered doctor account (e.g. dr.johnson@clinic.example.com / SeedPassword123!) to view analytics.',
} as const

const TRIGGER_PALETTE = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#8b5cf6',
  '#06b6d4',
  '#3b82f6',
  '#22c55e',
  '#ec4899',
]

type AnalyticsRange = '1m' | '3m' | '6m' | '1y'

function parseRange(searchParams: URLSearchParams): AnalyticsRange {
  const r = searchParams.get('range')
  if (r === '1m' || r === '3m' || r === '6m' || r === '1y') return r
  return '6m'
}

function monthsForRange(range: AnalyticsRange): number {
  switch (range) {
    case '1m':
      return 1
    case '3m':
      return 3
    case '6m':
      return 6
    case '1y':
      return 12
    default:
      return 6
  }
}

function parseTriggerTokens(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(/[,|]/g)
    .map((s) => s.trim())
    .filter(Boolean)
}

function monthBuckets(rangeMonths: number, end: Date): { label: string; start: Date; end: Date }[] {
  const out: { label: string; start: Date; end: Date }[] = []
  for (let i = rangeMonths - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth() - i, 1)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    const shortMonth = start.toLocaleString('en-US', { month: 'short' })
    const yy = String(start.getFullYear()).slice(-2)
    out.push({
      label: `${shortMonth} '${yy}`,
      start,
      end: monthEnd,
    })
  }
  return out
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

/** Prefer anchoring charts to latest logged episode so seeded / historical data still appears. */
function analyticsRangeEnd(now: Date, latestEpisode: Date | null): Date {
  if (!latestEpisode) return now
  return latestEpisode.getTime() > now.getTime() ? now : latestEpisode
}

function bucketIndexFor(buckets: { start: Date; end: Date }[], dt: Date): number {
  const t = dt.getTime()
  for (let i = 0; i < buckets.length; i++) {
    const b = buckets[i]!
    if (t >= b.start.getTime() && t <= b.end.getTime()) return i
  }
  return -1
}

function mapMigraineTypeToTrendKey(
  t: MigraineTypeClassification | null
): 'chronic' | 'typicalAura' | 'vestibular' | 'hemiplegic' | 'probable' | null {
  if (!t) return null
  switch (t) {
    case 'CHRONIC_MIGRAINE':
    case 'STATUS_MIGRAINOSUS':
      return 'chronic'
    case 'MIGRAINE_WITH_AURA':
    case 'BRAINSTEM_AURA_MIGRAINE':
    case 'RETINAL_MIGRAINE':
      return 'typicalAura'
    case 'VESTIBULAR_MIGRAINE':
      return 'vestibular'
    case 'HEMIPLEGIC_MIGRAINE':
      return 'hemiplegic'
    case 'PROBABLE_MIGRAINE':
    case 'MIGRAINE_WITHOUT_AURA':
    case 'MENSTRUAL_MIGRAINE':
      return 'probable'
    default:
      return 'probable'
  }
}

function effectivenessBucket(
  e: MedicationEffectiveness | null | undefined
): 'improved' | 'stable' | 'worsened' | null {
  if (e == null) return null
  if (e === 'HIGH') return 'improved'
  if (e === 'MODERATE') return 'stable'
  return 'worsened'
}

function patientConcerns(
  risk: 'low' | 'medium' | 'high',
  adherence: number | null,
  lastSeverity: number | null
): string[] {
  const c: string[] = []
  if (risk === 'high') c.push('High activity risk (30d)')
  if (risk === 'medium') c.push('Elevated activity (30d)')
  if (lastSeverity != null && lastSeverity >= 8) c.push('Recent severe episode')
  if (adherence != null && adherence < 50) c.push('Low medication adherence')
  else if (adherence != null && adherence < 70) c.push('Adherence below target')
  if (c.length === 0) c.push('Continue routine follow-up')
  return c.slice(0, 5)
}

/** GET /api/doctor/analytics – population analytics for the signed-in doctor */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['DOCTOR'])
  if (!auth.authorized) return auth.response!
  if (!auth.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const range = parseRange(req.nextUrl.searchParams)
  const rangeMonths = monthsForRange(range)

  try {
    const doctorUserId = await getDoctorUserId(auth.user)
    if (!doctorUserId) {
      return NextResponse.json(DOCTOR_404, { status: 404 })
    }
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
    })
    if (!doctorProfile) {
      return NextResponse.json(DOCTOR_404, { status: 404 })
    }

    const now = new Date()

    const patientLinks = await prisma.patientDoctorLink.findMany({
      where: { doctorId: doctorProfile.id, linkStatus: 'ACTIVE' },
      select: {
        patientId: true,
        createdAt: true,
        patient: { select: { id: true, name: true } },
      },
    })
    const patientIds = patientLinks.map((l) => l.patientId)
    const nameByPatient = new Map(patientLinks.map((l) => [l.patientId, l.patient.name]))

    const empty = {
      range,
      overview: {
        totalPatients: patientIds.length,
        activePatients: patientIds.length,
        highRiskPatients: 0,
        avgMigraineFrequency: 0,
        patientGrowthLabel: null as string | null,
        riskTrendLabel: null as string | null,
        avgFrequencyTrendLabel: null as string | null,
        activeRateLabel: 'No patients linked',
      },
      migraineFrequencyTrend: monthBuckets(rangeMonths, now).map((b) => ({
        month: b.label,
        avgFrequency: 0,
        totalEvents: 0,
      })),
      migraineTypeTrend: monthBuckets(rangeMonths, now).map((b) => ({
        date: b.label,
        chronic: 0,
        typicalAura: 0,
        vestibular: 0,
        hemiplegic: 0,
        probable: 0,
      })),
      severityDistribution: [
        { severity: 'Mild (1-3)', count: 0, percentage: 0 },
        { severity: 'Moderate (4-6)', count: 0, percentage: 0 },
        { severity: 'Severe (7-10)', count: 0, percentage: 0 },
      ],
      commonTriggers: [] as { trigger: string; episodeCount: number; percentage: number; color: string }[],
      medicationAdherence: [
        { name: 'Excellent (>90%)', value: 0, color: '#10b981' },
        { name: 'Good (70-90%)', value: 0, color: '#3b82f6' },
        { name: 'Fair (50-70%)', value: 0, color: '#f59e0b' },
        { name: 'Poor (<50%)', value: 0, color: '#ef4444' },
        { name: 'No adherence data', value: 0, color: '#94a3b8' },
      ],
      treatmentOutcomes: monthBuckets(rangeMonths, now).map((b) => ({
        month: b.label,
        improved: 0,
        stable: 0,
        worsened: 0,
      })),
      highRiskPatients: [] as {
        id: string
        name: string
        riskLevel: 'HIGH' | 'MEDIUM' | 'LOW'
        frequencyLabel: string
        adherence: number | null
        lastEvent: string
        concerns: string[]
      }[],
      insights: {
        avgResponseHours: null as number | null,
        successRatePercent: null as number | null,
        appointmentsThisWeek: 0,
      },
      meta: {
        rangeEnd: now.toISOString(),
        episodeCountInCharts: 0,
        insightRowsInRange: 0,
        anchorNote:
          'Using calendar ending today; link patients and log episodes to populate charts.',
      },
    }

    if (patientIds.length === 0) {
      return NextResponse.json(empty)
    }

    const latestAgg = await prisma.migraineEvent.aggregate({
      where: { patientId: { in: patientIds } },
      _max: { startDatetime: true },
    })
    const rangeEnd = analyticsRangeEnd(now, latestAgg._max.startDatetime)
    const buckets = monthBuckets(rangeMonths, rangeEnd)
    const sliceStart = buckets[0]!.start
    const sliceEnd = endOfDay(rangeEnd)
    const sliceEndMs = sliceEnd.getTime()

    const riskLookback = new Date(rangeEnd)
    riskLookback.setDate(riskLookback.getDate() - 150)

    const [eventsChart, eventsRisk, aiInsights, medGroups, weekAppointments, convos] =
      await Promise.all([
        prisma.migraineEvent.findMany({
          where: {
            patientId: { in: patientIds },
            startDatetime: { gte: sliceStart, lte: sliceEnd },
          },
          select: {
            patientId: true,
            startDatetime: true,
            severity: true,
            perceivedTriggers: true,
            detectedSymptoms: true,
            migraineType: true,
            effectiveness: true,
          },
        }),
        prisma.migraineEvent.findMany({
          where: {
            patientId: { in: patientIds },
            startDatetime: { gte: riskLookback, lte: sliceEnd },
          },
          select: {
            patientId: true,
            startDatetime: true,
            severity: true,
            perceivedTriggers: true,
            detectedSymptoms: true,
            migraineType: true,
            effectiveness: true,
          },
        }),
        prisma.aIDiagnosticInsight.findMany({
          where: {
            patientId: { in: patientIds },
            createdDatetime: { gte: sliceStart, lte: sliceEnd },
          },
          select: {
            createdDatetime: true,
            migraineType: true,
            keyContributors: true,
          },
        }),
        prisma.medicationGroup.findMany({
          where: { doctorId: doctorProfile.id, patientId: { in: patientIds }, isActive: true },
          select: { patientId: true, adherenceRate: true },
        }),
        prisma.appointment.findMany({
          where: {
            doctorId: doctorProfile.id,
            patientId: { in: patientIds },
            status: { not: 'CANCELLED' },
            appointmentDate: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
          },
          select: { id: true },
        }),
        prisma.conversation.findMany({
          where: { doctorId: doctorProfile.id, patientId: { in: patientIds } },
          take: 20,
          select: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 40,
              select: { createdAt: true, senderRole: true },
            },
          },
        }),
      ])

    const adherenceByPatient = new Map<string, number[]>()
    for (const g of medGroups) {
      if (g.adherenceRate == null) continue
      if (!adherenceByPatient.has(g.patientId)) adherenceByPatient.set(g.patientId, [])
      adherenceByPatient.get(g.patientId)!.push(g.adherenceRate)
    }
    const avgAdherence = (pid: string): number | null => {
      const arr = adherenceByPatient.get(pid)
      if (!arr?.length) return null
      return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
    }

    const eventsByPatient = new Map<string, typeof eventsRisk>()
    for (const e of eventsRisk) {
      if (!eventsByPatient.has(e.patientId)) eventsByPatient.set(e.patientId, [])
      eventsByPatient.get(e.patientId)!.push(e)
    }

    let highRiskPatients = 0
    type RiskRow = {
      id: string
      name: string
      riskLevel: 'HIGH' | 'MEDIUM'
      frequencyLabel: string
      adherence: number | null
      lastEvent: string
      concerns: string[]
      sort: number
    }
    const riskRows: RiskRow[] = []

    for (const pid of patientIds) {
      const ev = eventsByPatient.get(pid) ?? []
      const stats = computeMigraineStats(ev)
      if (stats.riskLevel === 'high') highRiskPatients += 1

      if (stats.riskLevel === 'high' || stats.riskLevel === 'medium') {
        const sorted = [...ev].sort(
          (a, b) => new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime()
        )
        const last = sorted[0]
        const lastSev = last?.severity ?? null
        const ad = avgAdherence(pid)
        riskRows.push({
          id: pid,
          name: nameByPatient.get(pid) ?? 'Patient',
          riskLevel: stats.riskLevel === 'high' ? 'HIGH' : 'MEDIUM',
          frequencyLabel: `${stats.recentEpisodes} episodes / 30d window`,
          adherence: ad,
          lastEvent: last ? formatDistanceToNow(new Date(last.startDatetime), { addSuffix: true }) : '—',
          concerns: patientConcerns(stats.riskLevel, ad, lastSev),
          sort: stats.riskLevel === 'high' ? 2 : 1,
        })
      }
    }

    riskRows.sort((a, b) => b.sort - a.sort || b.concerns.length - a.concerns.length)
    const highRiskPatientsList = riskRows.slice(0, 24).map(({ sort: _s, ...row }) => row)

    // Link growth (calendar months)
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const newLinksThisMonth = patientLinks.filter((l) => new Date(l.createdAt) >= startThisMonth).length
    const newLinksLastMonth = patientLinks.filter((l) => {
      const c = new Date(l.createdAt)
      return c >= startLastMonth && c < startThisMonth
    }).length
    let patientGrowthLabel: string | null = null
    if (newLinksLastMonth > 0) {
      const pct = Math.round(((newLinksThisMonth - newLinksLastMonth) / newLinksLastMonth) * 100)
      patientGrowthLabel =
        pct >= 0 ? `+${pct}% new links vs last month` : `${pct}% new links vs last month`
    } else if (newLinksThisMonth > 0) {
      patientGrowthLabel = `${newLinksThisMonth} new link(s) this month`
    }

    const riskTrendLabel =
      highRiskPatients > 0
        ? `${highRiskPatients} patient(s) in high-risk window`
        : 'No high-risk patients (30d rules)'

    const episodeInBucket = (startDatetime: Date, b: (typeof buckets)[0]) => {
      const t = new Date(startDatetime).getTime()
      const hi = Math.min(b.end.getTime(), sliceEndMs)
      return t >= b.start.getTime() && t <= hi
    }

    // Frequency trend + type trend + treatment outcomes per bucket
    const migraineFrequencyTrend = buckets.map((b) => {
      const inB = eventsChart.filter((e) => episodeInBucket(e.startDatetime, b))
      const denom = Math.max(1, patientIds.length)
      return {
        month: b.label,
        totalEvents: inB.length,
        avgFrequency: Math.round((inB.length / denom) * 10) / 10,
      }
    })

    const lastBucketEvents = eventsChart.filter((e) =>
      episodeInBucket(e.startDatetime, buckets[buckets.length - 1]!)
    )
    const prevBucketEvents =
      buckets.length >= 2
        ? eventsChart.filter((e) => episodeInBucket(e.startDatetime, buckets[buckets.length - 2]!))
        : []
    const denom = Math.max(1, patientIds.length)
    const lastAvg = lastBucketEvents.length / denom
    const prevAvg = prevBucketEvents.length / denom
    let avgFrequencyTrendLabel: string | null = null
    if (buckets.length >= 2) {
      const delta = Math.round((lastAvg - prevAvg) * 10) / 10
      avgFrequencyTrendLabel =
        delta === 0
          ? 'Same avg load as prior month'
          : delta > 0
            ? `+${delta} avg episodes/patient vs prior month`
            : `${delta} avg episodes/patient vs prior month`
    }

    const migraineTypeTrend = buckets.map((b) => ({
      date: b.label,
      chronic: 0,
      typicalAura: 0,
      vestibular: 0,
      hemiplegic: 0,
      probable: 0,
    }))
    for (const e of eventsChart) {
      const bi = bucketIndexFor(buckets, new Date(e.startDatetime))
      if (bi < 0) continue
      const key = mapMigraineTypeToTrendKey(e.migraineType)
      if (key) migraineTypeTrend[bi]![key] += 1
    }
    for (const row of aiInsights) {
      const dt = new Date(row.createdDatetime)
      if (dt.getTime() > sliceEndMs) continue
      const bi = bucketIndexFor(buckets, dt)
      if (bi < 0) continue
      const key = mapMigraineTypeToTrendKey(row.migraineType)
      if (key) migraineTypeTrend[bi]![key] += 1
    }

    const treatmentOutcomes = buckets.map((b) => {
      const improved = { improved: 0, stable: 0, worsened: 0 }
      for (const e of eventsChart) {
        if (!episodeInBucket(e.startDatetime, b)) continue
        const bucket = effectivenessBucket(e.effectiveness)
        if (bucket === 'improved') improved.improved += 1
        else if (bucket === 'stable') improved.stable += 1
        else if (bucket === 'worsened') improved.worsened += 1
      }
      return { month: b.label, ...improved }
    })

    let mild = 0,
      mod = 0,
      sev = 0
    for (const e of eventsChart) {
      if (e.severity <= 3) mild += 1
      else if (e.severity <= 6) mod += 1
      else sev += 1
    }
    const totSev = mild + mod + sev
    const pct = (n: number) => (totSev > 0 ? Math.round((n / totSev) * 1000) / 10 : 0)
    const severityDistribution = [
      { severity: 'Mild (1-3)', count: mild, percentage: pct(mild) },
      { severity: 'Moderate (4-6)', count: mod, percentage: pct(mod) },
      { severity: 'Severe (7-10)', count: sev, percentage: pct(sev) },
    ]

    const triggerCounts = new Map<string, number>()
    for (const e of eventsChart) {
      for (const tok of parseTriggerTokens(e.perceivedTriggers)) {
        triggerCounts.set(tok, (triggerCounts.get(tok) ?? 0) + 1)
      }
      for (const raw of e.detectedSymptoms ?? []) {
        const sym = raw.trim()
        if (!sym) continue
        const label = `Symptom: ${sym}`
        triggerCounts.set(label, (triggerCounts.get(label) ?? 0) + 1)
      }
    }
    for (const ins of aiInsights) {
      if (new Date(ins.createdDatetime).getTime() > sliceEndMs) continue
      for (const raw of ins.keyContributors ?? []) {
        const k = raw.trim()
        if (!k) continue
        triggerCounts.set(k, (triggerCounts.get(k) ?? 0) + 1)
      }
    }
    const totalTriggerMentions = [...triggerCounts.values()].reduce((a, b) => a + b, 0)
    const commonTriggers = [...triggerCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([trigger, count], i) => ({
        trigger,
        episodeCount: count,
        percentage:
          totalTriggerMentions > 0 ? Math.round((count / totalTriggerMentions) * 1000) / 10 : 0,
        color: TRIGGER_PALETTE[i % TRIGGER_PALETTE.length]!,
      }))

    const pie = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0,
      none: 0,
    }
    for (const pid of patientIds) {
      const ad = avgAdherence(pid)
      if (ad == null) pie.none += 1
      else if (ad > 90) pie.excellent += 1
      else if (ad >= 70) pie.good += 1
      else if (ad >= 50) pie.fair += 1
      else pie.poor += 1
    }
    const medicationAdherence = [
      { name: 'Excellent (>90%)', value: pie.excellent, color: '#10b981' },
      { name: 'Good (70-90%)', value: pie.good, color: '#3b82f6' },
      { name: 'Fair (50-70%)', value: pie.fair, color: '#f59e0b' },
      { name: 'Poor (<50%)', value: pie.poor, color: '#ef4444' },
      { name: 'No adherence data', value: pie.none, color: '#94a3b8' },
    ]

    let effHigh = 0,
      effTot = 0
    for (const e of eventsChart) {
      if (e.effectiveness == null) continue
      effTot += 1
      if (e.effectiveness === 'HIGH') effHigh += 1
    }
    const successRatePercent = effTot > 0 ? Math.round((effHigh / effTot) * 1000) / 10 : null

    let totalMs = 0
    let replyPairs = 0
    for (const c of convos) {
      const msgs = [...c.messages].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      for (let i = 1; i < msgs.length; i++) {
        if (msgs[i - 1]!.senderRole === 'PATIENT' && msgs[i]!.senderRole === 'DOCTOR') {
          totalMs += new Date(msgs[i]!.createdAt).getTime() - new Date(msgs[i - 1]!.createdAt).getTime()
          replyPairs += 1
        }
      }
    }
    const avgResponseHours = replyPairs > 0 ? Math.round((totalMs / replyPairs / 3600000) * 10) / 10 : null

    const lastMonthAvg =
      migraineFrequencyTrend[migraineFrequencyTrend.length - 1]?.avgFrequency ?? 0

    const patientsWithEpisodes = new Set(eventsChart.map((e) => e.patientId)).size
    const activeRateLabel =
      patientIds.length > 0
        ? `${Math.round((patientsWithEpisodes / patientIds.length) * 1000) / 10}% with ≥1 episode in range`
        : '—'

    return NextResponse.json({
      range,
      overview: {
        totalPatients: patientIds.length,
        activePatients: patientIds.length,
        highRiskPatients,
        avgMigraineFrequency: lastMonthAvg,
        patientGrowthLabel,
        riskTrendLabel,
        avgFrequencyTrendLabel,
        activeRateLabel,
      },
      migraineFrequencyTrend,
      migraineTypeTrend,
      severityDistribution,
      commonTriggers,
      medicationAdherence,
      treatmentOutcomes,
      highRiskPatients: highRiskPatientsList,
      insights: {
        avgResponseHours,
        successRatePercent,
        appointmentsThisWeek: weekAppointments.length,
      },
      meta: {
        rangeEnd: rangeEnd.toISOString(),
        chartWindowStart: sliceStart.toISOString(),
        episodeCountInCharts: eventsChart.length,
        insightRowsInRange: aiInsights.length,
        anchorNote:
          latestAgg._max.startDatetime &&
          latestAgg._max.startDatetime.getTime() < now.getTime() - 24 * 60 * 60 * 1000
            ? `Charts anchor to your panel’s latest episode (${rangeEnd.toLocaleDateString()}), so older seed data still appears.`
            : 'Charts use the selected period ending with the most recent episode (or today).',
      },
    }, { headers: privateApiCacheHeaders() })
  } catch (error) {
    console.error('GET /api/doctor/analytics error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: 'Internal server error', message }, { status: 500 })
  }
}
