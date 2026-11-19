import { NextRequest, NextResponse } from 'next/server';
import { createSale } from '@/lib/services';
import { getDb, initDb } from '@/lib/db';
import { UserRole, Sale } from '@/types';

export async function GET(request: NextRequest) {
  try {
    await initDb();
    const db = getDb();
    const role = (request.nextUrl.searchParams.get('role') as UserRole) || 'pemilik';

    const res = await db.execute(`
      SELECT p.*, u.tipe as unit_tipe, u.storage as unit_storage, u.warna as unit_warna, u.imei as unit_imei, u.imei2 as unit_imei2, u.jenis_garansi as unit_jenis_garansi, u.status_sinyal as unit_status_sinyal, u.status_sim_lock as unit_status_sim_lock, u.garansi_sinyal as unit_garansi_sinyal, usr.nama as pencatat_nama
      FROM penjualan p
      LEFT JOIN unit u ON p.unit_id = u.id
      LEFT JOIN pengguna usr ON p.pencatat_id = usr.id
      ORDER BY p.tanggal DESC, p.id DESC
    `);

    const sales: Sale[] = res.rows.map((r) => ({
      id: Number(r.id),
      nomor_nota: String(r.nomor_nota),
      tanggal: String(r.tanggal),
      unit_id: Number(r.unit_id),
      unit_info: `${r.unit_tipe || ''} ${r.unit_storage || ''} ${r.unit_warna || ''}`.trim(),
      unit_imei: String(r.unit_imei || ''),
      unit_imei2: r.unit_imei2 ? String(r.unit_imei2) : undefined,
      unit_jenis_garansi: r.unit_jenis_garansi as any,
      unit_status_sinyal: r.unit_status_sinyal as any,
      unit_status_sim_lock: r.unit_status_sim_lock as any,
      unit_garansi_sinyal: r.unit_garansi_sinyal ? String(r.unit_garansi_sinyal) : undefined,
      kontak_id: r.kontak_id ? Number(r.kontak_id) : null,
      pembeli_nama: r.pembeli_nama ? String(r.pembeli_nama) : 'Pelanggan Umum',
      pembeli_telepon: r.pembeli_telepon ? String(r.pembeli_telepon) : null,
      harga_jual: Number(r.harga_jual),
      diskon: Number(r.diskon),
      harga_akhir: Number(r.harga_akhir),
      hpp_unit: role === 'pemilik' ? Number(r.hpp_unit) : 0,
      laba_kotor: role === 'pemilik' ? Number(r.laba_kotor) : 0,
      garansi_hari: Number(r.garansi_hari),
      status_bayar: r.status_bayar as any,
      metode_bayar: r.metode_bayar as any,
      catatan: r.catatan ? String(r.catatan) : null,
      pencatat_id: Number(r.pencatat_id),
      pencatat_nama: r.pencatat_nama ? String(r.pencatat_nama) : '',
      status_transaksi: r.status_transaksi as any,
      alasan_batal: r.alasan_batal ? String(r.alasan_batal) : null,
      tipe_transaksi: r.tipe_transaksi as any,
    }));

    return NextResponse.json(sales);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error fetching sales' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createSale(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Sale creation error:', error);
    return NextResponse.json({ error: error.message || 'Error creating sale' }, { status: 400 });
  }
}
