'use client'

import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'

export function FollowCamera() {
  const { camera } = useThree()
  const targetPosition = useRef(new THREE.Vector3())
  const currentPosition = useRef(new THREE.Vector3(0, 2.95, 2.4))
  const isFirstFrame = useRef(true)
  
  const beePosition = useGameStore((state) => state.position)
  const beeRotation = useGameStore((state) => state.rotation)
  const isPaused = useGameStore((state) => state.isPaused)

  useFrame((_, delta) => {
    if (isPaused) return

    // Offset de la cámara: POR ENCIMA (+0.95m en Y) y DETRÁS (+2.4m en Z) de la abeja
    // Ángulo superior en tercera persona para ver a la abeja en pantalla completa con el horizonte al fondo
    const cameraOffset = new THREE.Vector3(0, 0.95, 2.4)
    
    // Matriz de rotación de la abeja
    const rotationMatrix = new THREE.Matrix4()
    rotationMatrix.makeRotationFromEuler(
      new THREE.Euler(beeRotation[0], beeRotation[1], beeRotation[2])
    )
    
    // Aplicar la rotación del jugador al offset de la cámara
    cameraOffset.applyMatrix4(rotationMatrix)
    
    // Posición objetivo de la cámara
    targetPosition.current.set(
      beePosition[0] + cameraOffset.x,
      beePosition[1] + cameraOffset.y,
      beePosition[2] + cameraOffset.z
    )

    // En el primer fotograma posicionar sin retraso para evitar tirones
    if (isFirstFrame.current) {
      currentPosition.current.copy(targetPosition.current)
      isFirstFrame.current = false
    } else {
      // Suavizado fluido
      currentPosition.current.lerp(targetPosition.current, Math.min(1, delta * 9))
    }
    
    camera.position.copy(currentPosition.current)
    
    // El punto de mira enfoca a la abeja con un suave adelanto hacia el frente (-0.6m) y levemente elevado
    const forwardLookOffset = new THREE.Vector3(0, 0.15, -0.6)
    forwardLookOffset.applyMatrix4(rotationMatrix)
    const lookAtTarget = new THREE.Vector3(
      beePosition[0] + forwardLookOffset.x,
      beePosition[1] + forwardLookOffset.y,
      beePosition[2] + forwardLookOffset.z
    )
    camera.lookAt(lookAtTarget)
  })

  return null
}
