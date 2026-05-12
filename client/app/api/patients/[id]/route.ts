import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { getDoctorUserId } from '@/lib/auth/getDoctorUserId'
import { prisma } from '@/lib/prisma'

function formatDate(d: Date): string {
  return new Date(d).toISOString().slice(0, 10)
}

function severityLabel(severity: number): string {
  if (severity >= 7) return 'Severe'
  if (severity >= 4) return 'Moderate'
  return 'Mild'
}

function splitMedicationList(s: string | null | undefined): string[] {
  if (!s?.trim()) return []
  return s.split(',').map((x) => x.trim()).filter(Boolean)
}

type EventLike = { startDatetime: Date; severity: number }

function computeMigraineStats(events: EventLike[]) {
  if (!events.length) {
    return { recentEpisodes: 0, migraineDays: 0, riskLevel: 'low' as const }
  }

  const latestEventDate = new Date(
    Math.max(...events.map((e) => new Date(e.startDatetime).getTime()))
  )
  const rollingStart = new Date(latestEventDate)
  rollingStart.setDate(rollingStart.getDate() - 30)

  const recentWindow = events.filter((e) => {
    const ts = new Date(e.startDatetime).getTime()
    return ts >= rollingStart.getTime() && ts <= latestEventDate.getTime()
  })

  const migraineDaySet = new Set(
    recentWindow
      .filter((e) => {
        const d = new Date(e.startDatetime)
        return d.getUTCFullYear() === latestEventDate.getUTCFullYear()
          && d.getUTCMonth() === latestEventDate.getUTCMonth()
      })
      .map((e) => new Date(e.startDatetime).toISOString().slice(0, 10))
  )

  const avgSeverity =
    recentWindow.length > 0
      ? recentWindow.reduce((sum, e) => sum + (e.severity ?? 0), 0) / recentWindow.length
      : 0

  const riskLevel =
    recentWindow.length >= 8 || avgSeverity >= 7
      ? 'high'
      : recentWindow.length >= 4 || avgSeverity >= 5
        ? 'medium'
        : 'low'

  return {
    recentEpisodes: recentWindow.length,
    migraineDays: migraineDaySet.size,
    riskLevel,
  }
}

