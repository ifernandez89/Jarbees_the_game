'use client'

import React, { useRef, useEffect, useMemo, Suspense, Component, ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'
import { getAssetPath } from '@/utils/assetPath'
import type { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: { [key: string]: THREE.Mesh }
  materials: { [key: string]: THREE.Material }
}

// Error Boundary para evitar caídas si un asset GLTF no carga
class WildlifeErrorBoundary extends Component<
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
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

/**
 * Modelo individual de Colibrí volador con animación integrada y vuelo dinámico
 */
function HummingbirdEntity({
  initialOffset,
  flightSeed,
}: {
  initialOffset: [number, number, number]
  flightSeed: number
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const modelRef = useRef<THREE.Group>(null!)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const playerPos = useGameStore((state) => state.position)
  const isPaused = useGameStore((state) => state.isPaused)

  const gltf = useGLTF(getAssetPath('/models/colibri.glb')) as GLTFResult
  const sceneClone = useMemo(() => gltf.scene.clone(true), [gltf.scene])

  // Reproducir animación 'flight' o 'hover'
  useEffect(() => {
    if (gltf.animations && gltf.animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(sceneClone)
      const flightClip =
        gltf.animations.find((a) => a.name.toLowerCase().includes('flight')) ||
        gltf.animations.find((a) => a.name.toLowerCase().includes('hover')) ||
        gltf.animations[0]

      if (flightClip) {
        const action = mixerRef.current.clipAction(flightClip)
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.play()
      }
    }
    return () => {
      mixerRef.current?.stopAllAction()
    }
  }, [gltf.animations, sceneClone])

  // Estado de vuelo en ráfagas (darting flight característico del colibrí)
  const flightState = useRef({
    currentPos: new THREE.Vector3(...initialOffset),
    targetOffset: new THREE.Vector3(...initialOffset),
    hoverTimer: 0,
    burstVelocity: new THREE.Vector3(),
  })

  useFrame((state, delta) => {
    if (!groupRef.current || isPaused) return

    // Actualizar animación de aleteo rápido
    if (mixerRef.current) {
      mixerRef.current.update(delta * 1.8) // Aleteo vibrante de alta frecuencia
    }

    const t = state.clock.getElapsedTime() + flightSeed
    const fs = flightState.current

    // Movimiento: Se mantiene en el entorno relativo de la abeja (infinito)
    const px = playerPos[0]
    const py = playerPos[1]
    const pz = playerPos[2]

    // Comportamiento de vuelo a saltos rápidos:
    fs.hoverTimer += delta
    if (fs.hoverTimer > 3.0 + Math.sin(flightSeed) * 1.5) {
      // Elegir nuevo destino cercano en el cielo
      fs.targetOffset.set(
        (Math.sin(t * 0.7) * 45) + (Math.cos(flightSeed * 3) * 20),
        Math.max(1.8, Math.min(18, 4.0 + Math.sin(t * 1.2) * 5)),
        (Math.cos(t * 0.6) * 45) - 30 // Ligeramente adelantado en la ruta
      )
      fs.hoverTimer = 0
    }

    // Suavizado hacia la posición objetivo con ráfagas
    const worldTarget = new THREE.Vector3(
      px + fs.targetOffset.x,
      py + fs.targetOffset.y,
      pz + fs.targetOffset.z
    )

    // Micro-vibración de suspensión en el aire
    const microJitterX = Math.sin(t * 22) * 0.05
    const microJitterY = Math.cos(t * 25) * 0.06

    fs.currentPos.lerp(worldTarget, delta * 2.2)

    groupRef.current.position.set(
      fs.currentPos.x + microJitterX,
      fs.currentPos.y + microJitterY,
      fs.currentPos.z
    )

    // Orientación natural hacia la dirección del vuelo
    const moveDir = new THREE.Vector3().subVectors(worldTarget, fs.currentPos)
    if (moveDir.lengthSq() > 0.1) {
      const targetRotationY = Math.atan2(moveDir.x, moveDir.z) + Math.PI
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotationY,
        delta * 4
      )
      // Inclinación aerodinámica
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -0.15, delta * 3)
    }
  })

  // Escala calibrada: ~0.70m de envergadura (3x de la abeja, proporcional y nítido)
  return (
    <group ref={groupRef} position={initialOffset}>
      <group ref={modelRef} scale={11.5} rotation={[0, 0, 0]}>
        <primitive object={sceneClone} />
      </group>
    </group>
  )
}

/**
 * Modelo individual de Mariposa con aleteo suave y vuelo ondulante
 */
