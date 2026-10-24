'use client'

import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'
import { navigationService } from '@/services/NavigationService'

export function PeakBeacon3D() {
  const isHoloMapActive = useGameStore((state) => state.isHoloMapActive)
  const navigationTarget = useGameStore((state) => state.navigationTarget)
  const playerPosition = useGameStore((state) => state.position)
  const terrainManager = useGameStore((state) => state.terrainManager)

  const groupRef = useRef<THREE.Group>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const diamondRef = useRef<THREE.Mesh>(null)

  // Calcular posición 3D en el mundo Three.js según coordenadas geográficas del objetivo
  const targetPos3D = useMemo(() => {
    if (!navigationTarget) return null

    // Origen de referencia de la escena actual
    const originLat = -77.722
    const originLon = 162.273
    const earthRadius = 6371000

    const cosOriginLat = Math.cos((originLat * Math.PI) / 180)
    const dLon = ((navigationTarget.longitude - originLon) * Math.PI) / 180
    const dLat = ((navigationTarget.latitude - originLat) * Math.PI) / 180

    let rawX = dLon * cosOriginLat * earthRadius
    let rawZ = -dLat * earthRadius

    // Compresión para objetivos lejanos continentales
    const dist2D = Math.hypot(rawX, rawZ)
    if (dist2D > 2500) {
      const compressedDist = 2500 + Math.log10(1 + (dist2D - 2500) * 0.01) * 350
      const ratio = compressedDist / dist2D
      rawX *= ratio
      rawZ *= ratio
    }

    // Obtener altura del terreno si existe en esa coordenada
    let groundY = 0
    if (terrainManager && typeof terrainManager.getHeightAt === 'function') {
      groundY = terrainManager.getHeightAt(rawX, rawZ)
    }

    // Altura visual de cumbre proporcional
    const visualY = Math.max(groundY + 12, (navigationTarget.elevation / 35))

    return new THREE.Vector3(rawX, visualY, rawZ)
  }, [navigationTarget, terrainManager])

  // Distancia del jugador al objetivo en 3D
  const distance3D = useMemo(() => {
    if (!targetPos3D) return 999999
    return targetPos3D.distanceTo(
      new THREE.Vector3(playerPosition[0], playerPosition[1], playerPosition[2])
    )
  }, [targetPos3D, playerPosition])

  // Animaciones continuas de pulso y rotación con bajo costo de CPU/GPU
  useFrame((state) => {
    if (!isHoloMapActive || !targetPos3D) return

    const time = state.clock.elapsedTime
    if (ringRef.current) {
      ringRef.current.rotation.z = time * 1.2
      const scale = 1.0 + Math.sin(time * 3) * 0.12
      ringRef.current.scale.set(scale, scale, scale)
    }

    if (diamondRef.current) {
      diamondRef.current.rotation.y = time * 0.8
      diamondRef.current.position.y = Math.sin(time * 2.5) * 0.4
    }
  })

  if (!isHoloMapActive || !navigationTarget || !targetPos3D) return null

  const targetColor = navigationTarget.color || '#38bdf8'
  const isClose = distance3D < 1200
  const isArrived = distance3D < 180

  return (
    <group ref={groupRef} position={targetPos3D}>
      {/* 1. Haz de Luz Vertical / Columna de Energía hacia la estratosfera */}
      <mesh position={[0, 40, 0]}>
        <cylinderGeometry args={[0.2, 0.4, 80, 8]} />
        <meshBasicMaterial
          color={targetColor}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Faro / Baliza Holográfica Central */}
      <group position={[0, 2.5, 0]}>
        {/* Diamante rotatorio en la cumbre */}
        <mesh ref={diamondRef}>
          <octahedronGeometry args={[0.8, 0]} />
          <meshBasicMaterial
            color={targetColor}
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Anillo de llegada orbital */}
        <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.05, 8, 24]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* 3. Etiqueta Holográfica 3D (visible a distancias intermedias y cortas) */}
      {distance3D < 2200 && (
        <Html
          position={[0, 5.5, 0]}
          center
          distanceFactor={22}
          zIndexRange={[90, 0]}
          style={{ pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap' }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontFamily: "'Inter', monospace, sans-serif",
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(5, 12, 25, 0.82)',
                border: `1px solid ${targetColor}`,
                boxShadow: `0 0 20px ${targetColor}aa`,
                backdropFilter: 'blur(6px)',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.6px',
                textTransform: 'uppercase',
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
              <span style={{ color: '#94a3b8', fontSize: '9px' }}>
                {navigationTarget.elevation.toLocaleString()} m
              </span>
            </div>

            {isArrived ? (
              <div
                style={{
                  marginTop: '4px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.3)',
                  border: '1px solid #10b981',
                  color: '#34d399',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.8px',
                  boxShadow: '0 0 10px #10b981',
                }}
              >
                ✓ CUMBRE ALCANZADA
              </div>
            ) : isClose ? (
              <div
                style={{
                  marginTop: '2px',
                  color: '#67e8f9',
                  fontSize: '9px',
                  fontFamily: 'monospace',
                }}
              >
                APROXIMACIÓN FINAL · {Math.round(distance3D)} m
              </div>
            ) : null}
          </div>
        </Html>
      )}
    </group>
  )
}

export default PeakBeacon3D
