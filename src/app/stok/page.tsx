'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  BatteryCharging,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ChevronRight,
  X,
  Wrench,
  DollarSign,
  FileText,
  Smartphone,
  Receipt,
  Share2,
  Copy,
  Check,
  ExternalLink,
  ImageIcon,
  Sparkles,
  Download,
  LayoutGrid,
  List,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { Unit, UnitStatus } from '@/types';
import { formatTanggal, hitungUmurStok, getStatusUnitStyle } from '@/lib/formatters';

function getUnitDisplayPhoto(unit: Unit): { photo: string; isRealPhoto: boolean; count: number } {
  if (unit.foto && Array.isArray(unit.foto) && unit.foto.length > 0) {
    return { photo: unit.foto[0], isRealPhoto: true, count: unit.foto.length };
  }
  if (typeof unit.foto === 'string' && unit.foto) {
    return { photo: unit.foto, isRealPhoto: true, count: 1 };
  }

  // Fallback to crisp model illustration based on model name & color
  const t = unit.tipe.toLowerCase();
  const w = (unit.warna || '').toLowerCase();

  if (t.includes('15 pro max') || t.includes('15 pro')) {
    return { photo: '/images/models/iphone-15-pro-max.jpg', isRealPhoto: false, count: 1 };
  }
  if (t.includes('14 pro')) {
    return { photo: '/images/models/iphone-14-pro.jpg', isRealPhoto: false, count: 1 };
  }
  if (t.includes('13 pro')) {
    return { photo: '/images/models/iphone-13-pro.jpg', isRealPhoto: false, count: 1 };
  }
  if (t.includes('13')) {
    return { photo: '/images/models/iphone-13.jpg', isRealPhoto: false, count: 1 };
  }
  if (t.includes('12')) {
    return { photo: '/images/models/iphone-12.jpg', isRealPhoto: false, count: 1 };
  }
  if (t.includes('11')) {
    return {
      photo: w.includes('white') || w.includes('putih')
        ? '/images/models/iphone-11-white.jpg'
        : '/images/models/iphone-11-black.jpg',
      isRealPhoto: false,
      count: 1,
    };
  }
  if (t.includes('xr')) {
    return { photo: '/images/models/iphone-xr-coral.jpg', isRealPhoto: false, count: 1 };
  }

  return { photo: '/images/models/iphone-14-pro.jpg', isRealPhoto: false, count: 1 };
}

function getIgSquareUrl(url: string): string {
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/c_fill,g_auto,w_1080,h_1080,q_auto,f_auto/');
  }
  return url;
}

function getWatermarkedUrl(url: string): string {
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    return url.replace(
      '/upload/',
      '/upload/l_text:Arial_24_bold:EpicPhone%20Store,co_white,g_south_east,x_24,y_24,o_85/c_fill,g_auto,w_1080,h_1080,q_auto,f_auto/'
    );
  }
  return url;
}

