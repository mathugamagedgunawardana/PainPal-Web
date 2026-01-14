import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare } from 'lucide-react'

interface Communication {
  date: string
  type: string
  message: string
  channel: string
}

interface CommunicationTabProps {
  communications: Communication[]
}

export function CommunicationTab({ communications }: CommunicationTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-pink-600" />
          Communication History
        </h3>
        <Button variant="default" size="sm" className="rounded-xl bg-pink-600 hover:bg-pink-700">
          <MessageSquare className="w-4 h-4 mr-2" />
          Send Message
        </Button>
      </div>
      {communications.map((comm, idx) => (
        <div key={idx} className="p-4 sm:p-5 rounded-xl border-2 border-gray-200 hover:border-pink-300 hover:bg-pink-50/50 transition-all">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h4 className="font-bold text-gray-800 text-sm sm:text-base">{comm.type}</h4>
                  <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700">{comm.channel}</Badge>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 break-words">{comm.message}</p>
              </div>
            </div>
            <span className="text-xs text-gray-500 flex-shrink-0">{comm.date}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