/** GET /api/patients/[id] – single patient with full relations (for doctor detail view) */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, ['ADMIN', 'DOCTOR'])
  if (!auth.authorized) return auth.response!

  const { id: patientId } = await params
  if (!patientId) {
    return NextResponse.json({ error: 'Patient ID required' }, { status: 400 })
  }

  if (auth.user?.role === 'DOCTOR') {
    try {
      const doctorUserId = await getDoctorUserId(auth.user)
      if (!doctorUserId) {
        return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
      }
      const doctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId: doctorUserId },
      })
      if (!doctorProfile) {
        return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
      }

      const link = await prisma.patientDoctorLink.findFirst({
        where: {
          doctorId: doctorProfile.id,
          patientId,
          linkStatus: 'ACTIVE',
        },
      })
      if (!link) {
        return NextResponse.json({ error: 'Patient not found or access denied' }, { status: 404 })
      }

      const patient = await prisma.patientProfile.findUnique({
        where: { id: patientId },
        include: {
          migraineEvents: { orderBy: { startDatetime: 'desc' }, take: 50 },
          medicationGroups: { where: { doctorId: doctorProfile.id } },
          medicationLogs: { orderBy: { datetimeTaken: 'desc' }, take: 30 },
          appointments: {
            where: { doctorId: doctorProfile.id },
            orderBy: { appointmentDate: 'desc' },
            take: 20,
            include: {
              doctor: { select: { name: true } },
              clinicalNotes: {
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: { doctor: { select: { name: true } } },
              },
              communications: {
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: { doctor: { select: { name: true } } },
              },
              files: {
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: { doctor: { select: { name: true } } },
              },
            },
          },
        },
      })

      if (!patient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
      }

      const [unlinkedNotesRaw, unlinkedCommunicationsRaw] = await Promise.all([
        prisma.clinicalNote.findMany({
          where: { patientId, doctorId: doctorProfile.id, appointmentId: null },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { doctor: { select: { name: true } } },
        }),
        prisma.communication.findMany({
          where: { patientId, doctorId: doctorProfile.id, appointmentId: null },
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { doctor: { select: { name: true } } },
        }),
      ])

      const now = new Date()
      const appointments = patient.appointments || []
      const nextAppt = appointments.find((a) => new Date(a.appointmentDate) >= now && a.status !== 'CANCELLED')
      const lastAppt = appointments.find((a) => a.status === 'COMPLETED')
      const stats = computeMigraineStats(patient.migraineEvents || [])
      const groups = patient.medicationGroups || []
      const adherence =
        groups.length && groups.some((g) => g.adherenceRate != null)
          ? Math.round(groups.reduce((s, g) => s + (g.adherenceRate ?? 0), 0) / groups.length)
          : null
      const currentMeds = groups.flatMap((g) => g.medications ?? [])
      const age = patient.dob
        ? Math.floor((now.getTime() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null

      const profile = {
        id: patient.id,
        name: patient.name,
        age: age ?? undefined,
        gender: patient.gender ?? undefined,
        condition: patient.condition ?? undefined,
        phone: patient.phone ?? undefined,
        email: patient.email ?? undefined,
        address: patient.address ?? undefined,
        riskLevel: stats.riskLevel,
        lastVisit: lastAppt ? formatDate(lastAppt.appointmentDate) : undefined,
        nextAppointment: nextAppt ? formatDate(nextAppt.appointmentDate) : undefined,
        migraineDays: stats.migraineDays,
        adherence: adherence ?? undefined,
        triggers: [] as string[],
        currentMeds: currentMeds.slice(0, 10),
        recentEpisodes: stats.recentEpisodes,
      }

      const episodeHistory = (patient.migraineEvents || []).map((e) => {
        const triggers = e.perceivedTriggers
          ? e.perceivedTriggers.split(',').map((s) => s.trim()).filter(Boolean)
          : []
        return {
          date: formatDate(e.startDatetime),
          severity: severityLabel(e.severity),
          duration: e.duration ?? '—',
          triggers,
          mostIntenseSymptoms: e.detectedSymptoms ?? [],
          medicationsTakenDuringPeriod: splitMedicationList(e.medicationsDuringEpisode),
          notes: e.episodeNotes ?? undefined,
        }
      })

      const medicationGroups = groups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description ?? null,
        groupType: g.groupType,
        medications: g.medications ?? [],
        medicationSchedule: g.medicationSchedule ?? null,
        isActive: g.isActive,
      }))

      const medications = (patient.medicationLogs || []).slice(0, 10).map((log, idx) => ({
        name: log.medicationName,
        frequency: log.frequency ?? 'As needed',
        adherence: Math.round(log.adherenceRate ?? 0),
        lastTaken: formatDate(log.datetimeTaken),
        groupId: idx + 1,
      }))
      if (medications.length === 0 && groups.length > 0) {
        groups.forEach((g, i) => {
          medications.push({
            name: (g.medications ?? [])[0] ?? g.name,
            frequency: 'As prescribed',
            adherence: Math.round(g.adherenceRate ?? 0),
            lastTaken: formatDate(g.updatedAt),
            groupId: i + 1,
          })
        })
      }

      const appointmentsList = (patient.appointments || []).map((a) => ({
        id: a.id,
        date: formatDate(a.appointmentDate),
        type: a.appointmentType,
        doctor: a.doctor?.name ?? 'Doctor',
        status: a.status,
        patientPresent: a.patientPresent,
        visitNotes: a.notes ?? null,
        clinicalNotes: (a.clinicalNotes || []).map((n) => ({
          id: n.id,
          date: formatDate(n.createdAt),
          note: n.noteContent,
          author: n.doctor?.name ?? 'Doctor',
        })),
        communications: (a.communications || []).map((c) => ({
          id: c.id,
          date: formatDate(c.createdAt),
          type: c.communicationType,
          message: c.message,
          channel: c.channel,
          author: c.doctor?.name ?? '—',
        })),
        files: (a.files || []).map((f) => ({
          id: f.id,
          title: f.title,
          fileUrl: f.fileUrl,
          fileName: f.fileName,
          createdAt: f.createdAt.toISOString(),
          uploadedBy: f.doctor?.name ?? 'Doctor',
        })),
      }))

      const unlinkedNotes = unlinkedNotesRaw.map((n) => ({
        id: n.id,
        date: formatDate(n.createdAt),
        note: n.noteContent,
        author: n.doctor?.name ?? 'Doctor',
      }))

      const unlinkedCommunications = unlinkedCommunicationsRaw.map((c) => ({
        id: c.id,
        date: formatDate(c.createdAt),
        type: c.communicationType,
        message: c.message,
        channel: c.channel,
        author: c.doctor?.name ?? '—',
      }))

      return NextResponse.json({
        profile,
        episodeHistory,
        medications,
        medicationGroups,
        appointments: appointmentsList,
        unlinkedNotes,
        unlinkedCommunications,
      })
    } catch (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
