import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Pill } from 'lucide-react'

interface Medication {
  name: string
  frequency: string
  adherence: number
  lastTaken: string
  groupId: number
}

interface MedicationsTabProps {
  medications: Medication[]
}

export function MedicationsTab({ medications }: MedicationsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Pill className="w-5 h-5 text-teal-600" />
          Current Medications
        </h3>
        <Button variant="default" size="sm" className="rounded-xl bg-teal-600 hover:bg-teal-700">
          <Pill className="w-4 h-4 mr-2" />
          Add Medication
        </Button>
      </div>
      {medications.map((med, idx) => (
        <div key={idx} className="p-4 sm:p-5 rounded-xl border-2 border-gray-200 hover:border-teal-300 hover:bg-teal-50/50 transition-all">
          <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-800 text-base sm:text-lg break-words">{med.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{med.frequency}</p>
            </div>
            <Badge variant="default" className={`flex-shrink-0 ${
              med.adherence > 85 ? 'bg-green-100 text-green-700' :
              med.adherence > 70 ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>{med.adherence}% adherence</Badge>
          </div>
          <p className="text-xs text-gray-500 mb-2">
            <Calendar className="w-3 h-3 inline mr-1" />
            Last taken: {med.lastTaken}
          </p>
          <div className="mt-3 bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                med.adherence > 85 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                med.adherence > 70 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                'bg-gradient-to-r from-red-500 to-rose-500'
              }`}
              style={{ width: `${med.adherence}%` }}
            ></div>
          </div>
        </div>
      ))}
    </div>
  )
}
