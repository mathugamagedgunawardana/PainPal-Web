'use client'

import React from 'react'
import { MessageSquare } from 'lucide-react'

type FloatingChatIconProps = {
  onClick: () => void
  /** Optional badge count (e.g. unread) */
  badge?: number
  className?: string
  'aria-label'?: string
}

export function FloatingChatIcon({
  onClick,
  badge,
  className = '',
  'aria-label': ariaLabel = 'Open chat',
}: FloatingChatIconProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-all hover:bg-indigo-700 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-indigo-300 ${className}`}
    >
      <MessageSquare className="h-6 w-6" aria-hidden />
      {badge != null && badge > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  )
}
