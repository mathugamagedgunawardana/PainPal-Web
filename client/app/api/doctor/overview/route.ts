import { NextRequest, NextResponse } from 'next/server'
import { formatDistanceToNow } from 'date-fns'
import { requireRole } from '@/lib/auth/middleware'
import { getDoctorUserId } from '@/lib/auth/getDoctorUserId'
import { prisma } from '@/lib/prisma'
import { computeMigraineStats } from '@/lib/doctor/migraineStats'

const DOCTOR_404 = {
  error: 'Doctor profile not found',
  message:
    'Log in with a registered doctor account (e.g. dr.johnson@clinic.example.com / SeedPassword123!) to view the overview.',
} as const

const TRIGGER_PALETTE = [
  '#3b82f6',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
]

function startOfLocalDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function endOfLocalDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function parseTriggerTokens(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(/[,|]/g)
    .map((s) => s.trim())
    .filter(Boolean)
}

function severityActivityLabel(sev: number): 'low' | 'medium' | 'high' {
  if (sev >= 8) return 'high'
  if (sev >= 5) return 'medium'
  return 'low'
}

function lastEpisodeSeverity(events: { startDatetime: Date; severity: number }[]): number | null {
  if (!events.length) return null
  const sorted = [...events].sort(
    (a, b) => new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime()
  )
  return sorted[0]?.severity ?? null
}

function bucketFromSeverity(sev: number | null): 'severe' | 'moderate' | 'mild' {
  if (sev == null) return 'mild'
  if (sev >= 8) return 'severe'
  if (sev >= 5) return 'moderate'
  return 'mild'
}

