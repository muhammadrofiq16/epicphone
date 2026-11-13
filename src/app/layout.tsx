import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { PreferencesProvider } from '@/context/PreferencesContext';
import AppShell from '@/components/layout/AppShell';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'EpicPhone - Sistem Inventory & Keuangan HP Second',
  description: 'Aplikasi manajemen stok unit iPhone second, penjualan, servis, dan laba otomatis.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-900 font-sans antialiased">
        <AuthProvider>
          <PreferencesProvider>
            <AppShell>{children}</AppShell>
          </PreferencesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
