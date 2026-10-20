'use client'

/**
 * JARBEES FLIGHT SYSTEM — FlightEffects
 * ---------------------------------------------------------------------------
 * Respuesta audiovisual del vuelo de la armadura (sólo activa con el traje):
 *  - Estelas de velocidad (líneas aerodinámicas) que se estiran con la velocidad.
 *  - Cono de condensación / cono de Mach en la zona transónica y supersónica.
 *  - Onda de choque estilizada (anillos expansivos) al cruzar Mach 1.
 *  - Audio procedural (viento, turbina, postquemador, buffet y estampido).
 *  - Llamas de los propulsores de las botas (SuitThrusterFlames).
 *
 * Todo lee `flightRuntime` (estado de la simulación a 60 Hz) sin pasar por React.
 */

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'
import { getAudioListener } from '@/hooks/useAudio'
import { FlightAudio } from '@/systems/FlightAudio'
import { flightRuntime, smoothstep } from '@/systems/FlightDynamics'

const UP = new THREE.Vector3(0, 1, 0)
const Z_AXIS = new THREE.Vector3(0, 0, 1)

const STREAK_COUNT = 170
const STREAK_BOX = 34

function bump(x: number, lo: number, peak: number, hi: number): number {
  if (x <= lo || x >= hi) return 0
  return x < peak ? (x - lo) / (peak - lo) : (hi - x) / (hi - peak)
}

// ---------------------------------------------------------------------------
// Material del cono de condensación con degradado (opaco en el ápice, difuso hacia atrás)
// ---------------------------------------------------------------------------
const coneVertex = /* glsl */ `
  varying float vT;
  void main() {
    vT = -position.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const coneFragment = /* glsl */ `
  uniform float uOpacity;
  uniform vec3 uColor;
  varying float vT;
  void main() {
    float a = uOpacity * smoothstep(0.0, 0.10, vT) * (1.0 - smoothstep(0.30, 1.0, vT));
    gl_FragColor = vec4(uColor, a);
  }
