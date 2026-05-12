'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Calendar,
  Loader2,
  UserCheck,
  UserX,
  CheckCircle2,
  FileText,
  MessageSquare,
  Paperclip,
} from 'lucide-react'

export type AppointmentClinicalNoteRow = {
  id: string
  date: string
  note: string
  author: string
}

export type AppointmentCommunicationRow = {
  id: string
  date: string
  type: string
  message: string
  channel: string
  author?: string
}

export type AppointmentFileRow = {
  id: string
  title: string
  fileUrl?: string | null
  fileName?: string | null
  createdAt: string
  uploadedBy?: string
}

export type AppointmentRow = {
  id: string
  date: string
  type: string
  doctor: string
  status: string
  patientPresent?: boolean | null
  visitNotes?: string | null
  clinicalNotes?: AppointmentClinicalNoteRow[]
  communications?: AppointmentCommunicationRow[]
  files?: AppointmentFileRow[]
}

export type UnlinkedNoteRow = { id: string; date: string; note: string; author: string }
export type UnlinkedCommRow = {
  id: string
  date: string
  type: string
  message: string
  channel: string
  author?: string
}

const TYPE_OPTIONS = ['Follow-up', 'Regular Check-up', 'Initial Consultation', 'Consultation'] as const

function statusLabel(status: string): string {
  const u = status.toUpperCase()
  if (u === 'SCHEDULED') return 'Scheduled'
  if (u === 'COMPLETED') return 'Completed'
  if (u === 'CANCELLED') return 'Cancelled'
  return status
}

function toDatetimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface AppointmentsTabProps {
  patientId: string
  appointments: AppointmentRow[]
  unlinkedNotes?: UnlinkedNoteRow[]
  unlinkedCommunications?: UnlinkedCommRow[]
  onUpdated?: () => void
}

