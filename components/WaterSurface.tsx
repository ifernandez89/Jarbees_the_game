'use client'

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'

interface WaterSurfaceProps {
  waterHeight?: number
  size?: number
}

export function WaterSurface({ waterHeight = 1.2, size = 650 }: WaterSurfaceProps) {
  const { scene } = useThree()
  const meshRef = useRef<THREE.Mesh>(null!)
  const beeRef = useRef<THREE.Object3D | null>(null)
  const currentBiome = useGameStore((state) => state.currentBiome)
  const wind = useGameStore((state) => state.wind)

  // En el espacio (constelaciones), no mostramos agua terrestre
  const isVisible = currentBiome === 'titicaca' || currentBiome === 'easter_island'

  // Textura procedural de normales de oleaje suave para reflejos realistas (Sun Glade)
  const normalMap = useMemo(() => {
    if (typeof document === 'undefined') return null

    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!

    const imgData = ctx.createImageData(256, 256)
    const data = imgData.data

    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        // Ondas sinusoidales superpuestas en varias frecuencias
        const nx = Math.sin((x / 256) * Math.PI * 8) * 0.4 + Math.sin((x / 256) * Math.PI * 16) * 0.2
        const ny = Math.cos((y / 256) * Math.PI * 8) * 0.4 + Math.cos((y / 256) * Math.PI * 16) * 0.2

        const idx = (y * 256 + x) * 4
        data[idx] = Math.floor(128 + nx * 50)     // R (normal X)
        data[idx + 1] = Math.floor(128 + ny * 50) // G (normal Y)
        data[idx + 2] = 255                       // B (normal Z hacia arriba)
        data[idx + 3] = 255
      }
    }

    ctx.putImageData(imgData, 0, 0)
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(24, 24)
    return texture
  }, [])

  // Material PBR de agua pura con reflejo especular directo hacia el sol/luna
  const waterMaterial = useMemo(() => {
    const isTiticaca = currentBiome === 'titicaca'
    const waterColor = isTiticaca ? '#0077be' : '#224e6b'

    return new THREE.MeshStandardMaterial({
      color: waterColor,
      transparent: true,
      opacity: 0.82,
      roughness: 0.18,       // Superficie suave con estela de luz reflectiva
      metalness: 0.08,       // Dieléctrico natural (agua real)
      normalMap: normalMap || undefined,
      normalScale: new THREE.Vector2(0.25, 0.25),
    })
  }, [currentBiome, normalMap])

  useFrame(({ clock }, delta) => {
    if (!meshRef.current || !isVisible) return

    if (!beeRef.current) {
      beeRef.current = scene.getObjectByName('beePlayer') || null
    }
    const bee = beeRef.current
    if (bee) {
      meshRef.current.position.x = bee.position.x
      meshRef.current.position.z = bee.position.z
    }

    // Ondulación sutil de marea vertical
    const time = clock.getElapsedTime()
    meshRef.current.position.y = waterHeight + Math.sin(time * 1.2) * 0.06

    // Desplazamiento continuo del oleaje en la dirección del viento
    if (normalMap) {
      const windSpeed = (wind?.speed || 1.8) * 0.015
      const windDir = wind?.direction || [0.7, 0, -0.7]
      normalMap.offset.x += windDir[0] * windSpeed * delta
      normalMap.offset.y += windDir[2] * windSpeed * delta
    }
  })

  if (!isVisible) return null

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, waterHeight, 0]}
      receiveShadow
      material={waterMaterial}
    >
      <planeGeometry args={[size, size, 32, 32]} />
    </mesh>
  )
}
