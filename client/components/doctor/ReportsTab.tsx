import React from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText, Upload } from 'lucide-react'

export function ReportsTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-600" />
          Investigations & Reports
        </h3>
        <Button variant="default" size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700">
          <Upload className="w-4 h-4 mr-2" />
          Upload File
        </Button>
      </div>
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 sm:p-12 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all">
        <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-700 font-semibold mb-2 text-sm sm:text-base">No reports uploaded yet</p>
        <p className="text-xs sm:text-sm text-gray-500 mb-4 px-2">Upload MRI scans, blood tests, and other medical reports</p>
        <Button variant="default" size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700">
          <Upload className="w-4 h-4 mr-2" />
          Upload First Report
        </Button>
      </div>
    </div>
  )
}
