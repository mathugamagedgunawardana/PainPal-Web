'use client'

import { AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { PatientNextAttackDto } from '@/lib/model/migraineModelRecords'

export function formatNextAttackTypeLabel(raw: string): string {
  if (!raw?.trim()) return '—'
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

type NextAttackForecastCardProps = {
  nextAttack: PatientNextAttackDto
  disclaimer?: string | null
  variant?: 'patient' | 'doctor'
}

export function NextAttackForecastCard({
  nextAttack,
  disclaimer,
  variant = 'patient',
}: NextAttackForecastCardProps) {
  const typeLabel = formatNextAttackTypeLabel(nextAttack.predictedType)
  const recordsLabel =
    variant === 'doctor'
      ? `Based on the patient's last ${nextAttack.basedOnRecords ?? '—'} logged episode${(nextAttack.basedOnRecords ?? 0) === 1 ? '' : 's'} (chronological history). Not a diagnosis.`
      : `From your last ${nextAttack.basedOnRecords ?? '—'} logged episode${(nextAttack.basedOnRecords ?? 0) === 1 ? '' : 's'}. For planning only—not medical advice.`

  const tierBadge =
    nextAttack.confidenceTier === 'high'
      ? 'High confidence'
      : nextAttack.confidenceTier === 'medium'
        ? 'Moderate confidence'
        : nextAttack.usedHistoryFallback
          ? variant === 'doctor'
            ? 'Based on patient history'
            : 'Based on your history'
          : 'Low model confidence'

  const topTypes =
    nextAttack.topTypes && nextAttack.topTypes.length > 0
      ? nextAttack.topTypes
      : Object.entries(nextAttack.typeProbabilities ?? {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([label, probability]) => ({ label, probability }))

  return (
    <Card className="border-amber-200 bg-amber-50/80">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-amber-950">
          <AlertCircle className="w-5 h-5" />
          {variant === 'doctor' ? 'Forecast: next migraine attack' : 'Your next attack (forecast)'}
        </CardTitle>
        <p className="text-sm text-amber-900/90 font-normal">{recordsLabel}</p>
        {nextAttack.confidenceCaption ? (
          <p className="text-sm text-amber-900/85 font-normal mt-1">{nextAttack.confidenceCaption}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white border border-amber-200 text-amber-950">
          {tierBadge}
          {nextAttack.typeConfidencePercent != null && !nextAttack.usedHistoryFallback
            ? ` · ${nextAttack.typeConfidencePercent}%`
            : null}
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="rounded-lg bg-white border border-amber-100 p-3 col-span-2 sm:col-span-1">
            <p className="text-xs text-amber-800 font-medium uppercase">Likely type</p>
            <p className="text-base font-semibold text-gray-900 mt-0.5">{typeLabel}</p>
            {nextAttack.usedHistoryFallback && nextAttack.modelPredictedType ? (
              <p className="text-[11px] text-amber-800/80 mt-1">
                Model suggested: {formatNextAttackTypeLabel(nextAttack.modelPredictedType)}
              </p>
            ) : null}
          </div>
          {typeof nextAttack.duration === 'number' ? (
            <div className="rounded-lg bg-white border border-amber-100 p-3">
              <p className="text-xs text-amber-800 font-medium uppercase">
                {variant === 'doctor' ? 'Est. duration (h)' : 'Est. hours'}
              </p>
              <p className="text-base font-semibold text-gray-900 mt-0.5">
                {nextAttack.duration.toFixed(1)}
              </p>
            </div>
          ) : null}
          {typeof nextAttack.frequency === 'number' ? (
            <div className="rounded-lg bg-white border border-amber-100 p-3">
              <p className="text-xs text-amber-800 font-medium uppercase">Est. episodes / mo</p>
              <p className="text-base font-semibold text-gray-900 mt-0.5">
                {Math.round(nextAttack.frequency)}
              </p>
            </div>
          ) : null}
          {typeof nextAttack.intensity === 'number' ? (
            <div className="rounded-lg bg-white border border-amber-100 p-3">
              <p className="text-xs text-amber-800 font-medium uppercase">Est. intensity</p>
              <p className="text-base font-semibold text-gray-900 mt-0.5">
                {nextAttack.intensity.toFixed(1)}
                <span className="text-gray-500 font-normal text-sm"> /10</span>
              </p>
            </div>
          ) : null}
        </div>

        {topTypes.length > 0 ? (
          <div>
            <p className="text-xs font-medium text-amber-900 mb-1.5">Top possible patterns</p>
            <div className="flex flex-wrap gap-2">
              {topTypes.map((t) => (
                <span
                  key={t.label}
                  className="px-2.5 py-1 text-xs rounded-full bg-white text-amber-950 border border-amber-200"
                >
                  {formatNextAttackTypeLabel(t.label)} ({Math.round(t.probability * 100)}%)
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {nextAttack.symptomsLikely && nextAttack.symptomsLikely.length > 0 ? (
          <div>
            <p className="text-xs font-medium text-amber-900 mb-1.5">Symptoms more likely next time</p>
            <div className="flex flex-wrap gap-2">
              {nextAttack.symptomsLikely.slice(0, 12).map((s) => (
                <span
                  key={s.name}
                  className="px-2.5 py-1 text-xs rounded-full bg-white text-amber-950 border border-amber-200"
                >
                  {s.name}
                  {typeof s.probability === 'number'
                    ? ` (${Math.round(s.probability * 100)}%)`
                    : ''}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {nextAttack.displayDisclaimer ? (
          <p className="text-xs text-amber-900/75">{nextAttack.displayDisclaimer}</p>
        ) : null}
        {disclaimer ? <p className="text-xs text-amber-900/75">{disclaimer}</p> : null}
      </CardContent>
    </Card>
  )
}
