import { NextRequest, NextResponse } from 'next/server';
import { createServiceLog, completeService } from '@/lib/services';
import { getDb, initDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    const res = await db.execute(`
      SELECT s.*, u.tipe as unit_tipe, u.storage as unit_storage, u.imei as unit_imei, usr.nama as teknisi_nama
      FROM servis s
      LEFT JOIN unit u ON s.unit_id = u.id
      LEFT JOIN pengguna usr ON s.teknisi_id = usr.id
      ORDER BY s.tanggal DESC, s.id DESC
    `);

    return NextResponse.json(res.rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching services' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createServiceLog(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Service error:', error);
    return NextResponse.json({ error: error.message || 'Error logging service' }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceId, userId } = body;
    const result = await completeService(Number(serviceId), Number(userId || 1));
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error completing service' }, { status: 400 });
  }
}
