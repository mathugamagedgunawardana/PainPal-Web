"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "Jan", activePatients: 245, highRisk: 35, episodes: 127 },
  { month: "Feb", activePatients: 267, highRisk: 42, episodes: 145 },
  { month: "Mar", activePatients: 289, highRisk: 38, episodes: 134 },
  { month: "Apr", activePatients: 301, highRisk: 45, episodes: 156 },
  { month: "May", activePatients: 324, highRisk: 41, episodes: 142 },
  { month: "Jun", activePatients: 342, highRisk: 39, episodes: 138 },
]

const chartConfig = {
  activePatients: {
    label: "Active Patients",
    color: "hsl(var(--chart-1))",
  },
  highRisk: {
    label: "High Risk",
    color: "hsl(var(--chart-2))",
  },
  episodes: {
    label: "Episodes",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function MigrainerChart() {
  return (
    <ChartContainer config={chartConfig}>
      <AreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          left: 12,
          right: 12,
          top: 12,
          bottom: 12,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent />}
        />
        <Area
          dataKey="episodes"
          type="monotone"
          fill="var(--color-episodes)"
          fillOpacity={0.4}
          stroke="var(--color-episodes)"
          stackId="a"
        />
        <Area
          dataKey="highRisk"
          type="monotone"
          fill="var(--color-highRisk)"
          fillOpacity={0.4}
          stroke="var(--color-highRisk)"
          stackId="b"
        />
        <Area
          dataKey="activePatients"
          type="monotone"
          fill="var(--color-activePatients)"
          fillOpacity={0.4}
          stroke="var(--color-activePatients)"
          stackId="c"
        />
      </AreaChart>
    </ChartContainer>
  )
}
