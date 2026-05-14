import { describe, expect, it } from 'vitest'
import {
  ageAtEpisode,
  parseDurationHoursHuman,
  severityToTrainingIntensity,
} from './migraineModelRecords'

describe('migraineModelRecords helpers', () => {
  it('ageAtEpisode respects birthday not yet reached this year', () => {
    const dob = new Date('2000-06-15')
    const beforeBirthday = new Date('2026-03-01')
    expect(ageAtEpisode(dob, beforeBirthday)).toBe(25)
  })

  it('ageAtEpisode increments after birthday in same year', () => {
    const dob = new Date('2000-06-15')
    const afterBirthday = new Date('2026-07-01')
    expect(ageAtEpisode(dob, afterBirthday)).toBe(26)
  })

  it('parseDurationHoursHuman parses hours', () => {
    expect(parseDurationHoursHuman('6 hours')).toBe(6)
    expect(parseDurationHoursHuman('12')).toBe(12)
  })

  it('parseDurationHoursHuman parses minutes to fractional hours', () => {
    expect(parseDurationHoursHuman('45 min')).toBe(0.8)
  })

  it('parseDurationHoursHuman returns 0 for empty', () => {
    expect(parseDurationHoursHuman(null)).toBe(0)
    expect(parseDurationHoursHuman('')).toBe(0)
  })

  it('severityToTrainingIntensity maps bands', () => {
    expect(severityToTrainingIntensity(1)).toBe(1)
    expect(severityToTrainingIntensity(3)).toBe(1)
    expect(severityToTrainingIntensity(5)).toBe(2)
    expect(severityToTrainingIntensity(7)).toBe(2)
    expect(severityToTrainingIntensity(8)).toBe(3)
    expect(severityToTrainingIntensity(10)).toBe(3)
  })

  it('severityToTrainingIntensity clamps', () => {
    expect(severityToTrainingIntensity(0)).toBe(1)
    expect(severityToTrainingIntensity(99)).toBe(3)
  })
})
