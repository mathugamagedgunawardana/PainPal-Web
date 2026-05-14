'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, RefreshCw } from 'lucide-react'

type SummaryPayload = {
  id: string
  generatedDate: string
  structuredSummaryText: string
  treatmentOutcomeAnalysis: string
  avgFrequency: number
  avgSeverity: number
  adherenceScore: number
}

type Props = {
  patientId: string
}

export function DoctorPatientAiSummaryCard({ patientId }: Props) {
  const [summary, setSummary] = useState<SummaryPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/patients/${patientId}/ai-summary`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error || `Failed (${res.status})`)
      }
      const data = (await res.json()) as { summary: SummaryPayload | null }
      setSummary(data.summary)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load AI summary')
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    void load()
  }, [load])

  const onRefresh = async () => {
    setRefreshing(true)
    setError(null)
    try {
      const res = await fetch(`/api/patients/${patientId}/ai-summary`, {
        method: 'POST',
        credentials: 'include',
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        const msg =
          (j as { message?: string; error?: string }).message ||
          (j as { error?: string }).error ||
          `Failed (${res.status})`
        throw new Error(msg)
      }
      const data = (await res.json()) as { summary: SummaryPayload }
      setSummary(data.summary)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 border-l-4 border-l-violet-500">
      <CardHeader className="pb-2 flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-900">
          <Sparkles className="w-5 h-5 text-violet-600 shrink-0" />
          AI clinical summary
        </CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={loading || refreshing}
          onClick={() => void onRefresh()}
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span className="ml-1.5 hidden sm:inline">Regenerate</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-gray-700">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500 py-4">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading summary…
          </div>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : !summary ? (
          <div className="space-y-2">
            <p className="text-gray-600">
              No AI summary yet. Regenerate builds one from recent episodes, triggers, and adherence
              (OpenAI optional; otherwise a rule-based narrative).
            </p>
            <Button type="button" size="sm" onClick={() => void onRefresh()} disabled={refreshing}>
              Generate summary
            </Button>
          </div>
        ) : (
          <>
            <p className="leading-relaxed whitespace-pre-wrap">{summary.structuredSummaryText}</p>
            <div className="rounded-lg bg-violet-50/80 border border-violet-100 p-3">
              <p className="text-xs font-semibold text-violet-800 uppercase tracking-wide mb-1">
                Treatment &amp; outcomes
              </p>
              <p className="leading-relaxed whitespace-pre-wrap">{summary.treatmentOutcomeAnalysis}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-gray-500 pt-1 border-t border-gray-100">
              <span>Updated {new Date(summary.generatedDate).toLocaleString()}</span>
              <span>Est. freq / mo ≈ {summary.avgFrequency}</span>
              <span>Avg severity {summary.avgSeverity}</span>
              <span>Adherence score {summary.adherenceScore}%</span>
            </div>
            <p className="text-xs text-gray-500">
              For decision support only—not a diagnosis. Review source episodes in the history tab.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
