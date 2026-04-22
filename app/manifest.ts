import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Il nostro diario',
    short_name: 'Il nostro diario',
    description: 'Il diario digitale di Nico & Angie',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#fff1f2',
    theme_color: '#f43f5e',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
