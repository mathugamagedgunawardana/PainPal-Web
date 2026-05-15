'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Brain, Eye, EyeOff, Mail, Lock, AlertCircle, Sparkle } from 'lucide-react'

export default function SignInPage() {
  const { login } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await login(email, password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid email or password')
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-linear-to-br from-indigo-50 via-white to-amber-50/35">
      {/* Atmospheric background (matches landing) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.18),transparent)]" />
        <div className="absolute top-20 right-0 h-72 w-72 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="absolute bottom-20 left-0 h-80 w-80 rounded-full bg-teal-300/18 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-56 w-56 rounded-full bg-amber-200/25 blur-3xl" />
      </div>

      {/* Top bar — same language as landing nav */}
      <nav className="relative z-20 border-b border-indigo-100/80 bg-white/70 backdrop-blur-xl shadow-sm shadow-indigo-100/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-linear-to-br from-violet-500 via-indigo-500 to-teal-400 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-300/35 ring-2 ring-white/80 group-hover:scale-[1.03] transition-transform">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-slate-800 via-violet-700 to-teal-600 bg-clip-text text-transparent">
              PainPal AI
            </span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-6 text-sm font-medium">
            <Link href="/#features" className="text-slate-600 hover:text-violet-600 transition-colors hidden sm:inline">
              Features
            </Link>
            <Link href="/" className="text-slate-600 hover:text-teal-600 transition-colors">
              Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 pb-16">
        <div className="w-full max-w-md">
          {/* Headline */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 bg-linear-to-r from-violet-100/90 via-indigo-50 to-teal-100/80 border border-violet-200/60 shadow-sm shadow-violet-200/25">
              <Sparkle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-700">Secure sign in</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
              Welcome{' '}
              <span className="bg-linear-to-r from-violet-600 via-indigo-500 to-teal-500 bg-clip-text text-transparent">back</span>
            </h1>
            <p className="text-slate-600">Sign in to track episodes, insights, and care.</p>
          </div>

          {/* Card with gradient frame (matches landing hero frame) */}
          <div className="rounded-2xl p-[2px] bg-linear-to-br from-violet-400 via-indigo-400 to-teal-400 shadow-2xl shadow-indigo-300/30">
            <div className="rounded-[14px] bg-white/95 backdrop-blur-md border border-white/60 overflow-hidden">
              <div className="px-6 pt-8 pb-2 text-center border-b border-slate-100/80">
                <h2 className="text-lg font-bold text-slate-900">Sign in</h2>
                <p className="text-sm text-slate-500 mt-1 pb-6">Use your clinic or demo credentials</p>
              </div>
              <div className="p-6 pt-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400 w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="doctor@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11 border-slate-200 rounded-xl focus-visible:border-violet-400 focus-visible:ring-violet-400/30"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500/80 w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 h-11 border-slate-200 rounded-xl focus-visible:border-teal-500 focus-visible:ring-teal-500/30"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500/40"
                      />
                      <span className="ml-2 text-sm text-slate-600">Remember me</span>
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-violet-600 hover:text-indigo-600 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 rounded-xl text-base font-semibold text-white bg-linear-to-r from-violet-600 via-indigo-600 to-teal-500 shadow-lg shadow-indigo-400/25 hover:brightness-[1.06] hover:shadow-indigo-400/35 transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Signing in…
                      </span>
                    ) : (
                      'Sign in'
                    )}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                  <p className="text-slate-600 text-sm">
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Accent strip + footer */}
          <div className="mt-10 text-center space-y-4">
            <div className="h-1 w-24 mx-auto rounded-full bg-linear-to-r from-violet-500 via-indigo-500 to-teal-400 opacity-80" />
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} PainPal AI. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
