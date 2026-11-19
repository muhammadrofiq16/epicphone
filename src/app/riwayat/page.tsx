'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
  Search,
  Receipt,
  MessageCircle,
  X,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { Sale } from '@/types';
import { formatTanggal, formatTanggalPendek } from '@/lib/formatters';

function RiwayatContent() {
  const { role } = useAuth();
  const { formatMoney } = usePreferences();
  const isOwner = role === 'pemilik';

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sales?role=${role}`);
      if (res.ok) {
        const data = await res.json();
        setSales(data);
      }
    } catch (err) {
      console.error('Error fetching sales history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role]);

  const filteredSales = sales.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.nomor_nota.toLowerCase().includes(q) ||
      (s.pembeli_nama && s.pembeli_nama.toLowerCase().includes(q)) ||
      (s.unit_info && s.unit_info.toLowerCase().includes(q)) ||
      (s.unit_imei && s.unit_imei.includes(q)) ||
      (s.unit_imei2 && s.unit_imei2.includes(q))
    );
  });

  return (
    <div className="space-y-3 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight">Riwayat Transaksi</h1>
        <p className="text-[11px] text-slate-400">Catatan penjualan dan nota resmi toko</p>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nomor nota, pembeli, unit..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200/80 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-2xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
      </div>

      {/* Sales List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Memuat transaksi...</div>
      ) : filteredSales.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/70 p-6">
          <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="font-bold text-xs text-slate-800">Belum Ada Transaksi</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Transaksi penjualan akan tercatat di sini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredSales.map((s) => (
            <div
              key={s.id}
              onClick={() => setSelectedSale(s)}
              className="bg-white rounded-2xl p-3.5 border border-slate-200/70 shadow-2xs hover:border-slate-300 transition-all cursor-pointer space-y-1.5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[9px] text-slate-400 block">
                    {s.nomor_nota}
                  </span>
                  <h3 className="font-bold text-slate-900 text-xs leading-tight">
                    Jual · {s.unit_info || 'iPhone Unit'}
                  </h3>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {formatTanggalPendek(s.tanggal)} · {s.pembeli_nama}
                  </div>
                </div>

                <span
                  className={`text-[9px] font-medium px-2 py-0.5 rounded-full uppercase border ${
                    s.status_transaksi === 'dibatalkan'
                      ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                  }`}
                >
                  {s.status_transaksi === 'dibatalkan' ? 'Dibatalkan' : s.status_bayar}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-medium">{s.metode_bayar}</span>
                <div className="text-right">
                  <div className="font-bold text-slate-900 dark:text-white text-xs">{formatMoney(s.harga_akhir)}</div>
                  {isOwner && s.laba_kotor !== undefined && (
                    <div className="text-[9px] text-slate-500 dark:text-slate-400">
                      Laba: +{formatMoney(s.laba_kotor)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedSale && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setSelectedSale(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200/80 space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
              <div>
                <span className="text-[9px] font-mono text-slate-400 block">
                  {selectedSale.nomor_nota}
                </span>
                <h3 className="font-bold text-sm text-slate-900">Detail Transaksi</h3>
                <p className="text-[10px] text-slate-400">{formatTanggal(selectedSale.tanggal)}</p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs bg-slate-50/80 p-3 rounded-2xl border border-slate-200/60">
              <div className="flex justify-between">
                <span className="text-slate-400">Unit:</span>
                <span className="font-semibold text-slate-900">{selectedSale.unit_info}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IMEI 1:</span>
                <span className="font-mono text-slate-700">{selectedSale.unit_imei || '-'}</span>
              </div>
              {selectedSale.unit_imei2 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">IMEI 2:</span>
                  <span className="font-mono text-slate-700">{selectedSale.unit_imei2}</span>
                </div>
              )}
              {selectedSale.unit_status_sinyal && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Jaringan:</span>
                  <span className="font-medium text-slate-800">
                    {selectedSale.unit_jenis_garansi === 'resmi'
                      ? 'Resmi Indonesia'
                      : selectedSale.unit_status_sinyal === 'wifi_only'
                      ? 'WiFi Only'
                      : 'Inter All Operator'}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Pembeli:</span>
                <span className="text-slate-800">{selectedSale.pembeli_nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Metode Bayar:</span>
                <span className="font-semibold uppercase text-slate-800">
                  {selectedSale.metode_bayar}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Garansi:</span>
                <span className="text-slate-800">{selectedSale.garansi_hari} Hari Toko</span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-xs text-slate-900 dark:text-white">
                <span>Total:</span>
                <span>{formatMoney(selectedSale.harga_akhir)}</span>
              </div>

              {isOwner && (
                <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                  <span>Laba Kotor:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    +{formatMoney(selectedSale.laba_kotor)}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              {selectedSale.pembeli_telepon && (
                <a
                  href={`https://wa.me/${selectedSale.pembeli_telepon
                    .replace(/\D/g, '')
                    .replace(/^0/, '62')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-[#0c1e38] hover:bg-[#162a4a] text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Hubungi di WhatsApp
                </a>
              )}

              <button
                onClick={() => setSelectedSale(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RiwayatPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat riwayat...</div>}>
      <RiwayatContent />
    </Suspense>
  );
}
