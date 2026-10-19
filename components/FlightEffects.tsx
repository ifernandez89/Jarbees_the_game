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

  // Añadir a la escena y limpiar
  useEffect(() => {
    scene.add(streaks.lines)
    scene.add(cone.mesh)
    rings.forEach((r) => scene.add(r.mesh))
    return () => {
      scene.remove(streaks.lines)
      scene.remove(cone.mesh)
      rings.forEach((r) => {
        scene.remove(r.mesh)
        r.mesh.geometry.dispose()
        ;(r.mesh.material as THREE.Material).dispose()
      })
      streaks.geometry.dispose()
      streaks.material.dispose()
      cone.geometry.dispose()
      cone.material.dispose()
      audioRef.current?.dispose()
      audioRef.current = null
    }
  }, [scene, streaks, cone, rings])

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

    // --- Estelas de velocidad ---------------------------------------------
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
      const len = Math.min(18, Math.max(0.5, speed * 0.032))
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
      streaks.material.color.set(rt.mach >= 1 ? '#bfe6ff' : '#e4f8ff')

      // --- Cono de condensación / Mach ---
      const m = rt.mach
      const vapor =
        0.3 * bump(m, 0.86, 0.99, 1.09) + 0.2 * smoothstep(1.0, 1.3, m) * (1 - 0.55 * smoothstep(1.8, 3.0, m))
      if (vapor > 0.01 && speed > 5) {
        tmpVel.current.set(dx, dy, dz)
        const H = 8 + Math.min(6, m * 2)
        const tanMu = Math.min(1.2, Math.max(0.3, 1 / Math.sqrt(Math.max(m * m - 1, 0.3))))
        cone.mesh.visible = true
        cone.mesh.position.set(px, py + 0.9, pz).addScaledVector(tmpVel.current, 0.9)
        cone.mesh.quaternion.setFromUnitVectors(UP, tmpVel.current)
        cone.mesh.scale.set(H * tanMu, H, H * tanMu)
        cone.material.uniforms.uOpacity.value = Math.min(0.55, vapor)
      } else {
        cone.mesh.visible = false
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
interface FlameUnit {
  group: THREE.Group
  core: THREE.Mesh
  outer: THREE.Mesh
  bone: THREE.Object3D
  phase: number
}

export function SuitThrusterFlames({ root }: { root: THREE.Object3D }) {
  const { scene } = useThree()
  const tmpPos = useRef(new THREE.Vector3())
  const tmpDir = useRef(new THREE.Vector3())
  const tmpBack = useRef(new THREE.Vector3())
  const down = useRef(new THREE.Vector3(0, -1, 0))
  const cyan = useRef(new THREE.Color('#55F0FF'))
  const violet = useRef(new THREE.Color('#8a5cff'))

  const flames = useMemo<FlameUnit[]>(() => {
    const bones: THREE.Object3D[] = []
    root.traverse((child) => {
      const n = child.name || ''
      if (n.includes('LeftFoot') || n.includes('RightFoot')) bones.push(child)
    })

    return bones.map((bone, idx) => {
      const group = new THREE.Group()
      group.visible = false

      const coreGeo = new THREE.ConeGeometry(0.045, 1, 10, 1, true)
      coreGeo.translate(0, 0.5, 0) // base en el origen (tobera), punta hacia +Y
      const coreMat = new THREE.MeshBasicMaterial({
        color: '#e8fdff',
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
        fog: false,
      })
      const core = new THREE.Mesh(coreGeo, coreMat)

      const outerGeo = new THREE.ConeGeometry(0.095, 1, 12, 1, true)
      outerGeo.translate(0, 0.5, 0)
      const outerMat = new THREE.MeshBasicMaterial({
        color: '#55F0FF',
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
        fog: false,
      })
      const outer = new THREE.Mesh(outerGeo, outerMat)

      group.add(outer)
      group.add(core)
      return { group, core, outer, bone, phase: idx * 1.7 }
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

      f.bone.getWorldPosition(tmpPos.current)
      f.group.position.copy(tmpPos.current).addScaledVector(tmpDir.current, 0.05)
      f.group.quaternion.setFromUnitVectors(UP, tmpDir.current)

      const flicker = 1 + 0.12 * Math.sin(t * 70 + f.phase) + 0.07 * Math.sin(t * 113 + f.phase * 2)
      const length = (0.2 + rt.throttle * 0.5 + rt.afterburner * 2.1) * flicker
      const widen = 1 + rt.afterburner * 0.9
      f.core.scale.set(widen, length, widen)
      f.outer.scale.set(widen, length * 1.12, widen)

      const outerMat = f.outer.material as THREE.MeshBasicMaterial
      outerMat.color.copy(cyan.current).lerp(violet.current, rt.afterburner * 0.75)
      outerMat.opacity = 0.35 + 0.35 * Math.max(rt.throttle, rt.afterburner)
      f.group.visible = true
    }
  })

  return null
}
