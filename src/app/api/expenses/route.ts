import { NextRequest, NextResponse } from 'next/server';
import { getExpenses, createExpense } from '@/lib/services';

export async function GET() {
  try {
    const expenses = await getExpenses();
    return NextResponse.json(expenses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching expenses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createExpense(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error saving expense' }, { status: 400 });
  }
}
