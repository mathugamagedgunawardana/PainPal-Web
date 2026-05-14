import { SummaryType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { generatePatientAiSummaryParts } from '@/lib/ai/generatePatientAiSummaryParts'
import { loadPatientSummaryFacts } from '@/lib/patient/loadPatientSummaryFacts'

export type SerializedDoctorPatientSummary = {
  id: string
  generatedDate: string
  summaryType: SummaryType
  structuredSummaryText: string
  treatmentOutcomeAnalysis: string
  avgFrequency: number
  avgSeverity: number
  adherenceScore: number
}

function serialize(row: {
  id: string
  generatedDate: Date
  summaryType: SummaryType
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

/** Episodes per 30-day month estimated from 90-day window. */
function avgFrequencyPerMonth(totalEpisodes90d: number): number {
  if (totalEpisodes90d <= 0) return 0
  return Math.round((totalEpisodes90d / 3) * 10) / 10
}

export type RefreshSummaryResult = {
  saved: boolean
  summary: SerializedDoctorPatientSummary
}

/**
 * Generates narrative + metrics and persists `DoctorPatientSummary` when `doctorId` is provided.
 */
export async function refreshDoctorPatientSummary(
  patientId: string,
  doctorId: string | null
): Promise<RefreshSummaryResult> {
  const facts = await loadPatientSummaryFacts(patientId)
  if (!facts) {
    throw new Error('Patient not found')
  }

  const parts = await generatePatientAiSummaryParts(facts)
  const avgFrequency = avgFrequencyPerMonth(facts.totalEpisodes90d)
  const adherenceScore = facts.adherencePercent ?? 0

  if (!doctorId) {
    const now = new Date()
    return {
      saved: false,
      summary: {
        id: '',
        generatedDate: now.toISOString(),
        summaryType: SummaryType.WEEKLY,
        structuredSummaryText: parts.structuredSummaryText,
        treatmentOutcomeAnalysis: parts.treatmentOutcomeAnalysis,
        avgFrequency,
        avgSeverity: facts.avgSeverity,
        adherenceScore,
      },
    }
  }

  const created = await prisma.doctorPatientSummary.create({
    data: {
      patientId,
      doctorId,
      summaryType: SummaryType.WEEKLY,
      structuredSummaryText: parts.structuredSummaryText,
      treatmentOutcomeAnalysis: parts.treatmentOutcomeAnalysis,
      avgFrequency,
      avgSeverity: facts.avgSeverity,
      adherenceScore,
    },
  })

  return { saved: true, summary: serialize(created) }
}
