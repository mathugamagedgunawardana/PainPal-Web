'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Activity,
  TrendingUp,
  Pill,
  AlertCircle,
  Loader2,
  BarChart3,
  Calendar,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'
import { NextAttackForecastCard } from '@/components/forecast/NextAttackForecastCard'
import type { PatientNextAttackDto } from '@/lib/model/migraineModelRecords'

type AnalyticsData = {
  summary: {
    episodesLast30Days: number
    migraineDaysThisMonth: number
    avgSeverity: number
    adherencePercent: number | null
  }
  episodesByWeek: { label: string; fullLabel: string; count: number }[]
  severityDistribution: { level: number; count: number; label: string }[]
  triggers: { name: string; count: number }[]
  totalEpisodes: number
  nextAttack?: PatientNextAttackDto | null
  nextAttackUnavailableReason?: string | null
  nextAttackDisclaimer?: string
}

type StoredAiSummary = {
  id: string
  generatedDate: string
  structuredSummaryText: string
  treatmentOutcomeAnalysis: string
}

function formatTypeLabel(raw: string): string {
  if (!raw) return '—'
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff']
const SEVERITY_COLORS = ['#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444']

export default function PatientAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [aiStoredSummary, setAiStoredSummary] = useState<StoredAiSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiRefreshing, setAiRefreshing] = useState(false)
  const [aiMessage, setAiMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      fetch('/api/patient/analytics', { credentials: 'include' }).then((res) => {
        if (!res.ok) throw new Error('Failed to load analytics')
        return res.json() as Promise<AnalyticsData>
      }),
      fetch('/api/patient/ai-summary', { credentials: 'include' }).then((res) => {
        if (!res.ok) return { summary: null as StoredAiSummary | null }
        return res.json() as Promise<{ summary: StoredAiSummary | null }>
      }),
    ])
      .then(([analyticsData, aiPayload]) => {
        if (!cancelled) {
          setData(analyticsData)
          setAiStoredSummary(aiPayload.summary)
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load analytics')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const refreshAiSummary = async () => {
    setAiRefreshing(true)
    setAiMessage(null)
    try {
      const res = await fetch('/api/patient/ai-summary', {
        method: 'POST',
        credentials: 'include',
      })
      const body = (await res.json()) as {
        summary?: StoredAiSummary
        message?: string
        saved?: boolean
        error?: string
      }
      if (!res.ok) {
        throw new Error(body.error || 'Failed to refresh AI summary')
      }
      if (body.summary) setAiStoredSummary(body.summary)
      if (body.message) setAiMessage(body.message)
    } catch (e) {
      setAiMessage(e instanceof Error ? e.message : 'Refresh failed')
    } finally {
      setAiRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-red-700">{error}</CardContent>
        </Card>
      </div>
    )
  }

  if (!data) return null

  const { summary, episodesByWeek, severityDistribution, triggers } = data
  const hasEpisodes = data.totalEpisodes > 0

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Analytics</h1>
        <p className="text-gray-600 text-sm mt-1">Your migraine and treatment insights</p>
      </div>

      <Card className="border-violet-200 bg-violet-50/40">
        <CardHeader className="pb-2 flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
            <Sparkles className="w-5 h-5 text-violet-600" />
            AI health summary
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={aiRefreshing}
            onClick={() => void refreshAiSummary()}
          >
            {aiRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-1.5">{aiStoredSummary ? 'Refresh' : 'Generate'}</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-700">
          {aiMessage ? <p className="text-amber-800 text-xs">{aiMessage}</p> : null}
          {!aiStoredSummary ? (
            <p className="text-gray-600">
              No saved summary yet. Tap Generate to build one from your recent logs (saved when you have an
              active clinic link).
            </p>
          ) : (
            <>
              <p className="leading-relaxed whitespace-pre-wrap">{aiStoredSummary.structuredSummaryText}</p>
              <div className="rounded-lg bg-white/80 border border-violet-100 p-3">
                <p className="text-xs font-semibold text-violet-800 uppercase mb-1">Care plan angle</p>
                <p className="leading-relaxed whitespace-pre-wrap">
                  {aiStoredSummary.treatmentOutcomeAnalysis}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Updated {new Date(aiStoredSummary.generatedDate).toLocaleString()} · For education only, not
                a diagnosis or emergency guidance.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-indigo-50 border-indigo-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-indigo-600 mb-1">
              <Activity className="w-5 h-5" />
              <span className="text-sm font-medium">Episodes (30 days)</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.episodesLast30Days}</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-medium">Migraine days (month)</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{summary.migraineDaysThisMonth}</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-700 mb-1">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Avg severity</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {summary.avgSeverity > 0 ? `${summary.avgSeverity}/10` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-teal-50 border-teal-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-teal-600 mb-1">
              <Pill className="w-5 h-5" />
              <span className="text-sm font-medium">Adherence</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {summary.adherencePercent != null ? `${summary.adherencePercent}%` : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {data.nextAttackUnavailableReason && !data.nextAttack?.predictedType ? (
        <Card className="border-slate-200 bg-slate-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Next migraine attack forecast
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-slate-700">{data.nextAttackUnavailableReason}</p>
            <p className="text-xs text-slate-500">
              Ask your care team to run training on the model server (<code className="rounded bg-slate-100 px-1">POST /pipeline/run-next</code>) if forecasts stay unavailable.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {data.nextAttack?.predictedType ? (
        <NextAttackForecastCard
          nextAttack={data.nextAttack}
          disclaimer={data.nextAttackDisclaimer}
          variant="patient"
        />
      ) : null}


      {!hasEpisodes ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-700">No episode data yet</p>
            <p className="text-sm mt-1">
              Log your migraine episodes to see trends, severity, and triggers here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Episodes by week */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Episodes over the last 12 weeks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={episodesByWeek} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(_, i) => episodesByWeek[i]?.fullLabel ?? ''}
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.fullLabel ?? ''
                      }
                      formatter={(value: number) => [`${value} episodes`, 'Count']}
                    />
                    <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Episodes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Severity distribution */}
          {severityDistribution.some((s) => s.count > 0) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Severity distribution (1–10)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={severityDistribution.filter((s) => s.count > 0)}
                      margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: number) => [`${value} episodes`, 'Count']} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Episodes">
                        {severityDistribution
                          .filter((s) => s.count > 0)
                          .map((_, i) => (
                            <Cell
                              key={i}
                              fill={SEVERITY_COLORS[Math.min(i, SEVERITY_COLORS.length - 1)]}
                            />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top triggers */}
          {triggers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Top triggers
                </CardTitle>
                <p className="text-sm text-gray-500 font-normal">
                  Based on your reported triggers across episodes
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {triggers.map((t, i) => (
                    <div
                      key={t.name}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50"
                    >
                      <span className="font-medium text-gray-800">{t.name}</span>
                      <span className="text-sm text-gray-600">
                        {t.count} {t.count === 1 ? 'episode' : 'episodes'}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Triggers pie (optional) when we have triggers */}
          {triggers.length > 0 && triggers.length <= 8 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Triggers share</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={triggers}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {triggers.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value} episodes`, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
