import { NextRequest, NextResponse } from 'next/server';

// Add dummy route handlers to satisfy Next.js routing requirements
export async function GET() {
  return NextResponse.json({ message: 'Base CRUD handler - use specific model routes' });
}

export async function POST() {
  return NextResponse.json({ message: 'Base CRUD handler - use specific model routes' });
}

export async function PUT() {
  return NextResponse.json({ message: 'Base CRUD handler - use specific model routes' });
}

export async function PATCH() {
  return NextResponse.json({ message: 'Base CRUD handler - use specific model routes' });
}

export async function DELETE() {
  return NextResponse.json({ message: 'Base CRUD handler - use specific model routes' });
}