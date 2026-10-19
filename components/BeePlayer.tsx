'use client'

import React, { useRef, useEffect, useMemo, Component, ReactNode, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSecureGLTF } from '@/utils/useSecureGLTF'
import * as THREE from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useGameStore } from '@/store/gameStore'
import { getAudioManager } from '@/hooks/useAudio'
import { getAssetPath } from '@/utils/assetPath'
import { CHARACTER_PROFILES, CharacterId } from '@/types/characters'
import { FlightDynamics, flightRuntime } from '@/systems/FlightDynamics'
import type { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: { [key: string]: THREE.Mesh }
  materials: { [key: string]: THREE.Material }
}

interface BeePlayerProps {
  modelPath?: string
}

/** Techo de vuelo de la armadura JarBees (m). Los demás personajes conservan su límite de 82 m. */
const SUIT_CEILING = 400

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
    console.warn('⚠️ Fallback de modelo 3D activado:', error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

/**
 * 1. Modelo GLB de la Abeja Guardiana:
 * - Escala 0.22 (~18 cm)
 * - Rotación 180° en Y para volar hacia -Z
 */
function BeeGLBModel({ modelPath = '/models/bee.jb3d' }: { modelPath?: string }) {
  const resolvedModelPath = getAssetPath(modelPath)
  const { scene, animations } = useSecureGLTF(resolvedModelPath) as GLTFResult
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)

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
      mixerRef.current?.stopAllAction()
    }
  }, [animations, scene])

  useFrame((_, delta) => {
    if (mixerRef.current) {
      const vel = useGameStore.getState().velocity
      const animSpeed = 1.0 + (Math.abs(vel) / 8) * 0.8
      mixerRef.current.update(delta * animSpeed)
    }
  })

  return (
    <group scale={0.22} rotation={[0, Math.PI, 0]} position={[-0.007, -0.04, -0.004]}>
      <primitive object={scene} />
    </group>
  )
}

/**
 * 2. Modelo GLB del Colibrí Esmeralda (Jugable):
 * - Esqueleto con animación de vuelo rápido / hover
 * - Escala optimizada para cámara en 3ra persona
 */
function ColibriPlayerModel({ modelPath = '/models/colibri.jb3d' }: { modelPath?: string }) {
  const resolvedModelPath = getAssetPath(modelPath)
  const gltf = useSecureGLTF(resolvedModelPath) as GLTFResult
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)

  const sceneClone = useMemo(() => {
    const cloned = clone(gltf.scene)
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.frustumCulled = false
        const mesh = child as THREE.Mesh
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial
          mat.roughness = 0.38
          mat.metalness = 0.12
          // Garantizar que la textura difusa se muestre con colores vivos sRGB
          if (mat.map) {
            mat.map.colorSpace = THREE.SRGBColorSpace
            mat.map.needsUpdate = true
          }
          mat.needsUpdate = true
        }
      }
    })
    return cloned
  }, [gltf.scene])

  useEffect(() => {
    if (gltf.animations && gltf.animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(sceneClone)
      const clip =
        gltf.animations.find((a) => a.name.toLowerCase().includes('flight')) ||
        gltf.animations.find((a) => a.name.toLowerCase().includes('hover')) ||
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

  useFrame((_, delta) => {
    if (mixerRef.current) {
      const vel = useGameStore.getState().velocity
      const animSpeed = 1.6 + (Math.abs(vel) / 10) * 1.2
      mixerRef.current.update(delta * animSpeed)
    }
  })

  return (
    <group scale={3.2} rotation={[0, Math.PI, 0]} position={[0, -0.02, 0]}>
      <primitive object={sceneClone} />
    </group>
  )
}

/**
 * 3. Modelo GLB de la Mariposa Monarca (Jugable):
 * - Animación elegante de aleteo doble
 * - Texturas a todo color PBR sRGB
 */
function ButterflyPlayerModel({ modelPath = '/models/butterfly.jb3d' }: { modelPath?: string }) {
  const resolvedModelPath = getAssetPath(modelPath)
  const gltf = useSecureGLTF(resolvedModelPath) as GLTFResult
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)

  const sceneClone = useMemo(() => {
    const cloned = clone(gltf.scene)
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        child.frustumCulled = false
        const mesh = child as THREE.Mesh
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial
          mat.roughness = 0.48
          mat.metalness = 0.05
          if (mat.map) {
            mat.map.colorSpace = THREE.SRGBColorSpace
            mat.map.needsUpdate = true
          }
          mat.needsUpdate = true
        }
      }
    })
    return cloned
  }, [gltf.scene])

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

  useFrame((_, delta) => {
    if (mixerRef.current) {
      const vel = useGameStore.getState().velocity
      const animSpeed = 1.1 + (Math.abs(vel) / 12) * 0.7
      mixerRef.current.update(delta * animSpeed)
    }
  })

  return (
    <group scale={2.4} rotation={[0, Math.PI, 0]} position={[0, -0.03, 0]}>
      <primitive object={sceneClone} />
    </group>
  )
}

