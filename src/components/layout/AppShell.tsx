'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Package,
  Plus,
  History,
  Menu as MenuIcon,
  ShieldCheck,
  Wrench,
  DollarSign,
  X,
  Search,
  Eye,
  EyeOff,
  Bell,
  FileText,
  CreditCard,
  Receipt,
  TrendingUp,
  Users,
  Tag,
  Settings,
  Sun,
  Moon,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, role, users, switchUser } = useAuth();
  const { isDarkMode, hideNumbers, toggleDarkMode, toggleHideNumbers, logoUrl } = usePreferences();
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showQuickAction, setShowQuickAction] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);

  // Bottom navigation items for mobile
  const mobileNavItems = [
    { label: 'Beranda', href: '/', icon: Home },
    { label: 'Stok', href: '/stok', icon: Package },
    { label: 'Aksi', isCenter: true },
    { label: 'Riwayat', href: '/riwayat', icon: History },
    { label: 'Menu', isMenu: true, icon: MenuIcon },
  ];

  // Desktop sidebar navigation links
  const desktopSidebarLinks = [
    { label: 'Beranda', href: '/', icon: Home },
    { label: 'Stok Unit', href: '/stok', icon: Package },
    { label: 'Penjualan', href: '/jual', icon: Receipt },
    { label: 'Barang Masuk', href: '/barang-masuk', icon: FileText },
    { label: 'Servis HP', href: '/servis', icon: Wrench },
    { label: 'Riwayat Transaksi', href: '/riwayat', icon: History },
    { label: 'Biaya Operasional', href: '/pengeluaran', icon: DollarSign },
    { label: 'Laporan Keuangan', href: '/laporan', icon: TrendingUp },
    { label: 'Pengaturan Toko', href: '/pengaturan', icon: Settings },
  ];

  const getRoleLabel = () => {
    return role === 'pemilik' ? 'Pemilik' : 'Karyawan';
  };

  const getPageTitle = () => {
    switch (pathname) {
      case '/':
        return 'Beranda';
      case '/stok':
        return 'Stok Unit';
      case '/jual':
        return 'Kasir Penjualan';
      case '/barang-masuk':
        return 'Input Barang Masuk';
      case '/servis':
        return 'Layanan Servis';
      case '/riwayat':
        return 'Riwayat Transaksi';
      case '/pengeluaran':
        return 'Biaya Operasional';
      case '/laporan':
        return 'Laporan & Analitik';
      case '/pengaturan':
        return 'Pengaturan Sistem';
      default:
        return pathname.replace('/', '').toUpperCase();
    }
  };

  return (
    <div
      className={`min-h-screen bg-[#f8fafc] dark:bg-[#070b13] flex flex-col lg:flex-row text-slate-900 dark:text-slate-100 antialiased selection:bg-slate-800 selection:text-white transition-colors duration-200 ${
        isDarkMode ? 'dark' : ''
      }`}
    >
      {/* ============================================================ */}
      {/* DESKTOP SIDEBAR (Visible on lg: >= 1024px screens) */}
      {/* ============================================================ */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 bg-white dark:bg-[#0c1424] border-r border-slate-200/80 dark:border-slate-800/80 shrink-0 sticky top-0 h-screen z-30 select-none shadow-xs justify-between">
        <div className="flex flex-col h-full overflow-y-auto p-4 xl:p-5">
          {/* Brand Logo & Role Pill */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800/80">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl overflow-hidden shadow-xs shrink-0 flex items-center justify-center transition-transform group-hover:scale-105">
                <img
                  src={logoUrl || '/images/logo.svg'}
                  alt="EpicPhone Logo"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.includes('/images/logo.svg')) {
                      target.src = '/images/logo.svg';
                    }
                  }}
                />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-[#0c1e38] dark:text-white block leading-none">
                  EpicPhone
                </span>
                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  Store & POS
                </span>
              </div>
            </Link>

            <button
              onClick={() => setShowRoleModal(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition-all"
              title="Ganti Peran Pengguna"
            >
              <ShieldCheck className="w-3 h-3 text-slate-500 dark:text-slate-400" />
              <span>{getRoleLabel()}</span>
            </button>
          </div>

          {/* Quick Action Button for Desktop */}
          <div className="py-4">
            <button
              onClick={() => setShowQuickAction(true)}
              className="w-full py-2.5 px-3 bg-[#0c1e38] hover:bg-[#162a4a] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Transaksi Baru</span>
            </button>
          </div>

          {/* Main Navigation Links */}
          <nav className="space-y-1 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1">
              Menu Utama
            </div>
            {desktopSidebarLinks.map((item, idx) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={idx}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 dark:bg-blue-600 text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#142036] hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Preferences Card in Sidebar */}
          <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
            <div className="bg-slate-50 dark:bg-[#142036] rounded-2xl p-2.5 border border-slate-200/70 dark:border-slate-800/70 space-y-1.5 text-xs">
              <button
                onClick={() => toggleDarkMode()}
                className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors text-slate-700 dark:text-slate-300"
              >
                <div className="flex items-center gap-2 text-[11px]">
                  {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{isDarkMode ? 'Mode Terang' : 'Mode Gelap'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {isDarkMode ? 'Gelap' : 'Terang'}
                </span>
              </button>

              <button
                onClick={() => toggleHideNumbers()}
                className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors text-slate-700 dark:text-slate-300"
              >
                <div className="flex items-center gap-2 text-[11px]">
                  {hideNumbers ? <EyeOff className="w-3.5 h-3.5 text-blue-500" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                  <span>Sembunyikan Angka</span>
                </div>
                <span className={`text-[10px] font-mono ${hideNumbers ? 'text-blue-500 font-semibold' : 'text-slate-400'}`}>
                  {hideNumbers ? 'Aktif' : 'Off'}
                </span>
              </button>
            </div>

            {/* User Profile Info */}
            <div
              onClick={() => setShowRoleModal(true)}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-[#142036] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#0c1e38] dark:bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser?.nama?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {currentUser?.nama || 'Pengguna'}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {role}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">Ganti</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* MAIN CONTENT AREA (Fluid & Responsive) */}
      {/* ============================================================ */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen bg-[#f8fafc] dark:bg-[#090d16]">
        {/* Desktop Header Topbar (Hidden on mobile) */}
        <header className="hidden lg:flex sticky top-0 z-20 h-15 bg-white/90 dark:bg-[#0c1424]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-6 xl:px-8 items-center justify-between transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg overflow-hidden shadow-2xs shrink-0 flex items-center justify-center">
              <img
                src={logoUrl || '/images/logo.svg'}
                alt="EpicPhone Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('/images/logo.svg')) {
                    target.src = '/images/logo.svg';
                  }
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {getPageTitle()}
              </h1>
              <span className="text-xs text-slate-300 dark:text-slate-700">|</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Sistem Manajemen EpicPhone Store
              </span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/stok"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#142036] hover:bg-slate-200/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Cari Stok Unit / IMEI</span>
            </Link>

            <button
              onClick={() => toggleDarkMode()}
              className="p-2 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-amber-300 rounded-xl transition-colors"
              title={isDarkMode ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => toggleHideNumbers()}
              className="p-2 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-blue-400 rounded-xl transition-colors"
              title={hideNumbers ? 'Tampilkan angka' : 'Sembunyikan angka'}
            >
              {hideNumbers ? <EyeOff className="w-4 h-4 text-blue-500" /> : <Eye className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowRoleModal(true)}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#0c1e38] dark:bg-blue-600 text-white hover:bg-[#162a4a] dark:hover:bg-blue-500 transition-all shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{getRoleLabel()}</span>
            </button>
          </div>
        </header>

        {/* Mobile Header Topbar (Hidden on desktop) */}
        <header className="lg:hidden sticky top-0 z-40 bg-white/95 dark:bg-[#0c1424]/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 px-4 py-2.5 flex items-center justify-between transition-colors duration-200">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg overflow-hidden shadow-2xs shrink-0 flex items-center justify-center">
              <img
                src={logoUrl || '/images/logo.svg'}
                alt="EpicPhone Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('/images/logo.svg')) {
                    target.src = '/images/logo.svg';
                  }
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm tracking-tight text-[#0c1e38] dark:text-white leading-none">
                EpicPhone
              </span>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                {pathname === '/' ? 'Beranda' : pathname.replace('/', '').toUpperCase()}
              </span>
            </div>
          </Link>

          {/* Header Action Icons */}
          <div className="flex items-center gap-1.5">
            <Link
              href="/stok"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors rounded-lg"
              title="Cari Stok"
            >
              <Search className="w-4 h-4" />
            </Link>

            {/* Quick Toggle: Dark Mode */}
            <button
              onClick={() => toggleDarkMode()}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-amber-300 transition-colors rounded-lg"
              title={isDarkMode ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Quick Toggle: Sembunyikan Angka */}
            <button
              onClick={() => toggleHideNumbers()}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-blue-400 transition-colors rounded-lg"
              title={hideNumbers ? 'Tampilkan angka' : 'Sembunyikan angka'}
            >
              {hideNumbers ? <EyeOff className="w-4 h-4 text-blue-500" /> : <Eye className="w-4 h-4" />}
            </button>

            {/* Role switch pill */}
            <button
              onClick={() => setShowRoleModal(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition-all"
              title="Ganti Peran (Pemilik / Karyawan)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>{getRoleLabel()}</span>
            </button>
          </div>
        </header>

        {/* Main Content Viewport */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-3.5 sm:p-5 lg:p-6 xl:p-8 pb-24 lg:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (Hidden on desktop) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 w-full bg-white/95 dark:bg-[#0c1424]/95 backdrop-blur-md border-t border-slate-200/70 dark:border-slate-800 px-4 py-1.5 flex items-center justify-around z-40 shadow-sm transition-colors duration-200">
          {mobileNavItems.map((item, idx) => {
            if (item.isCenter) {
              return (
                <button
                  key={idx}
                  onClick={() => setShowQuickAction(true)}
                  className="-mt-5 w-12 h-12 rounded-full bg-[#0c1e38] dark:bg-blue-600 hover:bg-[#162a4a] dark:hover:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-slate-900/20 active:scale-95 transition-all ring-4 ring-[#f8fafc] dark:ring-[#0c1424]"
                  aria-label="Aksi Cepat"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </button>
              );
            }

            if (item.isMenu) {
              return (
                <button
                  key={idx}
                  onClick={() => setShowMenuModal(true)}
                  className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-xs transition-colors ${
                    showMenuModal
                      ? 'text-[#0c1e38] dark:text-blue-400 font-bold'
                      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
                  }`}
                >
                  <MenuIcon className={`w-5 h-5 ${showMenuModal ? 'stroke-[2.2]' : 'stroke-[1.6]'}`} />
                  <span className="text-[10px] mt-0.5">Menu</span>
                </button>
              );
            }

            const Icon = item.icon!;
            const isActive = pathname === item.href;

            return (
              <Link
                key={idx}
                href={item.href!}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg text-xs transition-colors ${
                  isActive
                    ? 'text-[#0c1e38] dark:text-blue-400 font-bold'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.6]'}`} />
                <span className="text-[10px] mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ============================================================ */}
      {/* MODALS (Quick Action, Menu, Role Switch) */}
      {/* ============================================================ */}

      {/* Modal: Transaksi Baru (+) */}
      {showQuickAction && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-xs p-3 transition-opacity animate-fade-in"
          onClick={() => setShowQuickAction(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-3xl p-5 shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3 md:hidden" />

            <div className="flex items-start justify-between mb-3.5">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Transaksi baru</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400">Pilih yang ingin dicatat</p>
              </div>
              <button
                onClick={() => setShowQuickAction(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <Link
                href="/jual"
                onClick={() => setShowQuickAction(false)}
                className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#142036] hover:bg-slate-50 dark:hover:bg-[#192843] transition-all flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block group-hover:text-slate-800 dark:group-hover:text-slate-200">
                    Penjualan baru
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-400 block mt-0.5">
                    Jual HP atau aksesoris, tambah bonus, cetak nota
                  </span>
                </div>
              </Link>

              <Link
                href="/barang-masuk"
                onClick={() => setShowQuickAction(false)}
                className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#142036] hover:bg-slate-50 dark:hover:bg-[#192843] transition-all flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/80 dark:border-blue-800/60 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block group-hover:text-slate-800 dark:group-hover:text-slate-200">
                    Barang masuk
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-400 block mt-0.5">
                    Beli HP dari supplier atau beli putus dari pelanggan
                  </span>
                </div>
              </Link>

              <Link
                href="/servis"
                onClick={() => setShowQuickAction(false)}
                className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#142036] hover:bg-slate-50 dark:hover:bg-[#192843] transition-all flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block group-hover:text-slate-800 dark:group-hover:text-slate-200">
                    Terima servis
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-400 block mt-0.5">
                    Servis HP toko atau HP milik pelanggan
                  </span>
                </div>
              </Link>

              <Link
                href="/riwayat"
                onClick={() => setShowQuickAction(false)}
                className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#142036] hover:bg-slate-50 dark:hover:bg-[#192843] transition-all flex items-center gap-3.5 group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 stroke-[1.8]" />
                </div>
                <div>
                  <span className="font-bold text-xs text-slate-900 dark:text-white block group-hover:text-slate-800 dark:group-hover:text-slate-200">
                    Terima pembayaran
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-400 block mt-0.5">
                    Pelanggan setor cicilan atau melunasi piutang
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Menu Popup */}
      {showMenuModal && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-xs p-3 transition-opacity animate-fade-in"
          onClick={() => setShowMenuModal(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#0f172a] rounded-3xl p-5 shadow-2xl border border-slate-200/80 dark:border-slate-800 animate-slide-up max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle Bar */}
            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-3 md:hidden" />

            {/* Header */}
            <div className="flex items-start justify-between mb-3.5">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Menu</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400">Semua halaman</p>
              </div>
              <button
                onClick={() => setShowMenuModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Grid of 8 Cards (2 columns x 4 rows) */}
            <div className="grid grid-cols-2 gap-2.5 mb-3.5">
              <Link
                href="/servis"
                onClick={() => setShowMenuModal(false)}
                className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#142036] hover:bg-slate-50/80 dark:hover:bg-[#192843] transition-all flex flex-col items-start text-left"
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-2.5">
                  <Wrench className="w-4 h-4 stroke-[1.8]" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">Servis</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">HP toko dan HP pelanggan</span>
              </Link>

              <Link
                href="/riwayat"
                onClick={() => setShowMenuModal(false)}
                className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#142036] hover:bg-slate-50/80 dark:hover:bg-[#192843] transition-all flex flex-col items-start text-left"
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-2.5">
                  <ShieldCheck className="w-4 h-4 stroke-[1.8]" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">Garansi dan Retur</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">Cek garansi, klaim, retur</span>
              </Link>

              <Link
                href="/riwayat"
                onClick={() => setShowMenuModal(false)}
                className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#142036] hover:bg-slate-50/80 dark:hover:bg-[#192843] transition-all flex flex-col items-start text-left"
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-2.5">
                  <Receipt className="w-4 h-4 stroke-[1.8]" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">Tagihan</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">Piutang dan hutang</span>
              </Link>

              <Link
                href="/pengeluaran"
                onClick={() => setShowMenuModal(false)}
                className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#142036] hover:bg-slate-50/80 dark:hover:bg-[#192843] transition-all flex flex-col items-start text-left"
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-2.5">
                  <DollarSign className="w-4 h-4 stroke-[1.8]" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">Biaya Operasional</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">Sewa, listrik, gaji, dll</span>
              </Link>

              <Link
                href="/laporan"
                onClick={() => setShowMenuModal(false)}
                className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#142036] hover:bg-slate-50/80 dark:hover:bg-[#192843] transition-all flex flex-col items-start text-left"
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-2.5">
                  <TrendingUp className="w-4 h-4 stroke-[1.8]" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">Laporan</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">Laba, arus kas, stok</span>
              </Link>

              <Link
                href="/riwayat"
                onClick={() => setShowMenuModal(false)}
                className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#142036] hover:bg-slate-50/80 dark:hover:bg-[#192843] transition-all flex flex-col items-start text-left"
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-2.5">
                  <Users className="w-4 h-4 stroke-[1.8]" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">Kontak</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">Pelanggan dan supplier</span>
              </Link>

              <Link
                href="/barang-masuk"
                onClick={() => setShowMenuModal(false)}
                className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#142036] hover:bg-slate-50/80 dark:hover:bg-[#192843] transition-all flex flex-col items-start text-left"
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-2.5">
                  <Tag className="w-4 h-4 stroke-[1.8]" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">Katalog Produk</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">Model dan harga acuan</span>
              </Link>

              <Link
                href="/pengaturan"
                onClick={() => setShowMenuModal(false)}
                className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-[#142036] hover:bg-slate-50/80 dark:hover:bg-[#192843] transition-all flex flex-col items-start text-left"
              >
                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-2.5">
                  <Settings className="w-4 h-4 stroke-[1.8]" />
                </div>
                <span className="font-bold text-xs text-slate-900 dark:text-white">Pengaturan</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400 mt-0.5">Toko, nota, backup</span>
              </Link>
            </div>

            {/* Bottom Toggle Card: Tema Gelap & Sembunyikan Angka */}
            <div className="bg-white dark:bg-[#142036] rounded-2xl border border-slate-200/70 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-2">
              <label className="flex items-center justify-between cursor-pointer pt-0.5">
                <div className="flex items-center gap-2.5">
                  <Sun className="w-4 h-4 text-slate-500 dark:text-amber-400" />
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block leading-tight">
                      Tema gelap
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400">Nyaman untuk ruangan redup</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isDarkMode}
                  onChange={(e) => toggleDarkMode(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-slate-900 dark:accent-blue-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-2">
                <div className="flex items-center gap-2.5">
                  <Eye className="w-4 h-4 text-slate-500 dark:text-blue-400" />
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block leading-tight">
                      Sembunyikan angka
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400">
                      Samarkan modal, laba, dan omzet
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={hideNumbers}
                  onChange={(e) => toggleHideNumbers(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-slate-900 dark:accent-blue-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ganti Akun & Peran */}
      {showRoleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
          onClick={() => setShowRoleModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-[#0f172a] rounded-3xl p-5 shadow-2xl border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Ganti Peran Pengguna</h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400">Pilih akses akun sistem</p>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2">
              {users.map((u) => {
                const isSelected = currentUser?.id === u.id;
                const desc =
                  u.peran === 'pemilik'
                    ? 'Melihat semua data, modal (HPP), laba unit & laporan usaha'
                    : 'Mencatat penjualan, barang masuk & servis; modal/laba disembunyikan';

                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setShowRoleModal(false);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-[#0c1e38] dark:border-blue-500 bg-slate-50 dark:bg-blue-950/40 text-slate-900 dark:text-white font-bold ring-1 ring-[#0c1e38] dark:ring-blue-500'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-[#142036] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{u.nama}</span>
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {u.peran === 'pemilik' ? 'Pemilik' : 'Karyawan'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
