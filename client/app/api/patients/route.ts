import { NextRequest } from 'next/server'
import { baseCrudHandler } from '../baseRoute/route'
import { requireRole } from '@/lib/auth/middleware'

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'PATIENT', 'DOCTOR'])
  if (!auth.authorized) return auth.response!
  return baseCrudHandler('patientProfile', req)
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN'])
  if (!auth.authorized) return auth.response!
  return baseCrudHandler('patientProfile', req)
}

export async function PUT(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'PATIENT'])
  if (!auth.authorized) return auth.response!
  return baseCrudHandler('patientProfile', req)
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN', 'PATIENT'])
  if (!auth.authorized) return auth.response!
  return baseCrudHandler('patientProfile', req)
}

export async function DELETE(req: NextRequest) {
  const auth = await requireRole(req, ['ADMIN'])
  if (!auth.authorized) return auth.response!
  return baseCrudHandler('patientProfile', req)
}
