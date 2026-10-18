'use client'

import React, { useRef, useEffect, Component, ReactNode, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSecureGLTF } from '@/utils/useSecureGLTF'
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
    console.warn('⚠️ Fallback a abeja procedural:', error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

/**
 * Modelo GLB de la abeja:
 * - Escalado inmutable en grupo contenedor a 0.22 (3 a 4 veces más pequeña que en la captura)
 * - Rotación 180° (Math.PI en Y) para que la cabeza apunte HACIA ADELANTE (-Z) en la dirección del vuelo
 * - Centrado del modelo para rotaciones perfectas
 */
function BeeGLBModel({ modelPath }: { modelPath: string }) {
  const resolvedModelPath = getAssetPath(modelPath)
  const { scene, animations } = useSecureGLTF(resolvedModelPath) as GLTFResult
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)

  // Configurar materiales
  useEffect(() => {
    if (!scene) return
    scene.traverse((child) => {
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
  }, [scene])

  // Reproducir animaciones del modelo (hover continuo)
  useEffect(() => {
    if (animations && animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(scene)
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
  }, [animations, scene])

  useFrame((_, delta) => {
    if (mixerRef.current) {
      const vel = useGameStore.getState().velocity
      const animSpeed = 1.0 + (Math.abs(vel) / 8) * 0.8
      mixerRef.current.update(delta * animSpeed)
    }
  })

  // CONTENEDOR INMUTABLE:
  // - scale: 0.22 (garantiza tamaño compacto de ~18 cm, 3x a 4x menor al actual)
  // - rotation: [0, Math.PI, 0] (gira la cabeza hacia adelante -Z para que la cámara vea la espalda)
  // - position: compensa el centro de masa del modelo
  return (
    <group scale={0.22} rotation={[0, Math.PI, 0]} position={[-0.007, -0.04, -0.004]}>
      <primitive object={scene} />
    </group>
  )
}

/**
 * Abeja procedural estilizada de respaldo (mismo tamaño y orientación que el GLB)
 */
function ProceduralBee() {
  const leftWingRef = useRef<THREE.Mesh>(null!)
  const rightWingRef = useRef<THREE.Mesh>(null!)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 45
    const flap = Math.sin(t) * 0.45
    if (leftWingRef.current) leftWingRef.current.rotation.z = 0.2 + flap
    if (rightWingRef.current) rightWingRef.current.rotation.z = -0.2 - flap
  })

  return (
    <group scale={0.22} rotation={[0, Math.PI, 0]}>
      {/* Cuerpo */}
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
      {/* Cabeza y ojos hacia adelante */}
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
      {/* Alas */}
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
export function BeePlayer({ modelPath = '/models/bee.jb3d' }: BeePlayerProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const modelAnchorRef = useRef<THREE.Group>(null!)
  const velocityRef = useRef(0)
  const forwardVectorRef = useRef(new THREE.Vector3())
  const hudUpdateTimer = useRef(0)
  const accumulatedDistanceRef = useRef(0)

  // Estado del juego
  const controls = useGameStore((state) => state.controls)
  const isPaused = useGameStore((state) => state.isPaused)
  const setPosition = useGameStore((state) => state.setPosition)
  const setRotation = useGameStore((state) => state.setRotation)
  const updateDistanceTraveled = useGameStore((state) => state.updateDistanceTraveled)
  const updateAltitude = useGameStore((state) => state.updateAltitude)
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

    // Suavizar velocidad con inercia de vuelo localmente en ref (evita re-renders en React)
    velocityRef.current = THREE.MathUtils.lerp(velocityRef.current, targetSpeed, delta * 4)
    const currentVelocity = velocityRef.current

    const moveSpeed = currentVelocity * delta
    const rotationSpeed = 2.4 * delta

    // Movimiento hacia adelante a ALTURA CONSTANTE en el plano horizontal XZ:
    // La abeja no debe descender al avanzar.
    if (Math.abs(currentVelocity) > 0.01) {
      forwardVectorRef.current.set(-Math.sin(bee.rotation.y), 0, -Math.cos(bee.rotation.y))
      bee.position.addScaledVector(forwardVectorRef.current, moveSpeed)
      accumulatedDistanceRef.current += Math.abs(moveSpeed)
    }

    // Leve efecto de viento permanente y flotabilidad natural
    const wind = useGameStore.getState().wind
    if (wind && wind.speed > 0) {
      const windTime = state.clock.getElapsedTime()
      const breezeOsc = Math.sin(windTime * 1.5) * 0.3 + 0.7
      const windDriftX = wind.direction[0] * wind.speed * 0.09 * breezeOsc * delta
      const windDriftZ = wind.direction[2] * wind.speed * 0.09 * breezeOsc * delta
      bee.position.x += windDriftX
      bee.position.z += windDriftZ
    }

    // Balanceo suave en suspensión, brisa e inclinación aerodinámica de vuelo
    if (modelAnchorRef.current) {
      const t = state.clock.getElapsedTime()
      const hoverBobbing = Math.sin(t * 3.2) * 0.03
      const windSway = Math.cos(t * 1.6) * 0.02
      modelAnchorRef.current.position.y = hoverBobbing

      // Inclinación dinámica visual del modelo (Pitch al acelerar/frenar y Roll al virar)
      // Se aplica solo visualmente al modelo para que la abeja luzca aerodinámica sin alterar la altura de vuelo
      const targetPitch = controls.forward ? -0.16 : (controls.backward ? 0.12 : 0)
      const targetRoll = controls.left ? 0.35 : (controls.right ? -0.35 : 0)

      modelAnchorRef.current.rotation.x = THREE.MathUtils.lerp(
        modelAnchorRef.current.rotation.x,
        targetPitch,
        delta * 5
      )
      modelAnchorRef.current.rotation.z = THREE.MathUtils.lerp(
        modelAnchorRef.current.rotation.z,
        targetRoll + windSway,
        delta * 5
      )
    }

    // Controles de rotación (Yaw - izquierda/derecha)
    if (controls.left) {
      bee.rotation.y += rotationSpeed
    }
    if (controls.right) {
      bee.rotation.y -= rotationSpeed
    }

    // Mantener la orientación base del grupo nivelada horizontalmente
    bee.rotation.x = 0
    bee.rotation.z = 0

    // Controles de altitud (ESPACIO/E para subir rápido, SHIFT/Q para bajar)
    if (controls.up) {
      bee.position.y += 14.0 * delta
    }
    if (controls.down) {
      bee.position.y -= 12.0 * delta
    }

    // Colisión suave con terreno (mínimo 0.6m sobre el suelo)
    let minHeight = 0.8
    if (terrainManager) {
      const terrainHeight = terrainManager.getHeightAt(bee.position.x, bee.position.z)
      minHeight = terrainHeight + 0.6
    }

    // Límites de altitud: Permite ascender bien alto (hasta 82m, justo por debajo de las nubes en 85m)
    bee.position.y = Math.max(minHeight, Math.min(bee.position.y, 82))

    // Sincronizar estado global para HUD de forma optimizada (~10Hz)
    // Esto evita cientos de re-renders por segundo en la UI de React, liberando la CPU en móviles
    hudUpdateTimer.current += delta
    if (hudUpdateTimer.current >= 0.1) {
      hudUpdateTimer.current = 0
      setPosition([bee.position.x, bee.position.y, bee.position.z])
      setRotation([bee.rotation.x, bee.rotation.y, bee.rotation.z])
      updateAltitude(bee.position.y)
      setVelocity(currentVelocity)
      if (accumulatedDistanceRef.current > 0) {
        updateDistanceTraveled(accumulatedDistanceRef.current)
        accumulatedDistanceRef.current = 0
      }
    }

    // Modulación acústica refinada (volumen reducido y más agradable)
    const audio = getAudioManager()
    if (audio) {
      const isMoving = Math.abs(currentVelocity) > 0.5
      const isManeuvering = controls.forward || controls.up || controls.down || controls.left || controls.right
      const pitch = 0.88 + (Math.abs(currentVelocity) / 14) * 0.35 + (isManeuvering ? 0.04 : 0.0)
      // Volumen base sutil: 0.06 en reposo, hasta máx ~0.17 a máxima velocidad
      const buzzVolume = isMoving ? 0.10 + (Math.abs(currentVelocity) / 16) * 0.07 : 0.06

      audio.setSoundPitch('bee_buzz', pitch)
      audio.setSoundVolume('bee_buzz', buzzVolume)
    }
  })

  return (
    <group ref={groupRef} name="beePlayer" position={[0, 2, 0]}>
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

try {
  useSecureGLTF.preload(getAssetPath('/models/bee.jb3d'))
} catch {
  // Ignorar errores en precarga estática
}
