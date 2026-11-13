import { NextRequest, NextResponse } from 'next/server';
import { getDashboardSummary } from '@/lib/services';
import { UserRole } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const role = (request.nextUrl.searchParams.get('role') as UserRole) || 'pemilik';
    const summary = await getDashboardSummary(role);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('Dashboard API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
