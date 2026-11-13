import { NextRequest, NextResponse } from 'next/server';
import { getUnitById, updateUnitStatus } from '@/lib/services';
import { UserRole, UnitStatus } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const role = (request.nextUrl.searchParams.get('role') as UserRole) || 'pemilik';

    const unitDetail = await getUnitById(Number(id), role);
    if (!unitDetail) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    return NextResponse.json(unitDetail);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching unit detail' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, userId, notes } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const result = await updateUnitStatus(Number(id), status as UnitStatus, Number(userId || 1), notes);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating unit status' }, { status: 500 });
  }
}
