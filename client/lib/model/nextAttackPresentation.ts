import type { PatientNextAttackDto } from '@/lib/model/migraineModelRecords'

export type TypeConfidenceTier = 'high' | 'medium' | 'low'

export type TopTypeEntry = { label: string; probability: number }

export type EnrichedPatientNextAttackDto = PatientNextAttackDto & {
  topTypes: TopTypeEntry[]
  confidenceTier: TypeConfidenceTier
  typeConfidencePercent: number | null
  usedHistoryFallback: boolean
  modelPredictedType?: string
  displayDisclaimer?: string
  confidenceCaption?: string
}

export const TYPE_CONFIDENCE_HIGH = 0.4
export const TYPE_CONFIDENCE_LOW = 0.25
export const SYMPTOM_MIN_PROB = 0.55
export const SYMPTOM_MAX_DISPLAY = 5
export const DEFAULT_NUM_CLASSES = 9

export function getTopTypes(
  probs: Record<string, number>,
  k = 3
): TopTypeEntry[] {
  return Object.entries(probs)
    .filter(([, p]) => typeof p === 'number' && Number.isFinite(p) && p > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([label, probability]) => ({ label, probability }))
}

export function getMaxTypeProbability(probs: Record<string, number>): number | null {
  const values = Object.values(probs).filter((p) => typeof p === 'number' && Number.isFinite(p))
  if (values.length === 0) return null
  return Math.max(...values)
}

export function getTypeConfidenceTier(
  maxProb: number | null,
  numClasses = DEFAULT_NUM_CLASSES
): TypeConfidenceTier {
  if (maxProb == null) return 'low'
  const uniform = 1 / Math.max(numClasses, 2)
  if (maxProb >= TYPE_CONFIDENCE_HIGH) return 'high'
  if (maxProb >= Math.max(TYPE_CONFIDENCE_LOW, uniform * 1.5)) return 'medium'
  return 'low'
}

export function dominantTypeFromHistory(historyTypes: string[]): string | null {
  const counts = new Map<string, number>()
  for (const t of historyTypes) {
    const key = t?.trim()
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  if (counts.size === 0) return null
  let best: string | null = null
  let bestCount = 0
  for (const [label, count] of counts) {
    if (count > bestCount) {
      bestCount = count
      best = label
    }
  }
  return best
}

export function resolveDisplayType(args: {
  predictedType: string
  typeProbabilities: Record<string, number>
  historyTypes: string[]
}): { displayType: string; usedHistoryFallback: boolean; modelPredictedType: string } {
  const { predictedType, typeProbabilities, historyTypes } = args
  const modelPredictedType = predictedType
  const maxProb = getMaxTypeProbability(typeProbabilities)
  const tier = getTypeConfidenceTier(maxProb)
  const history = dominantTypeFromHistory(historyTypes)

  if (tier === 'low' && history && historyTypes.filter((t) => t?.trim()).length >= 2) {
    return {
      displayType: history,
      usedHistoryFallback: true,
      modelPredictedType,
    }
  }
  return {
    displayType: predictedType || history || '',
    usedHistoryFallback: false,
    modelPredictedType,
  }
}

export function buildConfidenceCaption(
  tier: TypeConfidenceTier,
  typeConfidencePercent: number | null,
  usedHistoryFallback: boolean
): string {
  if (usedHistoryFallback) {
    return 'Several patterns are possible — showing your most common logged pattern from recent episodes.'
  }
  if (tier === 'high' && typeConfidencePercent != null) {
    return `Most likely next pattern (${typeConfidencePercent}% model confidence).`
  }
  if (tier === 'medium' && typeConfidencePercent != null) {
    return `Possible next pattern (${typeConfidencePercent}% model confidence). See alternatives below.`
  }
  return 'Forecast is uncertain — consider the top patterns below and your recent episode history.'
}

export function enrichPatientNextAttackDto(
  dto: PatientNextAttackDto,
  options?: { historyTypes?: string[] }
): EnrichedPatientNextAttackDto {
  const historyTypes = options?.historyTypes ?? []
  const maxProb = getMaxTypeProbability(dto.typeProbabilities)
  const confidenceTier = getTypeConfidenceTier(maxProb)
  const topTypes = getTopTypes(dto.typeProbabilities, 3)
  const { displayType, usedHistoryFallback, modelPredictedType } = resolveDisplayType({
    predictedType: dto.predictedType,
    typeProbabilities: dto.typeProbabilities,
    historyTypes,
  })
  const typeConfidencePercent =
    maxProb != null ? Math.round(maxProb * 100) : null

  const disclaimers: string[] = []
  if (dto.basedOnRecords === 1) {
    disclaimers.push(
      'Limited history — forecast may change as you log more episodes.'
    )
  }
  if (usedHistoryFallback) {
    disclaimers.push('Primary type shown from your episode history because model confidence was low.')
  }
  if (dto.basedOnRecords === 1 && dto.frequency != null) {
    // frequency less reliable with one episode — note in disclaimer only
  }

  const displayDisclaimer =
    [dto.displayDisclaimer, ...disclaimers].filter(Boolean).join(' ') || undefined

  const confidenceCaption = buildConfidenceCaption(
    confidenceTier,
    typeConfidencePercent,
    usedHistoryFallback
  )

  return {
    ...dto,
    predictedType: displayType,
    topTypes,
    confidenceTier,
    typeConfidencePercent,
    usedHistoryFallback,
    modelPredictedType: usedHistoryFallback ? modelPredictedType : undefined,
    displayDisclaimer,
    confidenceCaption,
  }
}

/** Extract non-empty Type labels from model records for history fallback. */
export function historyTypesFromModelRecords(
  records: Array<{ Type?: string }>
): string[] {
  return records.map((r) => (r.Type?.trim() ? r.Type.trim() : '')).filter(Boolean)
}
