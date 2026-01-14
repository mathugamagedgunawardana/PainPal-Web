import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, Clock, Pill, TrendingUp } from 'lucide-react'

interface Episode {
  date: string
  severity: string
  duration: string
  triggers: string[]
  medicationGroupId: number
  medicationGroupName: string
  effectiveness: 'high' | 'moderate' | 'low'
}

interface MedicationGroup {
  id: number
  name: string
  medications: string[]
}

interface EpisodeHistoryTabProps {
  episodeHistory: Episode[]
  medicationGroups: MedicationGroup[]
}

export function EpisodeHistoryTab({ episodeHistory, medicationGroups }: EpisodeHistoryTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Migraine Episode Timeline
        </h3>
        <Button variant="default" size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700">
          <TrendingUp className="w-4 h-4 mr-2" />
          View Chart
        </Button>
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
              <div className="flex items-center gap-2">
                <Badge className={`text-xs ${
                  episode.effectiveness === 'high' ? 'bg-green-100 text-green-700 border-green-300' :
                  episode.effectiveness === 'moderate' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                  'bg-red-100 text-red-700 border-red-300'
                } border`}>
                  {episode.effectiveness === 'high' ? '✓ Effective' : 
                   episode.effectiveness === 'moderate' ? '⚡ Moderate' : 
                   '✗ Low Effect'}
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3 mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>Duration: {episode.duration}</span>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Pill className={`w-4 h-4 ${
                    episode.effectiveness === 'high' ? 'text-green-600' :
                    episode.effectiveness === 'moderate' ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                  <span className="text-xs font-semibold text-gray-500 uppercase">Medication Group</span>
                </div>
                <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200">
                  <p className="font-bold text-indigo-800 text-sm">{episode.medicationGroupName}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {medicationGroups.find(g => g.id === episode.medicationGroupId)?.medications.map((med, i) => (
                      <Badge key={i} className="text-xs bg-indigo-100 text-indigo-700">
                        {med}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Medication Effectiveness Indicator */}
            <div className={`p-3 rounded-lg mb-3 border ${
              episode.effectiveness === 'high' ? 'bg-green-50 border-green-200' :
              episode.effectiveness === 'moderate' ? 'bg-yellow-50 border-yellow-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <span className="text-xs font-semibold text-gray-600 uppercase">Medication Effectiveness</span>
                <span className={`text-xs font-bold ${
                  episode.effectiveness === 'high' ? 'text-green-700' :
                  episode.effectiveness === 'moderate' ? 'text-yellow-700' :
                  'text-red-700'
                }`}>
                  {episode.effectiveness === 'high' ? 'High Response' : 
                   episode.effectiveness === 'moderate' ? 'Moderate Response' : 
                   'Poor Response'}
                </span>
              </div>
              <div className="w-full bg-white rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    episode.effectiveness === 'high' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                    episode.effectiveness === 'moderate' ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                    'bg-gradient-to-r from-red-500 to-rose-500'
                  }`}
                  style={{ 
                    width: episode.effectiveness === 'high' ? '90%' : 
                           episode.effectiveness === 'moderate' ? '60%' : '30%' 
                  }}
                />
              </div>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Reported Triggers</p>
              <div className="flex gap-2 flex-wrap">
                {episode.triggers.map((trigger, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                    {trigger}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
