'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Brain, Eye, EyeOff, Mail, Lock, User, Phone, AlertCircle, Check, Sparkle } from 'lucide-react'

export default function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    agreeToTerms: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions')
      setIsLoading(false)
      return
    }

    setTimeout(() => {
      setIsLoading(false)
      window.location.href = '/signin'
    }, 2000)
  }

  const passwordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 2) return 'bg-rose-500'
    if (strength <= 3) return 'bg-amber-500'
    return 'bg-teal-500'
  }

  const getPasswordStrengthText = (strength: number) => {
    if (strength <= 2) return 'Weak'
    if (strength <= 3) return 'Medium'
    return 'Strong'
  }

  const inputClass =
    'h-11 border-slate-200 rounded-xl focus-visible:border-violet-400 focus-visible:ring-violet-400/30'
  const inputClassTeal =
    'h-11 border-slate-200 rounded-xl focus-visible:border-teal-500 focus-visible:ring-teal-500/30'

  return (
    <div className="relative min-h-screen flex flex-col bg-linear-to-br from-indigo-50 via-white to-amber-50/35">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.18),transparent)]" />
        <div className="absolute top-20 right-0 h-72 w-72 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="absolute bottom-20 left-0 h-80 w-80 rounded-full bg-teal-300/18 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 h-56 w-56 rounded-full bg-amber-200/25 blur-3xl" />
      </div>

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
            <Link href="/signin" className="text-slate-600 hover:text-teal-600 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5 bg-linear-to-r from-violet-100/90 via-indigo-50 to-teal-100/80 border border-violet-200/60 shadow-sm shadow-violet-200/25">
              <Sparkle className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-sm font-semibold text-slate-700">Join PainPal AI</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
              Create your{' '}
              <span className="bg-linear-to-r from-violet-600 via-indigo-500 to-teal-500 bg-clip-text text-transparent">
                account
              </span>
            </h1>
            <p className="text-slate-600">Track episodes, insights, and care in one place.</p>
          </div>

          <div className="rounded-2xl p-[2px] bg-linear-to-br from-violet-400 via-indigo-400 to-teal-400 shadow-2xl shadow-indigo-300/30">
            <div className="rounded-[14px] bg-white/95 backdrop-blur-md border border-white/60 overflow-hidden">
              <div className="px-6 pt-8 pb-2 text-center border-b border-slate-100/80">
                <h2 className="text-lg font-bold text-slate-900">Sign up</h2>
                <p className="text-sm text-slate-500 mt-1 pb-6">
                  {step === 1 ? 'Step 1 of 2 — Your details' : 'Step 2 of 2 — Security'}
                </p>
              </div>
              <div className="p-6 pt-5">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {step === 1 && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-slate-700">
                            First name
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400 w-4 h-4" />
                            <Input
                              id="firstName"
                              type="text"
                              placeholder="John"
                              value={formData.firstName}
                              onChange={(e) => handleInputChange('firstName', e.target.value)}
                              className={`pl-9 ${inputClass}`}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-slate-700">
                            Last name
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400 w-4 h-4" />
                            <Input
                              id="lastName"
                              type="text"
                              placeholder="Doe"
                              value={formData.lastName}
                              onChange={(e) => handleInputChange('lastName', e.target.value)}
                              className={`pl-9 ${inputClass}`}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-700">
                          Email
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-400 w-5 h-5" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="john.doe@example.com"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={`pl-10 ${inputClass}`}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-slate-700">
                          Phone
                        </Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500/80 w-5 h-5" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className={`pl-10 ${inputClassTeal}`}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role" className="text-slate-700">
                          I am a
                        </Label>
                        <select
                          id="role"
                          value={formData.role}
                          onChange={(e) => handleInputChange('role', e.target.value)}
                          className="w-full h-11 px-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 bg-white text-slate-800"
                        >
                          <option value="patient">Patient</option>
                          <option value="doctor">Healthcare professional</option>
                        </select>
                      </div>

                      <Button
                        type="button"
                        onClick={() => setStep(2)}
                        className="w-full h-12 rounded-xl text-base font-semibold text-white bg-linear-to-r from-violet-600 via-indigo-600 to-teal-500 shadow-lg shadow-indigo-400/25 hover:brightness-[1.06] hover:shadow-indigo-400/35 transition-all duration-300"
                      >
                        Continue
                      </Button>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-700">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500/80 w-5 h-5" />
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create a strong password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className={`pl-10 pr-10 ${inputClassTeal}`}
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
                        {formData.password && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength(formData.password))}`}
                                  style={{ width: `${(passwordStrength(formData.password) / 5) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-slate-600">
                                {getPasswordStrengthText(passwordStrength(formData.password))}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 space-y-1">
                              <div
                                className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'text-teal-600' : 'text-slate-400'}`}
                              >
                                <Check className="w-3 h-3" />
                                At least 8 characters
                              </div>
                              <div
                                className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? 'text-teal-600' : 'text-slate-400'}`}
                              >
                                <Check className="w-3 h-3" />
                                One uppercase letter
                              </div>
                              <div
                                className={`flex items-center gap-2 ${/[0-9]/.test(formData.password) ? 'text-teal-600' : 'text-slate-400'}`}
                              >
                                <Check className="w-3 h-3" />
                                One number
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-slate-700">
                          Confirm password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500/80 w-5 h-5" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                            className={`pl-10 pr-10 ${inputClassTeal}`}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-600 transition-colors"
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          id="agreeToTerms"
                          checked={formData.agreeToTerms}
                          onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                          className="mt-1 rounded border-slate-300 text-violet-600 focus:ring-violet-500/40"
                          required
                        />
                        <label htmlFor="agreeToTerms" className="text-sm text-slate-600 leading-relaxed">
                          I agree to the{' '}
                          <Link href="/terms" className="font-medium text-violet-600 hover:text-indigo-600 transition-colors">
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link href="/privacy" className="font-medium text-teal-600 hover:text-teal-700 transition-colors">
                            Privacy Policy
                          </Link>
                        </label>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setStep(1)}
                          className="flex-1 h-12 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                          Back
                        </Button>
                        <Button
                          type="submit"
                          className="flex-1 h-12 rounded-xl text-base font-semibold text-white bg-linear-to-r from-violet-600 via-indigo-600 to-teal-500 shadow-lg shadow-indigo-400/25 hover:brightness-[1.06] hover:shadow-indigo-400/35 transition-all duration-300"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Creating…
                            </span>
                          ) : (
                            'Create account'
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </form>

                <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                  <p className="text-slate-600 text-sm">
                    Already have an account?{' '}
                    <Link href="/signin" className="font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>

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
