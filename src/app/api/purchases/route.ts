import { NextRequest, NextResponse } from 'next/server';
import { createPurchase } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createPurchase(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Purchase creation error:', error);
    return NextResponse.json({ error: error.message || 'Error creating purchase' }, { status: 400 });
  }
}
