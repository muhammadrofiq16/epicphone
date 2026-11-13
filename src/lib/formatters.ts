export function formatRupiah(amount: number | null | undefined, short = false, hideNumbers = false): string {
  if (hideNumbers) {
    if (short) return 'Rp •• jt';
    return 'Rp •••••••';
  }

  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';

  if (short && Math.abs(amount) >= 1_000_000) {
    const inJt = (amount / 1_000_000).toFixed(1).replace('.', ',');
    return `${inJt.endsWith(',0') ? inJt.slice(0, -2) : inJt} jt`;
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTanggal(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatTanggalPendek(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

export function hitungUmurStok(tanggalMasuk: string): number {
  if (!tanggalMasuk) return 0;
  const masuk = new Date(tanggalMasuk).getTime();
  const sekarang = Date.now();
  const diffDays = Math.floor((sekarang - masuk) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function getStatusUnitStyle(status: string) {
  switch (status) {
    case 'Siap jual':
      return {
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
        dot: 'bg-emerald-500',
        text: 'Siap Jual',
      };
    case 'Baru masuk':
      return {
        badge: 'bg-slate-100 text-slate-800 border-slate-200',
        dot: 'bg-slate-500',
        text: 'Baru Masuk',
      };
    case 'Dicek/Servis':
      return {
        badge: 'bg-amber-50 text-amber-800 border-amber-200/80',
        dot: 'bg-amber-500',
        text: 'Dicek / Servis',
      };
    case 'Booking':
      return {
        badge: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
        dot: 'bg-indigo-500',
        text: 'Booking DP',
      };
    case 'Terjual':
      return {
        badge: 'bg-slate-50 text-slate-500 border-slate-200',
        dot: 'bg-slate-400',
        text: 'Terjual',
      };
    case 'Retur':
      return {
        badge: 'bg-rose-50 text-rose-800 border-rose-200/80',
        dot: 'bg-rose-500',
        text: 'Retur',
      };
    default:
      return {
        badge: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
        text: status,
      };
  }
}