function StokContent() {
  const { role, currentUser } = useAuth();
  const { hideNumbers, formatMoney } = usePreferences();
  const [units, setUnits] = useState<Unit[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [loading, setLoading] = useState(true);
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [unitDetail, setUnitDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoUnit, setPromoUnit] = useState<any | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [selectedPhotoFormat, setSelectedPhotoFormat] = useState<'watermarked' | 'square' | 'original'>('watermarked');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDetailPhotoIndex, setSelectedDetailPhotoIndex] = useState(0);
  const [selectedSinyalFilter, setSelectedSinyalFilter] = useState<string>('semua');
  const [confirmDeleteUnit, setConfirmDeleteUnit] = useState<Unit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const isOwner = role === 'pemilik';

  const getSinyalBadge = (unit: Unit) => {
    if (unit.jenis_garansi === 'resmi') {
      return (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          🇮🇩 Resmi iBox
        </span>
      );
    }
    if (unit.status_sinyal === 'wifi_only') {
      return (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-100 dark:bg-slate-700 border border-slate-600">
          📶 WiFi Only
        </span>
      );
    }
    if (unit.status_sinyal === 'smartfren_only') {
      return (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          Smartfren Only
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
        🌐 Inter All Opr
        {unit.status_sim_lock === 'su' && (
          <span className="text-[8px] bg-purple-600 text-white px-1 rounded">SU/R-SIM</span>
        )}
      </span>
    );
  };

  const generatePromoCaption = (unit: any) => {
    if (!unit) return '';
    const hargaFormatted = unit.harga_jual_rekomendasi
      ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(unit.harga_jual_rekomendasi)
      : 'Hubungi Admin';

    const sinyalPromo = (() => {
      if (unit.jenis_garansi === 'resmi') {
        return '🇮🇩 Resmi Indonesia (iBox/Digimap) - Garansi Sinyal Selamanya & Bebas Blokir!';
      }
      if (unit.status_sinyal === 'wifi_only') {
        return '📶 WiFi Only / No SIM (Khusus koneksi WiFi, kamera & performa 100% normal - Harga Lebih Hemat!)';
      }
      if (unit.status_sinyal === 'smartfren_only') {
        return '📶 Smartfren Only (Khusus kartu provider Smartfren)';
      }
      const simStatus = unit.status_sim_lock === 'su' ? 'SU (SIM-Lock / R-SIM)' : 'FU (Non SIM-Lock / Bebas Kartu)';
      const garansiStr = unit.garansi_sinyal ? String(unit.garansi_sinyal).replace('_', ' ') : '3 Bulan';
      return `🌐 Inter All Operator (${simStatus}) - Garansi Sinyal Toko: ${garansiStr}`;
    })();

    return `🔥 READY STOCK: ${unit.tipe} ${unit.storage} ${unit.warna}

Spesifikasi & Kondisi Unit:
✨ Kondisi: ${unit.kondisi || 'Mulus terawat'}
🔋 Battery Health: ${unit.battery_health ? unit.battery_health + '%' : 'Normal'}
📶 Sinyal: ${sinyalPromo}
🔍 IMEI 1: ${unit.imei}${unit.imei2 ? `\n🔍 IMEI 2: ${unit.imei2}` : ''}
📦 Kelengkapan: ${unit.kelengkapan || 'Fullset'}
🔒 Akun: Bebas Reset / iCloud Aman Clean

💵 Harga Spesial: ${hargaFormatted}
🎁 Garansi Toko + Free Pindah Data & Tempered Glass!

Siap kirim ke seluruh Indonesia / COD / Datang ke store langsung.
📲 Tanya & Order via WhatsApp: https://wa.me/?text=${encodeURIComponent('Halo EpicPhone, saya mau tanya unit ' + unit.tipe + ' ' + unit.storage)}

#epicphone #jualiphone #iphonebekas #${unit.tipe.toLowerCase().replace(/[^a-z0-9]/g, '')} #tokohpmurah #garansitoko`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCaption(true);
      setTimeout(() => setCopiedCaption(false), 2500);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const statusTabs = [
    'Semua',
    'Siap jual',
    'Baru masuk',
    'Dicek/Servis',
    'Booking',
    'Terjual',
    'Retur',
  ];

  const fetchUnits = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== 'Semua') params.append('status', selectedStatus);
      if (search.trim()) params.append('search', search.trim());
      if (selectedSinyalFilter === 'resmi') {
        params.append('jenis_garansi', 'resmi');
      } else if (selectedSinyalFilter === 'all_operator') {
        params.append('jenis_garansi', 'inter');
        params.append('status_sinyal', 'all_operator');
      } else if (selectedSinyalFilter === 'smartfren_only') {
        params.append('status_sinyal', 'smartfren_only');
      } else if (selectedSinyalFilter === 'wifi_only') {
        params.append('status_sinyal', 'wifi_only');
      }
      params.append('role', role);

      const res = await fetch(`/api/units?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUnits(data);
      }
    } catch (err) {
      console.error('Failed to load units:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, [selectedStatus, selectedSinyalFilter, role]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUnits();
  };

  const openUnitDetail = async (id: number) => {
    setSelectedUnitId(id);
    setSelectedDetailPhotoIndex(0);
    try {
      setDetailLoading(true);
      const res = await fetch(`/api/units/${id}?role=${role}`);
      if (res.ok) {
        const data = await res.json();
        setUnitDetail(data);
      }
    } catch (err) {
      console.error('Error fetching unit detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeUnitDetail = () => {
    setSelectedUnitId(null);
    setUnitDetail(null);
  };

  const handleStatusChange = async (newStatus: UnitStatus) => {
    if (!selectedUnitId) return;
    try {
      const res = await fetch(`/api/units/${selectedUnitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          userId: currentUser?.id || 1,
          notes: `Status diubah menjadi ${newStatus} oleh ${currentUser?.nama || 'Pengguna'}`,
        }),
      });

      if (res.ok) {
        fetchUnits();
        openUnitDetail(selectedUnitId);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteUnit = async () => {
    if (!confirmDeleteUnit) return;
    try {
      setIsDeleting(true);
      setDeleteError('');
      const res = await fetch(`/api/units/${confirmDeleteUnit.id}?userId=${currentUser?.id || 1}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus unit');
      }
      setConfirmDeleteUnit(null);
      closeUnitDetail();
      fetchUnits();
    } catch (err: any) {
      setDeleteError(err.message || 'Terjadi kesalahan saat menghapus');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-3 pb-6">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Stok Unit</h1>
          <p className="text-[11px] text-slate-400">
            {units.length} unit {selectedStatus !== 'Semua' ? `(${selectedStatus})` : ''}
          </p>
        </div>
        <Link
          href="/barang-masuk"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0c1e38] hover:bg-[#162a4a] text-white rounded-xl text-xs font-semibold shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Barang Masuk</span>
        </Link>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari IMEI, tipe, warna..."
          className="w-full pl-9 pr-16 py-2 rounded-xl border border-slate-200/80 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 shadow-2xs"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <button
          type="submit"
          className="absolute right-1 top-1 px-2.5 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-semibold hover:bg-slate-800"
        >
          Cari
        </button>
      </form>

      {/* Filter Tabs & View Mode Switcher */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 no-scrollbar flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {statusTabs.map((tab) => {
            const isActive = selectedStatus === tab;
            return (
              <button
                key={tab}
                onClick={() => setSelectedStatus(tab)}
                className={`px-3 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-2xs font-semibold'
                    : 'bg-white dark:bg-[#142036] border border-slate-200/70 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#192b4a]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-0.5 bg-white dark:bg-[#142036] border border-slate-200/80 dark:border-slate-800 p-0.5 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-2xs'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="Tampilan Kartu Foto (Showcase)"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-2xs'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="Tampilan Daftar Ringkas"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sinyal Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar text-[10px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <span className="text-slate-400 dark:text-slate-500 shrink-0 font-medium mr-0.5">Sinyal:</span>
        {[
          { id: 'semua', label: 'Semua' },
          { id: 'resmi', label: '🇮🇩 Resmi iBox' },
          { id: 'all_operator', label: '🌐 Inter All Opr' },
          { id: 'smartfren_only', label: '📶 Smartfren Only' },
          { id: 'wifi_only', label: '📶 WiFi Only' },
        ].map((f) => {
          const isActive = selectedSinyalFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setSelectedSinyalFilter(f.id)}
              className={`px-2 py-0.5 rounded-md whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Units List */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Memuat unit...</div>
      ) : units.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-[#142036] rounded-2xl border border-slate-200/70 dark:border-slate-800 p-6">
          <Smartphone className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="font-bold text-xs text-slate-800 dark:text-white">Unit Tidak Ditemukan</h3>
          <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
            Tidak ada unit pada filter ini.
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* MODE GRID: Kartu Foto Showcase HP Menawan */
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {units.map((u) => {
            const ageDays = hitungUmurStok(u.tanggal_masuk);
            const isAging = u.status === 'Siap jual' && ageDays >= 30;
            const statusStyle = getStatusUnitStyle(u.status);
            const displayPhoto = getUnitDisplayPhoto(u);

            return (
              <div
                key={u.id}
                onClick={() => openUnitDetail(u.id)}
                className="bg-white dark:bg-[#142036] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col overflow-hidden group"
              >
                {/* Large Phone Photo Showcase */}
                <div className="relative w-full aspect-square sm:aspect-4/3 bg-slate-50 dark:bg-slate-900/60 p-3 flex items-center justify-center border-b border-slate-100 dark:border-slate-800/80 overflow-hidden">
                  <img
                    src={displayPhoto.photo}
                    alt={`${u.tipe} ${u.warna}`}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('/images/models/')) {
                        target.src = '/images/models/iphone-14-pro.jpg';
                      }
                    }}
                  />

                  {/* Status Badge */}
                  <span
                    className={`absolute top-2 right-2 text-[8px] font-semibold px-2 py-0.5 rounded-full border shadow-2xs backdrop-blur-xs ${statusStyle.badge}`}
                  >
                    <span className={`w-1 h-1 rounded-full ${statusStyle.dot}`} />
                    {statusStyle.text}
                  </span>

                  {/* Photo count indicator */}
                  {displayPhoto.isRealPhoto && displayPhoto.count > 1 && (
                    <span className="absolute bottom-2 right-2 text-[8px] font-semibold bg-black/60 backdrop-blur-xs text-white px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      📷 {displayPhoto.count} Foto
                    </span>
                  )}

                  {u.battery_health && (
                    <span className="absolute bottom-2 left-2 text-[8px] font-semibold bg-white/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700">
                      BH {u.battery_health}%
                    </span>
                  )}
                </div>

                {/* Content Details */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-1.5">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h3 className="font-bold text-xs text-slate-900 dark:text-white leading-tight truncate">
                        {u.tipe} {u.storage}
                      </h3>
                      {getSinyalBadge(u)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                      {u.warna} · IMEI 1: {u.imei}{u.imei2 ? ` · IMEI 2: ${u.imei2}` : ''}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400">
                    <span>{u.status_imei === 'aman' ? 'IMEI Aman' : 'IMEI Tahan'}</span>
                    {u.kelengkapan && (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-[80px]">{u.kelengkapan}</span>
                      </>
                    )}
                  </div>

                  {/* Price & Aging Footer */}
                  <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs mt-auto">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {u.harga_jual_rekomendasi
                          ? formatMoney(u.harga_jual_rekomendasi)
                          : isOwner && u.hpp
                          ? formatMoney(u.hpp)
                          : 'Belum set'}
                      </div>
                      {isOwner && (
                        <div className="text-[9px] text-slate-400">
                          HPP: {formatMoney(u.hpp)}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      {isAging ? (
                        <span className="text-[8px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-full border border-amber-200/80">
                          {ageDays} hr
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400">
                          {ageDays === 0 ? 'Hari ini' : `${ageDays} hr`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* MODE LIST: Daftar Ringkas dengan Thumbnail */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {units.map((u) => {
            const ageDays = hitungUmurStok(u.tanggal_masuk);
            const isAging = u.status === 'Siap jual' && ageDays >= 30;
            const statusStyle = getStatusUnitStyle(u.status);
            const displayPhoto = getUnitDisplayPhoto(u);

            return (
              <div
                key={u.id}
                onClick={() => openUnitDetail(u.id)}
                className="bg-white dark:bg-[#142036] rounded-2xl p-3 border border-slate-200/70 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex gap-3 items-stretch"
              >
                {/* Foto HP Thumbnail */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center p-1">
                  <img
                    src={displayPhoto.photo}
                    alt={`${u.tipe} ${u.warna}`}
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('/images/models/')) {
                        target.src = '/images/models/iphone-14-pro.jpg';
                      }
                    }}
                  />
                  {displayPhoto.isRealPhoto && displayPhoto.count > 1 && (
                    <span className="absolute bottom-1 right-1 text-[8px] font-semibold bg-black/60 backdrop-blur-xs text-white px-1.5 py-0.2 rounded-md">
                      📷 {displayPhoto.count}
                    </span>
                  )}
                </div>

                {/* Detail Unit */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-xs text-slate-900 dark:text-white leading-tight truncate">
                          {u.tipe} {u.storage}
                        </h3>
                        {getSinyalBadge(u)}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5 font-mono truncate">
                        {u.warna} · IMEI 1: {u.imei}{u.imei2 ? ` · IMEI 2: ${u.imei2}` : ''}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusStyle.badge}`}
                    >
                      <span className={`w-1 h-1 rounded-full ${statusStyle.dot}`} />
                      {statusStyle.text}
                    </span>
                  </div>

                  {/* Sub row specs */}
                  <div className="flex items-center gap-1.5 my-1 text-[10px] text-slate-500 dark:text-slate-400">
                    {u.battery_health && <span>BH {u.battery_health}%</span>}
                    {u.battery_health && <span>·</span>}
                    <span>{u.status_imei === 'aman' ? 'IMEI Aman' : 'IMEI Tahan'}</span>
                    {u.kelengkapan && (
                      <>
                        <span>·</span>
                        <span className="truncate max-w-[110px]">{u.kelengkapan}</span>
                      </>
                    )}
                  </div>

                  {/* Footer Price & Age */}
                  <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-800/80 mt-auto text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {u.harga_jual_rekomendasi
                          ? formatMoney(u.harga_jual_rekomendasi)
                          : isOwner && u.hpp
                          ? formatMoney(u.hpp)
                          : 'Belum set harga'}
                      </div>
                      {isOwner && (
                        <div className="text-[9px] text-slate-400 dark:text-slate-400">
                          HPP: {formatMoney(u.hpp)}
                        </div>
                      )}
                    </div>

                    <div className="text-right flex items-center gap-1">
                      {isAging ? (
                        <span className="text-[9px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60">
                          Mengendap {ageDays} hr
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-400">
                          {ageDays === 0 ? 'Hari ini' : `${ageDays} hr lalu`}
                        </span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* UNIT DETAIL MODAL */}
      {selectedUnitId && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-xs p-3 animate-fade-in"
          onClick={closeUnitDetail}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-3xl p-5 shadow-2xl border border-slate-200/80 dark:border-slate-800 max-h-[85vh] overflow-y-auto animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading || !unitDetail ? (
              <div className="py-12 text-center text-xs text-slate-400">Memuat rincian...</div>
            ) : (
              <div className="space-y-3.5 text-xs">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[9px] font-mono uppercase text-slate-400">
                      UNIT #{unitDetail.unit.id}
                    </span>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      {unitDetail.unit.tipe} {unitDetail.unit.storage}
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      {unitDetail.unit.warna} · IMEI 1: {unitDetail.unit.imei}
                      {unitDetail.unit.imei2 ? ` · IMEI 2: ${unitDetail.unit.imei2}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={closeUnitDetail}
                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Hero Showcase Phone Photo */}
                {(() => {
                  const detailPhotos: string[] = (() => {
                    if (unitDetail.unit.foto && Array.isArray(unitDetail.unit.foto) && unitDetail.unit.foto.length > 0) {
                      return unitDetail.unit.foto;
                    }
                    if (typeof unitDetail.unit.foto === 'string' && unitDetail.unit.foto) {
                      return [unitDetail.unit.foto];
                    }
                    const fallback = getUnitDisplayPhoto(unitDetail.unit);
                    return [fallback.photo];
                  })();

                  const activePhoto = detailPhotos[selectedDetailPhotoIndex] || detailPhotos[0];

                  return (
                    <div className="space-y-2">
                      <div
                        onClick={() => setPreviewPhoto(activePhoto)}
                        className="group relative w-full h-48 sm:h-56 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-center p-3 overflow-hidden cursor-pointer shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                      >
                        <img
                          src={activePhoto}
                          alt={`${unitDetail.unit.tipe} ${unitDetail.unit.warna}`}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.includes('/images/models/')) {
                              target.src = '/images/models/iphone-14-pro.jpg';
                            }
                          }}
                        />

                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 text-white text-[10px] font-medium px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1 shadow-md">
                            🔍 Klik untuk perbesar foto
                          </span>
                        </div>

                        {detailPhotos.length > 1 && (
                          <span className="absolute bottom-2.5 right-2.5 text-[9px] font-semibold bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded-md">
                            📷 {selectedDetailPhotoIndex + 1} / {detailPhotos.length}
                          </span>
                        )}
                      </div>

                      {detailPhotos.length > 1 && (
                        <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                          {detailPhotos.map((url: string, idx: number) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setSelectedDetailPhotoIndex(idx)}
                              className={`relative w-14 h-14 rounded-xl overflow-hidden border shrink-0 bg-slate-50 dark:bg-slate-900 transition-all p-1 ${
                                selectedDetailPhotoIndex === idx
                                  ? 'border-blue-600 ring-2 ring-blue-500/40 shadow-xs'
                                  : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                              }`}
                            >
                              <img src={url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-contain" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Status Switcher */}
                <div className="p-3 bg-slate-50/80 dark:bg-[#142036] rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Status Saat Ini:</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        getStatusUnitStyle(unitDetail.unit.status).badge
                      }`}
                    >
                      {unitDetail.unit.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {['Siap jual', 'Dicek/Servis', 'Booking', 'Retur'].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(st as UnitStatus)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                          unitDetail.unit.status === st
                            ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modal Breakdown for Owner */}
                {isOwner && (
                  <div className="bg-slate-50/80 dark:bg-[#142036] border border-slate-200/70 dark:border-slate-800 rounded-2xl p-3 space-y-2">
                    <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 block">
                      Rincian Modal (HPP)
                    </span>
                    <div className="space-y-1 text-[11px]">
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Harga Beli:</span>
                        <span>{formatMoney(unitDetail.unit.harga_beli)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 dark:text-slate-400">
                        <span>Biaya Servis:</span>
                        <span>+{formatMoney(unitDetail.unit.total_biaya_servis)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span>Total HPP:</span>
                        <span>{formatMoney(unitDetail.unit.hpp)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Specs */}
                <div className="p-3 bg-white dark:bg-[#142036] border border-slate-200/70 dark:border-slate-800 rounded-2xl space-y-1.5 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Asal & Garansi:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {unitDetail.unit.jenis_garansi === 'resmi'
                        ? '🇮🇩 Resmi Indonesia (iBox/GDN)'
                        : '🌐 Inter (Internasional)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Jaringan Sinyal:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {unitDetail.unit.status_sinyal === 'all_operator'
                        ? 'All Operator'
                        : unitDetail.unit.status_sinyal === 'smartfren_only'
                        ? 'Smartfren Only'
                        : 'WiFi Only (No SIM)'}
                    </span>
                  </div>
                  {unitDetail.unit.jenis_garansi === 'inter' && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Kunci SIM (Lock):</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {unitDetail.unit.status_sim_lock === 'su'
                            ? 'SU (SIM-Lock / Butuh R-SIM)'
                            : 'FU (Non SIM-Lock / Bebas Kartu)'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Garansi Sinyal Toko:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                          {unitDetail.unit.garansi_sinyal
                            ? String(unitDetail.unit.garansi_sinyal).replace('_', ' ')
                            : '3 bulan'}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">IMEI 1 (SIM Utama):</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {unitDetail.unit.imei}
                    </span>
                  </div>
                  {unitDetail.unit.imei2 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">IMEI 2 (SIM 2 / eSIM):</span>
                      <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {unitDetail.unit.imei2}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-400">Battery Health:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {unitDetail.unit.battery_health ? `${unitDetail.unit.battery_health}%` : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cek IMEI:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                      {unitDetail.unit.status_imei}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kondisi:</span>
                    <span className="text-slate-800 dark:text-slate-200">{unitDetail.unit.kondisi || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Kelengkapan:</span>
                    <span className="text-slate-800 dark:text-slate-200">{unitDetail.unit.kelengkapan || '-'}</span>
                  </div>
                </div>

                {/* Foto Dokumentasi Unit */}
                {unitDetail.unit.foto && Array.isArray(unitDetail.unit.foto) && unitDetail.unit.foto.length > 0 && (
                  <div className="p-3 bg-slate-50/80 dark:bg-[#142036] rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                        Foto Kondisi ({unitDetail.unit.foto.length})
                      </span>
                      <span className="text-[10px] text-slate-400">Klik untuk perbesar</span>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5">
                      {unitDetail.unit.foto.map((url: string, idx: number) => {
                        const isCloud = url.includes('cloudinary.com');
                        return (
                          <div
                            key={idx}
                            onClick={() => setPreviewPhoto(url)}
                            className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer hover:opacity-90 transition-all shadow-2xs"
                          >
                            <img src={url} alt={`Kondisi ${idx + 1}`} className="w-full h-full object-cover" />
                            <span
                              className={`absolute bottom-1 right-1 text-[8px] px-1 py-0.2 rounded font-mono ${
                                isCloud
                                  ? 'bg-blue-600/90 text-white'
                                  : 'bg-slate-800/80 text-white'
                              }`}
                            >
                              {isCloud ? '☁️' : '💾'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tombol Promosi Media Sosial */}
                <button
                  type="button"
                  onClick={() => {
                    setPromoUnit(unitDetail.unit);
                    setShowPromoModal(true);
                  }}
                  className="w-full py-2.5 px-3 bg-white dark:bg-[#142036] hover:bg-slate-50 dark:hover:bg-[#1a2b48] border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl flex items-center justify-between text-xs font-semibold shadow-2xs transition-all"
                >
                  <div className="flex items-center gap-2">
                    <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Promosi ke IG, FB & WA</span>
                  </div>
                  <span className="text-[10px] font-normal text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500" /> Auto-Caption
                  </span>
                </button>

                {/* CTA */}
                <div className="pt-1 space-y-1.5">
                  {unitDetail.unit.status === 'Siap jual' ? (
                    <Link
                      href={`/jual?unit_id=${unitDetail.unit.id}`}
                      className="w-full py-2.5 bg-[#0c1e38] hover:bg-[#162a4a] text-white font-semibold rounded-xl flex items-center justify-center gap-1.5 text-xs shadow-xs"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      Jual Unit Ini Sekarang
                    </Link>
                  ) : (
                    <button
                      onClick={closeUnitDetail}
                      className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl text-xs"
                    >
                      Tutup
                    </button>
                  )}

                  {unitDetail.unit.status !== 'Terjual' && (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteUnit(unitDetail.unit)}
                      className="w-full py-2 px-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Produk / Salah Input</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PROMO MEDIA SOSIAL MODAL */}
      {showPromoModal && promoUnit && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-xs p-3 animate-fade-in"
          onClick={() => setShowPromoModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-3xl p-5 shadow-2xl border border-slate-200/80 dark:border-slate-800 max-h-[90vh] overflow-y-auto animate-slide-up space-y-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold text-[11px] mb-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Promosi Media Sosial</span>
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {promoUnit.tipe} {promoUnit.storage}
                </h2>
                <p className="text-[11px] text-slate-400">
                  Siap diunggah ke Instagram Feed, Facebook Marketplace & WhatsApp
                </p>
              </div>
              <button
                onClick={() => setShowPromoModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Photo Preview & Format Selector */}
            {(() => {
              const displayPhoto = getUnitDisplayPhoto(promoUnit);
              const rawUrl = displayPhoto.photo;
              const isCloud = rawUrl.includes('cloudinary.com');
              const displayUrl =
                isCloud && selectedPhotoFormat === 'watermarked'
                  ? getWatermarkedUrl(rawUrl)
                  : isCloud && selectedPhotoFormat === 'square'
                  ? getIgSquareUrl(rawUrl)
                  : rawUrl;

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                      Foto Promosi
                    </span>
                    {isCloud && (
                      <div className="flex items-center gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setSelectedPhotoFormat('watermarked')}
                          className={`px-2 py-0.5 rounded-md border ${
                            selectedPhotoFormat === 'watermarked'
                              ? 'bg-[#0c1e38] text-white border-[#0c1e38] font-medium'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          Watermark
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPhotoFormat('square')}
                          className={`px-2 py-0.5 rounded-md border ${
                            selectedPhotoFormat === 'square'
                              ? 'bg-[#0c1e38] text-white border-[#0c1e38] font-medium'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          1:1 Square
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPhotoFormat('original')}
                          className={`px-2 py-0.5 rounded-md border ${
                            selectedPhotoFormat === 'original'
                              ? 'bg-[#0c1e38] text-white border-[#0c1e38] font-medium'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          Asli
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="relative aspect-video max-h-48 w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 flex items-center justify-center">
                    <img
                      src={displayUrl}
                      alt="Promo Preview"
                      className="w-full h-full object-contain"
                    />
                    <a
                      href={displayUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/70 hover:bg-black/90 backdrop-blur-xs text-white rounded-lg text-[10px] font-medium flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Buka Foto HD
                    </a>
                  </div>
                </div>
              );
            })()}

            {/* Generated Caption Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">
                  Caption Siap Posting
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(generatePromoCaption(promoUnit))}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all ${
                    copiedCaption
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {copiedCaption ? (
                    <>
                      <Check className="w-3 h-3" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Salin Caption
                    </>
                  )}
                </button>
              </div>

              <textarea
                readOnly
                value={generatePromoCaption(promoUnit)}
                rows={7}
                className="w-full p-3 bg-slate-50 dark:bg-[#142036] border border-slate-200 dark:border-slate-700 rounded-2xl text-[11px] font-mono leading-relaxed text-slate-800 dark:text-slate-200 focus:outline-none resize-none select-all"
              />
            </div>

            {/* Quick Share Links */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-medium text-slate-400 block">
                Buka Aplikasi & Tempelkan Caption:
              </span>

              <div className="grid grid-cols-3 gap-2">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    generatePromoCaption(promoUnit)
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-2 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold rounded-xl text-center text-[11px] flex items-center justify-center gap-1 transition-all"
                >
                  WhatsApp
                </a>

                <a
                  href="https://www.instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 font-semibold rounded-xl text-center text-[11px] flex items-center justify-center gap-1 transition-all"
                >
                  Instagram
                </a>

                <a
                  href="https://www.facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="py-2 px-2 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-semibold rounded-xl text-center text-[11px] flex items-center justify-center gap-1 transition-all"
                >
                  Facebook
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX PREVIEW MODAL */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-xl max-h-[85vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewPhoto}
              alt="Preview"
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
            <div className="absolute top-3 right-3 flex items-center gap-2">
              <a
                href={previewPhoto}
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS PRODUK */}
      {confirmDeleteUnit && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => {
            if (!isDeleting) {
              setConfirmDeleteUnit(null);
              setDeleteError('');
            }
          }}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-slide-up space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Warning Icon */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800/80 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Hapus Unit dari Stok?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data unit akan dihapus permanen dari sistem.
                </p>
              </div>
            </div>

            {/* Box Ringkasan Unit */}
            <div className="bg-slate-50 dark:bg-[#142036] rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Tipe Unit:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {confirmDeleteUnit.tipe} {confirmDeleteUnit.storage}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Warna / Kondisi:</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">
                  {confirmDeleteUnit.warna || '-'} · {confirmDeleteUnit.kondisi || '-'}
                </span>
              </div>
              <div className="flex justify-between items-center font-mono">
                <span className="text-slate-500 dark:text-slate-400 font-sans">IMEI 1:</span>
                <span className="text-slate-800 dark:text-slate-200">{confirmDeleteUnit.imei}</span>
              </div>
              {confirmDeleteUnit.imei2 && (
                <div className="flex justify-between items-center font-mono">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">IMEI 2:</span>
                  <span className="text-slate-800 dark:text-slate-200">{confirmDeleteUnit.imei2}</span>
                </div>
              )}
              {isOwner && confirmDeleteUnit.harga_beli && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">Harga Beli / HPP:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatMoney(confirmDeleteUnit.harga_beli)}
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              ⚠️ <strong>Perhatian:</strong> Riwayat pembelian dan servis terkait unit ini akan ikut dibersihkan. Gunakan opsi ini jika salah memasukkan data barang atau foto.
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium">
                {deleteError}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setConfirmDeleteUnit(null);
                  setDeleteError('');
                }}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-xs transition-all disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteUnit}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Ya, Hapus Unit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StokPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat stok...</div>}>
      <StokContent />
    </Suspense>
  );
}
