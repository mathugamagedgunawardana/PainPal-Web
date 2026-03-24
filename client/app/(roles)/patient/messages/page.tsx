'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageSquare, Loader2 } from 'lucide-react'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { FloatingChatIcon } from '@/components/chat/FloatingChatIcon'

type ConversationItem = {
  id: string
  otherParty: { id: string; name: string }
  lastMessage: { content: string; createdAt: string; senderRole: string } | null
  updatedAt: string
}

export default function PatientMessagesPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chatOpen, setChatOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<{ id: string; name: string } | null>(null)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch('/api/chat/conversations', { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load conversations')
        return res.json()
      })
      .then((data: ConversationItem[]) => {
        if (!cancelled) setConversations(Array.isArray(data) ? data : [])
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const openChat = (conv: ConversationItem) => {
    setSelectedDoctor(conv.otherParty)
    setSelectedConversationId(conv.id)
    setChatOpen(true)
  }

  const openLatestChat = () => {
    if (conversations.length > 0) {
      openChat(conversations[0])
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Messages</h1>
      <p className="text-gray-600 text-sm mb-6">Chat with your doctors</p>

      {error && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="p-4 text-red-700">{error}</CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : conversations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No conversations yet.</p>
            <p className="text-sm mt-1">When your doctor sends you a message or you start a chat, it will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Card
              key={conv.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openChat(conv)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{conv.otherParty.name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {conv.lastMessage
                      ? conv.lastMessage.content
                      : 'No messages yet'}
                  </p>
                </div>
                {conv.lastMessage && (
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(conv.lastMessage.createdAt).toLocaleDateString()}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {conversations.length > 0 && (
        <FloatingChatIcon
          onClick={openLatestChat}
          aria-label="Open latest conversation"
        />
      )}

      <ChatPanel
        conversationId={selectedConversationId ?? undefined}
        doctorId={selectedDoctor?.id}
        otherPartyName={selectedDoctor?.name ?? 'Doctor'}
        currentUserRole="PATIENT"
        open={chatOpen && !!selectedDoctor}
        onClose={() => {
          setChatOpen(false)
          setSelectedDoctor(null)
          setSelectedConversationId(null)
        }}
      />
    </div>
  )
}
