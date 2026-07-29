import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/lib/hooks/useAuth';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Llocal Games',
    template: '%s | Llocal Games',
  },
  description:
    'Fun educational games for curious kids — trivia, writing, puzzles, and debates',
  keywords: ['educational games', 'kids learning', 'trivia games', 'brain games', 'education'],
  authors: [{ name: 'Llocal Games' }],
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a365d',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream-100 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
