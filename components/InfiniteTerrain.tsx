'use client'

import { useRef, useEffect, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ChunkManager, ChunkConfig } from '@/systems/ChunkManager'
import { useGameStore } from '@/store/gameStore'
import { TreePopulation } from './TreePopulation'

interface InfiniteTerrainProps {
  biome?: 'titicaca' | 'easter_island' | 'constellations'
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
}

export function InfiniteTerrain({ biome = 'titicaca', seed }: InfiniteTerrainProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const chunksRef = useRef<Map<string, THREE.Mesh>>(new Map())
  const [activeChunkKeys, setActiveChunkKeys] = useState<Set<string>>(new Set())
  
  const position = useGameStore((state) => state.position)
  
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
    
    return new ChunkManager(config, seed)
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

    const [playerX, , playerZ] = position
    
    // Obtener chunks que deben añadirse
    const newChunks = chunkManager.updateChunks(playerX, playerZ)
    
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
      
      {/* Árboles para cada chunk activo */}
      {Array.from(activeChunkKeys).map((key) => {
        const [chunkX, chunkZ] = key.split('_').map(Number)
        return (
          <TreePopulation
            key={key}
            chunkX={chunkX}
            chunkZ={chunkZ}
            chunkSize={100}
            biome={biome}
          />
        )
      })}
    </>
  )
}
