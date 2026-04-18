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
            include: { doctor: { select: { name: true } } },
          },
          clinicalNotes: {
            where: { doctorId: doctorProfile.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
            include: { doctor: { select: { name: true } } },
          },
          communications: {
            where: { doctorId: doctorProfile.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      })

      if (!patient) {
        return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
      }

      const now = new Date()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const appointments = patient.appointments || []
      const nextAppt = appointments.find((a) => new Date(a.appointmentDate) >= now && a.status !== 'CANCELLED')
      const lastAppt = appointments.find((a) => a.status === 'COMPLETED')
      const recentEpisodes = (patient.migraineEvents || []).filter((e) => new Date(e.startDatetime) >= thirtyDaysAgo).length
      const riskLevel = recentEpisodes > 6 ? 'high' : recentEpisodes > 3 ? 'medium' : 'low'
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
        riskLevel,
        lastVisit: lastAppt ? formatDate(lastAppt.appointmentDate) : undefined,
        nextAppointment: nextAppt ? formatDate(nextAppt.appointmentDate) : undefined,
        migraineDays: recentEpisodes,
        adherence: adherence ?? undefined,
        triggers: [] as string[],
        currentMeds: currentMeds.slice(0, 10),
        recentEpisodes,
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
        date: formatDate(a.appointmentDate),
        type: a.appointmentType,
        doctor: a.doctor?.name ?? 'Doctor',
        status: a.status,
      }))

      const notes = (patient.clinicalNotes || []).map((n) => ({
        date: formatDate(n.createdAt),
        note: n.noteContent,
        author: n.doctor?.name ?? 'Doctor',
      }))

      const communications = (patient.communications || []).map((c) => ({
        date: formatDate(c.createdAt),
        type: c.communicationType,
        message: c.message,
        channel: c.channel,
      }))

      return NextResponse.json({
        profile,
        episodeHistory,
        medications,
        appointments: appointmentsList,
        notes,
        communications,
      })
    } catch (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