`

interface ShockRing {
  mesh: THREE.Mesh
  age: number
  life: number
  maxScale: number
  peak: number
  delay: number
  active: boolean
}

export function FlightEffects() {
  const { scene } = useThree()
  const playerRef = useRef<THREE.Object3D | null>(null)
  const audioRef = useRef<FlightAudio | null>(null)
  const lastBoomSeq = useRef(0)
  const streaksInitialized = useRef(false)

  const tmpVel = useRef(new THREE.Vector3())
  const tmpPos = useRef(new THREE.Vector3())

  // --- Estelas de velocidad ------------------------------------------------
  const streaks = useMemo(() => {
    const base = new Float32Array(STREAK_COUNT * 3)
    const positions = new Float32Array(STREAK_COUNT * 6)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.LineBasicMaterial({
      color: '#d8f6ff',
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    })
    const lines = new THREE.LineSegments(geometry, material)
    lines.frustumCulled = false
    lines.renderOrder = 5
    return { base, positions, geometry, material, lines }
  }, [])

  // --- Cono de condensación / Mach -----------------------------------------
  const cone = useMemo(() => {
    const geometry = new THREE.ConeGeometry(1, 1, 36, 1, true)
    geometry.translate(0, -0.5, 0) // ápice en el origen, abre hacia -Y
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: 0 },
        uColor: { value: new THREE.Color('#dff7ff') },
      },
      vertexShader: coneVertex,
      fragmentShader: coneFragment,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      fog: false,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.frustumCulled = false
    mesh.visible = false
    mesh.renderOrder = 6
    return { geometry, material, mesh }
  }, [])

  // --- Onda de choque (anillos expansivos) --------------------------------
  const rings = useMemo<ShockRing[]>(() => {
    return [0, 1, 2].map(() => {
      const geometry = new THREE.RingGeometry(0.9, 1.0, 72)
      const material = new THREE.MeshBasicMaterial({
        color: '#e6f9ff',
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.visible = false
      mesh.frustumCulled = false
      mesh.renderOrder = 7
      return { mesh, age: 0, life: 1.4, maxScale: 60, peak: 0.9, delay: 0, active: false }
    })
  }, [])

  // --- Polvo y perturbación rasante sobre el suelo (Ground Wake) -----------
  const DUST_COUNT = 90
  const dust = useMemo(() => {
    const positions = new Float32Array(DUST_COUNT * 3)
    const velocities = new Float32Array(DUST_COUNT * 3)
    const ages = new Float32Array(DUST_COUNT)
    const lives = new Float32Array(DUST_COUNT)
    for (let i = 0; i < DUST_COUNT; i++) {
      lives[i] = 0.5 + Math.random() * 0.8
      ages[i] = lives[i] // empiezan expiradas
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({
      color: '#cbb38a',
      size: 2.2,
      transparent: true,
      opacity: 0,
      blending: THREE.NormalBlending,
      depthWrite: false,
      fog: true,
    })
    const points = new THREE.Points(geometry, material)
    points.frustumCulled = false
    points.renderOrder = 4
    return { positions, velocities, ages, lives, geometry, material, points, nextIdx: 0 }
  }, [])

  // Añadir a la escena y limpiar
  useEffect(() => {
    scene.add(streaks.lines)
    scene.add(cone.mesh)
    scene.add(dust.points)
    rings.forEach((r) => scene.add(r.mesh))
    return () => {
      scene.remove(streaks.lines)
      scene.remove(cone.mesh)
      scene.remove(dust.points)
      rings.forEach((r) => {
        scene.remove(r.mesh)
        r.mesh.geometry.dispose()
        ;(r.mesh.material as THREE.Material).dispose()
      })
      streaks.geometry.dispose()
      streaks.material.dispose()
      cone.geometry.dispose()
      cone.material.dispose()
      dust.geometry.dispose()
      dust.material.dispose()
      audioRef.current?.dispose()
      audioRef.current = null
    }
  }, [scene, streaks, cone, rings, dust])

  const spawnRing = (index: number, intensity: number, delay: number) => {
    const ring = rings[index]
    const playerPos = tmpPos.current
    const dir = tmpVel.current
    dir.set(flightRuntime.vx, flightRuntime.vy, flightRuntime.vz)
    if (dir.lengthSq() < 0.01) dir.set(0, 0, -1)
    dir.normalize()
    ring.mesh.position.copy(playerPos).addScaledVector(dir, -0.5)
    ring.mesh.position.y += 0.9
    ring.mesh.quaternion.setFromUnitVectors(Z_AXIS, dir)
    ring.age = 0
    ring.delay = delay
    ring.life = intensity >= 0.9 ? 1.5 : 1.0
    ring.maxScale = intensity >= 0.9 ? 70 : 30
    ring.peak = intensity >= 0.9 ? 0.95 : 0.35
    ring.active = true
  }

  useFrame((_, delta) => {
    const rt = flightRuntime
    const store = useGameStore.getState()

    if (!playerRef.current) {
      playerRef.current = scene.getObjectByName('beePlayer') || null
    }
    const player = playerRef.current

    // --- Audio procedural (creado de forma perezosa cuando existe el AudioListener) ---
    if (!audioRef.current) {
      const listener = getAudioListener()
      if (listener) audioRef.current = new FlightAudio(listener.context as AudioContext)
    }
    if (audioRef.current) {
      const vol = store.audioEnabled && !store.isPaused ? Math.min(1, store.sfxVolume * 1.15) : 0
      audioRef.current.update(rt, vol)
    }

    if (store.isPaused) return

    const active = rt.active && !!player
    const dt = Math.min(delta, 0.05)

    if (!active || !player) {
      streaks.material.opacity = 0
      cone.mesh.visible = false
      dust.material.opacity = 0
      rings.forEach((r) => {
        if (!r.active) r.mesh.visible = false
      })
    }

    if (player) tmpPos.current.copy(player.position)

    // Eventos de estampido sónico → anillos de onda de choque
    if (rt.boomSeq !== lastBoomSeq.current) {
      lastBoomSeq.current = rt.boomSeq
      if (active) {
        if (rt.boomIntensity >= 0.9) {
          spawnRing(0, 1, 0)
          spawnRing(1, 1, 0.14)
          spawnRing(2, 1, 0.3)
        } else {
          spawnRing(0, rt.boomIntensity, 0)
        }
      }
    }

    // --- Estelas de velocidad y dinámicas atmosféricas --------------------
    if (active && player) {
      const px = player.position.x
      const py = player.position.y
      const pz = player.position.z
      const speed = rt.speed

      if (!streaksInitialized.current) {
        for (let i = 0; i < STREAK_COUNT; i++) {
          streaks.base[i * 3] = px + (Math.random() * 2 - 1) * STREAK_BOX
          streaks.base[i * 3 + 1] = py + (Math.random() * 2 - 1) * STREAK_BOX * 0.6
          streaks.base[i * 3 + 2] = pz + (Math.random() * 2 - 1) * STREAK_BOX
        }
        streaksInitialized.current = true
      }

      const inv = speed > 0.01 ? 1 / speed : 0
      const dx = rt.vx * inv
      const dy = rt.vy * inv
      const dz = rt.vz * inv
      const len = Math.min(22, Math.max(0.5, speed * 0.038))
      const pos = streaks.positions
      const boxY = STREAK_BOX * 0.6

      for (let i = 0; i < STREAK_COUNT; i++) {
        let x = streaks.base[i * 3]
        let y = streaks.base[i * 3 + 1]
        let z = streaks.base[i * 3 + 2]

        // Reciclar partículas que quedan fuera del volumen alrededor del jugador
        if (x - px > STREAK_BOX) x -= STREAK_BOX * 2
        else if (x - px < -STREAK_BOX) x += STREAK_BOX * 2
        if (y - py > boxY) y -= boxY * 2
        else if (y - py < -boxY) y += boxY * 2
        if (z - pz > STREAK_BOX) z -= STREAK_BOX * 2
        else if (z - pz < -STREAK_BOX) z += STREAK_BOX * 2

        streaks.base[i * 3] = x
        streaks.base[i * 3 + 1] = y
        streaks.base[i * 3 + 2] = z

        const o = i * 6
        pos[o] = x
        pos[o + 1] = y
        pos[o + 2] = z
        pos[o + 3] = x - dx * len
        pos[o + 4] = y - dy * len
        pos[o + 5] = z - dz * len
      }
      streaks.geometry.attributes.position.needsUpdate = true
      streaks.material.opacity = 0.5 * smoothstep(50, 260, speed)

      // Color de estelas: azul cian por defecto, transición a plasma ámbar/rojo con thermalGlow
      if (rt.thermalGlow > 0.05) {
        streaks.material.color.set(rt.thermalGlow > 0.5 ? '#ff4d00' : '#ff9933')
      } else {
        streaks.material.color.set(rt.mach >= 1 ? '#bfe6ff' : '#e4f8ff')
      }

      tmpVel.current.set(dx, dy, dz)


      // --- Cono de condensación / Mach ------------------------------------
      const m = rt.mach
      const vapor =
        0.3 * bump(m, 0.86, 0.99, 1.09) + 0.2 * smoothstep(1.0, 1.3, m) * (1 - 0.55 * smoothstep(1.8, 3.0, m))
      if (vapor > 0.01 && speed > 5) {
        const H = 8 + Math.min(6, m * 2)
        const tanMu = Math.min(1.2, Math.max(0.3, 1 / Math.sqrt(Math.max(m * m - 1, 0.3))))
        cone.mesh.visible = true
        cone.mesh.position.set(px, py + 0.9, pz).addScaledVector(tmpVel.current, 0.9)
        cone.mesh.quaternion.setFromUnitVectors(UP, tmpVel.current)
        cone.mesh.scale.set(H * tanMu, H, H * tanMu)
        cone.material.uniforms.uOpacity.value = Math.min(0.55, vapor)

        if (rt.thermalGlow > 0.1) {
          cone.material.uniforms.uColor.value.set('#ff7b3d')
        } else {
          cone.material.uniforms.uColor.value.set('#dff7ff')
        }
      } else {
        cone.mesh.visible = false
      }

      // --- Perturbación rasante sobre el suelo (Ground Wake / Dust) ---------
      if (rt.dustKick > 0.02) {
        const groundY = Math.max(0, py - rt.groundAltitude)
        const spawnCount = Math.ceil(rt.dustKick * 4)
        const dPos = dust.positions
        const dVel = dust.velocities
        const dAge = dust.ages
        const dLife = dust.lives

        // Dirección perpendicular al vuelo para la estela cónica/V en el suelo
        const perpX = -dz
        const perpZ = dx

        for (let s = 0; s < spawnCount; s++) {
          const idx = dust.nextIdx
          dust.nextIdx = (dust.nextIdx + 1) % DUST_COUNT

          const side = (Math.random() - 0.5) * 2
          const lateralOffset = side * (1.5 + Math.random() * 4.0)

          dPos[idx * 3] = px - dx * 2.0 + perpX * lateralOffset
          dPos[idx * 3 + 1] = groundY + 0.2 + Math.random() * 0.4
          dPos[idx * 3 + 2] = pz - dz * 2.0 + perpZ * lateralOffset

          // Vector de dispersión de la partícula
          dVel[idx * 3] = perpX * side * (4 + Math.random() * 8) - dx * (speed * 0.15)
          dVel[idx * 3 + 1] = 1.2 + Math.random() * 3.0
          dVel[idx * 3 + 2] = perpZ * side * (4 + Math.random() * 8) - dz * (speed * 0.15)

          dAge[idx] = 0
          dLife[idx] = 0.5 + Math.random() * 0.7
        }

        // Actualizar partículas de polvo
        for (let i = 0; i < DUST_COUNT; i++) {
          if (dAge[i] < dLife[i]) {
            dAge[i] += dt
            dPos[i * 3] += dVel[i * 3] * dt
            dPos[i * 3 + 1] += dVel[i * 3 + 1] * dt
            dPos[i * 3 + 2] += dVel[i * 3 + 2] * dt
            dVel[i * 3] *= 0.94
            dVel[i * 3 + 1] *= 0.90
            dVel[i * 3 + 2] *= 0.94
          }
        }
        dust.geometry.attributes.position.needsUpdate = true
        dust.material.opacity = Math.min(0.7, rt.dustKick * 0.9)
      } else {
        dust.material.opacity = 0
      }
    }

    // --- Animación de los anillos de onda de choque -----------------------
    rings.forEach((r) => {
      if (!r.active) return
      if (r.delay > 0) {
        r.delay -= dt
        r.mesh.visible = false
        return
      }
      r.age += dt
      const t = r.age / r.life
      if (t >= 1) {
        r.active = false
        r.mesh.visible = false
        return
      }
      const eased = 1 - Math.pow(1 - t, 2.2)
      const s = 1 + eased * r.maxScale
      r.mesh.scale.set(s, s, s)
      ;(r.mesh.material as THREE.MeshBasicMaterial).opacity = r.peak * Math.pow(1 - t, 1.6)
      r.mesh.visible = true
    })
  })

  return null
}

// ---------------------------------------------------------------------------
// Llamas de los propulsores de las botas de la armadura
// ---------------------------------------------------------------------------
const flameVertex = /* glsl */ `
  varying float vY;
  void main() {
    vY = position.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const flameFragment = /* glsl */ `
  uniform float uOpacity;
  uniform vec3 uColor;
  varying float vY;
  void main() {
    // Atenuación suave hacia la punta y desvanecimiento en la base para no cortar la bota
    float taper = 1.0 - smoothstep(0.0, 1.0, vY);
    float rimSoft = smoothstep(0.0, 0.08, vY);
    float a = uOpacity * taper * rimSoft;
    gl_FragColor = vec4(uColor, a);
  }
`

interface FlameUnit {
  group: THREE.Group
  core: THREE.Mesh
  outer: THREE.Mesh
  bone: THREE.Object3D
  toeBase?: THREE.Object3D
  isLeft: boolean
  phase: number
}

export function SuitThrusterFlames(_props: { root?: THREE.Object3D }) {
  return null
}

function _DisabledSuitThrusterFlames({ root }: { root: THREE.Object3D }) {
  const { scene } = useThree()
  const tmpPos = useRef(new THREE.Vector3())
  const tmpFoot = useRef(new THREE.Vector3())
  const tmpToe = useRef(new THREE.Vector3())
  const tmpLeftFoot = useRef(new THREE.Vector3())
  const tmpRightFoot = useRef(new THREE.Vector3())
  const tmpLateral = useRef(new THREE.Vector3())
  const tmpDir = useRef(new THREE.Vector3())
  const tmpBack = useRef(new THREE.Vector3())
  const down = useRef(new THREE.Vector3(0, -1, 0))
  const cyan = useRef(new THREE.Color('#55F0FF'))
  const violet = useRef(new THREE.Color('#8a5cff'))

  const flames = useMemo<FlameUnit[]>(() => {
    let leftFoot: THREE.Object3D | null = null
    let rightFoot: THREE.Object3D | null = null
    let leftToeBase: THREE.Object3D | null = null
    let rightToeBase: THREE.Object3D | null = null

    root.traverse((child) => {
      const n = child.name || ''
      if (n.includes('LeftFoot')) leftFoot = child
      else if (n.includes('RightFoot')) rightFoot = child
      else if (n.includes('LeftToeBase')) leftToeBase = child
      else if (n.includes('RightToeBase')) rightToeBase = child
    })

    const pairs: Array<{ bone: THREE.Object3D; toeBase?: THREE.Object3D; isLeft: boolean }> = []
    if (leftFoot) pairs.push({ bone: leftFoot, toeBase: leftToeBase || undefined, isLeft: true })
    if (rightFoot) pairs.push({ bone: rightFoot, toeBase: rightToeBase || undefined, isLeft: false })

    return pairs.map(({ bone, toeBase, isLeft }, idx) => {
      const group = new THREE.Group()
      group.visible = false

      // Cono central intenso (radio 1.2 cm, diámetro 2.4 cm)
      const coreGeo = new THREE.ConeGeometry(0.012, 1, 14, 1, true)
      coreGeo.translate(0, 0.5, 0) // base en el origen (tobera), punta hacia +Y
      const coreMat = new THREE.ShaderMaterial({
        uniforms: {
          uOpacity: { value: 0.95 },
          uColor: { value: new THREE.Color('#E8FDFF') },
        },
        vertexShader: flameVertex,
        fragmentShader: flameFragment,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        fog: false,
      })
      const core = new THREE.Mesh(coreGeo, coreMat)

      // Cono exterior de llama (radio 0.024 = 2.4 cm, diámetro 4.8 cm: contenido dentro de la planta del pie)
      const outerGeo = new THREE.ConeGeometry(0.024, 1, 18, 1, true)
      outerGeo.translate(0, 0.5, 0)
      const outerMat = new THREE.ShaderMaterial({
        uniforms: {
          uOpacity: { value: 0.65 },
          uColor: { value: new THREE.Color('#55F0FF') },
        },
        vertexShader: flameVertex,
        fragmentShader: flameFragment,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        fog: false,
      })
      const outer = new THREE.Mesh(outerGeo, outerMat)

      group.add(outer)
      group.add(core)
      return { group, core, outer, bone, toeBase, isLeft, phase: idx * 1.7 }
    })
  }, [root])

  useEffect(() => {
    flames.forEach((f) => scene.add(f.group))
    return () => {
      flames.forEach((f) => {
        scene.remove(f.group)
        f.core.geometry.dispose()
        ;(f.core.material as THREE.Material).dispose()
        f.outer.geometry.dispose()
        ;(f.outer.material as THREE.Material).dispose()
      })
    }
  }, [flames, scene])

  useFrame(({ clock }) => {
    const rt = flightRuntime
    const t = clock.getElapsedTime()

    // Vector lateral corporal: apunta desde el tobillo derecho hacia el izquierdo
    const leftFlame = flames.find((f) => f.isLeft)
    const rightFlame = flames.find((f) => !f.isLeft)
    if (leftFlame && rightFlame) {
      leftFlame.bone.getWorldPosition(tmpLeftFoot.current)
      rightFlame.bone.getWorldPosition(tmpRightFoot.current)
      tmpLateral.current.subVectors(tmpLeftFoot.current, tmpRightFoot.current)
      if (tmpLateral.current.lengthSq() > 0.0001) {
        tmpLateral.current.normalize()
      } else {
        tmpLateral.current.set(1, 0, 0)
      }
    } else {
      tmpLateral.current.set(1, 0, 0)
    }

    for (const f of flames) {
      if (!rt.active) {
        f.group.visible = false
        continue
      }

      // Dirección de escape: hacia abajo en suspensión, opuesta a la velocidad en vuelo
      const speed = rt.speed
      const blend = smoothstep(2, 25, speed)
      tmpDir.current.copy(down.current)
      if (speed > 0.5) {
        tmpBack.current.set(-rt.vx / speed, -rt.vy / speed, -rt.vz / speed)
        tmpDir.current.lerp(tmpBack.current, blend)
      }
      tmpDir.current.normalize()

      // 1. Centro longitudinal del pie (entre tobillo y base de dedos en el arco plantar)
      if (f.toeBase) {
        f.bone.getWorldPosition(tmpFoot.current)
        f.toeBase.getWorldPosition(tmpToe.current)
        tmpPos.current.copy(tmpFoot.current).lerp(tmpToe.current, 0.45)
      } else {
        f.bone.getWorldPosition(tmpPos.current)
      }

      // 2. Centrado lateral exacto en el eje medio de cada pie (desplazamiento hacia el exterior del pie)
      const latOffset = f.isLeft ? 0.030 : -0.030
      tmpPos.current.addScaledVector(tmpLateral.current, latOffset)

      // 3. Salida rasante en la cara inferior de la suela en la dirección del flujo de propulsión
      tmpPos.current.addScaledVector(tmpDir.current, 0.035)

      f.group.position.copy(tmpPos.current)
      f.group.quaternion.setFromUnitVectors(UP, tmpDir.current)

      const flicker = 1 + 0.12 * Math.sin(t * 70 + f.phase) + 0.07 * Math.sin(t * 113 + f.phase * 2)
      const length = (0.18 + rt.throttle * 0.45 + rt.afterburner * 1.9) * flicker
      // El ensanchamiento por postquemador es sutil para que nunca sobrepase el ancho del calzado
      const widen = 1 + rt.afterburner * 0.25
      f.core.scale.set(widen, length * 0.85, widen)
      f.outer.scale.set(widen, length, widen)

      const outerMat = f.outer.material as THREE.ShaderMaterial
      const coreMat = f.core.material as THREE.ShaderMaterial
      if (outerMat.uniforms) {
        outerMat.uniforms.uColor.value.copy(cyan.current).lerp(violet.current, rt.afterburner * 0.75)
        outerMat.uniforms.uOpacity.value = 0.45 + 0.35 * Math.max(rt.throttle, rt.afterburner)
      }
      if (coreMat.uniforms) {
        coreMat.uniforms.uOpacity.value = 0.8 + 0.2 * Math.max(rt.throttle, rt.afterburner)
      }
      f.group.visible = true
    }
  })

  return null
}
