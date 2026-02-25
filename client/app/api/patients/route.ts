import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'

/** GET /api/patients – list patients linked to the current doctor (with computed list fields) */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'DOCTOR'])
  if (!auth.authorized) return auth.response!

  if (auth.user?.role === 'DOCTOR') {
    try {
      const doctorProfile = await prisma.doctorProfile.findUnique({
        where: { userId: auth.user.userId },
      })
      if (!doctorProfile) {
        return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
      }

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const now = new Date()

      const links = await prisma.patientDoctorLink.findMany({
        where: {
          doctorId: doctorProfile.id,
          linkStatus: 'ACTIVE',
        },
        include: {
          patient: {
            include: {
              appointments: {
                where: { doctorId: doctorProfile.id },
                orderBy: { appointmentDate: 'desc' },
                take: 5,
              },
              migraineEvents: {
                where: { startDatetime: { gte: thirtyDaysAgo } },
              },
              medicationGroups: {
                where: { doctorId: doctorProfile.id, isActive: true },
                take: 5,
              },
            },
          },
        },
      })

      const patients = links.map((link: { patient: { id: string; name: string; dob: Date | null; gender: string | null; condition: string | null; phone: string | null; email: string | null; address: string | null; appointments?: Array<{ appointmentDate: Date; status: string }>; migraineEvents?: unknown[]; medicationGroups?: Array<{ adherenceRate: number | null; medications?: string[] }> } }) => {
        const p = link.patient
        const appointments = p.appointments || []
        const nextAppt = appointments.find((a: { appointmentDate: Date; status: string }) => new Date(a.appointmentDate) >= now && a.status !== 'CANCELLED')
        const lastAppt = appointments.find((a: { status: string }) => a.status === 'COMPLETED')
        const recentEpisodes = p.migraineEvents?.length ?? 0
        const riskLevel =
          recentEpisodes > 6 ? 'high' : recentEpisodes > 3 ? 'medium' : 'low'
        const grps = p.medicationGroups ?? []
        const adherence =
          grps.length && grps.some((g: { adherenceRate: number | null }) => g.adherenceRate != null)
            ? Math.round(
                grps.reduce((s: number, g: { adherenceRate: number | null }) => s + (g.adherenceRate ?? 0), 0) /
                  grps.length
              )
            : null
        const currentMeds = grps.flatMap((g: { medications?: string[] }) => g.medications ?? [])
        const age = p.dob ? Math.floor((now.getTime() - new Date(p.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null

        return {
          id: p.id,
          name: p.name,
          age: age ?? undefined,
          gender: p.gender ?? undefined,
          condition: p.condition ?? undefined,
          phone: p.phone ?? undefined,
          email: p.email ?? undefined,
          address: p.address ?? undefined,
          riskLevel,
          lastVisit: lastAppt ? formatDate(lastAppt.appointmentDate) : undefined,
          nextAppointment: nextAppt ? formatDate(nextAppt.appointmentDate) : undefined,
          migraineDays: recentEpisodes,
          adherence: adherence ?? undefined,
          triggers: [] as string[],
          currentMeds: currentMeds.slice(0, 5),
          recentEpisodes,
        }
      })

      return NextResponse.json(patients)
    } catch (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

function formatDate(d: Date): string {
  const x = new Date(d)
  return x.toISOString().slice(0, 10)
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN'])
  if (!auth.authorized) return auth.response!
  const { baseCrudHandler } = await import('../baseRoute/route')
  return baseCrudHandler('patientProfile', req)
}

export async function PUT(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'PATIENT'])
  if (!auth.authorized) return auth.response!
  const { baseCrudHandler } = await import('../baseRoute/route')
  return baseCrudHandler('patientProfile', req)
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'PATIENT'])
  if (!auth.authorized) return auth.response!
  const { baseCrudHandler } = await import('../baseRoute/route')
  return baseCrudHandler('patientProfile', req)
}

export async function DELETE(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN'])
  if (!auth.authorized) return auth.response!
  const { baseCrudHandler } = await import('../baseRoute/route')
  return baseCrudHandler('patientProfile', req)
}
