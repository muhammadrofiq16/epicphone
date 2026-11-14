import { NextRequest, NextResponse } from 'next/server';
import { resetAllBusinessData } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Konfirmasi keamanan
    if (body?.confirm !== 'HAPUS_DATA_DEMO') {
      return NextResponse.json(
        { success: false, error: 'Konfirmasi tidak valid. Kirimkan confirm: "HAPUS_DATA_DEMO"' },
        { status: 400 }
      );
    }

    const result = await resetAllBusinessData();

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error('Reset data error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Gagal mereset data sistem' },
      { status: 500 }
    );
  }
}
