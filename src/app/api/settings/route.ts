import { NextRequest, NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/services';

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await updateSettings(body);
    const updated = await getSettings();
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating settings' }, { status: 400 });
  }
}
