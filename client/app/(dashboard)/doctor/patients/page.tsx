"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { IconSearch, IconFilter, IconEye, IconBrain, IconDownload, IconAlertTriangle, IconTrendingUp, IconTrendingDown } from "@tabler/icons-react"

// Mock patient data
const patients = [
  {
    id: 1,
    name: "Sarah Johnson",
    age: 34,
    gender: "Female",
    avatar: "/avatars/sarah.jpg",
    riskScore: 89,
    lastLogDate: "2024-11-06",
    adherence: 65,
    frequency: "8 episodes/month",
    severity: "High",
    nextAppointment: "2024-11-15"
  },
  {
    id: 2,
    name: "Michael Chen",
    age: 42,
    gender: "Male", 
    avatar: "/avatars/michael.jpg",
    riskScore: 84,
    lastLogDate: "2024-11-05",
    adherence: 72,
    frequency: "6 episodes/month",
    severity: "High",
    nextAppointment: "2024-11-18"
  },
  {
    id: 3,
    name: "Emma Rodriguez",
    age: 29,
    gender: "Female",
    avatar: "/avatars/emma.jpg", 
    riskScore: 78,
    lastLogDate: "2024-11-07",
    adherence: 58,
    frequency: "12 episodes/month",
    severity: "Medium",
    nextAppointment: "2024-11-12"
  },
  {
    id: 4,
    name: "David Thompson",
    age: 38,
    gender: "Male",
    avatar: "/avatars/david.jpg",
    riskScore: 76,
    lastLogDate: "2024-11-04",
    adherence: 81,
    frequency: "4 episodes/month", 
    severity: "High",
    nextAppointment: "2024-11-20"
  },
  {
    id: 5,
    name: "Lisa Anderson",
    age: 45,
    gender: "Female",
    avatar: "/avatars/lisa.jpg",
    riskScore: 74,
    lastLogDate: "2024-11-01",
    adherence: 69,
    frequency: "5 episodes/month",
    severity: "Medium",
    nextAppointment: "2024-11-14"
  },
  {
    id: 6,
    name: "James Wilson",
    age: 31,
    gender: "Male",
    avatar: "/avatars/james.jpg",
    riskScore: 45,
    lastLogDate: "2024-11-07",
    adherence: 94,
    frequency: "2 episodes/month",
    severity: "Low",
    nextAppointment: "2024-11-25"
  }
]

const PatientManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [selectedPatient, setSelectedPatient] = useState<any>(null)

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSeverity = filterSeverity === 'all' || patient.severity.toLowerCase() === filterSeverity
    return matchesSearch && matchesSeverity
  })

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50'
    if (score >= 60) return 'text-orange-600 bg-orange-50'
    return 'text-green-600 bg-green-50'
  }

  const getAdherenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-orange-600'
    return 'text-red-600'
  }

  if (selectedPatient) {
    return (
      <div className="space-y-6 p-6">
        {/* Patient Profile Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setSelectedPatient(null)}
          >
            ← Back to Patient List
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">Save Changes</Button>
            <Button>Export Report</Button>
          </div>
        </div>

        {/* Patient Info Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={selectedPatient.avatar} />
                <AvatarFallback>{selectedPatient.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold">{selectedPatient.name}</h2>
                  <Badge variant={selectedPatient.severity === 'High' ? 'destructive' : selectedPatient.severity === 'Medium' ? 'secondary' : 'outline'}>
                    Risk: {selectedPatient.riskScore}%
                  </Badge>
                </div>
                <div className="flex gap-6 text-sm text-muted-foreground mt-2">
                  <span>{selectedPatient.age} years old, {selectedPatient.gender}</span>
                  <span>Frequency: {selectedPatient.frequency}</span>
                  <span>Adherence: {selectedPatient.adherence}%</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Placeholder for Patient Profile Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>🕒 Migraine History</CardTitle>
              <CardDescription>Timeline and patterns analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center text-muted-foreground py-8">
                  <p>Interactive migraine timeline</p>
                  <p>• Frequency over time charts</p>
                  <p>• Severity distribution</p>
                  <p>• Export capabilities</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🤖 AI Insights & Reports</CardTitle>
              <CardDescription>Predictive analysis and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center text-muted-foreground py-8">
                  <p>AI-powered risk predictions</p>
                  <p>• Trigger correlation analysis</p>
                  <p>• Temporal trend predictions</p>
                  <p>• Explainable AI insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Patient Management</h1>
        <p className="text-muted-foreground">Monitor and manage your migraine patients</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
            <p className="text-xs text-muted-foreground">Active cases</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {patients.filter(p => p.riskScore >= 80).length}
            </div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Adherence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(patients.reduce((acc, p) => acc + p.adherence, 0) / patients.length)}%
            </div>
            <p className="text-xs text-muted-foreground">Treatment compliance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Appointments scheduled</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients by name..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <IconFilter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="medium">Medium Risk</SelectItem>
                <SelectItem value="low">Low Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patient Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => (
          <Card key={patient.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={patient.avatar} />
                  <AvatarFallback>{patient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{patient.name}</h3>
                  <p className="text-sm text-muted-foreground">{patient.age}y, {patient.gender}</p>
                </div>
                <Badge 
                  className={getRiskColor(patient.riskScore)}
                  variant="secondary"
                >
                  {patient.riskScore}%
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Frequency</p>
                  <p className="font-medium">{patient.frequency}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Log</p>
                  <p className="font-medium">{new Date(patient.lastLogDate).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="text-muted-foreground">Adherence: </span>
                  <span className={`font-medium ${getAdherenceColor(patient.adherence)}`}>
                    {patient.adherence}%
                  </span>
                </div>
                <div className="flex items-center">
                  {patient.adherence >= 80 ? (
                    <IconTrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <IconTrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setSelectedPatient(patient)}
                >
                  <IconEye className="mr-2 h-4 w-4" />
                  View Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <IconBrain className="mr-2 h-4 w-4" />
                  AI Insights
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <IconDownload className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No results */}
      {filteredPatients.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No patients found matching your criteria.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PatientManagementPage