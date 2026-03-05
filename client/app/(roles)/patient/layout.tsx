'use client'

import React, { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'
import { FloatingChatIcon } from '@/components/chat/FloatingChatIcon'

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/signin')
      } else if (user?.role !== 'PATIENT') {
        router.push('/unauthorized')
      }
    }
  }, [user, loading, isAuthenticated, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== 'PATIENT') {
    return null
  }

  const pathname = usePathname()
  const isMessagesPage = pathname === '/patient/messages'

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userRole="patient" userName={user.name || 'Patient'} userEmail={user.email || ''} />
      <main className="flex-1 min-w-0">
        <Header userName={user.name} userEmail={user.email} />
        <div>{children}</div>
      </main>
      {!isMessagesPage && (
        <FloatingChatIcon
          onClick={() => router.push('/patient/messages')}
          aria-label="Open messages"
        />
      )}
    </div>
  )
}
