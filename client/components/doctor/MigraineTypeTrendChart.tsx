"use client"

import React from "react"
import { Activity } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from "recharts"

export type MigraineTypeTrendPoint = {
  date: string
  chronic: number
  typicalAura: number
  vestibular: number
  hemiplegic: number
  probable: number
}

const chartConfig = {
  chronic: { label: "Chronic migraine", color: "#ef4444" },
  typicalAura: { label: "Typical aura", color: "#3b82f6" },
  vestibular: { label: "Vestibular", color: "#14b8a6" },
  hemiplegic: { label: "Hemiplegic", color: "#f59e0b" },
  probable: { label: "Probable", color: "#8b5cf6" },
}

const lineKeys: Array<keyof typeof chartConfig> = [
  "chronic",
  "typicalAura",
  "vestibular",
  "hemiplegic",
  "probable",
]

function getDominantType(latest: MigraineTypeTrendPoint | undefined) {
  if (!latest) {
    return "Unknown"
  }
  const entries = lineKeys.map((key) => ({ key, value: latest[key] as number }))
  entries.sort((a, b) => b.value - a.value)
  const top = entries[0]?.key
  return top ? chartConfig[top].label : "Unknown"
}

interface MigraineTypeTrendChartProps {
  data: MigraineTypeTrendPoint[]
  patientName?: string
  /** Extra line under the description (e.g. population analytics source hint). */
  extraDescription?: string
}

export function MigraineTypeTrendChart({ data, patientName, extraDescription }: MigraineTypeTrendChartProps) {
  const latest = data.length > 0 ? data[data.length - 1] : undefined
  const dominantType = getDominantType(latest)
  const latestMonthTotal = latest
    ? lineKeys.reduce((sum, key) => sum + Number(latest[key]), 0)
    : 0
  const seriesTotal = data.reduce(
    (acc, row) => acc + lineKeys.reduce((s, key) => s + Number(row[key]), 0),
    0
  )

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Migraine Type Trend
            </CardTitle>
            <CardDescription>
              Counts from episode{" "}
              <span className="font-medium">migraineType</span> plus AI insights{" "}
              <span className="font-medium">migraineType</span>
              {patientName ? ` for ${patientName}` : ""}
              {extraDescription ? (
                <span className="block mt-1 text-xs text-muted-foreground">{extraDescription}</span>
              ) : null}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Latest month: {dominantType}</Badge>
            <Badge className="bg-indigo-600">{seriesTotal} typed</Badge>
            {latestMonthTotal > 0 && (
              <Badge variant="outline" className="text-xs">
                {latestMonthTotal} in latest month
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 || seriesTotal === 0 ? (
          <p className="text-sm text-muted-foreground py-16 text-center">
            No typed rows in this window. Populate{" "}
            <span className="font-medium">MigraineEvent.migraineType</span> (sync/model/manual) or{" "}
            <span className="font-medium">AIDiagnosticInsight</span> records for linked patients.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[320px] w-full">
            <LineChart data={data} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend />
              {lineKeys.map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={`var(--color-${key})`}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
