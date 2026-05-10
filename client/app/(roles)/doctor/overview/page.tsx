"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  Users,
  AlertTriangle,
  Calendar,
  Brain,
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  Pill,
  FileText,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AreaChart, Area, XAxis, YAxis, BarChart, Bar, Cell } from "recharts"

type OverviewPayload = {
  activePatients: number
  activePatientsTrendLabel: string | null
  severeCases: number
  severeCasesTrendLabel: string | null
  todayAppointments: number
  nextAppointmentHint: string | null
  episodeReportsThisWeek: number
  migraineTrend: { month: string; episodes: number; severe: number }[]
  triggers: { trigger: string; count: number; color: string }[]
  recentActivities: {
    id: string
    type: "report" | "medication" | "alert" | "appointment"
    message: string
    time: string
    severity: "low" | "medium" | "high"
  }[]
  upcomingAppointments: {
    id: string
    patientId: string
    patientName: string
    appointmentDate: string
    severity: "severe" | "moderate" | "mild"
  }[]
  calendar: {
    year: number
    month: number
    monthLabel: string
    daysWithAppointments: number[]
    todayDay: number
  }
  tasks: { id: string; task: string; priority: "high" | "medium" | "low"; completed: boolean }[]
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function calendarGridDays(year: number, month: number): (number | null)[] {
  const first = new Date(year, month - 1, 1)
  const lead = first.getDay()
  const total = daysInMonth(year, month)
  const cells: (number | null)[] = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= total; d++) cells.push(d)
  return cells
}

