import { MigraineTypeClassification, PrismaClient, RiskAlertLevel } from '@prisma/client'
import { getModelApiBaseUrl } from '@/lib/env/modelApiUrl'

type PredictResponse = {
  predicted_type: string[]
  probabilities?: Array<Record<string, number>>
}

const SEED_MARKER = 'trainingData_seed'

const labelMap: Record<string, MigraineTypeClassification> = {
  'migraine without aura': MigraineTypeClassification.MIGRAINE_WITHOUT_AURA,
  'migraine with aura': MigraineTypeClassification.MIGRAINE_WITH_AURA,
  'brainstem aura migraine': MigraineTypeClassification.BRAINSTEM_AURA_MIGRAINE,
  'hemiplegic migraine': MigraineTypeClassification.HEMIPLEGIC_MIGRAINE,
  'retinal migraine': MigraineTypeClassification.RETINAL_MIGRAINE,
  'chronic migraine': MigraineTypeClassification.CHRONIC_MIGRAINE,
  'menstrual migraine': MigraineTypeClassification.MENSTRUAL_MIGRAINE,
  'vestibular migraine': MigraineTypeClassification.VESTIBULAR_MIGRAINE,
  'status migrainosus': MigraineTypeClassification.STATUS_MIGRAINOSUS,
  'probable migraine': MigraineTypeClassification.PROBABLE_MIGRAINE,
}

function toEnum(rawLabel: string | null | undefined): MigraineTypeClassification | null {
  if (!rawLabel) return null
  const normalized = rawLabel.trim().toLowerCase().replace(/[_-]+/g, ' ')
  return labelMap[normalized] ?? null
}

function getConfidencePercent(probabilities: Record<string, number> | undefined, predictedLabel: string): number | null {
  if (!probabilities) return null
  const direct = probabilities[predictedLabel]
  if (typeof direct === 'number' && Number.isFinite(direct)) {
    return Math.round(direct * 10000) / 100
  }

  const normalizedPredicted = predictedLabel.trim().toLowerCase().replace(/[_-]+/g, ' ')
  for (const [k, v] of Object.entries(probabilities)) {
    const normalizedKey = k.trim().toLowerCase().replace(/[_-]+/g, ' ')
    if (normalizedKey === normalizedPredicted && Number.isFinite(v)) {
      return Math.round(v * 10000) / 100
    }
  }
  return null
}

let syncPromise: Promise<void> | null = null
let lastSyncAt = 0
const COOLDOWN_MS = 30_000

export type SeedPredictionSyncStatus = {
  running: boolean
  lastSyncAt: number | null
  pendingSeedEvents: number
}

export async function syncSeedPredictionsFromModel(prisma: PrismaClient): Promise<void> {
  const rows = await prisma.migraineEvent.findMany({
    where: {
      csvImportMarker: SEED_MARKER,
      OR: [{ migraineType: null }, { migraineTypeConfidence: null }],
    },
    select: {
      id: true,
      patientId: true,
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
    take: 500,
  })

  if (!rows.length) return

  const records = rows.map((row) => ({
    Age: row.trainingAge ?? 0,
    Duration: row.trainingDuration ?? 0,
    Frequency: row.trainingFrequency ?? 0,
    Location: row.trainingLocation ?? 0,
    Character: row.trainingCharacter ?? 0,
    Intensity: row.trainingIntensity ?? 0,
    Nausea: row.nausea ?? 0,
    Vomit: row.vomit ?? 0,
    Phonophobia: row.phonophobia ?? 0,
    Photophobia: row.photophobia ?? 0,
    Visual: row.visual ?? 0,
    Sensory: row.sensory ?? 0,
    Dysphasia: row.dysphasia ?? 0,
    Dysarthria: row.dysarthria ?? 0,
    Vertigo: row.vertigo ?? 0,
    Tinnitus: row.tinnitus ?? 0,
    Hypoacusis: row.hypoacusis ?? 0,
    Diplopia: row.diplopia ?? 0,
    Defect: row.defect ?? 0,
    Ataxia: row.ataxia ?? 0,
    Conscience: row.conscience ?? 0,
    Paresthesia: row.paresthesia ?? 0,
    DPF: row.dpf ?? 0,
    Type: row.studyType ?? '',
  }))

  const modelBaseUrl = getModelApiBaseUrl()
  const response = await fetch(`${modelBaseUrl}/predict`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ records }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Model API /predict failed (${response.status}): ${body}`)
  }

  const prediction = (await response.json()) as PredictResponse
  if (!Array.isArray(prediction.predicted_type) || prediction.predicted_type.length !== rows.length) {
    throw new Error('Model API /predict returned an invalid predicted_type payload')
  }

  for (let i = 0; i < rows.length; i++) {
    const event = rows[i]
    const predictedLabel = prediction.predicted_type[i]
    const mappedType = toEnum(predictedLabel)
    if (!mappedType) continue

    const confidence = getConfidencePercent(prediction.probabilities?.[i], predictedLabel)
    const riskAlertLevel: RiskAlertLevel =
      confidence !== null && confidence < 50 ? RiskAlertLevel.MEDIUM : RiskAlertLevel.NONE

    await prisma.$transaction([
      prisma.migraineEvent.update({
        where: { id: event.id },
        data: {
          migraineType: mappedType,
          migraineTypeConfidence: confidence,
        },
      }),
      prisma.aIDiagnosticInsight.create({
        data: {
          patientId: event.patientId,
          migraineType: mappedType,
          migraineTypeConfidence: confidence,
          diagnosticProbability: confidence,
          riskAlertLevel,
          keyContributors: [],
          detectedSymptoms: event.detectedSymptoms ?? [],
          modelName: 'xgboost',
          modelVersion: 'xgb-v1',
        },
      }),
    ])
  }
}

export async function triggerSeedPredictionSync(prisma: PrismaClient): Promise<void> {
  const now = Date.now()
  if (syncPromise) {
    await syncPromise
    return
  }
  if (now - lastSyncAt < COOLDOWN_MS) return

  syncPromise = (async () => {
    try {
      await syncSeedPredictionsFromModel(prisma)
    } catch (error) {
      console.error('Seed prediction sync failed:', error)
    } finally {
      lastSyncAt = Date.now()
      syncPromise = null
    }
  })()

  await syncPromise
}

export async function getSeedPredictionSyncStatus(prisma: PrismaClient): Promise<SeedPredictionSyncStatus> {
  const pendingSeedEvents = await prisma.migraineEvent.count({
    where: {
      csvImportMarker: SEED_MARKER,
      OR: [{ migraineType: null }, { migraineTypeConfidence: null }],
    },
  })

  return {
    running: syncPromise !== null,
    lastSyncAt: lastSyncAt > 0 ? lastSyncAt : null,
    pendingSeedEvents,
  }
}
