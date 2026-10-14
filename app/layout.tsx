import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'JarBees: The Game - Contemplative Flight Experience',
  description: 'Fly as a bee through infinite procedural landscapes inspired by real-world locations. A REZ-inspired contemplative experience.',
  keywords: ['game', 'three.js', 'flight simulator', 'procedural', 'contemplative', 'bee', 'infinite runner'],
  authors: [{ name: 'Tu Nombre' }],
  openGraph: {
    title: 'JarBees: The Game',
    description: 'Fly as a bee through infinite procedural landscapes',
    type: 'website',
    locale: 'es_AR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JarBees: The Game',
    description: 'Fly as a bee through infinite procedural landscapes',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: '#FFD700',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/icons/jarbees_logo.png" />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
