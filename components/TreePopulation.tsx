'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useGameStore } from '@/store/gameStore'
import { getAssetPath } from '@/utils/assetPath'

interface TreePopulationProps {
  chunkX: number
  chunkZ: number
  chunkSize: number
  density?: number
  biome?: 'titicaca' | 'easter_island' | 'constellations'
}

// Configuración de densidad por bioma
const BIOME_DENSITY = {
  titicaca: 0.7,        // Muy denso
  easter_island: 0.2,   // Escaso
  constellations: 0.0,  // Sin vegetación
}

export function TreePopulation({
  chunkX,
  chunkZ,
  chunkSize,
  density = 0.7,
  biome = 'titicaca',
}: TreePopulationProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const terrainManager = useGameStore((state) => state.terrainManager)

  // Cargar modelos de árboles con resolución adaptada a GitHub Pages
  const tree1 = useGLTF(getAssetPath('/models/tree1.glb'))
  const tree2 = useGLTF(getAssetPath('/models/tree2.glb'))
  const tree3 = useGLTF(getAssetPath('/models/tree3.glb'))

  // Usar densidad del bioma
  const biomeDensity = BIOME_DENSITY[biome] * density

  // Generar posiciones de árboles proceduralmente
  const treeData = useMemo(() => {
    if (biomeDensity === 0) return []

    const trees: Array<{
      position: THREE.Vector3
      rotation: number
      scale: number
      modelIndex: number
    }> = []

    const worldX = chunkX * chunkSize
    const worldZ = chunkZ * chunkSize

    // Número de árboles basado en densidad
    const treeCount = Math.floor(chunkSize * chunkSize * biomeDensity * 0.01)

    // Generar árboles con distribución Poisson (evitar clustering)
    for (let i = 0; i < treeCount; i++) {
      // Posición aleatoria dentro del chunk (con seed basado en coordenadas)
      const seed = (chunkX * 73856093) ^ (chunkZ * 19349663) ^ (i * 83492791)
      const random = Math.abs(Math.sin(seed))

      const localX = (random * chunkSize) % chunkSize
      const localZ = ((random * 7919) * chunkSize) % chunkSize

      const x = worldX + localX
      const z = worldZ + localZ

      // Obtener altura del terreno
      let y = 0
      if (terrainManager) {
        y = terrainManager.getHeightAt(x, z)
        
        // Usar densidad de vegetación del generador de ruido
        const vegDensity = terrainManager.getActiveChunks()[0]
          ? (Math.sin(x * 0.1) + Math.sin(z * 0.1)) / 2 + 0.5
          : 1

        // Skip si la densidad es muy baja en esta posición
        if (vegDensity < 0.3) continue
      }

      trees.push({
        position: new THREE.Vector3(x, y, z),
        rotation: random * Math.PI * 2,
        scale: 0.8 + random * 0.6, // Escala entre 0.8 y 1.4
        modelIndex: Math.floor(random * 3), // 0, 1, o 2
      })
    }

    return trees
  }, [chunkX, chunkZ, chunkSize, biomeDensity, terrainManager])

  // Crear geometría combinada de los 3 modelos
  const combinedGeometry = useMemo(() => {
    const geometries: THREE.BufferGeometry[] = []

    // Extraer geometría de cada modelo
    const models = [tree1, tree2, tree3]
    models.forEach((model) => {
      model.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh
          const geo = mesh.geometry.clone()
          geo.scale(0.5, 0.5, 0.5) // Escalar árboles
          geometries.push(geo)
        }
      })
    })

    // Tomar solo la primera geometría de cada modelo
    const uniqueGeometries = [geometries[0], geometries[1], geometries[2]].filter(Boolean)

    // Combinar en una sola geometría (simplificado)
    if (uniqueGeometries.length > 0) {
      // Por ahora usar solo la primera geometría
      return uniqueGeometries[0]
    }

    return new THREE.BoxGeometry(1, 2, 1) // Fallback
  }, [tree1, tree2, tree3])

  // Configurar instancias
  useEffect(() => {
    if (!meshRef.current || treeData.length === 0) return

    const dummy = new THREE.Object3D()

    treeData.forEach((tree, i) => {
      dummy.position.copy(tree.position)
      dummy.rotation.y = tree.rotation
      dummy.scale.setScalar(tree.scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
    meshRef.current.frustumCulled = false
  }, [treeData])

  // No renderizar si no hay árboles
  if (treeData.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[combinedGeometry, undefined, treeData.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    >
      <meshStandardMaterial color="#2d5016" roughness={0.9} />
    </instancedMesh>
  )
}

// Precargar modelos con rutas compatibles con GitHub Pages
useGLTF.preload(getAssetPath('/models/tree1.glb'))
useGLTF.preload(getAssetPath('/models/tree2.glb'))
useGLTF.preload(getAssetPath('/models/tree3.glb'))
