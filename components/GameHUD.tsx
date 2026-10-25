'use client'

import { useGameStore, CS_MAPS, type CSMapId } from '@/store/gameStore'
import { useEffect, useState } from 'react'
import { useDayNightCycle } from '@/hooks/useDayNightCycle'
import { CHARACTER_PROFILES } from '@/types/characters'
import { useIsLocal } from '@/utils/environment'

export function GameHUD() {
  const isLocal = useIsLocal()
  const isPaused = useGameStore((state) => state.isPaused)
  const velocity = useGameStore((state) => state.velocity)
  const distanceTraveled = useGameStore((state) => state.distanceTraveled)
  const altitude = useGameStore((state) => state.altitude)
  const dayNightEnabled = useGameStore((state) => state.dayNightEnabled)
  const audioEnabled = useGameStore((state) => state.audioEnabled)
  const currentBiome = useGameStore((state) => state.currentBiome)

  const selectedCharacter = useGameStore((state) => state.selectedCharacter)
  const setSelectedCharacter = useGameStore((state) => state.setSelectedCharacter)
  const isIronManFlipped = useGameStore((state) => state.isIronManFlipped)
  const flight = useGameStore((state) => state.flight)
  const flightMode = useGameStore((state) => state.flightMode)
  const toggleFlightMode = useGameStore((state) => state.toggleFlightMode)
  const isGrounded = useGameStore((state) => state.isGrounded)
  const triggerEmote = useGameStore((state) => state.triggerEmote)
  const isPhaseVeilActive = useGameStore((state) => state.isPhaseVeilActive)
  const togglePhaseVeil = useGameStore((state) => state.togglePhaseVeil)
  const isHoloMapActive = useGameStore((state) => state.isHoloMapActive)
  const toggleHoloMap = useGameStore((state) => state.toggleHoloMap)
  const activeWorldScenario = useGameStore((state) => state.activeWorldScenario)
  const toggleWorldScenario = useGameStore((state) => state.toggleWorldScenario)
  const setWorldScenario = useGameStore((state) => state.setWorldScenario)
  const activeCsMap = useGameStore((state) => state.activeCsMap || 'cs_assault')
  const setCsMap = useGameStore((state) => state.setCsMap)
  const cycleCsMap = useGameStore((state) => state.cycleCsMap)

  const [fps, setFps] = useState(60)
  const [showTactical, setShowTactical] = useState(false)
  const [isMapGridOpen, setIsMapGridOpen] = useState(false)
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
              <span className="hud-char-label">{char.id === 'iron_man' ? 'NEXO-01' : char.name.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>

      {/* HUD superior izquierdo: Panel compacto y simplificado */}
      <div className="hud-card hud-panel-top-left">
        {/* Cabecera compacta: Icono + Nombre + Reloj */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
          <div className="hud-title" style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 0 }}>
            <span>{currentProfile.icon}</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentProfile.name}</span>
          </div>
          {dayNightEnabled && (
            <div className="hud-clock" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
              {timeIcons[timeOfDay.timeOfDay]} {String(timeOfDay.hours).padStart(2, '0')}:{String(timeOfDay.minutes).padStart(2, '0')}
            </div>
          )}
        </div>

        {/* Subcabecera: Estado de movimiento + Estatura */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.66rem', color: '#94a3b8', marginBottom: 5 }}>
          <span className="hud-status" style={{ marginBottom: 0 }}>
            {isPaused
              ? '⏸ PAUSADO'
              : selectedCharacter === 'iron_man' && isIronManFlipped
              ? Math.abs(velocity) > 0.5
                ? '🔄 Boca Arriba'
                : '🔄 Mirando Usuario'
              : selectedCharacter === 'iron_man' && isGrounded
              ? Math.abs(velocity) > 0.3
                ? '🚶 Caminando'
                : '🧍 En Tierra'
              : Math.abs(velocity) > 0.5
              ? '▶ Volando'
              : '🌸 Suspendido'}
          </span>
          <span className="hud-desktop-only" style={{ color: currentProfile.badgeColor, opacity: 0.85, fontSize: '0.64rem' }}>
            {currentProfile.realMetrics.heightOrLength}
          </span>
        </div>

        {/* Fila de Micro-acciones rápidas (Audio + Base Antártida) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 5 }}>
          <button
            type="button"
            onClick={() => {
              const current = useGameStore.getState().audioEnabled
              useGameStore.getState().setAudioEnabled(!current)
            }}
            className="hud-micro-btn"
            style={{
              background: audioEnabled ? 'rgba(255, 215, 0, 0.12)' : 'rgba(255, 60, 60, 0.15)',
              border: `1px solid ${audioEnabled ? 'rgba(255, 215, 0, 0.45)' : 'rgba(255, 60, 60, 0.45)'}`,
              color: audioEnabled ? '#FFD700' : '#ff8888',
            }}
            title="Presiona 'U' para activar/silenciar sonido"
          >
            <span>{audioEnabled ? '🔊 ON' : '🔇 OFF'}</span>
            <span style={{ opacity: 0.6, fontSize: '0.6rem' }}>[U]</span>
          </button>

          <button
            type="button"
            onClick={() => useGameStore.getState().setPosition([0, 2.0, 0])}
            className="hud-micro-btn"
            style={{
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.5)',
              color: '#38BDF8',
            }}
            title="Base de Auren · Antártida Polar (Valle de Taylor) [B]"
          >
            <span>❄️ Antártida</span>
            <span style={{ opacity: 0.6, fontSize: '0.6rem' }}>[B]</span>
          </button>
        </div>

        {/* Panel de Mapas Simplificado y Compacto */}
        {isLocal && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: 3, pointerEvents: 'auto' }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Barra principal compacta de selector de mapa */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {/* Dropdown nativo/estilizado de mapa */}
              <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                <select
                  value={activeWorldScenario === 'sanctuary_infinite' ? 'sanctuary' : activeCsMap}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val === 'sanctuary') {
                      setWorldScenario('sanctuary_infinite')
                    } else {
                      setCsMap(val as CSMapId)
                    }
                  }}
                  className="hud-map-dropdown"
                  title="Cambiar mapa o escenario [Y]"
                >
                  <option value="sanctuary">🏰 Mansión Auren</option>
                  <optgroup label="── 🌐 COMUNIDAD ──">
                    {Object.values(CS_MAPS).filter((m) => m.isCommunity).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label.split(' ')[0]} {m.name}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="── 🏢 CLÁSICOS CS 1.6 ──">
                    {Object.values(CS_MAPS).filter((m) => !m.isCommunity).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label.split(' ')[0]} {m.name}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Botón rápido ciclar mapa [M] */}
              <button
                type="button"
                onClick={() => cycleCsMap()}
                className="hud-map-quick-btn"
                title="Siguiente mapa satélite [M]"
                style={{
                  background: 'rgba(249, 115, 22, 0.2)',
                  border: '1px solid rgba(249, 115, 22, 0.5)',
                  color: '#FDBA74',
                }}
              >
                [M] ❯
              </button>

              {/* Botón expandir/colapsar catálogo completo */}
              <button
                type="button"
                onClick={() => setIsMapGridOpen(!isMapGridOpen)}
                className="hud-map-quick-btn"
                title={isMapGridOpen ? 'Cerrar catálogo' : 'Ver todos los mapas (cuadrícula)'}
                style={{
                  background: isMapGridOpen ? 'rgba(56, 189, 248, 0.35)' : 'rgba(15, 23, 42, 0.85)',
                  border: `1px solid ${isMapGridOpen ? '#38BDF8' : 'rgba(255, 255, 255, 0.2)'}`,
                  color: isMapGridOpen ? '#38BDF8' : '#94A3B8',
                }}
              >
                {isMapGridOpen ? '▲' : '⊞'}
              </button>
            </div>

            {/* Catálogo en cuadrícula opcional (colapsado por defecto) */}
            {isMapGridOpen && (
              <div className="hud-map-grid-popover">
                <button
                  type="button"
                  onClick={() => {
                    setWorldScenario('sanctuary_infinite')
                    setIsMapGridOpen(false)
                  }}
                  className="hud-map-grid-btn"
                  style={{
                    width: '100%',
                    marginBottom: 3,
                    background: activeWorldScenario === 'sanctuary_infinite' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(15, 23, 42, 0.85)',
                    border: `1px solid ${activeWorldScenario === 'sanctuary_infinite' ? '#EAB308' : 'rgba(255, 255, 255, 0.15)'}`,
                    color: activeWorldScenario === 'sanctuary_infinite' ? '#FEF08A' : '#E2E8F0',
                    fontWeight: activeWorldScenario === 'sanctuary_infinite' ? 'bold' : 'normal',
                  }}
                >
                  <span>🏰 Mansión Auren [Y]</span>
                  {activeWorldScenario === 'sanctuary_infinite' && <span style={{ color: '#EAB308' }}>●</span>}
                </button>

                <div style={{ fontSize: '0.58rem', color: '#38BDF8', fontWeight: 'bold', margin: '2px 0 1px', letterSpacing: '0.03em' }}>
                  🌐 COMUNIDAD
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  {Object.values(CS_MAPS).filter((m) => m.isCommunity).map((m) => {
                    const isSelected = activeWorldScenario === 'cs_assault' && m.id === activeCsMap
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCsMap(m.id)
                          setIsMapGridOpen(false)
                        }}
                        className="hud-map-grid-btn"
                        style={{
                          background: isSelected ? 'rgba(56, 189, 248, 0.35)' : 'rgba(15, 23, 42, 0.85)',
                          border: isSelected ? '1px solid #38BDF8' : '1px solid rgba(56, 189, 248, 0.22)',
                          color: isSelected ? '#FFFFFF' : '#BAE6FD',
                          fontWeight: isSelected ? 'bold' : 'normal',
                        }}
                        title={`Cargar ${m.label}`}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.label.split(' ')[0]} {m.name}
                        </span>
                        {isSelected && <span style={{ color: '#38BDF8', fontSize: '0.6rem' }}>●</span>}
                      </button>
                    )
                  })}
                </div>

                <div style={{ fontSize: '0.58rem', color: '#F97316', fontWeight: 'bold', margin: '3px 0 1px', letterSpacing: '0.03em' }}>
                  🏢 CLÁSICOS CS 1.6
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  {Object.values(CS_MAPS).filter((m) => !m.isCommunity).map((m) => {
                    const isSelected = activeWorldScenario === 'cs_assault' && m.id === activeCsMap
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCsMap(m.id)
                          setIsMapGridOpen(false)
                        }}
                        className="hud-map-grid-btn"
                        style={{
                          background: isSelected ? 'rgba(249, 115, 22, 0.35)' : 'rgba(15, 23, 42, 0.85)',
                          border: isSelected ? '1px solid #F97316' : '1px solid rgba(255, 255, 255, 0.15)',
                          color: isSelected ? '#FFFFFF' : '#FED7AA',
                          fontWeight: isSelected ? 'bold' : 'normal',
                        }}
                        title={`Cargar ${m.label}`}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {m.label.split(' ')[0]} {m.name}
                        </span>
                        {isSelected && <span style={{ color: '#F97316', fontSize: '0.6rem' }}>●</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* HUD de datos de vuelo */}
      <div className="hud-card hud-panel-flight-data">
        {selectedCharacter === 'iron_man' ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  color:
                    flight.mach >= 3
                      ? '#E040FB'
                      : flight.mach >= 1
                      ? '#FF4444'
                      : flight.mach >= 0.75
                      ? '#FFAA33'
                      : '#38BDF8',
                  fontWeight: 'bold',
                }}
              >
                MACH {flight.mach.toFixed(2)}
              </span>
              <strong style={{ fontSize: '0.95rem' }}>{flight.speedKmh.toFixed(0)} km/h</strong>
            </div>

            <div style={{ fontSize: '0.66rem', marginBottom: 4, textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: 4, flexWrap: 'wrap' }}>
              {(flight.aureliumPhase || isPhaseVeilActive) && (
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: '3px',
                    background: 'rgba(56, 189, 248, 0.25)',
                    border: '1px solid #38BDF8',
                    color: '#E0F2FE',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    boxShadow: '0 0 10px rgba(56, 189, 248, 0.45)',
                    animation: 'pulse 1.2s infinite',
                  }}
                  title="Aurelium Phase Veil: Camuflaje cuántico de disolución y colapso de onda"
                >
                  ✨ VELO DE FASE
                </span>
              )}
              {flight.gcasActive && (
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: '3px',
                    background: 'rgba(245, 158, 11, 0.3)',
                    border: '1px solid #F59E0B',
                    color: '#FDE68A',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                  }}
                  title="JarBees GCAS: evasión reactiva de relieve rasante activa"
                >
                  🛡️ GCAS
                </span>
              )}
              <span
                style={{
                  padding: '1px 6px',
                  borderRadius: '3px',
                  background:
                    flight.regime === 'hypersonic'
                      ? 'rgba(224, 64, 251, 0.25)'
                      : flight.regime === 'supersonic'
                      ? 'rgba(255, 68, 68, 0.25)'
                      : flight.regime === 'transonic'
                      ? 'rgba(255, 170, 51, 0.25)'
                      : 'rgba(56, 189, 248, 0.15)',
                  border: `1px solid ${
                    flight.regime === 'hypersonic'
                      ? '#E040FB'
                      : flight.regime === 'supersonic'
                      ? '#FF4444'
                      : flight.regime === 'transonic'
                      ? '#FFAA33'
                      : '#38BDF8'
                  }`,
                  color:
                    flight.regime === 'hypersonic'
                      ? '#F5D0FE'
                      : flight.regime === 'supersonic'
                      ? '#FFAAAA'
                      : flight.regime === 'transonic'
                      ? '#FFDDAA'
                      : '#BEE3F8',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                }}
              >
                {flight.regime === 'hover' && 'Flotación'}
                {flight.regime === 'cruise' && 'Crucero'}
                {flight.regime === 'high' && 'Alta Velocidad'}
                {flight.regime === 'transonic' && 'Transónico'}
                {flight.regime === 'supersonic' && 'Supersónico (M>1)'}
                {flight.regime === 'hypersonic' && 'Hipersónico (M>3)'}
              </span>
            </div>

            <div className="hud-flight-row hud-desktop-only" style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
              <span style={{ color: '#aaa' }}>Empuje:</span>
              <span>
                <strong>{flight.thrustPct.toFixed(0)}%</strong>
                {flight.afterburner && (
                  <span style={{ marginLeft: 4, color: '#FF7733', fontWeight: 'bold' }}>⚡AB</span>
                )}
              </span>
            </div>

            <div className="hud-flight-row hud-desktop-only" style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
              <span style={{ color: '#aaa' }}>Energía:</span>
              <span style={{ color: flight.lowEnergy ? '#FF4444' : '#38BDF8' }}>
                <strong>{flight.energy.toFixed(0)}%</strong>
              </span>
            </div>

            <div className="hud-flight-row hud-desktop-only" style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
              <span style={{ color: '#aaa' }}>Núcleo:</span>
              <span style={{ color: flight.overheated ? '#FF4444' : flight.heat > 60 ? '#FFAA33' : '#aaa' }}>
                <strong>{flight.heat.toFixed(0)}°C</strong>
                {flight.thermalGlow > 0.1 && (
                  <span style={{ color: '#FF5500', marginLeft: 4 }} title="Incandescencia por plasma aerodinámico">
                    🔥Plasma
                  </span>
                )}
                {flight.overheated && ' 🔥'}
              </span>
            </div>

            <div className="hud-flight-row hud-desktop-only" style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
              <span style={{ color: '#aaa' }}>Carga G:</span>
              <strong>{flight.gLoad.toFixed(1)} G</strong>
            </div>

            <div className="hud-flight-row" style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
              <span style={{ color: '#aaa' }}>Alt:</span>
              <strong>{altitude.toFixed(1)} m</strong>
            </div>

            <div className="hud-desktop-only" style={{ marginTop: 4, textAlign: 'right' }}>
              <button
                onClick={toggleFlightMode}
                style={{
                  pointerEvents: 'auto',
                  background: flightMode === 'sim' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(56, 189, 248, 0.2)',
                  border: `1px solid ${flightMode === 'sim' ? '#C084FC' : '#38BDF8'}`,
                  color: flightMode === 'sim' ? '#E9D5FF' : '#BAE6FD',
                  borderRadius: 4,
                  padding: '2px 7px',
                  fontSize: '0.65rem',
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                }}
                title="Presiona 'G' para alternar Modo Asistido o Simulación pura"
              >
                MODO: {flightMode === 'sim' ? '🕹️ SIM' : '🛡️ ASIST'} [G]
              </button>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
        <div className="hud-flight-fps">
          FPS: {fps}
        </div>
      </div>

      {/* HUD inferior centro - Cybernetic Controls Dock */}
      <div className="hud-card hud-panel-controls">
        <div className="hud-controls-dock">
          <div className="hud-controls-row">
            {selectedCharacter === 'iron_man' ? (
              isGrounded ? (
                <>
                  <span className="hud-kbd-group">
                    <kbd className="hud-kbd">WASD</kbd>
                    <span className="hud-kbd-label">Mover</span>
                  </span>
                  <span className="hud-kbd-divider" />
                  <span className="hud-kbd-group">
                    <kbd className="hud-kbd">Shift</kbd>
                    <span className="hud-kbd-label">Sprint 55 km/h</span>
                  </span>
                  <span className="hud-kbd-divider" />
                  <span className="hud-kbd-group">
                    <kbd className="hud-kbd">Ctrl</kbd>
                    <span className="hud-kbd-label">Agachar</span>
                  </span>
                  <span className="hud-kbd-divider" />
                  <span className="hud-kbd-group">
                    <kbd className="hud-kbd">Espacio</kbd>
                    <span className="hud-kbd-label">Salto / Despegar</span>
                  </span>
                  <span className="hud-kbd-divider" />
                  <button
                    className={`hud-kbd-toggle ${isPhaseVeilActive ? 'active' : ''}`}
                    onClick={togglePhaseVeil}
                    title="Alternar Velo de Fase Cuántico (Aurelium Phase Veil)"
                    style={{
                      borderColor: isPhaseVeilActive ? '#38BDF8' : undefined,
                      color: isPhaseVeilActive ? '#38BDF8' : undefined,
                    }}
                  >
                    <kbd className="hud-kbd">V</kbd>
                    <span>Velo {isPhaseVeilActive ? 'ACTIVO' : 'OFF'}</span>
                  </button>
                  <span className="hud-kbd-divider" />
                  <button
                    className={`hud-kbd-toggle ${isHoloMapActive ? 'active' : ''}`}
                    onClick={toggleHoloMap}
                    title="Alternar Mapa Holográfico Táctico AR Flotante [M o N]"
                    style={{
                      borderColor: isHoloMapActive ? '#00f0ff' : undefined,
                      color: isHoloMapActive ? '#00f0ff' : undefined,
                    }}
                  >
                    <kbd className="hud-kbd">M</kbd>
                    <span>MAPA AR {isHoloMapActive ? 'ON' : 'OFF'}</span>
                  </button>
                  <span className="hud-kbd-divider" />
                  <span className="hud-kbd-group">
                    <kbd className="hud-kbd">1-5</kbd>
                    <span className="hud-kbd-label">Emotes</span>
                  </span>
                  <span className="hud-kbd-divider" />
                  <button
                    className={`hud-kbd-toggle ${showTactical ? 'active' : ''}`}
                    onClick={() => setShowTactical(!showTactical)}
                    title="Alternar acciones tácticas CS 1.6 & Left 4 Dead"
                  >
                    <kbd className="hud-kbd">6-0 / F-J</kbd>
                    <span>Táctico Source {showTactical ? '▲' : '▼'}</span>
                  </button>
                </>
              ) : (
                <>
                  <span className="hud-kbd-group">
                    <kbd className="hud-kbd">W/S</kbd>
                    <span className="hud-kbd-label">Empuje/Freno</span>
                  </span>
                  <span className="hud-kbd-divider" />
                  <span className="hud-kbd-group">
                    <kbd className="hud-kbd">A/D</kbd>
                    <span className="hud-kbd-label">Rumbo</span>
                  </span>
                  <span className="hud-kbd-divider" />
                  <span className="hud-kbd-group">
                    <kbd className="hud-kbd">Shift</kbd>
                    <span className="hud-kbd-label">⚡AB</span>
                  </span>
                  <span className="hud-kbd-divider" />
                  <span className="hud-kbd-group">
                    <kbd className="hud-kbd">Esp/Q</kbd>
                    <span className="hud-kbd-label">Altitud</span>
                  </span>
                  <span className="hud-kbd-divider" />
                  <button
                    className={`hud-kbd-toggle ${isPhaseVeilActive ? 'active' : ''}`}
                    onClick={togglePhaseVeil}
                    title="Alternar Velo de Fase Cuántico (Aurelium Phase Veil)"
                    style={{
                      borderColor: isPhaseVeilActive ? '#38BDF8' : undefined,
                      color: isPhaseVeilActive ? '#38BDF8' : undefined,
                    }}
                  >
                    <kbd className="hud-kbd">V</kbd>
                    <span>Velo {isPhaseVeilActive ? 'ACTIVO' : 'OFF'}</span>
                  </button>
                  <span className="hud-kbd-divider" />
                  <button
                    className={`hud-kbd-toggle ${isHoloMapActive ? 'active' : ''}`}
                    onClick={toggleHoloMap}
                    title="Alternar Mapa Holográfico Táctico AR Flotante [M o N]"
                    style={{
                      borderColor: isHoloMapActive ? '#00f0ff' : undefined,
                      color: isHoloMapActive ? '#00f0ff' : undefined,
                    }}
                  >
                    <kbd className="hud-kbd">M</kbd>
                    <span>MAPA AR {isHoloMapActive ? 'ON' : 'OFF'}</span>
                  </button>
                  <span className="hud-kbd-divider" />
                  <span className="hud-kbd-group">
                    <kbd className="hud-kbd">1-5</kbd>
                    <span className="hud-kbd-label">Emotes</span>
                  </span>
                  <span className="hud-kbd-divider" />
                  <button
                    className={`hud-kbd-toggle ${showTactical ? 'active' : ''}`}
                    onClick={() => setShowTactical(!showTactical)}
                    title="Alternar acciones tácticas CS 1.6 & Left 4 Dead"
                  >
                    <kbd className="hud-kbd">6-0 / F-J</kbd>
                    <span>Táctico Source {showTactical ? '▲' : '▼'}</span>
                  </button>
                </>
              )
            ) : (
              <>
                <span className="hud-kbd-group">
                  <kbd className="hud-kbd">WASD</kbd>
                  <span className="hud-kbd-label">Mover</span>
                </span>
                <span className="hud-kbd-divider" />
                <span className="hud-kbd-group">
                  <kbd className="hud-kbd">Espacio / Shift</kbd>
                  <span className="hud-kbd-label">Subir / Bajar</span>
                </span>
                <span className="hud-kbd-divider" />
                <button
                  className={`hud-kbd-toggle ${isHoloMapActive ? 'active' : ''}`}
                  onClick={toggleHoloMap}
                  title="Alternar Mapa Holográfico Táctico AR Flotante [M o N]"
                  style={{
                    borderColor: isHoloMapActive ? '#00f0ff' : undefined,
                    color: isHoloMapActive ? '#00f0ff' : undefined,
                  }}
                >
                  <kbd className="hud-kbd">M</kbd>
                  <span>MAPA AR {isHoloMapActive ? 'ON' : 'OFF'}</span>
                </button>
                <span className="hud-kbd-divider" />
                <span className="hud-kbd-group">
                  <kbd className="hud-kbd">U</kbd>
                  <span className="hud-kbd-label">Audio</span>
                </span>
              </>
            )}
          </div>
          {showTactical && selectedCharacter === 'iron_man' && (
            <div className="hud-controls-subrow">
              <span onClick={() => triggerEmote('flinch_torso')} style={{ cursor: 'pointer' }} title="Reacción cinética en torso">
                <kbd className="hud-kbd">6</kbd> Flinch Torso
              </span>
              <span onClick={() => triggerEmote('flinch_head')} style={{ cursor: 'pointer' }} title="Reacción cinética en casco">
                <kbd className="hud-kbd">7</kbd> Flinch Casco
              </span>
              <span onClick={() => triggerEmote('tactical_interact')} style={{ cursor: 'pointer' }} title="Interacción táctica de guantelete">
                <kbd className="hud-kbd">8</kbd> Interacción
              </span>
              <span onClick={() => triggerEmote('death_forward')} style={{ cursor: 'pointer' }} title="Colapso inercial">
                <kbd className="hud-kbd">9</kbd> Colapso
              </span>
              <span onClick={() => triggerEmote('quicklook')} style={{ cursor: 'pointer' }} title="Barrido perimetral de alerta">
                <kbd className="hud-kbd">0</kbd> Alerta
              </span>
              <span onClick={() => triggerEmote('melee_shove')} style={{ cursor: 'pointer', color: '#55F0FF' }} title="Empuje repulsor Left 4 Dead">
                <kbd className="hud-kbd">F</kbd> Shove Repulsor
              </span>
              <span onClick={() => triggerEmote('stumble')} style={{ cursor: 'pointer', color: '#55F0FF' }} title="Tambaleo inercial Left 4 Dead">
                <kbd className="hud-kbd">G</kbd> Stumble L4D
              </span>
              <span onClick={() => triggerEmote('limp_walk')} style={{ cursor: 'pointer', color: '#FFB855' }} title="Marcha herido daño crítico Left 4 Dead">
                <kbd className="hud-kbd">H</kbd> Marcha Herido
              </span>
              <span onClick={() => triggerEmote('hunter_pounce')} style={{ cursor: 'pointer', color: '#55FF88' }} title="Superhero Landing Hunter Pounce Left 4 Dead">
                <kbd className="hud-kbd">J</kbd> Hunter Landing
              </span>
            </div>
          )}
        </div>
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