/**
 * 4. Modelo GLB de Iron Man (Mark 85 Jugable):
 * - Cinemática procedural avanzada sobre el esqueleto Mixamo de 66 huesos:
 *   * Suspensión orgánica con respiración en pecho y balanceo natural en torso
 *   * Postura heroica escalonada en piernas (rodillas ligeramente flexionadas para dar peso y vida humana)
 *   * Vuelo supersónico estilo torpedo con W (pecho arqueado, brazos aerodinámicos y cabeza al horizonte)
 *   * Viraje dinámico con inclinación (A/D): la cabeza anticipa la curva, el torso rota y el brazo exterior asiste con empuje diferencial
 *   * Frenada icónica de superhéroe con S: ambos brazos se disparan al frente con las palmas abiertas y rodillas flexionadas
 * - Propulsores de plasma integrados en las suelas de las botas y palmas (sin conos toscos)
 * - Iluminación de estudio dedicada (key & rim light) para resaltar los acabados Rojo Carmesí y Oro Titanio
 */
function IronManPlayerModel({ modelPath = '/models/jarbees_suit.jb3d' }: { modelPath?: string }) {
  const resolvedModelPath = getAssetPath(modelPath)
  const gltf = useSecureGLTF(resolvedModelPath) as GLTFResult
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const currentActionRef = useRef<THREE.AnimationAction | null>(null)
  const hoverActionRef = useRef<THREE.AnimationAction | null>(null)
  const flightActionRef = useRef<THREE.AnimationAction | null>(null)

  // Referencia para la orientación hacia adelante del modelo
  const rotatingGroupRef = useRef<THREE.Group | null>(null)
  const triggerAcrobaticFlip = useGameStore((state) => state.triggerAcrobaticFlip)

  // Asegurar restauración del cursor al desmontar
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default'
    }
  }, [])

  const sceneClone = useMemo(() => {
    const cloned = clone(gltf.scene)

    // Configurar y calibrar materiales PBR oficiales de la Armadura JarBees
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.frustumCulled = false

        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial
          const matName = mat.name || ''
          const meshName = mesh.name || ''

          if (mat.map) {
            mat.map.colorSpace = THREE.SRGBColorSpace
            mat.map.needsUpdate = true
          }

          // 1. CASCO GLADIADOR JARBEES (Texturas PBR de alta fidelidad)
          const isHelmet =
            meshName.includes('JarBees_Gladiator_Helmet') ||
            matName.includes('Helmet')

          // 2. NÚCLEO HEXAGONAL JARBEES (Reactor central cian)
          const isHexCore = meshName.includes('JarBees_Chest_HexCore')

          // 3. CARA Y OJOS ANTIGUOS DE IRON MAN (Eliminados en Stealth Black)
          const isOldIronManFace =
            (meshName.includes('JarBees_Helmet_Visor') || matName.includes('StealthBlack')) &&
            !meshName.includes('CyberVisor') &&
            !matName.includes('Cyan')

          // 4. ANTIGUO REACTOR CIRCULAR DE IRON MAN (Apagado en Carbón Stealth)
          const isOldIronManReactor =
            meshName.includes('Object_10') ||
            meshName.includes('Object_11') ||
            meshName.includes('Object_20') ||
            matName.includes('Arc_Reactor') ||
            matName.includes('Glass') ||
            matName.includes('CarbonBlack')

          if (isHexCore || meshName.includes('CyberVisor') || matName.includes('Cyan')) {
            // Núcleo hexagonal, visor cibernético y propulsores de plasma en Cian Energético
            mat.color = new THREE.Color('#55F0FF')
            mat.emissive = new THREE.Color('#55F0FF')
            mat.emissiveIntensity = 3.5
            mat.toneMapped = false
          } else if (isHelmet) {
            // El casco gladiador preserva sus texturas PBR calibradas
            if (mat.map) {
              mat.color = new THREE.Color('#ffffff')
            }
            if (matName.includes('Petroleum')) {
              mat.roughness = 0.25
              mat.metalness = 0.84
            } else if (matName.includes('Violet')) {
              mat.roughness = 0.22
              mat.metalness = 0.80
            } else if (matName.includes('Titanium')) {
              mat.roughness = 0.16
              mat.metalness = 0.90
            }
          } else if (isOldIronManFace) {
            // Cara original de Iron Man en Negro Obsidiana Polarizado puro
            mat.color = new THREE.Color('#08080c')
            mat.emissive = new THREE.Color('#000000')
            mat.emissiveIntensity = 0
            mat.roughness = 0.12
            mat.metalness = 0.92
          } else if (isOldIronManReactor) {
            // Antiguo reactor circular apagado en Negro Carbón Stealth
            mat.color = new THREE.Color('#060608')
            mat.emissive = new THREE.Color('#000000')
            mat.emissiveIntensity = 0
            mat.roughness = 0.22
            mat.metalness = 0.85
          } else if (
            matName.includes('Titanium') ||
            matName.includes('Silver_Part') ||
            meshName.includes('Plexus') ||
            meshName.includes('Gauntlet') ||
            meshName.includes('Belt')
          ) {
            // Titanio Frío (#A8C4D5, 15%) - Escudo de plexo, guanteletes con cuchillas, hebilla y biseles
            mat.color = new THREE.Color('#A8C4D5')
            mat.roughness = 0.16
            mat.metalness = 0.90
          } else if (
            matName.includes('Violet') ||
            matName.includes('Gold_Part') ||
            meshName.includes('Bicep') ||
            meshName.includes('Elbow')
          ) {
            // Violeta Profundo (#35205B, 20%) - Placas de bíceps, coderas y hombros
            mat.color = new THREE.Color('#35205B')
            mat.roughness = 0.22
            mat.metalness = 0.80
          } else if (
            matName.includes('Petroleum') ||
            matName.includes('Red_Part') ||
            meshName.includes('Boot')
          ) {
            // Azul Petróleo (#102D46, 60%) - Carrocería principal y greaves de botas
            mat.color = new THREE.Color('#102D46')
            mat.roughness = 0.26
            mat.metalness = 0.82
          }
          mat.needsUpdate = true
        }
      }
    })

    return cloned
  }, [gltf.scene])

  // Inicializar AnimationMixer con las animaciones horneadas en Blender ('hover' y 'flight')
  useEffect(() => {
    if (!gltf.animations || gltf.animations.length === 0) return

    const mixer = new THREE.AnimationMixer(sceneClone)
    mixerRef.current = mixer

    const hoverClip =
      gltf.animations.find((a) => a.name.toLowerCase().includes('hover')) || gltf.animations[0]
    const flightClip =
      gltf.animations.find((a) => a.name.toLowerCase().includes('flight'))

    if (hoverClip) {
      const hoverAction = mixer.clipAction(hoverClip)
      hoverAction.setLoop(THREE.LoopRepeat, Infinity)
      hoverAction.play()
      hoverActionRef.current = hoverAction
      currentActionRef.current = hoverAction
    }

    if (flightClip) {
      const flightAction = mixer.clipAction(flightClip)
      flightAction.setLoop(THREE.LoopRepeat, Infinity)
      flightActionRef.current = flightAction
    }

    return () => {
      mixer.stopAllAction()
    }
  }, [gltf.animations, sceneClone])

  useFrame((_, delta) => {
    const controls = useGameStore.getState().controls
    const velocity = useGameStore.getState().velocity
    const isForward = controls.forward || velocity > 1.0

    if (mixerRef.current && hoverActionRef.current) {
      const targetAction = isForward && flightActionRef.current ? flightActionRef.current : hoverActionRef.current

      if (targetAction && currentActionRef.current !== targetAction) {
        const prevAction = currentActionRef.current
        if (prevAction) {
          prevAction.fadeOut(0.35)
        }
        targetAction.reset().fadeIn(0.35).play()
        currentActionRef.current = targetAction
      }

      // Limitar el factor: a velocidades supersónicas el ciclo de animación no debe desbocarse
      const animSpeed = isForward ? 1.0 + Math.min(1, Math.abs(velocity) / 64) * 0.4 : 1.0
      mixerRef.current.update(delta * animSpeed)
    }

    // Mantener orientación frontal estable
    if (rotatingGroupRef.current) {
      rotatingGroupRef.current.rotation.y = Math.PI
    }
  })

  // Escala 1.0 (1.85m reales calibrados en el modelo GLB optimizado)
  // Posición Y=-0.10 para situar el punto de pivote y empuje exactamente en las caderas y torso
  return (
    <group
      scale={1.0}
      position={[0, -0.10, 0]}
      onClick={(e) => {
        e.stopPropagation()
        triggerAcrobaticFlip('up')
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default'
      }}
    >
      {/* =====================================================================
          ILUMINACIÓN DE ESTUDIO DEDICADA: Resalta el Azul Petróleo y Titanio Frío
          desde cualquier ángulo de cámara sin sombras oscuras planas
          ===================================================================== */}
      <pointLight position={[0, 1.2, 2.5]} intensity={2.2} color="#ffffff" distance={7} />
      <pointLight position={[0, -0.5, -2.2]} intensity={2.0} color="#55F0FF" distance={6} />
      <directionalLight position={[-2, 1.0, 1]} intensity={1.4} color="#A8C4D5" />


      {/* =====================================================================
          CÁPSULA HITBOX INVISIBLE: Permite capturar clics con total facilidad
          incluso a máxima velocidad (230 km/h) o durante maniobras rápidas
          ===================================================================== */}
      <mesh position={[0, 0.75, 0]}>
        <capsuleGeometry args={[0.65, 1.4, 8, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* =====================================================================
          GRUPO ROTATORIO ACROBÁTICO (Eje longitudinal del héroe):
          - Quieto: Rota 180° y queda mirando hacia atrás directo al usuario
          - Volando inclinado: Rota 180° y queda volando boca arriba mirando al cielo
          ===================================================================== */}
      <group ref={rotatingGroupRef} rotation={[0, Math.PI, 0]}>
        {/* Modelo 3D del personaje animado por Mixer */}
        <primitive object={sceneClone} />

        {/* =====================================================================
            ACABADO STEALTH NEGRO CARBÓN: Sin luz emisiva en el pecho
            para que el reactor y la cara permanezcan completamente negros
            ===================================================================== */}
        <mesh position={[0, 0.35, 0.04]}>
          <sphereGeometry args={[0.032, 16, 16]} />
          <meshBasicMaterial color="#060608" />
        </mesh>
      </group>
    </group>
  )
}

