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
      <div className="hud-card hud-panel-top-left">
        <div className="hud-title">
          🐝 JarBees: The Game
        </div>
        <div className="hud-status">
          {isPaused ? '⏸ PAUSADO' : Math.abs(velocity) > 0.5 ? '▶ Volando' : '🌸 Suspendida'}
        </div>
        {dayNightEnabled && (
          <div className="hud-clock">
            {timeIcons[timeOfDay.timeOfDay]} {String(timeOfDay.hours).padStart(2, '0')}:{String(timeOfDay.minutes).padStart(2, '0')}
          </div>
        )}
        <button
          onClick={() => {
            const current = useGameStore.getState().audioEnabled
            useGameStore.getState().setAudioEnabled(!current)
          }}
          className="hud-audio-btn"
          style={{
            background: audioEnabled ? 'rgba(255, 215, 0, 0.15)' : 'rgba(255, 60, 60, 0.2)',
            border: `1px solid ${audioEnabled ? 'rgba(255, 215, 0, 0.5)' : 'rgba(255, 60, 60, 0.5)'}`,
            color: audioEnabled ? '#FFD700' : '#ff8888',
          }}
          title="Presiona 'M' para activar/silenciar sonido"
        >
          <span>{audioEnabled ? '🔊 ON' : '🔇 OFF'}</span>
          <span style={{ opacity: 0.6 }}>[M]</span>
        </button>
      </div>

      {/* HUD de datos de vuelo (inferior derecho en PC / superior derecho compacto en Mobile) */}
      <div className="hud-card hud-panel-flight-data">
        <div className="hud-flight-row">
          <span style={{ color: '#aaa' }}>Vel:</span>{' '}
          <strong>{(velocity * 3.6).toFixed(0)} km/h</strong>
        </div>
        <div className="hud-flight-row">
          <span style={{ color: '#aaa' }}>Dist:</span>{' '}
          <strong>{distanceTraveled.toFixed(0)} m</strong>
        </div>
        <div className="hud-flight-row">
          <span style={{ color: '#aaa' }}>Alt:</span>{' '}
          <strong>{altitude.toFixed(1)} m</strong>
        </div>
        <div className="hud-flight-fps">
          FPS: {fps}
        </div>
      </div>

      {/* HUD inferior centro - Controles (se oculta automáticamente en mobile) */}
      <div className="hud-card hud-panel-controls">
        ⬆️/W: Avanzar | ⬇️/S: Frenar | ⬅️➡️/A/D: Girar | ESPACIO: Subir | SHIFT: Bajar | ENTER: Pausa | M: Sonido
      </div>

      {/* Pantalla de pausa */}
      {isPaused && (
        <div className="hud-pause-modal">
          <div className="hud-pause-icon">⏸</div>
          <div className="hud-pause-text-title">PAUSADO</div>
          <div className="hud-pause-subtext">
            Presiona ENTER, ESC o P para continuar
          </div>
          <div className="hud-pause-audio-tip">
            🔊 Presiona 'M' para {audioEnabled ? 'silenciar' : 'activar'} sonido
          </div>
        </div>
      )}
    </>
  )
}
