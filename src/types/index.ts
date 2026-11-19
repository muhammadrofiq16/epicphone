export type UserRole = 'pemilik' | 'karyawan';

export interface User {
  id: number;
  nama: string;
  username: string;
  peran: UserRole;
  aktif: boolean;
}

export type UnitStatus =
  | 'Baru masuk'
  | 'Dicek/Servis'
  | 'Siap jual'
  | 'Booking'
  | 'Terjual'
  | 'Retur';

export type ImeiStatus = 'aman' | 'bermasalah';
export type GaransiType = 'resmi' | 'inter';
export type SinyalStatus = 'all_operator' | 'smartfren_only' | 'wifi_only';
export type SimLockStatus = 'fu' | 'su';

export interface Unit {
  id: number;
  merk: string;
  tipe: string;
  storage: string;
  warna: string;
  imei: string;
  imei2?: string | null;
  battery_health?: number | null;
  kondisi?: string | null;
  kelengkapan?: string | null;
  status: UnitStatus;
  status_imei: ImeiStatus;
  catatan_imei?: string | null;
  jenis_garansi?: GaransiType;
  status_sinyal?: SinyalStatus;
  status_sim_lock?: SimLockStatus;
  garansi_sinyal?: string | null;
  harga_beli: number;
  total_biaya_servis: number;
  hpp: number; // harga_beli + total_biaya_servis
  harga_jual_rekomendasi?: number | null;
  harga_jual_aktual?: number | null;
  tanggal_masuk: string;
  foto?: string[] | null;
  catatan?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type PaymentMethod = 'tunai' | 'transfer' | 'qris';
export type PaymentStatus = 'lunas' | 'sebagian' | 'belum bayar';

export interface Contact {
  id: number;
  nama: string;
  telepon?: string | null;
  jenis: 'supplier' | 'penjual' | 'pembeli';
  catatan?: string | null;
}

export interface Purchase {
  id: number;
  nomor: string;
  tanggal: string;
  kontak_id?: number | null;
  kontak_nama?: string | null;
  kontak_telepon?: string | null;
  unit_id: number;
  unit_tipe?: string;
  unit_imei?: string;
  unit_imei2?: string;
  unit_jenis_garansi?: GaransiType;
  unit_status_sinyal?: SinyalStatus;
  unit_status_sim_lock?: SimLockStatus;
  unit_garansi_sinyal?: string | null;
  harga_beli: number;
  metode_bayar: PaymentMethod;
  status_bayar: PaymentStatus;
  foto_ktp_nota?: string | null;
  catatan?: string | null;
  pencatat_id: number;
  pencatat_nama?: string;
  is_trade_in?: boolean;
}

export interface ServiceLog {
  id: number;
  unit_id: number;
  tanggal: string;
  kerusakan: string;
  sparepart?: string | null;
  biaya: number;
  teknisi_id: number;
  teknisi_nama?: string;
  status: 'menunggu' | 'proses' | 'selesai';
  catatan?: string | null;
}

export interface Sale {
  id: number;
  nomor_nota: string;
  tanggal: string;
  unit_id: number;
  unit_info?: string;
  unit_imei?: string;
  unit_imei2?: string;
  unit_jenis_garansi?: GaransiType;
  unit_status_sinyal?: SinyalStatus;
  unit_status_sim_lock?: SimLockStatus;
  unit_garansi_sinyal?: string | null;
  kontak_id?: number | null;
  pembeli_nama?: string | null;
  pembeli_telepon?: string | null;
  harga_jual: number;
  diskon: number;
  harga_akhir: number; // harga_jual - diskon
  hpp_unit: number;
  laba_kotor: number; // harga_akhir - hpp_unit
  garansi_hari: number;
  status_bayar: PaymentStatus;
  metode_bayar: PaymentMethod;
  catatan?: string | null;
  pencatat_id: number;
  pencatat_nama?: string;
  status_transaksi: 'selesai' | 'dibatalkan';
  alasan_batal?: string | null;
  tipe_transaksi: 'reguler' | 'tukar_tambah';
  trade_in_unit_id?: number | null;
  trade_in_potongan?: number;
}

export interface PaymentRecord {
  id: number;
  tanggal: string;
  jenis: 'penjualan' | 'pembelian';
  referensi_id: number;
  jumlah: number;
  metode: PaymentMethod;
  catatan?: string | null;
  pencatat_id: number;
}

export interface Expense {
  id: number;
  tanggal: string;
  kategori: 'sewa' | 'listrik' | 'iklan' | 'gaji' | 'operasional' | 'lain-lain';
  jumlah: number;
  catatan?: string | null;
  pencatat_id: number;
  pencatat_nama?: string;
}

export interface StoreSettings {
  batas_stok_mengendap: number; // in days, default 30
  batas_margin_min: number; // in rupiah, default 200000
  nama_toko: string;
  alamat_toko?: string;
  telepon_toko?: string;
  pesan_nota_wa?: string;
  tema_gelap?: boolean;
  sembunyikan_angka?: boolean;
  logo_url?: string | null;
}

export interface DashboardSummary {
  omzet_hari_ini: number;
  laba_kotor_hari_ini: number; // only visible to pemilik
  kas_masuk_hari_ini: number;
  unit_terjual_hari_ini: number;
  stok_siap_jual: number;
  stok_mengendap_count: number;
  servis_menunggu_count: number;
  piutang_count: number;
  piutang_total: number;
  omzet_chart_7d: { tanggal: string; label: string; total: number }[];
  omzet_chart_30d: { tanggal: string; label: string; total: number }[];
  rata_rata_omzet: number;
  transaksi_terakhir: Sale[];
  unit_perlu_perhatian: {
    stok_mengendap: Unit[];
    servis_menunggu: (Unit & { kerusakan?: string; biaya?: number })[];
  };
}
