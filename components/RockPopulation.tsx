'use client'

import { useRef, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useGameStore } from '@/store/gameStore'

interface RockPopulationProps {
  chunkX: number
  chunkZ: number
  chunkSize: number
  biome?: 'titicaca' | 'easter_island' | 'constellations'
}

// Densidad de rocas por bioma
const BIOME_ROCK_DENSITY = {
  titicaca: 0.55,       // Rocas andinas dispersas, monolitos y piedras de orilla
  easter_island: 0.9,   // Alta densidad de rocas volcánicas
  constellations: 0.2,  // Rocas cósmicas / meteoritos
}

export function RockPopulation({
  chunkX,
  chunkZ,
  chunkSize,
  biome = 'titicaca',
}: RockPopulationProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null!)
  const terrainManager = useGameStore((state) => state.terrainManager)

  const density = BIOME_ROCK_DENSITY[biome]

  // Geometría estilizada de rocas y megalitos tipo Archeoscope (low-poly con vertex colors)
  const rockGeometry = useMemo(() => {
    // 1. Roca principal facetada (boulder)
    const base = new THREE.DodecahedronGeometry(1.0, 0)
    
    // Deformar vértices ligeramente para forma natural asimétrica
    const pos = base.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i)
      const vy = pos.getY(i)
      const vz = pos.getZ(i)
      // Escalar Y para achatamiento natural
      pos.setXYZ(i, vx * (1.0 + (vx % 0.3)), vy * 0.75, vz * (1.0 + (vz % 0.3)))
    }
    base.computeVertexNormals()

    // 2. Pequeña roca acompañante
    const sub = new THREE.IcosahedronGeometry(0.5, 0)
    sub.translate(0.9, -0.2, 0.4)

    // Colores de roca natural (tonos pizarra, granito y musgo en la base)
    const merged = mergeGeometries([base, sub]) || base
    const count = merged.attributes.position.count
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const y = merged.attributes.position.getY(i)
      const idx = i * 3
      if (y < -0.1) {
        // Base terrosa / musgosa
        colors[idx] = 0.38
        colors[idx + 1] = 0.40
        colors[idx + 2] = 0.32
      } else {
        // Superficie de piedra granítica andina
        const shade = 0.48 + (Math.sin(i * 12.3) * 0.08)
        colors[idx] = shade
        colors[idx + 1] = shade * 0.95
        colors[idx + 2] = shade * 0.92
      }
    }

    merged.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    merged.computeVertexNormals()
    return merged
  }, [])

  // Material de roca mate estilizada
  const rockMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.92,
      metalness: 0.05,
      flatShading: true,
    })
  }, [])

  // Generación procedural determinista de rocas por chunk
  const rockData = useMemo(() => {
    if (density === 0) return []

    const rocks: Array<{
      position: THREE.Vector3
      rotation: [number, number, number]
      scale: [number, number, number]
    }> = []

    const worldX = chunkX * chunkSize
    const worldZ = chunkZ * chunkSize
    const count = Math.floor(chunkSize * chunkSize * density * 0.0035)

    for (let i = 0; i < count; i++) {
      // Semilla pseudo-aleatoria estable
      const seed = (chunkX * 1234567) ^ (chunkZ * 7654321) ^ (i * 9876543)
      const rand1 = Math.abs(Math.sin(seed * 1.1))
      const rand2 = Math.abs(Math.sin(seed * 2.7))
      const rand3 = Math.abs(Math.sin(seed * 4.3))

      const localX = (rand1 * chunkSize) % chunkSize
      const localZ = (rand2 * chunkSize) % chunkSize

      const x = worldX + localX
      const z = worldZ + localZ

      let y = 0
      if (terrainManager) {
        y = terrainManager.getHeightAt(x, z)
        // Evitar rocas sumergidas profundamente en lagos
        if (y < 1.35) continue
      }

      // Escala variable: desde pequeñas piedras de camino (0.4) hasta megalitos tipo Archeoscope (2.5)
      const baseScale = rand3 < 0.25 ? 1.8 + rand1 * 0.8 : (rand3 < 0.65 ? 0.9 + rand2 * 0.5 : 0.45 + rand1 * 0.3)

      rocks.push({
        position: new THREE.Vector3(x, y + 0.1, z),
        rotation: [rand1 * 0.2, rand2 * Math.PI * 2, rand3 * 0.2],
        scale: [baseScale * (0.8 + rand2 * 0.4), baseScale, baseScale * (0.8 + rand1 * 0.4)],
      })
    }

    return rocks
  }, [chunkX, chunkZ, chunkSize, density, terrainManager])

  useEffect(() => {
    if (!meshRef.current || rockData.length === 0) return

    const dummy = new THREE.Object3D()

    rockData.forEach((rock, i) => {
      dummy.position.copy(rock.position)
      dummy.rotation.set(...rock.rotation)
      dummy.scale.set(...rock.scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  }, [rockData])

  if (rockData.length === 0) return null

  return (
    <instancedMesh
      ref={meshRef}
      args={[rockGeometry, rockMaterial, rockData.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
    />
  )
}
