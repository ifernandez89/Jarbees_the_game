'use client'

import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'
import { getAudioManager } from '@/hooks/useAudio'
import { getAssetPath } from '@/utils/assetPath'
import type { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: { [key: string]: THREE.Mesh }
  materials: { [key: string]: THREE.Material }
}

interface BeePlayerProps {
  modelPath?: string
}

export function BeePlayer({ modelPath = '/models/bee.glb' }: BeePlayerProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  
  // Cargar modelo GLB con resolución dinámica para GitHub Pages
  const resolvedModelPath = getAssetPath(modelPath)
  const { scene, animations } = useGLTF(resolvedModelPath) as GLTFResult
  
  // Estado del juego
  const controls = useGameStore((state) => state.controls)
  const isPaused = useGameStore((state) => state.isPaused)
  const setPosition = useGameStore((state) => state.setPosition)
  const setRotation = useGameStore((state) => state.setRotation)
  const updateDistanceTraveled = useGameStore((state) => state.updateDistanceTraveled)
  const updateAltitude = useGameStore((state) => state.updateAltitude)
  const velocity = useGameStore((state) => state.velocity)
  const setVelocity = useGameStore((state) => state.setVelocity)
  const terrainManager = useGameStore((state) => state.terrainManager)

  // Configurar materiales para asegurar colores vivos y recepción de luz
  useEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial
          mat.roughness = 0.5
          mat.metalness = 0.1
          mat.needsUpdate = true
        }
      }
    })
  }, [scene])

  // Configurar animaciones de aleteo
  useEffect(() => {
    if (animations && animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(scene)
      
      animations.forEach((clip) => {
        const action = mixerRef.current!.clipAction(clip)
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.play()
      })
      
      console.log(`✅ Abeja cargada con ${animations.length} animación(es)`)
    } else {
      console.warn('⚠️ El modelo de abeja no tiene animaciones')
    }

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
      }
    }
  }, [animations, scene])

  // Loop de actualización de vuelo
  useFrame((state, delta) => {
    if (!groupRef.current || isPaused) return

    const bee = groupRef.current

    // ACELERACIÓN HACIA EL HORIZONTE con Flecha Arriba o W
    let targetSpeed = 8.0 // Velocidad base de crucero (~29 km/h)
    if (controls.forward) {
      targetSpeed = 19.0 // Acelerar hacia adelante (~68 km/h) con flecha arriba / W
    } else if (controls.backward) {
      targetSpeed = 3.0 // Frenar / desacelerar con flecha abajo / S
    }

    // Suavizar velocidad de vuelo
    const currentVelocity = THREE.MathUtils.lerp(velocity, targetSpeed, delta * 4)
    setVelocity(currentVelocity)

    const moveSpeed = currentVelocity * delta
    const rotationSpeed = 2.4 * delta

    // Actualizar animación del aleteo (más rápida al acelerar)
    if (mixerRef.current) {
      const animationSpeed = 0.9 + (currentVelocity / 10) * 0.8
      mixerRef.current.update(delta * animationSpeed)
    }

    // Movimiento hacia adelante en la dirección donde mira la abeja (-Z local)
    const forwardVector = new THREE.Vector3(0, 0, -1)
    forwardVector.applyQuaternion(bee.quaternion)
    bee.position.addScaledVector(forwardVector, moveSpeed)

    // Controles de rotación (Yaw - izquierda/derecha)
    if (controls.left) {
      bee.rotation.y += rotationSpeed
    }
    if (controls.right) {
      bee.rotation.y -= rotationSpeed
    }

    // Controles de altitud (ESPACIO/E para subir, SHIFT/Q para bajar)
    if (controls.up) {
      bee.position.y += 8.5 * delta
    }
    if (controls.down) {
      bee.position.y -= 8.5 * delta
    }

    // Colisión suave con terreno (la abeja se mantiene mínimo 0.18m sobre el suelo)
    let minHeight = 0.3
    if (terrainManager) {
      const terrainHeight = terrainManager.getHeightAt(bee.position.x, bee.position.z)
      minHeight = terrainHeight + 0.18
    }

    // Límites de altitud (no puede ir bajo el terreno ni perderse en la estratósfera)
    bee.position.y = Math.max(minHeight, Math.min(bee.position.y, 45))

    // Actualizar estado global para cámara y HUD
    setPosition([bee.position.x, bee.position.y, bee.position.z])
    setRotation([bee.rotation.x, bee.rotation.y, bee.rotation.z])
    updateAltitude(bee.position.y)
    updateDistanceTraveled(moveSpeed)

    // Inclinación dinámica de vuelo:
    // Cabeceo (Pitch) al acelerar o frenar
    const targetPitch = controls.forward ? -0.16 : (controls.backward ? 0.12 : 0)
    bee.rotation.x = THREE.MathUtils.lerp(bee.rotation.x, targetPitch, delta * 5)

    // Alabeo (Roll) al virar
    if (controls.left) {
      bee.rotation.z = THREE.MathUtils.lerp(bee.rotation.z, 0.35, delta * 5)
    } else if (controls.right) {
      bee.rotation.z = THREE.MathUtils.lerp(bee.rotation.z, -0.35, delta * 5)
    } else {
      bee.rotation.z = THREE.MathUtils.lerp(bee.rotation.z, 0, delta * 5)
    }

    // Modulación acústica en tiempo real según velocidad y maniobras
    const audio = getAudioManager()
    if (audio) {
      const isManeuvering = controls.forward || controls.up || controls.down || controls.left || controls.right
      const maneuverBoost = isManeuvering ? 0.08 : 0.0
      const pitch = 0.95 + (currentVelocity / 14) * 0.35 + maneuverBoost
      const buzzVolume = 0.30 + (currentVelocity / 18) * 0.15 + (isManeuvering ? 0.05 : 0.0)
      
      audio.setSoundPitch('bee_buzz', pitch)
      audio.setSoundVolume('bee_buzz', buzzVolume)
    }
  })

  return (
    <group ref={groupRef} position={[0, 2, 0]}>
      {/* Achicada a la mitad (scale 0.0625) y rotada 180° (Math.PI) para mirar hacia el horizonte */}
      <primitive object={scene} scale={0.0625} rotation={[0, Math.PI, 0]} />
    </group>
  )
}

// Precargar el modelo con ruta adaptada a GitHub Pages
useGLTF.preload(getAssetPath('/models/bee.glb'))
