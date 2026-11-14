'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  DollarSign,
  Settings,
  ChevronRight,
  UserCheck,
  ShieldCheck,
  Users,
  X,
  Store,
  Sun,
  Eye,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';

export default function MenuPage() {
  const { currentUser, role, users, switchUser, logout } = useAuth();
  const { isDarkMode, hideNumbers, toggleDarkMode, toggleHideNumbers } = usePreferences();
  const isOwner = role === 'pemilik';
  const [showRoleModal, setShowRoleModal] = useState(false);

  const menuSections = [
    {
      title: 'Keuangan & Pembukuan',
      items: [
        {
          label: 'Laporan Laba & Keuangan',
          desc: 'Laba kotor, laba bersih, omzet & ranking tipe',
          href: '/laporan',
          icon: FileText,
          badge: isOwner ? 'Khusus Pemilik' : 'Terkunci',
        },
        {
          label: 'Pengeluaran Toko',
          desc: 'Catat sewa counter, listrik, iklan, gaji',
          href: '/pengeluaran',
          icon: DollarSign,
        },
      ],
    },
    {
      title: 'Sistem & Pengaturan',
      items: [
        {
          label: 'Pengaturan Sistem',
          desc: 'Batas stok mengendap, batas margin, data toko',
          href: '/pengaturan',
          icon: Settings,
          badge: isOwner ? undefined : 'Khusus Pemilik',
        },
      ],
    },
  ];

  return (
    <div className="space-y-3 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-base font-bold text-slate-900 tracking-tight">Menu & Pengaturan</h1>
        <p className="text-[11px] text-slate-400">Pengaturan toko dan akun sistem</p>
      </div>

      {/* Profile Card - Completely Clean & Uniform */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0c1e38] text-white flex items-center justify-center font-bold text-sm shadow-xs">
            {currentUser?.nama?.charAt(0) || 'P'}
          </div>
          <div>
            <h2 className="font-bold text-xs text-slate-900">{currentUser?.nama || 'Pengguna'}</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
                {role === 'pemilik' ? 'Pemilik' : 'Karyawan'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">@{currentUser?.username}</span>
            </div>
          </div>
        </div>

        {/* Quick Role Switcher button */}
        <button
          onClick={() => setShowRoleModal(true)}
          className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition-all flex items-center gap-1"
        >
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span>Ganti Peran</span>
        </button>
      </div>

      {/* Menu Sections - Uniform Slate Icons */}
      {menuSections.map((section, idx) => (
        <div key={idx} className="space-y-1.5">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
            {section.title}
          </h3>

          <div className="bg-white rounded-2xl border border-slate-200/70 divide-y divide-slate-100 shadow-2xs overflow-hidden">
            {section.items.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link
                  key={i}
                  href={item.href}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-center shrink-0 text-slate-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 group-hover:text-slate-700 transition-colors">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-500 border border-slate-200/60">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Tampilan & Preferensi */}
      <div className="space-y-1.5">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
          Tampilan & Preferensi
        </h3>
        <div className="bg-white dark:bg-[#142036] rounded-2xl border border-slate-200/70 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-2 shadow-2xs">
          <label className="flex items-center justify-between cursor-pointer pt-0.5">
            <div className="flex items-center gap-2.5">
              <Sun className="w-4 h-4 text-slate-500 dark:text-amber-400" />
              <div>
                <span className="font-bold text-xs text-slate-900 dark:text-white block leading-tight">
                  Tema gelap
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-400">
                  Nyaman untuk ruangan redup
                </span>
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
      {showRoleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setShowRoleModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-200/80 space-y-3.5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Ganti Akun & Peran</h3>
                <p className="text-[11px] text-slate-400">Pilih akses akun sistem</p>
              </div>
              <button
                onClick={() => setShowRoleModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
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
                    : 'Mencatat penjualan, barang masuk & servis; modal & laba disembunyikan';

                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setShowRoleModal(false);
                    }}
                    className={`w-full text-left p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-[#0c1e38] bg-slate-50 shadow-2xs ring-1 ring-[#0c1e38]'
                        : 'border-slate-200/70 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">{u.nama}</span>
                      <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
                        {u.peran === 'pemilik' ? 'Pemilik' : 'Karyawan'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">{desc}</p>
                  </button>
                );
              })}
            </div>

            {/* Logout Button in Modal */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowRoleModal(false);
                  logout();
                }}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar dari Akun (Logout)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Logout Button */}
      <button
        type="button"
        onClick={() => logout()}
        className="w-full py-3 px-4 rounded-2xl font-bold text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/50 flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Keluar dari Sistem (Logout)</span>
      </button>

      {/* Footer System Info */}
      <div className="p-3 rounded-2xl bg-white border border-slate-200/70 text-center text-xs text-slate-400 space-y-0.5">
        <p className="font-semibold text-slate-600 text-xs">EpicPhone Manager</p>
        <p className="text-[10px]">Sistem Inventory & Keuangan HP Second (Pemilik & Karyawan)</p>
      </div>
    </div>
  );
}
