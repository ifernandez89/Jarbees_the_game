'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import {
  WORLD_TARGETS,
  type NavigationTarget,
  calculateGeodesicBearing,
  calculateRelativeBearing,
  calculateGeodesicDistance,
} from '@/services/NavigationService'

export function AurenCompassHUD() {
  const isHoloMapActive = useGameStore((state) => state.isHoloMapActive)
  const currentBiome = useGameStore((state) => state.currentBiome)
  const playerPosition = useGameStore((state) => state.position)
  const playerRotation = useGameStore((state) => state.rotation)
  const navigationTarget = useGameStore((state) => state.navigationTarget)
  const cycleNavigationTarget = useGameStore((state) => state.cycleNavigationTarget)
  const setNavigationTarget = useGameStore((state) => state.setNavigationTarget)

  // Origen geográfico según el bioma activo del jugador
  const biomeOrigin = useMemo(() => {
    const BIOME_ORIGINS: Record<string, { lat: number; lon: number; baseAlt: number }> = {
      antarctica: { lat: -77.722, lon: 162.273, baseAlt: 65 },
      aconcagua: { lat: -32.653, lon: -70.011, baseAlt: 2800 },
      titicaca: { lat: -15.800, lon: -69.200, baseAlt: 3812 },
      easter_island: { lat: -27.120, lon: -109.350, baseAlt: 50 },
      constellations: { lat: 0, lon: 0, baseAlt: 0 },
    }
    return BIOME_ORIGINS[currentBiome] || BIOME_ORIGINS.antarctica
  }, [currentBiome])

  // Rumbo del jugador en grados (0° = Norte, 90° = Este, 180° = Sur, 270° = Oeste)
  // En Three.js, rotación Y = 0 mira hacia -Z (Norte). Rotación horaria positiva.
  const heading = useMemo(() => {
    const rawDeg = (-playerRotation[1] * (180 / Math.PI)) % 360
    return (rawDeg + 360) % 360
  }, [playerRotation])

  // Latitud/longitud de Auren según su posición en el juego (1 unidad Three.js = 1 metro)
  const playerCoords = useMemo(() => {
    const earthRadius = 6371000
    const cosOrigin = Math.cos((biomeOrigin.lat * Math.PI) / 180) || 1.0

    const dLat = (-playerPosition[2] / earthRadius) * (180 / Math.PI)
    const dLon = (playerPosition[0] / (earthRadius * cosOrigin)) * (180 / Math.PI)

    return {
      lat: biomeOrigin.lat + dLat,
      lon: biomeOrigin.lon + dLon,
      alt: Math.max(0, playerPosition[1] * 25 + biomeOrigin.baseAlt),
    }
  }, [playerPosition, biomeOrigin])

  // Cálculos de navegación hacia el objetivo seleccionado
  const navData = useMemo(() => {
    if (!navigationTarget) return null

    const targetBearing = calculateGeodesicBearing(
      playerCoords.lat,
      playerCoords.lon,
      navigationTarget.latitude,
      navigationTarget.longitude
    )

    const relativeBearing = calculateRelativeBearing(targetBearing, heading)
    const horizDist = calculateGeodesicDistance(
      playerCoords.lat,
      playerCoords.lon,
      navigationTarget.latitude,
      navigationTarget.longitude
    )

    const deltaElev = navigationTarget.elevation - playerCoords.alt
    const directDist = Math.hypot(horizDist, deltaElev)

    // Formatear distancias limpiamente (sin Mega Kilómetros confusos)
    const formatDist = (meters: number) => {
      if (meters >= 1000000) {
        // >= 1.000 km (ej. 7.345 km)
        return `${Math.round(meters / 1000).toLocaleString('es-ES')} km`
      }
      if (meters >= 100000) {
        // 100 km a 999 km (ej. 115 km)
        return `${Math.round(meters / 1000)} km`
      }
      if (meters >= 10000) {
        // 10 km a 99 km (ej. 24,5 km)
        return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
      }
      if (meters >= 1000) {
        // 1 km a 9.9 km (ej. 3,25 km)
        return `${(meters / 1000).toFixed(2).replace('.', ',')} km`
      }
      // < 1 km (ej. 450 m)
      return `${Math.round(meters)} m`
    }

    return {
      targetBearing,
      relativeBearing,
      horizDist,
      directDist,
      deltaElev,
      directText: formatDist(directDist),
      horizText: formatDist(horizDist),
      elevText: `${deltaElev >= 0 ? '+' : ''}${Math.round(deltaElev)} m`,
      isOffScreenLeft: relativeBearing < -45,
      isOffScreenRight: relativeBearing > 45,
    }
  }, [navigationTarget, playerCoords, heading])

  // Cardinales para la cinta de brújula
  const cardinalText = useMemo(() => {
    const h = Math.round(heading)
    if (h >= 338 || h < 23) return 'N'
    if (h >= 23 && h < 68) return 'NE'
    if (h >= 68 && h < 113) return 'E'
    if (h >= 113 && h < 158) return 'SE'
    if (h >= 158 && h < 203) return 'S'
    if (h >= 203 && h < 248) return 'SW'
    if (h >= 248 && h < 293) return 'W'
    return 'NW'
  }, [heading])

  if (!isHoloMapActive) return null

  // Grados visibles en la cinta: de -45° a +45° respecto al frente
  const tapeWidth = 320 // Ancho en píxeles del visor de brújula
  const pxPerDegree = tapeWidth / 90 // 90° de FOV visible

  // Marcas cada 15°
  const ticks = []
  const startAngle = Math.floor((heading - 45) / 15) * 15
  for (let a = startAngle; a <= heading + 45; a += 15) {
    const normA = (a + 360) % 360
    const offsetDeg = a - heading
    const posX = (tapeWidth / 2) + offsetDeg * pxPerDegree

    let label = `${normA}°`
    let isCardinal = false
    if (normA === 0) { label = 'N'; isCardinal = true }
    else if (normA === 90) { label = 'E'; isCardinal = true }
    else if (normA === 180) { label = 'S'; isCardinal = true }
    else if (normA === 270) { label = 'W'; isCardinal = true }

    ticks.push({ label, posX, isCardinal })
  }

  // Posición X del marcador de la montaña sobre la cinta
  const targetMarkerX = navData
    ? Math.max(8, Math.min(tapeWidth - 8, tapeWidth / 2 + navData.relativeBearing * pxPerDegree))
    : tapeWidth / 2

  return (
    <div
      style={{
        position: 'fixed',
        top: '14px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 900,
        width: 'min(92vw, 440px)',
        pointerEvents: 'auto',
        userSelect: 'none',
        fontFamily: "'Inter', -apple-system, monospace, sans-serif",
      }}
    >
      {/* Contenedor Principal Estilo Dune UI */}
      <div
        style={{
          background: 'rgba(6, 14, 26, 0.82)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0, 240, 255, 0.35)',
          borderRadius: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 0 16px rgba(0, 240, 255, 0.08)',
          padding: '8px 12px 10px',
          color: '#e2e8f0',
        }}
      >
        {/* Cabecera Táctica: Título y Rumbo Central */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10px',
            letterSpacing: '1.2px',
            color: '#67e8f9',
            borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
            paddingBottom: '4px',
            marginBottom: '6px',
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#00f0ff',
                boxShadow: '0 0 6px #00f0ff',
              }}
            />
            ANS · AUREN NAV SYSTEM
          </span>

          <span
            style={{
              color: '#38bdf8',
              fontFamily: 'monospace',
              fontSize: '11px',
              textShadow: '0 0 8px rgba(56,189,248,0.8)',
            }}
          >
            {Math.round(heading).toString().padStart(3, '0')}° {cardinalText}
          </span>
        </div>

        {/* Cinta de Brújula Horizontal (DUNE Concept) */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '28px',
            overflow: 'hidden',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Ticks y Cardinales */}
          {ticks.map((t, idx) => (
            <div
              key={idx}
              style={{
                position: 'absolute',
                left: `${(t.posX / tapeWidth) * 100}%`,
                top: '0',
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'left 0.05s linear',
              }}
            >
              <div
                style={{
                  width: '1px',
                  height: t.isCardinal ? '7px' : '4px',
                  backgroundColor: t.isCardinal ? '#00f0ff' : 'rgba(255,255,255,0.4)',
                }}
              />
              <span
                style={{
                  fontSize: t.isCardinal ? '9px' : '7.5px',
                  fontWeight: t.isCardinal ? 700 : 400,
                  color: t.isCardinal ? '#00f0ff' : '#94a3b8',
                  marginTop: '2px',
                  fontFamily: 'monospace',
                }}
              >
                {t.label}
              </span>
            </div>
          ))}

          {/* Flecha Central de Rumbo Actual */}
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '0',
              transform: 'translateX(-50%)',
              width: '2px',
              height: '100%',
              backgroundColor: '#ffffff',
              boxShadow: '0 0 8px #ffffff',
              zIndex: 2,
            }}
          />

          {/* Marcador de Destino sobre la cinta */}
          {navData && (
            <div
              style={{
                position: 'absolute',
                left: `${(targetMarkerX / tapeWidth) * 100}%`,
                top: '2px',
                transform: 'translateX(-50%)',
                zIndex: 3,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'left 0.05s linear',
              }}
            >
              {/* Diamante indicador */}
              <div
                style={{
                  width: '7px',
                  height: '7px',
                  backgroundColor: navigationTarget?.color || '#38bdf8',
                  transform: 'rotate(45deg)',
                  boxShadow: `0 0 8px ${navigationTarget?.color || '#38bdf8'}`,
                }}
              />
            </div>
          )}

          {/* Indicadores Laterales Fuera de Pantalla */}
          {navData?.isOffScreenLeft && (
            <div
              style={{
                position: 'absolute',
                left: '6px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '9px',
                color: navigationTarget?.color || '#38bdf8',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                zIndex: 4,
                textShadow: '0 0 6px rgba(0,0,0,0.9)',
              }}
            >
              <span>◀</span>
              <span>{Math.round(Math.abs(navData.relativeBearing))}°</span>
            </div>
          )}

          {navData?.isOffScreenRight && (
            <div
              style={{
                position: 'absolute',
                right: '6px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '9px',
                color: navigationTarget?.color || '#38bdf8',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                zIndex: 4,
                textShadow: '0 0 6px rgba(0,0,0,0.9)',
              }}
            >
              <span>{Math.round(navData.relativeBearing)}°</span>
              <span>▶</span>
            </div>
          )}
        </div>

        {/* Panel Inferior: Destino Activo y Telemetría 3D */}
        {navigationTarget && navData && (
          <div
            style={{
              marginTop: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {/* Fila del Destino con selector interactivo */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => cycleNavigationTarget(-1)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '4px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    fontSize: '10px',
                  }}
                  title="Destino anterior"
                >
                  ◀
                </button>

                <div>
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: navigationTarget.color || '#38bdf8',
                      letterSpacing: '0.3px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span>{navigationTarget.name}</span>
                    <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 400 }}>
                      · {navigationTarget.elevation.toLocaleString()} m
                    </span>
                  </div>
                  <div style={{ fontSize: '8.5px', color: '#64748b' }}>
                    {navigationTarget.tagline}
                  </div>
                </div>

                <button
                  onClick={() => cycleNavigationTarget(1)}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '4px',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '2px 6px',
                    fontSize: '10px',
                  }}
                  title="Siguiente destino"
                >
                  ▶
                </button>
              </div>

              {/* Distancia Directa 3D Destacada */}
              <div style={{ textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    color: '#ffffff',
                    textShadow: '0 0 10px rgba(0, 240, 255, 0.6)',
                  }}
                >
                  {navData.directText}
                </div>
                <div style={{ fontSize: '8px', color: '#38bdf8', letterSpacing: '0.5px' }}>
                  DISTANCIA 3D
                </div>
              </div>
            </div>

            {/* Fila de Métricas Geodésicas Secundarias */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '4px',
                paddingTop: '4px',
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '9px',
                fontFamily: 'monospace',
              }}
            >
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '2px 4px', borderRadius: '3px' }}>
                <span style={{ color: '#64748b' }}>HORIZ: </span>
                <span style={{ color: '#cbd5e1' }}>{navData.horizText}</span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '2px 4px', borderRadius: '3px' }}>
                <span style={{ color: '#64748b' }}>DESNIVEL: </span>
                <span
                  style={{
                    color: navData.deltaElev >= 0 ? '#38bdf8' : '#34d399',
                    fontWeight: 600,
                  }}
                >
                  {navData.elevText}
                </span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '2px 4px', borderRadius: '3px' }}>
                <span style={{ color: '#64748b' }}>RUMBO: </span>
                <span style={{ color: '#cbd5e1' }}>
                  {Math.round(navData.targetBearing)}°
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AurenCompassHUD
