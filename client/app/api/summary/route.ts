import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { prisma } from '@/lib/prisma'
import { getPatientProfileForUser } from '@/lib/patient/getPatientProfileForUser'
import { MigraineTypeClassification } from '@prisma/client'

type FlutterBody = {
  Duration?: number
  Frequency?: number
  Location?: string
  Character?: string
  Intensity?: number
  Nausea?: number
  Vomit?: number
  Phonophobia?: number
  Photophobia?: number
  Visual?: number
  Sensory?: number
  Dysphasia?: number
  Dysarthria?: number
  Vertigo?: number
  Tinnitus?: number
  Hypoacusis?: number
  Diplopia?: number
  Defect?: number
  Ataxia?: number
  Conscience?: number
  Paresthesia?: number
  patient_id?: string
  attack_id?: string
  age?: number
  timestamp?: string
}

const symptomKeys: Array<[keyof FlutterBody, string]> = [
  ['Nausea', 'Nausea'],
  ['Vomit', 'Vomit'],
  ['Phonophobia', 'Phonophobia'],
  ['Photophobia', 'Photophobia'],
  ['Visual', 'Visual aura'],
  ['Sensory', 'Sensory'],
  ['Dysphasia', 'Dysphasia'],
  ['Dysarthria', 'Dysarthria'],
  ['Vertigo', 'Vertigo'],
  ['Tinnitus', 'Tinnitus'],
  ['Hypoacusis', 'Hypoacusis'],
  ['Diplopia', 'Diplopia'],
  ['Defect', 'Visual field defect'],
  ['Ataxia', 'Ataxia'],
  ['Conscience', 'Altered consciousness'],
  ['Paresthesia', 'Paresthesia'],
]

function buildDetectedSymptoms(b: FlutterBody): string[] {
  const out: string[] = []
  for (const [key, label] of symptomKeys) {
    const v = b[key]
    if (typeof v === 'number' && v >= 1) {
      out.push(label)
    }
  }
  return out
}

function predictType(b: FlutterBody): MigraineTypeClassification {
  const visual = (b.Visual ?? 0) >= 1
  const sensory = (b.Sensory ?? 0) >= 1
  if (visual || sensory) {
    return MigraineTypeClassification.MIGRAINE_WITH_AURA
  }
  return MigraineTypeClassification.MIGRAINE_WITHOUT_AURA
}

/**
 * POST /api/summary — Flutter “Log attack” flow: persists MigraineEvent in MongoDB and returns the legacy ML-shaped JSON.
 */
export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['PATIENT'])
  if (!auth.authorized) return auth.response!

  const patient = await getPatientProfileForUser(auth.user!)
  if (!patient) {
    return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 })
  }

  let body: FlutterBody
  try {
    body = (await req.json()) as FlutterBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const durationH = Math.max(0, Math.floor(body.Duration ?? 0))
  const frequency = Math.max(0, Math.floor(body.Frequency ?? 0))
  const intensity = Math.min(10, Math.max(1, Math.floor(body.Intensity ?? 5)))
  const start = body.timestamp ? new Date(body.timestamp) : new Date()
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json({ error: 'Invalid timestamp' }, { status: 400 })
  }

  const detected = buildDetectedSymptoms(body)
  const migraineType = predictType(body)

  const episodeNotes = JSON.stringify({
    source: 'painpal-flutter',
    location: body.Location ?? '',
    character: body.Character ?? '',
    attack_id: body.attack_id ?? null,
    age: body.age ?? null,
  })

  try {
    await prisma.migraineEvent.create({
      data: {
        patientId: patient.id,
        startDatetime: start,
        severity: intensity,
        duration: durationH > 0 ? `${durationH} hours` : undefined,
        episodeNotes,
        detectedSymptoms: detected,
        perceivedTriggers: undefined,
        trainingAge: body.age ?? undefined,
        trainingDuration: durationH || undefined,
        trainingFrequency: frequency || undefined,
        nausea: body.Nausea ?? undefined,
        vomit: body.Vomit ?? undefined,
        phonophobia: body.Phonophobia ?? undefined,
        photophobia: body.Photophobia ?? undefined,
        visual: body.Visual ?? undefined,
        sensory: body.Sensory ?? undefined,
        dysphasia: body.Dysphasia ?? undefined,
        dysarthria: body.Dysarthria ?? undefined,
        vertigo: body.Vertigo ?? undefined,
        tinnitus: body.Tinnitus ?? undefined,
        hypoacusis: body.Hypoacusis ?? undefined,
        diplopia: body.Diplopia ?? undefined,
        defect: body.Defect ?? undefined,
        ataxia: body.Ataxia ?? undefined,
        conscience: body.Conscience ?? undefined,
        paresthesia: body.Paresthesia ?? undefined,
        migraineType,
        migraineTypeConfidence: 72,
      },
    })
  } catch (e) {
    console.error('POST /api/summary create error:', e)
    return NextResponse.json({ error: 'Failed to save migraine event' }, { status: 500 })
  }

  const summary = `Saved to your clinic record. Severity ${intensity}/10, duration ${durationH || '—'}h, location ${body.Location ?? '—'}.`

  return NextResponse.json({
    summary,
    predicted_migraine_type: migraineType,
    symptoms_received: detected,
  })
}
