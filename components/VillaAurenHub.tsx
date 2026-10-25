'use client'

import React, { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useSecureGLTF } from '@/utils/useSecureGLTF'
import { getAssetPath } from '@/utils/assetPath'
import { setGroundCollider } from '@/systems/GroundCollisionManager'
import { useGameStore } from '@/store/gameStore'
import type { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: { [key: string]: THREE.Mesh }
  materials: { [key: string]: THREE.Material }
}

interface RoomBounds {
  id: string
  name: string
  floor: string
  bounds: {
    min: [number, number, number]
    max: [number, number, number]
  }
  badgeColor?: string
}

const VILLA_AUREN_ROOMS: RoomBounds[] = [
  {
    id: 'courtyard_gardens',
    name: '⛲ PATIO & DAIS DE SALIDA · VILLA AUREN',
    floor: 'EXT',
    bounds: { min: [-16.0, 0.0, 5.5], max: [16.0, 4.0, 15.0] },
    badgeColor: '#38BDF8',
  },
  {
    id: 'vestibule_entrance',
    name: '🚪 VESTÍBULO & ACCESO PRINCIPAL',
    floor: 'PB',
    bounds: { min: [-3.5, 0.0, 2.0], max: [3.5, 3.4, 6.0] },
    badgeColor: '#E2E8F0',
  },
  {
    id: 'grand_salon',
    name: '🔥 GRAN SALÓN & CHIMENEA ALPINA',
    floor: 'PB',
    bounds: { min: [-10.0, 0.0, -4.5], max: [-2.0, 6.4, 2.0] },
    badgeColor: '#F59E0B',
  },
  {
    id: 'kitchen_dining',
    name: '🍷 COCINA & COMEDOR DE CEDRO',
    floor: 'PB',
    bounds: { min: [-10.0, 0.0, -10.0], max: [-2.0, 3.4, -4.0] },
    badgeColor: '#10B981',
  },
  {
    id: 'jarbees_study',
    name: '💻 ESTUDIO TECNOLÓGICO JARBEES',
    floor: 'PB',
    bounds: { min: [2.0, 0.0, -4.0], max: [10.0, 3.4, 4.0] },
    badgeColor: '#06B6D4',
  },
  {
    id: 'vertical_flight_gallery',
    name: '🚀 GALERÍA VERTICAL DE VUELO (MACH SHAFT)',
    floor: 'PB_P1_ROOF',
    bounds: { min: [-2.2, 0.0, -2.2], max: [2.2, 9.8, 2.2] },
    badgeColor: '#55F0FF',
  },
  {
    id: 'mezzanine_library',
    name: '📚 MEZZANINE & BIBLIOTECA ABIERTA',
    floor: 'P1',
    bounds: { min: [2.0, 3.4, -10.0], max: [10.0, 6.8, 2.0] },
    badgeColor: '#EC4899',
  },
  {
    id: 'auren_workshop',
    name: '⚙️ TALLER DE MANTENIMIENTO DE AUREN',
    floor: 'P1',
    bounds: { min: [2.0, 3.4, -4.0], max: [10.0, 6.8, 4.0] },
    badgeColor: '#8B5CF6',
  },
  {
    id: 'master_suite',
    name: '🏔️ HABITACIÓN PRIVADA ALPINA',
    floor: 'P1',
    bounds: { min: [-10.0, 3.4, -10.0], max: [-2.0, 6.8, -4.0] },
    badgeColor: '#F43F5E',
  },
  {
    id: 'underground_laboratory',
    name: '⚡ LABORATORIO SUBTERRÁNEO & NÚCLEO CUÁNTICO',
    floor: 'S1',
    bounds: { min: [-10.0, -3.7, -10.0], max: [10.0, 0.0, 6.0] },
    badgeColor: '#38BDF8',
  },
  {
    id: 'alpine_rooftops',
    name: '🦅 AZOTEA ALPINA & VENTANA DE VUELO',
    floor: 'ROOF',
    bounds: { min: [-11.0, 6.4, -11.0], max: [11.0, 10.0, 7.0] },
    badgeColor: '#FBBF24',
  },
]

interface VillaAurenHubProps {
  position?: [number, number, number]
  rotation?: [number, number, number]
}

