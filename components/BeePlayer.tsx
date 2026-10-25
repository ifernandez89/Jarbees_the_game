'use client'

import React, { useRef, useEffect, useMemo, Component, ReactNode, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSecureGLTF } from '@/utils/useSecureGLTF'
import * as THREE from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { useGameStore, type SuitActionEmote } from '@/store/gameStore'
import { getAudioManager } from '@/hooks/useAudio'
import { getAssetPath } from '@/utils/assetPath'
import { CHARACTER_PROFILES, CharacterId } from '@/types/characters'
import { FlightDynamics, flightRuntime } from '@/systems/FlightDynamics'
import { AureliumPhaseController, injectAureliumPhaseVeil } from '@/systems/AureliumPhaseShader'
import { getGroundHeight } from '@/systems/GroundCollisionManager'
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
  const actionsMapRef = useRef<Record<string, THREE.AnimationAction>>({})
  const idleTimerRef = useRef(0)
  const phaseControllerRef = useRef(new AureliumPhaseController())

  // Estados de animación de Fase 2 (Peso, Impacto, Agacharse, Gestos)
  const crouchStateRef = useRef<'idle' | 'crouching' | 'standing'>('idle')
  const crouchStandTimerRef = useRef(0)

  const jumpStateRef = useRef<'idle' | 'start' | 'loop' | 'land'>('idle')
  const jumpTimerRef = useRef(0)

  const impactStateRef = useRef<'none' | 'heavy_land' | 'recovery'>('none')
  const impactTimerRef = useRef(0)
  const touchdownTimerRef = useRef(0)

  const prevAltitudeRef = useRef(10.0)
  const prevWorldYRef = useRef(2.0)
  const prevGroundedRef = useRef(false)
  const maxFallSpeedRef = useRef(0)
  const emoteTimerRef = useRef(0)
  const prevEmoteRef = useRef<SuitActionEmote>(null)

  // Referencia para la rotación acrobática del truco (180° sobre su eje longitudinal)
  const rotatingGroupRef = useRef<THREE.Group | null>(null)
  const currentRotY = useRef(Math.PI)
  const lastToggleRef = useRef(0)

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
            matName.includes('Helmet') ||
            matName.includes('SkullC') ||
            matName.includes('FaceP') ||
            matName.includes('TopSpike') ||
            matName.includes('TFaceP') ||
            matName.includes('Rivet')

          // 2. NÚCLEO HEXAGONAL Y VISOR CIAN (Elementos de energía activa)
          const isEnergyGlow =
            meshName.includes('JarBees_Chest_HexCore') ||
            meshName.includes('CyberVisor') ||
            matName.includes('Cyan') ||
            matName.includes('Visor') ||
            matName.includes('Lights')

          // 3. CARA Y REACTOR OBSOLETOS DE IRON MAN (Ocultos en interior)
          const isObsoleteInternal =
            meshName.includes('JarBees_Helmet_Visor') ||
            meshName.includes('Object_10') ||
            meshName.includes('Object_11') ||
            meshName.includes('Object_20') ||
            matName.includes('Arc_Reactor') ||
            matName.includes('Glass') ||
            matName.includes('StealthBlack') ||
            matName.includes('CarbonBlack')

          if (isEnergyGlow) {
            // Visor cibernético y propulsores de plasma en Cian Energético puro
            mat.color = new THREE.Color('#55F0FF')
            mat.emissive = new THREE.Color('#55F0FF')
            mat.emissiveIntensity = 3.5
            mat.toneMapped = false
          } else if (isObsoleteInternal) {
            // Estructuras internas ocultas en negro carbón mate
            mat.color = new THREE.Color('#14171c')
            mat.emissive = new THREE.Color('#000000')
            mat.emissiveIntensity = 0
            mat.roughness = 0.50
            mat.metalness = 0.20
          } else {
            // =========================================================================
            // ARMADURA MONOLÍTICA UNIFICADA EN PLATA FORJADA & ACERO RELIQUIA
            // =========================================================================
            // Aplica tanto a la pechera de ángel, casco, torso, brazos, piernas, botas y alas.
            // Para texturas horneadas en sRGB (pechera, torso, casco), se asigna #ffffff
            // para que Three.js reproduzca los detalles PBR con su luminosidad real sin oscurecerlos.
            if (mat.map) {
              mat.map.colorSpace = THREE.SRGBColorSpace
              mat.color = new THREE.Color('#ffffff')
              mat.map.needsUpdate = true
            }

            if (matName.includes('Rivet')) {
              // Remaches decorativos en latón / bronce antiguo
              mat.color = new THREE.Color('#D4AF37')
              mat.metalness = 0.55
              mat.roughness = 0.25
            } else if (
              matName.includes('Silver_Part') ||
              matName.includes('Polished') ||
              matName.includes('TopSpike') ||
              matName.includes('TFaceP') ||
              meshName.includes('Belt')
            ) {
              // Biseles, aristas musculares y cresta en plata pulida brillante
              if (!mat.map) mat.color = new THREE.Color('#F8FAFC')
              mat.roughness = 0.22
              mat.metalness = 0.45
            } else {
              // Placas principales del cuerpo (Red_Part, Gold_Part, Cuirass, Casco, Botas, Alas)
              // Metalness calibrado a 0.40 para mantener un ~60% de reflexión difusa
              // brillante bajo la luz ambiental y direccional sin volverse negro.
              if (!mat.map) mat.color = new THREE.Color('#E2E8F0')
              mat.roughness = 0.28
              mat.metalness = 0.40
            }
          }

          // Inyectar Aurelium Phase Veil (Velo de Fase Cuántico) en materiales PBR visibles
          if (!isObsoleteInternal) {
            injectAureliumPhaseVeil(mat, phaseControllerRef.current.uniforms)
          }

          mat.needsUpdate = true
        }
      }
    })

    return cloned
  }, [gltf.scene])

  // Inicializar AnimationMixer con el set completo de animaciones horneadas en Blender
  useEffect(() => {
    if (!gltf.animations || gltf.animations.length === 0) return

    const mixer = new THREE.AnimationMixer(sceneClone)
    mixerRef.current = mixer

    // Acciones de un solo ciclo (LoopOnce) con bloqueo en el último frame
    const ONCE_ACTIONS = new Set([
      'nexo_takeoff',
      'nexo_landing',
      'nexo_air_brake',
      'nexo_jump_start',
      'nexo_jump_land',
      'nexo_heavy_land',
      'nexo_recovery',
      'nexo_crouch',
      'nexo_crouch_stand',
      'nexo_flinch_torso',
      'nexo_flinch_head',
      'nexo_death_forward',
      'nexo_death_back',
      'nexo_death_left',
      'nexo_death_right',
      'nexo_tactical_interact',
      'nexo_quicklook',
      'nexo_melee_shove',
      'nexo_stumble_recovery',
      'nexo_hunter_pounce',
      'nexo_emote_salute',
      'nexo_emote_thumbs_up',
      'nexo_emote_point',
      'nexo_emote_beckon',
      'nexo_emote_ok',
      'nexo_emote_cheer',
      'nexo_emote_welcome_thumbs',
      'nexo_attack',
      'nexo_damage',
      'nexo_dead',
    ])

    const map: Record<string, THREE.AnimationAction> = {}
    gltf.animations.forEach((clip) => {
      const action = mixer.clipAction(clip)
      if (ONCE_ACTIONS.has(clip.name)) {
        action.setLoop(THREE.LoopOnce, 1)
        action.clampWhenFinished = true
      } else {
        action.setLoop(THREE.LoopRepeat, Infinity)
      }
      map[clip.name] = action
    })
    actionsMapRef.current = map

    // Postura inicial: 'nexo_idle' o 'nexo_hover'
    const initialAction =
      map['nexo_idle'] ||
      map['nexo_hover'] ||
      map['hover'] ||
      (gltf.animations[0] ? mixer.clipAction(gltf.animations[0]) : null)

    if (initialAction) {
      initialAction.play()
      currentActionRef.current = initialAction
    }

    return () => {
      mixer.stopAllAction()
    }
  }, [gltf.animations, sceneClone])

  useFrame((state, delta) => {
    const controls = useGameStore.getState().controls
    const velocity = useGameStore.getState().velocity
    const terrainManager = useGameStore.getState().terrainManager
    const activeEmote = useGameStore.getState().activeEmote
    const triggerEmote = useGameStore.getState().triggerEmote
    const playerObj = state.scene.getObjectByName('beePlayer')

    const actions = actionsMapRef.current
    if (mixerRef.current && Object.keys(actions).length > 0) {
      const isGroundedFromStore = useGameStore.getState().isGrounded
      let isGrounded = false
      let altAboveGround = 10.0

      if (playerObj) {
        const floorY = terrainManager
          ? terrainManager.getHeightAt(playerObj.position.x, playerObj.position.z) + 1.4
          : 0.8
        altAboveGround = Math.max(0, playerObj.position.y - floorY)
        isGrounded = isGroundedFromStore
      }

      // Velocidad real del traje sincronizada a 60 Hz directamente desde FlightDynamics
      const forwardSpeed = flightRuntime.forwardSpeed
      const isInFlightMode = !isGrounded
      const isFlyingForward = isInFlightMode && (controls.forward || controls.boost || forwardSpeed > 1.8)

      // Si el usuario está en modo de vuelo, limpiar de inmediato cualquier estado residual terrestre
      if (isInFlightMode) {
        jumpStateRef.current = 'idle'
        jumpTimerRef.current = 0
        crouchStateRef.current = 'idle'
        crouchStandTimerRef.current = 0
        if (impactStateRef.current !== 'none') {
          impactStateRef.current = 'none'
          impactTimerRef.current = 0
        }
      } else if (controls.forward || controls.backward || controls.boost || controls.jump) {
        // Si el usuario presiona controles en tierra, romper de inmediato cualquier impacto, agachado o aterrizaje previo
        if (impactStateRef.current !== 'none') {
          impactStateRef.current = 'none'
          impactTimerRef.current = 0
        }
        if (jumpStateRef.current === 'land') {
          jumpStateRef.current = 'idle'
        }
        touchdownTimerRef.current = 0
      }

      // Velocidad vertical REAL en el espacio del mundo (m/s) para detectar caídas auténticas
      const currentWorldY = playerObj ? playerObj.position.y : 2.0
      const worldVerticalSpeed = (currentWorldY - prevWorldYRef.current) / Math.max(delta, 0.001)
      prevWorldYRef.current = currentWorldY

      // Solo acumulamos velocidad de caída si NO estamos volando activamente hacia adelante
      if (!isInFlightMode && !controls.up && !controls.boost && worldVerticalSpeed < -2.0) {
        maxFallSpeedRef.current = Math.max(maxFallSpeedRef.current, Math.abs(worldVerticalSpeed))
      }

      // Detección de impacto contra el suelo: SOLO si cae verticalmente en modo tierra
      const justLanded = isGrounded && !prevGroundedRef.current
      if (justLanded && !isFlyingForward && !controls.boost) {
        if (maxFallSpeedRef.current > 7.0) {
          // Aterrizaje pesado de superhéroe ("Three-Point Strikedown")
          impactStateRef.current = 'heavy_land'
          impactTimerRef.current = 0.93 // Duración de nexo_heavy_land
          jumpStateRef.current = 'idle'
          crouchStateRef.current = 'idle'
          touchdownTimerRef.current = 0
        } else if (jumpStateRef.current === 'loop' || jumpStateRef.current === 'start') {
          // Aterrizaje elástico de salto normal
          jumpStateRef.current = 'land'
          jumpTimerRef.current = 0.60
          touchdownTimerRef.current = 0
        } else if (controls.down || altAboveGround < 0.5) {
          // Aterrizaje heroico original JarBees al tocar suelo en descenso voluntario
          touchdownTimerRef.current = 1.20
        }
      }
      if (isInFlightMode || isGrounded) {
        maxFallSpeedRef.current = 0
      }
      prevGroundedRef.current = isGrounded

      // Máquina de estados: Impacto Pesado y Recuperación (solo en tierra)
      if (!isInFlightMode) {
        if (impactStateRef.current === 'heavy_land') {
          impactTimerRef.current -= delta
          if (impactTimerRef.current <= 0) {
            impactStateRef.current = 'recovery'
            impactTimerRef.current = 1.0 // Duración de nexo_recovery
          }
        } else if (impactStateRef.current === 'recovery') {
          impactTimerRef.current -= delta
          if (impactTimerRef.current <= 0) {
            impactStateRef.current = 'none'
          }
        }

        // Cuenta regresiva del aterrizaje heroico
        if (touchdownTimerRef.current > 0) {
          touchdownTimerRef.current -= delta
          if (touchdownTimerRef.current <= 0) {
            touchdownTimerRef.current = 0
          }
        }

        // Máquina de estados: Salto en tierra (Jump Start -> Jump Loop -> Jump Land)
        if (isGrounded && controls.jump && jumpStateRef.current === 'idle' && impactStateRef.current === 'none') {
          jumpStateRef.current = 'start'
          jumpTimerRef.current = 0.45
        }
        if (jumpStateRef.current === 'start') {
          jumpTimerRef.current -= delta
          if (jumpTimerRef.current <= 0) {
            jumpStateRef.current = 'loop'
          }
        } else if (jumpStateRef.current === 'land') {
          jumpTimerRef.current -= delta
          if (jumpTimerRef.current <= 0) {
            jumpStateRef.current = 'idle'
          }
        } else if (isGrounded && jumpStateRef.current === 'loop') {
          jumpStateRef.current = 'land'
          jumpTimerRef.current = 0.60
        }

        // Máquina de estados: Agacharse y Levantarse en tierra
        if (isGrounded && controls.crouch && impactStateRef.current === 'none' && jumpStateRef.current === 'idle') {
          crouchStateRef.current = 'crouching'
        } else if (crouchStateRef.current === 'crouching' && !controls.crouch) {
          crouchStateRef.current = 'standing'
          crouchStandTimerRef.current = 0.66
        }
        if (crouchStateRef.current === 'standing') {
          crouchStandTimerRef.current -= delta
          if (crouchStandTimerRef.current <= 0) {
            crouchStateRef.current = 'idle'
          }
        }
      }

      // Emotes cinéticos tácticos limpios de audios con derechos de autor
      prevEmoteRef.current = activeEmote

      // Control de Emotes
      const isMovingForward = controls.forward || forwardSpeed > 1.2
      const isMovingBackward = controls.backward || forwardSpeed < -1.0
      const isTurning = controls.left || controls.right

      if (activeEmote) {
        if (isMovingForward || controls.boost || controls.jump) {
          triggerEmote(null)
          emoteTimerRef.current = 0
        } else {
          emoteTimerRef.current += delta
          const duration =
            activeEmote === 'flinch_torso' || activeEmote === 'flinch_head'
              ? 0.53
              : activeEmote === 'melee_shove'
              ? 0.93
              : activeEmote === 'quicklook' || activeEmote === 'tactical_interact'
              ? 1.06
              : activeEmote === 'hunter_pounce'
              ? 1.20
              : activeEmote === 'death_forward'
              ? 1.35
              : activeEmote === 'stumble'
              ? 1.40
              : activeEmote === 'limp_walk'
              ? 3.60
              : 1.80
          if (emoteTimerRef.current >= duration) {
            triggerEmote(null)
            emoteTimerRef.current = 0
          }
        }
      }

      // Determinación de la animación objetivo según la jerarquía de estados
      let targetName = 'nexo_idle'
      let targetAnimSpeed = 1.0

      if (activeEmote === 'salute') {
        targetName = 'nexo_emote_salute'
      } else if (activeEmote === 'thumbs_up') {
        targetName = 'nexo_emote_thumbs_up'
      } else if (activeEmote === 'point') {
        targetName = 'nexo_emote_point'
      } else if (activeEmote === 'beckon') {
        targetName = 'nexo_emote_beckon'
      } else if (activeEmote === 'cheer') {
        targetName = 'nexo_emote_cheer'
      } else if (activeEmote === 'flinch_torso') {
        targetName = actions['nexo_flinch_torso'] ? 'nexo_flinch_torso' : 'nexo_damage'
      } else if (activeEmote === 'flinch_head') {
        targetName = actions['nexo_flinch_head'] ? 'nexo_flinch_head' : 'nexo_damage'
      } else if (activeEmote === 'tactical_interact') {
        targetName = 'nexo_tactical_interact'
      } else if (activeEmote === 'death_forward') {
        targetName = actions['nexo_death_forward'] ? 'nexo_death_forward' : 'nexo_dead'
      } else if (activeEmote === 'quicklook') {
        targetName = actions['nexo_quicklook'] ? 'nexo_quicklook' : 'nexo_look_around'
      } else if (activeEmote === 'melee_shove') {
        targetName = 'nexo_melee_shove'
      } else if (activeEmote === 'stumble') {
        targetName = 'nexo_stumble_recovery'
      } else if (activeEmote === 'limp_walk') {
        targetName = 'nexo_limp_walk'
      } else if (activeEmote === 'hunter_pounce') {
        targetName = 'nexo_hunter_pounce'
      } else if (isInFlightMode) {
        // --- VUELO Y SUSPENSIÓN AÉREA (Flujo continuo y postura horizontal aerodinámica) ---
        idleTimerRef.current = 0
        if (controls.backward) {
          // Frenada reactiva agresiva con repulsores y piernas en cuña
          targetName = 'nexo_air_brake'
        } else if (altAboveGround < 1.0 && controls.down && !isFlyingForward) {
          // Aterrizaje anticipatorio heroico al descender voluntariamente hacia tierra
          targetName = 'nexo_landing'
        } else if (isFlyingForward) {
          if (controls.boost || forwardSpeed > 40.0) {
            targetName = 'nexo_boost'
          } else if (controls.left) {
            targetName = 'nexo_bank_left'
          } else if (controls.right) {
            targetName = 'nexo_bank_right'
          } else {
            targetName = 'nexo_fly_forward'
          }
          targetAnimSpeed = 1.0 + Math.min(0.5, Math.abs(forwardSpeed) / 75.0)
        } else {
          // Suspensión aerodinámica activa en vuelo estacionario
          targetName = 'nexo_hover'
        }
      } else {
        // --- LOCOMOCIÓN Y ESTADOS EN TIERRA FIRME ---
        if (impactStateRef.current === 'heavy_land') {
          targetName = 'nexo_heavy_land'
        } else if (impactStateRef.current === 'recovery') {
          targetName = 'nexo_recovery'
        } else if (touchdownTimerRef.current > 0) {
          // Aterrizaje Heroico Original JarBees ("Kinetic Strikedown Touchdown")
          targetName = 'nexo_landing'
        } else if (jumpStateRef.current === 'start') {
          targetName = 'nexo_jump_start'
        } else if (jumpStateRef.current === 'loop') {
          targetName = 'nexo_jump_loop'
        } else if (jumpStateRef.current === 'land') {
          targetName = 'nexo_jump_land'
        } else if (crouchStateRef.current === 'crouching') {
          const isCrouchMoving = controls.forward || controls.backward || controls.left || controls.right || Math.abs(velocity) > 0.15
          if (isCrouchMoving && actions['nexo_crouch_walk']) {
            targetName = 'nexo_crouch_walk'
            targetAnimSpeed = Math.max(0.8, Math.min(1.4, Math.abs(velocity) / 3.0))
          } else {
            targetName = 'nexo_crouch'
          }
        } else if (crouchStateRef.current === 'standing') {
          targetName = 'nexo_crouch_stand'
        } else {
          const isMoving = controls.forward || controls.backward || Math.abs(velocity) > 0.25
          const isTurning = (controls.left || controls.right) && !isMoving

          if (controls.jump || controls.up) {
            // Despegue / salto desde reposo en tierra
            targetName = actions['nexo_takeoff'] ? 'nexo_takeoff' : 'nexo_jump_start'
          } else if (isMoving) {
            const isBack = controls.backward && !controls.forward
            if (isBack) {
              // Retroceso táctico auténtico de espaldas
              targetName = actions['nexo_walk_back'] ? 'nexo_walk_back' : 'nexo_walk'
              targetAnimSpeed = controls.boost
                ? Math.max(1.2, Math.min(2.0, Math.abs(velocity) / 4.5))
                : Math.max(0.85, Math.min(1.5, Math.abs(velocity) / 4.0))
            } else if (controls.boost || Math.abs(velocity) > 5.2) {
              targetName = actions['nexo_run'] ? 'nexo_run' : 'nexo_walk'
              // Suave curva cuadrática de cadencia entre 1.4x y 2.2x para sprint de 55 km/h (15.2 m/s):
              // Erradica el foot-sliding (patinaje sobre hielo) y produce un braceo atlético y contundente
              const speedRatio = Math.min(1.0, Math.max(0.0, (Math.abs(velocity) - 4.5) / 10.7))
              targetAnimSpeed = 1.35 + Math.pow(speedRatio, 1.25) * 0.85
            } else {
              targetName = 'nexo_walk'
              targetAnimSpeed = Math.max(0.95, Math.min(1.4, Math.abs(velocity) / 4.5))
            }
            idleTimerRef.current = 0
          } else if (isTurning) {
            targetName = controls.left ? 'nexo_turn_left' : 'nexo_turn_right'
            idleTimerRef.current = 0
          } else {
            // Reposo en tierra: alternar entre respiración nexo_idle y mirada al horizonte nexo_look_around
            idleTimerRef.current += delta
            if (idleTimerRef.current > 5.5 && idleTimerRef.current < 8.0 && actions['nexo_look_around']) {
              targetName = 'nexo_look_around'
            } else {
              if (idleTimerRef.current >= 8.0) idleTimerRef.current = 0
              targetName = 'nexo_idle'
            }
          }
        }
      }

      // Fallback a hover/flight si algún clip no existe
      let targetAction = actions[targetName]
      if (!targetAction) {
        if (isMovingForward) targetAction = actions['nexo_fly_forward'] || actions['flight']
        else targetAction = actions['nexo_hover'] || actions['hover'] || actions['nexo_idle']
      }

      if (targetAction && currentActionRef.current !== targetAction) {
        const prevAction = currentActionRef.current
        if (prevAction) {
          prevAction.fadeOut(0.24)
        }
        targetAction.reset().fadeIn(0.24).play()
        currentActionRef.current = targetAction
      }

      mixerRef.current.update(delta * targetAnimSpeed)

      // Actualizar dinámica y shader injection del Aurelium Phase Veil (Velo de Fase Cuántico)
      const isPhaseVeilActive = useGameStore.getState().isPhaseVeilActive || flightRuntime.aureliumPhase > 0.3
      const isGroundSprint = isGrounded && (controls.boost || Math.abs(velocity) > 5.5)
      const hasDamageOrFlinch = activeEmote === 'flinch_torso' || activeEmote === 'flinch_head' || activeEmote === 'stumble'
      phaseControllerRef.current.update(delta, {
        isActive: isPhaseVeilActive,
        isGroundSprint,
        isFlying: isInFlightMode,
        forwardSpeed: isInFlightMode ? forwardSpeed : velocity,
        hasDamageOrFlinch,
      })
    }

    // Suave giro acrobático de 180° sobre el eje longitudinal al hacer touch o clic sobre Iron Man:
    // - En reposo/hover: Rota 180° para mirar de frente al usuario o quedar de espaldas
    // - En vuelo inclinado hacia adelante: Rota 180° sobre su espina y vuela boca arriba mirando al cielo
    if (rotatingGroupRef.current) {
      const targetRotY = isFlipped ? 0 : Math.PI
      currentRotY.current = THREE.MathUtils.lerp(currentRotY.current, targetRotY, delta * 9.0)
      rotatingGroupRef.current.rotation.y = currentRotY.current
    }
  })

  const handleSuitTouch = (e: any) => {
    e.stopPropagation()
    const now = Date.now()
    if (now - lastToggleRef.current < 350) return
    lastToggleRef.current = now
    toggleFlip()
  }

  // Escala 1.0 (1.85m reales calibrados en el modelo GLB optimizado)
  // Posición Y=-0.10 para situar el punto de pivote y empuje exactamente en las caderas y torso
  return (
    <group
      scale={1.0}
      position={[0, -0.10, 0]}
      onClick={handleSuitTouch}
      onPointerDown={handleSuitTouch}
      onPointerOver={() => {
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default'
      }}
    >
      {/* =====================================================================
          ILUMINACIÓN DE ESTUDIO DEDICADA: Resalta la armadura en Plata Forjada
          y el relieve de la pechera de ángel desde cualquier ángulo (frontal y posterior)
          ===================================================================== */}
      <pointLight position={[0, 1.2, 2.5]} intensity={2.6} color="#ffffff" distance={8} />
      <pointLight position={[0, 1.2, -2.5]} intensity={2.2} color="#ffffff" distance={8} />
      <pointLight position={[0, -0.4, 0]} intensity={1.6} color="#55F0FF" distance={5} />
      <directionalLight position={[-2, 1.5, 1]} intensity={1.6} color="#E2E8F0" />
      <ambientLight intensity={0.5} color="#EDF2F7" />


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
  const isGroundedRef = useRef(false)
  const takeoffCooldownRef = useRef(0)

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
  const setFlightTelemetry = useGameStore((state) => state.setFlightTelemetry)
  const setGrounded = useGameStore((state) => state.setGrounded)

  // Reiniciar estado de suelo al cambiar de personaje
  useEffect(() => {
    isGroundedRef.current = false
    setGrounded(false)
  }, [selectedCharacter, setGrounded])

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
      // JARBEES FLIGHT SYSTEM — vuelo con física para la armadura y modo caminar:
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

      const surfaceY = terrainManager
        ? terrainManager.getHeightAt(player.position.x, player.position.z)
        : getGroundHeight(player.position.x, player.position.y, player.position.z, 1.22, isGroundedRef.current)

      const floorY = surfaceY + 1.05

      if (takeoffCooldownRef.current > 0) {
        takeoffCooldownRef.current -= dt
      }

      if (isGroundedRef.current) {
        // --- MODO WALK (En tierra firme) ---
        // Al presionar ESPACIO / E (jump / up), despega inmediatamente.
        // Si además está corriendo con Shift o avanzando con W, se propulsa con súper velocidad.
        const isTryingTakeoff = controls.jump || controls.up
        if (isTryingTakeoff) {
          isGroundedRef.current = false
          setGrounded(false)
          takeoffCooldownRef.current = 1.0 // Inmunidad de despegue generosa para evitar re-aterrizaje inmediato

          // Impulso vertical y separación neta de la superficie
          const hasBoost = controls.boost
          flight.vy = hasBoost ? 18.0 : 10.0
          player.position.y = floorY + 1.2

          // Conservar inercia de tierra: si venía corriendo con Shift (hasta 15.2 m/s), saltar lo lanza a velocidad de vuelo
          const forwardIntent = controls.forward ? 1 : 0
          const initialSpeed = hasBoost
            ? (forwardIntent ? Math.max(50.0, velocityRef.current * 3.5) : 16.0)
            : (forwardIntent ? Math.max(18.0, velocityRef.current) : 0)

          flight.forwardSpeed = initialSpeed
          flight.throttle = forwardIntent || hasBoost ? 1.0 : 0
          flight.afterburner = hasBoost && (forwardIntent || controls.up) ? 1.0 : 0

          const fx = -Math.sin(player.rotation.y)
          const fz = -Math.cos(player.rotation.y)
          flight.vx = fx * initialSpeed
          flight.vz = fz * initialSpeed
          flightRuntime.active = true
          flightRuntime.forwardSpeed = initialSpeed
          flightRuntime.speed = initialSpeed
          flightRuntime.speedKmh = initialSpeed * 3.6
        } else {
          // Si el suelo se desploma repentinamente más de 1.2m (borde de mesa, tejado o precipicio), entrar en caída natural
          if (player.position.y - floorY > 1.2) {
            isGroundedRef.current = false
            setGrounded(false)
          } else {
            // Mantener al personaje firme sobre la superficie del relieve (amortiguado a 55 km/h)
            player.position.y = THREE.MathUtils.damp(player.position.y, floorY, 28, dt)
          }
          flight.vy = 0
          flight.vx = 0
          flight.vz = 0
          flight.forwardSpeed = 0
          flight.throttle = 0
          flight.afterburner = 0
          // Regenerar y acondicionar sistemas en tierra para disponibilidad supersónica inmediata
          flight.energy = 100
          flight.heat = Math.max(10, flight.heat - 40 * dt)
          flight.overheated = false

          // Giro de orientación en tierra con A y D
          if (controls.left) {
            player.rotation.y += rotationSpeed
          }
          if (controls.right) {
            player.rotation.y -= rotationSpeed
          }

          // Locomoción a pie con W (adelante) y S (retroceso)
          // Sprint Supersónico Táctico duplicado a 15.2 m/s (~55 km/h) con Shift (Boost)
          const walkSpeed = controls.boost ? 15.2 : 5.0
          let moveDir = 0
          if (controls.forward) moveDir += 1
          if (controls.backward) moveDir -= 0.65

          if (moveDir !== 0) {
            const step = moveDir * walkSpeed * dt
            const fx = -Math.sin(player.rotation.y)
            const fz = -Math.cos(player.rotation.y)
            player.position.x += fx * step
            player.position.z += fz * step
            currentVelocity = moveDir * walkSpeed
            accumulatedDistanceRef.current += Math.abs(step)
          } else {
            currentVelocity = 0
          }
          velocityRef.current = currentVelocity

          // Mantener telemetría de vuelo apagada en tierra, reflejando velocidad real y Velo de Fase
          flightRuntime.active = false
          flightRuntime.speed = Math.abs(currentVelocity)
          flightRuntime.speedKmh = Math.abs(currentVelocity) * 3.6
          flightRuntime.mach = Math.abs(currentVelocity) / 340.0
          flightRuntime.regime = controls.boost && Math.abs(currentVelocity) > 5.0 ? 'transonic' : 'hover'
          flightRuntime.thrustPct = controls.boost ? 85 : controls.forward ? 35 : 0
          flightRuntime.afterburner = 0
          flightRuntime.throttle = controls.forward ? 1.0 : 0
          flightRuntime.dustKick = controls.boost && Math.abs(currentVelocity) > 6.0 ? 0.75 : 0
          flightRuntime.aureliumPhase = useGameStore.getState().isPhaseVeilActive ? 1.0 : 0
          flightRuntime.groundAltitude = 0
        }
      } else {
        // --- MODO VUELO (Simulación de vuelo y física vectorial) ---
        const speedEstimate = Math.hypot(flight.vx, flight.vz) + Math.abs(flight.vy)
        const steps = Math.min(12, Math.max(1, Math.ceil((speedEstimate * dt) / 5)))
        const subDt = dt / steps

        for (let i = 0; i < steps; i++) {
          const subSurfaceY = terrainManager
            ? terrainManager.getHeightAt(player.position.x, player.position.z)
            : getGroundHeight(player.position.x, player.position.y, player.position.z, 1.22)
          const subFloorY = subSurfaceY + 1.05
          const subAlt = Math.max(0, player.position.y - subFloorY)

          const { yawDelta } = flight.step(subDt, input, player.rotation.y, player.position.y, mode, subAlt)
          player.rotation.y += yawDelta
          player.position.x += flight.vx * subDt
          player.position.y += flight.vy * subDt
          player.position.z += flight.vz * subDt

          // Detección de aterrizaje:
          // 1. Si está en período de gracia de despegue (cooldown), no aterriza bajo ninguna circunstancia.
          // 2. Si vuela rápido (forwardSpeed > 15 m/s o con boost activo), realiza vuelo rasante sin aterrizar ni frenar a cero.
          // 3. Solo aterriza intencionalmente: con Q/Ctrl (controls.down / crouch) o al descender lentamente a velocidad casi nula.
          if (player.position.y <= subFloorY + 0.12) {
            const isAtHighSpeed = flight.forwardSpeed > 14.0 || controls.boost
            const isIntentionalLanding = controls.down || controls.crouch

            if (takeoffCooldownRef.current <= 0 && (isIntentionalLanding || (!isAtHighSpeed && flight.vy <= -0.5))) {
              player.position.y = subFloorY
              isGroundedRef.current = true
              setGrounded(true)
              flight.vy = 0
              flight.vx = 0
              flight.vz = 0
              flight.forwardSpeed = 0
              flight.throttle = 0
              flight.afterburner = 0
              break
            } else {
              // Vuelo rasante / amortiguación aerodinámica: mantener sobre el suelo sin congelar velocidad
              player.position.y = Math.max(player.position.y, subFloorY + 0.05)
              if (flight.vy < 0) {
                flight.vy = Math.max(flight.vy, -0.2)
              }
            }
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
      }
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
        targetSpeed = controls.boost ? 32.0 : 16.0
      } else if (controls.backward) {
        targetSpeed = controls.boost ? -8.0 : -4.0
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

      let minHeight = 0.8
      if (terrainManager) {
        const terrainHeight = terrainManager.getHeightAt(player.position.x, player.position.z)
        minHeight = terrainHeight + 0.6
      } else {
        const surfaceHeight = getGroundHeight(player.position.x, player.position.y, player.position.z, 1.22)
        minHeight = surfaceHeight + 0.6
      }

      // Límites de altitud: Permite ascender bien alto
      player.position.y = Math.max(minHeight, Math.min(player.position.y, 82))
    }

    const isGrounded = isIronMan && isGroundedRef.current

    // Leve efecto de viento permanente y flotabilidad natural (solo en vuelo)
    const wind = useGameStore.getState().wind
    if (wind && wind.speed > 0 && !isGrounded) {
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
      const hoverAmp = isGrounded ? 0 : profile.renderConfig.hoverBobbingAmplitude
      const hoverBobbing = Math.sin(t * 3.2) * hoverAmp
      const windSway = isGrounded ? 0 : Math.cos(t * 1.6) * 0.02

      // Vibración estructural del traje (buffet transónico, postquemador y estampido sónico)
      const shake = (isIronMan && !isGrounded) ? flightRuntime.shake : 0
      const jitterX = (Math.sin(t * 61) + Math.sin(t * 37 + 1.3)) * 0.5 * 0.03 * shake
      const jitterY = (Math.sin(t * 53 + 0.7) + Math.sin(t * 29)) * 0.5 * 0.03 * shake
      modelAnchorRef.current.position.x = jitterX
      modelAnchorRef.current.position.y = hoverBobbing + jitterY

      // Inclinación dinámica visual del modelo (Pitch al acelerar/frenar y Roll al virar)
      // En reposo/suspensión o en tierra, la espalda se mantiene 100% recta y erguida (0°).
      let baseTargetPitch = 0
      if (!isGrounded) {
        if (isIronMan) {
          if (controls.backward) {
            baseTargetPitch = 0.25 // Contragolpe hacia atrás al clavar el freno reactivo
          } else {
            // Modulación de cabeceo (Pitch) en vuelo según ascenso / descenso / velocidad
            const climbPitch = (controls.up || flight.vy > 2.0) ? 0.22 : (controls.down || flight.vy < -2.0) ? -0.25 : 0
            const speedTrim = (controls.boost || flight.forwardSpeed > 35) ? -0.10 : 0
            baseTargetPitch = climbPitch + speedTrim
          }
        } else {
          baseTargetPitch = controls.backward ? 0.12 : (controls.forward ? -0.16 : 0)
        }
      }

      const targetPitch = baseTargetPitch * profile.renderConfig.pitchMultiplier
      const targetRoll = isGrounded
        ? 0
        : (controls.left ? 0.38 : (controls.right ? -0.38 : 0)) * profile.renderConfig.rollMultiplier

      modelAnchorRef.current.rotation.x = THREE.MathUtils.lerp(
        modelAnchorRef.current.rotation.x,
        targetPitch,
        delta * (controls.backward && !isGrounded ? 8.0 : 6.0)
      )
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
          aureliumPhase: rt.aureliumPhase > 0.3,
          thermalGlow: rt.thermalGlow,
          dustKick: rt.dustKick,
          gcasActive: rt.gcasActive,
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
      const allSoundKeys: Array<'bee_buzz' | 'colibri_flutter' | 'butterfly_flutter' | 'iron_man_thruster' | 'auren_flight'> = [
        'bee_buzz',
        'colibri_flutter',
        'butterfly_flutter',
        'iron_man_thruster',
        'auren_flight',
      ]
      for (const key of allSoundKeys) {
        if (key !== soundKey) {
          audio.setSoundVolume(key, 0)
        }
      }

      // Modular sonido del personaje activo
      if (isIronMan) {
        if (isGrounded) {
          if (isMoving) {
            audio.setSoundVolume(soundKey, 0.035)
            audio.setSoundPitch(soundKey, 0.9)
          } else {
            // En reposo estático en tierra: silencio absoluto sin zumbidos
            audio.setSoundVolume(soundKey, 0.0)
            audio.setSoundPitch(soundKey, 1.0)
          }
        } else {
          // En vuelo o suspensión aérea (hovering)
          if (!isMoving && Math.abs(currentVelocity) < 0.8 && !isManeuvering) {
            // En flotación / hover quieto: SILENCIO COMPLETO, cero zumbido
            audio.setSoundVolume(soundKey, 0.0)
            audio.setSoundPitch(soundKey, 1.0)
          } else {
            const maxSpeedRef = 300.0
            const speedNorm = Math.min(1, Math.abs(currentVelocity) / maxSpeedRef)
            const pitch = basePitch + speedNorm * pitchRange + (isManeuvering ? 0.04 : 0.0)
            const currentVol = speedNorm * maxVolume
            audio.setSoundPitch(soundKey, pitch)
            audio.setSoundVolume(soundKey, currentVol)
          }
        }
      } else {
        const maxSpeedRef = 16.0
        const speedNorm = Math.min(1, Math.abs(currentVelocity) / maxSpeedRef)
        const pitch = basePitch + speedNorm * pitchRange + (isManeuvering ? 0.04 : 0.0)
        const currentVol = isMoving
          ? baseVolume + speedNorm * (maxVolume - baseVolume)
          : baseVolume

        audio.setSoundPitch(soundKey, pitch)
        audio.setSoundVolume(soundKey, currentVol)
      }
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
