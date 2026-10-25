'use client'

import React, { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
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
}

// 16 Habitaciones a escala galpón de Assault sincronizadas con villa_auren.plan.json
const VILLA_AUREN_ROOMS: RoomBounds[] = [
  {
    id: 'courtyard',
    name: 'Patio y Calzada de Llegada',
    floor: 'EXT',
    bounds: { min: [-16.0, 0.0, 8.0], max: [16.0, 4.0, 22.0] },
  },
  {
    id: 'PB_Hangar_Portico_Entrance',
    name: 'Portón de Acceso y Vestíbulo Frontal',
    floor: 'PB',
    bounds: { min: [-4.0, 0.0, 6.5], max: [4.0, 4.0, 10.0] },
  },
  {
    id: 'PB_Grand_Hangar_Atrium',
    name: 'Gran Atrio Central (Escala Assault)',
    floor: 'PB',
    bounds: { min: [-8.0, 0.0, -6.0], max: [8.0, 7.8, 6.5] },
  },
  {
    id: 'PB_Nexo_Armor_Workshop',
    name: 'Taller Mecánico & Armería NEXO-01',
    floor: 'PB',
    bounds: { min: [8.0, 0.0, -4.0], max: [15.0, 4.0, 10.0] },
  },
  {
    id: 'PB_Tactical_Briefing_Room',
    name: 'Sala Táctica y Monitoreo Biomas',
    floor: 'PB',
    bounds: { min: [8.0, 0.0, -10.0], max: [15.0, 4.0, -4.0] },
  },
  {
    id: 'PB_Main_Stairwell_Hall',
    name: 'Caja de Escalera Monumental a Mezzanine',
    floor: 'PB',
    bounds: { min: [-15.0, 0.0, -6.0], max: [-8.0, 4.0, 1.0] },
  },
  {
    id: 'PB_Service_Stairwell_S1',
    name: 'Acceso de Servicio al Lab Subterráneo',
    floor: 'PB',
    bounds: { min: [-15.0, 0.0, 1.0], max: [-8.0, 4.0, 10.0] },
  },
  {
    id: 'PB_Kitchen_Refectory',
    name: 'Comedor & Cocina Alpina',
    floor: 'PB',
    bounds: { min: [-15.0, 0.0, -10.0], max: [-8.0, 4.0, -6.0] },
  },
  {
    id: 'P1_Perimeter_Catwalk',
    name: 'Pasarela Perimetral Superior (Catwalk)',
    floor: 'P1',
    bounds: { min: [-9.5, 3.8, -8.0], max: [9.5, 8.2, 8.0] },
  },
  {
    id: 'P1_Auren_Private_Suite',
    name: 'Suite Residencial de Auren',
    floor: 'P1',
    bounds: { min: [8.0, 3.8, -1.0], max: [15.0, 8.2, 10.0] },
  },
  {
    id: 'P1_Quantum_Archive_Library',
    name: 'Biblioteca & Archivo Cuántico',
    floor: 'P1',
    bounds: { min: [8.0, 3.8, -10.0], max: [15.0, 8.2, -1.0] },
  },
  {
    id: 'P1_Tactical_Balcony',
    name: 'Balcón Táctico Voladizo de Despegue',
    floor: 'P1',
    bounds: { min: [-4.0, 3.8, 8.0], max: [4.0, 7.0, 12.0] },
  },
  {
    id: 'P1_Stair_Landing_West',
    name: 'Desembarco Superior de Escalera Monumental',
    floor: 'P1',
    bounds: { min: [-15.0, 3.8, -1.0], max: [-8.0, 8.2, 4.0] },
  },
  {
    id: 'S1_Core_Vault',
    name: 'Búnker del Núcleo JarBees 432Hz',
    floor: 'S1',
    bounds: { min: [-7.0, -3.8, -8.5], max: [7.0, 0.0, 2.0] },
  },
  {
    id: 'S1_Server_Compute_Bay',
    name: 'Bahía de Servidores e Infraestructura',
    floor: 'S1',
    bounds: { min: [7.0, -3.8, -8.5], max: [14.5, 0.0, 2.0] },
  },
  {
    id: 'S1_Exo_Power_Generator',
    name: 'Baterías Toroidales de Aurelium',
    floor: 'S1',
    bounds: { min: [-14.5, -3.8, -8.5], max: [-7.0, 0.0, 2.0] },
  },
  {
    id: 'S1_Stairwell_Access',
    name: 'Desembarco Escalera de Servicio S1',
    floor: 'S1',
    bounds: { min: [-14.5, -3.8, 2.0], max: [-8.5, 0.0, 8.5] },
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

  // Refs para animaciones y luces dinámicas discretas
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

    // Pulso cuántico del Núcleo JarBees a 432 Hz en el búnker subterráneo
    if (coreLightRef.current) {
      coreLightRef.current.intensity = 3.5 + Math.sin(time * 4.32) * 1.2
    }

    // Parpadeo cálido de la chimenea en el Gran Salón
    if (fireplaceLightRef.current) {
      fireplaceLightRef.current.intensity = 2.5 + Math.sin(time * 7.5) * 0.4
    }

    // Rotación del emblema JarBees en el Dais de Llegada
    if (daisEmblemRef.current) {
      daisEmblemRef.current.rotation.z = time * 0.35
    }
  })

  return (
    <group name="VillaAurenHub" position={position} rotation={rotation}>
      {/* 1. Malla 3D procedural exportada desde Blender (Sólida, con descansos y balcones continuos) */}
      {gltf.scene && <primitive object={gltf.scene} />}

      {/* 2. Dais de Salida / Llegada en el Patio Principal [0.0, 0.25, 15.0] */}
      <group position={[0.0, 0.26, 15.0]} name="VillaAurenArrivalDais">
        {/* Anillo de Aurelium */}
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.8, 2.0, 6]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.85} />
        </mesh>

        {/* Emblema rotatorio JarBees */}
        <mesh ref={daisEmblemRef} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.9, 6]} />
          <meshBasicMaterial color="#55F0FF" transparent opacity={0.85} />
        </mesh>
      </group>

      {/* 3. Luces dinámicas interiores discretas */}
      {/* Luz cálida en Chimenea del Gran Atrio [0.0, 1.5, -9.0] */}
      <pointLight
        ref={fireplaceLightRef}
        position={[0.0, 1.5, -9.0]}
        color="#F59E0B"
        intensity={2.8}
        distance={18}
        castShadow
      />

      {/* Luz cian cuántica en el Núcleo JarBees subterráneo [0.0, -2.0, -3.0] */}
      <pointLight
        ref={coreLightRef}
        position={[0.0, -2.0, -3.0]}
        color="#00F0FF"
        intensity={3.5}
        distance={15}
      />
    </group>
  )
}
