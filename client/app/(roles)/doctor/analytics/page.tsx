"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Activity,
  Brain,
  Pill,
  Clock,
  Target,
  BarChart3,
  Calendar,
  Filter,
  Download,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts"
import StatsCard from "@/components/dashboard/StatsCard"
import { MigraineTypeTrendChart } from "@/components/doctor"

type AnalyticsRange = "1m" | "3m" | "6m" | "1y"

type DoctorAnalyticsPayload = {
  range: AnalyticsRange
  overview: {
    totalPatients: number
    activePatients: number
    highRiskPatients: number
    avgMigraineFrequency: number
    patientGrowthLabel: string | null
    riskTrendLabel: string | null
    avgFrequencyTrendLabel: string | null
    activeRateLabel: string
  }
  migraineFrequencyTrend: { month: string; avgFrequency: number; totalEvents: number }[]
  migraineTypeTrend: {
    date: string
    chronic: number
    typicalAura: number
    vestibular: number
    hemiplegic: number
    probable: number
  }[]
  severityDistribution: { severity: string; count: number; percentage: number }[]
  commonTriggers: { trigger: string; episodeCount: number; percentage: number; color: string }[]
  medicationAdherence: { name: string; value: number; color: string }[]
  treatmentOutcomes: { month: string; improved: number; stable: number; worsened: number }[]
  highRiskPatients: {
    id: string
    name: string
    riskLevel: "HIGH" | "MEDIUM" | "LOW"
    frequencyLabel: string
    adherence: number | null
    lastEvent: string
    concerns: string[]
  }[]
  insights: {
    avgResponseHours: number | null
    successRatePercent: number | null
    appointmentsThisWeek: number
  }
  meta?: {
    rangeEnd: string
    chartWindowStart: string
    episodeCountInCharts: number
    insightRowsInRange: number
    anchorNote: string
  }
}

const chartConfig = {
  avgFrequency: {
    label: "Avg Frequency",
    color: "#3b82f6",
  },
  totalEvents: {
    label: "Total Events",
    color: "#8b5cf6",
  },
  improved: {
    label: "Improved",
    color: "#10b981",
  },
  stable: {
    label: "Stable",
    color: "#3b82f6",
  },
  worsened: {
    label: "Worsened",
    color: "#ef4444",
  },
}

function trendChangeType(label: string | null | undefined): "positive" | "negative" | "neutral" {
  if (!label) return "neutral"
  if (label.startsWith("+")) return "negative"
  if (/^-/.test(label)) return "positive"
  return "neutral"
}