/**
 * Abeja procedural estilizada de respaldo
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
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.3} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.08]} scale={[1.03, 1.03, 0.35]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#1e1e24" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, -0.08]} scale={[1.03, 1.03, 0.35]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#1e1e24" roughness={0.5} />
      </mesh>
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
      <mesh ref={leftWingRef} position={[-0.18, 0.18, 0.02]} rotation={[0.1, 0, 0.2]} castShadow>
        <boxGeometry args={[0.42, 0.015, 0.25]} />
        <meshStandardMaterial color="#e0f2fe" transparent opacity={0.8} roughness={0.1} />
      </mesh>
      <mesh ref={rightWingRef} position={[0.18, 0.18, 0.02]} rotation={[0.1, 0, -0.2]} castShadow>
        <boxGeometry args={[0.42, 0.015, 0.25]} />
        <meshStandardMaterial color="#e0f2fe" transparent opacity={0.8} roughness={0.1} />
      </mesh>
      <mesh position={[0, 0, -0.32]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.04, 0.12, 8]} />
        <meshStandardMaterial color="#09090b" />
      </mesh>
    </group>
  )
}

/**
 * Renderizador del personaje activo
 */
function ActiveCharacterModel({ characterId }: { characterId: CharacterId }) {
  switch (characterId) {
    case 'colibri':
      return <ColibriPlayerModel />
    case 'butterfly':
      return <ButterflyPlayerModel />
    case 'iron_man':
      return <IronManPlayerModel />
    case 'bee':
    default:
      return <BeeGLBModel />
  }
}

