/**
 * Build rows for the Python migraine model from Prisma MigraineEvent fields.
 * Column names match model/text training CSVs and /predict expectations.
 */

export type ModelRecord = {
  Age: number
  Duration: number
  Frequency: number
  Location: number
  Character: number
  Intensity: number
  Aura: number
  Nausea: number
  Vomit: number
  Phonophobia: number
  Photophobia: number
  Visual: number
  Sensory: number
  Dysphasia: number
  Dysarthria: number
  Vertigo: number
  Tinnitus: number
  Hypoacusis: number
  Diplopia: number
  Defect: number
  Ataxia: number
  Conscience: number
  Paresthesia: number
  DPF: number
  Type: string
}

type EventLike = {
  trainingAge: number | null
  trainingDuration: number | null
  trainingFrequency: number | null
  trainingLocation: number | null
  trainingCharacter: number | null
  trainingIntensity: number | null
  nausea: number | null
  vomit: number | null
  phonophobia: number | null
  photophobia: number | null
  visual: number | null
  sensory: number | null
  dysphasia: number | null
  dysarthria: number | null
  vertigo: number | null
  tinnitus: number | null
  hypoacusis: number | null
  diplopia: number | null
  defect: number | null
  ataxia: number | null
  conscience: number | null
  paresthesia: number | null
  dpf: number | null
  studyType: string | null
  severity: number
}

/** Map Prisma MigraineTypeClassification → canonical CSV / model label */
const PRISMA_TYPE_TO_MODEL: Record<string, string> = {
  MIGRAINE_WITHOUT_AURA: 'Migraine_without_aura',
  MIGRAINE_WITH_AURA: 'Typical_aura_migraine',
  BRAINSTEM_AURA_MIGRAINE: 'Brainstem_aura_migraine',
  HEMIPLEGIC_MIGRAINE: 'Hemiplegic_migraine',
  RETINAL_MIGRAINE: 'Retinal_migraine',
  CHRONIC_MIGRAINE: 'Chronic_migraine',
  MENSTRUAL_MIGRAINE: 'Menstrual_migraine',
  VESTIBULAR_MIGRAINE: 'Vestibular_migraine',
  STATUS_MIGRAINOSUS: 'Status_migrainosus',
  PROBABLE_MIGRAINE: 'Probable_migraine',
}

export function ageAtEpisode(patientDob: Date, episodeStart: Date): number {
  let age = episodeStart.getFullYear() - patientDob.getFullYear()
  const md = episodeStart.getMonth() - patientDob.getMonth()
  if (md < 0 || (md === 0 && episodeStart.getDate() < patientDob.getDate())) {
    age -= 1
  }
  return Math.max(0, Math.min(120, age))
}

/** Parse human duration e.g. "6 hours", "45 min", "12" → hours (rounded). */
export function parseDurationHoursHuman(duration: string | null | undefined): number {
  if (!duration?.trim()) return 0
  const s = duration.toLowerCase().trim()
  const match = s.match(/[\d.]+/)
  const num = match ? parseFloat(match[0]) : NaN
  if (!Number.isFinite(num)) return 0
  if (s.includes('min')) return Math.round((num / 60) * 10) / 10
  return Math.round(num * 10) / 10
}

function auraFromEvent(e: EventLike & { detectedSymptoms?: string[] }): number {
  if ((e.visual ?? 0) > 0 || (e.sensory ?? 0) > 0 || (e.dysphasia ?? 0) > 0) return 1
  const joined = (e.detectedSymptoms ?? []).join(' ').toLowerCase()
  if (joined.includes('aura')) return 1
  return 0
}

/** Map app severity 1–10 to training Intensity 1–3 (CSV scale). */
export function severityToTrainingIntensity(severity: number): number {
  const s = Math.min(10, Math.max(1, severity))
  if (s <= 3) return 1
  if (s <= 7) return 2
  return 3
}

export function migraineEventToModelRecord(e: EventLike): ModelRecord {
  const base = e as EventLike & { detectedSymptoms?: string[] }
  return {
    Age: e.trainingAge ?? 0,
    Duration: e.trainingDuration ?? 0,
    Frequency: e.trainingFrequency ?? 0,
    Location: e.trainingLocation ?? 0,
    Character: e.trainingCharacter ?? 0,
    Intensity: e.trainingIntensity ?? severityToTrainingIntensity(e.severity),
    Aura: auraFromEvent(base),
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
  }
}

/** DB row shape for building model records (extends training CSV fields). */
export type MigraineEventDbInput = EventLike & {
  startDatetime: Date | string
  duration?: string | null
  detectedSymptoms?: string[]
  migraineType?: string | null
  csvMigraineType?: string | null
}

/**
 * Build model rows from MongoDB MigraineEvent rows + patient DOB.
 * Fills missing training_* fields from severity, duration text, episode rate, and enum type.
 */
