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
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-(--color-blue)">Patient Management</h1>
          <p className="text-(--color-mint)">Manage and monitor your migraine patients</p>
        </div>
        <Button variant="lavender" size="lg" className="rounded-full">
          <UserPlus className="mr-2" />
          Add New Patient
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white shadow-lg border border-(--color-soft-blue)">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-(--color-mint) w-5 h-5" />
              <input
                type="text"
                placeholder="Search patients by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-(--color-mint) focus:outline-none focus:ring-2 focus:ring-(--color-lavender)"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={riskFilter === 'all' ? 'mint' : 'outline'}
                onClick={() => setRiskFilter('all')}
                className="rounded-full"
              >
                All
              </Button>
              <Button
                variant={riskFilter === 'high' ? 'lavender' : 'outline'}
                onClick={() => setRiskFilter('high')}
                className="rounded-full"
              >
                High Risk
              </Button>
              <Button
                variant={riskFilter === 'medium' ? 'teal' : 'outline'}
                onClick={() => setRiskFilter('medium')}
                className="rounded-full"
              >
                Medium
              </Button>
              <Button
                variant={riskFilter === 'low' ? 'mint' : 'outline'}
                onClick={() => setRiskFilter('low')}
                className="rounded-full"
              >
                Low Risk
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-(--color-blue)">Patients ({filteredPatients.length})</h2>
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
            {filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedPatient?.id === patient.id
                    ? 'border-2 border-(--color-lavender) bg-(--color-soft-blue)'
                    : 'border border-(--color-mint)'
                }`}
                onClick={() => setSelectedPatient(patient)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-(--color-mint)">
                      <AvatarImage src={patient.photo} alt={patient.name} />
                      <AvatarFallback className="bg-(--color-lavender) text-white">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-(--color-blue) truncate">{patient.name}</h3>
                      <p className="text-sm text-(--color-mint)">{patient.age} years • {patient.gender}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={
                          patient.riskLevel === 'high' ? 'destructive' :
                          patient.riskLevel === 'medium' ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {patient.riskLevel}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-(--color-mint)" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Patient Profile Details */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <div className="space-y-6">
              {/* Profile Header */}
              <Card className="bg-white shadow-lg border border-(--color-soft-blue)">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <Avatar className="w-24 h-24 border-4 border-(--color-lavender)">
                      <AvatarImage src={selectedPatient.photo} alt={selectedPatient.name} />
                      <AvatarFallback className="bg-(--color-lavender) text-white text-2xl">
                        {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="text-2xl font-bold text-(--color-blue)">{selectedPatient.name}</h2>
                          <p className="text-(--color-mint)">{selectedPatient.condition}</p>
                        </div>
                        <Button variant="mint" size="sm" className="rounded-full">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-(--color-mint)" />
                          <span className="text-sm text-(--color-blue)">{selectedPatient.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-(--color-mint)" />
                          <span className="text-sm text-(--color-blue)">{selectedPatient.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-(--color-mint)" />
                          <span className="text-sm text-(--color-blue)">{selectedPatient.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-(--color-mint)" />
                          <span className="text-sm text-(--color-blue)">Next: {selectedPatient.nextAppointment}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-(--color-lavender) text-white shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Activity className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{selectedPatient.recentEpisodes}</div>
                    <div className="text-xs">Episodes (30d)</div>
                  </CardContent>
                </Card>
                <Card className="bg-(--color-teal) text-white shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Calendar className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{selectedPatient.migraineDays}</div>
                    <div className="text-xs">Migraine Days</div>
                  </CardContent>
                </Card>
                <Card className="bg-(--color-mint) text-white shadow-lg">
                  <CardContent className="p-4 text-center">
                    <Pill className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{selectedPatient.adherence}%</div>
                    <div className="text-xs">Med Adherence</div>
                  </CardContent>
                </Card>
                <Card className="bg-(--color-purple) text-white shadow-lg">
                  <CardContent className="p-4 text-center">
                    <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                    <div className="text-2xl font-bold uppercase">{selectedPatient.riskLevel}</div>
                    <div className="text-xs">Risk Level</div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Tabs */}
              <Card className="bg-white shadow-lg border border-(--color-soft-blue)">
                <CardContent className="p-6">
                  <Tabs defaultValue="history">
                    <TabsList className="mb-6">
                      <TabsTrigger value="history">Episode History</TabsTrigger>
                      <TabsTrigger value="medications">Medications</TabsTrigger>
                      <TabsTrigger value="reports">Reports & Files</TabsTrigger>
                      <TabsTrigger value="appointments">Appointments</TabsTrigger>
                      <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
                      <TabsTrigger value="communication">Communication</TabsTrigger>
                    </TabsList>

                    {/* Episode History */}
                    <TabsContent value="history">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-(--color-blue)">Migraine Episode Timeline</h3>
                          <Button variant="mint" size="sm" className="rounded-full">View Chart</Button>
                        </div>
                        {episodeHistory.map((episode, idx) => (
                          <div key={idx} className="flex items-start gap-4 p-4 rounded-lg border border-(--color-mint) hover:bg-(--color-soft-blue) transition">
                            <div className="w-2 h-2 rounded-full bg-(--color-lavender) mt-2"></div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-(--color-blue)">{episode.date}</span>
                                <Badge variant={episode.severity === 'Severe' ? 'destructive' : episode.severity === 'Moderate' ? 'default' : 'secondary'}>
                                  {episode.severity}
                                </Badge>
                              </div>
                              <p className="text-sm text-(--color-mint)">Duration: {episode.duration}</p>
                              <div className="flex gap-2 mt-2">
                                {episode.triggers.map((trigger, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{trigger}</Badge>
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
                          <h3 className="text-lg font-semibold text-(--color-blue)">Current Medications</h3>
                          <Button variant="lavender" size="sm" className="rounded-full">Add Medication</Button>
                        </div>
                        {medications.map((med, idx) => (
                          <div key={idx} className="p-4 rounded-lg border border-(--color-mint) hover:bg-(--color-soft-blue) transition">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-semibold text-(--color-blue)">{med.name}</h4>
                                <p className="text-sm text-(--color-mint)">{med.frequency}</p>
                              </div>
                              <Badge variant="default">{med.adherence}% adherence</Badge>
                            </div>
                            <p className="text-xs text-(--color-mint)">Last taken: {med.lastTaken}</p>
                            <div className="mt-2 bg-(--color-soft-blue) rounded-full h-2">
                              <div
                                className="bg-(--color-mint) h-2 rounded-full transition-all"
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
                          <h3 className="text-lg font-semibold text-(--color-blue)">Investigations & Reports</h3>
                          <Button variant="teal" size="sm" className="rounded-full">
                            <Upload className="w-4 h-4 mr-2" />
                            Upload File
                          </Button>
                        </div>
                        <div className="border-2 border-dashed border-(--color-mint) rounded-lg p-8 text-center">
                          <FileText className="w-12 h-12 text-(--color-mint) mx-auto mb-4" />
                          <p className="text-(--color-blue) mb-2">No reports uploaded yet</p>
                          <p className="text-sm text-(--color-mint) mb-4">Upload MRI scans, blood tests, and other medical reports</p>
                          <Button variant="mint" size="sm" className="rounded-full">
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
                          <h3 className="text-lg font-semibold text-(--color-blue)">Appointment History</h3>
                          <Button variant="purple" size="sm" className="rounded-full">Schedule New</Button>
                        </div>
                        {appointments.map((apt, idx) => (
                          <div key={idx} className="p-4 rounded-lg border border-(--color-mint) hover:bg-(--color-soft-blue) transition">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-(--color-mint)" />
                                <div>
                                  <h4 className="font-semibold text-(--color-blue)">{apt.type}</h4>
                                  <p className="text-sm text-(--color-mint)">{apt.date} • {apt.doctor}</p>
                                </div>
                              </div>
                              <Badge variant={apt.status === 'Completed' ? 'default' : 'secondary'}>
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
                          <h3 className="text-lg font-semibold text-(--color-blue)">Clinical Notes & Observations</h3>
                          <Button variant="blue" size="sm" className="rounded-full">Add Note</Button>
                        </div>
                        {notes.map((note, idx) => (
                          <div key={idx} className="p-4 rounded-lg border border-(--color-mint) hover:bg-(--color-soft-blue) transition">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-(--color-mint)" />
                                <span className="text-sm font-semibold text-(--color-blue)">{note.author}</span>
                              </div>
                              <span className="text-xs text-(--color-mint)">{note.date}</span>
                            </div>
                            <p className="text-sm text-(--color-blue)">{note.note}</p>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Communication Log */}
                    <TabsContent value="communication">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-(--color-blue)">Communication History</h3>
                          <Button variant="lavender" size="sm" className="rounded-full">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Send Message
                          </Button>
                        </div>
                        {communications.map((comm, idx) => (
                          <div key={idx} className="p-4 rounded-lg border border-(--color-mint) hover:bg-(--color-soft-blue) transition">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <MessageSquare className="w-5 h-5 text-(--color-mint)" />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-(--color-blue)">{comm.type}</h4>
                                    <Badge variant="secondary" className="text-xs">{comm.channel}</Badge>
                                  </div>
                                  <p className="text-sm text-(--color-mint)">{comm.message}</p>
                                </div>
                              </div>
                              <span className="text-xs text-(--color-mint)">{comm.date}</span>
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
            <Card className="bg-white shadow-lg border border-(--color-soft-blue) h-full flex items-center justify-center">
              <CardContent className="text-center p-12">
                <Activity className="w-16 h-16 text-(--color-mint) mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-(--color-blue) mb-2">Select a Patient</h3>
                <p className="text-(--color-mint)">Choose a patient from the list to view their complete profile and medical history</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}