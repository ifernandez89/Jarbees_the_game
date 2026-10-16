'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'

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

  const isFirstFrame = useRef(true)
  const isPaused = useGameStore((state) => state.isPaused)

  useFrame((_, delta) => {
    if (isPaused) return

    // Obtener y cachear referencia directa al nodo 3D de la abeja
    // Esto elimina por completo el desfase de 1 a 2 frames provocado por el estado de React/Zustand
    if (!beeRef.current) {
      beeRef.current = scene.getObjectByName('beePlayer') || null
    }
    const bee = beeRef.current
    if (!bee) return

    // Matriz de rotación horizontal de la abeja (Yaw)
    rotationMatrix.current.makeRotationY(bee.rotation.y)

    // Offset de la cámara:
    // +0.70m por encima en Y (ángulo cenital elevado)
    // +1.80m por detrás en Z (viendo la espalda y alas hacia el horizonte)
    cameraOffset.current.set(0, 0.70, 1.8)
    cameraOffset.current.applyMatrix4(rotationMatrix.current)

    // Posición objetivo de la cámara
    targetPosition.current.set(
      bee.position.x + cameraOffset.current.x,
      bee.position.y + cameraOffset.current.y,
      bee.position.z + cameraOffset.current.z
    )

    // Punto focal (lookAt) hacia adelante (-Z), proyectado con la misma orientación
    forwardLookOffset.current.set(0, 0.05, -1.2)
    forwardLookOffset.current.applyMatrix4(rotationMatrix.current)
    targetLookAt.current.set(
      bee.position.x + forwardLookOffset.current.x,
      bee.position.y + forwardLookOffset.current.y,
      bee.position.z + forwardLookOffset.current.z
    )

    // En el primer frame posicionar sin interpolación para encuadrar de inmediato
    if (isFirstFrame.current) {
      currentPosition.current.copy(targetPosition.current)
      currentLookAt.current.copy(targetLookAt.current)
      isFirstFrame.current = false
    } else {
      // Amortiguación exponencial pura: factor = 1 - e^(-decay * dt)
      // Clave para celulares: es 100% independiente del framerate (60fps, 30fps o variaciones de delta por CPU móvil).
      // Al suavizar tanto la posición como el punto focal (lookAt) con exactamente la misma tasa,
      // se elimina todo temblor angular y cabeceo de la cámara.
      const clampedDelta = Math.min(delta, 0.1)
      const smoothFactor = 1 - Math.exp(-14 * clampedDelta)

      currentPosition.current.lerp(targetPosition.current, smoothFactor)
      currentLookAt.current.lerp(targetLookAt.current, smoothFactor)
    }

    camera.position.copy(currentPosition.current)
    camera.lookAt(currentLookAt.current)
  })

  return null
}

