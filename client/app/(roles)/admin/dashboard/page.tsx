'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserCog, Stethoscope, Users, Activity } from 'lucide-react'

export default function AdminDashboardPage() {
  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
      <p className="text-gray-600 text-sm mb-6">Manage the platform</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/users">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <UserCog className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Users</h2>
                <p className="text-sm text-gray-500">Manage accounts and passwords</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Card className="opacity-75">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-700">Doctors</h2>
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
          </CardContent>
        </Card>
        <Card className="opacity-75">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-700">Patients</h2>
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
          </CardContent>
        </Card>
        <Card className="opacity-75">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
              <Activity className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-700">Analytics</h2>
              <p className="text-sm text-gray-500">Coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Link href="/admin/users">
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <UserCog className="w-4 h-4 mr-2" />
            Manage Users
          </Button>
        </Link>
      </div>
    </div>
  )
}
