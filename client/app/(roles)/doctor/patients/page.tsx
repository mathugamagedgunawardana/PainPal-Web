"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
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
  Loader2,
  PanelLeft,
  PanelLeftClose,
  Users,
} from 'lucide-react'
import { EpisodeHistoryTab } from '@/components/doctor/EpisodeHistoryTab'
import { MedicationsTab, type MedicationGroupRow } from '@/components/doctor/MedicationsTab'
import {
  AppointmentsTab,
  type AppointmentRow,
  type UnlinkedNoteRow,
  type UnlinkedCommRow,
} from '@/components/doctor/AppointmentsTab'
import { ReportsTab } from '@/components/doctor/ReportsTab'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { FloatingChatIcon } from '@/components/chat/FloatingChatIcon'
import PatientAnalyticsPredictionPage from '@/components/doctor/PatientAnalyticsPredictionPage'
import { DoctorPatientAiSummaryCard } from '@/components/doctor/DoctorPatientAiSummaryCard'
import { cn } from '@/lib/utils'

const DOCTOR_PATIENTS_LIST_COLLAPSED_KEY = 'doctor-patients-list-collapsed'

export type PatientListItem = {
  id: string
  name: string
  age?: number
  gender?: string
  photo?: string
  riskLevel: string
  lastVisit?: string
  nextAppointment?: string
  phone?: string
  email?: string
  address?: string
  migraineDays?: number
  adherence?: number
  triggers?: string[]
  currentMeds?: string[]
  recentEpisodes?: number
  condition?: string
}

type EpisodeHistoryItem = {
  date: string
  severity: string
  duration: string
  triggers: string[]
  mostIntenseSymptoms: string[]
  medicationsTakenDuringPeriod: string[]
  notes?: string
}

