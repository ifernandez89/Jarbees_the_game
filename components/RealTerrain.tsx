/**
 * RealTerrain - Componente React para terrenos 3D con datos reales
 * 
 * Uso:
 * ```tsx
 * <RealTerrain
 *   region="aconcagua"
 *   quality="medium"
 *   onLoad={() => console.log('Terrain loaded!')}
 * />
 * ```
 */

'use client'

import { useEffect, useRef, useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RealTerrainSystem, PREDEFINED_REGIONS, type QualityPreset, type DEMRegion } from '@/systems/terrain/RealTerrainSystem'
import { useGameStore } from '@/store/gameStore'

interface RealTerrainProps {
  region: keyof typeof PREDEFINED_REGIONS | DEMRegion
  quality?: QualityPreset
  chunkSize?: number
  viewDistance?: number
  onLoad?: () => void
  onError?: (error: Error) => void
  enabled?: boolean
}

export function RealTerrain({
  region,
  quality = 'medium',
  chunkSize,
  viewDistance,
  onLoad,
  onError,
  enabled = true,
}: RealTerrainProps) {
  const { scene } = useThree()
  const terrainSystemRef = useRef<RealTerrainSystem>()
  const isLoadingRef = useRef(false)

  // Obtener región (string o objeto)
  const regionData: DEMRegion = useMemo(() => {
    if (typeof region === 'string') {
      return PREDEFINED_REGIONS[region]
    }
    return region
  }, [region])

  // Crear sistema de terreno
  const terrainSystem = useMemo(() => {
    if (!enabled) return null

    const system = new RealTerrainSystem({
      scene,
      quality,
      chunkSize,
      viewDistance,
    })

    terrainSystemRef.current = system

    // Registrar en gameStore para que otros sistemas puedan acceder
    useGameStore.setState({ terrainManager: system as any })

    return system
  }, [scene, quality, chunkSize, viewDistance, enabled])

  // Cargar región
  useEffect(() => {
    if (!terrainSystem || !regionData || isLoadingRef.current) return

    isLoadingRef.current = true

    const loadTerrain = async () => {
      try {
        console.log(`[RealTerrain] Loading region: ${regionData.name}`)
        await terrainSystem.loadRegion(regionData)
        console.log(`[RealTerrain] Region loaded: ${regionData.name}`)
        onLoad?.()
      } catch (error) {
        console.error('[RealTerrain] Failed to load terrain:', error)
        onError?.(error as Error)
      } finally {
        isLoadingRef.current = false
      }
    }

    loadTerrain()
  }, [terrainSystem, regionData, onLoad, onError])

  // Update loop
  useEffect(() => {
    if (!terrainSystem || !enabled) return

    let frameId: number
    const playerVec = new THREE.Vector3()

    const update = () => {
      // Obtener posición del jugador desde gameStore
      const pos = useGameStore.getState().position
      
      if (pos) {
        playerVec.set(pos[0], pos[1], pos[2])
        terrainSystem.update(playerVec)
      }

      frameId = requestAnimationFrame(update)
    }

    // Iniciar loop
    frameId = requestAnimationFrame(update)

    return () => {
      cancelAnimationFrame(frameId)
    }
  }, [terrainSystem, enabled])

  // Cleanup
  useEffect(() => {
    return () => {
      if (terrainSystemRef.current) {
        terrainSystemRef.current.dispose()
        useGameStore.setState({ terrainManager: null })
      }
    }
  }, [])

  return null // No renderiza nada directamente (el sistema maneja Three.js)
}

/**
 * Hook para acceder al sistema de terreno desde otros componentes
 */
export function useRealTerrain() {
  const terrainManager = useGameStore((state) => state.terrainManager)
  
  return {
    getHeightAt: (x: number, z: number) => {
      return terrainManager?.getHeightAt?.(x, z) ?? 0
    },
    getStats: () => {
      return (terrainManager as any)?.getStats?.() ?? null
    },
    setQuality: (quality: QualityPreset) => {
      ;(terrainManager as any)?.setQuality?.(quality)
    },
    isLoaded: !!terrainManager,
  }
}

/**
 * Componente de debug para visualizar estadísticas
 */
export function TerrainDebugStats() {
  const { getStats, isLoaded } = useRealTerrain()
  
  useEffect(() => {
    if (!isLoaded) return

    const interval = setInterval(() => {
      const stats = getStats()
      if (stats) {
        console.log('[Terrain Stats]', {
          chunks: stats.activeChunks,
          triangles: stats.totalTriangles.toLocaleString(),
          quality: stats.quality,
          region: stats.currentRegion,
          updateTime: `${stats.lastUpdateTime.toFixed(2)}ms`,
        })
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [isLoaded, getStats])

  return null
}
