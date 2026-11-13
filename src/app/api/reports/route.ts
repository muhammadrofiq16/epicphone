import { NextRequest, NextResponse } from 'next/server';
import { getFinancialReport } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const range = (request.nextUrl.searchParams.get('range') as any) || '30_hari';
    const report = await getFinancialReport(range);
    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error generating report' }, { status: 500 });
  }
}
