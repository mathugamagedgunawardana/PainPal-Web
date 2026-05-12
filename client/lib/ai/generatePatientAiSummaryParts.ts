import type { PatientSummaryFacts } from '@/lib/patient/loadPatientSummaryFacts'

export type AiSummaryParts = {
  structuredSummaryText: string
  treatmentOutcomeAnalysis: string
}

function formatTypeLabel(raw: string): string {
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function buildTemplatePatientSummary(facts: PatientSummaryFacts): AiSummaryParts {
  const first = facts.patientName.split(/\s+/)[0] || 'Patient'
  const trig =
    facts.topTriggers.length > 0
      ? `Self-reported triggers that appear most often include ${facts.topTriggers
          .slice(0, 3)
          .map((t) => t.name)
          .join(', ')}.`
      : 'Trigger tags are sparse—continued logging will improve pattern detection.'

  const forecast = facts.nextAttackPredictedType
    ? ` The optional forecast layer currently highlights "${formatTypeLabel(facts.nextAttackPredictedType)}" as a likely next pattern; this is probabilistic and not a diagnosis.`
    : ''

  const structuredSummaryText = [
    `In the last 90 days, ${first} logged ${facts.totalEpisodes90d} migraine episode(s) in the app.`,
    `Over the past 30 days there were ${facts.episodesLast30Days} episode(s) across ${facts.migraineDaysThisMonth} calendar day(s) with migraine activity, with mean severity ${facts.avgSeverity > 0 ? `${facts.avgSeverity}/10` : 'not yet established'}.`,
    trig + forecast,
  ].join(' ')

  const adherence =
    facts.adherencePercent != null
      ? `Documented medication adherence is approximately ${facts.adherencePercent}% across active preventive/rescue plans.`
      : 'Medication adherence has not been quantified from logs—consider reviewing schedule consistency at the next visit.'

  const burden =
    facts.episodesLast30Days >= 8
      ? 'Episode frequency is high; preventive strategy and rescue limits deserve proactive review.'
      : facts.episodesLast30Days >= 4
        ? 'Burden is moderate; monitor trends and reinforce acute therapy education.'
        : 'Episode burden appears relatively controlled based on recent counts.'

  const treatmentOutcomeAnalysis = [adherence, burden].join(' ')

  return { structuredSummaryText, treatmentOutcomeAnalysis }
}

type OpenAiMessage = { role: 'system' | 'user'; content: string }

async function callOpenAiJson(
  messages: OpenAiMessage[],
  apiKey: string,
  model: string
): Promise<{ clinicalOverview: string; treatmentNotes: string } | null> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      response_format: { type: 'json_object' },
      messages,
    }),
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    console.warn('OpenAI summary error:', res.status, t.slice(0, 500))
    return null
  }
  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const raw = body.choices?.[0]?.message?.content
  if (!raw || typeof raw !== 'string') return null
  try {
    const parsed = JSON.parse(raw) as { clinicalOverview?: string; treatmentNotes?: string }
    if (
      typeof parsed.clinicalOverview === 'string' &&
      parsed.clinicalOverview.trim() &&
      typeof parsed.treatmentNotes === 'string' &&
      parsed.treatmentNotes.trim()
    ) {
      return {
        clinicalOverview: parsed.clinicalOverview.trim(),
        treatmentNotes: parsed.treatmentNotes.trim(),
      }
    }
  } catch {
    /* fall through */
  }
  return null
}

/**
 * Produces narrative fields for `DoctorPatientSummary`.
 * Uses OpenAI when `OPENAI_API_KEY` is set; otherwise deterministic copy from facts.
 */
export async function generatePatientAiSummaryParts(facts: PatientSummaryFacts): Promise<AiSummaryParts> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini'

  if (apiKey) {
    const userPayload = {
      patientFirstName: facts.patientName.split(/\s+/)[0] || 'Patient',
      episodesLast30Days: facts.episodesLast30Days,
      migraineDaysThisMonth: facts.migraineDaysThisMonth,
      avgSeverity: facts.avgSeverity,
      adherencePercent: facts.adherencePercent,
      totalEpisodes90d: facts.totalEpisodes90d,
      topTriggers: facts.topTriggers,
      nextAttackPredictedType: facts.nextAttackPredictedType,
    }
    const parsed = await callOpenAiJson(
      [
        {
          role: 'system',
          content:
            'You write concise clinical decision-support prose for migraine care teams and patients. ' +
            'Use neutral, non-diagnostic language. Never invent symptoms or diagnoses not in the JSON. ' +
            'Respond with JSON only: {"clinicalOverview":"2-4 sentences","treatmentNotes":"1-2 sentences on adherence/burden patterns, no dosing instructions"}.',
        },
        {
          role: 'user',
          content: JSON.stringify(userPayload),
        },
      ],
      apiKey,
      model
    )
    if (parsed) {
      return {
        structuredSummaryText: parsed.clinicalOverview,
        treatmentOutcomeAnalysis: parsed.treatmentNotes,
      }
    }
  }

  return buildTemplatePatientSummary(facts)
}
