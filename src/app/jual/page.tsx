'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Smartphone,
  RotateCcw,
  Receipt,
  MessageCircle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { Unit, PaymentMethod, PaymentStatus } from '@/types';

function JualContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedUnitId = searchParams.get('unit_id');

  const { role, currentUser } = useAuth();
  const { formatMoney } = usePreferences();
  const isOwner = role === 'pemilik';

  const [availableUnits, setAvailableUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  // Form Fields
  const [hargaJual, setHargaJual] = useState<string>('');
  const [diskon, setDiskon] = useState<string>('');
  const [metodeBayar, setMetodeBayar] = useState<PaymentMethod>('transfer');
  const [statusBayar, setStatusBayar] = useState<PaymentStatus>('lunas');
  const [pembeliNama, setPembeliNama] = useState('');
  const [pembeliTelepon, setPembeliTelepon] = useState('');
  const [garansiHari, setGaransiHari] = useState(30);
  const [catatan, setCatatan] = useState('');

  // Trade-in
  const [isTradeIn, setIsTradeIn] = useState(false);
  const [tradeInTipe, setTradeInTipe] = useState('iPhone 11');
  const [tradeInStorage, setTradeInStorage] = useState('64 GB');
  const [tradeInWarna, setTradeInWarna] = useState('Black');
  const [tradeInImei, setTradeInImei] = useState('');
  const [tradeInHarga, setTradeInHarga] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [receiptResult, setReceiptResult] = useState<any | null>(null);

  useEffect(() => {
    async function loadReadyUnits() {
      try {
        setLoading(true);
        const res = await fetch(`/api/units?status=Siap+jual&role=${role}`);
        if (res.ok) {
          const list: Unit[] = await res.json();
          setAvailableUnits(list);

          if (preselectedUnitId) {
            const found = list.find((u) => u.id === Number(preselectedUnitId));
            if (found) {
              selectUnit(found);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load available units:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReadyUnits();
  }, [role, preselectedUnitId]);

  const selectUnit = (unit: Unit) => {
    setSelectedUnit(unit);
    if (unit.harga_jual_rekomendasi) {
      setHargaJual(unit.harga_jual_rekomendasi.toLocaleString('id-ID'));
    } else if (unit.hpp && isOwner) {
      setHargaJual((unit.hpp + 1000000).toLocaleString('id-ID'));
    }
  };

  const numHargaJual = Number(hargaJual.replace(/\D/g, '')) || 0;
  const numDiskon = Number(diskon.replace(/\D/g, '')) || 0;
  const numHargaAkhir = Math.max(0, numHargaJual - numDiskon);
  const numTradeInPotongan = isTradeIn ? Number(tradeInHarga.replace(/\D/g, '')) || 0 : 0;
  const numUangDiterima = Math.max(0, numHargaAkhir - numTradeInPotongan);

  const unitHpp = selectedUnit?.hpp || 0;
  const estimatedProfit = numHargaAkhir - unitHpp;
  const isLoss = isOwner && selectedUnit && estimatedProfit < 0;
  const isMarginThin = isOwner && selectedUnit && estimatedProfit >= 0 && estimatedProfit < 200000;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) {
      setErrorMsg('Pilih unit yang akan dijual!');
      return;
    }
    if (numHargaJual <= 0) {
      setErrorMsg('Harga jual harus lebih dari Rp 0!');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: selectedUnit.id,
          pembeli_nama: pembeliNama || 'Pelanggan Umum',
          pembeli_telepon: pembeliTelepon || null,
          harga_jual: numHargaJual,
          diskon: numDiskon,
          garansi_hari: garansiHari,
          metode_bayar: metodeBayar,
          status_bayar: statusBayar,
          catatan,
          pencatat_id: currentUser?.id || 1,
          tipe_transaksi: isTradeIn ? 'tukar_tambah' : 'reguler',
          trade_in: isTradeIn
            ? {
                tipe: tradeInTipe,
                storage: tradeInStorage,
                warna: tradeInWarna,
                imei: tradeInImei.trim(),
                harga_taksiran: numTradeInPotongan,
              }
            : undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan transaksi penjualan');
      }

      setReceiptResult(json);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3.5 pb-10">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Kasir Penjualan</h1>
          <p className="text-[11px] text-slate-400">Pilih unit Siap Jual dan buat nota transaksi</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-slate-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SUCCESS NOTA MODAL */}
      {receiptResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200/80 text-slate-900 space-y-3.5">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Penjualan Berhasil</h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{receiptResult.nomorNota}</p>
            </div>

            {isOwner && (
              <div className="p-3 bg-slate-50 dark:bg-[#142036] rounded-2xl border border-slate-200/70 dark:border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Laba Transaksi Ini</span>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  +{formatMoney(receiptResult.labaKotor)}
                </div>
              </div>
            )}

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 max-h-36 overflow-y-auto text-[10px] font-mono whitespace-pre-wrap text-slate-600">
              {receiptResult.waText}
            </div>

            <div className="space-y-2 pt-1">
              <a
                href={receiptResult.waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 bg-[#0c1e38] hover:bg-[#162a4a] text-white font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs text-xs"
              >
                <MessageCircle className="w-4 h-4" />
                Kirim Nota ke WhatsApp
              </a>

              <button
                onClick={() => router.push('/riwayat')}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl text-xs"
              >
                Lihat di Riwayat Transaksi
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-xs">
        {/* LEFT COLUMN: Pilih Unit & Data Pembeli */}
        <div className="lg:col-span-7 space-y-4">
          {/* Step 1: Unit Selection */}
          <div className="bg-white dark:bg-[#142036] rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white text-xs">1. Pilih Unit</h2>
              <span className="text-[10px] text-slate-400 font-medium">
                {availableUnits.length} unit siap
              </span>
            </div>

            {availableUnits.length === 0 ? (
              <div className="p-4 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                Tidak ada unit &quot;Siap jual&quot;. Catat barang masuk terlebih dahulu.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {availableUnits.map((u) => {
                  const isSelected = selectedUnit?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      onClick={() => selectUnit(u)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'border-[#0c1e38] dark:border-blue-500 bg-slate-50 dark:bg-blue-950/40 shadow-2xs'
                          : 'border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#182845]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-xs">
                            {u.tipe} {u.storage}
                          </span>
                          {u.jenis_garansi === 'resmi' ? (
                            <span className="text-[9px] font-semibold px-1 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              Resmi
                            </span>
                          ) : u.status_sinyal === 'wifi_only' ? (
                            <span className="text-[9px] font-bold px-1 rounded bg-slate-800 text-white">
                              WiFi Only
                            </span>
                          ) : (
                            <span className="text-[9px] font-semibold px-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                              Inter All Opr
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {u.warna} · IMEI 1: {u.imei}{u.imei2 ? ` · IMEI 2: ${u.imei2}` : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">
                          {u.harga_jual_rekomendasi
                            ? formatMoney(u.harga_jual_rekomendasi)
                            : isOwner && u.hpp
                            ? formatMoney(u.hpp)
                            : '-'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Pembeli & Garansi */}
          {selectedUnit && (
            <div className="bg-white dark:bg-[#142036] rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 shadow-2xs space-y-2.5">
              <h2 className="font-bold text-slate-900 dark:text-white text-xs">2. Data Pembeli & Garansi</h2>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={pembeliNama}
                  onChange={(e) => setPembeliNama(e.target.value)}
                  placeholder="Nama Pembeli"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
                <input
                  type="tel"
                  value={pembeliTelepon}
                  onChange={(e) => setPembeliTelepon(e.target.value)}
                  placeholder="No. WhatsApp"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex gap-1.5 pt-1">
                {[7, 14, 30, 60].map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setGaransiHari(d)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-colors ${
                      garansiHari === d
                        ? 'bg-slate-900 dark:bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {d} Hari
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Harga, Diskon, & Selesaikan Transaksi */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
          {selectedUnit ? (
            <>
              {/* Step 2: Pricing */}
              <div className="bg-white dark:bg-[#142036] rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 shadow-2xs space-y-3">
                <h2 className="font-bold text-slate-900 dark:text-white text-xs">3. Harga & Pembayaran</h2>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Harga Jual (Rp)</label>
                    <input
                      type="text"
                      value={hargaJual}
                      onChange={(e) => {
                        const num = e.target.value.replace(/\D/g, '');
                        setHargaJual(num ? Number(num).toLocaleString('id-ID') : '');
                      }}
                      placeholder="8.500.000"
                      required
                      className="w-full font-mono text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Diskon (Rp)</label>
                    <input
                      type="text"
                      value={diskon}
                      onChange={(e) => {
                        const num = e.target.value.replace(/\D/g, '');
                        setDiskon(num ? Number(num).toLocaleString('id-ID') : '');
                      }}
                      placeholder="0"
                      className="w-full font-mono text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Tukar Tambah Check */}
                <div className="p-3 bg-slate-50/70 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                      Transaksi Tukar Tambah?
                    </span>
                    <input
                      type="checkbox"
                      checked={isTradeIn}
                      onChange={(e) => setIsTradeIn(e.target.checked)}
                      className="w-4 h-4 text-slate-800 rounded"
                    />
                  </div>

                  {isTradeIn && (
                    <div className="mt-2.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-700 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={tradeInTipe}
                          onChange={(e) => setTradeInTipe(e.target.value)}
                          placeholder="Model HP lama"
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                        />
                        <input
                          type="text"
                          value={tradeInImei}
                          onChange={(e) => setTradeInImei(e.target.value)}
                          placeholder="IMEI HP Lama"
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                        />
                      </div>
                      <input
                        type="text"
                        value={tradeInHarga}
                        onChange={(e) => {
                          const num = e.target.value.replace(/\D/g, '');
                          setTradeInHarga(num ? Number(num).toLocaleString('id-ID') : '');
                        }}
                        placeholder="Nilai Taksiran HP Lama (Rp)"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold font-mono"
                      />
                    </div>
                  )}
                </div>

                {/* Total Kas */}
                <div className="bg-slate-50 dark:bg-[#142036] rounded-xl p-3 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                    <span>Harga Setelah Diskon:</span>
                    <span>{formatMoney(numHargaAkhir)}</span>
                  </div>
                  {isTradeIn && (
                    <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                      <span>Potongan HP Lama:</span>
                      <span>-{formatMoney(numTradeInPotongan)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                    <span>TOTAL DIBAYAR:</span>
                    <span>{formatMoney(numUangDiterima)}</span>
                  </div>

                  {isOwner && (
                    <div className="flex justify-between text-[11px] pt-1 text-slate-500 dark:text-slate-400">
                      <span>Estimasi Laba:</span>
                      <span className={`font-semibold ${isLoss ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                        +{formatMoney(estimatedProfit)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Warnings */}
                {isLoss && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Harga jual di bawah modal HPP unit (Transaksi rugi).</span>
                  </div>
                )}

                {/* Metode Bayar */}
                <div className="space-y-1 pt-1">
                  <label className="block text-slate-600 dark:text-slate-400 font-medium">Metode Bayar</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['transfer', 'tunai', 'qris'] as PaymentMethod[]).map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setMetodeBayar(m)}
                        className={`py-1.5 rounded-xl font-bold uppercase text-[11px] text-center transition-colors ${
                          metodeBayar === m
                            ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#0c1e38] hover:bg-[#162a4a] dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-md text-xs flex items-center justify-center gap-2 transition-transform active:scale-98"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Transaksi & Terbitkan Nota'}
              </button>
            </>
          ) : (
            <div className="p-6 text-center bg-white dark:bg-[#142036] rounded-2xl border border-slate-200/80 dark:border-slate-800 text-slate-400 text-xs">
              <Smartphone className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              Pilih unit di sisi kiri untuk memproses kasir penjualan.
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

export default function JualPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat kasir...</div>}>
      <JualContent />
    </Suspense>
  );
}
