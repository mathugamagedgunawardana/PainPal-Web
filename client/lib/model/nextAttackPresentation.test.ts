import { describe, expect, it } from 'vitest'
import {
  enrichPatientNextAttackDto,
  getTopTypes,
  getTypeConfidenceTier,
  resolveDisplayType,
} from './nextAttackPresentation'
import type { PatientNextAttackDto } from './migraineModelRecords'

const baseDto = (): PatientNextAttackDto => ({
  basedOnRecords: 3,
  predictedType: 'Chronic_migraine',
  typeProbabilities: {
    Chronic_migraine: 0.45,
    Migraine_without_aura: 0.2,
    Vestibular_migraine: 0.15,
  },
  duration: 6,
  frequency: 4,
  intensity: 7,
  symptomsLikely: [],
})

describe('getTopTypes', () => {
  it('returns top 3 sorted by probability', () => {
    const top = getTopTypes(baseDto().typeProbabilities, 3)
    expect(top).toHaveLength(3)
    expect(top[0].label).toBe('Chronic_migraine')
    expect(top[0].probability).toBe(0.45)
  })
})

describe('getTypeConfidenceTier', () => {
  it('returns high when max prob >= 0.4', () => {
    expect(getTypeConfidenceTier(0.42)).toBe('high')
  })
  it('returns low when max prob < 0.25', () => {
    expect(getTypeConfidenceTier(0.12)).toBe('low')
  })
})

describe('resolveDisplayType', () => {
  it('uses history fallback when confidence is low and history exists', () => {
    const r = resolveDisplayType({
      predictedType: 'Probable_migraine',
      typeProbabilities: { Probable_migraine: 0.15, Chronic_migraine: 0.14 },
      historyTypes: ['Chronic_migraine', 'Chronic_migraine', 'Menstrual_migraine'],
    })
    expect(r.usedHistoryFallback).toBe(true)
    expect(r.displayType).toBe('Chronic_migraine')
    expect(r.modelPredictedType).toBe('Probable_migraine')
  })

  it('keeps model label when confidence is high', () => {
    const r = resolveDisplayType({
      predictedType: 'Chronic_migraine',
      typeProbabilities: { Chronic_migraine: 0.55 },
      historyTypes: ['Migraine_without_aura'],
    })
    expect(r.usedHistoryFallback).toBe(false)
    expect(r.displayType).toBe('Chronic_migraine')
  })
})

describe('enrichPatientNextAttackDto', () => {
  it('adds topTypes and confidence fields', () => {
    const enriched = enrichPatientNextAttackDto(baseDto(), {
      historyTypes: ['Chronic_migraine'],
    })
    expect(enriched.topTypes.length).toBeGreaterThan(0)
    expect(enriched.confidenceTier).toBe('high')
    expect(enriched.typeConfidencePercent).toBe(45)
    expect(enriched.confidenceCaption).toContain('45%')
  })

  it('sets limited history disclaimer for single episode', () => {
    const enriched = enrichPatientNextAttackDto({
      ...baseDto(),
      basedOnRecords: 1,
    })
    expect(enriched.displayDisclaimer).toContain('Limited history')
  })
})
