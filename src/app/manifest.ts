import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'EpicPhone - Sistem Inventory & Kasir HP',
    short_name: 'EpicPhone',
    description: 'Aplikasi manajemen stok unit iPhone second, penjualan, servis, dan laba otomatis.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0c1e38',
    theme_color: '#0c1e38',
    icons: [
      {
        src: '/images/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/images/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/images/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/images/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/images/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