/** GET /api/doctor/overview – aggregated dashboard metrics for the signed-in doctor */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['DOCTOR'])
  if (!auth.authorized) return auth.response!
  if (!auth.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

    if (patientIds.length === 0) {
      return NextResponse.json({
        activePatients: 0,
        activePatientsTrendLabel: null,
        severeCases: 0,
        severeCasesTrendLabel: null,
        todayAppointments: 0,
        nextAppointmentHint: null,
        episodeReportsThisWeek: 0,
        migraineTrend: [],
        triggers: [],
        recentActivities: [],
        upcomingAppointments: [],
        calendar: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          monthLabel: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
          daysWithAppointments: [] as number[],
          todayDay: now.getDate(),
        },
        tasks: [],
      })
    }

    const yearAgo = new Date(now)
    yearAgo.setFullYear(yearAgo.getFullYear() - 1)

    const [events, appointments, notesFeed, commFeed] = await Promise.all([
      prisma.migraineEvent.findMany({
        where: { patientId: { in: patientIds }, startDatetime: { gte: yearAgo } },
        select: {
          id: true,
          patientId: true,
          startDatetime: true,
          severity: true,
          perceivedTriggers: true,
        },
      }),
      prisma.appointment.findMany({
        where: { doctorId: doctorProfile.id, patientId: { in: patientIds } },
        include: { patient: { select: { id: true, name: true } } },
      }),
      prisma.clinicalNote.findMany({
        where: { doctorId: doctorProfile.id, patientId: { in: patientIds } },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          createdAt: true,
          noteContent: true,
          patient: { select: { name: true } },
        },
      }),
      prisma.communication.findMany({
        where: { doctorId: doctorProfile.id, patientId: { in: patientIds } },
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: {
          id: true,
          createdAt: true,
          communicationType: true,
          message: true,
          patient: { select: { name: true } },
        },
      }),
    ])

    const eventsByPatient = new Map<string, typeof events>()
    for (const e of events) {
      if (!eventsByPatient.has(e.patientId)) eventsByPatient.set(e.patientId, [])
      eventsByPatient.get(e.patientId)!.push(e)
    }

    let severeCases = 0
    for (const pid of patientIds) {
      const stats = computeMigraineStats(eventsByPatient.get(pid) ?? [])
      if (stats.riskLevel === 'high') severeCases += 1
    }

    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - 7)
    const prevWeekStart = new Date(weekStart)
    prevWeekStart.setDate(prevWeekStart.getDate() - 7)

    const episodesThisWeek = events.filter((e) => new Date(e.startDatetime) >= weekStart).length
    const episodesPrevWeek = events.filter((e) => {
      const t = new Date(e.startDatetime)
      return t >= prevWeekStart && t < weekStart
    }).length

    const dayStart = startOfLocalDay(now)
    const dayEnd = endOfLocalDay(now)
    const todayAppts = appointments.filter((a) => {
      const t = new Date(a.appointmentDate)
      return t >= dayStart && t <= dayEnd && a.status !== 'CANCELLED'
    })
    const todayAppointments = todayAppts.length

    const upcomingToday = todayAppts
      .filter((a) => new Date(a.appointmentDate) >= now)
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())[0]
    let nextAppointmentHint: string | null = null
    if (upcomingToday) {
      const t = new Date(upcomingToday.appointmentDate)
      const timeStr = t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      nextAppointmentHint = `Next: ${timeStr}`
    } else if (todayAppts.length > 0) {
      nextAppointmentHint = `${todayAppts.length} scheduled today`
    }

    // Month-over-month new patient links
    const startThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const newLinksThisMonth = patientLinks.filter((l) => new Date(l.createdAt) >= startThisMonth).length
    const newLinksLastMonth = patientLinks.filter((l) => {
      const c = new Date(l.createdAt)
      return c >= startLastMonth && c < startThisMonth
    }).length
    let activePatientsTrendLabel: string | null = null
    if (newLinksLastMonth > 0) {
      const pct = Math.round(((newLinksThisMonth - newLinksLastMonth) / newLinksLastMonth) * 100)
      activePatientsTrendLabel =
        pct >= 0 ? `+${pct}% new links vs last month` : `${pct}% new links vs last month`
    } else if (newLinksThisMonth > 0) {
      activePatientsTrendLabel = `${newLinksThisMonth} new patient link(s) this month`
    }

    let severeCasesTrendLabel: string | null = null
    if (episodesPrevWeek > 0) {
      const delta = episodesThisWeek - episodesPrevWeek
      severeCasesTrendLabel =
        delta === 0
          ? 'Same episode volume as prior week'
          : delta > 0
            ? `+${delta} episodes vs prior week (all patients)`
            : `${delta} episodes vs prior week (all patients)`
    } else if (episodesThisWeek > 0) {
      severeCasesTrendLabel = `${episodesThisWeek} episodes logged this week`
    }

    // Last 6 calendar months trend
    const migraineTrend: { month: string; episodes: number; severe: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999)
      const label = monthStart.toLocaleString('en-US', { month: 'short' })
      const inMonth = events.filter((e) => {
        const t = new Date(e.startDatetime)
        return t >= monthStart && t <= monthEnd
      })
      migraineTrend.push({
        month: label,
        episodes: inMonth.length,
        severe: inMonth.filter((e) => e.severity >= 7).length,
      })
    }

    const triggerWindowStart = new Date(now)
    triggerWindowStart.setDate(triggerWindowStart.getDate() - 30)
    const triggerCounts = new Map<string, number>()
    for (const e of events) {
      if (new Date(e.startDatetime) < triggerWindowStart) continue
      for (const tok of parseTriggerTokens(e.perceivedTriggers)) {
        triggerCounts.set(tok, (triggerCounts.get(tok) ?? 0) + 1)
      }
    }
    const triggers = [...triggerCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([trigger, count], i) => ({
        trigger,
        count,
        color: TRIGGER_PALETTE[i % TRIGGER_PALETTE.length]!,
      }))

    // Recent activity feed
    type Act = {
      id: string
      type: 'report' | 'medication' | 'alert' | 'appointment'
      message: string
      at: Date
      severity: 'low' | 'medium' | 'high'
    }
    const activities: Act[] = []

    const recentEpisodes = [...events].sort(
      (a, b) => new Date(b.startDatetime).getTime() - new Date(a.startDatetime).getTime()
    ).slice(0, 10)
    for (const e of recentEpisodes) {
      const name = nameByPatient.get(e.patientId) ?? 'Patient'
      activities.push({
        id: `ep-${e.id}`,
        type: 'report',
        message: `${name} logged an episode (severity ${e.severity}/10)`,
        at: new Date(e.startDatetime),
        severity: severityActivityLabel(e.severity),
      })
    }

    const recentAppts = [...appointments].sort(
      (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
    ).slice(0, 8)
    for (const a of recentAppts) {
      activities.push({
        id: `ap-${a.id}`,
        type: 'appointment',
        message: `${a.appointmentType} — ${a.patient.name} (${a.status.toLowerCase()})`,
        at: new Date(a.appointmentDate),
        severity: 'low',
      })
    }

    for (const n of notesFeed) {
      const snippet = n.noteContent.trim().slice(0, 80) + (n.noteContent.length > 80 ? '…' : '')
      activities.push({
        id: `note-${n.id}`,
        type: 'report',
        message: `Clinical note for ${n.patient.name}: ${snippet || '(empty)'}`,
        at: new Date(n.createdAt),
        severity: 'low',
      })
    }

    for (const c of commFeed) {
      const isAlert = c.communicationType.toLowerCase().includes('alert')
      activities.push({
        id: `comm-${c.id}`,
        type: isAlert ? 'alert' : 'report',
        message: `${c.communicationType}: ${c.patient.name} — ${c.message.slice(0, 100)}`,
        at: new Date(c.createdAt),
        severity: isAlert ? 'medium' : 'low',
      })
    }

    activities.sort((a, b) => b.at.getTime() - a.at.getTime())
    const recentActivities = activities.slice(0, 12).map((a) => ({
      id: a.id,
      type: a.type,
      message: a.message,
      time: formatDistanceToNow(a.at, { addSuffix: true }),
      severity: a.severity,
    }))

    const upcomingAppointments = appointments
      .filter((a) => new Date(a.appointmentDate) >= now && a.status !== 'CANCELLED')
      .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())
      .slice(0, 8)
      .map((a) => {
        const sev = lastEpisodeSeverity(eventsByPatient.get(a.patientId) ?? [])
        return {
          id: a.id,
          patientId: a.patientId,
          patientName: a.patient.name,
          appointmentDate: a.appointmentDate.toISOString(),
          severity: bucketFromSeverity(sev),
        }
      })

    const calMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const calMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    const daysWithAppointments = [
      ...new Set(
        appointments
          .filter((a) => {
            const t = new Date(a.appointmentDate)
            return t >= calMonthStart && t <= calMonthEnd && a.status !== 'CANCELLED'
          })
          .map((a) => new Date(a.appointmentDate).getDate())
      ),
    ].sort((x, y) => x - y)

    const tasks: { id: string; task: string; priority: 'high' | 'medium' | 'low'; completed: boolean }[] = []
    if (severeCases > 0) {
      tasks.push({
        id: 'risk',
        task: `Review ${severeCases} high-risk patient(s) (30-day activity)`,
        priority: 'high',
        completed: false,
      })
    }
    if (todayAppointments > 0) {
      tasks.push({
        id: 'today-appts',
        task: `${todayAppointments} appointment(s) on your calendar today`,
        priority: 'medium',
        completed: false,
      })
    }
    if (episodesThisWeek > 0) {
      tasks.push({
        id: 'episodes-week',
        task: `${episodesThisWeek} migraine episode report(s) in the last 7 days`,
        priority: 'medium',
        completed: false,
      })
    }
    tasks.push({
      id: 'inbox',
      task: 'Open Patients to review histories and analytics',
      priority: 'low',
      completed: false,
    })

    return NextResponse.json({
      activePatients: patientIds.length,
      activePatientsTrendLabel,
      severeCases,
      severeCasesTrendLabel,
      todayAppointments,
      nextAppointmentHint,
      episodeReportsThisWeek: episodesThisWeek,
      migraineTrend,
      triggers,
      recentActivities,
      upcomingAppointments,
      calendar: {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        monthLabel: now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        daysWithAppointments,
        todayDay: now.getDate(),
      },
      tasks,
    })
  } catch (error) {
    console.error('GET /api/doctor/overview error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: 'Internal server error', message }, { status: 500 })
  }
}
