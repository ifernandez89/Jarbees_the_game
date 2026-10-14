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
 * Modelo GLB de la abeja con auto-escalado visible (~0.75m), centrado y animación de aleteo
 */
function BeeGLBModel({ modelPath }: { modelPath: string }) {
  const resolvedModelPath = getAssetPath(modelPath)
  const { scene, animations } = useGLTF(resolvedModelPath) as GLTFResult
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  // Normalizar escala a 0.75m para que sea perfectamente visible en tercera persona
  useEffect(() => {
    if (!clonedScene) return

    const box = new THREE.Box3().setFromObject(clonedScene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)

    if (maxDim > 0) {
      const targetSize = 0.75 // Tamaño óptimo de visibilidad en tercera persona
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

  // Reproducir animaciones del modelo (hover / aleteo continuo)
  useEffect(() => {
    if (animations && animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(clonedScene)
      // Buscar clip de hover o idle o usar el primero disponible
      const clip =
        animations.find((a) => a.name.toLowerCase().includes('hover')) ||
        animations.find((a) => a.name.toLowerCase().includes('idle')) ||
        animations[0]

      if (clip) {
        const action = mixerRef.current.clipAction(clip)
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.play()
      }
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
      // Aletea siempre; acelera al avanzar
      const animSpeed = 1.0 + (Math.abs(velocity) / 8) * 0.8
      mixerRef.current.update(delta * animSpeed)
    }
  })

  return (
    <primitive
      object={clonedScene}
      rotation={[0, Math.PI, 0]} // Rotada 180° para mirar hacia el horizonte (-Z)
    />
  )
}

/**
 * Abeja procedural estilizada y visible (fallback instantáneo si aún se descarga el GLB)
 */
function ProceduralBee() {
  const leftWingRef = useRef<THREE.Mesh>(null!)
  const rightWingRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 45 // Aleteo continuo en todo momento
    const flap = Math.sin(t) * 0.45
    if (leftWingRef.current) leftWingRef.current.rotation.z = 0.2 + flap
    if (rightWingRef.current) rightWingRef.current.rotation.z = -0.2 - flap
  })

  return (
    <group scale={0.75} rotation={[0, Math.PI, 0]}>
      {/* Cuerpo a rayas doradas y oscuras */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Rayas negras contrastadas */}
      <mesh position={[0, 0, 0.08]} scale={[1.03, 1.03, 0.35]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#1e1e24" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, -0.08]} scale={[1.03, 1.03, 0.35]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#1e1e24" roughness={0.5} />
      </mesh>
      {/* Cabeza y ojos brillantes */}
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
      <mesh ref={leftWingRef} position={[-0.18, 0.18, 0.02]} rotation={[0.1, 0, 0.2]} castShadow>
        <boxGeometry args={[0.42, 0.015, 0.25]} />
        <meshStandardMaterial color="#e0f2fe" transparent opacity={0.8} roughness={0.1} />
      </mesh>
      <mesh ref={rightWingRef} position={[0.18, 0.18, 0.02]} rotation={[0.1, 0, -0.2]} castShadow>
        <boxGeometry args={[0.42, 0.015, 0.25]} />
        <meshStandardMaterial color="#e0f2fe" transparent opacity={0.8} roughness={0.1} />
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
 * Controlador principal de la abeja:
 * - NO AVANZA POR DEFECTO: Permanece aleteando y suspendida en el aire hasta que el usuario pulse W / Flecha Arriba.
 */
export function BeePlayer({ modelPath = '/models/bee.glb' }: BeePlayerProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const modelAnchorRef = useRef<THREE.Group>(null!)

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
  useFrame((state, delta) => {
    if (!groupRef.current || isPaused) return

    const bee = groupRef.current

    // VELOCIDAD DE AVANCE:
    // Por defecto es 0 (aleteando en el lugar, suspendida en el aire).
    // Solo avanza cuando el usuario presiona W o Flecha Arriba.
    let targetSpeed = 0.0
    if (controls.forward) {
      targetSpeed = 16.0 // Acelerar hacia adelante (~58 km/h) con W / Flecha Arriba
    } else if (controls.backward) {
      targetSpeed = -4.0 // Retroceso suave (~14 km/h) con S / Flecha Abajo
    }

    // Suavizar velocidad con inercia de vuelo
    const currentVelocity = THREE.MathUtils.lerp(velocity, targetSpeed, delta * 4)
    setVelocity(currentVelocity)

    const moveSpeed = currentVelocity * delta
    const rotationSpeed = 2.4 * delta

    // Movimiento hacia adelante en la dirección donde mira la abeja (-Z local)
    if (Math.abs(currentVelocity) > 0.01) {
      const forwardVector = new THREE.Vector3(0, 0, -1)
      forwardVector.applyQuaternion(bee.quaternion)
      bee.position.addScaledVector(forwardVector, moveSpeed)
      updateDistanceTraveled(Math.abs(moveSpeed))
    }

    // Balanceo suave y natural en suspensión (hover bobbing)
    if (modelAnchorRef.current) {
      const hoverBobbing = Math.sin(state.clock.getElapsedTime() * 3.2) * 0.04
      modelAnchorRef.current.position.y = hoverBobbing
    }

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

    // Colisión suave con terreno (mínimo 0.6m sobre el suelo)
    let minHeight = 0.8
    if (terrainManager) {
      const terrainHeight = terrainManager.getHeightAt(bee.position.x, bee.position.z)
      minHeight = terrainHeight + 0.6
    }

    // Límites de altitud
    bee.position.y = Math.max(minHeight, Math.min(bee.position.y, 45))

    // Actualizar estado global para cámara y HUD
    setPosition([bee.position.x, bee.position.y, bee.position.z])
    setRotation([bee.rotation.x, bee.rotation.y, bee.rotation.z])
    updateAltitude(bee.position.y)

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

    // Modulación acústica: zumbido suave en reposo, mayor al avanzar
    const audio = getAudioManager()
    if (audio) {
      const isMoving = Math.abs(currentVelocity) > 0.5
      const isManeuvering = controls.forward || controls.up || controls.down || controls.left || controls.right
      const pitch = 0.90 + (Math.abs(currentVelocity) / 14) * 0.40 + (isManeuvering ? 0.05 : 0.0)
      const buzzVolume = isMoving ? 0.32 + (Math.abs(currentVelocity) / 16) * 0.15 : 0.16

      audio.setSoundPitch('bee_buzz', pitch)
      audio.setSoundVolume('bee_buzz', buzzVolume)
    }
  })

  return (
    <group ref={groupRef} position={[0, 2, 0]}>
      <group ref={modelAnchorRef}>
        <ModelErrorBoundary fallback={<ProceduralBee />}>
          <Suspense fallback={<ProceduralBee />}>
            <BeeGLBModel modelPath={modelPath} />
          </Suspense>
        </ModelErrorBoundary>
      </group>
    </group>
  )
}

// Precarga opcional segura
try {
  useGLTF.preload(getAssetPath('/models/bee.glb'))
} catch {
  // Ignorar errores en precarga estática
}
