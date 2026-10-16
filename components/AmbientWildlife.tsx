'use client'

import React, { useRef, useEffect, useMemo, Suspense, Component, ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useGameStore } from '@/store/gameStore'
import { getAssetPath } from '@/utils/assetPath'
import type { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: { [key: string]: THREE.Mesh }
  materials: { [key: string]: THREE.Material }
}

// Error Boundary para depurar cualquier fallo de carga
class WildlifeErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean; errorInfo?: string }
> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(error: unknown) {
    console.warn('⚠️ Error en componente de fauna ambiental:', error)
    return { hasError: true, errorInfo: String(error) }
  }
  componentDidCatch(error: unknown) {
    console.error('Wildlife component catch:', error)
  }
  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}

/**
 * Modelo individual de Colibrí volador con SkeletonUtils y órbita activa al frente
 */
function HummingbirdEntity({
  relativeAngle,
  speedFactor = 1.0,
  flightSeed,
}: {
  relativeAngle: number
  speedFactor?: number
  flightSeed: number
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const playerPos = useGameStore((state) => state.position)
  const isPaused = useGameStore((state) => state.isPaused)

  const gltf = useGLTF(getAssetPath('/models/colibri.glb')) as GLTFResult
  
  // Clonación correcta para modelos con Armature/Esqueleto
  const sceneClone = useMemo(() => {
    const cloned = clone(gltf.scene)
    // Asegurar sombras y visibilidad de materiales
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.frustumCulled = false
      }
    })
    console.log('🐦 Colibrí instanciado con éxito')
    return cloned
  }, [gltf.scene])

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

  // Estado de vuelo
  const stateRef = useRef({
    pos: new THREE.Vector3(playerPos[0] + Math.sin(relativeAngle) * 12, playerPos[1] + 2, playerPos[2] - 18),
    targetPos: new THREE.Vector3(),
    burstTimer: 0,
    burstTarget: new THREE.Vector3(),
  })

  useFrame((state, delta) => {
    if (!groupRef.current || isPaused) return

    if (mixerRef.current) {
      mixerRef.current.update(delta * 2.2 * speedFactor)
    }

    const t = state.clock.getElapsedTime() * 1.2 + flightSeed
    const st = stateRef.current

    const px = playerPos[0]
    const py = playerPos[1]
    const pz = playerPos[2]

    // Comportamiento de ráfagas rápidas y paradas en suspensión:
    st.burstTimer += delta
    if (st.burstTimer > 2.5 + Math.sin(flightSeed * 3) * 1.0) {
      // Elegir nuevo punto de interés SIEMPRE al frente y alrededor de la abeja (-Z)
      const frontDist = 12 + (Math.sin(t * 0.8) * 0.5 + 0.5) * 18 // Entre 12m y 30m adelante
      const lateralDist = Math.sin(t * 0.9 + relativeAngle) * 16 // Entre -16m y +16m a los lados
      const heightOffset = Math.sin(t * 1.5) * 3.5 + 1.5 // Cerca de la altura de vuelo

      st.burstTarget.set(px + lateralDist, Math.max(1.5, py + heightOffset), pz - frontDist)
      st.burstTimer = 0
    }

    // Si la abeja se alejó demasiado (>55m), teleportar suavemente al frente en la trayectoria
    const currentDist = st.pos.distanceTo(new THREE.Vector3(px, py, pz))
    if (currentDist > 55) {
      st.pos.set(px + Math.sin(relativeAngle) * 10, py + 1.5, pz - 20)
    }

    // Suavizado hacia el objetivo
    const prevPos = st.pos.clone()
    st.pos.lerp(st.burstTarget, delta * 3.2 * speedFactor)

    // Micro-vibración realista de colibrí suspendido
    const jitterX = Math.sin(t * 26) * 0.04
    const jitterY = Math.cos(t * 28) * 0.05
    groupRef.current.position.set(st.pos.x + jitterX, st.pos.y + jitterY, st.pos.z)

    // Orientación hacia el sentido de desplazamiento
    const moveVector = new THREE.Vector3().subVectors(st.pos, prevPos)
    if (moveVector.lengthSq() > 0.0001) {
      const heading = Math.atan2(moveVector.x, moveVector.z) + Math.PI
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, heading, delta * 8)
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -0.2, delta * 4)
    }
  })

  // Escala visible y nítida desde la cámara: ~1.0m (18.5x de 0.055m)
  return (
    <group ref={groupRef} position={[playerPos[0], playerPos[1] + 2, playerPos[2] - 18]}>
      <group scale={18.5}>
        <primitive object={sceneClone} />
      </group>
    </group>
  )
}

