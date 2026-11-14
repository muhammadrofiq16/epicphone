import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password, rememberMe } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username dan kata sandi wajib diisi' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(username, password);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Username atau kata sandi salah' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      user,
    });

    // Set auth cookie
    const cookieMaxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7; // 30 hari atau 7 hari
    response.cookies.set('epicphone_auth', JSON.stringify({ id: user.id, username: user.username, role: user.peran }), {
      path: '/',
      httpOnly: false, // Accessible by client AuthContext for seamless hydration
      sameSite: 'lax',
      maxAge: cookieMaxAge,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Terjadi kesalahan sistem saat login' },
      { status: 500 }
    );
  }
}
