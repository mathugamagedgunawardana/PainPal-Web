"use client"
import React from 'react'
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { IconBrain, IconPill, IconCalendar, IconTrendingUp, IconTrendingDown, IconAlertTriangle } from "@tabler/icons-react"
import BarChart from '@/components/barChart'

const page = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  
  // Mock patient data
  const patientData = {
    name: "John Smith",
    age: 34,
    lastEpisode: "3 days ago",
    riskScore: 67,
    adherence: 85
  }

  const recentEpisodes = [
    { date: "Nov 5", severity: 8, duration: "4 hours", triggers: ["Stress", "Lack of sleep"] },
    { date: "Nov 1", severity: 6, duration: "2 hours", triggers: ["Weather change"] },
    { date: "Oct 28", severity: 9, duration: "6 hours", triggers: ["Hormonal", "Stress"] },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Migraine Dashboard</h1>
        <p className="text-muted-foreground">Track your migraine patterns and manage your treatment</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Since Last Episode</CardTitle>
            <IconBrain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              Previous streak: 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <IconTrendingDown className="mr-1 h-3 w-3 text-green-500" />
              -5 from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medication Adherence</CardTitle>
            <IconPill className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <IconTrendingUp className="mr-1 h-3 w-3 text-green-500" />
              +3% this month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Episodes This Month</CardTitle>
            <IconCalendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <IconTrendingDown className="mr-1 h-3 w-3 text-green-500" />
              -2 from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Chart and Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Episode Trends</CardTitle>
              <CardDescription>Your migraine patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <BarChart />
            </CardContent>
          </Card>
        </div>

        {/* Calendar and Recent Episodes */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>Track episodes and medication</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-lg border"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Episodes</CardTitle>
              <CardDescription>Your last few migraine episodes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentEpisodes.map((episode, index) => (
                <div key={index} className="flex items-start space-x-3 rounded-lg border p-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{episode.date}</p>
                      <Badge variant={episode.severity >= 8 ? "destructive" : episode.severity >= 6 ? "secondary" : "outline"}>
                        {episode.severity}/10
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Duration: {episode.duration}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {episode.triggers.map((trigger, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {trigger}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default page