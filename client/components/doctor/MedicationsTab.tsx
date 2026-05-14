'use client'

import React, { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pill, Plus, Trash2, Loader2, Save } from 'lucide-react'

export type ScheduleEntry = { name: string; tablets: number; time: string }

export type MedicationGroupRow = {
  id: string
  name: string
  description?: string | null
  groupType: string
  medications: string[]
  medicationSchedule: unknown
  isActive: boolean
}

function parseSchedule(raw: unknown): ScheduleEntry[] {
  if (raw == null || !Array.isArray(raw)) return []
  const out: ScheduleEntry[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const r = row as Record<string, unknown>
    const name = typeof r.name === 'string' ? r.name.trim() : ''
    if (!name) continue
    const tablets =
      typeof r.tablets === 'number' && Number.isFinite(r.tablets) && r.tablets > 0
        ? Math.min(99, Math.floor(r.tablets))
        : 1
    const time = typeof r.time === 'string' ? r.time.trim() : ''
    out.push({ name, tablets, time })
  }
  return out
}

function fallbackFromNames(meds: string[]): ScheduleEntry[] {
  return meds.map((name) => ({ name, tablets: 1, time: '' }))
}

interface MedicationsTabProps {
  patientId: string
  groups: MedicationGroupRow[]
  onSaved?: () => void
}

export function MedicationsTab({ patientId, groups, onSaved }: MedicationsTabProps) {
  const [rowsByGroup, setRowsByGroup] = useState<Record<string, ScheduleEntry[]>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'PREVENTIVE' | 'RESCUE'>('PREVENTIVE')

  useEffect(() => {
    const next: Record<string, ScheduleEntry[]> = {}
    for (const g of groups) {
      const parsed = parseSchedule(g.medicationSchedule)
      next[g.id] = parsed.length > 0 ? parsed : fallbackFromNames(g.medications ?? [])
      if (next[g.id].length === 0) {
        next[g.id] = [{ name: '', tablets: 1, time: '09:00' }]
      }
    }
    setRowsByGroup(next)
  }, [groups])

  const setRows = (groupId: string, rows: ScheduleEntry[]) => {
    setRowsByGroup((prev) => ({ ...prev, [groupId]: rows }))
  }

  const saveGroup = async (groupId: string) => {
    const rows = rowsByGroup[groupId] ?? []
    const cleaned = rows
      .map((r) => ({
        name: r.name.trim(),
        tablets: Math.min(99, Math.max(1, Math.floor(r.tablets || 1))),
        time: (r.time ?? '').trim(),
      }))
      .filter((r) => r.name.length > 0)
    if (cleaned.length === 0) {
      setError('Add at least one medicine with a name.')
      return
    }
    setError(null)
    setBusy(groupId)
    try {
      const res = await fetch(`/api/patients/${patientId}/medication-groups/${groupId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicationSchedule: cleaned }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error ?? `Save failed (${res.status})`)
      }
      onSaved?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setBusy(null)
    }
  }

  const createGroup = async () => {
    const name = newName.trim()
    if (!name) {
      setError('Protocol name is required.')
      return
    }
    setError(null)
    setCreating(true)
    try {
      const res = await fetch(`/api/patients/${patientId}/medication-groups`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          groupType: newType,
          medicationSchedule: [{ name: 'Medicine name', tablets: 1, time: '09:00' }],
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error ?? `Create failed (${res.status})`)
      }
      setNewName('')
      onSaved?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Pill className="w-5 h-5 text-teal-600" />
          Prescribed protocols
        </h3>
      </div>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
      )}

      {groups.map((g) => {
        const rows = rowsByGroup[g.id] ?? [{ name: '', tablets: 1, time: '' }]
        const saving = busy === g.id
        return (
          <div
            key={g.id}
            className="p-4 sm:p-5 rounded-xl border-2 border-gray-200 hover:border-teal-300 bg-white/90 space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="font-bold text-gray-800 text-base">{g.name}</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {g.groupType}
                  {!g.isActive && ' • Inactive'}
                </p>
              </div>
              <Badge variant="outline" className="text-teal-700 border-teal-200">
                Edit rows then save
              </Badge>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="w-full text-sm min-w-[480px]">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left p-2 font-medium">Medicine</th>
                    <th className="text-left p-2 font-medium w-24">Tablets</th>
                    <th className="text-left p-2 font-medium w-32">Time (HH:mm)</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="p-2">
                        <Input
                          value={row.name}
                          placeholder="e.g. Sumatriptan"
                          className="h-9"
                          onChange={(e) => {
                            const copy = [...rows]
                            copy[idx] = { ...copy[idx], name: e.target.value }
                            setRows(g.id, copy)
                          }}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          min={1}
                          max={99}
                          className="h-9"
                          value={row.tablets}
                          onChange={(e) => {
                            const copy = [...rows]
                            copy[idx] = { ...copy[idx], tablets: parseInt(e.target.value, 10) || 1 }
                            setRows(g.id, copy)
                          }}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          placeholder="09:00"
                          className="h-9"
                          value={row.time}
                          onChange={(e) => {
                            const copy = [...rows]
                            copy[idx] = { ...copy[idx], time: e.target.value }
                            setRows(g.id, copy)
                          }}
                        />
                      </td>
                      <td className="p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-red-600"
                          onClick={() => setRows(g.id, rows.filter((_, i) => i !== idx))}
                          disabled={rows.length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => setRows(g.id, [...rows, { name: '', tablets: 1, time: '' }])}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add row
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-lg bg-teal-600 hover:bg-teal-700"
                disabled={saving}
                onClick={() => void saveGroup(g.id)}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                Save protocol
              </Button>
            </div>
          </div>
        )
      })}

      <div className="p-4 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/40 space-y-3">
        <h4 className="font-semibold text-gray-800 text-sm">New protocol</h4>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="text-xs text-gray-500 block mb-1">Name</label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Acute care" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Type</label>
            <select
              className="h-10 rounded-md border border-gray-200 px-2 text-sm bg-white"
              value={newType}
              onChange={(e) => setNewType(e.target.value as 'PREVENTIVE' | 'RESCUE')}
            >
              <option value="PREVENTIVE">Preventive</option>
              <option value="RESCUE">Rescue</option>
            </select>
          </div>
          <Button type="button" className="rounded-lg bg-teal-600 hover:bg-teal-700" disabled={creating} onClick={() => void createGroup()}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  )
}