export default function DoctorAnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>("6m")
  const [data, setData] = useState<DoctorAnalyticsPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/doctor/analytics?range=${range}`, { credentials: "include" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(typeof j.message === "string" ? j.message : `Failed to load (${res.status})`)
      }
      setData((await res.json()) as DoctorAnalyticsPayload)
    } catch (e) {
      setData(null)
      setError(e instanceof Error ? e.message : "Failed to load analytics")
    } finally {
      setLoading(false)
    }
  }, [range])

  useEffect(() => {
    void load()
  }, [load])

  const overview = data?.overview
  const freqTrend = data?.migraineFrequencyTrend ?? []
  const typeTrend = data?.migraineTypeTrend ?? []
  const severityDistribution = data?.severityDistribution ?? []
  const commonTriggers = data?.commonTriggers ?? []
  const medicationAdherence = data?.medicationAdherence ?? []
  const treatmentOutcomes = data?.treatmentOutcomes ?? []
  const highRiskPatients = data?.highRiskPatients ?? []
  const insights = data?.insights

  const adherenceForDisplay = medicationAdherence.filter((s) => s.value > 0)
  const pieData = adherenceForDisplay.length > 0 ? adherenceForDisplay : medicationAdherence

  const exportCsv = () => {
    if (!data) return
    const rows = [
      ["Doctor analytics export", new Date().toISOString(), `range=${data.range}`],
      [],
      ["Overview"],
      ["totalPatients", String(overview?.totalPatients ?? "")],
      ["highRiskPatients", String(overview?.highRiskPatients ?? "")],
      ["avgMigraineFrequency(last bucket)", String(overview?.avgMigraineFrequency ?? "")],
      [],
      ["High / medium risk patients"],
      ["id", "name", "riskLevel", "frequencyLabel", "adherence", "lastEvent", "concerns"],
      ...highRiskPatients.map((p) => [
        p.id,
        p.name,
        p.riskLevel,
        p.frequencyLabel,
        p.adherence == null ? "" : String(p.adherence),
        p.lastEvent,
        p.concerns.join("; "),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `doctor-analytics-${data.range}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-6 lg:p-8">
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Patient Analytics</h1>
            <p className="text-sm md:text-base text-gray-600">
              Population insights across your linked patients
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2" type="button" disabled>
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-700"
              type="button"
              disabled={!data}
              onClick={exportCsv}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {(['1m', '3m', '6m', '1y'] as const).map((r) => (
          <Button
            key={r}
            type="button"
            size="sm"
            variant={range === r ? 'default' : 'outline'}
            className={range === r ? 'bg-blue-600 hover:bg-blue-700' : ''}
            onClick={() => setRange(r)}
          >
            {r === '1m' ? '1 Month' : r === '3m' ? '3 Months' : r === '6m' ? '6 Months' : '1 Year'}
          </Button>
        ))}
      </div>

      {data?.meta && (
        <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50/60 px-4 py-3 text-sm text-slate-700">
          <p className="font-medium text-slate-900">Data window</p>
          <p className="mt-1 text-xs leading-relaxed">{data.meta.anchorNote}</p>
          <p className="mt-2 text-xs text-slate-600">
            <span className="font-medium">{data.meta.episodeCountInCharts}</span> episodes in charts ·{' '}
            <span className="font-medium">{data.meta.insightRowsInRange}</span> AI insights · Ends{' '}
            <span className="font-medium">{new Date(data.meta.rangeEnd).toLocaleDateString()}</span>
          </p>
        </div>
      )}

      {error && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardHeader className="py-3">
            <CardTitle className="text-base text-amber-900">Could not load analytics</CardTitle>
            <CardDescription className="text-amber-800">{error}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button variant="outline" size="sm" type="button" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <StatsCard
          title="Total Patients"
          value={loading ? "…" : String(overview?.totalPatients ?? "—")}
          icon={Users}
          iconColor="text-blue-600"
          change={overview?.patientGrowthLabel ?? undefined}
          changeType="neutral"
        />
        <StatsCard
          title="Active Patients"
          value={loading ? "…" : String(overview?.activePatients ?? "—")}
          icon={Activity}
          iconColor="text-green-600"
          change={overview?.activeRateLabel}
          changeType="positive"
        />
        <StatsCard
          title="High Risk Patients"
          value={loading ? "…" : String(overview?.highRiskPatients ?? "—")}
          icon={AlertTriangle}
          iconColor="text-red-600"
          change={overview?.riskTrendLabel ?? undefined}
          changeType="neutral"
        />
        <StatsCard
          title="Avg Episodes / Patient (latest month)"
          value={loading ? "…" : String(overview?.avgMigraineFrequency ?? "—")}
          icon={Brain}
          iconColor="text-purple-600"
          change={overview?.avgFrequencyTrendLabel ?? undefined}
          changeType={trendChangeType(overview?.avgFrequencyTrendLabel ?? null)}
        />
      </div>

      <div className="mb-6">
        <MigraineTypeTrendChart
          data={typeTrend}
          extraDescription={
            data?.meta
              ? `Merged monthly counts: episodes with migraineType plus diagnostic insights in the same window.`
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Migraine frequency trend
            </CardTitle>
            <CardDescription>
              Average episodes per linked patient by month (bars show total episode volume)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {freqTrend.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No data in this range.</p>
            ) : (
              <>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ComposedChart data={freqTrend}>
                    <defs>
                      <linearGradient id="colorFrequency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="avg" />
                    <YAxis yAxisId="tot" orientation="right" allowDecimals={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      yAxisId="tot"
                      dataKey="totalEvents"
                      fill="#c4b5fd"
                      fillOpacity={0.5}
                      name="Total episodes"
                      radius={[2, 2, 0, 0]}
                    />
                    <Area
                      yAxisId="avg"
                      type="monotone"
                      dataKey="avgFrequency"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorFrequency)"
                      name="Avg / patient"
                    />
                  </ComposedChart>
                </ChartContainer>
                <p className="mt-2 text-xs text-muted-foreground text-center">
                  {freqTrend.reduce((s, x) => s + x.totalEvents, 0)} total episodes across displayed months
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Medication effectiveness
            </CardTitle>
            <CardDescription>Episodes with logged effectiveness (HIGH / MODERATE / LOW)</CardDescription>
          </CardHeader>
          <CardContent>
            {treatmentOutcomes.every((m) => m.improved + m.stable + m.worsened === 0) ? (
              <p className="text-sm text-muted-foreground py-12 text-center">
                No effectiveness data in this range. It is saved on migraine episodes when patients record it.
              </p>
            ) : (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <BarChart data={treatmentOutcomes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="improved" fill="#10b981" stackId="a" />
                  <Bar dataKey="stable" fill="#3b82f6" stackId="a" />
                  <Bar dataKey="worsened" fill="#ef4444" stackId="a" />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Severity distribution
            </CardTitle>
            <CardDescription>Episodes in selected range</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {severityDistribution.map((item, index) => (
                <div key={item.severity}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{item.severity}</span>
                    <span className="text-sm text-gray-600">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        index === 0 ? "bg-yellow-500" : index === 1 ? "bg-orange-500" : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-600" />
              Medication adherence
            </CardTitle>
            <CardDescription>Patients by average group adherence</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {pieData.every((s) => s.value === 0) ? (
                <p className="text-sm text-muted-foreground flex items-center justify-center h-full">
                  No adherence scores on file.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name.split("(")[0]?.trim() ?? name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${entry.name}-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="mt-4 space-y-2">
              {medicationAdherence.map((item, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="font-medium shrink-0">{item.value} patients</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Common triggers
            </CardTitle>
            <CardDescription>
              Perceived triggers on episodes, logged symptoms (Symptom: …), and AI key contributors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {commonTriggers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No trigger text on episodes.</p>
            ) : (
              <div className="space-y-4">
                {commonTriggers.map((item, index) => (
                  <div key={`${item.trigger}-${index}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{item.trigger}</span>
                      <span className="text-sm text-gray-600">
                        {item.episodeCount} mentions ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${Math.min(100, item.percentage)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            Patients to review
          </CardTitle>
          <CardDescription>Medium or high risk by the same 30-day rules as the patient list</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm">Patient</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Risk Level</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Activity</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Adherence</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Last Event</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Notes</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {highRiskPatients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                      No medium- or high-risk patients in the current window.
                    </td>
                  </tr>
                ) : (
                  highRiskPatients.map((patient) => (
                    <tr key={patient.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{patient.name}</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={patient.riskLevel === "HIGH" ? "destructive" : "default"}
                          className={patient.riskLevel === "MEDIUM" ? "bg-orange-500" : ""}
                        >
                          {patient.riskLevel}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm">{patient.frequencyLabel}</span>
                      </td>
                      <td className="py-3 px-4">
                        {patient.adherence == null ? (
                          <span className="text-sm text-muted-foreground">—</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  patient.adherence >= 70
                                    ? "bg-green-500"
                                    : patient.adherence >= 50
                                      ? "bg-orange-500"
                                      : "bg-red-500"
                                }`}
                                style={{ width: `${Math.min(100, patient.adherence)}%` }}
                              />
                            </div>
                            <span className="text-sm">{patient.adherence}%</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600">{patient.lastEvent}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {patient.concerns.map((concern, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {concern}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/doctor/patients?patient=${encodeURIComponent(patient.id)}`}>Review</Link>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-600 text-white">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg doctor reply time</p>
                <p className="text-2xl font-bold text-gray-900">
                  {insights?.avgResponseHours == null ? "—" : `${insights.avgResponseHours} hrs`}
                </p>
                <p className="text-xs text-gray-500 mt-1">Patient message → your reply (chat)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-600 text-white">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">HIGH effectiveness rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {insights?.successRatePercent == null ? "—" : `${insights.successRatePercent}%`}
                </p>
                <p className="text-xs text-gray-500 mt-1">Share of episodes with effectiveness logged</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-600 text-white">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Appointments (7 days)</p>
                <p className="text-2xl font-bold text-gray-900">{insights?.appointmentsThisWeek ?? "—"}</p>
                <p className="text-xs text-gray-500 mt-1">Non-cancelled visits on your calendar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