function ButterflyEntity({
  initialOffset,
  flightSeed,
}: {
  initialOffset: [number, number, number]
  flightSeed: number
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const modelRef = useRef<THREE.Group>(null!)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const playerPos = useGameStore((state) => state.position)
  const isPaused = useGameStore((state) => state.isPaused)

  const gltf = useGLTF(getAssetPath('/models/butterfly.glb')) as GLTFResult
  const sceneClone = useMemo(() => gltf.scene.clone(true), [gltf.scene])

  // Reproducir animación 'hover' o 'idle' de la mariposa
  useEffect(() => {
    if (gltf.animations && gltf.animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(sceneClone)
      const clip =
        gltf.animations.find((a) => a.name.toLowerCase().includes('hover')) ||
        gltf.animations.find((a) => a.name.toLowerCase().includes('idle')) ||
        gltf.animations[0]

      if (clip) {
        const action = mixerRef.current.clipAction(clip)
        action.setLoop(THREE.LoopRepeat, Infinity)
        action.play()
      }
    }
    return () => {
      mixerRef.current?.stopAllAction()
    }
  }, [gltf.animations, sceneClone])

  const flightState = useRef({
    currentPos: new THREE.Vector3(...initialOffset),
  })

  useFrame((state, delta) => {
    if (!groupRef.current || isPaused) return

    // Animación suave de aleteo
    if (mixerRef.current) {
      mixerRef.current.update(delta * 1.1)
    }

    const t = state.clock.getElapsedTime() * 0.75 + flightSeed
    const fs = flightState.current

    // Movimiento ondulante y grácil alrededor de la abeja en el terreno infinito
    const px = playerPos[0]
    const py = playerPos[1]
    const pz = playerPos[2]

    // Órbita sinusoidal elegante y pausada
    const targetX = px + Math.sin(t * 0.8) * 35 + Math.cos(flightSeed * 2) * 15
    const targetY = Math.max(1.5, py + Math.sin(t * 2.2) * 1.8 + Math.cos(t * 0.9) * 1.2)
    const targetZ = pz + Math.cos(t * 0.7) * 35 - 20

    fs.currentPos.lerp(new THREE.Vector3(targetX, targetY, targetZ), delta * 1.5)
    groupRef.current.position.copy(fs.currentPos)

    // Rotación suave acompañando la trayectoria
    const heading = Math.sin(t * 0.8 + 0.1) - Math.sin(t * 0.8)
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      Math.atan2(Math.sin(t * 0.8), Math.cos(t * 0.7)) + Math.PI,
      delta * 3
    )
    // Suave inclinación lateral (roll)
    groupRef.current.rotation.z = Math.sin(t * 2.2) * 0.25
  })

  // Escala calibrada: ~0.48m (alrededor de 1.8x el tamaño de la abeja)
  return (
    <group ref={groupRef} position={initialOffset}>
      <group ref={modelRef} scale={5.5}>
        <primitive object={sceneClone} />
      </group>
    </group>
  )
}

/**
 * Respaldo procedural en caso de que tarde o falle la carga de un modelo
 */
function FallbackButterfly() {
  return (
    <group scale={0.4}>
      <mesh>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#f97316" />
      </mesh>
    </group>
  )
}

/**
 * Controlador de fauna voladora ambiental (Colibríes y Mariposas)
 * Mantiene un número prudente (2 mariposas y 2 colibríes) con alto rendimiento y cero sobrecarga.
 */
export function AmbientWildlife() {
  return (
    <group>
      {/* Colibríes en vuelo */}
      <WildlifeErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <HummingbirdEntity initialOffset={[-18, 4.5, -25]} flightSeed={1.23} />
          <HummingbirdEntity initialOffset={[22, 6.0, -38]} flightSeed={4.56} />
        </Suspense>
      </WildlifeErrorBoundary>

      {/* Mariposas en vuelo */}
      <WildlifeErrorBoundary fallback={<FallbackButterfly />}>
        <Suspense fallback={null}>
          <ButterflyEntity initialOffset={[-12, 2.8, -16]} flightSeed={2.34} />
          <ButterflyEntity initialOffset={[14, 3.4, -28]} flightSeed={5.67} />
        </Suspense>
      </WildlifeErrorBoundary>
    </group>
  )
}

// Precarga limpia de assets en segundo plano
try {
  useGLTF.preload(getAssetPath('/models/colibri.glb'))
  useGLTF.preload(getAssetPath('/models/butterfly.glb'))
} catch {
  // Ignorar en entorno estático inicial
}