/**
 * Modelo individual de Mariposa con SkeletonUtils y vuelo ondulante visible
 */
function ButterflyEntity({
  relativeAngle,
  speedFactor = 1.0,
  flightSeed,
}: {
  relativeAngle: number
  speedFactor?: number
  flightSeed: number
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const playerPos = useGameStore((state) => state.position)
  const isPaused = useGameStore((state) => state.isPaused)

  const gltf = useGLTF(getAssetPath('/models/butterfly.glb')) as GLTFResult

  // Clonación correcta para modelos con Armature
  const sceneClone = useMemo(() => {
    const cloned = clone(gltf.scene)
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.frustumCulled = false
      }
    })
    console.log('🦋 Mariposa instanciada con éxito')
    return cloned
  }, [gltf.scene])

  // Reproducir animación 'hover' o 'idle'
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

  const stateRef = useRef({
    pos: new THREE.Vector3(playerPos[0] + Math.sin(relativeAngle) * 8, playerPos[1] + 1.2, playerPos[2] - 14),
  })

  useFrame((state, delta) => {
    if (!groupRef.current || isPaused) return

    if (mixerRef.current) {
      mixerRef.current.update(delta * 1.3 * speedFactor)
    }

    const t = state.clock.getElapsedTime() * 0.9 * speedFactor + flightSeed
    const st = stateRef.current

    const px = playerPos[0]
    const py = playerPos[1]
    const pz = playerPos[2]

    // Órbita sinusoidal elegante y ondulante SIEMPRE al frente (-Z):
    const frontDistance = 10 + (Math.sin(t * 0.7) * 0.5 + 0.5) * 16 // 10m a 26m adelante
    const sideDistance = Math.sin(t * 0.8 + relativeAngle) * 14
    const verticalBobbing = Math.sin(t * 2.4) * 1.8 + Math.cos(t * 1.1) * 0.8

    const targetPos = new THREE.Vector3(
      px + sideDistance,
      Math.max(1.2, py + verticalBobbing + 0.5),
      pz - frontDistance
    )

    // Si la abeja acelera y se aleja a más de 50m, mantener en el rango visible
    if (st.pos.distanceTo(new THREE.Vector3(px, py, pz)) > 50) {
      st.pos.set(px + sideDistance, py + 1.2, pz - 15)
    }

    const prevPos = st.pos.clone()
    st.pos.lerp(targetPos, delta * 2.4)

    groupRef.current.position.copy(st.pos)

    // Rotación suave acompañando la trayectoria
    const moveVector = new THREE.Vector3().subVectors(st.pos, prevPos)
    if (moveVector.lengthSq() > 0.0001) {
      const heading = Math.atan2(moveVector.x, moveVector.z) + Math.PI
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, heading, delta * 5)
    }
    // Balanceo lateral de las alas en giro
    groupRef.current.rotation.z = Math.sin(t * 2.4) * 0.3
  })

  // Escala visible y nítida desde la cámara: ~1.15m (12.0x de 0.096m)
  return (
    <group ref={groupRef} position={[playerPos[0], playerPos[1] + 1.2, playerPos[2] - 14]}>
      <group scale={12.0}>
        <primitive object={sceneClone} />
      </group>
    </group>
  )
}

/**
 * Fauna voladora ambiental activa en el infinito
 * Los colibríes y mariposas se mantienen dinámicamente en el campo de visión de la abeja.
 */
export function AmbientWildlife() {
  return (
    <group>
      {/* Colibríes activos al frente */}
      <WildlifeErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <HummingbirdEntity relativeAngle={0.6} speedFactor={1.1} flightSeed={1.23} />
          <HummingbirdEntity relativeAngle={-0.8} speedFactor={0.9} flightSeed={4.56} />
        </Suspense>
      </WildlifeErrorBoundary>

      {/* Mariposas activas al frente */}
      <WildlifeErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <ButterflyEntity relativeAngle={-0.5} speedFactor={1.0} flightSeed={2.34} />
          <ButterflyEntity relativeAngle={0.7} speedFactor={0.85} flightSeed={5.67} />
        </Suspense>
      </WildlifeErrorBoundary>
    </group>
  )
}

try {
  useGLTF.preload(getAssetPath('/models/colibri.glb'))
  useGLTF.preload(getAssetPath('/models/butterfly.glb'))
} catch {
  // Ignorar en SSR
}
