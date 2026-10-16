'use client'

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useGameStore } from '@/store/gameStore'
import { TimeOfDay } from '@/hooks/useDayNightCycle'

interface CloudsProps {
  timeOfDay: TimeOfDay
}

export function Clouds({ timeOfDay }: CloudsProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const { camera } = useThree()
  const wind = useGameStore((state) => state.wind)

  // Geometría estilizada de nube tipo cumulus (low-poly puffy clusters)
  const cloudGeometry = useMemo(() => {
    const geometries: THREE.BufferGeometry[] = []

    // 5 a 6 esferas achatadas interconectadas para formar una nube esponjosa
    const parts = [
      { radius: 14, pos: [0, 0, 0], scale: [1.6, 0.7, 1.2] },
      { radius: 11, pos: [-12, -2, 2], scale: [1.3, 0.65, 1.1] },
      { radius: 12, pos: [11, -1, -2], scale: [1.4, 0.65, 1.1] },
      { radius: 9, pos: [-4, 5, 0], scale: [1.2, 0.75, 1.0] },
      { radius: 8, pos: [6, 4, 3], scale: [1.1, 0.7, 1.0] },
    ]

    parts.forEach(({ radius, pos, scale }) => {
      const sphere = new THREE.DodecahedronGeometry(radius, 1)
      sphere.scale(scale[0], scale[1], scale[2])
      sphere.translate(pos[0], pos[1], pos[2])
      geometries.push(sphere)
    })

    const merged = mergeGeometries(geometries)
    if (merged) {
      merged.computeVertexNormals()
      return merged
    }
    return new THREE.BoxGeometry(20, 10, 20)
  }, [])

  // Material de nube reactivo a la luz solar y lunar
  const cloudMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true,
      transparent: true,
      opacity: 0.92,
      depthWrite: true,
    })
  }, [])

  // Nubes distribuidas en un domo aéreo
  const cloudInstances = useMemo(() => {
    const clouds: Array<{
      x: number
      y: number
      z: number
      scale: number
      speedFactor: number
      rotationY: number
    }> = []

    const cloudCount = 18
    const areaRadius = 380

    for (let i = 0; i < cloudCount; i++) {
      const angle = (i / cloudCount) * Math.PI * 2 + Math.random() * 0.3
      const dist = 90 + Math.random() * (areaRadius - 90)
      clouds.push({
        x: Math.cos(angle) * dist,
        y: 85 + Math.random() * 45, // Altura entre 85m y 130m
        z: Math.sin(angle) * dist - 80,
        scale: 0.7 + Math.random() * 0.8,
        speedFactor: 0.8 + Math.random() * 0.5,
        rotationY: Math.random() * Math.PI * 2,
      })
    }
    return clouds
  }, [])

  // Animación continua: desplazamiento por viento y tinte de color dinámico
  useFrame((state, delta) => {
    if (!groupRef.current) return

    // Mantener las nubes orbitando centradas respecto a la posición de la cámara
    groupRef.current.position.x = camera.position.x
    groupRef.current.position.z = camera.position.z

    // Color de las nubes según la hora del día
    let targetCloudColor = new THREE.Color('#ffffff')
    let targetOpacity = 0.92

    if (timeOfDay.timeOfDay === 'dawn') {
      targetCloudColor = new THREE.Color('#ffc1a1') // Rosa melocotón
    } else if (timeOfDay.timeOfDay === 'dusk') {
      targetCloudColor = new THREE.Color('#ff976a') // Naranja cálido
    } else if (timeOfDay.timeOfDay === 'night') {
      targetCloudColor = new THREE.Color('#283354') // Azul lunar
      targetOpacity = 0.65
    } else {
      targetCloudColor = new THREE.Color('#ffffff') // Blanco puro día
    }

    cloudMaterial.color.lerp(targetCloudColor, delta * 2)
    cloudMaterial.opacity = THREE.MathUtils.lerp(cloudMaterial.opacity, targetOpacity, delta * 2)

    // Movimiento individual de nubes según el vector de viento
    const windSpeed = (wind?.speed || 1.8) * 4.0
    const windDir = wind?.direction || [0.7, 0, -0.7]

    groupRef.current.children.forEach((child, i) => {
      const inst = cloudInstances[i]
      if (!inst) return

      inst.x += windDir[0] * windSpeed * inst.speedFactor * delta
      inst.z += windDir[2] * windSpeed * inst.speedFactor * delta

      // Wrap-around si se alejan más de 400 unidades
      const maxDist = 380
      if (inst.x > maxDist) inst.x = -maxDist
      if (inst.x < -maxDist) inst.x = maxDist
      if (inst.z > maxDist) inst.z = -maxDist
      if (inst.z < -maxDist) inst.z = maxDist

      child.position.set(inst.x, inst.y, inst.z)
      child.rotation.y = inst.rotationY
      child.scale.setScalar(inst.scale)
    })
  })

  return (
    <group ref={groupRef}>
      {cloudInstances.map((_, i) => (
        <mesh
          key={i}
          geometry={cloudGeometry}
          material={cloudMaterial}
          castShadow={false}
          receiveShadow={false}
        />
      ))}
    </group>
  )
}
