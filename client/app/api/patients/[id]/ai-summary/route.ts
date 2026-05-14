import { NextRequest, NextResponse } from 'next/server'
import { LinkStatus } from '@prisma/client'
import { requireRole } from '@/lib/auth/middleware'
import { getDoctorUserId } from '@/lib/auth/getDoctorUserId'
import { prisma } from '@/lib/prisma'
import {
  refreshDoctorPatientSummary,
  type SerializedDoctorPatientSummary,
} from '@/lib/ai/refreshDoctorPatientSummary'

function serializeFromDb(row: {
  id: string
  generatedDate: Date
  summaryType: import('@prisma/client').SummaryType
  structuredSummaryText: string
  treatmentOutcomeAnalysis: string
  avgFrequency: number
  avgSeverity: number
  adherenceScore: number
}): SerializedDoctorPatientSummary {
  return {
    id: row.id,
    generatedDate: row.generatedDate.toISOString(),
    summaryType: row.summaryType,
    structuredSummaryText: row.structuredSummaryText,
    treatmentOutcomeAnalysis: row.treatmentOutcomeAnalysis,
    avgFrequency: row.avgFrequency,
    avgSeverity: row.avgSeverity,
    adherenceScore: row.adherenceScore,
  }
}

async function assertDoctorAccess(
  role: string,
  doctorProfileId: string | null,
  patientId: string
): Promise<{ ok: true } | { ok: false; status: number; body: object }> {
  if (role === 'ADMIN') return { ok: true }
  if (!doctorProfileId) {
    return { ok: false, status: 403, body: { error: 'Doctor profile required' } }
  }
  const link = await prisma.patientDoctorLink.findUnique({
    where: {
      doctorId_patientId: { doctorId: doctorProfileId, patientId },
    },
  })
  if (!link || link.linkStatus !== LinkStatus.ACTIVE) {
    return { ok: false, status: 403, body: { error: 'No active link with this patient' } }
  }
  return { ok: true }
}

async function resolveDoctorIdForAdminWrite(patientId: string): Promise<string | null> {
  const link = await prisma.patientDoctorLink.findFirst({
    where: { patientId, linkStatus: LinkStatus.ACTIVE },
    orderBy: { createdAt: 'asc' },
    select: { doctorId: true },
  })
  return link?.doctorId ?? null
}

/** GET /api/patients/[id]/ai-summary — latest summary for this patient (doctor-scoped when role is DOCTOR) */
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

  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    select: { id: true },
  })
  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
  }

  let doctorProfileId: string | null = null
  if (auth.user!.role === 'DOCTOR') {
    const doctorUserId = await getDoctorUserId(auth.user!)
    if (!doctorUserId) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }
    const doc = await prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
      select: { id: true },
    })
    if (!doc) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }
    doctorProfileId = doc.id
    const gate = await assertDoctorAccess(auth.user!.role, doctorProfileId, patientId)
    if (!gate.ok) return NextResponse.json(gate.body, { status: gate.status })
  }

  try {
    const where =
      auth.user!.role === 'DOCTOR' && doctorProfileId
        ? { patientId, doctorId: doctorProfileId }
        : { patientId }

    const row = await prisma.doctorPatientSummary.findFirst({
      where,
      orderBy: { generatedDate: 'desc' },
    })
    return NextResponse.json({ summary: row ? serializeFromDb(row) : null })
  } catch (e) {
    console.error('GET /api/patients/[id]/ai-summary error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST /api/patients/[id]/ai-summary — regenerate and persist */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(req, ['ADMIN', 'DOCTOR'])
  if (!auth.authorized) return auth.response!

  const { id: patientId } = await params
  if (!patientId) {
    return NextResponse.json({ error: 'Patient ID required' }, { status: 400 })
  }

  const patient = await prisma.patientProfile.findUnique({
    where: { id: patientId },
    select: { id: true },
  })
  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
  }

  let doctorProfileId: string | null = null
  if (auth.user!.role === 'DOCTOR') {
    const doctorUserId = await getDoctorUserId(auth.user!)
    if (!doctorUserId) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }
    const doc = await prisma.doctorProfile.findUnique({
      where: { userId: doctorUserId },
      select: { id: true },
    })
    if (!doc) {
      return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })
    }
    doctorProfileId = doc.id
    const gate = await assertDoctorAccess(auth.user!.role, doctorProfileId, patientId)
    if (!gate.ok) return NextResponse.json(gate.body, { status: gate.status })
  }

  try {
    const writeDoctorId =
      auth.user!.role === 'DOCTOR' && doctorProfileId
        ? doctorProfileId
        : await resolveDoctorIdForAdminWrite(patientId)

    const result = await refreshDoctorPatientSummary(patientId, writeDoctorId)
    if (!result.saved) {
      return NextResponse.json(
        {
          error: 'Cannot persist summary',
          message: 'Patient has no active doctor link; create a link before saving AI summaries.',
        },
        { status: 409 }
      )
    }
    return NextResponse.json({ saved: true, summary: result.summary })
  } catch (e) {
    console.error('POST /api/patients/[id]/ai-summary error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
