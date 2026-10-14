'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'

export function FollowCamera() {
  const { camera } = useThree()
  const targetPosition = useRef(new THREE.Vector3())
  const currentPosition = useRef(new THREE.Vector3(0, 2.7, 1.8))
  const isFirstFrame = useRef(true)
  
  const beePosition = useGameStore((state) => state.position)
  const beeRotation = useGameStore((state) => state.rotation)
  const isPaused = useGameStore((state) => state.isPaused)

  useFrame((_, delta) => {
    if (isPaused) return

    // Offset de la cámara:
    // +0.70m por encima en Y (ángulo cenital elevado)
    // +1.80m por detrás en Z (viendo la espalda, alas y cuerpo de la abeja hacia el horizonte)
    const cameraOffset = new THREE.Vector3(0, 0.70, 1.8)
    
    // Matriz de rotación de la orientación de la abeja
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

    // En el primer frame posicionar sin interpolación para encuadrar de inmediato
    if (isFirstFrame.current) {
      currentPosition.current.copy(targetPosition.current)
      isFirstFrame.current = false
    } else {
      currentPosition.current.lerp(targetPosition.current, Math.min(1, delta * 9))
    }
    
    camera.position.copy(currentPosition.current)
    
    // Punto de mira enfocado hacia adelante (-Z), pasando por encima de la abeja hacia el horizonte
    const forwardLookOffset = new THREE.Vector3(0, 0.05, -1.2)
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
