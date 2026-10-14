'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getAssetPath } from '@/utils/assetPath'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function HomePage() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    setTimeout(() => setIsLoaded(true), 100)

    // Escuchar evento de instalación PWA
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const startGame = () => {
    router.push('/game')
  }

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setCanInstall(false)
    }
    setDeferredPrompt(null)
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0e1124 0%, #070913 100%)',
      color: '#fff',
      textAlign: 'center',
      padding: '20px',
      opacity: isLoaded ? 1 : 0,
      transition: 'opacity 0.8s ease-in',
    }}>
      <div style={{
        maxWidth: '600px',
        animation: 'float 3.5s ease-in-out infinite',
      }}>
        {/* Logo oficial para móvil y web de JarBees: The Game */}
        <div style={{ marginBottom: '22px' }}>
          <img
            src={getAssetPath('/icons/jarbees_game_logo.png')}
            alt="JarBees: The Game Logo"
            style={{
              width: '135px',
              height: '135px',
              borderRadius: '30px',
              boxShadow: '0 10px 30px rgba(255, 215, 0, 0.35), 0 0 50px rgba(59, 130, 246, 0.25)',
              border: '2px solid rgba(255, 215, 0, 0.3)',
              objectFit: 'cover',
            }}
          />
        </div>

        <h1 style={{
          fontSize: '3rem',
          marginBottom: '6px',
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #FFD700, #FFA500)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          JarBees
        </h1>
        
        <p style={{
          fontSize: '1.2rem',
          color: '#aaa',
          marginBottom: '30px',
          fontStyle: 'italic',
        }}>
          The Game
        </p>

        <p style={{
          fontSize: '1rem',
          color: '#ccc',
          marginBottom: '35px',
          lineHeight: '1.6',
        }}>
          Vuela como una abeja a través de paisajes infinitos.<br />
          Una experiencia de vuelo libre, contemplativa y relajante.
        </p>

        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={startGame}
            style={{
              padding: '15px 42px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: '#000',
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              boxShadow: '0 4px 18px rgba(255, 215, 0, 0.45)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(255, 215, 0, 0.65)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 18px rgba(255, 215, 0, 0.45)'
            }}
          >
            ▶ Jugar Ahora
          </button>

          {canInstall && (
            <button
              onClick={handleInstallClick}
              style={{
                padding: '15px 32px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: '#FFD700',
                background: 'rgba(255, 215, 0, 0.1)',
                border: '2px solid #FFD700',
                borderRadius: '50px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              📲 Instalar App (PWA)
            </button>
          )}
        </div>

        <div style={{
          marginTop: '50px',
          fontSize: '0.85rem',
          color: '#777',
        }}>
          <p>Controles: ⬆️⬇️⬅️➡️ o WASD | Táctil en dispositivos móviles</p>
          <p style={{ marginTop: '8px' }}>
            Inspirado por REZ • Journey • Simulación Contemplativa
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }
      `}</style>
    </main>
  )
}
