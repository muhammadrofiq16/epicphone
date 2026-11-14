import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const authCookie = request.cookies.get('epicphone_auth')?.value;
    if (!authCookie) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(authCookie);
    } catch {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    if (!parsed?.id) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
    }

    const user = await getUserById(Number(parsed.id));
    if (!user || !user.aktif) {
      const res = NextResponse.json({ authenticated: false, user: null }, { status: 401 });
      res.cookies.set('epicphone_auth', '', { path: '/', maxAge: 0 });
      return res;
    }

    return NextResponse.json({
      authenticated: true,
      user,
    });
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 });
  }
}
