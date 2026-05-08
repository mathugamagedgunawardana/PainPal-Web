import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth/middleware'
import { getDoctorUserId } from '@/lib/auth/getDoctorUserId'
import { prisma } from '@/lib/prisma'

const TYPE_LABELS: Record<string, string> = {
  MIGRAINE_WITHOUT_AURA: 'Migraine without aura',
  MIGRAINE_WITH_AURA: 'Migraine with aura',
  BRAINSTEM_AURA_MIGRAINE: 'Migraine with brainstem aura',
  HEMIPLEGIC_MIGRAINE: 'Hemiplegic migraine',
  RETINAL_MIGRAINE: 'Retinal migraine',
  CHRONIC_MIGRAINE: 'Chronic migraine',
  MENSTRUAL_MIGRAINE: 'Menstrual migraine',
  VESTIBULAR_MIGRAINE: 'Vestibular migraine',
  STATUS_MIGRAINOSUS: 'Status migrainosus',
  PROBABLE_MIGRAINE: 'Probable migraine',
}

const TYPE_DESCRIPTIONS: Record<string, string> = {
  MIGRAINE_WITHOUT_AURA: 'Typical migraine with moderate to severe headache and sensory sensitivity, without preceding aura.',
  MIGRAINE_WITH_AURA: 'Migraine pattern with reversible aura symptoms such as visual disturbance or tingling before headache.',
  BRAINSTEM_AURA_MIGRAINE: 'Aura-dominant migraine with brainstem-related symptoms such as vertigo, diplopia, or speech changes.',
  HEMIPLEGIC_MIGRAINE: 'Rare migraine subtype that may include temporary one-sided weakness with neurological aura symptoms.',
  RETINAL_MIGRAINE: 'Migraine pattern associated with transient visual disturbance in one eye and headache features.',
  CHRONIC_MIGRAINE: 'High-frequency migraine pattern with headache burden on many days in a month.',
  MENSTRUAL_MIGRAINE: 'Migraine pattern with stronger association to hormonal cycle timing.',
  VESTIBULAR_MIGRAINE: 'Migraine subtype where dizziness, motion sensitivity, or vertigo features are prominent.',
  STATUS_MIGRAINOSUS: 'Prolonged severe migraine episode profile that can persist for an extended duration.',
  PROBABLE_MIGRAINE: 'Migraine-like pattern that fits most, but not all, classic diagnostic features.',
}

type ImpactShape = {
  pain: number
  aura: number
  neuro: number
  frequency: number
  hormonal: number
  vestibular: number
  vision: number
}

type ModelPredictResponse = {
  predicted_type: string[]
  probabilities?: Array<Record<string, number>>
}

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10))
}

function impactFromSignals(symptoms: string[], confidence: number): ImpactShape {
  const joined = symptoms.join(' ').toLowerCase()
  const has = (needle: string) => joined.includes(needle)
  const base = Math.max(25, Math.min(95, confidence))
  return {
    pain: clamp100(base * 0.85 + (has('throb') ? 8 : 0)),
    aura: clamp100(base * 0.5 + (has('aura') || has('visual') ? 20 : 0)),
    neuro: clamp100(base * 0.45 + (has('speech') || has('paresthesia') || has('vertigo') ? 20 : 0)),
    frequency: clamp100(base * 0.4 + (has('chronic') ? 25 : 0)),
    hormonal: clamp100(base * 0.2 + (has('menstrual') ? 35 : 0)),
    vestibular: clamp100(base * 0.25 + (has('vertigo') || has('tinnitus') ? 28 : 0)),
    vision: clamp100(base * 0.3 + (has('visual') || has('photophobia') || has('retinal') ? 25 : 0)),
  }
}

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase().replace(/[_-]+/g, ' ')
}

function enumFromModelLabel(label: string): string | null {
  const normalized = normalizeLabel(label)
  for (const [key, value] of Object.entries(TYPE_LABELS)) {
    if (normalizeLabel(value) === normalized) return key
  }
  return null
}

