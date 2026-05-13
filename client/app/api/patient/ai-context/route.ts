import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { getPatientProfileForUser } from '@/lib/patient/getPatientProfileForUser'
import { buildPatientAiContextText } from '@/lib/patient/buildPatientAiContextBundle'

/**
 * GET /api/patient/ai-context — full patient-scoped Prisma export for in-app AI (PATIENT JWT).
 * Excludes secrets (passwords, tokens). Intended for Gemini system context on the device.
 */
export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['PATIENT'])
  if (!auth.authorized) return auth.response!

  const patient = await getPatientProfileForUser(auth.user!)
  if (!patient) {
    return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
  }

  try {
    const { text, truncated } = await buildPatientAiContextText(patient.id)
    return NextResponse.json({
      contextText: text,
      truncated,
      patientProfileId: patient.id,
    })
  } catch (e) {
    console.error('GET /api/patient/ai-context error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
