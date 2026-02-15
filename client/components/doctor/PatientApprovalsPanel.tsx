"use client"

import React from "react"
import { CheckCircle2, RefreshCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PatientProfile {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  condition?: string | null
  address?: string | null
}

interface PatientDoctorLink {
  id: string
  linkStatus: "PENDING" | "ACTIVE" | "REVOKED"
  patient: PatientProfile
  createdAt?: string
}

export function PatientApprovalsPanel() {
  const [pending, setPending] = React.useState<PatientDoctorLink[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [savingId, setSavingId] = React.useState<string | null>(null)

  const loadPending = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch("/api/patient-doctor-links?status=PENDING", {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to load approvals")
      }
      const data = await response.json()
      setPending(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load approvals")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadPending()
  }, [loadPending])

  const approveLink = async (linkId: string) => {
    try {
      setSavingId(linkId)
      const response = await fetch("/api/patient-doctor-links", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: linkId, linkStatus: "ACTIVE" }),
      })
      if (!response.ok) {
        throw new Error("Failed to approve patient")
      }
      setPending((items) => items.filter((item) => item.id !== linkId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve patient")
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Patient Approvals
            </CardTitle>
            <CardDescription>Approve pending patient requests for your care list.</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={loadPending}>
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading approvals...</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : pending.length === 0 ? (
          <div className="text-sm text-muted-foreground">No pending approvals.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {pending.map((link) => (
              <div
                key={link.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold text-slate-900">{link.patient.name}</span>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                  <div className="text-sm text-slate-600">
                    {link.patient.condition || "Condition not recorded"}
                  </div>
                  <div className="text-xs text-slate-500">
                    {link.patient.email || "No email"} • {link.patient.phone || "No phone"}
                  </div>
                </div>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => approveLink(link.id)}
                  disabled={savingId === link.id}
                >
                  {savingId === link.id ? "Approving..." : "Approve"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
