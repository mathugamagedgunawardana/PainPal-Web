'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquare, Send, X, Loader2 } from 'lucide-react'

export type ChatMessage = {
  id: string
  senderRole: 'DOCTOR' | 'PATIENT'
  content: string
  createdAt: string
  readAt?: string | null
}

type ChatPanelProps = {
  /** When provided, use this conversation directly */
  conversationId?: string
  /** For doctor: pass patientId to find-or-create conversation */
  patientId?: string
  /** For patient: pass doctorId to find-or-create conversation */
  doctorId?: string
  otherPartyName: string
  currentUserRole: 'DOCTOR' | 'PATIENT'
  open: boolean
  onClose: () => void
  /** Optional class for the overlay container */
  className?: string
}

export function ChatPanel({
  conversationId: initialConversationId,
  patientId,
  doctorId,
  otherPartyName,
  currentUserRole,
  open,
  onClose,
  className = '',
}: ChatPanelProps) {
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId ?? null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resolvedConversationIdRef = useRef<string | null>(null)

  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (initialConversationId) return initialConversationId
    if (resolvedConversationIdRef.current) return resolvedConversationIdRef.current
    setLoading(true)
    setError(null)
    try {
      const body = currentUserRole === 'DOCTOR' ? { patientId } : { doctorId }
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to start conversation')
      }
      const data = await res.json()
      resolvedConversationIdRef.current = data.id
      setConversationId(data.id)
      return data.id
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start conversation')
      return null
    } finally {
      setLoading(false)
    }
  }, [initialConversationId, currentUserRole, patientId, doctorId])

  const fetchMessages = useCallback(async (cid: string) => {
    try {
      const res = await fetch(`/api/chat/conversations/${cid}/messages?limit=50`, { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages || [])
    } catch {
      // Network error (e.g. ERR_CONNECTION_REFUSED when server is down) – avoid unhandled rejection
      // Optionally could set a "reconnecting" state here
    }
  }, [])

  useEffect(() => {
    if (!open) return
    setError(null)
    setMessages([])
    if (initialConversationId) {
      setConversationId(initialConversationId)
      setLoading(true)
      fetch(`/api/chat/conversations/${initialConversationId}/messages?limit=50`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load'))))
        .then((data) => {
          setMessages(data.messages || [])
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : ''
          setError(msg === 'Failed to fetch' ? 'Cannot reach server. Check that the app is running.' : 'Failed to load messages')
        })
        .finally(() => setLoading(false))
      return
    }
    resolvedConversationIdRef.current = null
    setConversationId(null)
    ensureConversation()
      .then((cid) => {
        if (cid) {
          setLoading(true)
          fetchMessages(cid).finally(() => setLoading(false))
        }
      })
      .catch(() => { /* ensureConversation already sets error */ })
  }, [open, initialConversationId, ensureConversation, fetchMessages])

  useEffect(() => {
    if (!open) {
      resolvedConversationIdRef.current = null
      return
    }
    if (!conversationId) return
    pollRef.current = setInterval(() => {
      fetchMessages(conversationId)
    }, 5000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [open, conversationId, fetchMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const cid = conversationId ?? (await ensureConversation())
    if (!cid || !input.trim()) return
    setSending(true)
    const text = input.trim()
    setInput('')
    try {
      const res = await fetch(`/api/chat/conversations/${cid}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: text }),
      })
      if (!res.ok) throw new Error('Failed to send')
      const created = await res.json()
      setMessages((prev) => [...prev, created])
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    } catch {
      setInput(text)
      setError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-stretch justify-end ${className}`}
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-xl flex flex-col border-l border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">Chat with {otherPartyName}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[60vh]">
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : error && messages.length === 0 ? (
            <p className="text-sm text-red-600 text-center py-4">{error}</p>
          ) : (
            messages.map((m) => {
              const isMe = m.senderRole === currentUserRole
              return (
                <div
                  key={m.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                      isMe
                        ? 'bg-indigo-600 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-500'}`}>
                      {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t bg-gray-50">
          {error && messages.length > 0 && (
            <p className="text-xs text-red-600 mb-2">{error}</p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={sending || loading}
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim() || sending || loading}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
