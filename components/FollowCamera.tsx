'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'
import { CHARACTER_PROFILES } from '@/types/characters'
import { flightRuntime } from '@/systems/FlightDynamics'

const BASE_FOV = 65

export function FollowCamera() {
  const { camera, scene } = useThree()
  const beeRef = useRef<THREE.Object3D | null>(null)

  // Vectores cacheados para evitar recolección de basura (GC) en cada frame
  const targetPosition = useRef(new THREE.Vector3())
  const currentPosition = useRef(new THREE.Vector3(0, 2.7, 1.8))
  const targetLookAt = useRef(new THREE.Vector3())
  const currentLookAt = useRef(new THREE.Vector3(0, 2.0, 0))
  const cameraOffset = useRef(new THREE.Vector3())
  const forwardLookOffset = useRef(new THREE.Vector3())
  const rotationMatrix = useRef(new THREE.Matrix4())

  // Modo "vuelo rápido" (armadura): la suavización se aplica al offset RELATIVO al personaje,
  // de modo que el retraso de la cámara se mantiene constante (~3 m) incluso a velocidad supersónica.
  const currentRel = useRef(new THREE.Vector3())
  const currentLookRel = useRef(new THREE.Vector3())
  const wasRelative = useRef(false)

  const isFirstFrame = useRef(true)
  const isPaused = useGameStore((state) => state.isPaused)
  const selectedCharacter = useGameStore((state) => state.selectedCharacter)
  const controls = useGameStore((state) => state.controls)

  useFrame((_, delta) => {
    if (isPaused) return

    // Obtener y cachear referencia directa al nodo 3D de la abeja / personaje
    // Esto elimina por completo el desfase de 1 a 2 frames provocado por el estado de React/Zustand
    if (!beeRef.current) {
      beeRef.current = scene.getObjectByName('beePlayer') || null
    }
    const bee = beeRef.current
    if (!bee) return

    const rt = flightRuntime
    const useRelative = selectedCharacter === 'iron_man' && rt.active

    // Sprint terrestre a 55 km/h (15.2 m/s): ratio entre velocidad base (5 m/s) y sprint (15.2 m/s)
    const velocity = useGameStore.getState().velocity
    const groundSprintRatio = selectedCharacter === 'iron_man' && !rt.active
      ? Math.min(1.0, Math.max(0.0, (Math.abs(velocity) - 4.8) / 10.4))
      : 0
    const camPull = useRelative ? rt.camPull : groundSprintRatio * 0.35

    // Si Auren está agachado en tierra, descender suavemente la perspectiva de cámara
    const isCrouching = selectedCharacter === 'iron_man' && controls.crouch && !rt.active
    const crouchCamDrop = isCrouching ? 0.35 : 0.0
    const crouchLookDrop = isCrouching ? 0.25 : 0.0

    // Matriz de rotación horizontal del personaje (Yaw)
    rotationMatrix.current.makeRotationY(bee.rotation.y)

    // Perfil dinámico de cámara según personaje (macro para insectos vs gran escala para la armadura)
    const profile = CHARACTER_PROFILES[selectedCharacter] || CHARACTER_PROFILES.bee
    const [cOffX, cOffY, cOffZ] = profile.camera.offset
    const [lOffX, lOffY, lOffZ] = profile.camera.lookOffset

    // A mayor velocidad la cámara se aleja y se eleva ligeramente (sensación de velocidad)
    const zPullMul = useRelative ? 0.55 : 0.40
    cameraOffset.current.set(cOffX, cOffY - crouchCamDrop + 0.28 * camPull, cOffZ * (1 + zPullMul * camPull))
    cameraOffset.current.applyMatrix4(rotationMatrix.current)

    // Posición objetivo de la cámara
    targetPosition.current.set(
      bee.position.x + cameraOffset.current.x,
      bee.position.y + cameraOffset.current.y,
      bee.position.z + cameraOffset.current.z
    )

    // Punto focal (lookAt) hacia adelante (-Z), proyectado con la misma orientación
    forwardLookOffset.current.set(lOffX, lOffY, lOffZ * (1 + 0.35 * camPull))
    forwardLookOffset.current.applyMatrix4(rotationMatrix.current)
    targetLookAt.current.set(
      bee.position.x + forwardLookOffset.current.x,
      bee.position.y + forwardLookOffset.current.y,
      bee.position.z + forwardLookOffset.current.z
    )

    const clampedDelta = Math.min(delta, 0.1)

    if (isFirstFrame.current) {
      // En el primer frame posicionar sin interpolación para encuadrar de inmediato
      currentPosition.current.copy(targetPosition.current)
      currentLookAt.current.copy(targetLookAt.current)
      isFirstFrame.current = false
    } else if (useRelative) {
      if (!wasRelative.current) {
        currentRel.current.copy(currentPosition.current).sub(bee.position)
        currentLookRel.current.copy(currentLookAt.current).sub(bee.position)
        wasRelative.current = true
      }

      // Tasa de seguimiento creciente con la velocidad: lag ≈ v / (14 + 0.25 v) ≈ constante (≤ 4 m)
      const follow = 1 - Math.exp(-(14 + 0.25 * rt.speed) * clampedDelta)
      currentRel.current.lerp(cameraOffset.current, follow)
      currentLookRel.current.lerp(forwardLookOffset.current, follow)

      currentPosition.current.copy(bee.position).add(currentRel.current)
      currentLookAt.current.copy(bee.position).add(currentLookRel.current)
    } else {
      wasRelative.current = false

      // Amortiguación exponencial pura: factor = 1 - e^(-decay * dt)
      // Clave para celulares: es 100% independiente del framerate (60fps, 30fps o variaciones de delta por CPU móvil).
      // Al suavizar tanto la posición como el punto focal (lookAt) con exactamente la misma tasa,
      // se elimina todo temblor angular y cabeceo de la cámara.
      const smoothFactor = 1 - Math.exp(-14 * clampedDelta)

      currentPosition.current.lerp(targetPosition.current, smoothFactor)
      currentLookAt.current.lerp(targetLookAt.current, smoothFactor)
    }

    camera.position.copy(currentPosition.current)

    // JARBEES FLIGHT SYSTEM & SPRINT TERRESTRE: vibración de cámara
    const groundShake = groundSprintRatio * 0.08
    const shake = useRelative ? rt.shake : groundShake
    const time = performance.now() / 1000
    if (shake > 0.002) {
      camera.position.x += (Math.sin(time * 43) + Math.sin(time * 71 + 1.0)) * 0.5 * 0.07 * shake
      camera.position.y += (Math.sin(time * 52 + 0.4) + Math.sin(time * 67 + 2.0)) * 0.5 * 0.07 * shake
      camera.position.z += (Math.sin(time * 38 + 1.7) + Math.sin(time * 59)) * 0.5 * 0.05 * shake
    }

    camera.lookAt(currentLookAt.current)

    if (shake > 0.002) {
      camera.rotateZ(Math.sin(time * 37) * 0.014 * shake)
    }

    // Campo de visión dinámico: se abre con la velocidad de vuelo o con sprint terrestre (65° -> 78°)
    const perspective = camera as THREE.PerspectiveCamera
    if (perspective.isPerspectiveCamera) {
      const targetFov = BASE_FOV + (useRelative ? rt.fovBoost : groundSprintRatio * 13.0)
      if (Math.abs(perspective.fov - targetFov) > 0.01) {
        perspective.fov += (targetFov - perspective.fov) * (1 - Math.exp(-6 * clampedDelta))
        perspective.updateProjectionMatrix()
      }
    }
  })

  return null
}
