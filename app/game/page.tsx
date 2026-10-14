'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

// Importar escena dinámicamente para evitar SSR issues
const GameScene = dynamic(() => import('@/components/GameScene'), {
  ssr: false,
  loading: () => (
    <div className="loading-screen">
      <div className="loading-spinner"></div>
      <p>PREPARANDO EXPERIENCIA DE VUELO...</p>
      <p style={{ fontSize: '0.8rem', marginTop: '20px', color: '#888' }}>
        Cargando modelo de abeja, terreno y cielo...
      </p>
    </div>
  )
})

export default function GamePage() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Pequeño delay para asegurar que todo esté listo
    setTimeout(() => setIsReady(true), 500)
  }, [])

  return (
    <main style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {isReady && <GameScene />}
    </main>
  )
}
