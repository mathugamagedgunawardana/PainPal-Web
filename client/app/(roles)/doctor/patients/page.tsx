"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
  Filter,
  UserPlus,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Activity,
  Pill,
  FileText,
  MessageSquare,
  Clock,
  TrendingUp,
  MapPin,
  Download,
  Upload,
  Edit,
  ChevronRight,
  X
} from 'lucide-react'

// Mock patient data
const mockPatients = [
  {
    id: 1,
    name: 'Sarah Chen',
    age: 34,
    gender: 'Female',
    photo: '/avatars/sarah.jpg',
    riskLevel: 'high',
    lastVisit: '2024-12-10',
    nextAppointment: '2024-12-20',
    phone: '+1 (555) 123-4567',
    email: 'sarah.chen@email.com',
    address: '123 Oak Street, San Francisco, CA',
    migraineDays: 15,
    adherence: 78,
    triggers: ['Stress', 'Sleep', 'Weather'],
    currentMeds: ['Sumatriptan 50mg', 'Topiramate 25mg'],
    recentEpisodes: 8,
    condition: 'Chronic Migraine with Aura'
  },
  {
    id: 2,
    name: 'John Doe',
    age: 42,
    gender: 'Male',
    photo: '/avatars/john.jpg',
    riskLevel: 'medium',
    lastVisit: '2024-12-08',
    nextAppointment: '2024-12-22',
    phone: '+1 (555) 234-5678',
    email: 'john.doe@email.com',
    address: '456 Maple Ave, Los Angeles, CA',
    migraineDays: 8,
    adherence: 92,
    triggers: ['Bright Lights', 'Caffeine'],
    currentMeds: ['Rizatriptan 10mg'],
    recentEpisodes: 4,
    condition: 'Episodic Migraine'
  },
  {
    id: 3,
    name: 'Emily Smith',
    age: 28,
    gender: 'Female',
    photo: '/avatars/emily.jpg',
    riskLevel: 'low',
    lastVisit: '2024-12-05',
    nextAppointment: '2025-01-10',
    phone: '+1 (555) 345-6789',
    email: 'emily.smith@email.com',
    address: '789 Pine Rd, Seattle, WA',
    migraineDays: 4,
    adherence: 95,
    triggers: ['Hormonal Changes'],
    currentMeds: ['Ibuprofen 400mg'],
    recentEpisodes: 2,
    condition: 'Menstrual Migraine'
  },
  {
    id: 4,
    name: 'Michael Johnson',
    age: 51,
    gender: 'Male',
    photo: '/avatars/michael.jpg',
    riskLevel: 'medium',
    lastVisit: '2024-12-12',
    nextAppointment: '2024-12-28',
    phone: '+1 (555) 456-7890',
    email: 'michael.j@email.com',
    address: '321 Elm St, Boston, MA',
    migraineDays: 10,
    adherence: 85,
    triggers: ['Stress', 'Dehydration', 'Bright Lights'],
    currentMeds: ['Sumatriptan 100mg', 'Amitriptyline 10mg'],
    recentEpisodes: 6,
    condition: 'Chronic Migraine'
  },
]

const episodeHistory = [
  { date: '2024-12-15', severity: 'Severe', duration: '6 hours', triggers: ['Stress', 'Sleep'] },
  { date: '2024-12-10', severity: 'Moderate', duration: '4 hours', triggers: ['Weather'] },
  { date: '2024-12-05', severity: 'Mild', duration: '2 hours', triggers: ['Caffeine'] },
  { date: '2024-11-28', severity: 'Severe', duration: '8 hours', triggers: ['Stress', 'Bright Lights'] },
]

const medications = [
  { name: 'Sumatriptan 50mg', frequency: 'As needed', adherence: 78, lastTaken: '2024-12-15' },
  { name: 'Topiramate 25mg', frequency: 'Daily', adherence: 92, lastTaken: '2024-12-16' },
  { name: 'Ibuprofen 400mg', frequency: 'As needed', adherence: 85, lastTaken: '2024-12-14' },
]

const appointments = [
  { date: '2024-12-20', type: 'Follow-up', doctor: 'Dr. Johnson', status: 'Scheduled' },
  { date: '2024-12-10', type: 'Regular Check-up', doctor: 'Dr. Johnson', status: 'Completed' },
  { date: '2024-11-15', type: 'Initial Consultation', doctor: 'Dr. Johnson', status: 'Completed' },
]

const notes = [
  { date: '2024-12-10', note: 'Patient reports increased frequency. Adjusted medication dosage.', author: 'Dr. Johnson' },
  { date: '2024-11-15', note: 'Initial assessment completed. Prescribed preventive treatment.', author: 'Dr. Johnson' },
]

