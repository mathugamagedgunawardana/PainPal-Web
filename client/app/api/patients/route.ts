import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { getDoctorUserId } from '@/lib/auth/getDoctorUserId'
import { prisma } from '@/lib/prisma'
import { loadMigraineStatsByPatientId } from '@/lib/doctor/patientListStats'
import { privateApiCacheHeaders } from '@/lib/http/cacheHeaders'

const DOCTOR_404 = { error: 'Doctor profile not found', message: 'Log in with a registered doctor account (e.g. dr.johnson@clinic.example.com / SeedPassword123!) to view patients.' } as const

/** GET /api/patients – lightweight list for doctor sidebar (no nested migraine event payloads). */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'DOCTOR'])
  if (!auth.authorized) return auth.response!

  if (auth.user?.role === 'DOCTOR') {
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

      const links = await prisma.patientDoctorLink.findMany({
        where: {
          doctorId: doctorProfile.id,
          linkStatus: 'ACTIVE',
        },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              dob: true,
              gender: true,
              condition: true,
              phone: true,
              email: true,
              address: true,
              appointments: {
                where: { doctorId: doctorProfile.id },
                select: {
                  appointmentDate: true,
                  status: true,
                },
              },
              medicationGroups: {
                where: { doctorId: doctorProfile.id, isActive: true },
                select: {
                  adherenceRate: true,
                  medications: true,
                },
              },
            },
          },
        },
      })

      const patientIds = links.map((l) => l.patient.id)
      const statsByPatient = await loadMigraineStatsByPatientId(patientIds)

      const patients = links.map((link) => {
        const p = link.patient
        const appointments = [...(p.appointments || [])].sort(
          (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
        )
        const nextAppt = appointments.find((a) => new Date(a.appointmentDate) >= now && a.status !== 'CANCELLED')
        const lastAppt = appointments.find((a) => a.status === 'COMPLETED')
        const stats = statsByPatient.get(p.id) ?? {
          recentEpisodes: 0,
          migraineDays: 0,
          riskLevel: 'low' as const,
        }
        const grps = p.medicationGroups ?? []
        const adherence =
          grps.length && grps.some((g) => g.adherenceRate != null)
            ? Math.round(
                grps.reduce((s, g) => s + (g.adherenceRate ?? 0), 0) / grps.length
              )
            : null
        const currentMeds = grps.flatMap((g) => g.medications ?? [])
        const age = p.dob
          ? Math.floor((now.getTime() - new Date(p.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : null

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

      return NextResponse.json(patients, { headers: privateApiCacheHeaders() })
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

/** POST /api/patients – ADMIN: generic CRUD; DOCTOR: create patient and link to care list. */
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'DOCTOR'])
  if (!auth.authorized) return auth.response!

  if (auth.user?.role === 'ADMIN') {
    const { baseCrudHandler } = await import('../baseRoute/baseCrud')
    return baseCrudHandler('patientProfile', req)
  }

  try {
    const body = (await req.json()) as Record<string, unknown>
    const { createPatientForDoctor } = await import('@/lib/doctor/createPatientForDoctor')
    const result = await createPatientForDoctor(auth.user!, {
      name: String(body.name ?? ''),
      email: String(body.email ?? ''),
      password: String(body.password ?? ''),
      dob: String(body.dob ?? body.dateOfBirth ?? ''),
      gender: body.gender != null ? String(body.gender) : null,
      phone: body.phone != null ? String(body.phone) : null,
      address: body.address != null ? String(body.address) : null,
      condition: body.condition != null ? String(body.condition) : null,
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, message: result.message },
        { status: result.status }
      )
    }

    return NextResponse.json(result.patient, { status: 201 })
  } catch (error) {
    console.error('POST /api/patients error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: 'Internal server error', message }, { status: 500 })
  }
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
