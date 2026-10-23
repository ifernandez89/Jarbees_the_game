'use client'

import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useGameStore } from '@/store/gameStore'

interface TreePopulationProps {
  chunkX: number
  chunkZ: number
  chunkSize: number
  density?: number
  biome?: 'titicaca' | 'easter_island' | 'constellations' | 'aconcagua'
}

// Configuración de densidad por bioma
const BIOME_DENSITY = {
  titicaca: 0.6,        // Vegetación natural
  easter_island: 0.15,  // Escaso
  constellations: 0.0,  // Sin vegetación
  aconcagua: 0.08,      // Árboles escasos solo en valles bajos (<15m)
}

export function TreePopulation({
  chunkX,
  chunkZ,
  chunkSize,
  density = 0.6,
  biome = 'titicaca',
}: TreePopulationProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const terrainManager = useGameStore((state) => state.terrainManager)

  // Usar densidad del bioma
  const biomeDensity = BIOME_DENSITY[biome] * density

  // Geometría procedural estilizada de árbol (tronco + capas de copa con colores de vértices)
  const treeGeometry = useMemo(() => {
    // 1. Tronco de madera
    const trunk = new THREE.CylinderGeometry(0.18, 0.28, 2.0, 6)
    trunk.translate(0, 1.0, 0)
    const trunkColors = new Float32Array(trunk.attributes.position.count * 3)
    for (let i = 0; i < trunkColors.length; i += 3) {
      trunkColors[i] = 0.35     // R madera
      trunkColors[i + 1] = 0.23 // G madera
      trunkColors[i + 2] = 0.15 // B madera
    }
    trunk.setAttribute('color', new THREE.BufferAttribute(trunkColors, 3))

    // 2. Copa nivel 1 (base frondosa)
    const cone1 = new THREE.ConeGeometry(1.5, 2.0, 6)
    cone1.translate(0, 2.5, 0)
    const c1Colors = new Float32Array(cone1.attributes.position.count * 3)
    for (let i = 0; i < c1Colors.length; i += 3) {
      c1Colors[i] = 0.18     // R verde oscuro
      c1Colors[i + 1] = 0.36 // G verde oscuro
      c1Colors[i + 2] = 0.14 // B verde oscuro
    }
    cone1.setAttribute('color', new THREE.BufferAttribute(c1Colors, 3))

    // 3. Copa nivel 2 (media)
    const cone2 = new THREE.ConeGeometry(1.1, 1.6, 6)
    cone2.translate(0, 3.6, 0)
    const c2Colors = new Float32Array(cone2.attributes.position.count * 3)
    for (let i = 0; i < c2Colors.length; i += 3) {
      c2Colors[i] = 0.22     // R verde medio
      c2Colors[i + 1] = 0.44 // G verde medio
      c2Colors[i + 2] = 0.17 // B verde medio
    }
    cone2.setAttribute('color', new THREE.BufferAttribute(c2Colors, 3))

    // 4. Copa nivel 3 (cima)
    const cone3 = new THREE.ConeGeometry(0.7, 1.2, 6)
    cone3.translate(0, 4.5, 0)
    const c3Colors = new Float32Array(cone3.attributes.position.count * 3)
    for (let i = 0; i < c3Colors.length; i += 3) {
      c3Colors[i] = 0.28     // R verde claro
      c3Colors[i + 1] = 0.52 // G verde claro
      c3Colors[i + 2] = 0.21 // B verde claro
    }
    cone3.setAttribute('color', new THREE.BufferAttribute(c3Colors, 3))

    const merged = mergeGeometries([trunk, cone1, cone2, cone3])
    if (merged) {
      merged.computeVertexNormals()
      return merged
    }
    return new THREE.BoxGeometry(1, 2, 1)
  }, [])

  // Material estilizado con vertex colors para alto rendimiento
  const treeMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.8,
      metalness: 0.05,
      flatShading: true,
    })
  }, [])

  // Generar posiciones de árboles proceduralmente
  const treeData = useMemo(() => {
    if (biomeDensity === 0) return []

    const trees: Array<{
      position: THREE.Vector3
      rotation: number
      scale: number
    }> = []

    const worldX = chunkX * chunkSize
    const worldZ = chunkZ * chunkSize

    // Número moderado de árboles para fluidez total
    const treeCount = Math.floor(chunkSize * chunkSize * biomeDensity * 0.005)

    for (let i = 0; i < treeCount; i++) {
      const seed = (chunkX * 73856093) ^ (chunkZ * 19349663) ^ (i * 83492791)
      const random = Math.abs(Math.sin(seed))

      const localX = (random * chunkSize) % chunkSize
      const localZ = ((random * 7919) * chunkSize) % chunkSize

      const x = worldX + localX
      const z = worldZ + localZ

      let y = 0
      if (terrainManager) {
        y = terrainManager.getHeightAt(x, z)
        // No colocar árboles bajo el agua (nivel del agua ~1.4) ni en picos rocosos muy altos
        if (y < 2.0 || y > 15.0) continue
      }

      trees.push({
        position: new THREE.Vector3(x, y, z),
        rotation: random * Math.PI * 2,
        scale: 0.7 + (random % 0.6), // Escala entre 0.7 y 1.3
      })
    }

    return trees
  }, [chunkX, chunkZ, chunkSize, biomeDensity, terrainManager])

  // Configurar matrices de instanciación
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
  }, [treeData])

  if (treeData.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[treeGeometry, treeMaterial, treeData.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  )
}
