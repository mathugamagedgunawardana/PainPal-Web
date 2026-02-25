import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, Clock, Pill, TrendingUp, AlertCircle, FileText } from 'lucide-react'

interface Episode {
  date: string
  severity: string
  duration: string
  triggers: string[]
  mostIntenseSymptoms: string[]
  medicationsTakenDuringPeriod: string[]
  notes?: string
}

interface EpisodeHistoryTabProps {
  episodeHistory: Episode[]
}

export function EpisodeHistoryTab({ episodeHistory }: EpisodeHistoryTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Migraine Episode Timeline
        </h3>
{/*         <Button variant="default" size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700">
          <TrendingUp className="w-4 h-4 mr-2" />
          View Chart
        </Button> */}
      </div>
      {episodeHistory.map((episode, idx) => (
        <div key={idx} className="flex items-start gap-4 p-4 sm:p-5 rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all">
          <div className={`w-4 h-4 rounded-full mt-2 flex-shrink-0 ${
            episode.severity === 'Severe' ? 'bg-red-500' :
            episode.severity === 'Moderate' ? 'bg-yellow-500' :
            'bg-green-500'
          }`}></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-800 text-sm sm:text-base">{episode.date}</span>
                <Badge variant={episode.severity === 'Severe' ? 'destructive' : episode.severity === 'Moderate' ? 'default' : 'secondary'}>
                  {episode.severity}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>Duration: {episode.duration}</span>
              </div>
            </div>

            {/* Most intense symptoms */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                Most intense symptoms
              </p>
              <div className="flex flex-wrap gap-1.5">
                {episode.mostIntenseSymptoms.map((symptom, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-amber-100 text-amber-800 border border-amber-200">
                    {symptom}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Doctor-prescribed medications during this period */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-indigo-600" />
                Medications taken during this period (doctor-prescribed)
              </p>
              <div className="p-2.5 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
                <div className="flex flex-wrap gap-1.5">
                  {episode.medicationsTakenDuringPeriod.map((med, i) => (
                    <Badge key={i} className="text-xs bg-indigo-100 text-indigo-700 border-indigo-200">
                      {med}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Reported triggers */}
            <div className="mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Reported triggers</p>
              <div className="flex gap-2 flex-wrap">
                {episode.triggers.map((trigger, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                    {trigger}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Optional notes */}
            {episode.notes && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gray-500" />
                  Notes
                </p>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-2 border border-gray-100">
                  {episode.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
