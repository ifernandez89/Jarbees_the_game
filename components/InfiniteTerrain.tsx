'use client'

import { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ChunkManager, ChunkConfig } from '@/systems/ChunkManager'
import { useGameStore } from '@/store/gameStore'
import { TreePopulation } from './TreePopulation'
import { flightRuntime } from '@/systems/FlightDynamics'
import { RockPopulation } from './RockPopulation'

interface InfiniteTerrainProps {
  biome?: 'titicaca' | 'easter_island' | 'constellations' | 'aconcagua'
  seed?: number
}

// Configuraciones por bioma
const BIOME_CONFIGS: Record<string, Partial<ChunkConfig>> = {
  titicaca: {
    color: '#ffffff', // Multiplicador neutro para mostrar los vertexColors andinos
    heightMultiplier: 8,
  },
  easter_island: {
    color: '#5c4838', // Tierra volcánica natural
    heightMultiplier: 14,
  },
  constellations: {
    color: '#16162a', // Azul noche espacial
    heightMultiplier: 3,
  },
  aconcagua: {
    color: '#ffffff', // Multiplicador neutro para vertexColors satelitales (glaciares y granito)
    heightMultiplier: 25,
  },
}

export function InfiniteTerrain({ biome = 'aconcagua', seed }: InfiniteTerrainProps) {
  const { scene } = useThree()
  const groupRef = useRef<THREE.Group>(null!)
  const beeRef = useRef<THREE.Object3D | null>(null)
  const chunksRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const [activeChunkKeys, setActiveChunkKeys] = useState<Set<string>>(new Set())
  
  // Crear ChunkManager con memo para evitar recreación
  const chunkManager = useMemo(() => {
    const baseConfig: ChunkConfig = {
      size: 100, // Chunks de 100x100
      resolution: 5, // Un vértice cada 5 unidades
      viewDistance: 200, // Renderizar 200 unidades alrededor
      heightMultiplier: 8,
      color: '#7CFC00',
    }
    
    // Aplicar configuración del bioma
    const biomeConfig = BIOME_CONFIGS[biome] || {}
    const config = { ...baseConfig, ...biomeConfig }
    
    return new ChunkManager(config, seed, biome)
  }, [biome, seed])

  // Registrar ChunkManager en el store global
  const setTerrainManager = useGameStore((state) => state.setTerrainManager)
  
  useEffect(() => {
    setTerrainManager(chunkManager)
    
    return () => {
      setTerrainManager(null)
    }
  }, [chunkManager, setTerrainManager])

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      chunkManager.dispose()
    }
  }, [chunkManager])

  const previousKeysRef = useRef<string>('')

  // Actualizar chunks cada frame
  useFrame(() => {
    if (!groupRef.current) return

    if (!beeRef.current) {
      beeRef.current = scene.getObjectByName('beePlayer') || null
    }
    const bee = beeRef.current
    const playerX = bee ? bee.position.x : useGameStore.getState().position[0]
    const playerZ = bee ? bee.position.z : useGameStore.getState().position[2]
    
    // Streaming anticipado para vuelo de alta velocidad (JARBEES FLIGHT SYSTEM):
    // se precarga el terreno en la trayectoria (~0.9 s por delante), se amplía el radio de carga
    // con la velocidad y se limita la creación de chunks por frame para evitar tirones de CPU.
    let aheadX = 0
    let aheadZ = 0
    let extraView = 0
    let maxNew = Infinity
    if (flightRuntime.active && flightRuntime.speed > 60) {
      const lead = Math.min(380, flightRuntime.speed * 0.9)
      const hSpeed = Math.hypot(flightRuntime.vx, flightRuntime.vz)
      if (hSpeed > 1) {
        aheadX = (flightRuntime.vx / hSpeed) * lead
        aheadZ = (flightRuntime.vz / hSpeed) * lead
      }
      extraView = Math.min(120, flightRuntime.speed * 0.35)
      maxNew = 4
    }

    // Obtener chunks que deben añadirse
    const newChunks = chunkManager.updateChunks(playerX, playerZ, aheadX, aheadZ, extraView, maxNew)
    
    // Añadir nuevos chunks a la escena
    newChunks.forEach(chunkData => {
      if (!chunksRef.current.has(chunkData.key)) {
        const mesh = new THREE.Mesh(chunkData.geometry, chunkData.material)
        mesh.position.set(...chunkData.position)
        mesh.receiveShadow = true
        mesh.castShadow = false
        
        groupRef.current.add(mesh)
        chunksRef.current.set(chunkData.key, mesh)
      }
    })
    
    // Obtener chunks activos y solo actualizar estado si cambiaron (evita parpadeos)
    const activeChunksList = chunkManager.getActiveChunks()
    const activeKeyList = activeChunksList.map(chunk => chunk.key)
    const keyFingerprint = activeKeyList.slice().sort().join('|')
    
    if (previousKeysRef.current !== keyFingerprint) {
      previousKeysRef.current = keyFingerprint
      setActiveChunkKeys(new Set(activeKeyList))
    }
    
    // Remover chunks inactivos de la escena
    const activeKeysSet = new Set(activeKeyList)
    chunksRef.current.forEach((mesh, key) => {
      if (!activeKeysSet.has(key)) {
        groupRef.current.remove(mesh)
        chunksRef.current.delete(key)
      }
    })
  })

  return (
    <>
      <group ref={groupRef} />
      
      {/* Elementos naturales para cada chunk activo (árboles y rocas/megalitos estilo Archeoscope) */}
      {Array.from(activeChunkKeys).map((key) => {
        const [chunkX, chunkZ] = key.split('_').map(Number)
        return (
          <group key={key}>
            <TreePopulation
              chunkX={chunkX}
              chunkZ={chunkZ}
              chunkSize={100}
              biome={biome}
            />
            <RockPopulation
              chunkX={chunkX}
              chunkZ={chunkZ}
              chunkSize={100}
              biome={biome}
            />
          </group>
        )
      })}
    </>
  )
}