function labelFromEnum(type: string | null | undefined): string {
  if (!type) return ''
  return TYPE_LABELS[type] ?? type
}

function descriptionFromEnum(type: string | null | undefined): string {
  if (!type) return 'No specific migraine subtype description is available.'
  return TYPE_DESCRIPTIONS[type] ?? `Predicted profile is most consistent with ${labelFromEnum(type)}.`
}

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
    const doctorUserId = await getDoctorUserId(auth.user)
    if (!doctorUserId) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })

    const doctorProfile = await prisma.doctorProfile.findUnique({ where: { userId: doctorUserId } })
    if (!doctorProfile) return NextResponse.json({ error: 'Doctor profile not found' }, { status: 404 })

    const link = await prisma.patientDoctorLink.findFirst({
      where: { doctorId: doctorProfile.id, patientId, linkStatus: 'ACTIVE' },
    })
    if (!link) return NextResponse.json({ error: 'Patient not found or access denied' }, { status: 404 })
  }

  const [recentInsights, typeCounts] = await Promise.all([
    prisma.aIDiagnosticInsight.findMany({
      where: { patientId, migraineType: { not: null } },
      orderBy: { createdDatetime: 'desc' },
      take: 25,
    }),
    prisma.migraineEvent.groupBy({
      by: ['migraineType'],
      where: { patientId, migraineType: { not: null } },
      _count: { _all: true },
    }),
  ])

  // If there are no saved predictions yet, infer directly from this patient's seeded/training events.
  // This gives per-patient results immediately without waiting for background sync persistence.
  if (recentInsights.length === 0 && typeCounts.length === 0) {
    const events = await prisma.migraineEvent.findMany({
      where: { patientId },
      orderBy: { startDatetime: 'desc' },
      take: 120,
      select: {
        detectedSymptoms: true,
        trainingAge: true,
        trainingDuration: true,
        trainingFrequency: true,
        trainingLocation: true,
        trainingCharacter: true,
        trainingIntensity: true,
        nausea: true,
        vomit: true,
        phonophobia: true,
        photophobia: true,
        visual: true,
        sensory: true,
        dysphasia: true,
        dysarthria: true,
        vertigo: true,
        tinnitus: true,
        hypoacusis: true,
        diplopia: true,
        defect: true,
        ataxia: true,
        conscience: true,
        paresthesia: true,
        dpf: true,
        studyType: true,
      },
    })

    if (events.length > 0) {
      const records = events.map((e) => ({
        Age: e.trainingAge ?? 0,
        Duration: e.trainingDuration ?? 0,
        Frequency: e.trainingFrequency ?? 0,
        Location: e.trainingLocation ?? 0,
        Character: e.trainingCharacter ?? 0,
        Intensity: e.trainingIntensity ?? 0,
        Nausea: e.nausea ?? 0,
        Vomit: e.vomit ?? 0,
        Phonophobia: e.phonophobia ?? 0,
        Photophobia: e.photophobia ?? 0,
        Visual: e.visual ?? 0,
        Sensory: e.sensory ?? 0,
        Dysphasia: e.dysphasia ?? 0,
        Dysarthria: e.dysarthria ?? 0,
        Vertigo: e.vertigo ?? 0,
        Tinnitus: e.tinnitus ?? 0,
        Hypoacusis: e.hypoacusis ?? 0,
        Diplopia: e.diplopia ?? 0,
        Defect: e.defect ?? 0,
        Ataxia: e.ataxia ?? 0,
        Conscience: e.conscience ?? 0,
        Paresthesia: e.paresthesia ?? 0,
        DPF: e.dpf ?? 0,
        Type: e.studyType ?? '',
      }))

      try {
        const modelBaseUrl = (process.env.MODEL_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')
        const resp = await fetch(`${modelBaseUrl}/predict`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ records }),
        })

        if (resp.ok) {
          const prediction = (await resp.json()) as ModelPredictResponse
          const bucket = new Map<string, { scoreSum: number; count: number }>()
          for (const key of Object.keys(TYPE_LABELS)) {
            bucket.set(key, { scoreSum: 0, count: 0 })
          }

          for (let i = 0; i < prediction.predicted_type.length; i++) {
            const raw = prediction.predicted_type[i]
            const key = enumFromModelLabel(raw)
            if (!key) continue

            let score = 1
            const probObj = prediction.probabilities?.[i]
            if (probObj) {
              const direct = probObj[raw]
              if (typeof direct === 'number' && Number.isFinite(direct)) {
                score = direct
              } else {
                const normalized = normalizeLabel(raw)
                for (const [label, value] of Object.entries(probObj)) {
                  if (normalizeLabel(label) === normalized && Number.isFinite(value)) {
                    score = value
                    break
                  }
                }
              }
            }

            const entry = bucket.get(key)
            if (entry) {
              entry.scoreSum += score
              entry.count += 1
            }
          }

          const predictions = Object.keys(TYPE_LABELS).map((key) => {
            const row = bucket.get(key) ?? { scoreSum: 0, count: 0 }
            const probability = row.count > 0 ? (row.scoreSum / row.count) * 100 : 0
            const idx = prediction.predicted_type.findIndex((raw) => enumFromModelLabel(raw) === key)
            const sampleSymptoms = (idx >= 0 ? events[idx]?.detectedSymptoms : undefined)?.slice(0, 4) ?? []
            return {
              type: labelFromEnum(key),
              probability: Math.round(probability * 10) / 10,
              summary:
                row.count > 0
                  ? `${descriptionFromEnum(key)} Inferred from ${row.count} recent episodes.`
                  : descriptionFromEnum(key),
              keySymptoms: sampleSymptoms.length > 0 ? sampleSymptoms : ['No dominant symptoms captured'],
              impact: impactFromSignals(sampleSymptoms, probability),
            }
          })

          const sorted = predictions.sort((a, b) => b.probability - a.probability)
          const top = sorted[0]
          return NextResponse.json({
            generatedAt: new Date().toISOString(),
            source: 'live model inference from patient migraine events',
            predictedType: top?.type ?? null,
            confidence: top?.probability ?? 0,
            summary: top?.summary ?? 'No prediction available yet',
            keySymptoms: top?.keySymptoms ?? [],
            predictions: sorted,
          })
        }
      } catch (error) {
        console.error('Live patient analytics model inference failed:', error)
      }
    }
  }

  const countsMap = new Map<string, number>()
  for (const row of typeCounts) {
    if (row.migraineType) countsMap.set(row.migraineType, row._count._all)
  }
  const total = Array.from(countsMap.values()).reduce((a, b) => a + b, 0)

  const fallbackOrder = Object.keys(TYPE_LABELS)
  const predictions = fallbackOrder.map((typeKey) => {
    const label = TYPE_LABELS[typeKey] ?? typeKey
    const countBased = total > 0 ? ((countsMap.get(typeKey) ?? 0) / total) * 100 : 0
    const latestForType = recentInsights.find((x) => x.migraineType === typeKey)
    const probability = latestForType?.migraineTypeConfidence ?? countBased
    const keySymptoms = latestForType?.detectedSymptoms?.slice(0, 4) ?? []
    return {
      type: label,
      probability: Math.round(probability * 10) / 10,
      summary: latestForType
        ? `${descriptionFromEnum(typeKey)} Predicted from recent episodes for this patient.`
        : descriptionFromEnum(typeKey),
      keySymptoms: keySymptoms.length > 0 ? keySymptoms : ['No dominant symptoms captured'],
      impact: impactFromSignals(keySymptoms, probability),
    }
  })

  const sorted = [...predictions].sort((a, b) => b.probability - a.probability)
  const top = sorted[0]

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    source: 'mongodb.aiDiagnosticInsight + migraineEvent',
    predictedType: top?.type ?? null,
    confidence: top?.probability ?? 0,
    summary: top?.summary ?? 'No prediction available yet',
    keySymptoms: top?.keySymptoms ?? [],
    predictions: sorted,
  })
}
