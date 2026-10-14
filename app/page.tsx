'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function HomePage() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Animación de fade in
    setTimeout(() => setIsLoaded(true), 100)
  }, [])

  const startGame = () => {
    router.push('/game')
  }

  const openDonate = () => {
    router.push('/donate')
  }

  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      color: '#fff',
      textAlign: 'center',
      padding: '20px',
      opacity: isLoaded ? 1 : 0,
      transition: 'opacity 0.8s ease-in',
    }}>
      <div style={{
        maxWidth: '600px',
        animation: 'float 3s ease-in-out infinite',
      }}>
        {/* Logo placeholder */}
        <div style={{
          fontSize: '80px',
          marginBottom: '20px',
          filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))',
        }}>
          🐝
        </div>

        <h1 style={{
          fontSize: '3rem',
          marginBottom: '10px',
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
          marginBottom: '40px',
          fontStyle: 'italic',
        }}>
          The Game
        </p>

        <p style={{
          fontSize: '1rem',
          color: '#ccc',
          marginBottom: '40px',
          lineHeight: '1.6',
        }}>
          Vuela como una abeja a través de paisajes infinitos inspirados en lugares reales.<br />
          Una experiencia contemplativa sin disparos, solo exploración.
        </p>

        <div style={{
          display: 'flex',
          gap: '20px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <button
            onClick={startGame}
            style={{
              padding: '15px 40px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: '#000',
              background: 'linear-gradient(135deg, #FFD700, #FFA500)',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 215, 0, 0.6)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.4)'
            }}
          >
            ▶ Jugar Ahora
          </button>

          <button
            onClick={openDonate}
            style={{
              padding: '15px 40px',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: '#FFD700',
              background: 'transparent',
              border: '2px solid #FFD700',
              borderRadius: '50px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 215, 0, 0.1)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            ☕ Apoyar Proyecto
          </button>
        </div>

        <div style={{
          marginTop: '60px',
          fontSize: '0.9rem',
          color: '#777',
        }}>
          <p>Controles: ⬆️⬇️⬅️➡️ o WASD</p>
          <p style={{ marginTop: '10px' }}>
            Inspirado por REZ • Road Rash 3 • Journey
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </main>
  )
}
