import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cartlo — rodzinna lista zakupow',
    short_name: 'Cartlo',
    description: 'Rodzinna lista zakupow, ktora dziala w czasie rzeczywistym.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafaf8',
    theme_color: '#4ade80',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