export function migraineEventsToModelRecords(
  events: MigraineEventDbInput[],
  patientDob: Date
): ModelRecord[] {
  if (events.length === 0) return []
  const sorted = [...events].sort(
    (a, b) => new Date(a.startDatetime).getTime() - new Date(b.startDatetime).getTime()
  )
  const windowMonths = 3
  const monthlyRate = Math.max(1, Math.min(30, Math.round(sorted.length / windowMonths)))

  return sorted.map((e) => {
    const start = new Date(e.startDatetime)
    const age = e.trainingAge ?? ageAtEpisode(patientDob, start)
    const dur =
      e.trainingDuration ??
      (parseDurationHoursHuman(e.duration ?? null) > 0
        ? parseDurationHoursHuman(e.duration ?? null)
        : Math.max(1, Math.round(e.severity)))
    const freq = e.trainingFrequency ?? monthlyRate
    const typeStr =
      (e.studyType?.trim() ? e.studyType.trim() : '') ||
      (e.migraineType ? PRISMA_TYPE_TO_MODEL[e.migraineType] ?? '' : '') ||
      (e.csvMigraineType?.trim() ?? '')

    const row: MigraineEventDbInput = { ...e, detectedSymptoms: e.detectedSymptoms ?? [] }
    return {
      Age: age,
      Duration: dur,
      Frequency: freq,
      Location: e.trainingLocation ?? 1,
      Character: e.trainingCharacter ?? 1,
      Intensity: e.trainingIntensity ?? severityToTrainingIntensity(e.severity),
      Aura: auraFromEvent(row),
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
      Type: typeStr,
    }
  })
}

export function modelApiBaseUrl(): string {
  return (process.env.MODEL_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')
}

export type NextAttackApiResponse = {
  based_on_records?: number
  next_attack?: {
    type?: { label?: string; probabilities?: Record<string, number> }
    regression?: Record<string, number>
    symptoms?: Record<string, { value?: number; probability?: number }>
  }
}

/** Normalized for web + mobile clients (camelCase). */
export type PatientNextAttackDto = {
  basedOnRecords: number
  predictedType: string
  typeProbabilities: Record<string, number>
  duration: number | null
  frequency: number | null
  intensity: number | null
  /** Symptoms predicted as likely for the next attack (value=1 or prob ≥ 0.5). */
  symptomsLikely: Array<{ name: string; probability?: number }>
}

export function normalizeNextAttackForClient(raw: NextAttackApiResponse | null): PatientNextAttackDto | null {
  if (!raw?.next_attack) return null
  const na = raw.next_attack
  const reg = na.regression ?? {}
  const sym = na.symptoms ?? {}
  const likely: PatientNextAttackDto['symptomsLikely'] = []
  for (const [name, val] of Object.entries(sym)) {
    const v = val as { value?: number; probability?: number }
    const prob = v.probability
    if (v.value === 1 || (typeof prob === 'number' && prob >= 0.5)) {
      likely.push({ name, probability: prob })
    }
  }
  const num = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) ? x : null)
  return {
    basedOnRecords: raw.based_on_records ?? 0,
    predictedType: na.type?.label ?? '',
    typeProbabilities: na.type?.probabilities ?? {},
    duration: num(reg.Duration ?? reg.duration),
    frequency: num(reg.Frequency ?? reg.frequency),
    intensity: num(reg.Intensity ?? reg.intensity),
    symptomsLikely: likely,
  }
}

/** Same as fetchNextAttackPredictionWithReason but returns only the DTO (legacy helper). */
export async function fetchNextAttackPrediction(records: ModelRecord[]): Promise<PatientNextAttackDto | null> {
  const { dto } = await fetchNextAttackPredictionWithReason(records)
  return dto
}

export async function fetchNextAttackPredictionWithReason(records: ModelRecord[]): Promise<{
  dto: PatientNextAttackDto | null
  unavailableReason: string | null
}> {
  if (records.length === 0) {
    return { dto: null, unavailableReason: 'No episodes available to forecast from.' }
  }
  const base = modelApiBaseUrl()
  const paths = ['/predict/next-attack', '/predict_next_attack']
  let lastStatus: number | null = null
  let sawNetworkError = false

  for (const path of paths) {
    try {
      const resp = await fetch(`${base}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ records }),
      })
      lastStatus = resp.status
      if (resp.ok) {
        const raw = (await resp.json()) as NextAttackApiResponse
        const dto = normalizeNextAttackForClient(raw)
        if (dto?.predictedType) return { dto, unavailableReason: null }
        return { dto: null, unavailableReason: 'Model returned an empty forecast.' }
      }
    } catch {
      sawNetworkError = true
    }
  }

  if (sawNetworkError && lastStatus === null) {
    return {
      dto: null,
      unavailableReason: `Could not reach model API at ${base}. Set MODEL_API_URL and ensure the Python server is running.`,
    }
  }
  if (lastStatus === 503) {
    return {
      dto: null,
      unavailableReason:
        'Next-attack model not loaded. On the model API run POST /pipeline/run-next once (writes next_attack_bundle.joblib).',
    }
  }
  if (lastStatus === 404) {
    return {
      dto: null,
      unavailableReason:
        'Next-attack endpoint not found (404). Restart the Python model server from the latest LLM/model/main.py.',
    }
  }
  return {
    dto: null,
    unavailableReason:
      lastStatus != null ? `Next-attack request failed (HTTP ${lastStatus}).` : 'Next-attack request failed.',
  }
}
