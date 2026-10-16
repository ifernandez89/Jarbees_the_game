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

  // Configurar niebla atmosférica limpia y continua
  useEffect(() => {
    if (!enabled) return

    const initialColor = new THREE.Color(timeOfDay.horizonColor)
    const fog = new THREE.Fog(initialColor, 120, 520)
    scene.fog = fog
    fogRef.current = fog

    return () => {
      scene.fog = null
    }
  }, [enabled, scene, timeOfDay.horizonColor])

  // Sincronizar niebla volumétrica con el ciclo día/noche
  useFrame((_, delta) => {
    if (!enabled || !fogRef.current) return

    const fog = fogRef.current
    const targetColor = new THREE.Color(timeOfDay.horizonColor)
    fog.color.lerp(targetColor, Math.min(1, delta * 3))

    const baseDensity = timeOfDay.fogDensity
    const targetNear = 140 - baseDensity * 40
    const targetFar = 540 - baseDensity * 120

    fog.near = THREE.MathUtils.lerp(fog.near, targetNear, delta * 3)
    fog.far = THREE.MathUtils.lerp(fog.far, targetFar, delta * 3)
  })

  return null
}
