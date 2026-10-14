'use client'

import { useGameStore } from '@/store/gameStore'
import { useEffect, useState } from 'react'
import { useDayNightCycle } from '@/hooks/useDayNightCycle'

export function GameHUD() {
  const isPaused = useGameStore((state) => state.isPaused)
  const velocity = useGameStore((state) => state.velocity)
  const distanceTraveled = useGameStore((state) => state.distanceTraveled)
  const altitude = useGameStore((state) => state.altitude)
  const position = useGameStore((state) => state.position)
  const rotation = useGameStore((state) => state.rotation)
  const currentBiome = useGameStore((state) => state.currentBiome)
  const dayNightEnabled = useGameStore((state) => state.dayNightEnabled)
  const audioEnabled = useGameStore((state) => state.audioEnabled)
  
  const [fps, setFps] = useState(60)
  const timeOfDay = useDayNightCycle(dayNightEnabled)

  // Waypoints de exploración por bioma
  const waypoints = {
    titicaca: { name: 'Santuario Isla del Sol', x: 0, z: -2500 },
    easter_island: { name: 'Cráter Rano Kau', x: 500, z: -2500 },
    constellations: { name: 'Nebulosa Sagrada', x: 0, z: -3000 },
  }
  const currentWaypoint = waypoints[currentBiome]
  
  // Distancia y orientación al hito
  const dx = currentWaypoint.x - position[0]
  const dz = currentWaypoint.z - position[2]
  const distanceToTarget = Math.round(Math.hypot(dx, dz))
  
  // Ángulo relativo hacia el hito (-Z es hacia adelante en Three.js)
  const targetAngle = Math.atan2(dx, -dz)
  let relativeAngle = targetAngle - rotation[1]
  while (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI
  while (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI

  // Indicador de flecha direccional
  let directionArrow = '▲'
  if (relativeAngle > 0.35 && relativeAngle < 2.0) {
    directionArrow = '▶'
  } else if (relativeAngle >= 2.0 || relativeAngle <= -2.0) {
    directionArrow = '▼'
  } else if (relativeAngle < -0.35 && relativeAngle > -2.0) {
    directionArrow = '◀'
  }

  // Grados de rumbo en brújula
  const headingDeg = Math.round(((-rotation[1] * (180 / Math.PI)) % 360 + 360) % 360)
  const cardinal = headingDeg >= 315 || headingDeg < 45 ? 'N' : headingDeg < 135 ? 'E' : headingDeg < 225 ? 'S' : 'O'

  // Nombres de biomas
  const biomeNames = {
    titicaca: 'Lago Titicaca',
    easter_island: 'Isla de Pascua',
    constellations: 'Constelaciones',
  }

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
      {/* Brújula y Guía de Navegación (Top Center) */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.75)',
          padding: '8px 18px',
          borderRadius: '25px',
          fontFamily: 'monospace',
          color: '#FFD700',
          fontSize: '0.85rem',
          pointerEvents: 'none',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 215, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRight: '1px solid rgba(255, 215, 0, 0.3)', paddingRight: '10px' }}>
          <span style={{ fontSize: '1rem' }}>🧭</span>
          <strong>{cardinal}</strong>
          <span style={{ color: '#aaa', fontSize: '0.75rem' }}>{headingDeg}°</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: Math.abs(relativeAngle) <= 0.35 ? '#4ade80' : '#FFD700', fontSize: '1.1rem', fontWeight: 'bold' }}>
            {directionArrow}
          </span>
          <div>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>{currentWaypoint.name}</span>
            <span style={{ color: '#FFD700', marginLeft: '6px', fontSize: '0.8rem' }}>
              ({(distanceToTarget / 1000).toFixed(1)} km)
            </span>
          </div>
        </div>
      </div>

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
        <button
          onClick={() => {
            const biomes: Array<'titicaca' | 'easter_island' | 'constellations'> = ['titicaca', 'easter_island', 'constellations']
            const currentIndex = biomes.indexOf(currentBiome)
            const next = biomes[(currentIndex + 1) % biomes.length]
            useGameStore.getState().setBiome(next)
          }}
          style={{
            pointerEvents: 'auto',
            background: 'none',
            border: 'none',
            color: '#FFD700',
            fontSize: '0.85rem',
            fontFamily: 'monospace',
            padding: 0,
            marginBottom: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            textAlign: 'left',
          }}
          title="Click o presiona 'B' para cambiar de bioma"
        >
          <span>🌎 {biomeNames[currentBiome]}</span>
          <span style={{ fontSize: '0.7rem', color: '#888' }}>[B]</span>
        </button>
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

      {/* Coordenadas de debug (opcional) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '10px',
            borderRadius: '5px',
            fontFamily: 'monospace',
            color: '#666',
            fontSize: '0.7rem',
            pointerEvents: 'none',
          }}
        >
          <div>X: {position[0].toFixed(2)}</div>
          <div>Y: {position[1].toFixed(2)}</div>
          <div>Z: {position[2].toFixed(2)}</div>
        </div>
      )}
    </>
  )
}
