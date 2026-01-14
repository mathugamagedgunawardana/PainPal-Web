import React from 'react'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

interface Note {
  date: string
  note: string
  author: string
}

interface NotesTabProps {
  notes: Note[]
}

export function NotesTab({ notes }: NotesTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-orange-600" />
          Clinical Notes & Observations
        </h3>
        <Button variant="default" size="sm" className="rounded-xl bg-orange-600 hover:bg-orange-700">
          <FileText className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>
      {notes.map((note, idx) => (
        <div key={idx} className="p-4 sm:p-5 rounded-xl border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all">
          <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-bold text-gray-800">{note.author}</span>
            </div>
            <span className="text-xs text-gray-500">{note.date}</span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed bg-white/50 p-3 rounded-lg break-words">{note.note}</p>
        </div>
      ))}
    </div>
  )
}
