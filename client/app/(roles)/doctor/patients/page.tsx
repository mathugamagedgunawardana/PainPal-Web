"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Search,
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
  Edit,
  ChevronRight,
  Heart,
  Zap,
  Shield,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react'
import { EpisodeHistoryTab } from '@/components/doctor/EpisodeHistoryTab'
import { MedicationsTab } from '@/components/doctor/MedicationsTab'
import { AppointmentsTab } from '@/components/doctor/AppointmentsTab'
import { NotesTab } from '@/components/doctor/NotesTab'
import { ReportsTab } from '@/components/doctor/ReportsTab'
import { CommunicationTab } from '@/components/doctor/CommunicationTab'

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

// Medication Groups
const medicationGroups = [
  {
    id: 1,
    name: 'Acute Treatment Protocol',
    type: 'rescue',
    medications: ['Sumatriptan 50mg', 'Topiramate 25mg'],
    color: 'blue',
    adherence: 78
  },
  {
    id: 2,
    name: 'Preventive Care Regimen',
    type: 'preventive',
    medications: ['Topiramate 25mg'],
    color: 'purple',
    adherence: 92
  },
  {
    id: 3,
    name: 'Alternative Relief Protocol',
    type: 'rescue',
    medications: ['Ibuprofen 400mg'],
    color: 'teal',
    adherence: 85
  },
]

const episodeHistory: Array<{ date: string; severity: string; duration: string; triggers: string[]; medicationGroupId: number; medicationGroupName: string; effectiveness: 'high' | 'low' | 'moderate' }> = [
  { date: '2024-12-15', severity: 'Severe', duration: '6 hours', triggers: ['Stress', 'Sleep'], medicationGroupId: 1, medicationGroupName: 'Acute Treatment Protocol', effectiveness: 'low' },
  { date: '2024-12-10', severity: 'Moderate', duration: '4 hours', triggers: ['Weather'], medicationGroupId: 1, medicationGroupName: 'Acute Treatment Protocol', effectiveness: 'moderate' },
  { date: '2024-12-05', severity: 'Mild', duration: '2 hours', triggers: ['Caffeine'], medicationGroupId: 3, medicationGroupName: 'Alternative Relief Protocol', effectiveness: 'high' },
  { date: '2024-11-28', severity: 'Severe', duration: '8 hours', triggers: ['Stress', 'Bright Lights'], medicationGroupId: 1, medicationGroupName: 'Acute Treatment Protocol', effectiveness: 'low' },
]

