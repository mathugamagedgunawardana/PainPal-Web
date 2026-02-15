"use client"

import { PatientApprovalsPanel } from "@/components/doctor/PatientApprovalsPanel"

export default function DoctorPatientApprovePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Approve Patients</h1>
          <p className="text-sm text-slate-600 md:text-base">
            Review and approve patients who requested access to your care.
          </p>
        </div>
        <PatientApprovalsPanel />
      </div>
    </div>
  )
}
