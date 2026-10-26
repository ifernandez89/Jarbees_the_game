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
    <main className="home-container" style={{ opacity: isLoaded ? 1 : 0 }}>
      <div className="home-content">
        {/* Logo oficial para móvil y web de JarBees: The Game */}
        <div className="logo-wrapper">
          <img
            src={getAssetPath('/icons/jarbees_game_logo.png')}
            alt="JarBees: The Game Logo"
            className="home-logo"
          />
        </div>

        <h1 className="home-title">
          JarBees
        </h1>
        
        <p className="home-subtitle">
          The Game
        </p>

        <p className="home-description">
          Vuela como una abeja a través de paisajes infinitos.<br />
          Una experiencia de vuelo libre, contemplativa y relajante.
        </p>

        <div className="button-group">
          <button
            onClick={startGame}
            className="btn-play"
          >
            ▶ Jugar Ahora
          </button>

          <button
            onClick={() => router.push('/lab')}
            className="btn-lab"
          >
            🔬 Object Lab 3D
          </button>

          {canInstall && (
            <button
              onClick={handleInstallClick}
              className="btn-install"
            >
              📲 Instalar App (PWA)
            </button>
          )}
        </div>

        <div className="home-footer">
          <p>Controles: ⬆️⬇️⬅️➡️ o WASD | Táctil en dispositivos móviles</p>
          <p style={{ marginTop: '6px' }}>
            Inspirado por REZ • Journey • Simulación Contemplativa
          </p>
        </div>
      </div>

      <style jsx>{`
        .home-container {
          min-height: 100vh;
          min-height: 100dvh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justifyContent: center;
          background: linear-gradient(135deg, #0e1124 0%, #070913 100%);
          color: #fff;
          text-align: center;
          padding: 24px 16px 50px 16px;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          transition: opacity 0.8s ease-in;
          box-sizing: border-box;
        }

        .home-content {
          max-width: 600px;
          width: 100%;
          margin: auto 0;
          animation: float 3.5s ease-in-out infinite;
        }

        .logo-wrapper {
          margin-bottom: 18px;
        }

        .home-logo {
          width: 130px;
          height: 130px;
          border-radius: 28px;
          box-shadow: 0 10px 30px rgba(255, 215, 0, 0.35), 0 0 50px rgba(59, 130, 246, 0.25);
          border: 2px solid rgba(255, 215, 0, 0.3);
          object-fit: cover;
        }

        .home-title {
          font-size: 3rem;
          margin-bottom: 4px;
          font-weight: bold;
          background: linear-gradient(45deg, #FFD700, #FFA500);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .home-subtitle {
          font-size: 1.15rem;
          color: #aaa;
          margin-bottom: 24px;
          font-style: italic;
        }

        .home-description {
          font-size: 0.98rem;
          color: #ccc;
          margin-bottom: 28px;
          line-height: 1.5;
        }

        .button-group {
          display: flex;
          gap: 14px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-play {
          padding: 15px 42px;
          font-size: 1.2rem;
          font-weight: bold;
          color: #000;
          background: linear-gradient(135deg, #FFD700, #FFA500);
          border: none;
          border-radius: 50px;
          cursor: pointer;
          box-shadow: 0 4px 18px rgba(255, 215, 0, 0.45);
          transition: all 0.3s ease;
          touch-action: manipulation;
        }

        .btn-play:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(255, 215, 0, 0.65);
        }

        .btn-lab {
          padding: 15px 32px;
          font-size: 1.1rem;
          font-weight: bold;
          color: #38bdf8;
          background: rgba(56, 189, 248, 0.12);
          border: 2px solid #0284c7;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          touch-action: manipulation;
          box-shadow: 0 4px 18px rgba(2, 132, 199, 0.25);
        }

        .btn-lab:hover {
          background: rgba(56, 189, 248, 0.25);
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(2, 132, 199, 0.5);
        }

        .btn-install {
          padding: 15px 32px;
          font-size: 1.1rem;
          font-weight: bold;
          color: #FFD700;
          background: rgba(255, 215, 0, 0.1);
          border: 2px solid #FFD700;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          touch-action: manipulation;
        }

        .btn-install:hover {
          background: rgba(255, 215, 0, 0.2);
          transform: translateY(-2px);
        }

        .home-footer {
          margin-top: 36px;
          font-size: 0.82rem;
          color: #777;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        /* En celulares y pantallas de altura reducida: layout amigable y botón accesible */
        @media (max-width: 600px), (max-height: 750px) {
          .home-container {
            justify-content: flex-start;
            padding: 18px 16px 55px 16px;
          }

          .home-content {
            margin: 0 auto;
          }

          .logo-wrapper {
            margin-bottom: 12px;
          }

          .home-logo {
            width: 95px;
            height: 95px;
            border-radius: 20px;
          }

          .home-title {
            font-size: 2.2rem;
            margin-bottom: 2px;
          }

          .home-subtitle {
            font-size: 0.95rem;
            margin-bottom: 12px;
          }

          .home-description {
            font-size: 0.86rem;
            margin-bottom: 18px;
            line-height: 1.4;
          }

          .btn-play {
            padding: 13px 34px;
            font-size: 1.05rem;
          }

          .btn-install {
            padding: 12px 24px;
            font-size: 0.95rem;
          }

          .home-footer {
            margin-top: 22px;
            font-size: 0.74rem;
          }
        }
      `}</style>
    </main>
  )
}
