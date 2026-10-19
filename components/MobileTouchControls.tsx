'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { isTouchScreen } from '@/utils/mobileDetect'

export function MobileTouchControls() {
  const [showControls, setShowControls] = useState(false)
  const setControls = useGameStore((state) => state.setControls)
  const isPaused = useGameStore((state) => state.isPaused)
  const setPaused = useGameStore((state) => state.setPaused)
  const audioEnabled = useGameStore((state) => state.audioEnabled)
  const setAudioEnabled = useGameStore((state) => state.setAudioEnabled)
  const selectedCharacter = useGameStore((state) => state.selectedCharacter)
  const flightMode = useGameStore((state) => state.flightMode)
  const toggleFlightMode = useGameStore((state) => state.toggleFlightMode)
  const isIronManFlipped = useGameStore((state) => state.isIronManFlipped)
  const toggleIronManFlip = useGameStore((state) => state.toggleIronManFlip)

  useEffect(() => {
    setShowControls(isTouchScreen())

    const handleResize = () => {
      setShowControls(isTouchScreen())
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  if (!showControls) return null

  // Helpers de touch para activar/desactivar controles
  const handleTouchStart = (key: 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down' | 'boost') => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!isPaused) {
      setControls({ [key]: true })
    }
  }

  const handleTouchEnd = (key: 'forward' | 'backward' | 'left' | 'right' | 'up' | 'down' | 'boost') => (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    setControls({ [key]: false })
  }

  const btnStyle: React.CSSProperties = {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    background: 'rgba(0, 0, 0, 0.65)',
    border: '2px solid rgba(255, 215, 0, 0.5)',
    color: '#FFD700',
    fontSize: '1.4rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    touchAction: 'none',
    backdropFilter: 'blur(8px)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
    cursor: 'pointer',
    transition: 'transform 0.1s ease, background 0.1s ease',
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      {/* Barra superior móvil de controles rápidos */}
      <div
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          display: 'flex',
          gap: '8px',
          pointerEvents: 'auto',
        }}
      >
        {selectedCharacter === 'iron_man' && (
          <button
            onClick={toggleFlightMode}
            style={{
              ...btnStyle,
              width: '38px',
              height: '38px',
              fontSize: '0.8rem',
              borderColor: flightMode === 'sim' ? '#C084FC' : '#38BDF8',
              color: flightMode === 'sim' ? '#E9D5FF' : '#BAE6FD',
            }}
            aria-label="Modo de Vuelo Asistido o Simulación"
            title={`Modo: ${flightMode === 'sim' ? 'Simulación Inercial' : 'Vuelo Asistido'}`}
          >
            {flightMode === 'sim' ? '🕹️' : '🛡️'}
          </button>
        )}

        <button
          onClick={() => setAudioEnabled(!audioEnabled)}
          style={{
            ...btnStyle,
            width: '38px',
            height: '38px',
            fontSize: '0.95rem',
          }}
          aria-label="Silenciar sonido"
        >
          {audioEnabled ? '🔊' : '🔇'}
        </button>

        <button
          onClick={() => setPaused(!isPaused)}
          style={{
            ...btnStyle,
            width: '38px',
            height: '38px',
            fontSize: '0.95rem',
          }}
          aria-label="Pausa"
        >
          {isPaused ? '▶' : '⏸'}
        </button>
      </div>

      {/* D-Pad de Vuelo (Avanzar, Frenar, Izquierda, Derecha) - Esquina inferior izquierda */}
      <div
        style={{
          position: 'absolute',
          bottom: '25px',
          left: '20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 54px)',
          gridTemplateRows: 'repeat(3, 54px)',
          gap: '6px',
          pointerEvents: 'auto',
        }}
      >
        <div />
        {/* AVANZAR */}
        <button
          style={btnStyle}
          onTouchStart={handleTouchStart('forward')}
          onTouchEnd={handleTouchEnd('forward')}
          onTouchCancel={handleTouchEnd('forward')}
          onMouseDown={handleTouchStart('forward')}
          onMouseUp={handleTouchEnd('forward')}
          aria-label="Avanzar"
        >
          ▲
        </button>
        <div />

        {/* GIRAR IZQUIERDA */}
        <button
          style={btnStyle}
          onTouchStart={handleTouchStart('left')}
          onTouchEnd={handleTouchEnd('left')}
          onTouchCancel={handleTouchEnd('left')}
          onMouseDown={handleTouchStart('left')}
          onMouseUp={handleTouchEnd('left')}
          aria-label="Girar izquierda"
        >
          ◀
        </button>
        {/* CENTRO: Invertir orientación para la armadura */}
        {selectedCharacter === 'iron_man' ? (
          <button
            onClick={toggleIronManFlip}
            style={{
              ...btnStyle,
              fontSize: '1.05rem',
              borderColor: isIronManFlipped ? '#38BDF8' : 'rgba(255, 215, 0, 0.5)',
              background: isIronManFlipped ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0, 0, 0, 0.65)',
            }}
            aria-label="Invertir orientación"
            title="Invertir orientación"
          >
            🔄
          </button>
        ) : (
          <div />
        )}
        {/* GIRAR DERECHA */}
        <button
          style={btnStyle}
          onTouchStart={handleTouchStart('right')}
          onTouchEnd={handleTouchEnd('right')}
          onTouchCancel={handleTouchEnd('right')}
          onMouseDown={handleTouchStart('right')}
          onMouseUp={handleTouchEnd('right')}
          aria-label="Girar derecha"
        >
          ▶
        </button>

        <div />
        {/* FRENAR */}
        <button
          style={btnStyle}
          onTouchStart={handleTouchStart('backward')}
          onTouchEnd={handleTouchEnd('backward')}
          onTouchCancel={handleTouchEnd('backward')}
          onMouseDown={handleTouchStart('backward')}
          onMouseUp={handleTouchEnd('backward')}
          aria-label="Frenar"
        >
          ▼
        </button>
        <div />
      </div>

      {/* Control de Altitud (Subir / Bajar / Turbo) - Esquina inferior derecha */}
      <div
        style={{
          position: 'absolute',
          bottom: '30px',
          right: '25px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          pointerEvents: 'auto',
        }}
      >
        {/* TURBO / POSTQUEMADOR (Sólo Armadura JarBees) */}
        {selectedCharacter === 'iron_man' && (
          <button
            style={{
              ...btnStyle,
              width: '60px',
              height: '60px',
              fontSize: '0.78rem',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, rgba(255, 100, 20, 0.85), rgba(255, 30, 0, 0.95))',
              borderColor: '#FF7733',
              color: '#FFFFFF',
              boxShadow: '0 0 16px rgba(255, 100, 20, 0.6)',
            }}
            onTouchStart={handleTouchStart('boost')}
            onTouchEnd={handleTouchEnd('boost')}
            onTouchCancel={handleTouchEnd('boost')}
            onMouseDown={handleTouchStart('boost')}
            onMouseUp={handleTouchEnd('boost')}
            aria-label="Postquemador Turbo"
          >
            ⚡TURBO
          </button>
        )}
        <button
          style={{
            ...btnStyle,
            width: '60px',
            height: '60px',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}
          onTouchStart={handleTouchStart('up')}
          onTouchEnd={handleTouchEnd('up')}
          onTouchCancel={handleTouchEnd('up')}
          onMouseDown={handleTouchStart('up')}
          onMouseUp={handleTouchEnd('up')}
          aria-label="Subir"
        >
          SUBIR
        </button>
        <button
          style={{
            ...btnStyle,
            width: '60px',
            height: '60px',
            fontSize: '1rem',
            fontWeight: 'bold',
          }}
          onTouchStart={handleTouchStart('down')}
          onTouchEnd={handleTouchEnd('down')}
          onTouchCancel={handleTouchEnd('down')}
          onMouseDown={handleTouchStart('down')}
          onMouseUp={handleTouchEnd('down')}
          aria-label="Bajar"
        >
          BAJAR
        </button>
      </div>
    </div>
  )
}
