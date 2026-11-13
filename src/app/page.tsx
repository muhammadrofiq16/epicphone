'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import {
  FileText,
  Package,
  Wrench,
  CreditCard,
  Check,
  ChevronRight,
  TrendingUp,
  Receipt,
  Clock,
  ArrowDownLeft,
  Smartphone,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { DashboardSummary } from '@/types';
import { formatTanggalPendek } from '@/lib/formatters';

function DashboardContent() {
  const { role, currentUser } = useAuth();
  const { hideNumbers, formatMoney, toggleHideNumbers } = usePreferences();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [chartRange, setChartRange] = useState<'hari' | '7d' | '30d'>('7d');
  const [loading, setLoading] = useState(true);
  const [todayDateStr, setTodayDateStr] = useState('');

  useEffect(() => {
    setTodayDateStr(
      new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    );
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard?role=${role}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [role]);

  const isOwner = role === 'pemilik';

  const chartData = chartRange === '30d' ? data?.omzet_chart_30d || [] : data?.omzet_chart_7d || [];
  const maxChartVal = Math.max(...chartData.map((d) => d.total), 1);

  // Checks for attention
  const hasAttentionItems =
    (data?.stok_mengendap_count || 0) > 0 ||
    (data?.servis_menunggu_count || 0) > 0 ||
    (data?.piutang_count || 0) > 0;

  return (
    <div className="space-y-3.5 pb-6">
      {/* Date & Jual Sekarang Button (as seen in screenshot) */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-500 font-medium">
          {todayDateStr || 'Selasa, 10 Nov 2026'}
        </span>

        <Link
          href="/jual"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c1e38] hover:bg-[#162a4a] text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95"
        >
          <Receipt className="w-3.5 h-3.5 text-slate-300" />
          <span>Jual sekarang</span>
        </Link>
      </div>

      {/* TOP STATS METRIC CARDS (Responsive: 2-col on mobile, 5-col on desktop) */}
      <div
        className={`grid gap-3 ${
          isOwner ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'
        }`}
      >
        {/* HERO CARD: LABA KOTOR HARI INI (Only for Pemilik) */}
        {isOwner && (
          <div className="col-span-2 sm:col-span-1 bg-[#0c1e38] dark:bg-[#0c182c] rounded-2xl p-4 text-white shadow-md relative overflow-hidden border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-wider uppercase text-slate-300">
                Laba kotor hari ini
              </span>
              <button
                onClick={() => toggleHideNumbers()}
                className="text-slate-400 hover:text-white transition-colors"
                title={hideNumbers ? 'Tampilkan angka' : 'Sembunyikan angka'}
              >
                {hideNumbers ? <EyeOff className="w-3.5 h-3.5 text-blue-400" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="text-xl sm:text-2xl font-black tracking-tight my-1 text-white">
              {formatMoney(data?.laba_kotor_hari_ini || 0)}
            </div>

            <p className="text-[10px] text-slate-400">— belum ada pembanding</p>

            {/* Geometric sparkline stroke */}
            <div className="absolute right-3 bottom-2 opacity-20 pointer-events-none">
              <svg width="50" height="20" viewBox="0 0 60 24" fill="none">
                <path
                  d="M1 20L35 20L48 4L59 4"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        )}

        {/* 1. Omzet */}
        <div className="bg-white dark:bg-[#142036] rounded-2xl p-3.5 border border-slate-200/70 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Omzet</span>
          <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight my-1">
            {formatMoney(data?.omzet_hari_ini || 0, true)}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">— belum ada pembanding</p>
        </div>

        {/* 2. Kas Masuk */}
        <div className="bg-white dark:bg-[#142036] rounded-2xl p-3.5 border border-slate-200/70 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Kas masuk</span>
          <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight my-1">
            {formatMoney(data?.kas_masuk_hari_ini || 0, true)}
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">— belum ada pembanding</p>
        </div>

        {/* 3. Unit Terjual */}
        <div className="bg-white dark:bg-[#142036] rounded-2xl p-3.5 border border-slate-200/70 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Unit terjual</span>
          <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight my-1">
            {data?.unit_terjual_hari_ini || 0} unit
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">— belum ada pembanding</p>
        </div>

        {/* 4. Stok Siap Jual */}
        <div className="bg-white dark:bg-[#142036] rounded-2xl p-3.5 border border-slate-200/70 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">Stok siap jual</span>
          <div className="text-lg font-bold text-slate-900 dark:text-white tracking-tight my-1">
            {data?.stok_siap_jual || 0} unit
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">semua lancar</p>
        </div>
      </div>

      {/* DUAL COLUMN DESKTOP GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: Charts & Recent Transactions (lg:col-span-7 xl:col-span-8) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* CARD: OMZET 7 HARI TERAKHIR */}
          <div className="bg-white dark:bg-[#142036] rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 shadow-2xs">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white mb-2.5">Omzet 7 hari terakhir</h3>

            {/* Filters and Link */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <button
                  onClick={() => setChartRange('hari')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    chartRange === 'hari' ? 'bg-white dark:bg-[#1c2e4d] text-slate-900 dark:text-white shadow-2xs font-semibold' : ''
                  }`}
                >
                  Hari ini
                </button>
                <button
                  onClick={() => setChartRange('7d')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    chartRange === '7d' ? 'bg-white dark:bg-[#1c2e4d] text-slate-900 dark:text-white shadow-2xs font-semibold' : ''
                  }`}
                >
                  7 hari
                </button>
                <button
                  onClick={() => setChartRange('30d')}
                  className={`px-2 py-0.5 rounded-md transition-all ${
                    chartRange === '30d' ? 'bg-white dark:bg-[#1c2e4d] text-slate-900 dark:text-white shadow-2xs font-semibold' : ''
                  }`}
                >
                  30 hari
                </button>
              </div>

              <Link
                href="/laporan"
                className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white flex items-center"
              >
                Laporan &gt;
              </Link>
            </div>

            {/* Clean sleek bar chart with dashed average line */}
            <div className="relative h-32 flex items-end gap-2 pt-4 pb-1 border-b border-slate-100 dark:border-slate-800">
              {/* Average dashed line */}
              <div className="absolute left-0 right-0 top-1/2 border-b border-dashed border-slate-200 dark:border-slate-700 pointer-events-none" />

              {chartData.map((d, i) => {
                const heightPercent = Math.max(6, Math.round((d.total / maxChartVal) * 100));
                const isHighestOrToday = i === chartData.length - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-xs transition-all ${
                        d.total > 0
                          ? isHighestOrToday
                            ? 'bg-[#22c55e]'
                            : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                          : 'bg-slate-100 dark:bg-slate-800'
                      }`}
                      title={`${d.label}: ${formatMoney(d.total)}`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Axis labels & Subtitle */}
            <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
              <span>{chartData[0]?.label || '-'}</span>
              <span>{chartData[Math.floor(chartData.length / 2)]?.label || '-'}</span>
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {chartData[chartData.length - 1]?.label || 'Hari ini'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
              Garis putus-putus: rata-rata {formatMoney(data?.rata_rata_omzet || 0, true)}
            </p>
          </div>

          {/* CARD: TRANSAKSI TERAKHIR */}
          <div className="bg-white dark:bg-[#142036] rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white">Transaksi terakhir</h3>
              <Link
                href="/riwayat"
                className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                Lihat riwayat &gt;
              </Link>
            </div>

            <div className="space-y-3">
              {(!data?.transaksi_terakhir || data.transaksi_terakhir.length === 0) ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Belum ada transaksi tercatat.
                </div>
              ) : (
                data.transaksi_terakhir.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80 last:border-none"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                          Jual · {t.unit_info || 'iPhone'}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">
                          {formatTanggalPendek(t.tanggal)} · {t.pembeli_nama}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {formatMoney(t.harga_akhir)}
                      </div>
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-100/60 dark:border-emerald-800/60 mt-0.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500" />
                        Lunas
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Perlu Perhatian & Aksi Cepat (lg:col-span-5 xl:col-span-4) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          {/* CARD: PERLU PERHATIAN */}
          <div className="bg-white dark:bg-[#142036] rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 shadow-2xs">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white mb-3">Perlu perhatian</h3>

            {!hasAttentionItems ? (
              <div className="py-4 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center mx-auto mb-2">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">Semua beres</h4>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 max-w-xs mx-auto">
                  Tidak ada tagihan telat, servis menunggu, atau stok mengendap.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {(data?.stok_mengendap_count || 0) > 0 && (
                  <Link
                    href="/stok?status=Siap+jual"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {data?.stok_mengendap_count} Unit Stok Mengendap
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-400">
                          Lebih dari 30 hari di toko belum laku
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                )}

                {(data?.servis_menunggu_count || 0) > 0 && (
                  <Link
                    href="/stok?status=Dicek%2FServis"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Wrench className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {data?.servis_menunggu_count} Unit Sedang Diservis
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-400">
                          Menunggu tindakan servis unit
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* CARD: AKSI CEPAT */}
          <div className="bg-white dark:bg-[#142036] rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 shadow-2xs">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white mb-3">Aksi cepat</h3>

            <div className="grid grid-cols-2 gap-2.5">
              <Link
                href="/jual"
                className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-[#101b30] hover:bg-slate-50 dark:hover:bg-[#182845] transition-colors flex flex-col items-start"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-2">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">Jual</span>
              </Link>

              <Link
                href="/barang-masuk"
                className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-[#101b30] hover:bg-slate-50 dark:hover:bg-[#182845] transition-colors flex flex-col items-start"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-2">
                  <Package className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">Barang masuk</span>
              </Link>

              <Link
                href="/servis"
                className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-[#101b30] hover:bg-slate-50 dark:hover:bg-[#182845] transition-colors flex flex-col items-start"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-2">
                  <Wrench className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">Servis</span>
              </Link>

              <Link
                href="/riwayat"
                className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-[#101b30] hover:bg-slate-50 dark:hover:bg-[#182845] transition-colors flex flex-col items-start"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-2">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">Terima bayar</span>
              </Link>
            </div>

            {/* Divider & Summary rows */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Piutang
                </span>
                <span className="font-semibold text-slate-800 dark:text-white">
                  {formatMoney(data?.piutang_total || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <Wrench className="w-3.5 h-3.5 text-slate-400" />
                  Servis berjalan
                </span>
                <span className="font-semibold text-slate-800 dark:text-white">
                  {data?.servis_menunggu_count || 0}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Stok mengendap
                </span>
                <span className="font-semibold text-slate-800 dark:text-white">
                  {data?.stok_mengendap_count || 0} unit
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
