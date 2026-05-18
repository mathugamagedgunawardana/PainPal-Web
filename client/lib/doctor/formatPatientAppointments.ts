import type { Prisma } from '@prisma/client'

function formatDate(d: Date): string {
  return new Date(d).toISOString().slice(0, 10)
}

const appointmentInclude = {
  doctor: { select: { name: true } },
  clinicalNotes: {
    orderBy: { createdAt: 'desc' as const },
    take: 10,
    include: { doctor: { select: { name: true } } },
  },
  communications: {
    orderBy: { createdAt: 'desc' as const },
    take: 10,
    include: { doctor: { select: { name: true } } },
  },
  files: {
    orderBy: { createdAt: 'desc' as const },
    take: 10,
    include: { doctor: { select: { name: true } } },
  },
} satisfies Prisma.AppointmentInclude

export type AppointmentWithRelations = Prisma.AppointmentGetPayload<{
  include: typeof appointmentInclude
}>

export function mapAppointmentsList(appointments: AppointmentWithRelations[]) {
  return appointments.map((a) => ({
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
}

export { appointmentInclude, formatDate }
