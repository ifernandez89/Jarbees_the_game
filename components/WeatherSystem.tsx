'use client'

import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useDayNightCycle } from '@/hooks/useDayNightCycle'

interface WeatherSystemProps {
  enabled?: boolean
}

export function WeatherSystem({ enabled = true }: WeatherSystemProps) {
  const { scene } = useThree()
  const fogRef = useRef<THREE.Fog | null>(null)
  const timeOfDay = useDayNightCycle(enabled)

  // Configurar niebla inicial
  useEffect(() => {
    if (!enabled) return

    const initialColor = new THREE.Color(timeOfDay.horizonColor)
    const fog = new THREE.Fog(initialColor, 120, 480)
    scene.fog = fog
    fogRef.current = fog

    return () => {
      scene.fog = null
    }
  }, [enabled, scene, timeOfDay.horizonColor])

  // Actualizar niebla según hora del día
  useFrame((_, delta) => {
    if (!enabled || !fogRef.current) return

    const fog = fogRef.current

    // El color de la niebla se funde suavemente con el color del horizonte
    const targetColor = new THREE.Color(timeOfDay.horizonColor)
    fog.color.lerp(targetColor, Math.min(1, delta * 3))

    // Densidad y distancias de niebla sin cortes abruptos
    const baseDensity = timeOfDay.fogDensity
    const targetNear = 120 - baseDensity * 40
    const targetFar = 480 - baseDensity * 100

    fog.near = THREE.MathUtils.lerp(fog.near, targetNear, delta * 3)
    fog.far = THREE.MathUtils.lerp(fog.far, targetFar, delta * 3)
  })

  return null
}
