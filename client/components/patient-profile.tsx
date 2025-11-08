"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  IconBrain, IconDownload, IconCalendar, IconTrendingUp, IconTrendingDown, 
  IconAlertTriangle, IconActivity, IconHeart, IconMoon, IconCloud
} from "@tabler/icons-react"
import { Progress } from "@/components/ui/progress"

// Mock migraine history data
const migraineLogs = [
  {
    date: "2024-11-06",
    severity: 8,
    duration: "4 hours",
    triggers: ["Stress", "Lack of sleep"],
    medication: "Sumatriptan",
    relief: "Partial"
  },
  {
    date: "2024-11-01",
    severity: 6,
    duration: "2 hours",
    triggers: ["Weather change"],
    medication: "Ibuprofen",
    relief: "Complete"
  },
  {
    date: "2024-10-28",
    severity: 9,
    duration: "6 hours",
    triggers: ["Hormonal", "Stress"],
    medication: "Sumatriptan + Rest",
    relief: "Partial"
  },
  {
    date: "2024-10-24",
    severity: 7,
    duration: "3 hours",
    triggers: ["Bright lights", "Dehydration"],
    medication: "Rizatriptan",
    relief: "Complete"
  }
]

// Mock AI insights data
const aiInsights = {
  riskPrediction: {
    currentRisk: 89,
    trend: "increasing",
    confidence: 94
  },
  triggerAnalysis: {
    primary: "Stress",
    secondary: "Sleep disruption", 
    tertiary: "Weather changes"
  },
  temporalTrends: {
    weeklyRisk: [65, 72, 78, 85, 89],
    predictedNext: 92
  }
}

interface PatientProfileProps {
  patient: {
    id: number
    name: string
    age: number
    gender: string
    avatar: string
    riskScore: number
    lastLogDate: string
    adherence: number
    frequency: string
    severity: string
    nextAppointment: string
  }
  onBack: () => void
}

export default function PatientProfile({ patient, onBack }: PatientProfileProps) {
  const [activeTab, setActiveTab] = useState("history")

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'destructive'
    if (score >= 60) return 'secondary'
    return 'outline'
  }

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-red-500'
    if (severity >= 6) return 'bg-orange-500'
    if (severity >= 4) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-6 p-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back to Patient List
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <IconCalendar className="mr-2 h-4 w-4" />
            Schedule Appointment
          </Button>
          <Button variant="outline">Save Changes</Button>
          <Button>
            <IconDownload className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Patient Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={patient.avatar} />
              <AvatarFallback className="text-lg">
                {patient.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold">{patient.name}</h1>
                <Badge variant={getRiskColor(patient.riskScore)}>
                  Risk Score: {patient.riskScore}%
                </Badge>
                {aiInsights.riskPrediction.trend === "increasing" && (
                  <IconTrendingUp className="h-5 w-5 text-red-500" />
                )}
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                <div>
                  <p className="text-muted-foreground">Age & Gender</p>
                  <p className="font-semibold">{patient.age} years, {patient.gender}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Migraine Frequency</p>
                  <p className="font-semibold">{patient.frequency}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Medication Adherence</p>
                  <p className="font-semibold">{patient.adherence}%</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Next Appointment</p>
                  <p className="font-semibold">{new Date(patient.nextAppointment).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">🕒 Migraine History</TabsTrigger>
          <TabsTrigger value="insights">🤖 AI Insights & Reports</TabsTrigger>
        </TabsList>

        {/* Migraine History Tab */}
        <TabsContent value="history" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Timeline View */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Recent Migraine Episodes</CardTitle>
                    <Button variant="outline" size="sm">
                      <IconDownload className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                  </div>
                  <CardDescription>Timeline of past migraine events</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {migraineLogs.map((log, index) => (
                      <div key={index} className="flex items-start space-x-4 p-4 rounded-lg border">
                        <div className="flex flex-col items-center">
                          <div className={`w-4 h-4 rounded-full ${getSeverityColor(log.severity)}`} />
                          <div className="w-px h-8 bg-border mt-2" />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">{new Date(log.date).toLocaleDateString()}</p>
                            <Badge variant="outline">Severity: {log.severity}/10</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Duration</p>
                              <p>{log.duration}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Relief</p>
                              <p>{log.relief}</p>
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-muted-foreground text-sm">Triggers</p>
                            <div className="flex gap-2 mt-1">
                              {log.triggers.map((trigger, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {trigger}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-muted-foreground text-sm">Treatment</p>
                            <p className="text-sm">{log.medication}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Frequency Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <IconActivity className="mx-auto mb-2 h-8 w-8" />
                    <p className="text-sm">Frequency chart visualization</p>
                    <p className="text-xs">Last 6 months</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Severity Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <IconHeart className="mx-auto mb-2 h-8 w-8" />
                    <p className="text-sm">Severity bar chart</p>
                    <p className="text-xs">Pattern analysis</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Prediction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconAlertTriangle className="h-5 w-5 text-orange-500" />
                  Risk Prediction Summary
                </CardTitle>
                <CardDescription>AI-powered risk assessment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-600 mb-2">
                    {aiInsights.riskPrediction.currentRisk}%
                  </div>
                  <Progress value={aiInsights.riskPrediction.currentRisk} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    High Risk Level - {aiInsights.riskPrediction.confidence}% confidence
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Predicted next week:</span>
                    <span className="font-semibold text-red-600">
                      {aiInsights.temporalTrends.predictedNext}%
                    </span>
                  </div>
                  
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Why Risk Increased:</strong> Stress levels elevated, sleep pattern disrupted, 
                      weather pressure changes detected. Recommend immediate intervention.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trigger Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Trigger Correlation Analysis</CardTitle>
                <CardDescription>Top influencing factors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconBrain className="h-4 w-4 text-red-500" />
                      <span className="text-sm">Stress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={85} className="w-20" />
                      <span className="text-sm font-semibold">85%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconMoon className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Sleep Disruption</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={72} className="w-20" />
                      <span className="text-sm font-semibold">72%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <IconCloud className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">Weather Changes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={58} className="w-20" />
                      <span className="text-sm font-semibold">58%</span>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground text-center">
                    Correlation heatmap visualization would appear here
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Temporal Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Temporal Risk Trends</CardTitle>
                <CardDescription>AI predictions vs actual events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <IconTrendingUp className="mx-auto mb-2 h-8 w-8" />
                  <p className="text-sm">Predicted vs Actual chart</p>
                  <p className="text-xs">Weekly/Monthly risk graphs</p>
                </div>
              </CardContent>
            </Card>

            {/* Doctor Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Doctor Notes & Recommendations</CardTitle>
                <CardDescription>Clinical observations and treatment plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg min-h-[120px] bg-gray-50">
                  <p className="text-sm text-muted-foreground italic">
                    Patient shows elevated stress-related triggers. Recommend stress management 
                    techniques and sleep hygiene improvement. Consider adjusting preventive 
                    medication dosage. Schedule follow-up in 2 weeks.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit Notes
                  </Button>
                  <Button size="sm" className="flex-1">
                    Save & Sync
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generate Report Section */}
          <Card>
            <CardHeader>
              <CardTitle>Generate AI-Enhanced Report</CardTitle>
              <CardDescription>Comprehensive patient report with AI insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-semibold">Complete Patient Analysis Report</p>
                  <p className="text-sm text-muted-foreground">
                    Includes migraine history, AI predictions, trigger analysis, and doctor notes
                  </p>
                </div>
                <Button>
                  <IconDownload className="mr-2 h-4 w-4" />
                  Generate PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
