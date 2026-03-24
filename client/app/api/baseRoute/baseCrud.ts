import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type ModelName =
  | 'user'
  | 'doctorProfile'
  | 'patientProfile'
  | 'clinic'
  | 'patientDoctorLink'
  | 'migraineEvent'
  | 'medicationLog'
  | 'doctorPatientSummary'
  | 'aIDiagnosticInsight';

export async function baseCrudHandler(model: ModelName, req: NextRequest) {
  const { method, url } = req;
  const { searchParams } = new URL(url);
  const id = searchParams.get('id');

  const delegate: any = (prisma as any)[model];

  try {
    switch (method) {
      case 'GET': {
        if (id) {
          const item = await delegate.findUnique({ where: { id } });
          if (!item) return NextResponse.json({ error: `${String(model)} not found` }, { status: 404 });
          return NextResponse.json(item);
        }
        const items = await delegate.findMany();
        return NextResponse.json(items);
      }
      case 'POST': {
        const data = await req.json();

        try {
          const pathname = req.nextUrl?.pathname || req.url || '';
          if ((pathname.includes('/api/student') || pathname.includes('/api/students')) && !data.studentId) {
            data.studentId = `STU${Date.now()}`;
          }
        } catch (_e) {
          // no-op
        }

        const item = await delegate.create({ data });
        return NextResponse.json(item);
      }
      case 'PUT': {
        const { id, ...data } = await req.json();
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const item = await delegate.update({ where: { id }, data });
        return NextResponse.json(item);
      }
      case 'PATCH': {
        const { id, ...data } = await req.json();
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const item = await delegate.update({ where: { id }, data });
        return NextResponse.json(item);
      }
      case 'DELETE': {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        await delegate.delete({ where: { id } });
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
