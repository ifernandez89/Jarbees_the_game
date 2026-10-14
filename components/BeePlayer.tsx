'use client'

import React, { useRef, useEffect, useMemo, Component, ReactNode, Suspense } from 'react'
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

// Error Boundary para capturar fallos de carga del modelo 3D y usar el fallback
class ModelErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('⚠️ No se pudo cargar el modelo GLB, utilizando abeja procedural estilizada:', error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

/**
 * Modelo GLB de la abeja con auto-escalado, centrado y animación
 */
function BeeGLBModel({ modelPath }: { modelPath: string }) {
  const resolvedModelPath = getAssetPath(modelPath)
  const { scene, animations } = useGLTF(resolvedModelPath) as GLTFResult
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  // Normalizar escala y centrado para que cualquier modelo mida exactamente ~0.4 unidades
  useEffect(() => {
    if (!clonedScene) return

    const box = new THREE.Box3().setFromObject(clonedScene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)

    if (maxDim > 0) {
      const targetSize = 0.45
      const scale = targetSize / maxDim
      clonedScene.scale.setScalar(scale)

      const center = new THREE.Vector3()
      box.getCenter(center)
      clonedScene.position.set(
        -center.x * scale,
        -center.y * scale,
        -center.z * scale
      )
    }

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial
          mat.roughness = 0.4
          mat.metalness = 0.1
          mat.needsUpdate = true
        }
      }
    })
  }, [clonedScene])

  // Reproducir animaciones del modelo si existen
  useEffect(() => {
    if (animations && animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(clonedScene)
      animations.forEach((clip) => {
        const action = mixerRef.current!.clipAction(clip)
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.play()
      })
    }

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
      }
    }
  }, [animations, clonedScene])

  const velocity = useGameStore((state) => state.velocity)

  useFrame((_, delta) => {
    if (mixerRef.current) {
      const animSpeed = 1.0 + (velocity / 10) * 0.8
      mixerRef.current.update(delta * animSpeed)
    }
  })

  return (
    <primitive
      object={clonedScene}
      rotation={[0, Math.PI, 0]} // Rotada 180° para mirar hacia el frente (-Z)
    />
  )
}

/**
 * Abeja procedural estilizada de alto impacto visual (fallback instantáneo sin esperas de red)
 */
function ProceduralBee() {
  const leftWingRef = useRef<THREE.Mesh>(null!)
  const rightWingRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 45 // Aleteo rápido
    const flap = Math.sin(t) * 0.45
    if (leftWingRef.current) leftWingRef.current.rotation.z = 0.2 + flap
    if (rightWingRef.current) rightWingRef.current.rotation.z = -0.2 - flap
  })

  return (
    <group scale={0.45} rotation={[0, Math.PI, 0]}>
      {/* Cuerpo a rayas doradas y oscuras */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Rayas negras */}
      <mesh position={[0, 0, 0.08]} scale={[1.02, 1.02, 0.35]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#1e1e24" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, -0.08]} scale={[1.02, 1.02, 0.35]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#1e1e24" roughness={0.5} />
      </mesh>
      {/* Cabeza y ojos */}
      <mesh position={[0, 0, 0.28]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#18181b" roughness={0.4} />
      </mesh>
      <mesh position={[-0.09, 0.06, 0.38]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#000000" roughness={0.1} />
      </mesh>
      <mesh position={[0.09, 0.06, 0.38]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#000000" roughness={0.1} />
      </mesh>
      {/* Alas translúcidas luminosas */}
      <mesh ref={leftWingRef} position={[-0.15, 0.16, 0.02]} rotation={[0.1, 0, 0.2]} castShadow>
        <boxGeometry args={[0.38, 0.015, 0.22]} />
        <meshStandardMaterial color="#e0f2fe" transparent opacity={0.75} roughness={0.1} />
      </mesh>
      <mesh ref={rightWingRef} position={[0.15, 0.16, 0.02]} rotation={[0.1, 0, -0.2]} castShadow>
        <boxGeometry args={[0.38, 0.015, 0.22]} />
        <meshStandardMaterial color="#e0f2fe" transparent opacity={0.75} roughness={0.1} />
      </mesh>
      {/* Aguijón */}
      <mesh position={[0, 0, -0.32]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.04, 0.12, 8]} />
        <meshStandardMaterial color="#09090b" />
      </mesh>
    </group>
  )
}

/**
 * Controlador principal de la abeja (física, controles, cámara, audio)
 */
export function BeePlayer({ modelPath = '/models/bee.glb' }: BeePlayerProps) {
  const groupRef = useRef<THREE.Group>(null!)

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

  // Loop de actualización de vuelo
  useFrame((_, delta) => {
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

    // Colisión suave con terreno (la abeja se mantiene mínimo 0.35m sobre el suelo)
    let minHeight = 0.5
    if (terrainManager) {
      const terrainHeight = terrainManager.getHeightAt(bee.position.x, bee.position.z)
      minHeight = terrainHeight + 0.35
    }

    // Límites de altitud
    bee.position.y = Math.max(minHeight, Math.min(bee.position.y, 45))

    // Actualizar estado global para cámara y HUD
    setPosition([bee.position.x, bee.position.y, bee.position.z])
    setRotation([bee.rotation.x, bee.rotation.y, bee.rotation.z])
    updateAltitude(bee.position.y)
    updateDistanceTraveled(moveSpeed)

    // Inclinación dinámica de vuelo:
    const targetPitch = controls.forward ? -0.16 : (controls.backward ? 0.12 : 0)
    bee.rotation.x = THREE.MathUtils.lerp(bee.rotation.x, targetPitch, delta * 5)

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
      <ModelErrorBoundary fallback={<ProceduralBee />}>
        <Suspense fallback={<ProceduralBee />}>
          <BeeGLBModel modelPath={modelPath} />
        </Suspense>
      </ModelErrorBoundary>
    </group>
  )
}

// Precarga opcional segura
try {
  useGLTF.preload(getAssetPath('/models/bee.glb'))
} catch {
  // Ignorar errores en precarga estática
}
