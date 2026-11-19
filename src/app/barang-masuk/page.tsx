'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  X,
  Plus,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Camera,
  Image as ImageIcon,
  Loader2,
  Cloud,
  HardDrive,
  Sparkles,
  ScanBarcode,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PaymentMethod } from '@/types';

const BarcodeScannerModal = dynamic(
  () => import('@/components/common/BarcodeScannerModal').then((mod) => mod.BarcodeScannerModal),
  { ssr: false }
);

const PRODUCT_CATALOG = [
  {
    label: 'Apple iPhone 13 128 GB',
    merk: 'Apple',
    model: 'iPhone 13',
    varian: '128 GB',
    warna: 'Midnight',
    harga_jual: 8250000,
  },
  {
    label: 'Apple iPhone 13 Pro 128 GB',
    merk: 'Apple',
    model: 'iPhone 13 Pro',
    varian: '128 GB',
    warna: 'Sierra Blue',
    harga_jual: 10800000,
  },
  {
    label: 'Apple iPhone 14 128 GB',
    merk: 'Apple',
    model: 'iPhone 14',
    varian: '128 GB',
    warna: 'Blue',
    harga_jual: 9500000,
  },
  {
    label: 'Apple iPhone 14 Pro 256 GB',
    merk: 'Apple',
    model: 'iPhone 14 Pro',
    varian: '256 GB',
    warna: 'Deep Purple',
    harga_jual: 14200000,
  },
  {
    label: 'Apple iPhone 15 128 GB',
    merk: 'Apple',
    model: 'iPhone 15',
    varian: '128 GB',
    warna: 'Black',
    harga_jual: 11800000,
  },
  {
    label: 'Apple iPhone 15 Pro Max 256 GB',
    merk: 'Apple',
    model: 'iPhone 15 Pro Max',
    varian: '256 GB',
    warna: 'Natural Titanium',
    harga_jual: 19500000,
  },
  {
    label: 'Apple iPhone 11 64 GB',
    merk: 'Apple',
    model: 'iPhone 11',
    varian: '64 GB',
    warna: 'White',
    harga_jual: 4850000,
  },
  {
    label: 'Apple iPhone 12 128 GB',
    merk: 'Apple',
    model: 'iPhone 12',
    varian: '128 GB',
    warna: 'Blue',
    harga_jual: 6500000,
  },
  {
    label: 'Apple iPhone XR 64 GB',
    merk: 'Apple',
    model: 'iPhone XR',
    varian: '64 GB',
    warna: 'Coral',
    harga_jual: 3750000,
  },
  {
    label: 'Samsung Galaxy A54 5G 8/256 GB',
    merk: 'Samsung',
    model: 'Galaxy A54 5G',
    varian: '8/256 GB',
    warna: 'Awesome Lime',
    harga_jual: 3850000,
  },
];

