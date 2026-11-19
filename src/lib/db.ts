import { createClient, Client } from '@libsql/client';
import path from 'path';

let dbClient: Client | null = null;

export function getDb(): Client {
  if (!dbClient) {
    const tursoUrl =
      process.env.STORAGE_TURSO_DATABASE_URL ||
      process.env.TURSO_DATABASE_URL ||
      process.env.TURSO_DB_URL ||
      process.env.TURSO_URL ||
      process.env.STORAGE_URL ||
      process.env.LIBSQL_URL;
    const tursoAuthToken =
      process.env.STORAGE_TURSO_AUTH_TOKEN ||
      process.env.TURSO_AUTH_TOKEN ||
      process.env.TURSO_TOKEN ||
      process.env.STORAGE_AUTH_TOKEN ||
      process.env.STORAGE_TOKEN ||
      process.env.LIBSQL_AUTH_TOKEN;

    if (tursoUrl) {
      dbClient = createClient({
        url: tursoUrl,
        authToken: tursoAuthToken,
      });
    } else {
      const dbPath = path.resolve(process.cwd(), 'data/epicphone.db').replace(/\\/g, '/');
      dbClient = createClient({
        url: `file:${dbPath}`,
      });
    }
  }
  return dbClient;
}

let initialized = false;

export async function initDb() {
  if (initialized) return;
  const db = getDb();

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS pengguna (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      kata_sandi TEXT NOT NULL,
      peran TEXT NOT NULL CHECK(peran IN ('pemilik', 'karyawan')),
      aktif INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS kontak (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nama TEXT NOT NULL,
      telepon TEXT,
      jenis TEXT NOT NULL CHECK(jenis IN ('supplier', 'penjual', 'pembeli')),
      catatan TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS unit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merk TEXT NOT NULL DEFAULT 'Apple',
      tipe TEXT NOT NULL,
      storage TEXT NOT NULL,
      warna TEXT NOT NULL,
      imei TEXT UNIQUE NOT NULL,
      imei2 TEXT,
      battery_health INTEGER,
      kondisi TEXT,
      kelengkapan TEXT,
      status TEXT NOT NULL CHECK(status IN ('Baru masuk', 'Dicek/Servis', 'Siap jual', 'Booking', 'Terjual', 'Retur')),
      status_imei TEXT NOT NULL DEFAULT 'aman' CHECK(status_imei IN ('aman', 'bermasalah')),
      catatan_imei TEXT,
      harga_beli REAL NOT NULL DEFAULT 0,
      total_biaya_servis REAL NOT NULL DEFAULT 0,
      hpp REAL NOT NULL DEFAULT 0,
      harga_jual_rekomendasi REAL,
      harga_jual_aktual REAL,
      tanggal_masuk TEXT NOT NULL,
      foto TEXT,
      catatan TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pembelian (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nomor TEXT UNIQUE NOT NULL,
      tanggal TEXT NOT NULL,
      kontak_id INTEGER,
      unit_id INTEGER NOT NULL,
      harga_beli REAL NOT NULL,
      metode_bayar TEXT NOT NULL,
      status_bayar TEXT NOT NULL DEFAULT 'lunas',
      foto_ktp_nota TEXT,
      catatan TEXT,
      pencatat_id INTEGER NOT NULL,
      is_trade_in INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (unit_id) REFERENCES unit(id),
      FOREIGN KEY (kontak_id) REFERENCES kontak(id),
      FOREIGN KEY (pencatat_id) REFERENCES pengguna(id)
    );

    CREATE TABLE IF NOT EXISTS servis (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id INTEGER NOT NULL,
      tanggal TEXT NOT NULL,
      kerusakan TEXT NOT NULL,
      sparepart TEXT,
      biaya REAL NOT NULL DEFAULT 0,
      teknisi_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'selesai' CHECK(status IN ('menunggu', 'proses', 'selesai')),
      catatan TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (unit_id) REFERENCES unit(id),
      FOREIGN KEY (teknisi_id) REFERENCES pengguna(id)
    );

    CREATE TABLE IF NOT EXISTS penjualan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nomor_nota TEXT UNIQUE NOT NULL,
      tanggal TEXT NOT NULL,
      unit_id INTEGER NOT NULL,
      kontak_id INTEGER,
      pembeli_nama TEXT,
      pembeli_telepon TEXT,
      harga_jual REAL NOT NULL,
      diskon REAL NOT NULL DEFAULT 0,
      harga_akhir REAL NOT NULL,
      hpp_unit REAL NOT NULL,
      laba_kotor REAL NOT NULL,
      garansi_hari INTEGER DEFAULT 30,
      status_bayar TEXT NOT NULL DEFAULT 'lunas',
      metode_bayar TEXT NOT NULL,
      catatan TEXT,
      pencatat_id INTEGER NOT NULL,
      status_transaksi TEXT NOT NULL DEFAULT 'selesai' CHECK(status_transaksi IN ('selesai', 'dibatalkan')),
      alasan_batal TEXT,
      tipe_transaksi TEXT NOT NULL DEFAULT 'reguler' CHECK(tipe_transaksi IN ('reguler', 'tukar_tambah')),
      trade_in_unit_id INTEGER,
      trade_in_potongan REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (unit_id) REFERENCES unit(id),
      FOREIGN KEY (pencatat_id) REFERENCES pengguna(id)
    );

    CREATE TABLE IF NOT EXISTS pembayaran (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tanggal TEXT NOT NULL,
      jenis TEXT NOT NULL CHECK(jenis IN ('penjualan', 'pembelian')),
      referensi_id INTEGER NOT NULL,
      jumlah REAL NOT NULL,
      metode TEXT NOT NULL,
      catatan TEXT,
      pencatat_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pencatat_id) REFERENCES pengguna(id)
    );

    CREATE TABLE IF NOT EXISTS pengeluaran (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tanggal TEXT NOT NULL,
      kategori TEXT NOT NULL CHECK(kategori IN ('sewa', 'listrik', 'iklan', 'gaji', 'operasional', 'lain-lain')),
      jumlah REAL NOT NULL,
      catatan TEXT,
      pencatat_id INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pencatat_id) REFERENCES pengguna(id)
    );

    CREATE TABLE IF NOT EXISTS pengaturan (
      kunci TEXT PRIMARY KEY,
      nilai TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS log_perubahan (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      waktu TEXT DEFAULT CURRENT_TIMESTAMP,
      pengguna_id INTEGER,
      tabel TEXT NOT NULL,
      record_id INTEGER,
      aksi TEXT NOT NULL,
      nilai_lama TEXT,
      nilai_baru TEXT,
      keterangan TEXT
    );
  `);

  // Migration: Ensure imei2 column exists in unit table
  try {
    const unitCols = await db.execute("PRAGMA table_info(unit)");
    const hasImei2 = unitCols.rows.some((r: any) => r.name === 'imei2');
    if (!hasImei2) {
      await db.execute("ALTER TABLE unit ADD COLUMN imei2 TEXT");
    }
  } catch (migErr) {
    console.error("Migration error (unit.imei2):", migErr);
  }

  // Check if initial users exist
  const usersCountRes = await db.execute('SELECT COUNT(*) as cnt FROM pengguna');
  const count = Number(usersCountRes.rows[0].cnt);

  if (count === 0) {
    await seedInitialData(db);
  }

  initialized = true;
}

async function seedInitialData(db: Client) {
  // 1. Insert Users (Akun Pemilik & Karyawan)
  await db.execute({
    sql: `INSERT INTO pengguna (id, nama, username, kata_sandi, peran, aktif) VALUES
      (1, 'Rofiq (Pemilik)', 'pemilik', 'admin123', 'pemilik', 1),
      (2, 'Siti (Karyawan)', 'karyawan', 'karyawan123', 'karyawan', 1);`,
    args: [],
  });

  // 2. Insert Settings (Pengaturan Default Toko)
  await db.execute({
    sql: `INSERT INTO pengaturan (kunci, nilai) VALUES
      ('batas_stok_mengendap', '30'),
      ('batas_margin_min', '200000'),
      ('nama_toko', 'EpicPhone Store'),
      ('alamat_toko', ''),
      ('telepon_toko', ''),
      ('pesan_nota_wa', 'Terima kasih telah berbelanja di EpicPhone! Simpan nota ini sebagai bukti garansi.'),
      ('tema_gelap', 'false'),
      ('sembunyikan_angka', 'false');`,
    args: [],
  });
}
