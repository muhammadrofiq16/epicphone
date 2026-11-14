'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Save,
  Upload,
  RotateCcw,
  Loader2,
  Image as ImageIcon,
  Store,
  Sliders,
  Sparkles,
  Lock,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { StoreSettings } from '@/types';

export default function PengaturanPage() {
  const router = useRouter();
  const { role, currentUser } = useAuth();
  const { updateLogoUrl } = usePreferences();
  const isOwner = role === 'pemilik';

  const [settings, setSettings] = useState<StoreSettings>({
    batas_stok_mengendap: 30,
    batas_margin_min: 200000,
    nama_toko: 'EpicPhone Store',
    alamat_toko: '',
    telepon_toko: '',
    pesan_nota_wa: '',
    logo_url: '/images/logo.svg',
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State Ganti Kata Sandi
  const [sandiLama, setSandiLama] = useState('');
  const [sandiBaru, setSandiBaru] = useState('');
  const [sandiKonfirmasi, setSandiKonfirmasi] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Ukuran file logo maksimal 5 MB');
      return;
    }

    try {
      setUploadingLogo(true);
      setErrorMsg('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('slot', 'logo');
      formData.append('unitTipe', settings.nama_toko || 'toko');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal mengunggah logo');
      }

      const data = await res.json();
      const newLogoUrl = data.url || data.localUrl;

      // Update local state and immediately apply to header/sidebar
      setSettings((prev) => ({ ...prev, logo_url: newLogoUrl }));
      updateLogoUrl(newLogoUrl);

      setSuccessMsg('Logo toko berhasil diunggah!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat mengunggah logo');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleResetLogo = () => {
    const defaultLogo = '/images/logo.svg';
    setSettings((prev) => ({ ...prev, logo_url: defaultLogo }));
    updateLogoUrl(defaultLogo);
    setSuccessMsg('Logo dikembalikan ke logo bawaan EpicPhone');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      setErrorMsg('Hanya pemilik yang dapat mengubah pengaturan sistem');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) {
        throw new Error('Gagal memperbarui pengaturan');
      }

      if (settings.logo_url) {
        updateLogoUrl(settings.logo_url);
      }

      setSuccessMsg('Pengaturan dan logo toko berhasil disimpan!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMsg('');

    if (!currentUser?.id) {
      setPasswordError('Sesi pengguna tidak valid');
      return;
    }

    if (!sandiLama) {
      setPasswordError('Kata sandi lama wajib diisi');
      return;
    }

    if (!sandiBaru || sandiBaru.length < 4) {
      setPasswordError('Kata sandi baru minimal 4 karakter');
      return;
    }

    if (sandiBaru !== sandiKonfirmasi) {
      setPasswordError('Konfirmasi kata sandi baru tidak cocok');
      return;
    }

    try {
      setSubmittingPassword(true);
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          oldPassword: sandiLama,
          newPassword: sandiBaru,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengubah kata sandi');
      }

      setPasswordMsg('Kata sandi berhasil diperbarui! Gunakan sandi baru ini saat login.');
      setSandiLama('');
      setSandiBaru('');
      setSandiKonfirmasi('');
      setTimeout(() => setPasswordMsg(''), 4000);
    } catch (err: any) {
      setPasswordError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmittingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-full bg-white dark:bg-[#142036] border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            Pengaturan Sistem
          </h1>
          <p className="text-[11px] text-slate-400 dark:text-slate-400">
            Kelola logo toko, identitas bisnis, dan aturan operasional
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Memuat konfigurasi...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* SECTION 1: LOGO & IDENTITAS VISUAL TOKO */}
          <div className="bg-white dark:bg-[#142036] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Logo Toko</span>
                </h2>
                <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-0.5">
                  Ganti logo toko yang tampil di pojok kiri atas aplikasi, bilah navigasi, dan nota.
                </p>
              </div>
              <span className="text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-900/80 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-blue-500" /> Branding
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              {/* Preview Box */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border-2 border-dashed border-slate-300 dark:border-slate-700 p-2 flex items-center justify-center overflow-hidden shadow-2xs transition-all">
                  <img
                    src={settings.logo_url || '/images/logo.svg'}
                    alt="Logo Toko"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('/images/logo.svg')) {
                        target.src = '/images/logo.svg';
                      }
                    }}
                  />
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white text-[10px] gap-1">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Mengunggah...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons & Guidance */}
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
                    onChange={handleLogoFileChange}
                    className="hidden"
                    disabled={!isOwner || uploadingLogo}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isOwner || uploadingLogo}
                    className="px-3.5 py-2 bg-[#0c1e38] hover:bg-[#162a4a] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50 active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingLogo ? 'Mengunggah...' : 'Pilih & Ganti Logo'}</span>
                  </button>

                  {settings.logo_url && settings.logo_url !== '/images/logo.svg' && (
                    <button
                      type="button"
                      onClick={handleResetLogo}
                      disabled={!isOwner || uploadingLogo}
                      className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95"
                      title="Kembalikan ke logo bawaan EpicPhone"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Gunakan Default</span>
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                  Format gambar yang didukung: <strong>PNG (transparan)</strong>, <strong>JPG</strong>, <strong>WebP</strong>, atau <strong>SVG</strong>. Rasio persegi (1:1), maksimal 5 MB.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 2: IDENTITAS TOKO & NOTA */}
          <div className="bg-white dark:bg-[#142036] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Identitas Toko & Nota WhatsApp</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">Nama Toko</label>
                <input
                  type="text"
                  value={settings.nama_toko}
                  onChange={(e) => setSettings({ ...settings, nama_toko: e.target.value })}
                  disabled={!isOwner}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">No. WhatsApp Toko</label>
                <input
                  type="tel"
                  value={settings.telepon_toko || ''}
                  onChange={(e) => setSettings({ ...settings, telepon_toko: e.target.value })}
                  disabled={!isOwner}
                  placeholder="081298765432"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">Alamat Toko</label>
              <input
                type="text"
                value={settings.alamat_toko || ''}
                onChange={(e) => setSettings({ ...settings, alamat_toko: e.target.value })}
                disabled={!isOwner}
                placeholder="Mall ITC Roxy Mas Lt. 2, Jakarta Pusat"
                className="w-full px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">Pesan Penutup Nota WA</label>
              <textarea
                rows={2}
                value={settings.pesan_nota_wa || ''}
                onChange={(e) => setSettings({ ...settings, pesan_nota_wa: e.target.value })}
                disabled={!isOwner}
                placeholder="Terima kasih atas kepercayaan Anda berbelanja di EpicPhone!"
                className="w-full px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-blue-500"
              />
            </div>
          </div>

          {/* SECTION 3: PARAMETER OPERASIONAL */}
          <div className="bg-white dark:bg-[#142036] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <h2 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
              <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Parameter Operasional & Peringatan</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">
                  Batas Stok Mengendap (Hari)
                </label>
                <input
                  type="number"
                  min={7}
                  max={180}
                  value={settings.batas_stok_mengendap}
                  onChange={(e) =>
                    setSettings({ ...settings, batas_stok_mengendap: Number(e.target.value) })
                  }
                  disabled={!isOwner}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Unit Siap Jual yang melewati hari ini akan ditandai kuning/merah di dashboard.
                </p>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium">
                  Batas Margin Minimum (Rp)
                </label>
                <input
                  type="number"
                  step={50000}
                  value={settings.batas_margin_min}
                  onChange={(e) =>
                    setSettings({ ...settings, batas_margin_min: Number(e.target.value) })
                  }
                  disabled={!isOwner}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold font-mono text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Peringatan otomatis muncul di kasir penjualan jika laba di bawah nilai ini.
                </p>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          {isOwner && (
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || uploadingLogo}
                className="w-full py-3 bg-[#0c1e38] hover:bg-[#162a4a] dark:bg-blue-600 dark:hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-2xl shadow-xs text-xs sm:text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{submitting ? 'Menyimpan Pengaturan...' : 'Simpan Semua Pengaturan'}</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* SECTION 4: KEAMANAN & KATA SANDI AKUN */}
      {!loading && (
        <div className="bg-white dark:bg-[#142036] rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-500" />
              <span>Keamanan Akun & Ganti Kata Sandi</span>
            </h2>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              Akun: {currentUser?.username || 'user'}
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Ubah kata sandi akun Anda untuk menjaga keamanan akses sistem toko dan data rahasia HPP/laba.
          </p>

          {passwordError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{passwordMsg}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium text-xs">
                  Kata Sandi Lama <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={sandiLama}
                  onChange={(e) => setSandiLama(e.target.value)}
                  placeholder="Kata sandi saat ini"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium text-xs">
                  Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={sandiBaru}
                  onChange={(e) => setSandiBaru(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  required
                  minLength={4}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 mb-1 font-medium text-xs">
                  Konfirmasi Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={sandiKonfirmasi}
                  onChange={(e) => setSandiKonfirmasi(e.target.value)}
                  placeholder="Ulangi sandi baru"
                  required
                  minLength={4}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={submittingPassword}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {submittingPassword ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memperbarui Sandi...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Perbarui Kata Sandi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
