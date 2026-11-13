'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { Expense } from '@/types';
import { formatTanggalPendek } from '@/lib/formatters';

const KATEGORI_OPTIONS: { val: Expense['kategori']; label: string }[] = [
  { val: 'listrik', label: 'Listrik & Air' },
  { val: 'sewa', label: 'Sewa Counter / Toko' },
  { val: 'iklan', label: 'Iklan & Marketing' },
  { val: 'gaji', label: 'Gaji Karyawan' },
  { val: 'operasional', label: 'Operasional & Packing' },
  { val: 'lain-lain', label: 'Lain-lain' },
];

export default function PengeluaranPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { formatMoney } = usePreferences();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [kategori, setKategori] = useState<Expense['kategori']>('operasional');
  const [jumlah, setJumlah] = useState('');
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/expenses');
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numJumlah = Number(jumlah.replace(/\D/g, '')) || 0;
    if (numJumlah <= 0) {
      setErrorMsg('Jumlah pengeluaran harus lebih dari Rp 0');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kategori,
          jumlah: numJumlah,
          catatan: catatan.trim() || null,
          pencatat_id: currentUser?.id || 1,
        }),
      });

      if (!res.ok) {
        throw new Error('Gagal mencatat pengeluaran');
      }

      setSuccessMsg('Pengeluaran berhasil dicatat!');
      setJumlah('');
      setCatatan('');
      loadExpenses();
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const totalBiaya = expenses.reduce((sum, e) => sum + e.jumlah, 0);

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
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Pengeluaran Toko</h1>
          <p className="text-[11px] text-slate-400">Catat biaya operasional toko</p>
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

      {/* Form Input */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-2xs space-y-2.5 text-xs">
        <h2 className="font-bold text-slate-900 text-xs">Catat Pengeluaran Baru</h2>

        <div>
          <label className="block text-slate-600 mb-1 font-medium">Kategori</label>
          <select
            value={kategori}
            onChange={(e) => setKategori(e.target.value as any)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium"
          >
            {KATEGORI_OPTIONS.map((k) => (
              <option key={k.val} value={k.val}>
                {k.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-600 mb-1 font-medium">Jumlah (Rp) *</label>
          <input
            type="text"
            value={jumlah}
            onChange={(e) => {
              const num = e.target.value.replace(/\D/g, '');
              setJumlah(num ? Number(num).toLocaleString('id-ID') : '');
            }}
            placeholder="150.000"
            required
            className="w-full font-mono text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900"
          />
        </div>

        <div>
          <label className="block text-slate-600 mb-1 font-medium">Keterangan</label>
          <input
            type="text"
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Contoh: Lakban & bubble wrap"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-[#0c1e38] hover:bg-[#162a4a] disabled:opacity-50 text-white font-bold rounded-xl shadow-xs text-xs"
        >
          {submitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
        </button>
      </form>

      {/* List */}
      <div className="bg-white dark:bg-[#142036] rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-xs">Riwayat Pengeluaran</h3>
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Total: {formatMoney(totalBiaya)}
          </span>
        </div>

        {loading ? (
          <p className="text-xs text-slate-400 py-6 text-center">Memuat riwayat...</p>
        ) : expenses.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">Belum ada pengeluaran tercatat.</p>
        ) : (
          <div className="space-y-1.5">
            {expenses.map((e) => (
              <div
                key={e.id}
                className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-[#101b30] flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-800 dark:text-white capitalize text-xs">
                    {e.kategori.replace('-', ' ')}
                  </div>
                  {e.catatan && <div className="text-slate-500 dark:text-slate-400 text-[10px]">{e.catatan}</div>}
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    {formatTanggalPendek(e.tanggal)} · {e.pencatat_nama || 'Tim'}
                  </div>
                </div>

                <div className="font-bold text-slate-900 dark:text-white text-xs">-{formatMoney(e.jumlah)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
