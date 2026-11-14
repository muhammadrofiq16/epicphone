import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Logout berhasil',
  });

  // Hapus cookie auth
  response.cookies.set('epicphone_auth', '', {
    path: '/',
    maxAge: 0,
  });

  return response;
}
