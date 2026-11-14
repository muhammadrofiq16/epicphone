import { getDb, initDb } from './db';
import {
  User,
  UserRole,
  Unit,
  UnitStatus,
  Purchase,
  Sale,
  ServiceLog,
  Expense,
  StoreSettings,
  DashboardSummary,
  PaymentMethod,
  PaymentStatus,
} from '@/types';

// Ensure DB is initialized
async function ensureDb() {
  await initDb();
  return getDb();
}

// ----------------- USER & AUTH -----------------
export async function getUsers(): Promise<User[]> {
  const db = await ensureDb();
  const res = await db.execute('SELECT id, nama, username, peran, aktif FROM pengguna WHERE aktif = 1');
  return res.rows.map((r) => ({
    id: Number(r.id),
    nama: String(r.nama),
    username: String(r.username),
    peran: r.peran as UserRole,
    aktif: Boolean(r.aktif),
  }));
}

export async function getUserById(id: number): Promise<User | null> {
  const db = await ensureDb();
  const res = await db.execute({
    sql: 'SELECT id, nama, username, peran, aktif FROM pengguna WHERE id = ?',
    args: [id],
  });
  if (res.rows.length === 0) return null;
  const r = res.rows[0];
  return {
    id: Number(r.id),
    nama: String(r.nama),
    username: String(r.username),
    peran: r.peran as UserRole,
    aktif: Boolean(r.aktif),
  };
}

export async function authenticateUser(username: string, kataSandi: string): Promise<User | null> {
  const db = await ensureDb();
  const cleanUsername = username.trim().toLowerCase();
  const res = await db.execute({
    sql: 'SELECT id, nama, username, kata_sandi, peran, aktif FROM pengguna WHERE LOWER(username) = ? AND aktif = 1',
    args: [cleanUsername],
  });

  if (res.rows.length === 0) return null;
  const user = res.rows[0];

  if (String(user.kata_sandi) !== kataSandi) {
    return null;
  }

  return {
    id: Number(user.id),
    nama: String(user.nama),
    username: String(user.username),
    peran: user.peran as UserRole,
    aktif: Boolean(user.aktif),
  };
}

export async function updatePassword(
  userId: number,
  kataSandiLama: string,
  kataSandiBaru: string
): Promise<{ success: boolean; message?: string }> {
  const db = await ensureDb();
  const res = await db.execute({
    sql: 'SELECT id, kata_sandi FROM pengguna WHERE id = ?',
    args: [userId],
  });

  if (res.rows.length === 0) {
    return { success: false, message: 'Pengguna tidak ditemukan' };
  }

  const currentPass = String(res.rows[0].kata_sandi);
  if (currentPass !== kataSandiLama) {
    return { success: false, message: 'Kata sandi lama salah / tidak cocok' };
  }

  if (!kataSandiBaru || kataSandiBaru.length < 4) {
    return { success: false, message: 'Kata sandi baru minimal 4 karakter' };
  }

  await db.execute({
    sql: 'UPDATE pengguna SET kata_sandi = ? WHERE id = ?',
    args: [kataSandiBaru, userId],
  });

  return { success: true };
}

// ----------------- SETTINGS -----------------
export async function getSettings(): Promise<StoreSettings> {
  const db = await ensureDb();
  const res = await db.execute('SELECT kunci, nilai FROM pengaturan');
  const dict: Record<string, string> = {};
  res.rows.forEach((r) => {
    dict[String(r.kunci)] = String(r.nilai);
  });

  return {
    batas_stok_mengendap: Number(dict['batas_stok_mengendap'] || 30),
    batas_margin_min: Number(dict['batas_margin_min'] || 200000),
    nama_toko: dict['nama_toko'] || 'EpicPhone Store',
    alamat_toko: dict['alamat_toko'] || '',
    telepon_toko: dict['telepon_toko'] || '',
    pesan_nota_wa: dict['pesan_nota_wa'] || 'Terima kasih telah berbelanja di EpicPhone!',
    tema_gelap: dict['tema_gelap'] === 'true',
    sembunyikan_angka: dict['sembunyikan_angka'] === 'true',
    logo_url: dict['logo_url'] || '/images/logo.svg',
  };
}

export async function updateSettings(settings: Partial<StoreSettings>) {
  const db = await ensureDb();
  for (const [key, val] of Object.entries(settings)) {
    await db.execute({
      sql: 'INSERT INTO pengaturan (kunci, nilai) VALUES (?, ?) ON CONFLICT(kunci) DO UPDATE SET nilai = excluded.nilai',
      args: [key, String(val)],
    });
  }
}

