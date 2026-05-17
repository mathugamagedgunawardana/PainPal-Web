'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Brain, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type MriScanPayload = {
  id: string
  originalFileName: string
  predictedLabel: string
  confidence: number
  probabilities: Record<string, number> | null
  modelLabel: string | null
  createdAt: string
  imageUrl?: string | null
}

type ApiResponse = {
  scan: MriScanPayload | null
  modelAvailable: boolean
  modelUnavailableReason: string | null
}

type Props = {
  patientId: string
}

function formatLabel(raw: string): string {
  if (!raw) return '—'
  return raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function labelTone(predicted: string): string {
  const key = predicted.toLowerCase()
  if (key === 'migraine') {
    return 'bg-purple-100 text-purple-800 border-purple-200'
  }
  if (key === 'other') {
    return 'bg-teal-100 text-teal-800 border-teal-200'
  }
  return 'bg-gray-100 text-gray-800 border-gray-200'
}

function isResnetClassLabel(raw: string): boolean {
  const key = raw.trim().toLowerCase()
  return ['migraine', 'other', 'tumor', 'non_tumor'].includes(key)
}

function barTone(className: string): string {
  const key = className.toLowerCase()
  if (key === 'migraine') return 'from-purple-500 to-purple-600'
  if (key === 'other') return 'from-teal-500 to-cyan-600'
  return 'from-blue-500 to-indigo-600'
}

export function DoctorPatientMriPredictionCard({ patientId }: Props) {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/patients/${patientId}/mri-prediction`, {
        credentials: 'include',
        cache: 'no-store',
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error((j as { error?: string }).error || `Failed (${res.status})`)
      }
      setData((await res.json()) as ApiResponse)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load MRI prediction')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    void load()
  }, [load])

  const scan = data?.scan
  const probs =
    scan?.probabilities && Object.keys(scan.probabilities).length > 0
      ? scan.probabilities
      : scan
        ? { [scan.predictedLabel]: scan.confidence }
        : null

  const confidencePct =
    scan?.confidence != null ? Math.round(scan.confidence * 100) : null
  const resnetLabel = scan ? isResnetClassLabel(scan.predictedLabel) : false

  return (
    <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 border-l-4 border-l-teal-500">
      <CardHeader className="pb-2 space-y-0">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-gray-900">
          <Brain className="w-5 h-5 text-teal-600 shrink-0" />
          MRI analysis (ResNet18)
        </CardTitle>
        <p className="text-xs text-gray-500 pt-1">
          Latest brain MRI upload — migraine vs other pattern (research use only).
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-gray-700">
        {loading ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
            <span className="text-gray-500">Loading MRI prediction…</span>
          </div>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : !scan ? (
          <div className="rounded-xl border border-dashed border-teal-200 bg-teal-50/50 p-4 text-gray-600">
            <p>No MRI scans uploaded for this patient yet.</p>
            <p className="text-xs mt-2 text-gray-500">
              When the patient uploads a scan from the mobile app, ResNet18 results appear here.
            </p>
          </div>
        ) : (
          <>
            {scan.imageUrl ? (
              <div className="rounded-xl overflow-hidden border border-teal-100 bg-gray-900/5 max-w-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={scan.imageUrl}
                  alt={`MRI ${scan.originalFileName}`}
                  className="w-full h-auto max-h-48 object-contain bg-black/5"
                />
              </div>
            ) : null}

            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  {resnetLabel ? 'Predicted class' : 'Stored finding'}
                </p>
                {resnetLabel ? (
                  <Badge className={cn('text-sm font-semibold border', labelTone(scan.predictedLabel))}>
                    {formatLabel(scan.predictedLabel)}
                  </Badge>
                ) : (
                  <p className="text-sm text-gray-800 leading-relaxed">{scan.predictedLabel}</p>
                )}
              </div>
              {confidencePct != null && resnetLabel && (
                <div className="ml-auto text-right">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
                    Confidence
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent tabular-nums">
                    {confidencePct}%
                  </p>
                </div>
              )}
            </div>

            {probs && resnetLabel && (
              <div className="rounded-xl bg-gradient-to-br from-teal-50/90 via-white to-purple-50/80 border border-teal-100/80 p-4 space-y-3">
                <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide">
                  Class probabilities
                </p>
                {Object.entries(probs)
                  .sort(([, a], [, b]) => b - a)
                  .map(([name, value]) => {
                    const pct = Math.round(value * 100)
                    return (
                      <div key={name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-gray-700">{formatLabel(name)}</span>
                          <span className="tabular-nums text-gray-600">{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full bg-gradient-to-r transition-all',
                              barTone(name),
                            )}
                            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pt-1 border-t border-gray-100">
              <span>Scan: {scan.originalFileName}</span>
              <span>Uploaded {new Date(scan.createdAt).toLocaleString()}</span>
              {scan.modelLabel ? <span>Model: {scan.modelLabel}</span> : null}
            </div>

            {data?.modelAvailable === false && data.modelUnavailableReason && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">
                Model server note: {data.modelUnavailableReason}
              </p>
            )}

            <p className="text-xs text-gray-500">
              ResNet18 output from the Python model API — for decision support only, not a clinical
              diagnosis. Review imaging with a qualified specialist.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
