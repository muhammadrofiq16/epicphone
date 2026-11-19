import { NextRequest, NextResponse } from 'next/server';
import { getUnits } from '@/lib/services';
import { UserRole } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const status = request.nextUrl.searchParams.get('status') || undefined;
    const search = request.nextUrl.searchParams.get('search') || undefined;
    const jenis_garansi = request.nextUrl.searchParams.get('jenis_garansi') || undefined;
    const status_sinyal = request.nextUrl.searchParams.get('status_sinyal') || undefined;
    const role = (request.nextUrl.searchParams.get('role') as UserRole) || 'pemilik';

    const units = await getUnits({ status, search, role, jenis_garansi, status_sinyal });
    return NextResponse.json(units);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching units' }, { status: 500 });
  }
}