export default function DoctorDashboard() {
  const [isMounted, setIsMounted] = useState(false)
  const [data, setData] = useState<OverviewPayload | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoadError(null)
    try {
      const res = await fetch("/api/doctor/overview", { credentials: "include" })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        const msg = typeof j.message === "string" ? j.message : res.statusText
        throw new Error(msg || `Request failed (${res.status})`)
      }
      const json = (await res.json()) as OverviewPayload
      setData(json)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load overview")
      setData(null)
    }
  }, [])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    void load()
  }, [isMounted, load])

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-96 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-32 bg-white/70 rounded-lg border animate-pulse"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="h-96 bg-white/70 rounded-lg border animate-pulse"></div>
              ))}
            </div>
            <div className="space-y-6">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="h-64 bg-white/70 rounded-lg border animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const trend = data?.migraineTrend ?? []
  const triggers = data?.triggers ?? []
  const activities = data?.recentActivities ?? []
  const upcoming = data?.upcomingAppointments ?? []
  const tasks = data?.tasks ?? []
  const cal = data?.calendar

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {loadError && (
          <Card className="border-amber-200 bg-amber-50/80">
            <CardHeader className="py-3">
              <CardTitle className="text-amber-900 text-base">Could not load dashboard</CardTitle>
              <CardDescription className="text-amber-800">{loadError}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button variant="outline" size="sm" onClick={() => void load()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white/70 backdrop-blur-sm border-blue-100 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Patients</CardTitle>
              <Users className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{data?.activePatients ?? "—"}</div>
              <p className="text-xs text-gray-600 flex items-center mt-1 min-h-[1rem]">
                {data?.activePatientsTrendLabel ? (
                  <>
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600 shrink-0" />
                    {data.activePatientsTrendLabel}
                  </>
                ) : (
                  <span>Patients with an active link to you</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-red-100 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">High-risk Patients</CardTitle>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{data?.severeCases ?? "—"}</div>
              <p className="text-xs text-gray-600 flex items-center mt-1 min-h-[1rem]">
                {data?.severeCasesTrendLabel ? (
                  <>
                    <TrendingDown className="h-3 w-3 mr-1 text-slate-500 shrink-0" />
                    {data.severeCasesTrendLabel}
                  </>
                ) : (
                  <span>From rolling 30-day episode patterns</span>
                )}
              </p>
              {(data?.severeCases ?? 0) > 0 && (
                <Badge variant="destructive" className="mt-2 text-xs">
                  Needs review
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-purple-100 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Today&apos;s Appointments</CardTitle>
              <Calendar className="h-5 w-5 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{data?.todayAppointments ?? "—"}</div>
              <p className="text-xs text-gray-600 flex items-center mt-1 min-h-[1rem]">
                <Clock className="h-3 w-3 mr-1 text-blue-500 shrink-0" />
                {data?.nextAppointmentHint ?? "No upcoming visits today"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-green-100 hover:shadow-lg transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Episode Reports</CardTitle>
              <Brain className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{data?.episodeReportsThisWeek ?? "—"}</div>
              <p className="text-xs text-gray-600 flex items-center mt-1">
                <Activity className="h-3 w-3 mr-1 text-green-500" />
                Logged in the last 7 days (all linked patients)
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-blue-100">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-gray-900">Migraine Episode Insights</CardTitle>
                    <CardDescription>Episode counts by month (last 6 months)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {trend.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-16 text-center">No episodes in range yet.</p>
                ) : (
                  <ChartContainer
                    config={{
                      episodes: {
                        label: "Total Episodes",
                        color: "hsl(var(--chart-1))",
                      },
                      severe: {
                        label: "Severe Episodes (7–10)",
                        color: "hsl(var(--chart-2))",
                      },
                    }}
                    className="h-80 w-full"
                  >
                    <AreaChart data={trend}>
                      <defs>
                        <linearGradient id="episodeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="severeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" className="text-sm" />
                      <YAxis className="text-sm" allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="episodes"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="url(#episodeGradient)"
                        name="Total Episodes"
                      />
                      <Area
                        type="monotone"
                        dataKey="severe"
                        stroke="#ef4444"
                        strokeWidth={3}
                        fill="url(#severeGradient)"
                        name="Severe Episodes"
                      />
                    </AreaChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-purple-100">
              <CardHeader>
                <CardTitle className="text-gray-900">Reported triggers</CardTitle>
                <CardDescription>From patient episode fields (last 30 days)</CardDescription>
              </CardHeader>
              <CardContent>
                {triggers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">
                    No perceived triggers recorded recently.
                  </p>
                ) : (
                  <ChartContainer
                    config={{
                      count: {
                        label: "Count",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-64 w-full"
                  >
                    <BarChart data={triggers} layout="horizontal" margin={{ left: 8 }}>
                      <XAxis type="number" className="text-sm" allowDecimals={false} />
                      <YAxis type="category" dataKey="trigger" className="text-sm" width={120} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {triggers.map((entry, index) => (
                          <Cell key={`t-${entry.trigger}-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-green-100">
              <CardHeader>
                <CardTitle className="text-gray-900">Recent activity</CardTitle>
                <CardDescription>Episodes, visits, notes, and messages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nothing recent to show.</p>
                  ) : (
                    activities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
                      >
                        <div
                          className={`p-2 rounded-full ${
                            activity.type === "report"
                              ? "bg-blue-100 text-blue-600"
                              : activity.type === "medication"
                                ? "bg-green-100 text-green-600"
                                : activity.type === "alert"
                                  ? "bg-red-100 text-red-600"
                                  : "bg-purple-100 text-purple-600"
                          }`}
                        >
                          {activity.type === "report" && <FileText className="h-4 w-4" />}
                          {activity.type === "medication" && <Pill className="h-4 w-4" />}
                          {activity.type === "alert" && <AlertTriangle className="h-4 w-4" />}
                          {activity.type === "appointment" && <Calendar className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900 font-medium">{activity.message}</p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                        <Badge
                          variant={
                            activity.severity === "high"
                              ? "destructive"
                              : activity.severity === "medium"
                                ? "default"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {activity.severity}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-white/70 backdrop-blur-sm border-orange-100">
              <CardHeader>
                <CardTitle className="text-gray-900">Suggested priorities</CardTitle>
                <CardDescription>Derived from your panel this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-all ${
                        task.completed
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input type="checkbox" checked={task.completed} className="rounded text-blue-600" readOnly />
                      <div className="flex-1">
                        <p
                          className={`text-sm ${task.completed ? "line-through text-gray-500" : "text-gray-900"}`}
                        >
                          {task.task}
                        </p>
                        <Badge
                          variant={
                            task.priority === "high"
                              ? "destructive"
                              : task.priority === "medium"
                                ? "default"
                                : "secondary"
                          }
                          className="mt-1 text-xs"
                        >
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-indigo-100">
              <CardHeader>
                <CardTitle className="text-gray-900">Appointment calendar</CardTitle>
                <CardDescription>{cal?.monthLabel ?? "—"}</CardDescription>
              </CardHeader>
              <CardContent>
                {cal ? (
                  <div className="grid grid-cols-7 gap-1 text-xs">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="p-2 text-center font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                    {calendarGridDays(cal.year, cal.month).map((day, idx) => (
                      <div key={idx} className="relative p-2 text-center min-h-[2rem]">
                        {day != null ? (
                          <>
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${
                                day === cal.todayDay ? "bg-blue-500 text-white font-medium" : ""
                              }`}
                            >
                              {day}
                            </span>
                            {cal.daysWithAppointments.includes(day) && (
                              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full" />
                            )}
                          </>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-pink-100">
              <CardHeader>
                <CardTitle className="text-gray-900">Next patients</CardTitle>
                <CardDescription>Upcoming scheduled visits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcoming.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
                  ) : (
                    upcoming.map((patient) => {
                      const t = new Date(patient.appointmentDate)
                      const timeStr = t.toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                      return (
                        <div
                          key={patient.id}
                          className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
                        >
                          <Avatar className="h-10 w-10 border-2 border-white">
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {patient.patientName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{patient.patientName}</p>
                            <p className="text-xs text-gray-500">{timeStr}</p>
                          </div>
                          <div
                            className={`w-3 h-3 rounded-full ${
                              patient.severity === "severe"
                                ? "bg-red-500"
                                : patient.severity === "moderate"
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                            }`}
                            title="Recent episode intensity (latest logged)"
                          />
                        </div>
                      )
                    })
                  )}

                  <Button variant="outline" className="w-full mt-4 border-dashed" asChild>
                    <Link href="/doctor/patients">
                      <Calendar className="h-4 w-4 mr-2" />
                      Open patient list
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
