'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { Unit } from '@/types';
import { formatTanggal } from '@/lib/formatters';

function ServisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedUnitId = searchParams.get('unit_id');

  const { currentUser, role } = useAuth();
  const { formatMoney } = usePreferences();
  const isOwner = role === 'pemilik';

  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(preselectedUnitId || '');
  const [kerusakan, setKerusakan] = useState('');
  const [sparepart, setSparepart] = useState('');
  const [biaya, setBiaya] = useState('');
  const [catatan, setCatatan] = useState('');
  const [selesaikanSekarang, setSelesaikanSekarang] = useState(false);

  const [activeServices, setActiveServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [unitsRes, servRes] = await Promise.all([
        fetch('/api/units?role=pemilik'),
        fetch('/api/services'),
      ]);

      if (unitsRes.ok) {
        const uList: Unit[] = await unitsRes.json();
        setUnits(uList.filter((u) => u.status !== 'Terjual'));
      }
      if (servRes.ok) {
        const sList = await servRes.json();
        setActiveServices(sList);
      }
    } catch (err) {
      console.error('Failed to load service data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnitId) {
      setErrorMsg('Pilih unit yang akan diservis!');
      return;
    }
    if (!kerusakan.trim()) {
      setErrorMsg('Keterangan kerusakan wajib diisi!');
      return;
    }

    const numBiaya = Number(biaya.replace(/\D/g, '')) || 0;

    try {
      setSubmitting(true);
      setErrorMsg('');

      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unit_id: Number(selectedUnitId),
          kerusakan: kerusakan.trim(),
          sparepart: sparepart.trim() || null,
          biaya: numBiaya,
          teknisi_id: currentUser?.id || 1,
          catatan: catatan.trim() || null,
          selesaikan_sekarang: selesaikanSekarang,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Gagal menyimpan servis');
      }

      setSuccessMsg('Servis berhasil dicatat! Modal (HPP) unit otomatis diperbarui.');
      setKerusakan('');
      setSparepart('');
      setBiaya('');
      setCatatan('');
      loadData();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteService = async (serviceId: number) => {
    try {
      const res = await fetch('/api/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId,
          userId: currentUser?.id || 1,
        }),
      });

      if (res.ok) {
        loadData();
      }
    } catch (err) {
      console.error('Error completing service:', err);
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
          <h1 className="text-base font-bold text-slate-900 tracking-tight">Servis & Sparepart</h1>
          <p className="text-[11px] text-slate-400">Biaya servis otomatis menambah modal (HPP) unit</p>
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

      {/* Grid container: 1 col on mobile, 2 cols on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Form Input Servis */}
        <form onSubmit={handleSubmit} className="lg:col-span-5 bg-white dark:bg-[#142036] rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 shadow-2xs space-y-2.5 text-xs">
        <h2 className="font-bold text-slate-900 text-xs">Input Servis Unit</h2>

        <div>
          <label className="block text-slate-600 mb-1 font-medium">Pilih Unit HP *</label>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900 font-medium"
          >
            <option value="">-- Pilih Unit dalam Stok --</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                #{u.id} · {u.tipe} {u.storage} ({u.warna}) · [{u.status}]
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-600 mb-1 font-medium">Deskripsi Tindakan / Kerusakan *</label>
          <input
            type="text"
            value={kerusakan}
            onChange={(e) => setKerusakan(e.target.value)}
            placeholder="Ganti Baterai Health 74% / LCD garis"
            required
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-slate-600 mb-1 font-medium">Nama Sparepart</label>
            <input
              type="text"
              value={sparepart}
              onChange={(e) => setSparepart(e.target.value)}
              placeholder="Baterai Deji Apple 11"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-medium">Biaya Servis (Rp)</label>
            <input
              type="text"
              value={biaya}
              onChange={(e) => {
                const num = e.target.value.replace(/\D/g, '');
                setBiaya(num ? Number(num).toLocaleString('id-ID') : '');
              }}
              placeholder="350.000"
              className="w-full font-mono text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="finishNow"
            checked={selesaikanSekarang}
            onChange={(e) => setSelesaikanSekarang(e.target.checked)}
            className="w-4 h-4 text-slate-800 rounded"
          />
          <label htmlFor="finishNow" className="font-medium text-slate-700 cursor-pointer text-[11px]">
            Servis sudah selesai dan unit langsung <strong>Siap Jual</strong>
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-[#0c1e38] hover:bg-[#162a4a] disabled:opacity-50 text-white font-bold rounded-xl shadow-xs text-xs"
        >
          {submitting ? 'Menyimpan...' : 'Simpan Data Servis'}
        </button>
      </form>

        {/* Riwayat Servis */}
        <div className="lg:col-span-7 bg-white dark:bg-[#142036] rounded-2xl p-4 border border-slate-200/70 dark:border-slate-800 shadow-2xs space-y-2.5">
          <h3 className="font-bold text-xs text-slate-900 dark:text-white">Riwayat Servis</h3>

        {activeServices.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Belum ada riwayat servis.</p>
        ) : (
          <div className="space-y-2">
            {activeServices.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/50 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 text-xs">
                    {s.unit_tipe} {s.unit_storage}
                  </div>
                  <div className="text-slate-600 text-[11px] mt-0.5">{s.kerusakan}</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {formatTanggal(s.tanggal)} · Teknisi: {s.teknisi_nama || 'Agus'}
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white">+{formatMoney(s.biaya)}</div>
                  {s.status === 'selesai' ? (
                    <span className="inline-block text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      Selesai
                    </span>
                  ) : (
                    <button
                      onClick={() => handleCompleteService(s.id)}
                      className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md text-[10px]"
                    >
                      Tandai Selesai
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);
}

export default function ServisPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Memuat modul servis...</div>}>
      <ServisContent />
    </Suspense>
  );
}