function BarangMasukContent() {
  const router = useRouter();
  const { currentUser } = useAuth();

  // Mode: HP vs Aksesoris
  const [itemType, setItemType] = useState<'hp' | 'aksesoris'>('hp');

  // Identitas
  const [selectedCatalog, setSelectedCatalog] = useState('');
  const [merek, setMerek] = useState('Apple');
  const [modelSeri, setModelSeri] = useState('iPhone 13');
  const [varian, setVarian] = useState('128 GB');
  const [warna, setWarna] = useState('Midnight');
  const [imei, setImei] = useState('');
  const [imei2, setImei2] = useState('');
  const [scannerModal, setScannerModal] = useState<{ open: boolean; target: 'imei' | 'imei2' }>({
    open: false,
    target: 'imei',
  });

  // Kondisi & Grade
  const [kondisiTipe, setKondisiTipe] = useState<'Bekas' | 'Baru'>('Bekas');
  const [grade, setGrade] = useState<'Grade A' | 'Grade B' | 'Grade C'>('Grade B');
  const [batteryHealth, setBatteryHealth] = useState<string>('88');
  const [bebasKunciAkun, setBebasKunciAkun] = useState('Ya, bebas');
  const [statusImei, setStatusImei] = useState<'aman' | 'bermasalah'>('aman');
  const [kelengkapan, setKelengkapan] = useState('Fullset');

  // Harga & Transaksi
  const [hargaBeli, setHargaBeli] = useState<string>('');
  const [hargaTarget, setHargaTarget] = useState<string>('');
  const [tanggalMasuk, setTanggalMasuk] = useState('');
  const [asalBarang, setAsalBarang] = useState('');
  const [kontakTelepon, setKontakTelepon] = useState('');
  const [metodeBayar, setMetodeBayar] = useState<PaymentMethod>('transfer');

  useEffect(() => {
    setTanggalMasuk(new Date().toISOString().split('T')[0]);
  }, []);

  // Foto Produk (Batch Multiple Upload, Max 10 Foto)
  interface UploadedPhoto {
    id: string;
    url: string;
    isUploading?: boolean;
    provider?: string;
    name?: string;
  }

  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isUploadingMultiple, setIsUploadingMultiple] = useState(false);
  const multipleFileInputRef = React.useRef<HTMLInputElement>(null);

  // Catatan & Servis
  const [catatanUnit, setCatatanUnit] = useState('');
  const [perluServis, setPerluServis] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Catalog Selection
  const handleCatalogSelect = (label: string) => {
    setSelectedCatalog(label);
    const item = PRODUCT_CATALOG.find((p) => p.label === label);
    if (item) {
      setMerek(item.merk);
      setModelSeri(item.model);
      setVarian(item.varian);
      setWarna(item.warna);
      if (item.harga_jual) {
        setHargaTarget(item.harga_jual.toLocaleString('id-ID'));
      }
    }
  };

  // Handle Multiple Image Upload (Bisa banyak sekaligus, maks 10)
  const handleBatchImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remainingSlots = 10 - photos.length;
    if (remainingSlots <= 0) {
      setErrorMsg('Maksimal 10 foto sudah tercapai.');
      return;
    }

    const filesToUpload = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setErrorMsg(`Hanya ${remainingSlots} foto yang dapat ditambahkan (maksimal 10 foto).`);
    }

    // Buat item preview lokal instan agar UI langsung responsif
    const newItems: UploadedPhoto[] = filesToUpload.map((f, idx) => ({
      id: `photo-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
      url: URL.createObjectURL(f),
      isUploading: true,
      name: f.name,
    }));

    setPhotos((prev) => [...prev, ...newItems]);
    setIsUploadingMultiple(true);

    // Upload semua foto secara paralel agar proses sangat cepat
    await Promise.all(
      filesToUpload.map(async (file, i) => {
        const targetId = newItems[i].id;
        try {
          const fd = new FormData();
          fd.append('file', file);
          fd.append('slot', `unit-${i + 1}`);
          fd.append('unitTipe', `${merek || 'Unit'} ${modelSeri || 'HP'}`);

          const res = await fetch('/api/upload', {
            method: 'POST',
            body: fd,
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Gagal mengupload');
          }

          const finalUrl = data.url || data.localUrl;
          setPhotos((prev) =>
            prev.map((item) =>
              item.id === targetId
                ? { ...item, url: finalUrl, isUploading: false, provider: data.provider }
                : item
            )
          );
        } catch (err: any) {
          console.error('Batch upload error:', file.name, err);
          setPhotos((prev) => prev.filter((item) => item.id !== targetId));
          setErrorMsg(`Gagal upload foto "${file.name}": ${err.message}`);
        }
      })
    );

    setIsUploadingMultiple(false);
    if (e.target) {
      e.target.value = '';
    }
  };

  const removePhoto = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSave = async (stayOnPage = false) => {
    setErrorMsg('');
    setSuccessMsg('');

    const numHargaBeli = Number(hargaBeli.replace(/\D/g, '')) || 0;
    if (numHargaBeli <= 0) {
      setErrorMsg('Harga beli unit wajib diisi!');
      return;
    }

    if (itemType === 'hp') {
      const cleanImei = imei.replace(/\D/g, '');
      if (!cleanImei) {
        setErrorMsg('Nomor IMEI 1 wajib diisi untuk HP!');
        return;
      }
      if (cleanImei.length !== 15) {
        setErrorMsg(`Nomor IMEI 1 harus tepat 15 digit angka! (Saat ini: ${cleanImei.length} digit)`);
        return;
      }

      const cleanImei2 = imei2.replace(/\D/g, '');
      if (cleanImei2 && cleanImei2.length !== 15) {
        setErrorMsg(`Nomor IMEI 2 harus tepat 15 digit angka atau dikosongkan! (Saat ini: ${cleanImei2.length} digit)`);
        return;
      }

      if (cleanImei2 && cleanImei === cleanImei2) {
        setErrorMsg('Nomor IMEI 1 dan IMEI 2 tidak boleh sama!');
        return;
      }
    }

    try {
      setSubmitting(true);

      const fotos = photos.filter((p) => !p.isUploading && p.url).map((p) => p.url);

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merk: merek,
          tipe: modelSeri,
          storage: varian,
          warna,
          imei: imei.trim() || `ACC-${Date.now()}`,
          imei2: imei2.trim() || undefined,
          battery_health: batteryHealth ? Number(batteryHealth) : null,
          kondisi: `${kondisiTipe} · ${grade} (${catatanUnit || 'Standar'})`,
          kelengkapan,
          harga_beli: numHargaBeli,
          harga_jual_rekomendasi: hargaTarget ? Number(hargaTarget.replace(/\D/g, '')) : null,
          status_imei: statusImei,
          catatan_imei: bebasKunciAkun === 'Ya, bebas' ? 'iCloud/Akun Aman Bebas Reset' : 'Akun Terkunci',
          sumber_jenis: asalBarang ? 'supplier' : 'penjual',
          kontak_nama: asalBarang || 'Supplier Toko',
          kontak_telepon: kontakTelepon || null,
          metode_bayar: metodeBayar,
          tanggal_masuk: tanggalMasuk,
          perlu_servis: perluServis,
          fotos,
          catatan: catatanUnit || null,
          pencatat_id: currentUser?.id || 1,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan barang masuk');
      }

      setSuccessMsg(`Barang masuk berhasil dicatat! (${json.nomorNota})`);

      if (stayOnPage) {
        setImei('');
        setImei2('');
        setHargaBeli('');
        setCatatanUnit('');
        setPhotos([]);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setTimeout(() => router.push('/stok'), 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-14 text-xs">
      {/* Top Sheet Header (matching screenshot) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
        {/* Handle Bar */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-3" />

        <div className="flex items-start justify-between mb-3">
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Barang masuk</h1>
            <p className="text-[11px] text-slate-400">Catat HP baru atau bekas ke stok</p>
          </div>
          <button
            onClick={() => router.back()}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Top Segmented Control: HP vs Aksesoris */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setItemType('hp')}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              itemType === 'hp'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            HP
          </button>
          <button
            type="button"
            onClick={() => setItemType('aksesoris')}
            className={`py-1.5 rounded-xl text-center transition-all ${
              itemType === 'aksesoris'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="font-bold text-xs leading-none">Aksesoris</div>
            <span className="text-[9px] text-slate-400 block mt-0.5">Casing, kabel, dll</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-slate-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* FORM SECTIONS (Responsive: 1 col on mobile, 2 cols on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Data HP & Transaksi */}
        <div className="lg:col-span-7 space-y-4">
          {/* SECTION: IDENTITAS */}
          <div className="bg-white dark:bg-[#142036] rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <h2 className="font-bold text-xs text-slate-900 dark:text-white">Identitas</h2>

          {/* Pilih dari Katalog Produk */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Pilih dari Katalog Produk
            </label>
            <select
              value={selectedCatalog}
              onChange={(e) => handleCatalogSelect(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-medium"
            >
              <option value="">Pilih model dari katalog..</option>
              {PRODUCT_CATALOG.map((c) => (
                <option key={c.label} value={c.label}>
                  {c.label}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">
              Opsional. Mengisi merek, model, varian, dan warna sekaligus.
            </p>
          </div>

          {/* Merek */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Merek <span className="text-rose-500">*</span>
            </label>
            <select
              value={merek}
              onChange={(e) => setMerek(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs"
            >
              <option value="Apple">Apple</option>
              <option value="Samsung">Samsung</option>
              <option value="Xiaomi">Xiaomi</option>
              <option value="Oppo">Oppo</option>
              <option value="Vivo">Vivo</option>
              <option value="Infinix">Infinix</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          {/* Model Seri */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Model seri <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={modelSeri}
              onChange={(e) => setModelSeri(e.target.value)}
              placeholder="Contoh: Galaxy A54 5G"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs"
            />
          </div>

          {/* Varian RAM/ROM */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Varian (RAM/ROM) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={varian}
              onChange={(e) => setVarian(e.target.value)}
              placeholder="Contoh: 8/256 GB"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs"
            />
          </div>

          {/* Warna */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Warna <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={warna}
              onChange={(e) => setWarna(e.target.value)}
              placeholder="Contoh: Midnight"
              required
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs"
            />
          </div>

          {/* Section: Nomor IMEI (Dual SIM / eSIM) */}
          {itemType === 'hp' ? (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  <ScanBarcode size={15} className="text-blue-600" />
                  Nomor IMEI (Dual SIM / eSIM)
                </span>
                <span className="text-[10px] text-slate-400">
                  Scan kamera atau input manual
                </span>
              </div>

              {/* IMEI 1 (Wajib) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                    IMEI 1 (SIM Utama) <span className="text-rose-500">*</span>
                  </label>
                  <span
                    className={`text-[10px] font-mono font-medium ${
                      imei.length === 15
                        ? 'text-emerald-600 font-bold'
                        : imei.length > 0
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {imei.length}/15 digit
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={15}
                      value={imei}
                      onChange={(e) => {
                        const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 15);
                        setImei(numericOnly);
                      }}
                      placeholder="Contoh: 356891102938475"
                      required
                      className={`w-full font-mono font-semibold px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs transition-colors ${
                        imei.length === 15
                          ? 'border-emerald-500/80 ring-1 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-700 focus:border-slate-400'
                      }`}
                    />
                    {imei.length === 15 && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600">
                        <CheckCircle2 size={14} />
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setScannerModal({ open: true, target: 'imei' })}
                    className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 active:bg-blue-200 border border-blue-200 dark:border-blue-800 rounded-xl font-medium text-xs flex items-center gap-1.5 transition shrink-0 shadow-2xs"
                    title="Scan barcode IMEI 1 dari dus atau layar *#06#"
                  >
                    <ScanBarcode size={15} />
                    <span className="hidden sm:inline">Scan IMEI 1</span>
                  </button>
                </div>
              </div>

              {/* IMEI 2 (Opsional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                    IMEI 2 (SIM 2 / eSIM) <span className="text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <span
                    className={`text-[10px] font-mono font-medium ${
                      imei2.length === 15
                        ? 'text-emerald-600 font-bold'
                        : imei2.length > 0
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {imei2.length > 0 ? `${imei2.length}/15 digit` : 'Kosongkan jika Single SIM'}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={15}
                      value={imei2}
                      onChange={(e) => {
                        const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 15);
                        setImei2(numericOnly);
                      }}
                      placeholder="Kosongkan jika HP Single SIM"
                      className={`w-full font-mono font-semibold px-3 py-2 rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs transition-colors ${
                        imei2.length === 15
                          ? 'border-emerald-500/80 ring-1 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-slate-700 focus:border-slate-400'
                      }`}
                    />
                    {imei2.length === 15 && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600">
                        <CheckCircle2 size={14} />
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setScannerModal({ open: true, target: 'imei2' })}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 active:bg-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-xs flex items-center gap-1.5 transition shrink-0 shadow-2xs"
                    title="Scan barcode IMEI 2 dari dus atau layar *#06#"
                  >
                    <ScanBarcode size={15} />
                    <span className="hidden sm:inline">Scan IMEI 2</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Diisi jika unit mendukung Dual SIM fisik atau nano-SIM + eSIM (iPhone/Android Dual SIM).
                </p>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Kode / Seri Aksesoris (Opsional)
              </label>
              <input
                type="text"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                placeholder="Contoh: ACC-001 atau barcode aksesoris"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs"
              />
            </div>
          )}
        </div>

        {/* SECTION: KONDISI & GRADE */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
          <h2 className="font-bold text-xs text-slate-900">Kondisi & Status</h2>

          {/* Kondisi: Bekas vs Baru */}
          <div>
            <label className="block text-slate-700 font-medium mb-1.5">Kondisi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setKondisiTipe('Bekas')}
                className={`py-2 rounded-xl font-bold text-xs border transition-all ${
                  kondisiTipe === 'Bekas'
                    ? 'bg-slate-100 border-slate-400 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                Bekas
              </button>
              <button
                type="button"
                onClick={() => setKondisiTipe('Baru')}
                className={`py-2 rounded-xl font-bold text-xs border transition-all ${
                  kondisiTipe === 'Baru'
                    ? 'bg-slate-100 border-slate-400 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-500'
                }`}
              >
                Baru
              </button>
            </div>
          </div>

          {/* Grade: Grade A, B, C */}
          {kondisiTipe === 'Bekas' && (
            <div>
              <label className="block text-slate-700 font-medium mb-1.5">Grade</label>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <button
                  type="button"
                  onClick={() => setGrade('Grade A')}
                  className={`p-2 rounded-xl border transition-all ${
                    grade === 'Grade A'
                      ? 'bg-slate-100 border-slate-400 text-slate-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="text-xs">Grade A</div>
                  <span className="text-[10px] text-slate-400">Mulus</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGrade('Grade B')}
                  className={`p-2 rounded-xl border transition-all ${
                    grade === 'Grade B'
                      ? 'bg-slate-100 border-slate-400 text-slate-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="text-xs">Grade B</div>
                  <span className="text-[10px] text-slate-400">Normal</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGrade('Grade C')}
                  className={`p-2 rounded-xl border transition-all ${
                    grade === 'Grade C'
                      ? 'bg-slate-100 border-slate-400 text-slate-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="text-xs">Grade C</div>
                  <span className="text-[10px] text-slate-400">Banyak lecet</span>
                </button>
              </div>
            </div>
          )}

          {/* Battery Health */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">Battery Health (%)</label>
            <input
              type="number"
              value={batteryHealth}
              onChange={(e) => setBatteryHealth(e.target.value)}
              placeholder="Contoh: 88"
              min={50}
              max={100}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-semibold"
            />
          </div>

          {/* Bebas Kunci Akun */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">Bebas kunci akun</label>
            <select
              value={bebasKunciAkun}
              onChange={(e) => setBebasKunciAkun(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs"
            >
              <option value="Ya, bebas">Ya, bebas</option>
              <option value="Terkunci / Bermasalah">Terkunci / Ada Akun</option>
            </select>
          </div>

          {/* Kelengkapan */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">Kelengkapan</label>
            <select
              value={kelengkapan}
              onChange={(e) => setKelengkapan(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs"
            >
              <option value="Fullset">Fullset (Dus & Aksesoris)</option>
              <option value="Unit + Dus OEM">Unit + Dus OEM</option>
              <option value="Unit + Charger">Unit + Charger</option>
              <option value="Batangan (Unit saja)">Batangan (Unit saja)</option>
            </select>
          </div>

          {/* Cek IMEI */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">Status Cek IMEI</label>
            <select
              value={statusImei}
              onChange={(e) => setStatusImei(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs"
            >
              <option value="aman">Aman (Kemenperin / Bea Cukai / Resmi)</option>
              <option value="bermasalah">Bermasalah / Ditahan (Butuh Approval)</option>
            </select>
          </div>
        </div>

        {/* SECTION: HARGA & TRANSAKSI */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
          <h2 className="font-bold text-xs text-slate-900">Harga & Asal Barang</h2>

          {/* Harga Beli */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Harga beli <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={hargaBeli}
              onChange={(e) => {
                const num = e.target.value.replace(/\D/g, '');
                setHargaBeli(num ? Number(num).toLocaleString('id-ID') : '');
              }}
              placeholder="Rp 0"
              required
              className="w-full font-mono text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900"
            />
            <p className="text-[10px] text-slate-400 mt-1">Ongkir, poles, dll</p>
          </div>

          {/* Harga Jual Target */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">Harga jual target</label>
            <input
              type="text"
              value={hargaTarget}
              onChange={(e) => {
                const num = e.target.value.replace(/\D/g, '');
                setHargaTarget(num ? Number(num).toLocaleString('id-ID') : '');
              }}
              placeholder="Rp 0"
              className="w-full font-mono text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900"
            />
          </div>

          {/* Tanggal Barang Masuk */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">Tanggal barang masuk</label>
            <input
              type="date"
              value={tanggalMasuk}
              onChange={(e) => setTanggalMasuk(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs font-medium"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Bisa diatur jika mencatat stok lama, default hari ini
            </p>
          </div>

          {/* Asal Barang & No Telepon */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-700 font-medium mb-1">Asal barang (opsional)</label>
              <input
                type="text"
                value={asalBarang}
                onChange={(e) => setAsalBarang(e.target.value)}
                placeholder="Contoh: CV Maju Seluler"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">Supplier atau nama penjual</p>
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">No. WhatsApp</label>
              <input
                type="tel"
                value={kontakTelepon}
                onChange={(e) => setKontakTelepon(e.target.value)}
                placeholder="081234567890"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs"
              />
            </div>
          </div>

          {/* Metode Bayar */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">Metode Bayar ke Penjual</label>
            <div className="grid grid-cols-3 gap-2">
              {(['transfer', 'tunai', 'qris'] as PaymentMethod[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMetodeBayar(m)}
                  className={`py-1.5 rounded-xl font-bold uppercase text-[11px] text-center transition-colors ${
                    metodeBayar === m
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Foto Dokumentasi, Catatan, & Tombol Simpan */}
      <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
        {/* SECTION: FOTO DOKUMENTASI (MULTI UPLOAD, MAKS 10 FOTO) */}
        <div className="bg-white dark:bg-[#142036] rounded-3xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-xs text-slate-900 dark:text-white">Foto Unit & Kelengkapan</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/80">
                  {photos.length}/10 Foto
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Bisa pilih banyak foto sekaligus dari galeri (depan, belakang, IMEI, dus, dll)
              </p>
            </div>
            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 flex items-center gap-1 shrink-0">
              <Cloud className="w-3 h-3 text-blue-500" />
              Auto-Sync
            </span>
          </div>

          {/* Hidden multi-file input */}
          <input
            ref={multipleFileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            disabled={photos.length >= 10 || isUploadingMultiple}
            onChange={handleBatchImageUpload}
          />

          {/* Dropzone jika belum ada foto sama sekali */}
          {photos.length === 0 ? (
            <div
              onClick={() => multipleFileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl p-5 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900 flex flex-col items-center justify-center gap-2 group"
            >
              <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <span className="font-bold text-xs text-slate-800 dark:text-white block">
                  Pilih & Upload Foto Sekaligus
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                  Pilih hingga 10 foto langsung dari galeri HP atau laptop
                </span>
              </div>
              <span className="mt-1 px-3 py-1.5 bg-[#0c1e38] dark:bg-blue-600 text-white rounded-xl text-[10px] font-semibold shadow-2xs flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5" />
                <span>Buka Galeri Foto</span>
              </span>
            </div>
          ) : (
            /* Grid Foto yang telah diupload */
            <div className="space-y-2">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                {photos.map((item, idx) => (
                  <div
                    key={item.id}
                    className="relative aspect-square rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 group shadow-2xs"
                  >
                    <img
                      src={item.url}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Badge Nomor Foto */}
                    <span className="absolute top-1.5 left-1.5 bg-black/75 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md">
                      {idx === 0 ? '★ Utama' : `#${idx + 1}`}
                    </span>

                    {/* Status Spinner atau Tombol Hapus */}
                    {item.isUploading ? (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-400 mb-0.5" />
                        <span className="text-[8px] font-semibold">Upload...</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => removePhoto(item.id, e)}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/65 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-xs"
                        title="Hapus Foto"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}

                    {/* Storage Provider */}
                    {!item.isUploading && (
                      <span className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-xs text-white text-[7px] font-mono px-1 py-0.2 rounded">
                        {item.provider === 'cloudinary' ? '☁️ Cloud' : '💾 Simpan'}
                      </span>
                    )}
                  </div>
                ))}

                {/* Tombol Tambah Foto (+ Tambah) jika belum 10 */}
                {photos.length < 10 && (
                  <button
                    type="button"
                    onClick={() => multipleFileInputRef.current?.click()}
                    disabled={isUploadingMultiple}
                    className="aspect-square border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl flex flex-col items-center justify-center p-2 text-center hover:bg-slate-50 dark:hover:bg-[#101b30] transition-colors group cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-1 transition-colors" />
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-tight">
                      + Tambah
                    </span>
                    <span className="text-[8px] text-slate-400 mt-0.5">
                      {10 - photos.length} slot lagi
                    </span>
                  </button>
                )}
              </div>

              {/* Tips & Quick Action Button */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>Foto pertama (★ Utama) otomatis jadi sampul di etalase stok.</span>
                {photos.length < 10 && (
                  <button
                    type="button"
                    onClick={() => multipleFileInputRef.current?.click()}
                    disabled={isUploadingMultiple}
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline shrink-0 ml-2"
                  >
                    + Tambah Lagi
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* SECTION: CATATAN & SERVIS */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-xs text-slate-900">Catatan Unit</h2>
            <span className="text-[10px] text-slate-400">Opsional</span>
          </div>

          <textarea
            rows={2}
            value={catatanUnit}
            onChange={(e) => setCatatanUnit(e.target.value)}
            placeholder="Contoh: lecet halus di frame, charger bawaan tidak ada"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 text-xs"
          />

          {/* Perlu Servis Checkbox */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-200/60 flex items-start justify-between gap-3">
            <div>
              <span className="font-semibold text-xs text-slate-800 block">
                Perlu servis sebelum dijual
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Unit langsung berstatus Servis dan tercatat di halaman Servis
              </p>
            </div>
            <input
              type="checkbox"
              checked={perluServis}
              onChange={(e) => setPerluServis(e.target.checked)}
              className="w-4 h-4 text-slate-900 rounded mt-0.5 cursor-pointer"
            />
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS (As in screenshot: Simpan dan tambah lagi & Simpan) */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={submitting}
            className="py-3 px-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#142036] hover:bg-slate-50 dark:hover:bg-[#1a2b48] text-slate-800 dark:text-slate-200 font-bold text-xs transition-all text-center"
          >
            {submitting ? 'Menyimpan...' : 'Simpan dan tambah lagi'}
          </button>

          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={submitting}
            className="py-3 px-3 rounded-2xl bg-[#0c1e38] hover:bg-[#162a4a] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all text-center"
          >
            {submitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>

    {/* Modal Barcode Scanner */}
    <BarcodeScannerModal
      isOpen={scannerModal.open}
      onClose={() => setScannerModal((prev) => ({ ...prev, open: false }))}
      onDetected={(scannedValue) => {
        if (scannerModal.target === 'imei') {
          setImei(scannedValue);
        } else {
          setImei2(scannedValue);
        }
      }}
      title={
        scannerModal.target === 'imei'
          ? 'Scan Barcode IMEI 1 (SIM Utama)'
          : 'Scan Barcode IMEI 2 (SIM 2 / eSIM)'
      }
      subtitle="Arahkan kamera ke barcode dus HP atau layar *#06#"
    />
  </div>
);
}

export default function BarangMasukPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat formulir...</div>}>
      <BarangMasukContent />
    </Suspense>
  );
}
