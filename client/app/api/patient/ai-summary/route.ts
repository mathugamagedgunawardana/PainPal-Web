import { NextRequest, NextResponse } from 'next/server'
import { LinkStatus } from '@prisma/client'
import { requireRole } from '@/lib/auth/middleware'
import { getPatientUserId } from '@/lib/auth/getPatientUserId'
import { prisma } from '@/lib/prisma'
import { refreshDoctorPatientSummary } from '@/lib/ai/refreshDoctorPatientSummary'

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

async function latestSummaryForPatient(patientProfileId: string): Promise<SerializedDoctorPatientSummary | null> {
  const links = await prisma.patientDoctorLink.findMany({
    where: { patientId: patientProfileId, linkStatus: LinkStatus.ACTIVE },
    select: { doctorId: true },
  })
  const doctorIds = links.map((l) => l.doctorId)
  const row = await prisma.doctorPatientSummary.findFirst({
    where: {
      patientId: patientProfileId,
      ...(doctorIds.length > 0 ? { doctorId: { in: doctorIds } } : {}),
    },
    orderBy: { generatedDate: 'desc' },
  })
  if (!row && doctorIds.length > 0) {
    return null
  }
  if (!row) {
    const anyRow = await prisma.doctorPatientSummary.findFirst({
      where: { patientId: patientProfileId },
      orderBy: { generatedDate: 'desc' },
    })
    return anyRow ? serializeFromDb(anyRow) : null
  }
  return serializeFromDb(row)
}

async function resolveDoctorIdForPatientWrite(patientProfileId: string): Promise<string | null> {
  const link = await prisma.patientDoctorLink.findFirst({
    where: { patientId: patientProfileId, linkStatus: LinkStatus.ACTIVE },
    orderBy: { createdAt: 'asc' },
    select: { doctorId: true },
  })
  return link?.doctorId ?? null
}

/** GET /api/patient/ai-summary — latest stored AI summary for the signed-in patient */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['PATIENT'])
  if (!auth.authorized) return auth.response!

  const patientUserId = await getPatientUserId(auth.user!)
  if (!patientUserId) {
    return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
  }

  const patient = await prisma.patientProfile.findUnique({
    where: { userId: patientUserId },
    select: { id: true },
  })
  if (!patient) {
    return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
  }

  try {
    const summary = await latestSummaryForPatient(patient.id)
    return NextResponse.json({ summary })
  } catch (e) {
    console.error('GET /api/patient/ai-summary error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** POST /api/patient/ai-summary — regenerate; persists when an active doctor link exists */
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['PATIENT'])
  if (!auth.authorized) return auth.response!

  const patientUserId = await getPatientUserId(auth.user!)
  if (!patientUserId) {
    return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
  }

  const patient = await prisma.patientProfile.findUnique({
    where: { userId: patientUserId },
    select: { id: true },
  })
  if (!patient) {
    return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
  }

  try {
    const doctorId = await resolveDoctorIdForPatientWrite(patient.id)
    const result = await refreshDoctorPatientSummary(patient.id, doctorId)
    return NextResponse.json({
      saved: result.saved,
      message: result.saved
        ? undefined
        : 'Summary generated but not saved—link an active care team in the clinic portal to store history.',
      summary: result.summary,
    })
  } catch (e) {
    console.error('POST /api/patient/ai-summary error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
