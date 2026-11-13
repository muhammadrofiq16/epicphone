'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';

function LaporanContent() {
  const router = useRouter();
  const { role } = useAuth();
  const { formatMoney } = usePreferences();
  const isOwner = role === 'pemilik';

  const [range, setRange] = useState<'hari_ini' | '7_hari' | '30_hari' | 'semua'>('30_hari');
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports?range=${range}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      fetchReport();
    }
  }, [range, isOwner]);

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['LAPORAN KEUANGAN EPICPHONE', `Periode: ${range}`],
      [''],
      ['Indikator', 'Nilai (Rp)'],
      ['Total Omzet Penjualan', data.omzet],
      ['Total Modal HP Terjual (HPP)', data.totalHpp],
      ['Laba Kotor Usaha', data.labaKotor],
      ['Total Pengeluaran Operasional', data.totalPengeluaran],
      ['Laba Bersih Akhir', data.labaBersih],
      ['Total Unit Terjual', data.totalUnit],
      [''],
      ['LABA PER TIPE IPHONE'],
      ['Tipe iPhone', 'Unit Terjual', 'Total Omzet (Rp)', 'Total Laba Kotor (Rp)'],
      ...data.laba_per_tipe.map((item: any) => [
        item.tipe,
        item.unit_terjual,
        item.omzet,
        item.laba_kotor,
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_EpicPhone_${range}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOwner) {
    return (
      <div className="py-12 text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Akses Dibatasi</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Hanya akun <strong>Pemilik</strong> yang berhak melihat laporan laba bersih dan modal HPP.
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
        >
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 pb-10">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-white border border-slate-200/80 flex items-center justify-center text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight">Laporan Keuangan</h1>
            <p className="text-[11px] text-slate-400">Ringkasan laba kotor & laba bersih</p>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={loading || !data}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c1e38] hover:bg-[#162a4a] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-4 gap-1 bg-slate-100 p-0.5 rounded-xl text-xs">
        {[
          { label: 'Hari Ini', val: 'hari_ini' },
          { label: '7 Hari', val: '7_hari' },
          { label: '30 Hari', val: '30_hari' },
          { label: 'Semua', val: 'semua' },
        ].map((t) => (
          <button
            key={t.val}
            onClick={() => setRange(t.val as any)}
            className={`py-1 rounded-lg text-[11px] font-medium text-center transition-all ${
              range === t.val ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <div className="py-12 text-center text-xs text-slate-400">Memuat laporan...</div>
      ) : (
        <div className="space-y-3 text-xs">
          {/* Hero Card Laba Bersih */}
          <div className="bg-[#0c1e38] dark:bg-[#0c182c] rounded-2xl p-4 text-white shadow-md relative overflow-hidden border border-slate-800">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-300 block">
              Laba Bersih ({range.replace('_', ' ')})
            </span>
            <div className="text-2xl font-black tracking-tight mt-1 text-white">
              {formatMoney(data.labaBersih)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Laba kotor dikurangi biaya operasional toko ({data.totalUnit} unit terjual)
            </p>
          </div>

          {/* Rincian Angka */}
          <div className="bg-white dark:bg-[#142036] rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 shadow-2xs space-y-2">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white">Rincian Laba & Rugi</h3>

            <div className="space-y-1.5 pt-1 text-[11px]">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <span>Omzet Penjualan:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{formatMoney(data.omzet)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <span>Total Modal Unit (HPP):</span>
                <span>-{formatMoney(data.totalHpp)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 font-semibold text-slate-900 dark:text-white">
                <span>Laba Kotor:</span>
                <span>+{formatMoney(data.labaKotor)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <span>Biaya Operasional Toko:</span>
                <span className="text-rose-600 dark:text-rose-400">-{formatMoney(data.totalPengeluaran)}</span>
              </div>
              <div className="flex justify-between py-1 font-bold text-xs text-slate-900 dark:text-white pt-1">
                <span>Laba Bersih Akhir:</span>
                <span className="text-emerald-700 dark:text-emerald-400">{formatMoney(data.labaBersih)}</span>
              </div>
            </div>
          </div>

          {/* Ranking Tipe */}
          <div className="bg-white dark:bg-[#142036] rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 shadow-2xs space-y-2">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white">Laba per Model iPhone</h3>

            {data.laba_per_tipe.length === 0 ? (
              <p className="text-slate-400 py-3 text-center">Belum ada unit terjual di periode ini.</p>
            ) : (
              <div className="space-y-1.5">
                {data.laba_per_tipe.map((item: any, i: number) => (
                  <div
                    key={item.tipe}
                    className="p-2.5 bg-slate-50/70 dark:bg-[#101b30] rounded-xl border border-slate-200/60 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        #{i + 1} {item.tipe}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-400">
                        {item.unit_terjual} unit · Omzet {formatMoney(item.omzet, true)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        +{formatMoney(item.laba_kotor)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LaporanPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat laporan...</div>}>
      <LaporanContent />
    </Suspense>
  );
}
