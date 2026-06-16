'use client'

import React, { useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { PatientListItem } from '@/app/(roles)/doctor/patients/page'

type AddPatientDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPatientAdded: (patient: PatientListItem) => void
}

const GENDER_OPTIONS = ['Male', 'Female', 'Other'] as const

const emptyForm = {
  name: '',
  email: '',
  password: '',
  dob: '',
  gender: '',
  phone: '',
  address: '',
  condition: '',
}

export function AddPatientDialog({ open, onOpenChange, onPatientAdded }: AddPatientDialogProps) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const update = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const reset = () => {
    setForm(emptyForm)
    setError(null)
  }

  const handleClose = () => {
    if (submitting) return
    onOpenChange(false)
    reset()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.password || !form.dob) {
      setError('Name, email, password, and date of birth are required.')
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/patients', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          dob: form.dob,
          gender: form.gender || undefined,
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
          condition: form.condition.trim() || undefined,
        }),
      })

      const data = (await res.json().catch(() => ({}))) as {
        error?: string
        message?: string
      } & PatientListItem

      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? `Request failed (${res.status})`)
      }

      onPatientAdded(data)
      onOpenChange(false)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add patient')
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-patient-title"
      onClick={handleClose}
    >
      <Card
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle id="add-patient-title" className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-600" />
              Add Patient
            </CardTitle>
            <CardDescription>
              Create a new patient account and add them to your care list.
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={handleClose}
            disabled={submitting}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="patient-name">Full name *</Label>
                <Input
                  id="patient-name"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Sarah Chen"
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-email">Email *</Label>
                <Input
                  id="patient-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="patient@email.com"
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-password">Temporary password *</Label>
                <Input
                  id="patient-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-dob">Date of birth *</Label>
                <Input
                  id="patient-dob"
                  type="date"
                  value={form.dob}
                  onChange={(e) => update('dob', e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-gender">Gender</Label>
                <select
                  id="patient-gender"
                  value={form.gender}
                  onChange={(e) => update('gender', e.target.value)}
                  disabled={submitting}
                  className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  <option value="">Select…</option>
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-phone">Phone</Label>
                <Input
                  id="patient-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="patient-address">Address</Label>
                <Input
                  id="patient-address"
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder="123 Main St, City"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="patient-condition">Condition</Label>
                <Input
                  id="patient-condition"
                  value={form.condition}
                  onChange={(e) => update('condition', e.target.value)}
                  placeholder="e.g. Chronic Migraine with Aura"
                  disabled={submitting}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={handleClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding…
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Patient
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
