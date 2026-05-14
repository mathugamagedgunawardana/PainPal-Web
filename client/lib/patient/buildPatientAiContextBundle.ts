import { prisma } from '@/lib/prisma'

const MAX_CONTEXT_CHARS = 95_000

function clip(s: string | null | undefined, max: number): string | null {
  if (s == null) return null
  if (s.length <= max) return s
  return `${s.slice(0, max)}…`
}

/**
 * Loads patient-scoped rows matching Prisma models (no credentials / no other patients).
 * Serialized for Gemini / in-app AI context.
 */
export async function buildPatientAiContextText(patientId: string): Promise<{
  text: string
  truncated: boolean
}> {
  const [
    patientProfile,
    doctorLinks,
    migraineEvents,
    medicationLogs,
    medicationGroups,
    doctorPatientSummaries,
    aiDiagnosticInsights,
    appointments,
    clinicalNotes,
    communications,
    patientMriScans,
    conversations,
  ] = await Promise.all([
    prisma.patientProfile.findUnique({
      where: { id: patientId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.patientDoctorLink.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            specialization: true,
            clinic: { select: { id: true, name: true, address: true, ehrSystemEndpoint: true } },
          },
        },
      },
    }),
    prisma.migraineEvent.findMany({
      where: { patientId },
      orderBy: { startDatetime: 'desc' },
      take: 400,
      include: {
        medicationGroup: { select: { id: true, name: true, groupType: true } },
      },
    }),
    prisma.medicationLog.findMany({
      where: { patientId },
      orderBy: { datetimeTaken: 'desc' },
      take: 600,
      include: {
        medicationGroup: { select: { id: true, name: true, groupType: true } },
      },
    }),
    prisma.medicationGroup.findMany({
      where: { patientId },
      orderBy: { updatedAt: 'desc' },
      take: 80,
      include: {
        doctor: { select: { id: true, name: true, specialization: true } },
      },
    }),
    prisma.doctorPatientSummary.findMany({
      where: { patientId },
      orderBy: { generatedDate: 'desc' },
      take: 36,
      include: {
        doctor: { select: { id: true, name: true, specialization: true } },
      },
    }),
    prisma.aIDiagnosticInsight.findMany({
      where: { patientId },
      orderBy: { createdDatetime: 'desc' },
      take: 80,
    }),
    prisma.appointment.findMany({
      where: { patientId },
      orderBy: { appointmentDate: 'desc' },
      take: 120,
      include: {
        doctor: { select: { id: true, name: true, specialization: true } },
        files: { orderBy: { createdAt: 'desc' }, take: 40 },
      },
    }),
    prisma.clinicalNote.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 120,
      include: {
        doctor: { select: { id: true, name: true, specialization: true } },
        appointment: {
          select: { id: true, appointmentDate: true, appointmentType: true, status: true },
        },
      },
    }),
    prisma.communication.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 120,
      include: {
        doctor: { select: { id: true, name: true } },
        appointment: {
          select: { id: true, appointmentDate: true, appointmentType: true },
        },
      },
    }),
    prisma.patientMriScan.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.conversation.findMany({
      where: { patientId },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      include: {
        doctor: { select: { id: true, name: true, specialization: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 150,
          select: {
            id: true,
            senderRole: true,
            senderUserId: true,
            content: true,
            createdAt: true,
            readAt: true,
          },
        },
      },
    }),
  ])

  const summariesClipped = doctorPatientSummaries.map((s) => ({
    ...s,
    structuredSummaryText: clip(s.structuredSummaryText, 12_000),
    treatmentOutcomeAnalysis: clip(s.treatmentOutcomeAnalysis, 6_000),
  }))

  const notesClipped = clinicalNotes.map((n) => ({
    ...n,
    noteContent: clip(n.noteContent, 8_000),
  }))

  const commsClipped = communications.map((c) => ({
    ...c,
    message: clip(c.message, 4_000),
  }))

  const convosMapped = conversations.map((c) => ({
    id: c.id,
    doctorId: c.doctorId,
    patientId: c.patientId,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    doctor: c.doctor,
    messages: [...c.messages]
      .reverse()
      .map((m) => ({
        ...m,
        content: clip(m.content, 4_000) ?? '',
      })),
  }))

  const bundle = {
    exportedAt: new Date().toISOString(),
    patientProfile,
    patientDoctorLinks: doctorLinks,
    migraineEvents,
    medicationLogs,
    medicationGroups,
    doctorPatientSummaries: summariesClipped,
    aiDiagnosticInsights,
    appointments,
    clinicalNotes: notesClipped,
    communications: commsClipped,
    patientMriScans,
    doctorPatientConversations: convosMapped,
  }

  let text = JSON.stringify(bundle, null, 2)
  let truncated = false
  if (text.length > MAX_CONTEXT_CHARS) {
    text = `${text.slice(0, MAX_CONTEXT_CHARS)}\n\n…(export truncated at ${MAX_CONTEXT_CHARS} characters; newest records prioritized in each list.)`
    truncated = true
  }

  return { text, truncated }
}
