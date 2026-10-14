'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'

interface WaterSurfaceProps {
  waterHeight?: number
  size?: number
}

export function WaterSurface({ waterHeight = 1.2, size = 600 }: WaterSurfaceProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const position = useGameStore((state) => state.position)
  const currentBiome = useGameStore((state) => state.currentBiome)

  // En el espacio (constelaciones), no mostramos agua terrestre
  const isVisible = currentBiome === 'titicaca' || currentBiome === 'easter_island'

  useFrame(({ clock }) => {
    if (!meshRef.current || !isVisible) return

    // Mantener la superficie del agua centrada alrededor de la posición de la abeja
    // para que sea infinito sin tener que recalcular geometrías
    meshRef.current.position.x = position[0]
    meshRef.current.position.z = position[2]

    // Ondulación sutil del agua
    const time = clock.getElapsedTime()
    meshRef.current.position.y = waterHeight + Math.sin(time * 1.2) * 0.08
  })

  if (!isVisible) return null

  const isTiticaca = currentBiome === 'titicaca'
  const waterColor = isTiticaca ? '#0077be' : '#2e5d7a'

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[position[0], waterHeight, position[2]]}
      receiveShadow
    >
      <planeGeometry args={[size, size, 32, 32]} />
      <meshStandardMaterial
        color={waterColor}
        transparent
        opacity={0.78}
        roughness={0.15}
        metalness={0.65}
      />
    </mesh>
  )
}