/**
 * Controlador principal del personaje jugable (Abeja, Colibrí, Mariposa o Iron Man):
 * - Nombre de nodo preservado como 'beePlayer' para compatibilidad total con cámara, agua y terreno.
 * - Mismas mecánicas de vuelo suaves y reactivas: W/S para avance/freno, A/D para giro, Espacio/Shift para altitud.
 * - Inclinación aerodinámica, modulación sonora y balanceo adaptados al perfil del personaje.
 */
export function BeePlayer({ modelPath = '/models/bee.jb3d' }: BeePlayerProps) {
  const groupRef = useRef<THREE.Group>(null!)
  const modelAnchorRef = useRef<THREE.Group>(null!)
  const velocityRef = useRef(0)
  const forwardVectorRef = useRef(new THREE.Vector3())
  const hudUpdateTimer = useRef(0)
  const accumulatedDistanceRef = useRef(0)
  // JARBEES FLIGHT SYSTEM: motor de vuelo de la armadura
  const flightRef = useRef(new FlightDynamics())
  const flightWasActiveRef = useRef(false)
  const acrobaticStateRef = useRef<{
    direction: 'up' | 'down'
    progress: number
    duration: number
    lastId: number
  } | null>(null)

  // Estado del juego
  const controls = useGameStore((state) => state.controls)
  const isPaused = useGameStore((state) => state.isPaused)
  const selectedCharacter = useGameStore((state) => state.selectedCharacter)
  const acrobaticFlip = useGameStore((state) => state.acrobaticFlip)
  const setPosition = useGameStore((state) => state.setPosition)
  const setRotation = useGameStore((state) => state.setRotation)
  const updateDistanceTraveled = useGameStore((state) => state.updateDistanceTraveled)
  const updateAltitude = useGameStore((state) => state.updateAltitude)
  const setVelocity = useGameStore((state) => state.setVelocity)
  const terrainManager = useGameStore((state) => state.terrainManager)
  const setFlightTelemetry = useGameStore((state) => state.setFlightTelemetry)

  // Loop de actualización de vuelo
  useFrame((state, delta) => {
    if (!groupRef.current || isPaused) return

    const player = groupRef.current
    const profile = CHARACTER_PROFILES[selectedCharacter] || CHARACTER_PROFILES.bee
    const isIronMan = selectedCharacter === 'iron_man'

    const flight = flightRef.current
    let currentVelocity = 0
    const rotationSpeed = 2.4 * delta

    if (isIronMan) {
      // =====================================================================
      // JARBEES FLIGHT SYSTEM — vuelo con física para la armadura:
      // empuje vectorial, resistencia cuadrática con onda transónica, postquemador,
      // energía, temperatura y carga G. La simulación se integra en SUBPASOS para
      // no atravesar el terreno a velocidades supersónicas.
      // =====================================================================
      const mode = useGameStore.getState().flightMode
      const input = {
        forward: controls.forward,
        backward: controls.backward,
        left: controls.left,
        right: controls.right,
        up: controls.up,
        down: controls.down,
        boost: controls.boost,
      }
      const dt = Math.min(delta, 0.05)
      const speedEstimate = Math.hypot(flight.vx, flight.vz) + Math.abs(flight.vy)
      const steps = Math.min(12, Math.max(1, Math.ceil((speedEstimate * dt) / 5)))
      const subDt = dt / steps

      for (let i = 0; i < steps; i++) {
        const { yawDelta } = flight.step(subDt, input, player.rotation.y, player.position.y, mode)
        player.rotation.y += yawDelta
        player.position.x += flight.vx * subDt
        player.position.y += flight.vy * subDt
        player.position.z += flight.vz * subDt

        // Colisión continua con el terreno en cada subpaso
        const floorY = terrainManager
          ? terrainManager.getHeightAt(player.position.x, player.position.z) + 1.4
          : 0.8
        if (player.position.y < floorY) {
          player.position.y = floorY
          if (flight.vy < 0) flight.vy = 0
        }
        if (player.position.y > SUIT_CEILING) {
          player.position.y = SUIT_CEILING
          if (flight.vy > 0) flight.vy = 0
        }
      }

      accumulatedDistanceRef.current += Math.hypot(flight.vx, flight.vz) * dt
      currentVelocity = flight.forwardSpeed
      velocityRef.current = currentVelocity
      flightWasActiveRef.current = true
    } else {
      if (flightWasActiveRef.current) {
        flight.reset()
        flightWasActiveRef.current = false
      }

      // VELOCIDAD DE AVANCE:
      // Por defecto es 0 (suspendido en el aire).
      // Solo avanza al presionar W / Flecha Arriba.
      let targetSpeed = 0.0
      if (controls.forward) {
        targetSpeed = 16.0
      } else if (controls.backward) {
        targetSpeed = -4.0
      }

      velocityRef.current = THREE.MathUtils.lerp(velocityRef.current, targetSpeed, delta * 4.0)
      currentVelocity = velocityRef.current

      const moveSpeed = currentVelocity * delta

      // Movimiento hacia adelante a ALTURA CONSTANTE en el plano horizontal XZ:
      if (Math.abs(currentVelocity) > 0.01) {
        forwardVectorRef.current.set(-Math.sin(player.rotation.y), 0, -Math.cos(player.rotation.y))
        player.position.addScaledVector(forwardVectorRef.current, moveSpeed)
        accumulatedDistanceRef.current += Math.abs(moveSpeed)
      }

      // Controles de rotación (Yaw - izquierda/derecha)
      if (controls.left) {
        player.rotation.y += rotationSpeed
      }
      if (controls.right) {
        player.rotation.y -= rotationSpeed
      }

      // Controles de altitud (ESPACIO/E para subir rápido, SHIFT/Q para bajar)
      if (controls.up) {
        player.position.y += 14.0 * delta
      }
      if (controls.down) {
        player.position.y -= 12.0 * delta
      }

      // Colisión suave con terreno (mínimo 0.6m sobre el suelo)
      let minHeight = 0.8
      if (terrainManager) {
        const terrainHeight = terrainManager.getHeightAt(player.position.x, player.position.z)
        minHeight = terrainHeight + 0.6
      }

      // Límites de altitud: Permite ascender bien alto
      player.position.y = Math.max(minHeight, Math.min(player.position.y, 82))
    }

    // Leve efecto de viento permanente y flotabilidad natural
    const wind = useGameStore.getState().wind
    if (wind && wind.speed > 0) {
      const windTime = state.clock.getElapsedTime()
      const breezeOsc = Math.sin(windTime * 1.5) * 0.3 + 0.7
      const windDriftX = wind.direction[0] * wind.speed * 0.09 * breezeOsc * delta
      const windDriftZ = wind.direction[2] * wind.speed * 0.09 * breezeOsc * delta
      player.position.x += windDriftX
      player.position.z += windDriftZ
    }

    // Balanceo suave en suspensión, brisa e inclinación aerodinámica de vuelo
    if (modelAnchorRef.current) {
      const t = state.clock.getElapsedTime()
      const hoverAmp = profile.renderConfig.hoverBobbingAmplitude
      const hoverBobbing = Math.sin(t * 3.2) * hoverAmp
      const windSway = Math.cos(t * 1.6) * 0.02

      // Vibración estructural del traje (buffet transónico, postquemador y estampido sónico)
      const shake = isIronMan ? flightRuntime.shake : 0
      const jitterX = (Math.sin(t * 61) + Math.sin(t * 37 + 1.3)) * 0.5 * 0.03 * shake
      const jitterY = (Math.sin(t * 53 + 0.7) + Math.sin(t * 29)) * 0.5 * 0.03 * shake

      // Animación de giro acrobático discreto por toque (360° en cabeceo con arco vertical)
      if (acrobaticFlip && (!acrobaticStateRef.current || acrobaticStateRef.current.lastId !== acrobaticFlip.id)) {
        acrobaticStateRef.current = {
          direction: acrobaticFlip.direction,
          progress: 0,
          duration: 0.82,
          lastId: acrobaticFlip.id,
        }
      }

      let loopAngle = 0
      let loopAltitudeArc = 0
      if (acrobaticStateRef.current) {
        const trick = acrobaticStateRef.current
        trick.progress += delta / trick.duration
        const p = Math.min(1, trick.progress)
        const ease = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2
        const sign = trick.direction === 'up' ? 1 : -1
        loopAngle = sign * Math.PI * 2 * ease
        loopAltitudeArc = Math.sin(p * Math.PI) * (trick.direction === 'up' ? 1.9 : -1.6)

        if (p >= 1) {
          acrobaticStateRef.current = null
        }
      }

      modelAnchorRef.current.position.x = jitterX
      modelAnchorRef.current.position.y = hoverBobbing + jitterY + loopAltitudeArc

      // Inclinación dinámica visual del modelo (Pitch al acelerar/frenar y Roll al virar)
      // La armadura adopta una inclinación a -78° hacia adelante (vuelo horizontal "acostado" estilo torpedo)
      // mientras empuja o conserva velocidad; con el aerofreno (S) se endereza como freno aerodinámico.
      const isFlying = isIronMan ? controls.forward || flight.forwardSpeed > 12 : controls.forward
      let baseTargetPitch = 0
      if (controls.backward) {
        baseTargetPitch = isIronMan ? 0.22 : 0.12
      } else if (isFlying) {
        baseTargetPitch = isIronMan ? -1.36 : -0.16
      }

      const targetPitch = baseTargetPitch * profile.renderConfig.pitchMultiplier
      const targetRoll = (controls.left ? 0.38 : (controls.right ? -0.38 : 0)) * profile.renderConfig.rollMultiplier

      modelAnchorRef.current.rotation.x = THREE.MathUtils.lerp(
        modelAnchorRef.current.rotation.x,
        targetPitch,
        delta * 6
      ) + loopAngle
      modelAnchorRef.current.rotation.z = THREE.MathUtils.lerp(
        modelAnchorRef.current.rotation.z,
        targetRoll + windSway,
        delta * 5
      )
    }

    // Mantener la orientación base del grupo nivelada horizontalmente
    player.rotation.x = 0
    player.rotation.z = 0

    // Sincronizar estado global para HUD (~10Hz)
    hudUpdateTimer.current += delta
    if (hudUpdateTimer.current >= 0.1) {
      hudUpdateTimer.current = 0
      setPosition([player.position.x, player.position.y, player.position.z])
      setRotation([player.rotation.x, player.rotation.y, player.rotation.z])
      updateAltitude(player.position.y)
      setVelocity(currentVelocity)
      if (isIronMan) {
        const rt = flightRuntime
        setFlightTelemetry({
          mach: rt.mach,
          speedKmh: rt.speedKmh,
          regime: rt.regime,
          thrustPct: rt.thrustPct,
          afterburner: rt.afterburner > 0.3,
          energy: rt.energy,
          heat: rt.heat,
          gLoad: rt.gLoad,
          vertical: rt.vy,
          overheated: rt.overheated,
          lowEnergy: rt.lowEnergy,
          boomSeq: rt.boomSeq,
          boomIntensity: rt.boomIntensity,
        })
      }
      if (accumulatedDistanceRef.current > 0) {
        updateDistanceTraveled(accumulatedDistanceRef.current)
        accumulatedDistanceRef.current = 0
      }
    }

    // Modulación acústica del personaje activo y silenciado de los inactivos
    const audio = getAudioManager()
    if (audio) {
      const isMoving = Math.abs(currentVelocity) > 0.5
      const isManeuvering = controls.forward || controls.up || controls.down || controls.left || controls.right
      const { soundKey, baseVolume, maxVolume, basePitch, pitchRange } = profile.audio

      // Silenciar sonidos de los personajes inactivos
      const allSoundKeys: Array<'bee_buzz' | 'colibri_flutter' | 'butterfly_flutter' | 'iron_man_thruster'> = [
        'bee_buzz',
        'colibri_flutter',
        'butterfly_flutter',
        'iron_man_thruster',
      ]
      for (const key of allSoundKeys) {
        if (key !== soundKey) {
          audio.setSoundVolume(key, 0)
        }
      }

      // Modular sonido del personaje activo (la armadura normaliza contra 300 m/s para que el tono no se desboque)
      const maxSpeedRef = isIronMan ? 300.0 : 16.0
      const speedNorm = Math.min(1, Math.abs(currentVelocity) / maxSpeedRef)
      const pitch = basePitch + speedNorm * pitchRange + (isManeuvering ? 0.04 : 0.0)
      const currentVol = isMoving
        ? baseVolume + speedNorm * (maxVolume - baseVolume)
        : baseVolume

      audio.setSoundPitch(soundKey, pitch)
      audio.setSoundVolume(soundKey, currentVol)
    }
  })

  return (
    <group ref={groupRef} name="beePlayer" position={[0, 2, 0]}>
      <group ref={modelAnchorRef}>
        <ModelErrorBoundary fallback={<ProceduralBee />}>
          <Suspense fallback={<ProceduralBee />}>
            <ActiveCharacterModel characterId={selectedCharacter} />
          </Suspense>
        </ModelErrorBoundary>
      </group>
    </group>
  )
}

// Precarga de modelos cifrados para cambio instantáneo
try {
  useSecureGLTF.preload(getAssetPath('/models/bee.jb3d'))
  useSecureGLTF.preload(getAssetPath('/models/colibri.jb3d'))
  useSecureGLTF.preload(getAssetPath('/models/butterfly.jb3d'))
  useSecureGLTF.preload(getAssetPath('/models/jarbees_suit.jb3d'))
  useSecureGLTF.preload(getAssetPath('/models/iron_man.jb3d'))
} catch {
  // Ignorar errores en precarga estática
}