const medications = [
  { name: 'Sumatriptan 50mg', frequency: 'As needed', adherence: 78, lastTaken: '2024-12-15', groupId: 1 },
  { name: 'Topiramate 25mg', frequency: 'Daily', adherence: 92, lastTaken: '2024-12-16', groupId: 1 },
  { name: 'Ibuprofen 400mg', frequency: 'As needed', adherence: 85, lastTaken: '2024-12-14', groupId: 3 },
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
    <div className="min-h-screen bg-gradient-to-br via-purple-50 to-teal-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1920px] mx-auto space-y-4 sm:space-y-6">
        {/* Search and Filters */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-1 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search patients by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-1 py-1 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={riskFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setRiskFilter('all')}
                className="rounded-xl text-xs sm:text-sm"
              >
                All Patients
              </Button>
              <Button
                variant={riskFilter === 'high' ? 'destructive' : 'outline'}
                onClick={() => setRiskFilter('high')}
                className="rounded-xl text-xs sm:text-sm"
              >
                <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                High Risk
              </Button>
              <Button
                variant={riskFilter === 'medium' ? 'default' : 'outline'}
                onClick={() => setRiskFilter('medium')}
                className="rounded-xl text-xs sm:text-sm"
              >
                Medium
              </Button>
              <Button
                variant={riskFilter === 'low' ? 'secondary' : 'outline'}
                onClick={() => setRiskFilter('low')}
                className="rounded-xl text-xs sm:text-sm"
              >
                Low Risk
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr] gap-4 sm:gap-6">
        {/* Patient List */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-xl font-bold text-gray-800">Patients ({filteredPatients.length})</h2>
            <Badge variant="secondary" className="text-xs sm:text-sm">{filteredPatients.length} Total</Badge>
          </div>
          <div className="space-y-2 max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-300px)] overflow-y-auto pr-1 sm:pr-2">
            {filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                className={`w-full cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] ${
                  selectedPatient?.id === patient.id
                    ? 'border-2 border-purple-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg'
                    : 'border border-gray-200 bg-white/80 backdrop-blur-sm'
                }`}
                onClick={() => setSelectedPatient(patient)}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-3 border-gradient-to-br from-blue-400 to-purple-500 ring-2 ring-white">
                      <AvatarImage src={patient.photo} alt={patient.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-sm sm:text-base">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 truncate text-sm sm:text-base">{patient.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-500">{patient.age} years • {patient.gender}</p>
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
        <div className="w-full min-w-0">
          {selectedPatient ? (
            <div className="space-y-4 sm:space-y-6 max-h-[calc(100vh-180px)] sm:max-h-[calc(100vh-200px)] overflow-y-auto pr-1 sm:pr-2">
              {/* Profile Header */}
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex flex-col md:flex-row items-start gap-4 sm:gap-6">
                    <Avatar className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 border-4 border-gradient-to-br from-blue-500 to-purple-600 ring-4 ring-white shadow-xl">
                      <AvatarImage src={selectedPatient.photo} alt={selectedPatient.name} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-bold">
                        {selectedPatient.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                      <div className="flex items-start justify-between flex-wrap gap-3 sm:gap-4">
                        <div className="min-w-0">
                          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent break-words">{selectedPatient.name}</h2>
                          <p className="text-sm sm:text-base text-gray-600 font-medium mt-1">{selectedPatient.condition}</p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-xs sm:text-sm"
                            onClick={() => window.location.href = '/doctor/patients/analytics'}
                          >
                            <Activity className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">View Analytics</span>
                            <span className="sm:hidden">Analytics</span>
                          </Button>
                          <Button variant="outline" size="sm" className="rounded-xl text-xs sm:text-sm">
                            <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div className="flex items-center gap-2 text-gray-600 min-w-0">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                          <span className="truncate">{selectedPatient.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 min-w-0">
                          <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 flex-shrink-0" />
                          <span className="truncate">{selectedPatient.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 min-w-0">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-teal-500 flex-shrink-0" />
                          <span className="truncate">{selectedPatient.address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500 flex-shrink-0" />
                          <span>Next: {selectedPatient.nextAppointment}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all border-0">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Activity className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 opacity-90" />
                    <div className="text-2xl sm:text-3xl font-bold">{selectedPatient.recentEpisodes}</div>
                    <div className="text-[10px] sm:text-xs opacity-90 font-medium">Recent Episodes</div>
                    <div className="text-[9px] sm:text-xs opacity-75 mt-0.5 sm:mt-1">(Last 30 days)</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all border-0">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Calendar className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 opacity-90" />
                    <div className="text-2xl sm:text-3xl font-bold">{selectedPatient.migraineDays}</div>
                    <div className="text-[10px] sm:text-xs opacity-90 font-medium">Migraine Days</div>
                    <div className="text-[9px] sm:text-xs opacity-75 mt-0.5 sm:mt-1">(This month)</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all border-0">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Pill className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 opacity-90" />
                    <div className="text-2xl sm:text-3xl font-bold">{selectedPatient.adherence}%</div>
                    <div className="text-[10px] sm:text-xs opacity-90 font-medium">Medication Adherence</div>
                    <div className="text-[9px] sm:text-xs opacity-75 mt-0.5 sm:mt-1">
                      <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline mr-0.5 sm:mr-1" />
                      {selectedPatient.adherence > 80 ? 'Excellent' : 'Needs Improvement'}
                    </div>
                  </CardContent>
                </Card>
                <Card className={`bg-gradient-to-br ${
                  selectedPatient.riskLevel === 'high' ? 'from-red-500 to-red-600' :
                  selectedPatient.riskLevel === 'medium' ? 'from-orange-500 to-orange-600' :
                  'from-green-500 to-green-600'
                } text-white shadow-lg hover:shadow-xl transition-all border-0`}>
                  <CardContent className="p-3 sm:p-4 text-center">
                    <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 opacity-90" />
                    <div className="text-2xl sm:text-3xl font-bold uppercase">{selectedPatient.riskLevel}</div>
                    <div className="text-[10px] sm:text-xs opacity-90 font-medium">Risk Level</div>
                    <div className="text-[9px] sm:text-xs opacity-75 mt-0.5 sm:mt-1">
                      {selectedPatient.riskLevel === 'high' ? 'Requires attention' : 
                       selectedPatient.riskLevel === 'medium' ? 'Monitor closely' : 
                       'Under control'}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Patient At-A-Glance Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* Clinical Status Overview */}
                <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
                      Clinical Status
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-gradient-to-r from-red-50 to-transparent border-l-4 border-red-500">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
                          <span className="font-medium text-gray-800 text-xs sm:text-sm truncate">Frequency Status</span>
                        </div>
                        <span className={`text-sm font-bold ${selectedPatient.recentEpisodes > 6 ? 'text-red-600' : 'text-orange-600'}`}>
                          {selectedPatient.recentEpisodes > 6 ? 'High Activity' : 'Moderate'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-gradient-to-r from-blue-50 to-transparent border-l-4 border-blue-500">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                          <span className="font-medium text-gray-800 text-xs sm:text-sm truncate">Medication Compliance</span>
                        </div>
                        <span className={`text-xs sm:text-sm font-bold flex-shrink-0 ${selectedPatient.adherence > 85 ? 'text-green-600' : 'text-orange-600'}`}>
                          {selectedPatient.adherence}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-gradient-to-r from-purple-50 to-transparent border-l-4 border-purple-500">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                          <span className="font-medium text-gray-800 text-xs sm:text-sm truncate">Overall Status</span>
                        </div>
                        <Badge className={`${
                          selectedPatient.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                          selectedPatient.riskLevel === 'medium' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {selectedPatient.riskLevel === 'high' ? '⚠ Monitor' : selectedPatient.riskLevel === 'medium' ? '⚡ Alert' : '✓ Stable'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Triggers & Patterns */}
                <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />
                      Key Triggers & Patterns
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Reported Triggers</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedPatient.triggers.map((trigger, idx) => (
                            <Badge key={idx} className="bg-blue-100 text-blue-700 text-xs">
                              {trigger}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="pt-3 border-t">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Severity Trend</p>
                        <div className="flex gap-1 items-end h-12">
                          {[2, 3, 5, 6, 4, 7, 5].map((val, idx) => (
                            <div
                              key={idx}
                              className="flex-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                              style={{ height: `${(val / 7) * 100}%` }}
                              title={`Day ${idx + 1}: Severity ${val}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Trending: {selectedPatient.recentEpisodes > 6 ? '📈 Increasing' : '📉 Stable'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Active Medications & Next Steps */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                {/* Current Medications */}
                <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 md:col-span-2">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                      <Pill className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                      Medication Groups & Efficacy
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      {medicationGroups.map((group, idx) => {
                        // Calculate efficacy based on episodes using this medication group
                        const episodesOnGroup = episodeHistory.filter(ep => ep.medicationGroupId === group.id)
                        const avgEffectiveness = episodesOnGroup.length > 0
                          ? episodesOnGroup.reduce((acc, ep) => 
                              acc + (ep.effectiveness === 'high' ? 3 : ep.effectiveness === 'moderate' ? 2 : 1), 0
                            ) / episodesOnGroup.length
                          : 0
                        const efficacyScore = Math.round((avgEffectiveness / 3) * 100)
                        
                        return (
                          <div key={idx} className="p-3 sm:p-5 rounded-xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-all hover:border-teal-300">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className={`w-3 h-3 rounded-full ${
                                    group.color === 'blue' ? 'bg-blue-500' :
                                    group.color === 'purple' ? 'bg-purple-500' :
                                    'bg-teal-500'
                                  }`}></div>
                                  <h4 className="font-bold text-gray-800 text-lg">{group.name}</h4>
                                </div>
                                {episodesOnGroup.length > 0 && (
                                  <Badge className="text-xs bg-blue-100 text-blue-700 mb-2">
                                    {episodesOnGroup.length} episode{episodesOnGroup.length > 1 ? 's' : ''} recorded
                                  </Badge>
                                )}
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {group.medications.map((med, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                      {med}
                                    </Badge>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                  <span className="font-semibold">Type:</span> {group.type === 'rescue' ? '🚨 Rescue' : '🛡️ Preventive'}
                                </p>
                              </div>
                              <Badge className={`text-xs font-bold ${
                                group.adherence > 85 ? 'bg-green-100 text-green-700' :
                                group.adherence > 70 ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {group.adherence}% adherence
                              </Badge>
                            </div>
                            
                            {episodesOnGroup.length > 0 && (
                              <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs font-semibold text-gray-600">Group Efficacy Score</span>
                                  <span className={`text-sm font-bold ${
                                    efficacyScore >= 70 ? 'text-green-600' :
                                    efficacyScore >= 50 ? 'text-yellow-600' :
                                    'text-red-600'
                                  }`}>
                                    {efficacyScore}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500 ${
                                      efficacyScore >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                      efficacyScore >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                                      'bg-gradient-to-r from-red-500 to-rose-500'
                                    }`}
                                    style={{ width: `${efficacyScore}%` }}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {efficacyScore >= 70 ? '✓ Highly effective treatment' :
                                   efficacyScore >= 50 ? '⚡ Moderately effective' :
                                   '⚠ Consider alternative treatment'}
                                </p>
                              </div>
                            )}
                            
                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  group.adherence > 85 ? 'bg-green-500' :
                                  group.adherence > 70 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${group.adherence}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions & Next Appointment */}
                <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
                  <CardContent className="p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                      Next Steps
                    </h3>
                    <div className="space-y-2 sm:space-y-3">
                      <div className={`p-3 sm:p-4 rounded-lg border-2 ${
                        new Date(selectedPatient.nextAppointment) < new Date('2024-12-20')
                          ? 'border-red-200 bg-red-50'
                          : 'border-green-200 bg-green-50'
                      }`}>
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Upcoming</p>
                        <p className="font-bold text-gray-800 text-sm sm:text-base">{selectedPatient.nextAppointment}</p>
                        <p className="text-xs text-gray-500 mt-1">📅 Appointment scheduled</p>
                      </div>
                      <Button className="w-full rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold text-xs sm:text-sm">
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Send Message
                      </Button>
                      <Button variant="outline" className="w-full rounded-lg text-xs sm:text-sm">
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Add Note
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Tabs */}
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
                <CardContent className="p-4 sm:p-6">
                  <Tabs defaultValue="history" className="w-full">
                    <TabsList className="mb-4 sm:mb-6 bg-gray-100 p-1 rounded-xl flex flex-wrap w-full justify-start">
                      <TabsTrigger value="history" className="rounded-lg flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Episode History</span>
                        <span className="xs:hidden">History</span>
                      </TabsTrigger>
                      <TabsTrigger value="medications" className="rounded-lg flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3">
                        <Pill className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Medications</span>
                        <span className="xs:hidden">Meds</span>
                      </TabsTrigger>
                      <TabsTrigger value="appointments" className="rounded-lg flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Appointments</span>
                        <span className="xs:hidden">Appts</span>
                      </TabsTrigger>
                      <TabsTrigger value="notes" className="rounded-lg flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3">
                        <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                        Notes
                      </TabsTrigger>
                      <TabsTrigger value="reports" className="rounded-lg flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3">
                        <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Reports</span>
                        <span className="xs:hidden">Files</span>
                      </TabsTrigger>
                      <TabsTrigger value="communication" className="rounded-lg flex items-center gap-1 text-xs sm:text-sm px-2 sm:px-3">
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Communication</span>
                        <span className="xs:hidden">Comm</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* Episode History */}
                    <TabsContent value="history">
                      <EpisodeHistoryTab episodeHistory={episodeHistory} medicationGroups={medicationGroups} />
                    </TabsContent>

                    {/* Medications */}
                    <TabsContent value="medications">
                      <MedicationsTab medications={medications} />
                    </TabsContent>

                    {/* Reports & Files */}
                    <TabsContent value="reports">
                      <ReportsTab />
                    </TabsContent>

                    {/* Appointments */}
                    <TabsContent value="appointments">
                      <AppointmentsTab appointments={appointments} />
                    </TabsContent>

                    {/* Clinical Notes */}
                    <TabsContent value="notes">
                      <NotesTab notes={notes} />
                    </TabsContent>

                    {/* Communication Log */}
                    <TabsContent value="communication">
                      <CommunicationTab communications={communications} />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 h-full flex items-center justify-center min-h-[400px] sm:min-h-[500px] md:min-h-[600px]">
              <CardContent className="text-center p-6 sm:p-8 md:p-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Activity className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-purple-600" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">Select a Patient</h3>
                <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto px-4">Choose a patient from the list to view their complete profile, medical history, and analytics dashboard</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}