import { NextRequest, NextResponse } from 'next/server';
import { updatePassword } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, oldPassword, newPassword } = body;

    if (!userId || !oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Semua kolom kata sandi wajib diisi' },
        { status: 400 }
      );
    }

    const result = await updatePassword(Number(userId), oldPassword, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message || 'Gagal mengubah kata sandi' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Kata sandi berhasil diperbarui',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan sistem' },
      { status: 500 }
    );
  }
}
