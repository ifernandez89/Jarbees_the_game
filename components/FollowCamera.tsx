'use client'

import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '@/store/gameStore'

export function FollowCamera() {
  const { camera } = useThree()
  const targetPosition = useRef(new THREE.Vector3())
  const currentPosition = useRef(new THREE.Vector3(0, 2.5, 3))
  
  const beePosition = useGameStore((state) => state.position)
  const beeRotation = useGameStore((state) => state.rotation)
  const isPaused = useGameStore((state) => state.isPaused)

  useFrame((_, delta) => {
    if (isPaused) return

    // Offset de la cámara en tercera persona detrás y encima de la abeja
    const cameraOffset = new THREE.Vector3(0, 0.45, 0.95)
    
    // Crear una matriz de rotación desde la rotación de la abeja
    const rotationMatrix = new THREE.Matrix4()
    rotationMatrix.makeRotationFromEuler(
      new THREE.Euler(beeRotation[0], beeRotation[1], beeRotation[2])
    )
    
    // Aplicar la rotación al offset
    cameraOffset.applyMatrix4(rotationMatrix)
    
    // Posición objetivo de la cámara
    targetPosition.current.set(
      beePosition[0] + cameraOffset.x,
      beePosition[1] + cameraOffset.y,
      beePosition[2] + cameraOffset.z
    )

    // Interpolación suave (lerp) para movimiento fluido
    currentPosition.current.lerp(targetPosition.current, Math.min(1, delta * 8))
    
    // Actualizar posición de la cámara
    camera.position.copy(currentPosition.current)
    
    // La cámara apunta hacia el frente de la abeja (hacia el horizonte en la dirección de vuelo)
    const forwardLookOffset = new THREE.Vector3(0, 0.05, -2.0)
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
