'use client'

import { useGameStore } from '@/store/gameStore'
import { useEffect, useState } from 'react'
import { useDayNightCycle } from '@/hooks/useDayNightCycle'

export function GameHUD() {
  const isPaused = useGameStore((state) => state.isPaused)
  const velocity = useGameStore((state) => state.velocity)
  const distanceTraveled = useGameStore((state) => state.distanceTraveled)
  const altitude = useGameStore((state) => state.altitude)
  const dayNightEnabled = useGameStore((state) => state.dayNightEnabled)
  const audioEnabled = useGameStore((state) => state.audioEnabled)
  
  const [fps, setFps] = useState(60)
  const timeOfDay = useDayNightCycle(dayNightEnabled)

  // Íconos según hora del día
  const timeIcons = {
    dawn: '🌅',
    day: '☀️',
    dusk: '🌇',
    night: '🌙',
  }

  // Calcular FPS
  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()

    const measureFPS = () => {
      frameCount++
      const currentTime = performance.now()
      
      if (currentTime >= lastTime + 1000) {
        setFps(frameCount)
        frameCount = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(measureFPS)
    }

    const animationId = requestAnimationFrame(measureFPS)
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <>
      {/* HUD superior izquierdo */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '15px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          color: '#FFD700',
          fontSize: '0.9rem',
          pointerEvents: 'none',
          backdropFilter: 'blur(5px)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          🐝 JarBees: The Game
        </div>
        <div style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '5px' }}>
          {isPaused ? '⏸ PAUSADO' : '▶ Volando'}
        </div>
        {dayNightEnabled && (
          <div style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '8px' }}>
            {timeIcons[timeOfDay.timeOfDay]} {String(timeOfDay.hours).padStart(2, '0')}:{String(timeOfDay.minutes).padStart(2, '0')}
          </div>
        )}
        <button
          onClick={() => {
            const current = useGameStore.getState().audioEnabled
            useGameStore.getState().setAudioEnabled(!current)
          }}
          style={{
            pointerEvents: 'auto',
            background: audioEnabled ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 60, 60, 0.2)',
            border: `1px solid ${audioEnabled ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 60, 60, 0.5)'}`,
            borderRadius: '4px',
            color: audioEnabled ? '#FFD700' : '#ff8888',
            padding: '3px 8px',
            fontSize: '0.75rem',
            fontFamily: 'monospace',
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="Presiona 'M' para activar/silenciar sonido"
        >
          <span>{audioEnabled ? '🔊 Sonido: ON' : '🔇 Sonido: OFF'}</span>
          <span style={{ opacity: 0.6 }}>[M]</span>
        </button>
      </div>

      {/* HUD inferior derecho - Datos de vuelo */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '15px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          color: '#FFD700',
          fontSize: '0.9rem',
          textAlign: 'right',
          pointerEvents: 'none',
          backdropFilter: 'blur(5px)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          minWidth: '200px',
        }}
      >
        <div style={{ marginBottom: '5px' }}>
          <span style={{ color: '#aaa' }}>Velocidad:</span>{' '}
          <strong>{(velocity * 3.6).toFixed(0)} km/h</strong>
        </div>
        <div style={{ marginBottom: '5px' }}>
          <span style={{ color: '#aaa' }}>Distancia:</span>{' '}
          <strong>{distanceTraveled.toFixed(0)} m</strong>
        </div>
        <div style={{ marginBottom: '5px' }}>
          <span style={{ color: '#aaa' }}>Altitud:</span>{' '}
          <strong>{altitude.toFixed(1)} m</strong>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '8px' }}>
          FPS: {fps}
        </div>
      </div>

      {/* HUD inferior centro - Controles */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '12px 20px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          color: '#aaa',
          fontSize: '0.8rem',
          textAlign: 'center',
          pointerEvents: 'none',
          backdropFilter: 'blur(5px)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
        }}
      >
        ⬆️/W: Avanzar | ⬇️/S: Frenar | ⬅️➡️/A/D: Girar | ESPACIO: Subir | SHIFT: Bajar | ENTER: Pausa | M: Sonido
      </div>

      {/* Pantalla de pausa */}
      {isPaused && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.9)',
            padding: '40px 60px',
            borderRadius: '15px',
            fontFamily: 'monospace',
            color: '#FFD700',
            fontSize: '2rem',
            textAlign: 'center',
            pointerEvents: 'none',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 215, 0, 0.5)',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '20px' }}>⏸</div>
          <div style={{ marginBottom: '15px' }}>PAUSADO</div>
          <div style={{ fontSize: '1rem', color: '#aaa', marginBottom: '10px' }}>
            Presiona ENTER, ESC o P para continuar
          </div>
          <div style={{ fontSize: '0.85rem', color: '#FFD700' }}>
            🔊 Presiona 'M' para {audioEnabled ? 'silenciar' : 'activar'} sonido
          </div>
        </div>
      )}
    </>
  )
}
