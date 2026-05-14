import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { getDoctorUserId } from '@/lib/auth/getDoctorUserId'
import { prisma } from '@/lib/prisma'
import { computeMigraineStats } from '@/lib/doctor/migraineStats'

const DOCTOR_404 = { error: 'Doctor profile not found', message: 'Log in with a registered doctor account (e.g. dr.johnson@clinic.example.com / SeedPassword123!) to view patients.' } as const

/** GET /api/patients – list patients linked to the current doctor (with computed list fields) */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'DOCTOR'])
  if (!auth.authorized) return auth.response!

  if (auth.user?.role === 'DOCTOR') {
    try {
      // Resolve to MongoDB User id (JWT may have "doctor-001" etc – never pass non-ObjectId to Prisma)
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

      // MongoDB-compatible query: no orderBy/take inside nested include
      const links = await prisma.patientDoctorLink.findMany({
        where: {
          doctorId: doctorProfile.id,
          linkStatus: 'ACTIVE',
        },
        include: {
          patient: {
            include: {
              appointments: { where: { doctorId: doctorProfile.id } },
              migraineEvents: { orderBy: { startDatetime: 'desc' }, take: 120 },
              medicationGroups: { where: { doctorId: doctorProfile.id, isActive: true } },
            },
          },
        },
      })

      const patients = links.map((link) => {
        const p = link.patient
        const appointments = [...(p.appointments || [])].sort(
          (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
        )
        const nextAppt = appointments.find((a) => new Date(a.appointmentDate) >= now && a.status !== 'CANCELLED')
        const lastAppt = appointments.find((a) => a.status === 'COMPLETED')
        const stats = computeMigraineStats(p.migraineEvents ?? [])
        const grps = p.medicationGroups ?? []
        const adherence =
          grps.length && grps.some((g) => g.adherenceRate != null)
            ? Math.round(
                grps.reduce((s, g) => s + (g.adherenceRate ?? 0), 0) / grps.length
              )
            : null
        const currentMeds = grps.flatMap((g) => g.medications ?? [])
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
          riskLevel: stats.riskLevel,
          lastVisit: lastAppt ? formatDate(lastAppt.appointmentDate) : undefined,
          nextAppointment: nextAppt ? formatDate(nextAppt.appointmentDate) : undefined,
          migraineDays: stats.migraineDays,
          adherence: adherence ?? undefined,
          triggers: [] as string[],
          currentMeds: currentMeds.slice(0, 5),
          recentEpisodes: stats.recentEpisodes,
        }
      })

      return NextResponse.json(patients)
    } catch (error) {
      console.error('GET /api/patients error:', error)
      const message = error instanceof Error ? error.message : 'Internal server error'
      return NextResponse.json(
        { error: 'Internal server error', message },
        { status: 500 }
      )
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
  const { baseCrudHandler } = await import('../baseRoute/baseCrud')
  return baseCrudHandler('patientProfile', req)
}

export async function PUT(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'PATIENT'])
  if (!auth.authorized) return auth.response!
  const { baseCrudHandler } = await import('../baseRoute/baseCrud')
  return baseCrudHandler('patientProfile', req)
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'PATIENT'])
  if (!auth.authorized) return auth.response!
  const { baseCrudHandler } = await import('../baseRoute/baseCrud')
  return baseCrudHandler('patientProfile', req)
}

export async function DELETE(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN'])
  if (!auth.authorized) return auth.response!
  const { baseCrudHandler } = await import('../baseRoute/baseCrud')
  return baseCrudHandler('patientProfile', req)
}
