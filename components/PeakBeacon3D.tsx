'use client'

import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'
import {
  calculateGeodesicBearing,
  calculateGeodesicDistance,
} from '@/services/NavigationService'

export function PeakBeacon3D() {
  const isHoloMapActive = useGameStore((state) => state.isHoloMapActive)
  const currentBiome = useGameStore((state) => state.currentBiome)
  const navigationTarget = useGameStore((state) => state.navigationTarget)
  const playerPosition = useGameStore((state) => state.position)
  const terrainManager = useGameStore((state) => state.terrainManager)

  const groupRef = useRef<THREE.Group>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const diamondRef = useRef<THREE.Mesh>(null)

  // Origen geográfico según el bioma activo
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

  // Coordenadas geográficas actuales de Auren en tiempo real
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

  // Distancia real matemática y rumbo hacia el objetivo
  const { trueDistance, bearingDeg, deltaElevation } = useMemo(() => {
    if (!navigationTarget) {
      return { trueDistance: 0, bearingDeg: 0, deltaElevation: 0 }
    }

    const dist = calculateGeodesicDistance(
      playerCoords.lat,
      playerCoords.lon,
      navigationTarget.latitude,
      navigationTarget.longitude
    )

    const bearing = calculateGeodesicBearing(
      playerCoords.lat,
      playerCoords.lon,
      navigationTarget.latitude,
      navigationTarget.longitude
    )

    const dElev = navigationTarget.elevation - playerCoords.alt

    return {
      trueDistance: dist,
      bearingDeg: bearing,
      deltaElevation: dElev,
    }
  }, [navigationTarget, playerCoords])

  // Formato limpio de distancia para el HUD 3D
  const distanceFormatted = useMemo(() => {
    if (trueDistance >= 1000000) {
      return `${Math.round(trueDistance / 1000).toLocaleString('es-ES')} km`
    }
    if (trueDistance >= 100000) {
      return `${Math.round(trueDistance / 1000)} km`
    }
    if (trueDistance >= 10000) {
      return `${(trueDistance / 1000).toFixed(1).replace('.', ',')} km`
    }
    if (trueDistance >= 1000) {
      return `${(trueDistance / 1000).toFixed(2).replace('.', ',')} km`
    }
    return `${Math.round(trueDistance)} m`
  }, [trueDistance])

  // Posición visual en 3D garantizada dentro del frustum de la cámara (far: 1000)
  // Anclada en el horizonte a 350m a lo largo del rumbo real si está lejos
  const visualPos3D = useMemo(() => {
    if (!navigationTarget) return new THREE.Vector3(0, 0, 0)

    const bearingRad = (bearingDeg * Math.PI) / 180
    // Distancia visual en el motor (máximo 380m para evitar culling de la cámara far: 1000)
    const visualDist = Math.min(trueDistance, 380)

    const targetX = playerPosition[0] + Math.sin(bearingRad) * visualDist
    const targetZ = playerPosition[2] - Math.cos(bearingRad) * visualDist

    let groundY = 0
    if (terrainManager && typeof terrainManager.getHeightAt === 'function') {
      groundY = terrainManager.getHeightAt(targetX, targetZ)
    }

    // Si es local (< 380m), se ubica exactamente en la cumbre del relieve 3D; si está en el horizonte, se eleva visiblemente
    const visualY =
      trueDistance <= 380
        ? groundY + 3.5
        : Math.max(playerPosition[1] + 18, groundY + 25)

    return new THREE.Vector3(targetX, visualY, targetZ)
  }, [navigationTarget, bearingDeg, trueDistance, playerPosition, terrainManager])

  // Animaciones de pulso y rotación livianas
  useFrame((state) => {
    if (!isHoloMapActive || !navigationTarget) return

    const time = state.clock.elapsedTime
    if (ringRef.current) {
      ringRef.current.rotation.z = time * 1.5
      const scale = 1.0 + Math.sin(time * 3) * 0.15
      ringRef.current.scale.set(scale, scale, scale)
    }

    if (diamondRef.current) {
      diamondRef.current.rotation.y = time * 1.0
      diamondRef.current.position.y = Math.sin(time * 2.5) * 0.5
    }
  })

  if (!isHoloMapActive || !navigationTarget) return null

  const targetColor = navigationTarget.color || '#38bdf8'
  const isArrived = trueDistance <= 150
  const isClose = trueDistance <= 1200

  return (
    <group ref={groupRef} position={visualPos3D}>
      {/* Resplandor cálido de la caldera volcánica / cumbre si el objetivo es un volcán */}
      {navigationTarget.category === 'volcano' && (
        <pointLight color="#ff5a1f" intensity={3.5} distance={150} decay={2} position={[0, -1, 0]} />
      )}

      {/* 1. Columna de Luz Vertical de Navegación hacia el firmamento */}
      <mesh position={[0, 45, 0]}>
        <cylinderGeometry args={[0.35, 0.8, 90, 8]} />
        <meshBasicMaterial
          color={targetColor}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Baliza Holográfica Central (Diamante + Aro Orbital) */}
      <group position={[0, 2, 0]}>
        <mesh ref={diamondRef}>
          <octahedronGeometry args={[1.2, 0]} />
          <meshBasicMaterial
            color={targetColor}
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.2, 0.08, 8, 24]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* 3. Etiqueta Holográfica 3D con DISTANCIA DESTACADA SIEMPRE VISIBLE */}
      <Html
        position={[0, 6.5, 0]}
        center
        distanceFactor={28}
        zIndexRange={[90, 0]}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontFamily: "'Inter', monospace, -apple-system, sans-serif",
          }}
        >
          {/* Card Principal de la Baliza */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(5, 12, 25, 0.88)',
              border: `1.5px solid ${targetColor}`,
              boxShadow: `0 0 24px ${targetColor}cc, inset 0 0 12px ${targetColor}44`,
              backdropFilter: 'blur(8px)',
              color: '#ffffff',
            }}
          >
            {/* Nombre de la Montaña y Cota */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                color: targetColor,
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: targetColor,
                  boxShadow: `0 0 8px ${targetColor}`,
                }}
              />
              <span>{navigationTarget.name}</span>
              <span style={{ color: '#94a3b8', fontSize: '9px', fontWeight: 400 }}>
                {navigationTarget.elevation.toLocaleString()} m
              </span>
            </div>

            {/* DISTANCIA RESTANTE EN NÚMEROS GRANDES (EL DATO CLAVE) */}
            <div
              style={{
                marginTop: '3px',
                fontSize: '16px',
                fontWeight: 900,
                fontFamily: 'monospace',
                color: '#ffffff',
                textShadow: `0 0 12px ${targetColor}`,
                letterSpacing: '0.5px',
              }}
            >
              {distanceFormatted}
            </div>

            {/* Subtítulo de Desnivel */}
            <div
              style={{
                fontSize: '8.5px',
                color: deltaElevation >= 0 ? '#67e8f9' : '#34d399',
                fontFamily: 'monospace',
                marginTop: '1px',
              }}
            >
              {deltaElevation >= 0 ? `▲ DESNIVEL: +${Math.round(deltaElevation)} m` : `▼ DESNIVEL: ${Math.round(deltaElevation)} m`}
            </div>
          </div>

          {/* Badge de Llegada / Proximidad */}
          {isArrived ? (
            <div
              style={{
                marginTop: '4px',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.35)',
                border: '1px solid #10b981',
                color: '#34d399',
                fontSize: '9.5px',
                fontWeight: 800,
                letterSpacing: '1px',
                boxShadow: '0 0 14px #10b981',
              }}
            >
              ✓ CUMBRE ALCANZADA
            </div>
          ) : isClose ? (
            <div
              style={{
                marginTop: '3px',
                color: '#67e8f9',
                fontSize: '8.5px',
                fontFamily: 'monospace',
                letterSpacing: '0.5px',
              }}
            >
              APROXIMACIÓN FINAL
            </div>
          ) : null}
        </div>
      </Html>
    </group>
  )
}

export default PeakBeacon3D