const communications = [
  { date: '2024-12-12', type: 'Reminder', message: 'Appointment reminder sent', channel: 'SMS' },
  { date: '2024-12-08', type: 'Message', message: 'Medication refill approved', channel: 'Email' },
]

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')
  const [selectedPatient, setSelectedPatient] = useState<typeof mockPatients[0] | null>(null)

  const filteredPatients = mockPatients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRisk = riskFilter === 'all' || patient.riskLevel === riskFilter
    return matchesSearch && matchesRisk
  })

  return (
    <div className="min-h-screen bg-gradient-to-br  via-purple-50 to-teal-50 p-8 space-y-6">
      {/* Header */}
      {/* <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Patient Management</h1>
          <p className="text-gray-600 mt-1">Manage and monitor your migraine patients</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
          <UserPlus className="mr-2 w-5 h-5" />
          Add New Patient
        </Button>
      </div> */}

      {/* Search and Filters */}
      <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
        <CardContent className="">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search patients by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={riskFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setRiskFilter('all')}
                className="rounded-xl"
              >
                All Patients
              </Button>
              <Button
                variant={riskFilter === 'high' ? 'destructive' : 'outline'}
                onClick={() => setRiskFilter('high')}
                className="rounded-xl"
              >
                <AlertTriangle className="w-4 h-4 mr-1" />
                High Risk
              </Button>
              <Button
                variant={riskFilter === 'medium' ? 'default' : 'outline'}
                onClick={() => setRiskFilter('medium')}
                className="rounded-xl"
              >
                Medium
              </Button>
              <Button
                variant={riskFilter === 'low' ? 'secondary' : 'outline'}
                onClick={() => setRiskFilter('low')}
                className="rounded-xl"
              >
                Low Risk
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Patient List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">Patients ({filteredPatients.length})</h2>
            <Badge variant="secondary" className="text-sm">{filteredPatients.length} Total</Badge>
          </div>
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
            {filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                className={`w-full max-w-sm cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] ${
                  selectedPatient?.id === patient.id
                    ? 'border-2 border-purple-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg'
                    : 'border border-gray-200 bg-white/80 backdrop-blur-sm'
                }`}
                onClick={() => setSelectedPatient(patient)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-14 h-14 border-3 border-gradient-to-br from-blue-400 to-purple-500 ring-2 ring-white">
                      <AvatarImage src={patient.photo} alt={patient.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 truncate">{patient.name}</h3>
                      <p className="text-sm text-gray-500">{patient.age} years • {patient.gender}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">Last: {patient.lastVisit}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={
                          patient.riskLevel === 'high' ? 'destructive' :
                          patient.riskLevel === 'medium' ? 'default' : 'secondary'
                        }
                        className="text-xs font-semibold"
                      >
                        {patient.riskLevel.toUpperCase()}
                      </Badge>
                      <ChevronRight className={`w-5 h-5 ${selectedPatient?.id === patient.id ? 'text-purple-600' : 'text-gray-400'}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Patient Profile Details */}
        <div className="w-full">
          {selectedPatient ? (
            <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              {/* Profile Header */}
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <Avatar className="w-28 h-28 border-4 border-gradient-to-br from-blue-500 to-purple-600 ring-4 ring-white shadow-xl">
                      <AvatarImage src={selectedPatient.photo} alt={selectedPatient.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-bold">
                        {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{selectedPatient.name}</h2>
                          <p className="text-gray-600 font-medium mt-1">{selectedPatient.condition}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                            onClick={() => window.location.href = '/doctor/patients/analytics'}
                          >
                            <Activity className="w-4 h-4 mr-2" />
                            View Analytics
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 text-blue-500" />
                          <span>{selectedPatient.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="w-4 h-4 text-purple-500" />
                          <span>{selectedPatient.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4 text-teal-500" />
                          <span className="truncate">{selectedPatient.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-indigo-500" />
                          <span>Next: {selectedPatient.nextAppointment}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all border-0">
                  <CardContent className="p-4 text-center">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-90" />
                    <div className="text-3xl font-bold">{selectedPatient.recentEpisodes}</div>
                    <div className="text-xs opacity-90 font-medium">Recent Episodes</div>
                    <div className="text-xs opacity-75 mt-1">(Last 30 days)</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all border-0">
                  <CardContent className="p-4 text-center">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-90" />
                    <div className="text-3xl font-bold">{selectedPatient.migraineDays}</div>
                    <div className="text-xs opacity-90 font-medium">Migraine Days</div>
                    <div className="text-xs opacity-75 mt-1">(This month)</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all border-0">
                  <CardContent className="p-4 text-center">
                    <Pill className="w-8 h-8 mx-auto mb-2 opacity-90" />
                    <div className="text-3xl font-bold">{selectedPatient.adherence}%</div>
                    <div className="text-xs opacity-90 font-medium">Medication Adherence</div>
                    <div className="text-xs opacity-75 mt-1">
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      {selectedPatient.adherence > 80 ? 'Excellent' : 'Needs Improvement'}
                    </div>
                  </CardContent>
                </Card>
                <Card className={`bg-gradient-to-br ${
                  selectedPatient.riskLevel === 'high' ? 'from-red-500 to-red-600' :
                  selectedPatient.riskLevel === 'medium' ? 'from-orange-500 to-orange-600' :
                  'from-green-500 to-green-600'
                } text-white shadow-lg hover:shadow-xl transition-all border-0`}>
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-90" />
                    <div className="text-3xl font-bold uppercase">{selectedPatient.riskLevel}</div>
                    <div className="text-xs opacity-90 font-medium">Risk Level</div>
                    <div className="text-xs opacity-75 mt-1">
                      {selectedPatient.riskLevel === 'high' ? 'Requires attention' : 
                       selectedPatient.riskLevel === 'medium' ? 'Monitor closely' : 
                       'Under control'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Tabs */}
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
                <CardContent className="p-6">
                  <Tabs defaultValue="history" className="w-full">
                    <TabsList className="mb-6 bg-gray-100 p-1 rounded-xl">
                      <TabsTrigger value="history" className="rounded-lg">Episode History</TabsTrigger>
                      <TabsTrigger value="medications" className="rounded-lg">Medications</TabsTrigger>
                      <TabsTrigger value="reports" className="rounded-lg">Reports & Files</TabsTrigger>
                      <TabsTrigger value="appointments" className="rounded-lg">Appointments</TabsTrigger>
                      <TabsTrigger value="notes" className="rounded-lg">Clinical Notes</TabsTrigger>
                      <TabsTrigger value="communication" className="rounded-lg">Communication</TabsTrigger>
                    </TabsList>

                    {/* Episode History */}
                    <TabsContent value="history">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">Migraine Episode Timeline</h3>
                          <Button variant="default" size="sm" className="rounded-xl">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            View Chart
                          </Button>
                        </div>
                        {episodeHistory.map((episode, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-4 rounded-xl border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all">
                            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mt-2"></div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                                <span className="font-semibold text-gray-800">{episode.date}</span>
                                <Badge variant={episode.severity === 'Severe' ? 'destructive' : episode.severity === 'Moderate' ? 'default' : 'secondary'}>
                                  {episode.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                <Clock className="w-4 h-4 inline mr-1" />
                                Duration: {episode.duration}
                              </p>
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {episode.triggers.map((trigger, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs bg-blue-100 text-blue-700">{trigger}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Medications */}
                    <TabsContent value="medications">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">Current Medications</h3>
                          <Button variant="default" size="sm" className="rounded-xl bg-purple-600 hover:bg-purple-700">
                            <Pill className="w-4 h-4 mr-2" />
                            Add Medication
                          </Button>
                        </div>
                        {medications.map((med, idx) => (
                          <div key={idx} className="p-5 rounded-xl border-2 border-gray-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-bold text-gray-800 text-lg">{med.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{med.frequency}</p>
                              </div>
                              <Badge variant="default" className="bg-teal-100 text-teal-700">{med.adherence}% adherence</Badge>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              Last taken: {med.lastTaken}
                            </p>
                            <div className="mt-3 bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-teal-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${med.adherence}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Reports & Files */}
                    <TabsContent value="reports">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">Investigations & Reports</h3>
                          <Button variant="default" size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload File
                          </Button>
                        </div>
                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-700 font-semibold mb-2">No reports uploaded yet</p>
                          <p className="text-sm text-gray-500 mb-4">Upload MRI scans, blood tests, and other medical reports</p>
                          <Button variant="default" size="sm" className="rounded-xl">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload First Report
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Appointments */}
                    <TabsContent value="appointments">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">Appointment History</h3>
                          <Button variant="default" size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule New
                          </Button>
                        </div>
                        {appointments.map((apt, idx) => (
                          <div key={idx} className="p-5 rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                  <Calendar className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-800">{apt.type}</h4>
                                  <p className="text-sm text-gray-600">{apt.date} • {apt.doctor}</p>
                                </div>
                              </div>
                              <Badge variant={apt.status === 'Completed' ? 'secondary' : 'default'} className="bg-green-100 text-green-700">
                                {apt.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Clinical Notes */}
                    <TabsContent value="notes">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">Clinical Notes & Observations</h3>
                          <Button variant="default" size="sm" className="rounded-xl bg-orange-600 hover:bg-orange-700">
                            <FileText className="w-4 h-4 mr-2" />
                            Add Note
                          </Button>
                        </div>
                        {notes.map((note, idx) => (
                          <div key={idx} className="p-5 rounded-xl border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-bold text-gray-800">{note.author}</span>
                              </div>
                              <span className="text-xs text-gray-500">{note.date}</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{note.note}</p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Communication Log */}
                    <TabsContent value="communication">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">Communication History</h3>
                          <Button variant="default" size="sm" className="rounded-xl bg-pink-600 hover:bg-pink-700">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Send Message
                          </Button>
                        </div>
                        {communications.map((comm, idx) => (
                          <div key={idx} className="p-5 rounded-xl border-2 border-gray-200 hover:border-pink-300 hover:bg-pink-50/50 transition-all">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                                  <MessageSquare className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-gray-800">{comm.type}</h4>
                                    <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700">{comm.channel}</Badge>
                                  </div>
                                  <p className="text-sm text-gray-600">{comm.message}</p>
                                </div>
                              </div>
                              <span className="text-xs text-gray-500">{comm.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 h-full flex items-center justify-center min-h-[600px]">
              <CardContent className="text-center p-12">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Activity className="w-12 h-12 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Select a Patient</h3>
                <p className="text-gray-600 max-w-md mx-auto">Choose a patient from the list to view their complete profile, medical history, and analytics dashboard</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}