// ----------------- DASHBOARD -----------------
export async function getDashboardSummary(role: UserRole = 'pemilik'): Promise<DashboardSummary> {
  const db = await ensureDb();
  const settings = await getSettings();
  const today = new Date().toISOString().split('T')[0];

  // Omzet & Laba hari ini
  const salesTodayRes = await db.execute({
    sql: `SELECT 
            COALESCE(SUM(harga_akhir), 0) as omzet,
            COALESCE(SUM(laba_kotor), 0) as laba,
            COUNT(*) as unit_terjual
          FROM penjualan 
          WHERE DATE(tanggal) = DATE(?) AND status_transaksi = 'selesai'`,
    args: [today],
  });

  const omzetHariIni = Number(salesTodayRes.rows[0]?.omzet || 0);
  const labaHariIni = role === 'pemilik' ? Number(salesTodayRes.rows[0]?.laba || 0) : 0;
  const unitTerjualHariIni = Number(salesTodayRes.rows[0]?.unit_terjual || 0);

  // Kas masuk hari ini (dari tabel pembayaran)
  const kasRes = await db.execute({
    sql: `SELECT COALESCE(SUM(jumlah), 0) as kas_masuk FROM pembayaran WHERE DATE(tanggal) = DATE(?) AND jenis = 'penjualan'`,
    args: [today],
  });
  const kasMasukHariIni = Number(kasRes.rows[0]?.kas_masuk || 0);

  // Stok Siap Jual
  const readyStockRes = await db.execute(`SELECT COUNT(*) as cnt FROM unit WHERE status = 'Siap jual'`);
  const stokSiapJual = Number(readyStockRes.rows[0]?.cnt || 0);

  // Stok Mengendap (> batas hari)
  const agingUnitsRes = await db.execute({
    sql: `SELECT * FROM unit 
          WHERE status = 'Siap jual' 
          AND julianday('now') - julianday(tanggal_masuk) >= ?
          ORDER BY tanggal_masuk ASC`,
    args: [settings.batas_stok_mengendap],
  });

  const stokMengendap = agingUnitsRes.rows.map((r) => sanitizeUnit(r, role));

  // Servis menunggu / diproses
  const pendingServiceRes = await db.execute(`
    SELECT u.*, s.kerusakan, s.biaya 
    FROM unit u 
    INNER JOIN servis s ON u.id = s.unit_id 
    WHERE u.status = 'Dicek/Servis' AND s.status != 'selesai'
    ORDER BY s.tanggal DESC
  `);
  const servisMenunggu = pendingServiceRes.rows.map((r) => ({
    ...sanitizeUnit(r, role),
    kerusakan: String(r.kerusakan || ''),
    biaya: Number(r.biaya || 0),
  }));

  // Piutang
  const piutangRes = await db.execute(`
    SELECT COUNT(*) as cnt, COALESCE(SUM(harga_akhir), 0) as total_piutang 
    FROM penjualan 
    WHERE status_bayar != 'lunas' AND status_transaksi = 'selesai'
  `);
  const piutangCount = Number(piutangRes.rows[0]?.cnt || 0);
  const piutangTotal = Number(piutangRes.rows[0]?.total_piutang || 0);

  // 7-day revenue trend
  const chart7dRes = await db.execute(`
    SELECT DATE(tanggal) as tgl, COALESCE(SUM(harga_akhir), 0) as total 
    FROM penjualan 
    WHERE status_transaksi = 'selesai' AND tanggal >= date('now', '-7 days')
    GROUP BY DATE(tanggal)
    ORDER BY DATE(tanggal) ASC
  `);

  // Fill all 7 days even if 0
  const chart7d = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short' });
    const match = chart7dRes.rows.find((row) => String(row.tgl) === dateStr);
    chart7d.push({
      tanggal: dateStr,
      label: dayLabel,
      total: match ? Number(match.total) : 0,
    });
  }

  // 30-day revenue trend
  const chart30dRes = await db.execute(`
    SELECT DATE(tanggal) as tgl, COALESCE(SUM(harga_akhir), 0) as total 
    FROM penjualan 
    WHERE status_transaksi = 'selesai' AND tanggal >= date('now', '-30 days')
    GROUP BY DATE(tanggal)
    ORDER BY DATE(tanggal) ASC
  `);

  const chart30d = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const match = chart30dRes.rows.find((row) => String(row.tgl) === dateStr);
    chart30d.push({
      tanggal: dateStr,
      label: `${d.getDate()}/${d.getMonth() + 1}`,
      total: match ? Number(match.total) : 0,
    });
  }

  const totalOmzet30d = chart30d.reduce((sum, item) => sum + item.total, 0);
  const rataRataOmzet = chart30d.length > 0 ? Math.round(totalOmzet30d / chart30d.length) : 0;

  // Transaksi Terakhir (5)
  const recentSalesRes = await db.execute(`
    SELECT p.*, u.tipe as unit_tipe, u.storage as unit_storage, u.warna as unit_warna, u.imei as unit_imei, usr.nama as pencatat_nama
    FROM penjualan p
    LEFT JOIN unit u ON p.unit_id = u.id
    LEFT JOIN pengguna usr ON p.pencatat_id = usr.id
    ORDER BY p.tanggal DESC, p.id DESC
    LIMIT 5
  `);

  const transaksiTerakhir: Sale[] = recentSalesRes.rows.map((r) => {
    const s = {
      id: Number(r.id),
      nomor_nota: String(r.nomor_nota),
      tanggal: String(r.tanggal),
      unit_id: Number(r.unit_id),
      unit_info: `${r.unit_tipe || ''} ${r.unit_storage || ''} ${r.unit_warna || ''}`.trim(),
      unit_imei: String(r.unit_imei || ''),
      kontak_id: r.kontak_id ? Number(r.kontak_id) : null,
      pembeli_nama: r.pembeli_nama ? String(r.pembeli_nama) : 'Pelanggan Umum',
      pembeli_telepon: r.pembeli_telepon ? String(r.pembeli_telepon) : null,
      harga_jual: Number(r.harga_jual),
      diskon: Number(r.diskon),
      harga_akhir: Number(r.harga_akhir),
      hpp_unit: role === 'pemilik' ? Number(r.hpp_unit) : 0,
      laba_kotor: role === 'pemilik' ? Number(r.laba_kotor) : 0,
      garansi_hari: Number(r.garansi_hari),
      status_bayar: r.status_bayar as PaymentStatus,
      metode_bayar: r.metode_bayar as PaymentMethod,
      catatan: r.catatan ? String(r.catatan) : null,
      pencatat_id: Number(r.pencatat_id),
      pencatat_nama: r.pencatat_nama ? String(r.pencatat_nama) : '',
      status_transaksi: r.status_transaksi as 'selesai' | 'dibatalkan',
      alasan_batal: r.alasan_batal ? String(r.alasan_batal) : null,
      tipe_transaksi: r.tipe_transaksi as 'reguler' | 'tukar_tambah',
    };
    return s;
  });

  return {
    omzet_hari_ini: omzetHariIni,
    laba_kotor_hari_ini: labaHariIni,
    kas_masuk_hari_ini: kasMasukHariIni,
    unit_terjual_hari_ini: unitTerjualHariIni,
    stok_siap_jual: stokSiapJual,
    stok_mengendap_count: stokMengendap.length,
    servis_menunggu_count: servisMenunggu.length,
    piutang_count: piutangCount,
    piutang_total: piutangTotal,
    omzet_chart_7d: chart7d,
    omzet_chart_30d: chart30d,
    rata_rata_omzet: rataRataOmzet,
    transaksi_terakhir: transaksiTerakhir,
    unit_perlu_perhatian: {
      stok_mengendap: stokMengendap,
      servis_menunggu: servisMenunggu,
    },
  };
}

