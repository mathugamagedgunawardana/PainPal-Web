'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageSquare, HeartPulse, Calendar, FileText, Activity } from 'lucide-react'

export default function PatientOverviewPage() {
  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Overview</h1>
      <p className="text-gray-600 text-sm mb-6">Your care at a glance</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/patient/messages">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Messages</h2>
                <p className="text-sm text-gray-500">Chat with your doctors</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/patient/analytics">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Analytics</h2>
                <p className="text-sm text-gray-500">Trends, severity & triggers</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card className="opacity-75">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <HeartPulse className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-700">My Episodes</h2>
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
          </CardContent>
        </Card>
        <Card className="opacity-75">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-700">Appointments</h2>
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
          </CardContent>
        </Card>
        <Card className="opacity-75">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-700">Reports</h2>
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/patient/analytics">
          <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
            <Activity className="w-4 h-4 mr-2" />
            View Analytics
          </Button>
        </Link>
        <Link href="/patient/messages">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <MessageSquare className="w-4 h-4 mr-2" />
            Open Messages
          </Button>
        </Link>
      </div>
    </div>
  )
}
