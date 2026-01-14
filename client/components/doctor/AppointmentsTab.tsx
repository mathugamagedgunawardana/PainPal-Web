import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from 'lucide-react'

interface Appointment {
  date: string
  type: string
  doctor: string
  status: string
}

interface AppointmentsTabProps {
  appointments: Appointment[]
}

export function AppointmentsTab({ appointments }: AppointmentsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Appointment History
        </h3>
        <Button variant="default" size="sm" className="rounded-xl bg-indigo-600 hover:bg-indigo-700">
          <Calendar className="w-4 h-4 mr-2" />
          Schedule New
        </Button>
      </div>
      {appointments.map((apt, idx) => (
        <div key={idx} className="p-4 sm:p-5 rounded-xl border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                apt.status === 'Completed' ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                'bg-gradient-to-br from-indigo-500 to-purple-600'
              }`}>
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-gray-800 text-sm sm:text-base truncate">{apt.type}</h4>
                <p className="text-xs sm:text-sm text-gray-600 truncate">{apt.date} • {apt.doctor}</p>
              </div>
            </div>
            <Badge variant={apt.status === 'Completed' ? 'secondary' : 'default'} className={`flex-shrink-0 ${apt.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
              {apt.status}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
