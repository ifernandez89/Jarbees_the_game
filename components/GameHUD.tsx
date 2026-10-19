'use client'

import { useGameStore } from '@/store/gameStore'
import { useEffect, useState } from 'react'
import { useDayNightCycle } from '@/hooks/useDayNightCycle'
import { CHARACTER_PROFILES } from '@/types/characters'

export function GameHUD() {
  const isPaused = useGameStore((state) => state.isPaused)
  const velocity = useGameStore((state) => state.velocity)
  const distanceTraveled = useGameStore((state) => state.distanceTraveled)
  const altitude = useGameStore((state) => state.altitude)
  const dayNightEnabled = useGameStore((state) => state.dayNightEnabled)
  const audioEnabled = useGameStore((state) => state.audioEnabled)

  const selectedCharacter = useGameStore((state) => state.selectedCharacter)
  const setSelectedCharacter = useGameStore((state) => state.setSelectedCharacter)
  const isIronManFlipped = useGameStore((state) => state.isIronManFlipped)

  const [fps, setFps] = useState(60)
  const timeOfDay = useDayNightCycle(dayNightEnabled)

  const currentProfile = CHARACTER_PROFILES[selectedCharacter] || CHARACTER_PROFILES.bee
  const allCharacters = Object.values(CHARACTER_PROFILES)

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
      {/* Barra superior de Selección de Personaje */}
      <div className="hud-character-bar">
        {allCharacters.map((char) => {
          const isActive = char.id === selectedCharacter
          return (
            <button
              key={char.id}
              onClick={() => setSelectedCharacter(char.id)}
              className={`hud-char-btn ${isActive ? 'hud-char-btn-active' : ''}`}
              style={{
                background: isActive ? `${char.badgeColor}33` : 'transparent',
                borderColor: isActive ? char.badgeColor : 'transparent',
                color: isActive ? '#ffffff' : '#d1d5db',
              }}
              title={`${char.name} (${char.realMetrics.heightOrLength})`}
            >
              <span className="hud-char-icon">{char.icon}</span>
              <span className="hud-char-label">{char.id === 'iron_man' ? 'Vesper' : char.name.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>

      {/* HUD superior izquierdo */}
      <div className="hud-card hud-panel-top-left">
        <div className="hud-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{currentProfile.icon}</span>
          <span>{currentProfile.name}</span>
        </div>
        <div style={{ fontSize: '0.68rem', color: currentProfile.badgeColor, marginBottom: 2 }}>
          {currentProfile.title} • {currentProfile.realMetrics.heightOrLength}
        </div>
        <div className="hud-status">
          {isPaused
            ? '⏸ PAUSADO'
            : selectedCharacter === 'iron_man' && isIronManFlipped
            ? Math.abs(velocity) > 0.5
              ? '🔄 Supersónico Boca Arriba (Cielo)'
              : '🔄 Mirando al Usuario'
            : Math.abs(velocity) > 0.5
            ? '▶ Volando'
            : '🌸 Suspendido'}
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

      {/* HUD de datos de vuelo */}
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

      {/* HUD inferior centro - Controles */}
      <div className="hud-card hud-panel-controls">
        ⬆️/W: Avanzar | ⬇️/S: Frenar | ⬅️➡️/A/D: Girar | ESPACIO: Subir | SHIFT: Bajar{selectedCharacter === 'iron_man' ? ' | 🔄 Clic en Vesper / T: Invertir Vista' : ''} | ENTER: Pausa | M: Sonido
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