type MedicationItem = { name: string; frequency: string; adherence: number; lastTaken: string; groupId: number }
export default function PatientsPage() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [riskFilter, setRiskFilter] = useState('all')
  const [patients, setPatients] = useState<PatientListItem[]>([])
  const [patientsLoading, setPatientsLoading] = useState(true)
  const [patientsError, setPatientsError] = useState<string | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null)
  const [detailData, setDetailData] = useState<{
    episodeHistory: EpisodeHistoryItem[]
    medications: MedicationItem[]
    medicationGroups: MedicationGroupRow[]
    appointments: AppointmentRow[]
    unlinkedNotes: UnlinkedNoteRow[]
    unlinkedCommunications: UnlinkedCommRow[]
  } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [patientListCollapsed, setPatientListCollapsed] = useState(false)
  const [modelSyncRunning, setModelSyncRunning] = useState(false)
  const [modelSyncPending, setModelSyncPending] = useState(0)

  useEffect(() => {
    try {
      setPatientListCollapsed(localStorage.getItem(DOCTOR_PATIENTS_LIST_COLLAPSED_KEY) === '1')
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const poll = async () => {
      let nextMs = 10000
      try {
        const res = await fetch('/api/model/sync-status', { credentials: 'include', cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as { running?: boolean; pendingSeedEvents?: number }
        const running = Boolean(data.running)
        nextMs = running ? 2500 : 10000
        if (!cancelled) {
          setModelSyncRunning(running)
          setModelSyncPending(typeof data.pendingSeedEvents === 'number' ? data.pendingSeedEvents : 0)
        }
      } catch {
        // Ignore transient polling errors in UI.
      } finally {
        if (!cancelled) {
          timer = setTimeout(poll, nextMs)
        }
      }
    }

    void poll()
    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [])

  const togglePatientListCollapsed = useCallback(() => {
    setPatientListCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(DOCTOR_PATIENTS_LIST_COLLAPSED_KEY, next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    setPatientsLoading(true)
    setPatientsError(null)
    fetch('/api/patients', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to load patients')
        return res.json()
      })
      .then((data: PatientListItem[]) => {
        if (!cancelled) setPatients(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        if (!cancelled) setPatientsError(err.message ?? 'Failed to load patients')
      })
      .finally(() => {
        if (!cancelled) setPatientsLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const fetchPatientDetail = useCallback((patientId: string) => {
    setDetailLoading(true)
    setDetailError(null)
    setDetailData(null)
    fetch(`/api/patients/${patientId}`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 404 ? 'Patient not found' : 'Failed to load patient detail')
        return res.json()
      })
      .then((data: {
        profile: PatientListItem
        episodeHistory: EpisodeHistoryItem[]
        medications: MedicationItem[]
        medicationGroups?: MedicationGroupRow[]
        appointments: AppointmentRow[]
        unlinkedNotes?: UnlinkedNoteRow[]
        unlinkedCommunications?: UnlinkedCommRow[]
      }) => {
        setSelectedPatient(data.profile)
        setDetailData({
          episodeHistory: data.episodeHistory ?? [],
          medications: data.medications ?? [],
          medicationGroups: data.medicationGroups ?? [],
          appointments: data.appointments ?? [],
          unlinkedNotes: data.unlinkedNotes ?? [],
          unlinkedCommunications: data.unlinkedCommunications ?? [],
        })
      })
      .catch((err) => {
        setDetailError(err.message ?? 'Failed to load patient detail')
      })
      .finally(() => {
        setDetailLoading(false)
      })
  }, [])

  useEffect(() => {
    const id = searchParams.get('patient')
    if (!id || patients.length === 0) return
    if (!patients.some((p) => p.id === id)) return
    if (selectedPatient?.id === id) return
    fetchPatientDetail(id)
  }, [searchParams, patients, selectedPatient?.id, fetchPatientDetail])

  const handleSelectPatient = (patient: PatientListItem) => {
    if (selectedPatient?.id === patient.id) return
    setSelectedPatient(patient)
    fetchPatientDetail(patient.id)
  }

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRisk = riskFilter === 'all' || patient.riskLevel === riskFilter
    return matchesSearch && matchesRisk
  })

  const episodeHistory = detailData?.episodeHistory ?? []
  const medicationGroups = detailData?.medicationGroups ?? []
  const appointments = detailData?.appointments ?? []
  const unlinkedNotes = detailData?.unlinkedNotes ?? []
  const unlinkedCommunications = detailData?.unlinkedCommunications ?? []

  return (
    <div className="min-h-screen bg-gradient-to-br via-purple-50 to-teal-50 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-[1920px] mx-auto space-y-4 sm:space-y-6">
        {/* Search and Filters */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
          <CardContent className=" sm:p-6">
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
              {modelSyncRunning && (
                <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs sm:text-sm">
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" />
                  Model processing{modelSyncPending > 0 ? ` (${modelSyncPending})` : ''}
                </Badge>
              )}
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

      <div
        className={cn(
          'grid gap-4 sm:gap-6',
          patientListCollapsed
            ? 'grid-cols-1 lg:grid-cols-[52px_1fr]'
            : 'grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]'
        )}
      >
        {/* Patient list column: narrow rail when collapsed (desktop only) */}
        <div className="min-w-0 flex flex-col gap-3 lg:gap-0">
          {patientListCollapsed && (
            <div className="hidden lg:flex flex-col items-center gap-3 sticky top-4 self-start w-full max-h-[calc(100vh-10rem)] rounded-xl border border-gray-200 bg-white/90 shadow-sm py-3 px-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="shrink-0 rounded-lg border-purple-200 text-purple-700 hover:bg-purple-50"
                onClick={togglePatientListCollapsed}
                aria-label="Expand patient list"
                title="Show patient list"
              >
                <PanelLeft className="h-5 w-5" />
              </Button>
              <Users className="h-5 w-5 text-purple-600 shrink-0" aria-hidden />
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-semibold tabular-nums">
                {filteredPatients.length}
              </Badge>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 [writing-mode:vertical-rl] rotate-180 select-none">
                Patients
              </span>
            </div>
          )}

          <div className={cn('space-y-3 sm:space-y-4', patientListCollapsed && 'lg:hidden')}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base sm:text-xl font-bold text-gray-800">Patients ({filteredPatients.length})</h2>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="secondary" className="text-xs sm:text-sm">{filteredPatients.length} Total</Badge>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="hidden lg:inline-flex rounded-lg border-gray-200 text-gray-600 hover:bg-gray-100"
                onClick={togglePatientListCollapsed}
                aria-expanded={!patientListCollapsed}
                aria-label={patientListCollapsed ? 'Expand patient list' : 'Collapse patient list'}
                title={patientListCollapsed ? 'Expand patient list' : 'Collapse patient list'}
              >
                {patientListCollapsed ? (
                  <PanelLeft className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2 max-h-[calc(100vh-280px)] sm:max-h-[calc(100vh-300px)] overflow-y-auto pr-1 sm:pr-2">
            {patientsError && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{patientsError}</p>
            )}
            {patientsLoading && !patientsError && (
              <p className="text-sm text-gray-500 p-3">Loading patients…</p>
            )}
            {!patientsLoading && !patientsError && filteredPatients.length === 0 && (
              <p className="text-sm text-gray-500 p-3">No patients found.</p>
            )}
            {!patientsLoading && filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                className={`w-full cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] ${
                  selectedPatient?.id === patient.id
                    ? 'border-2 border-purple-500 bg-gradient-to-br from-blue-50 to-purple-50 shadow-lg'
                    : 'border border-gray-200 bg-white/80 backdrop-blur-sm'
                }`}
                onClick={() => handleSelectPatient(patient)}
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
                      <p className="text-xs sm:text-sm text-gray-500">{patient.age != null ? `${patient.age} years` : '—'} • {patient.gender ?? '—'}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">Last: {patient.lastVisit ?? '—'}</span>
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
        </div>

        {/* Patient Profile Details */}
        <div className="w-full min-w-0">
          {selectedPatient ? (
            <div className="space-y-4 sm:space-y-6 pr-1 sm:pr-2">
              {detailLoading && (
                <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
                  <CardContent className="p-6 text-center text-gray-500">
                    Loading patient detail…
                  </CardContent>
                </Card>
              )}
              {detailError && !detailLoading && (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4 text-red-700">
                    {detailError}
                  </CardContent>
                </Card>
              )}
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
                          <span>Next appointment: {selectedPatient.nextAppointment ?? '—'}</span>
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
                    <div className="text-2xl sm:text-3xl font-bold">{selectedPatient.recentEpisodes ?? 0}</div>
                    <div className="text-[10px] sm:text-xs opacity-90 font-medium">Recent Episodes</div>
                    <div className="text-[9px] sm:text-xs opacity-75 mt-0.5 sm:mt-1">(Last 30 days)</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all border-0">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Calendar className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 opacity-90" />
                    <div className="text-2xl sm:text-3xl font-bold">{selectedPatient.migraineDays ?? 0}</div>
                    <div className="text-[10px] sm:text-xs opacity-90 font-medium">Migraine Days</div>
                    <div className="text-[9px] sm:text-xs opacity-75 mt-0.5 sm:mt-1">(This month)</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all border-0">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Pill className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 opacity-90" />
                    <div className="text-2xl sm:text-3xl font-bold">{selectedPatient.adherence ?? 0}%</div>
                    <div className="text-[10px] sm:text-xs opacity-90 font-medium">Medication Adherence</div>
                    <div className="text-[9px] sm:text-xs opacity-75 mt-0.5 sm:mt-1">
                      <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline mr-0.5 sm:mr-1" />
                      {(selectedPatient.adherence ?? 0) > 80 ? 'Excellent' : 'Needs Improvement'}
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

              <section
                id="patient-migraine-analytics"
                className="scroll-mt-6"
                aria-label="Migraine prediction analytics"
              >
                <PatientAnalyticsPredictionPage embedded patientId={selectedPatient.id} patientName={selectedPatient.name} />
              </section>

              <section className="scroll-mt-6" aria-label="AI clinical summary">
                <DoctorPatientAiSummaryCard patientId={selectedPatient.id} />
              </section>

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
                        <span className={`text-sm font-bold ${(selectedPatient.recentEpisodes ?? 0) > 6 ? 'text-red-600' : 'text-orange-600'}`}>
                          {(selectedPatient.recentEpisodes ?? 0) > 6 ? 'High Activity' : 'Moderate'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-gradient-to-r from-blue-50 to-transparent border-l-4 border-blue-500">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                          <span className="font-medium text-gray-800 text-xs sm:text-sm truncate">Medication Compliance</span>
                        </div>
                        <span className={`text-xs sm:text-sm font-bold flex-shrink-0 ${(selectedPatient.adherence ?? 0) > 85 ? 'text-green-600' : 'text-orange-600'}`}>
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
                          {(selectedPatient.triggers ?? []).map((trigger, idx) => (
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
                        <p className="text-xs text-gray-500 mt-2">Trending: {(selectedPatient.recentEpisodes ?? 0) > 6 ? '📈 Increasing' : '📉 Stable'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Tabs */}
              <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0">
                <CardContent className="p-4 sm:p-6">
                  <Tabs defaultValue="clinical" className="w-full">
                    <TabsList className="mb-4 sm:mb-6 bg-gray-100 p-1 rounded-xl flex flex-wrap w-full justify-start gap-1">
                      <TabsTrigger value="clinical" className="rounded-lg flex items-center gap-1.5 text-xs sm:text-sm px-3 sm:px-4">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        <Pill className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        <span className="hidden sm:inline">History & medications</span>
                        <span className="sm:hidden">History & meds</span>
                      </TabsTrigger>
                      <TabsTrigger value="care" className="rounded-lg flex items-center gap-1 text-xs sm:text-sm px-3 sm:px-4">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
                        <span className="hidden sm:inline">Appointments & visit records</span>
                        <span className="sm:hidden">Visits</span>
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="clinical" className="space-y-8 mt-0">
                      <section aria-labelledby="patient-episode-history-heading">
                        <h3 id="patient-episode-history-heading" className="sr-only">
                          Migraine episode history
                        </h3>
                        <EpisodeHistoryTab episodeHistory={episodeHistory} />
                      </section>
                      <section aria-labelledby="patient-medications-heading">
                        <h3 id="patient-medications-heading" className="sr-only">
                          Medications
                        </h3>
                        <MedicationsTab
                          patientId={selectedPatient.id}
                          groups={medicationGroups}
                          onSaved={() => fetchPatientDetail(selectedPatient.id)}
                        />
                      </section>
                    </TabsContent>

                    <TabsContent value="care" className="mt-0 space-y-8">
                      <AppointmentsTab
                        patientId={selectedPatient.id}
                        appointments={appointments}
                        unlinkedNotes={unlinkedNotes}
                        unlinkedCommunications={unlinkedCommunications}
                        onUpdated={() => fetchPatientDetail(selectedPatient.id)}
                      />
                      <ReportsTab />
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
                <p className="text-sm sm:text-base text-gray-600 max-w-md mx-auto px-4">Choose a patient from the list to view their complete profile, medical history, and migraine prediction analytics on the same page.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {selectedPatient && (
        <FloatingChatIcon
          onClick={() => setChatOpen(true)}
          aria-label={`Chat with ${selectedPatient.name}`}
        />
      )}

      <ChatPanel
        patientId={selectedPatient?.id}
        otherPartyName={selectedPatient?.name ?? 'Patient'}
        currentUserRole="DOCTOR"
        open={chatOpen && !!selectedPatient}
        onClose={() => setChatOpen(false)}
      />
    </div>
    </div>
  )
}