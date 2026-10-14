import type { Metadata, Viewport } from 'next'
import './globals.css'
import { RegisterSW } from '@/components/RegisterSW'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FFD700',
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://ifernandez89.github.io/Jarbees_the_game'),
  title: 'JarBees: The Game - Contemplative Flight Experience',
  description: 'Vuela como una abeja a través de paisajes infinitos. Una experiencia de vuelo libre y contemplativa.',
  keywords: ['game', 'three.js', 'flight simulator', 'procedural', 'contemplative', 'bee', 'infinite runner', 'pwa'],
  authors: [{ name: 'JarBees Team' }],
  manifest: './manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'JarBees Game',
  },
  icons: {
    icon: [
      { url: './favicon.ico', sizes: 'any' },
      { url: './icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: './icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: './icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'JarBees: The Game',
    description: 'Vuela como una abeja a través de paisajes infinitos',
    type: 'website',
    locale: 'es_AR',
    images: ['./icons/jarbees_game_logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JarBees: The Game',
    description: 'Vuela como una abeja a través de paisajes infinitos',
    images: ['./icons/jarbees_game_logo.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="./manifest.json" />
        <link rel="apple-touch-icon" href="./icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <RegisterSW />
        {children}
      </body>
    </html>
  )
}