export function VillaAurenHub({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: VillaAurenHubProps) {
  const gltf = useSecureGLTF(getAssetPath('/models/villa_auren.glb')) as GLTFResult
  const playerPos = useGameStore((state) => state.position)

  const [currentRoom, setCurrentRoom] = useState<RoomBounds>(VILLA_AUREN_ROOMS[0])

  // Refs para animaciones y luces dinámicas
  const coreLightRef = useRef<THREE.PointLight>(null)
  const fireplaceLightRef = useRef<THREE.PointLight>(null)
  const daisEmblemRef = useRef<THREE.Mesh>(null)

  // 1. REGISTRAR EL MODELO REAL DE VILLA AUREN PARA RAYCASTING GROUND COLLIDER
  useEffect(() => {
    if (gltf.scene) {
      gltf.scene.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
      setGroundCollider(gltf.scene)
    }
    return () => {
      setGroundCollider(null)
    }
  }, [gltf.scene])

  // 2. CICLO USEFRAME: EVALUACIÓN DE HABITACIÓN Y EFECTOS DINÁMICOS
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    // Coordenadas relativas a la posición de la villa
    const px = playerPos[0] - position[0]
    const py = playerPos[1] - position[1]
    const pz = playerPos[2] - position[2]

    // Evaluar habitación actual
    let found: RoomBounds | null = null
    for (const r of VILLA_AUREN_ROOMS) {
      const b = r.bounds
      if (
        px >= b.min[0] &&
        px <= b.max[0] &&
        py >= b.min[1] &&
        py <= b.max[1] &&
        pz >= b.min[2] &&
        pz <= b.max[2]
      ) {
        found = r
        break
      }
    }
    if (found && found.id !== currentRoom.id) {
      setCurrentRoom(found)
    }

    // Pulso cuántico del Núcleo JarBees a 432 Hz en el laboratorio subterráneo
    if (coreLightRef.current) {
      coreLightRef.current.intensity = 4.0 + Math.sin(time * 4.32) * 1.5
    }

    // Parpadeo cálido de la chimenea en el Gran Salón
    if (fireplaceLightRef.current) {
      fireplaceLightRef.current.intensity = 3.0 + Math.sin(time * 8.0) * 0.5 + Math.cos(time * 11.0) * 0.3
    }

    // Rotación del emblema JarBees en el Dais de Llegada
    if (daisEmblemRef.current) {
      daisEmblemRef.current.rotation.z = time * 0.4
    }
  })

  return (
    <group name="VillaAurenHub" position={position} rotation={rotation}>
      {/* 1. Malla 3D procedural exportada desde Blender */}
      {gltf.scene && <primitive object={gltf.scene} />}

      {/* 2. Dais de Salida / Llegada en el Patio Principal [0.0, 0.2, 10.5] */}
      <group position={[0.0, 0.2, 10.5]} name="VillaAurenArrivalDais">
        {/* Anillo de Aurelium */}
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.8, 2.0, 6]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.9} />
        </mesh>

        {/* Emblema rotatorio JarBees */}
        <mesh ref={daisEmblemRef} position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.9, 6]} />
          <meshBasicMaterial color="#55F0FF" transparent opacity={0.9} />
        </mesh>

        {/* Rótulo AR Holográfico flotante de bienvenida */}
        <Html position={[0, 2.5, 0]} center distanceFactor={22}>
          <div
            style={{
              padding: '8px 18px',
              background: 'rgba(10, 16, 26, 0.92)',
              border: '2px solid rgba(85, 240, 255, 0.85)',
              borderRadius: '10px',
              boxShadow: '0 0 25px rgba(85, 240, 255, 0.45)',
              color: '#F8FAFC',
              fontFamily: 'monospace',
              fontSize: '11px',
              textAlign: 'center',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            <div style={{ color: '#55F0FF', fontWeight: 'bold', fontSize: '13px' }}>
              🏔️ VILLA AUREN · ALPIN RESIDENCE
            </div>
            <div style={{ color: '#E2E8F0', marginTop: '2px', fontSize: '10px' }}>
              HABITACIÓN: <span style={{ color: currentRoom.badgeColor || '#38BDF8', fontWeight: 'bold' }}>{currentRoom.name}</span>
            </div>
            <div style={{ color: '#94A3B8', marginTop: '1px', fontSize: '9px' }}>
              NIVEL: {currentRoom.floor} · PROCEDURAL BLENDER 5.2 (1 BU = 1M)
            </div>
          </div>
        </Html>
      </group>

      {/* 3. Luces dinámicas interiores */}
      {/* Luz cálida en Chimenea del Gran Salón [-8.2, 1.2, -1.0] */}
      <pointLight
        ref={fireplaceLightRef}
        position={[-8.2, 1.2, -1.0]}
        color="#F59E0B"
        intensity={3.0}
        distance={14}
        castShadow
      />

      {/* Luz cian cuántica en el Núcleo JarBees subterráneo [0.0, -2.1, -7.5] */}
      <pointLight
        ref={coreLightRef}
        position={[0.0, -2.1, -7.5]}
        color="#55F0FF"
        intensity={4.5}
        distance={18}
      />

      {/* Luz dorada de recarga en el taller de Auren [6.5, 4.5, 1.0] */}
      <pointLight
        position={[6.5, 4.5, 1.0]}
        color="#FFD700"
        intensity={2.2}
        distance={10}
      />

      {/* Haz vertical de baliza en la galería de vuelo [0.0, 5.0, 0.0] */}
      <pointLight
        position={[0.0, 5.0, 0.0]}
        color="#55F0FF"
        intensity={2.0}
        distance={12}
      />
    </group>
  )
}