// ----------------- UNIT SERVICE -----------------
function sanitizeUnit(row: any, role: UserRole): Unit {
  const isOwner = role === 'pemilik';
  return {
    id: Number(row.id),
    merk: String(row.merk),
    tipe: String(row.tipe),
    storage: String(row.storage),
    warna: String(row.warna),
    imei: String(row.imei),
    battery_health: row.battery_health !== null ? Number(row.battery_health) : null,
    kondisi: row.kondisi ? String(row.kondisi) : null,
    kelengkapan: row.kelengkapan ? String(row.kelengkapan) : null,
    status: row.status as UnitStatus,
    status_imei: row.status_imei as 'aman' | 'bermasalah',
    catatan_imei: row.catatan_imei ? String(row.catatan_imei) : null,
    harga_beli: isOwner ? Number(row.harga_beli) : 0,
    total_biaya_servis: isOwner ? Number(row.total_biaya_servis) : 0,
    hpp: isOwner ? Number(row.hpp) : 0,
    harga_jual_rekomendasi: row.harga_jual_rekomendasi ? Number(row.harga_jual_rekomendasi) : null,
    harga_jual_aktual: row.harga_jual_aktual ? Number(row.harga_jual_aktual) : null,
    tanggal_masuk: String(row.tanggal_masuk),
    foto: (() => {
      if (!row.foto) return null;
      try {
        const parsed = JSON.parse(String(row.foto));
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return [String(row.foto)];
      }
    })(),
    catatan: row.catatan ? String(row.catatan) : null,
    created_at: row.created_at ? String(row.created_at) : undefined,
    updated_at: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export async function getUnits(params: {
  status?: string;
  search?: string;
  role?: UserRole;
}): Promise<Unit[]> {
  const db = await ensureDb();
  const role = params.role || 'pemilik';

  let query = 'SELECT * FROM unit WHERE 1=1';
  const args: any[] = [];

  if (params.status && params.status !== 'Semua') {
    query += ' AND status = ?';
    args.push(params.status);
  }

  if (params.search && params.search.trim() !== '') {
    const q = `%${params.search.trim()}%`;
    query += ' AND (imei LIKE ? OR tipe LIKE ? OR merk LIKE ? OR warna LIKE ?)';
    args.push(q, q, q, q);
  }

  query += ' ORDER BY id DESC';

  const res = await db.execute({ sql: query, args });
  return res.rows.map((r) => sanitizeUnit(r, role));
}

export async function getUnitById(id: number, role: UserRole = 'pemilik') {
  const db = await ensureDb();
  const unitRes = await db.execute({
    sql: 'SELECT * FROM unit WHERE id = ?',
    args: [id],
  });

  if (unitRes.rows.length === 0) return null;
  const unit = sanitizeUnit(unitRes.rows[0], role);

  // History pembelian
  const purchaseRes = await db.execute({
    sql: `SELECT p.*, k.nama as seller_nama, k.telepon as seller_telepon, u.nama as pencatat_nama
          FROM pembelian p
          LEFT JOIN kontak k ON p.kontak_id = k.id
          LEFT JOIN pengguna u ON p.pencatat_id = u.id
          WHERE p.unit_id = ?`,
    args: [id],
  });

  // History servis
  const serviceRes = await db.execute({
    sql: `SELECT s.*, u.nama as teknisi_nama 
          FROM servis s 
          LEFT JOIN pengguna u ON s.teknisi_id = u.id
          WHERE s.unit_id = ?
          ORDER BY s.tanggal DESC`,
    args: [id],
  });

  // History penjualan
  const saleRes = await db.execute({
    sql: `SELECT s.*, u.nama as pencatat_nama 
          FROM penjualan s 
          LEFT JOIN pengguna u ON s.pencatat_id = u.id
          WHERE s.unit_id = ?`,
    args: [id],
  });

  return {
    unit,
    pembelian: purchaseRes.rows[0]
      ? {
          ...purchaseRes.rows[0],
          harga_beli: role === 'pemilik' ? Number(purchaseRes.rows[0].harga_beli) : undefined,
          foto_ktp_nota: role === 'pemilik' ? purchaseRes.rows[0].foto_ktp_nota : undefined,
        }
      : null,
    servis: serviceRes.rows.map((s) => ({
      id: Number(s.id),
      tanggal: String(s.tanggal),
      kerusakan: String(s.kerusakan),
      sparepart: s.sparepart ? String(s.sparepart) : null,
      biaya: role === 'pemilik' ? Number(s.biaya) : 0,
      teknisi_id: Number(s.teknisi_id),
      teknisi_nama: String(s.teknisi_nama || ''),
      status: String(s.status),
      catatan: s.catatan ? String(s.catatan) : null,
    })),
    penjualan: saleRes.rows[0]
      ? {
          ...saleRes.rows[0],
          hpp_unit: role === 'pemilik' ? Number(saleRes.rows[0].hpp_unit) : undefined,
          laba_kotor: role === 'pemilik' ? Number(saleRes.rows[0].laba_kotor) : undefined,
        }
      : null,
  };
}

export async function updateUnitStatus(
  unitId: number,
  newStatus: UnitStatus,
  userId: number,
  notes?: string
) {
  const db = await ensureDb();

  const prevRes = await db.execute({
    sql: 'SELECT status FROM unit WHERE id = ?',
    args: [unitId],
  });
  if (prevRes.rows.length === 0) throw new Error('Unit tidak ditemukan');
  const oldStatus = String(prevRes.rows[0].status);

  await db.execute({
    sql: 'UPDATE unit SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [newStatus, unitId],
  });

  await db.execute({
    sql: `INSERT INTO log_perubahan (pengguna_id, tabel, record_id, aksi, nilai_lama, nilai_baru, keterangan)
          VALUES (?, 'unit', ?, 'UPDATE_STATUS', ?, ?, ?)`,
    args: [userId, unitId, oldStatus, newStatus, notes || 'Perubahan status unit'],
  });

  return { success: true, oldStatus, newStatus };
}

// ----------------- BARANG MASUK (PURCHASES) -----------------
export async function createPurchase(data: {
  merk?: string;
  tipe: string;
  storage: string;
  warna: string;
  imei: string;
  battery_health?: number;
  kondisi?: string;
  kelengkapan?: string;
  harga_beli: number;
  harga_jual_rekomendasi?: number;
  status_imei: 'aman' | 'bermasalah';
  catatan_imei?: string;
  sumber_jenis: 'supplier' | 'penjual';
  kontak_nama?: string;
  kontak_telepon?: string;
  metode_bayar: PaymentMethod;
  foto_ktp_nota?: string;
  catatan?: string;
  pencatat_id: number;
  is_trade_in?: boolean;
  tanggal_masuk?: string;
  perlu_servis?: boolean;
  fotos?: string[];
}) {
  const db = await ensureDb();

  // Validate IMEI uniqueness (INV-01)
  const existingImei = await db.execute({
    sql: 'SELECT id, tipe, status FROM unit WHERE imei = ?',
    args: [data.imei.trim()],
  });

  if (existingImei.rows.length > 0) {
    throw new Error(`IMEI ${data.imei} sudah pernah terdaftar di sistem! (Unit #${existingImei.rows[0].id} - ${existingImei.rows[0].tipe})`);
  }

  // Handle contact
  let kontakId: number | null = null;
  if (data.kontak_nama && data.kontak_nama.trim() !== '') {
    const contactRes = await db.execute({
      sql: 'INSERT INTO kontak (nama, telepon, jenis, catatan) VALUES (?, ?, ?, ?)',
      args: [
        data.kontak_nama.trim(),
        data.kontak_telepon?.trim() || null,
        data.sumber_jenis,
        'Dibuat otomatis dari barang masuk',
      ],
    });
    kontakId = Number(contactRes.lastInsertRowid);
  }

  // Status unit:
  // IN-01: Unit baru otomatis berstatus 'Baru masuk', atau 'Dicek/Servis' jika butuh servis
  const unitStatus: UnitStatus = data.perlu_servis ? 'Dicek/Servis' : 'Baru masuk';
  const tanggalMasuk = data.tanggal_masuk || new Date().toISOString().split('T')[0];
  const hpp = data.harga_beli;

  const unitRes = await db.execute({
    sql: `INSERT INTO unit (
      merk, tipe, storage, warna, imei, battery_health, kondisi, kelengkapan,
      status, status_imei, catatan_imei, harga_beli, total_biaya_servis, hpp,
      harga_jual_rekomendasi, tanggal_masuk, foto, catatan
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)`,
    args: [
      data.merk || 'Apple',
      data.tipe,
      data.storage,
      data.warna,
      data.imei.trim(),
      data.battery_health || null,
      data.kondisi || 'Mulus standar',
      data.kelengkapan || 'Unit batangan',
      unitStatus,
      data.status_imei,
      data.catatan_imei || null,
      data.harga_beli,
      hpp,
      data.harga_jual_rekomendasi || null,
      tanggalMasuk,
      data.fotos ? JSON.stringify(data.fotos) : null,
      data.catatan || null,
    ],
  });

  const unitId = Number(unitRes.lastInsertRowid);

  // If perlu servis, add initial log in servis table
  if (data.perlu_servis) {
    await db.execute({
      sql: `INSERT INTO servis (unit_id, tanggal, kerusakan, biaya, teknisi_id, status, catatan)
            VALUES (?, ?, ?, 0, ?, 'menunggu', ?)`,
      args: [
        unitId,
        tanggalMasuk,
        data.catatan || 'Pengecekan / perbaikan unit baru masuk',
        data.pencatat_id,
        'Otomatis dari barang masuk butuh servis',
      ],
    });
  }
  const now = new Date();
  const nomorNota = `BM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(unitId).padStart(3, '0')}`;

  const purchaseRes = await db.execute({
    sql: `INSERT INTO pembelian (
      nomor, tanggal, kontak_id, unit_id, harga_beli, metode_bayar, status_bayar,
      foto_ktp_nota, catatan, pencatat_id, is_trade_in
    ) VALUES (?, ?, ?, ?, ?, ?, 'lunas', ?, ?, ?, ?)`,
    args: [
      nomorNota,
      tanggalMasuk,
      kontakId,
      unitId,
      data.harga_beli,
      data.metode_bayar,
      data.foto_ktp_nota || null,
      data.catatan || null,
      data.pencatat_id,
      data.is_trade_in ? 1 : 0,
    ],
  });

  const purchaseId = Number(purchaseRes.lastInsertRowid);

  // Record payment out
  await db.execute({
    sql: `INSERT INTO pembayaran (tanggal, jenis, referensi_id, jumlah, metode, catatan, pencatat_id)
          VALUES (?, 'pembelian', ?, ?, ?, ?, ?)`,
    args: [
      tanggalMasuk,
      purchaseId,
      data.harga_beli,
      data.metode_bayar,
      `Pembayaran barang masuk ${nomorNota}`,
      data.pencatat_id,
    ],
  });

  return { unitId, purchaseId, nomorNota };
}

// ----------------- PENJUALAN (SALES) -----------------
export async function createSale(data: {
  unit_id: number;
  pembeli_nama?: string;
  pembeli_telepon?: string;
  harga_jual: number;
  diskon?: number;
  garansi_hari?: number;
  metode_bayar: PaymentMethod;
  status_bayar?: PaymentStatus;
  catatan?: string;
  pencatat_id: number;
  tipe_transaksi?: 'reguler' | 'tukar_tambah';
  trade_in?: {
    tipe: string;
    storage: string;
    warna: string;
    imei: string;
    battery_health?: number;
    harga_taksiran: number;
    kondisi?: string;
  };
}) {
  const db = await ensureDb();
  const settings = await getSettings();

  // 1. Validate unit exists & is Siap jual (SL-01)
  const unitRes = await db.execute({
    sql: 'SELECT * FROM unit WHERE id = ?',
    args: [data.unit_id],
  });

  if (unitRes.rows.length === 0) throw new Error('Unit tidak ditemukan');
  const unit = unitRes.rows[0];

  if (unit.status !== 'Siap jual') {
    throw new Error(`Unit ${unit.tipe} (IMEI: ${unit.imei}) tidak dapat dijual karena berstatus "${unit.status}". Hanya unit "Siap jual" yang dapat dijual.`);
  }

  const diskon = data.diskon || 0;
  const hargaAkhir = data.harga_jual - diskon;
  const hppUnit = Number(unit.hpp);
  const labaKotor = hargaAkhir - hppUnit;

  // Handle Trade-in (Tukar Tambah)
  let tradeInUnitId: number | null = null;
  let tradeInPotongan = 0;

  if (data.tipe_transaksi === 'tukar_tambah' && data.trade_in) {
    tradeInPotongan = data.trade_in.harga_taksiran;
    // Register the traded-in phone as an incoming unit!
    const tradeInRes = await createPurchase({
      tipe: data.trade_in.tipe,
      storage: data.trade_in.storage,
      warna: data.trade_in.warna,
      imei: data.trade_in.imei,
      battery_health: data.trade_in.battery_health,
      kondisi: data.trade_in.kondisi || 'Mulus tukar tambah',
      harga_beli: tradeInPotongan,
      status_imei: 'aman',
      catatan_imei: 'Tukar tambah customer',
      sumber_jenis: 'penjual',
      kontak_nama: data.pembeli_nama || 'Customer Tukar Tambah',
      kontak_telepon: data.pembeli_telepon,
      metode_bayar: 'tunai',
      catatan: `Unit tukar tambah untuk pembelian unit #${data.unit_id}`,
      pencatat_id: data.pencatat_id,
      is_trade_in: true,
    });
    tradeInUnitId = tradeInRes.unitId;
  }

  // Create Contact if name given
  let kontakId: number | null = null;
  if (data.pembeli_nama && data.pembeli_nama.trim() !== '') {
    const contactRes = await db.execute({
      sql: 'INSERT INTO kontak (nama, telepon, jenis, catatan) VALUES (?, ?, ?, ?)',
      args: [
        data.pembeli_nama.trim(),
        data.pembeli_telepon?.trim() || null,
        'pembeli',
        'Customer pembelian nota',
      ],
    });
    kontakId = Number(contactRes.lastInsertRowid);
  }

  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const nomorNota = `NOT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(100 + Math.random() * 900))}`;
  const statusBayar = data.status_bayar || 'lunas';

  // 2. Insert Sale
  const saleRes = await db.execute({
    sql: `INSERT INTO penjualan (
      nomor_nota, tanggal, unit_id, kontak_id, pembeli_nama, pembeli_telepon,
      harga_jual, diskon, harga_akhir, hpp_unit, laba_kotor, garansi_hari,
      status_bayar, metode_bayar, catatan, pencatat_id, status_transaksi,
      tipe_transaksi, trade_in_unit_id, trade_in_potongan
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'selesai', ?, ?, ?)`,
    args: [
      nomorNota,
      today,
      data.unit_id,
      kontakId,
      data.pembeli_nama || 'Pelanggan Umum',
      data.pembeli_telepon || null,
      data.harga_jual,
      diskon,
      hargaAkhir,
      hppUnit,
      labaKotor,
      data.garansi_hari || 30,
      statusBayar,
      data.metode_bayar,
      data.catatan || null,
      data.pencatat_id,
      data.tipe_transaksi || 'reguler',
      tradeInUnitId,
      tradeInPotongan,
    ],
  });

  const saleId = Number(saleRes.lastInsertRowid);

  // 3. Update Unit status to 'Terjual'
  await db.execute({
    sql: `UPDATE unit SET status = 'Terjual', harga_jual_aktual = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    args: [hargaAkhir, data.unit_id],
  });

  // 4. Record Payment received (Kas masuk)
  // For trade-in, customer pays the net difference: hargaAkhir - tradeInPotongan
  const uangDiterima = Math.max(0, hargaAkhir - tradeInPotongan);
  if (uangDiterima > 0) {
    await db.execute({
      sql: `INSERT INTO pembayaran (tanggal, jenis, referensi_id, jumlah, metode, catatan, pencatat_id)
            VALUES (?, 'penjualan', ?, ?, ?, ?, ?)`,
      args: [
        today,
        saleId,
        uangDiterima,
        data.metode_bayar,
        `Pembayaran nota ${nomorNota}`,
        data.pencatat_id,
      ],
    });
  }

  // 5. Generate WhatsApp message template
  const garansiTgl = new Date(Date.now() + (data.garansi_hari || 30) * 86400000).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const rupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const waText = `🧾 *NOTA RESMI ${settings.nama_toko.toUpperCase()}*
---------------------------------------
No. Nota: ${nomorNota}
Tanggal : ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
Kasir   : EpicPhone Team

*Detail Pesanan:*
📱 Unit  : ${unit.tipe} ${unit.storage} ${unit.warna}
🔍 IMEI  : ${unit.imei}
🔋 B.H   : ${unit.battery_health ? `${unit.battery_health}%` : '-'}
---------------------------------------
Harga    : ${rupiah(data.harga_jual)}
${diskon > 0 ? `Diskon   : -${rupiah(diskon)}\n` : ''}${tradeInPotongan > 0 ? `Tukar Tambah : -${rupiah(tradeInPotongan)}\n` : ''}*TOTAL DIBAYAR: ${rupiah(uangDiterima)}*
Metode   : ${data.metode_bayar.toUpperCase()} (${statusBayar.toUpperCase()})
---------------------------------------
🛡️ *GARANSI TOKO: ${data.garansi_hari || 30} HARI*
Berlaku hingga: ${garansiTgl}
Syarat: Segel utuh, tidak jatuh/kena air.

${settings.pesan_nota_wa}
📍 ${settings.alamat_toko || ''}
📞 CS: ${settings.telepon_toko || ''}`;

  return {
    saleId,
    nomorNota,
    labaKotor,
    isWarningMargin: labaKotor < settings.batas_margin_min,
    isLoss: labaKotor < 0,
    waText,
    waLink: data.pembeli_telepon
      ? `https://wa.me/${data.pembeli_telepon.replace(/\D/g, '').replace(/^0/, '62')}?text=${encodeURIComponent(waText)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`,
  };
}

// ----------------- SERVIS SERVICE -----------------
export async function createServiceLog(data: {
  unit_id: number;
  kerusakan: string;
  sparepart?: string;
  biaya: number;
  teknisi_id: number;
  catatan?: string;
  selesaikan_sekarang?: boolean;
}) {
  const db = await ensureDb();
  const today = new Date().toISOString().split('T')[0];

  const unitRes = await db.execute({
    sql: 'SELECT * FROM unit WHERE id = ?',
    args: [data.unit_id],
  });
  if (unitRes.rows.length === 0) throw new Error('Unit tidak ditemukan');
  const unit = unitRes.rows[0];

  if (unit.status === 'Terjual') {
    throw new Error('Biaya servis hanya bisa dicatat pada unit yang belum terjual.');
  }

  const statusServis = data.selesaikan_sekarang ? 'selesai' : 'proses';

  const servRes = await db.execute({
    sql: `INSERT INTO servis (unit_id, tanggal, kerusakan, sparepart, biaya, teknisi_id, status, catatan)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      data.unit_id,
      today,
      data.kerusakan,
      data.sparepart || null,
      data.biaya,
      data.teknisi_id,
      statusServis,
      data.catatan || null,
    ],
  });

  // SV-02: Biaya servis otomatis menambah total_biaya_servis & modal (HPP) unit
  const newTotalBiayaServis = Number(unit.total_biaya_servis) + data.biaya;
  const newHpp = Number(unit.harga_beli) + newTotalBiayaServis;
  const newUnitStatus: UnitStatus = data.selesaikan_sekarang ? 'Siap jual' : 'Dicek/Servis';

  await db.execute({
    sql: `UPDATE unit 
          SET total_biaya_servis = ?, hpp = ?, status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
    args: [newTotalBiayaServis, newHpp, newUnitStatus, data.unit_id],
  });

  return { serviceId: Number(servRes.lastInsertRowid), newHpp };
}

export async function completeService(serviceId: number, userId: number) {
  const db = await ensureDb();
  const servRes = await db.execute({
    sql: 'SELECT * FROM servis WHERE id = ?',
    args: [serviceId],
  });
  if (servRes.rows.length === 0) throw new Error('Servis tidak ditemukan');
  const serv = servRes.rows[0];

  await db.execute({
    sql: `UPDATE servis SET status = 'selesai' WHERE id = ?`,
    args: [serviceId],
  });

  // Check if all services on unit are completed
  const pendingRes = await db.execute({
    sql: `SELECT COUNT(*) as cnt FROM servis WHERE unit_id = ? AND status != 'selesai'`,
    args: [serv.unit_id],
  });

  if (Number(pendingRes.rows[0].cnt) === 0) {
    // If unit IMEI is safe, set to 'Siap jual'
    const unitRes = await db.execute({
      sql: 'SELECT status_imei FROM unit WHERE id = ?',
      args: [serv.unit_id],
    });
    const statusImei = unitRes.rows[0]?.status_imei;
    const targetStatus = statusImei === 'bermasalah' ? 'Baru masuk' : 'Siap jual';

    await db.execute({
      sql: `UPDATE unit SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      args: [targetStatus, serv.unit_id],
    });
  }

  return { success: true };
}

// ----------------- OPERATIONAL EXPENSES -----------------
export async function getExpenses(month?: string): Promise<Expense[]> {
  const db = await ensureDb();
  let query = `
    SELECT e.*, u.nama as pencatat_nama 
    FROM pengeluaran e 
    LEFT JOIN pengguna u ON e.pencatat_id = u.id 
    ORDER BY e.tanggal DESC, e.id DESC
  `;
  const res = await db.execute(query);
  return res.rows.map((r) => ({
    id: Number(r.id),
    tanggal: String(r.tanggal),
    kategori: r.kategori as Expense['kategori'],
    jumlah: Number(r.jumlah),
    catatan: r.catatan ? String(r.catatan) : null,
    pencatat_id: Number(r.pencatat_id),
    pencatat_nama: String(r.pencatat_nama || ''),
  }));
}

export async function createExpense(data: {
  tanggal?: string;
  kategori: Expense['kategori'];
  jumlah: number;
  catatan?: string;
  pencatat_id: number;
}) {
  const db = await ensureDb();
  const tgl = data.tanggal || new Date().toISOString().split('T')[0];
  const res = await db.execute({
    sql: `INSERT INTO pengeluaran (tanggal, kategori, jumlah, catatan, pencatat_id)
          VALUES (?, ?, ?, ?, ?)`,
    args: [tgl, data.kategori, data.jumlah, data.catatan || null, data.pencatat_id],
  });
  return { id: Number(res.lastInsertRowid) };
}

// ----------------- FINANCIAL REPORTS -----------------
export async function getFinancialReport(range: 'hari_ini' | '7_hari' | '30_hari' | 'semua' = '30_hari') {
  const db = await ensureDb();

  let dateFilterSales = '';
  let dateFilterExp = '';

  if (range === 'hari_ini') {
    dateFilterSales = `WHERE DATE(tanggal) = DATE('now') AND status_transaksi = 'selesai'`;
    dateFilterExp = `WHERE DATE(tanggal) = DATE('now')`;
  } else if (range === '7_hari') {
    dateFilterSales = `WHERE tanggal >= date('now', '-7 days') AND status_transaksi = 'selesai'`;
    dateFilterExp = `WHERE tanggal >= date('now', '-7 days')`;
  } else if (range === '30_hari') {
    dateFilterSales = `WHERE tanggal >= date('now', '-30 days') AND status_transaksi = 'selesai'`;
    dateFilterExp = `WHERE tanggal >= date('now', '-30 days')`;
  } else {
    dateFilterSales = `WHERE status_transaksi = 'selesai'`;
    dateFilterExp = ``;
  }

  const salesTotals = await db.execute(`
    SELECT 
      COALESCE(SUM(harga_akhir), 0) as omzet,
      COALESCE(SUM(hpp_unit), 0) as total_hpp,
      COALESCE(SUM(laba_kotor), 0) as laba_kotor,
      COUNT(*) as total_unit
    FROM penjualan ${dateFilterSales}
  `);

  const expTotals = await db.execute(`
    SELECT COALESCE(SUM(jumlah), 0) as total_pengeluaran 
    FROM pengeluaran ${dateFilterExp}
  `);

  const expByCategory = await db.execute(`
    SELECT kategori, COALESCE(SUM(jumlah), 0) as total 
    FROM pengeluaran ${dateFilterExp}
    GROUP BY kategori
  `);

  const profitByType = await db.execute(`
    SELECT 
      u.tipe,
      COUNT(p.id) as unit_terjual,
      COALESCE(SUM(p.harga_akhir), 0) as omzet,
      COALESCE(SUM(p.laba_kotor), 0) as laba_kotor
    FROM penjualan p
    JOIN unit u ON p.unit_id = u.id
    ${dateFilterSales}
    GROUP BY u.tipe
    ORDER BY laba_kotor DESC
  `);

  const omzet = Number(salesTotals.rows[0]?.omzet || 0);
  const totalHpp = Number(salesTotals.rows[0]?.total_hpp || 0);
  const labaKotor = Number(salesTotals.rows[0]?.laba_kotor || 0);
  const totalUnit = Number(salesTotals.rows[0]?.total_unit || 0);
  const totalPengeluaran = Number(expTotals.rows[0]?.total_pengeluaran || 0);
  const labaBersih = labaKotor - totalPengeluaran;

  return {
    range,
    omzet,
    totalHpp,
    labaKotor,
    totalPengeluaran,
    labaBersih,
    totalUnit,
    pengeluaran_per_kategori: expByCategory.rows.map((r) => ({
      kategori: String(r.kategori),
      total: Number(r.total),
    })),
    laba_per_tipe: profitByType.rows.map((r) => ({
      tipe: String(r.tipe),
      unit_terjual: Number(r.unit_terjual),
      omzet: Number(r.omzet),
      laba_kotor: Number(r.laba_kotor),
    })),
  };
}
