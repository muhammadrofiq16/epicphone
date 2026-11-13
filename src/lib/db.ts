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

  // Check if initial users exist
  const usersCountRes = await db.execute('SELECT COUNT(*) as cnt FROM pengguna');
  const count = Number(usersCountRes.rows[0].cnt);

  if (count === 0) {
    await seedInitialData(db);
  }

  initialized = true;
}

async function seedInitialData(db: Client) {
  // 1. Insert Users
  await db.execute({
    sql: `INSERT INTO pengguna (id, nama, username, kata_sandi, peran, aktif) VALUES
      (1, 'Rofiq (Pemilik)', 'pemilik', 'admin123', 'pemilik', 1),
      (2, 'Siti (Karyawan)', 'karyawan', 'karyawan123', 'karyawan', 1);`,
    args: [],
  });

  // 2. Insert Settings
  await db.execute({
    sql: `INSERT INTO pengaturan (kunci, nilai) VALUES
      ('batas_stok_mengendap', '30'),
      ('batas_margin_min', '200000'),
      ('nama_toko', 'EpicPhone Store'),
      ('alamat_toko', 'Mall ITC Roxy Mas Lt. 2 Blok B No. 12, Jakarta'),
      ('telepon_toko', '081298765432'),
      ('pesan_nota_wa', 'Terima kasih telah berbelanja di EpicPhone! Simpan nota ini sebagai bukti garansi.'),
      ('tema_gelap', 'false'),
      ('sembunyikan_angka', 'false');`,
    args: [],
  });

  // 3. Insert Initial Contacts
  await db.execute({
    sql: `INSERT INTO kontak (id, nama, telepon, jenis, catatan) VALUES
      (1, 'Distributor IndoHP', '081122334455', 'supplier', 'Supplier langganan unit mulus ex-iBox'),
      (2, 'Andi Wijaya', '081299887766', 'penjual', 'Jual iPhone 13 pribadi ex-garansi resmi'),
      (3, 'Budi Santoso', '087711223344', 'pembeli', 'Customer setia langganan'),
      (4, 'Clara Melati', '085699881122', 'pembeli', 'Beli iPhone 14 Pro tunai');`,
    args: [],
  });

  // Current dates relative to today
  const today = new Date().toISOString().split('T')[0];
  const dMinus2 = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
  const dMinus5 = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];
  const dMinus12 = new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0];
  const dMinus20 = new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0];
  const dMinus35 = new Date(Date.now() - 35 * 86400000).toISOString().split('T')[0]; // Aging stock!

  // 4. Insert Units
  // Unit 1: iPhone 13 128GB Midnight - Siap jual
  // Unit 2: iPhone 14 Pro 256GB Deep Purple - Siap jual (Mengendap > 30 hari!)
  // Unit 3: iPhone 11 64GB White - Dicek/Servis (servis ganti baterai)
  // Unit 4: iPhone 12 128GB Blue - Baru masuk
  // Unit 5: iPhone 15 Pro Max 256GB Natural Titanium - Terjual
  // Unit 6: iPhone 13 Pro 128GB Sierra Blue - Terjual
  // Unit 7: iPhone XR 64GB Coral - Booking (ada DP)

  await db.execute({
    sql: `INSERT INTO unit (
      id, merk, tipe, storage, warna, imei, battery_health, kondisi, kelengkapan,
      status, status_imei, catatan_imei, harga_beli, total_biaya_servis, hpp,
      harga_jual_rekomendasi, tanggal_masuk, catatan
    ) VALUES
      (1, 'Apple', 'iPhone 13', '128 GB', 'Midnight', '356891102938475', 88, 'Mulus 97%, Face ID on, True Tone on', 'Fullset Dus OEM & Kabel', 'Siap jual', 'aman', 'IMEI Kemenperin Aktif', 7200000, 0, 7200000, 8250000, '${dMinus12}', 'Ex inter all operator'),
      (2, 'Apple', 'iPhone 14 Pro', '256 GB', 'Deep Purple', '357912345678901', 94, 'Like New 99%, No Dent, No Scratch', 'Fullset Original Box', 'Siap jual', 'aman', 'IMEI Bea Cukai Resmi', 12800000, 0, 12800000, 14200000, '${dMinus35}', 'Stok lebih dari 30 hari, pertimbangkan promo'),
      (3, 'Apple', 'iPhone 11', '64 GB', 'White', '354890123456789', 74, 'Fisik 92%, layar ori, baterai service', 'Batangan + Charger', 'Dicek/Servis', 'aman', 'IMEI Resmi iBox', 3800000, 350000, 4150000, 4850000, '${dMinus5}', 'Sedang ganti baterai premium'),
      (4, 'Apple', 'iPhone 12', '128 GB', 'Blue', '359012345678902', 86, 'Mulus 95%, bezel mulus', 'Fullset Dus', 'Baru masuk', 'aman', 'IMEI Terdaftar Kemenperin', 5600000, 0, 5600000, 6500000, '${today}', 'Unit baru masuk dari pelanggan tukar tambah'),
      (5, 'Apple', 'iPhone 15 Pro Max', '256 GB', 'Natural Titanium', '351234567890123', 98, 'Mulus 99% Battery Health 98%', 'Fullset Original iBox', 'Terjual', 'aman', 'IMEI Resmi iBox', 17500000, 0, 17500000, 19200000, '${dMinus20}', 'Sudah terjual ke Kak Clara'),
      (6, 'Apple', 'iPhone 13 Pro', '128 GB', 'Sierra Blue', '352345678901234', 89, 'Fisik 96%, Kamera & Speaker jernih', 'Unit + Box', 'Terjual', 'aman', 'IMEI Bea Cukai', 9500000, 200000, 9700000, 10800000, '${dMinus5}', 'Terjual hari ini, servis ganti casing tombol'),
      (7, 'Apple', 'iPhone XR', '64 GB', 'Coral', '353456789012345', 85, 'Mulus 93%, layar LCD ori', 'Batangan', 'Booking', 'aman', 'IMEI Kemenperin', 3100000, 0, 3100000, 3750000, '${dMinus2}', 'Booking pelanggan DP Rp 500rb');`,
    args: [],
  });

  // 5. Insert Purchases
  await db.execute({
    sql: `INSERT INTO pembelian (
      id, nomor, tanggal, kontak_id, unit_id, harga_beli, metode_bayar, status_bayar, catatan, pencatat_id
    ) VALUES
      (1, 'BM-202611-001', '${dMinus35}', 1, 2, 12800000, 'transfer', 'lunas', 'Beli dari Distributor IndoHP', 1),
      (2, 'BM-202611-002', '${dMinus20}', 2, 5, 17500000, 'transfer', 'lunas', 'Beli dari Andi Wijaya', 1),
      (3, 'BM-202611-003', '${dMinus12}', 1, 1, 7200000, 'transfer', 'lunas', 'Beli dari Distributor IndoHP', 1),
      (4, 'BM-202611-004', '${dMinus5}', 2, 3, 3800000, 'tunai', 'lunas', 'Unit masuk butuh ganti baterai', 1),
      (5, 'BM-202611-005', '${dMinus5}', 1, 6, 9500000, 'transfer', 'lunas', 'Beli unit 13 Pro', 1),
      (6, 'BM-202611-006', '${dMinus2}', 2, 7, 3100000, 'tunai', 'lunas', 'Beli unit XR', 1),
      (7, 'BM-202611-007', '${today}', 2, 4, 5600000, 'transfer', 'lunas', 'Beli unit iPhone 12', 1);`,
    args: [],
  });

  // 6. Insert Servis
  await db.execute({
    sql: `INSERT INTO servis (
      id, unit_id, tanggal, kerusakan, sparepart, biaya, teknisi_id, status, catatan
    ) VALUES
      (1, 3, '${dMinus5}', 'Battery Health 74% perlu pergantian', 'Baterai Deji Apple 11 Original', 350000, 2, 'proses', 'Sparepart sudah dipesan dan dipasang teknisi toko'),
      (2, 6, '${dMinus5}', 'Tombol volume sedikit macet', 'Fleksibel volume original', 200000, 2, 'selesai', 'Selesai dan langsung siap jual');`,
    args: [],
  });

  // 7. Insert Sales
  // Unit 5: iPhone 15 Pro Max: Jual 19.000.000, diskon 200.000 => Akhir 18.800.000. HPP 17.500.000 => Laba 1.300.000
  // Unit 6: iPhone 13 Pro: Jual 10.700.000, diskon 0 => Akhir 10.700.000. HPP 9.700.000 => Laba 1.000.000
  await db.execute({
    sql: `INSERT INTO penjualan (
      id, nomor_nota, tanggal, unit_id, kontak_id, pembeli_nama, pembeli_telepon,
      harga_jual, diskon, harga_akhir, hpp_unit, laba_kotor, garansi_hari,
      status_bayar, metode_bayar, catatan, pencatat_id, status_transaksi, tipe_transaksi
    ) VALUES
      (1, 'NOT-202611-001', '${dMinus12}', 5, 4, 'Clara Melati', '085699881122', 19000000, 200000, 18800000, 17500000, 1300000, 30, 'lunas', 'transfer', 'Pembayaran via BCA transfer', 2, 'selesai', 'reguler'),
      (2, 'NOT-202611-002', '${today}', 6, 3, 'Budi Santoso', '087711223344', 10700000, 0, 10700000, 9700000, 1000000, 30, 'lunas', 'qris', 'Pembeli langsung scan QRIS di toko', 2, 'selesai', 'reguler');`,
    args: [],
  });

  // 8. Insert Payments
  await db.execute({
    sql: `INSERT INTO pembayaran (
      id, tanggal, jenis, referensi_id, jumlah, metode, catatan, pencatat_id
    ) VALUES
      (1, '${dMinus12}', 'penjualan', 1, 18800000, 'transfer', 'Pelunasan penjualan NOT-202611-001', 2),
      (2, '${today}', 'penjualan', 2, 10700000, 'qris', 'Pelunasan penjualan NOT-202611-002', 2),
      (3, '${dMinus2}', 'penjualan', 7, 500000, 'tunai', 'DP Booking Unit XR #7', 2);`,
    args: [],
  });

  // 9. Insert Expenses
  await db.execute({
    sql: `INSERT INTO pengeluaran (
      id, tanggal, kategori, jumlah, catatan, pencatat_id
    ) VALUES
      (1, '${dMinus12}', 'listrik', 250000, 'Token listrik counter bulan November', 1),
      (2, '${dMinus5}', 'iklan', 300000, 'Iklan Instagram Story & Feed promo HP second', 1),
      (3, '${today}', 'operasional', 75000, 'Beli plastik packing & bubble wrap', 2);`,
    args: [],
  });
}