export function AppointmentsTab({
  patientId,
  appointments,
  unlinkedNotes = [],
  unlinkedCommunications = [],
  onUpdated,
}: AppointmentsTabProps) {
  const [busyId, setBusyId] = useState<string | null>(null)
  const [postingKind, setPostingKind] = useState<{ appointmentId: string; kind: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  const defaultDatetimeLocal = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(9, 0, 0, 0)
    return toDatetimeLocalValue(d)
  }, [])

  const [visitAt, setVisitAt] = useState(defaultDatetimeLocal)
  const [visitType, setVisitType] = useState<string>(TYPE_OPTIONS[0])
  const [customType, setCustomType] = useState('')
  const [visitNotes, setVisitNotes] = useState('')

  const [visitDrafts, setVisitDrafts] = useState<Record<string, string>>({})
  const [newClinical, setNewClinical] = useState<Record<string, string>>({})
  const [newComm, setNewComm] = useState<Record<string, string>>({})
  const [newFileTitle, setNewFileTitle] = useState<Record<string, string>>({})
  const [newFileUrl, setNewFileUrl] = useState<Record<string, string>>({})
  const [newFileName, setNewFileName] = useState<Record<string, string>>({})

  useEffect(() => {
    setVisitDrafts(Object.fromEntries(appointments.map((a) => [a.id, a.visitNotes ?? ''])))
  }, [appointments])

  const patch = async (appointmentId: string, body: Record<string, unknown>) => {
    setError(null)
    setBusyId(appointmentId)
    try {
      const res = await fetch(`/api/patients/${patientId}/appointments/${appointmentId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error ?? `Request failed (${res.status})`)
      }
      onUpdated?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  const postToAppointment = async (
    appointmentId: string,
    path: string,
    body: Record<string, unknown>,
    kind: string
  ) => {
    setError(null)
    setPostingKind({ appointmentId, kind })
    try {
      const res = await fetch(`/api/patients/${patientId}/appointments/${appointmentId}/${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error ?? `Request failed (${res.status})`)
      }
      onUpdated?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setPostingKind(null)
    }
  }

  const createAppointment = async () => {
    const appointmentType = visitType === 'Other' ? customType.trim() : visitType
    if (!appointmentType) {
      setError('Please enter an appointment type.')
      return
    }
    const appointmentDate = new Date(visitAt)
    if (Number.isNaN(appointmentDate.getTime())) {
      setError('Please choose a valid date and time.')
      return
    }
    setError(null)
    setCreating(true)
    try {
      const res = await fetch(`/api/patients/${patientId}/appointments`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentDate: appointmentDate.toISOString(),
          appointmentType,
          notes: visitNotes.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error ?? `Request failed (${res.status})`)
      }
      setScheduleOpen(false)
      setVisitNotes('')
      setVisitType(TYPE_OPTIONS[0])
      setCustomType('')
      setVisitAt(defaultDatetimeLocal)
      onUpdated?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not schedule appointment')
    } finally {
      setCreating(false)
    }
  }

  const saveVisitNotes = (appointmentId: string) => {
    void patch(appointmentId, { notes: visitDrafts[appointmentId] ?? '' })
  }

  const addClinicalNote = async (appointmentId: string) => {
    const text = (newClinical[appointmentId] ?? '').trim()
    if (!text) {
      setError('Enter note text before saving.')
      return
    }
    await postToAppointment(appointmentId, 'clinical-notes', { noteContent: text }, 'clinical')
    setNewClinical((m) => ({ ...m, [appointmentId]: '' }))
  }

  const addCommunication = async (appointmentId: string) => {
    const text = (newComm[appointmentId] ?? '').trim()
    if (!text) {
      setError('Enter a comment before saving.')
      return
    }
    await postToAppointment(appointmentId, 'communications', { message: text }, 'comm')
    setNewComm((m) => ({ ...m, [appointmentId]: '' }))
  }

  const addFile = async (appointmentId: string) => {
    const title = (newFileTitle[appointmentId] ?? '').trim()
    if (!title) {
      setError('File title is required.')
      return
    }
    const fileUrl = (newFileUrl[appointmentId] ?? '').trim()
    const fileName = (newFileName[appointmentId] ?? '').trim()
    await postToAppointment(appointmentId, 'files', {
      title,
      fileUrl: fileUrl || undefined,
      fileName: fileName || undefined,
    }, 'file')
    setNewFileTitle((m) => ({ ...m, [appointmentId]: '' }))
    setNewFileUrl((m) => ({ ...m, [appointmentId]: '' }))
    setNewFileName((m) => ({ ...m, [appointmentId]: '' }))
  }

  const isScheduled = (s: string) => s.toUpperCase() === 'SCHEDULED'
  const posting = (aptId: string, kind: string) =>
    postingKind?.appointmentId === aptId && postingKind.kind === kind

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Appointments & visit records
        </h3>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
          onClick={() => {
            setScheduleOpen((o) => !o)
            setError(null)
          }}
        >
          <Calendar className="w-4 h-4 mr-2" />
          {scheduleOpen ? 'Close' : 'Schedule New'}
        </Button>
      </div>

      {(unlinkedNotes.length > 0 || unlinkedCommunications.length > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm space-y-2">
          <p className="font-medium text-amber-900">Not linked to a specific visit</p>
          <p className="text-amber-800/90 text-xs">
            Older records may appear here until they are associated with an appointment in the database.
          </p>
          {unlinkedNotes.length > 0 && (
            <ul className="mt-2 space-y-1 text-gray-800">
              {unlinkedNotes.map((n) => (
                <li key={n.id} className="text-xs sm:text-sm">
                  <span className="text-gray-500">{n.date}</span> — {n.author}: {n.note}
                </li>
              ))}
            </ul>
          )}
          {unlinkedCommunications.length > 0 && (
            <ul className="mt-2 space-y-1 text-gray-800">
              {unlinkedCommunications.map((c) => (
                <li key={c.id} className="text-xs sm:text-sm">
                  <span className="text-gray-500">{c.date}</span> — [{c.type}] {c.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {scheduleOpen && (
        <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/60 p-4 space-y-3 shadow-sm">
          <p className="text-sm font-medium text-gray-800">New appointment</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-600 block mb-1">Date & time</label>
              <Input
                type="datetime-local"
                value={visitAt}
                onChange={(e) => setVisitAt(e.target.value)}
                className="bg-white"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Type</label>
              <select
                className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                value={visitType}
                onChange={(e) => setVisitType(e.target.value)}
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                <option value="Other">Other…</option>
              </select>
            </div>
            {visitType === 'Other' && (
              <div>
                <label className="text-xs text-gray-600 block mb-1">Custom type</label>
                <Input
                  placeholder="e.g. Telehealth review"
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  className="bg-white"
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="text-xs text-gray-600 block mb-1">Visit notes (optional)</label>
              <textarea
                className="w-full min-h-[72px] rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                placeholder="Instructions for patient or staff…"
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700"
              disabled={creating}
              onClick={() => void createAppointment()}
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Create appointment
            </Button>
            <Button type="button" size="sm" variant="outline" className="rounded-lg" onClick={() => setScheduleOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}
      {appointments.length === 0 && !scheduleOpen && (
        <p className="text-sm text-gray-500">No appointments yet. Use Schedule New to add one.</p>
      )}
      {appointments.map((apt) => {
        const scheduled = isScheduled(apt.status)
        const attended = apt.patientPresent === true
        const noShow = apt.patientPresent === false
        const busy = busyId === apt.id
        const notes = apt.clinicalNotes ?? []
        const comms = apt.communications ?? []
        const files = apt.files ?? []
        return (
          <div
            key={apt.id}
            className="p-3 sm:p-4 rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40 transition-all space-y-3"
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    apt.status.toUpperCase() === 'COMPLETED'
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                  }`}
                >
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-gray-800 text-sm sm:text-base truncate">{apt.type}</h4>
                  <p className="text-xs text-gray-600 truncate">
                    {apt.date} • {apt.doctor}
                  </p>
                  {scheduled && (attended || noShow) && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      Attendance: {attended ? 'Present' : 'No-show'}
                    </p>
                  )}
                </div>
              </div>
              <Badge
                variant={apt.status.toUpperCase() === 'COMPLETED' ? 'secondary' : 'default'}
                className={`flex-shrink-0 text-xs ${
                  apt.status.toUpperCase() === 'COMPLETED'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {statusLabel(apt.status)}
              </Badge>
            </div>
            {scheduled && (
              <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg h-8 text-xs"
                  disabled={busy}
                  onClick={() => void patch(apt.id, { patientPresent: true, markCompleted: true })}
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <UserCheck className="w-4 h-4 mr-1" />}
                  Patient attended & complete
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg h-8 text-xs"
                  disabled={busy}
                  onClick={() => void patch(apt.id, { patientPresent: false, status: 'COMPLETED' })}
                >
                  <UserX className="w-4 h-4 mr-1" />
                  No-show (mark completed)
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-lg h-8 text-xs text-gray-600"
                  disabled={busy}
                  onClick={() => void patch(apt.id, { patientPresent: null })}
                >
                  Clear attendance
                </Button>
              </div>
            )}
            {apt.status.toUpperCase() === 'COMPLETED' && apt.patientPresent != null && (
              <div className="flex items-center gap-2 text-xs text-gray-600 -mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Recorded: {apt.patientPresent ? 'Present' : 'Absent'}
              </div>
            )}

            {/* Compact 2×2 grid: summary | notes / comms | files */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-gray-100">
              <div className="rounded-lg border border-gray-200/80 bg-white/90 p-3 flex flex-col gap-2 min-h-0 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 shrink-0">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Visit summary (EHR)
                </div>
                <textarea
                  rows={4}
                  className="w-full min-h-0 max-h-[120px] resize-y rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs sm:text-sm"
                  placeholder="Short visit summary…"
                  value={visitDrafts[apt.id] ?? ''}
                  onChange={(e) => setVisitDrafts((d) => ({ ...d, [apt.id]: e.target.value }))}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="rounded-lg h-8 text-xs w-full sm:w-auto shrink-0"
                  disabled={busy}
                  onClick={() => saveVisitNotes(apt.id)}
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Save summary
                </Button>
              </div>

              <div className="rounded-lg border border-gray-200/80 bg-white/90 p-3 flex flex-col gap-2 min-h-0 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 shrink-0">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  Clinical notes
                </div>
                {notes.length === 0 ? (
                  <p className="text-xs text-gray-500">No notes yet.</p>
                ) : (
                  <ul className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                    {notes.map((n) => (
                      <li key={n.id} className="text-xs rounded-md bg-slate-50 border border-gray-100 px-2 py-1.5">
                        <span className="text-gray-500">{n.date}</span> · {n.author}
                        <p className="text-gray-800 mt-0.5 line-clamp-3">{n.note}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <textarea
                  rows={3}
                  className="w-full max-h-[100px] resize-y rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs sm:text-sm"
                  placeholder="Add clinical note…"
                  value={newClinical[apt.id] ?? ''}
                  onChange={(e) => setNewClinical((m) => ({ ...m, [apt.id]: e.target.value }))}
                />
                <Button
                  type="button"
                  size="sm"
                  className="rounded-lg h-8 text-xs bg-teal-600 hover:bg-teal-700 w-full sm:w-auto shrink-0"
                  disabled={posting(apt.id, 'clinical')}
                  onClick={() => addClinicalNote(apt.id)}
                >
                  {posting(apt.id, 'clinical') ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Add note
                </Button>
              </div>

              <div className="rounded-lg border border-gray-200/80 bg-white/90 p-3 flex flex-col gap-2 min-h-0 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 shrink-0">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                  Comments
                </div>
                {comms.length === 0 ? (
                  <p className="text-xs text-gray-500">No comments yet.</p>
                ) : (
                  <ul className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                    {comms.map((c) => (
                      <li key={c.id} className="text-xs rounded-md bg-slate-50 border border-gray-100 px-2 py-1.5">
                        <span className="text-gray-500">{c.date}</span> · {c.type} · {c.channel}
                        {c.author ? <span className="text-gray-500"> · {c.author}</span> : null}
                        <p className="text-gray-800 mt-0.5 line-clamp-3">{c.message}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <textarea
                  rows={3}
                  className="w-full max-h-[100px] resize-y rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs sm:text-sm"
                  placeholder="Log a comment…"
                  value={newComm[apt.id] ?? ''}
                  onChange={(e) => setNewComm((m) => ({ ...m, [apt.id]: e.target.value }))}
                />
                <Button
                  type="button"
                  size="sm"
                  className="rounded-lg h-8 text-xs bg-purple-600 hover:bg-purple-700 w-full sm:w-auto shrink-0"
                  disabled={posting(apt.id, 'comm')}
                  onClick={() => addCommunication(apt.id)}
                >
                  {posting(apt.id, 'comm') ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Add comment
                </Button>
              </div>

              <div className="rounded-lg border border-gray-200/80 bg-white/90 p-3 flex flex-col gap-2 min-h-0 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-800 shrink-0">
                  <Paperclip className="w-3.5 h-3.5 text-blue-600" />
                  Files & links
                </div>
                {files.length === 0 ? (
                  <p className="text-xs text-gray-500">No files yet.</p>
                ) : (
                  <ul className="space-y-1 max-h-[88px] overflow-y-auto pr-1">
                    {files.map((f) => (
                      <li
                        key={f.id}
                        className="text-xs flex flex-wrap items-center gap-1.5 rounded-md bg-slate-50 border border-gray-100 px-2 py-1"
                      >
                        <span className="font-medium text-gray-800 truncate">{f.title}</span>
                        {f.fileUrl ? (
                          <a
                            href={f.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline shrink-0"
                          >
                            Open
                          </a>
                        ) : null}
                        {f.fileName ? (
                          <span className="text-gray-500 truncate max-w-[8rem]">{f.fileName}</span>
                        ) : null}
                        {f.uploadedBy ? (
                          <span className="text-gray-400 shrink-0">· {f.uploadedBy}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="grid grid-cols-1 gap-1.5">
                  <Input
                    className="bg-white h-8 text-xs"
                    placeholder="Title"
                    value={newFileTitle[apt.id] ?? ''}
                    onChange={(e) => setNewFileTitle((m) => ({ ...m, [apt.id]: e.target.value }))}
                  />
                  <Input
                    className="bg-white h-8 text-xs"
                    placeholder="URL (optional)"
                    value={newFileUrl[apt.id] ?? ''}
                    onChange={(e) => setNewFileUrl((m) => ({ ...m, [apt.id]: e.target.value }))}
                  />
                  <Input
                    className="bg-white h-8 text-xs"
                    placeholder="File name (optional)"
                    value={newFileName[apt.id] ?? ''}
                    onChange={(e) => setNewFileName((m) => ({ ...m, [apt.id]: e.target.value }))}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-lg h-8 text-xs bg-blue-600 hover:bg-blue-700 w-full sm:w-auto shrink-0"
                  disabled={posting(apt.id, 'file')}
                  onClick={() => addFile(apt.id)}
                >
                  {posting(apt.id, 'file') ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                  Attach
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
