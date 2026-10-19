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
function IronManPlayerModel({ modelPath = '/models/iron_man.jb3d' }: { modelPath?: string }) {
  const resolvedModelPath = getAssetPath(modelPath)
  const gltf = useSecureGLTF(resolvedModelPath) as GLTFResult
  const mixerRef = useRef<THREE.AnimationMixer | null>(null)
  const currentActionRef = useRef<THREE.AnimationAction | null>(null)
  const hoverActionRef = useRef<THREE.AnimationAction | null>(null)
  const flightActionRef = useRef<THREE.AnimationAction | null>(null)

  // Referencia para la rotación acrobática del truco (180° sobre su eje longitudinal)
  const rotatingGroupRef = useRef<THREE.Group | null>(null)
  const currentRotY = useRef(Math.PI)

  const isFlipped = useGameStore((state) => state.isIronManFlipped)
  const toggleFlip = useGameStore((state) => state.toggleIronManFlip)

  // Asegurar restauración del cursor al desmontar
  useEffect(() => {
    return () => {
      document.body.style.cursor = 'default'
    }
  }, [])

  const sceneClone = useMemo(() => {
    const cloned = clone(gltf.scene)

    // Configurar y calibrar materiales originales PBR
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
        mesh.frustumCulled = false

        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial
          const matName = mat.name || ''

          if (mat.map) {
            mat.map.colorSpace = THREE.SRGBColorSpace
            mat.map.needsUpdate = true
          }

          if (matName.includes('Arc_Reactor')) {
            mat.color = new THREE.Color('#38bdf8')
            mat.emissive = new THREE.Color('#38bdf8')
            mat.emissiveIntensity = 4.5
            mat.toneMapped = false
          } else if (matName.includes('Lights')) {
            mat.color = new THREE.Color('#ffffff')
            mat.emissive = new THREE.Color('#ffffff')
            mat.emissiveIntensity = 3.5
            mat.toneMapped = false
          } else if (matName.includes('Red_Part')) {
            mat.color = new THREE.Color('#c21a1a') // Rojo carmesí vibrante
            mat.roughness = 0.28
            mat.metalness = 0.65
          } else if (matName.includes('Gold_Part')) {
            mat.color = new THREE.Color('#f59e0b') // Oro titanio cálido
            mat.roughness = 0.24
            mat.metalness = 0.75
          } else if (matName.includes('Silver_Part')) {
            mat.color = new THREE.Color('#f8fafc') // Plata nanotech
            mat.roughness = 0.20
            mat.metalness = 0.85
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

      const animSpeed = isForward ? 1.0 + (Math.abs(velocity) / 64) * 0.4 : 1.0
      mixerRef.current.update(delta * animSpeed)
    }

    // Suave giro acrobático de 180° sobre el eje longitudinal al hacer clic sobre Iron Man:
    // - En reposo/hover: Rota 180° para mirar de frente al usuario
    // - En vuelo inclinado hacia adelante: Rota 180° sobre su espina y vuela boca arriba mirando al cielo
    if (rotatingGroupRef.current) {
      const targetRotY = isFlipped ? 0 : Math.PI
      currentRotY.current = THREE.MathUtils.lerp(currentRotY.current, targetRotY, delta * 9.0)
      rotatingGroupRef.current.rotation.y = currentRotY.current
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
        toggleFlip()
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default'
      }}
    >
      {/* =====================================================================
          ILUMINACIÓN DE ESTUDIO DEDICADA: Resalta el Rojo Carmesí y Oro Titanio
          desde cualquier ángulo de cámara sin sombras oscuras planas
          ===================================================================== */}
      <pointLight position={[0, 1.2, 2.5]} intensity={2.2} color="#ffffff" distance={7} />
      <pointLight position={[0, -0.5, -2.2]} intensity={1.8} color="#93c5fd" distance={6} />
      <directionalLight position={[-2, 1.0, 1]} intensity={1.2} color="#fed7aa" />

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
            LUZ INTERNA OCULTA DENTRO DEL CUERPO (Detrás del Reactor Arc del pecho)
            Sin esferas ni conos flotando en el aire exterior
            ===================================================================== */}
        <mesh position={[0, 0.35, 0.04]}>
          <sphereGeometry args={[0.032, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
        <pointLight
          position={[0, 0.35, 0.10]}
          color="#38bdf8"
          intensity={2.4}
          distance={2.2}
        />
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

  // Estado del juego
  const controls = useGameStore((state) => state.controls)
  const isPaused = useGameStore((state) => state.isPaused)
  const selectedCharacter = useGameStore((state) => state.selectedCharacter)
  const setPosition = useGameStore((state) => state.setPosition)
  const setRotation = useGameStore((state) => state.setRotation)
  const updateDistanceTraveled = useGameStore((state) => state.updateDistanceTraveled)
  const updateAltitude = useGameStore((state) => state.updateAltitude)
  const setVelocity = useGameStore((state) => state.setVelocity)
  const terrainManager = useGameStore((state) => state.terrainManager)

  // Loop de actualización de vuelo
  useFrame((state, delta) => {
    if (!groupRef.current || isPaused) return

    const player = groupRef.current
    const profile = CHARACTER_PROFILES[selectedCharacter] || CHARACTER_PROFILES.bee
    const isIronMan = selectedCharacter === 'iron_man'

    // VELOCIDAD DE AVANCE:
    // Por defecto es 0 (suspendido en el aire).
    // Solo avanza al presionar W / Flecha Arriba.
    // Iron Man vuela a 64.0 m/s (~230 km/h, 4x la velocidad de la abeja de 16.0 m/s ~ 58 km/h).
    let targetSpeed = 0.0
    if (controls.forward) {
      targetSpeed = isIronMan ? 64.0 : 16.0
    } else if (controls.backward) {
      targetSpeed = isIronMan ? -16.0 : -4.0
    }

    velocityRef.current = THREE.MathUtils.lerp(
      velocityRef.current,
      targetSpeed,
      delta * (isIronMan ? 5.0 : 4.0)
    )
    const currentVelocity = velocityRef.current

    const moveSpeed = currentVelocity * delta
    const rotationSpeed = (isIronMan ? 2.8 : 2.4) * delta

    // Movimiento hacia adelante a ALTURA CONSTANTE en el plano horizontal XZ:
    if (Math.abs(currentVelocity) > 0.01) {
      forwardVectorRef.current.set(-Math.sin(player.rotation.y), 0, -Math.cos(player.rotation.y))
      player.position.addScaledVector(forwardVectorRef.current, moveSpeed)
      accumulatedDistanceRef.current += Math.abs(moveSpeed)
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
      modelAnchorRef.current.position.y = hoverBobbing

      // Inclinación dinámica visual del modelo (Pitch al acelerar/frenar y Roll al virar)
      // Iron Man adopta una inclinación a -78° hacia adelante (vuelo horizontal "acostado" estilo torpedo)
      let baseTargetPitch = 0
      if (controls.forward) {
        baseTargetPitch = isIronMan ? -1.36 : -0.16
      } else if (controls.backward) {
        baseTargetPitch = isIronMan ? 0.22 : 0.12
      }

      const targetPitch = baseTargetPitch * profile.renderConfig.pitchMultiplier
      const targetRoll = (controls.left ? 0.38 : (controls.right ? -0.38 : 0)) * profile.renderConfig.rollMultiplier

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
      player.rotation.y += rotationSpeed
    }
    if (controls.right) {
      player.rotation.y -= rotationSpeed
    }

    // Mantener la orientación base del grupo nivelada horizontalmente
    player.rotation.x = 0
    player.rotation.z = 0

    // Controles de altitud (ESPACIO/E para subir rápido, SHIFT/Q para bajar)
    const vertMultiplier = isIronMan ? 2.2 : 1.0
    if (controls.up) {
      player.position.y += 14.0 * vertMultiplier * delta
    }
    if (controls.down) {
      player.position.y -= 12.0 * vertMultiplier * delta
    }

    // Colisión suave con terreno (mínimo 0.8m sobre el suelo)
    let minHeight = 0.8
    if (terrainManager) {
      const terrainHeight = terrainManager.getHeightAt(player.position.x, player.position.z)
      minHeight = terrainHeight + (isIronMan ? 1.4 : 0.6)
    }

    // Límites de altitud: Permite ascender bien alto
    player.position.y = Math.max(minHeight, Math.min(player.position.y, 82))

    // Sincronizar estado global para HUD (~10Hz)
    hudUpdateTimer.current += delta
    if (hudUpdateTimer.current >= 0.1) {
      hudUpdateTimer.current = 0
      setPosition([player.position.x, player.position.y, player.position.z])
      setRotation([player.rotation.x, player.rotation.y, player.rotation.z])
      updateAltitude(player.position.y)
      setVelocity(currentVelocity)
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

      // Modular sonido del personaje activo
      const maxSpeedRef = isIronMan ? 64.0 : 16.0
      const pitch = basePitch + (Math.abs(currentVelocity) / maxSpeedRef) * pitchRange + (isManeuvering ? 0.04 : 0.0)
      const currentVol = isMoving
        ? baseVolume + (Math.abs(currentVelocity) / maxSpeedRef) * (maxVolume - baseVolume)
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
  useSecureGLTF.preload(getAssetPath('/models/iron_man.jb3d'))
} catch {
  // Ignorar errores en precarga estática
}
