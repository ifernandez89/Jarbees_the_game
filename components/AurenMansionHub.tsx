'use client'

import React, { useRef, useState, useEffect, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useSecureGLTF } from '@/utils/useSecureGLTF'
import { getAssetPath } from '@/utils/assetPath'
import { setGroundCollider } from '@/systems/GroundCollisionManager'
import { useGameStore, CS_MAPS, type CSMapId } from '@/store/gameStore'
import type { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: { [key: string]: THREE.Mesh }
  materials: { [key: string]: THREE.Material }
}

interface RoomBounds {
  id: string
  name: string
  floor: string
  min: [number, number, number]
  max: [number, number, number]
  badgeColor?: string
}

const CHATEAU_MANSION_ROOMS: RoomBounds[] = [
  {
    id: 'courtyard_spawn',
    name: '⛲ PATIO PRINCIPAL & JARDINES DEL CHÂTEAU',
    floor: 'PB',
    min: [-25, 4.0, -65],
    max: [30, 12.0, -38],
    badgeColor: '#38BDF8',
  },
  {
    id: 'grand_salon',
    name: '🏛️ GRAN VESTÍBULO & SALÓN SEÑORIAL (CHÂTEAU)',
    floor: 'PB',
    min: [-22, 6.0, -15],
    max: [22, 12.0, 18],
    badgeColor: '#F59E0B',
  },
  {
    id: 'upper_gallery',
    name: '🪜 GALERÍA SUPERIOR & VENTANALES DEL CHÂTEAU',
    floor: 'P1',
    min: [-22, 12.0, -15],
    max: [22, 22.0, 18],
    badgeColor: '#EC4899',
  },
  {
    id: 'nexo_catacombs',
    name: '⚡ BODEGA SUBTERRÁNEA · NÚCLEO CUÁNTICO NEXO',
    floor: 'S1',
    min: [-38, 0.0, 12],
    max: [-4, 10.0, 48],
    badgeColor: '#06B6D4',
  },
  {
    id: 'terrace_gardens',
    name: '🌿 TERRAZA INTERIOR & PASADIZOS DE PIEDRA',
    floor: 'EXT',
    min: [-50, 4.0, -35],
    max: [50, 15.0, -16],
    badgeColor: '#10B981',
  },
  {
    id: 'chateau_rooftops',
    name: '🚀 AZOTEA & TEJADOS DE PIZARRA (VUELO MACH)',
    floor: 'ROOF',
    min: [-55, 16.0, -60],
    max: [55, 30.0, 60],
    badgeColor: '#FBBF24',
  },
]

export function AurenMansionHub() {
  const gltf = useSecureGLTF(getAssetPath('/models/de_chateau.glb')) as GLTFResult
  const playerPos = useGameStore((state) => state.position)
  const setCsMap = useGameStore((state) => state.setCsMap)

  const [currentRoom, setCurrentRoom] = useState<RoomBounds>(CHATEAU_MANSION_ROOMS[0])
  const [showPortalModal, setShowPortalModal] = useState(false)

  // Luces y elementos dinámicos
  const courtyardLightRef = useRef<THREE.PointLight>(null)
  const fireplaceLightRef = useRef<THREE.PointLight>(null)
  const coreLightRef = useRef<THREE.PointLight>(null)
  const coreMeshRef = useRef<THREE.Mesh>(null)
  const coreRing1Ref = useRef<THREE.Mesh>(null)
  const coreRing2Ref = useRef<THREE.Mesh>(null)
  const daisEmblemRef = useRef<THREE.Mesh>(null)

  // 1. REGISTRAR EL MODELO REAL COMPLETO DEL CHÂTEAU (130 MATERIALES, ESCALERAS Y VENTANAS)
  useEffect(() => {
    if (gltf.scene) {
      // Habilitar sombras y asegurar que cada malla sea detectable por raycasting
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

  // 2. CICLO USEFRAME: DETECCIÓN DE HABITACIÓN, LUCES Y DINÁMICA DE NÚCLEO
  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    const px = playerPos[0]
    const py = playerPos[1]
    const pz = playerPos[2]

    // Evaluar habitación actual
    let found: RoomBounds | null = null
    for (const r of CHATEAU_MANSION_ROOMS) {
      if (
        px >= r.min[0] &&
        px <= r.max[0] &&
        py >= r.min[1] &&
        py <= r.max[1] &&
        pz >= r.min[2] &&
        pz <= r.max[2]
      ) {
        found = r
        break
      }
    }
    if (found && found.id !== currentRoom.id) {
      setCurrentRoom(found)
    }

    // Parpadeo cálido de farolas del patio
    if (courtyardLightRef.current) {
      courtyardLightRef.current.intensity = 3.2 + Math.sin(time * 4.0) * 0.4
    }

    // Chimenea del salón interior
    if (fireplaceLightRef.current) {
      fireplaceLightRef.current.intensity = 3.5 + Math.sin(time * 8.0) * 0.6 + Math.cos(time * 12.0) * 0.3
    }

    // Pulso cuántico del Núcleo de Aurelium en las Catacumbas / Bodega NEXO
    if (coreLightRef.current) {
      coreLightRef.current.intensity = 4.2 + Math.sin(time * 3.5) * 1.6
    }
    if (coreMeshRef.current) {
      coreMeshRef.current.rotation.y = time * 0.8
      coreMeshRef.current.rotation.x = Math.sin(time * 0.5) * 0.3
    }
    if (coreRing1Ref.current) {
      coreRing1Ref.current.rotation.x = time * 1.2
      coreRing1Ref.current.rotation.y = time * 0.6
    }
    if (coreRing2Ref.current) {
      coreRing2Ref.current.rotation.z = -time * 1.1
      coreRing2Ref.current.rotation.y = time * 0.9
    }

    // Rotación del emblema JarBees en el Porche de Entrada
    if (daisEmblemRef.current) {
      daisEmblemRef.current.rotation.z = time * 0.35
    }
  })

  return (
    <group name="AurenMansionChateauHub">
      {/* ========================================================================= */}
      {/* 1. MODELO 3D REAL DEL CHÂTEAU (MAMPOSERÍA, ESCALERAS REALES, TECHOS Y PISOS) */}
      {/* ========================================================================= */}
      {gltf.scene && <primitive object={gltf.scene} />}

      {/* ========================================================================= */}
      {/* 2. DAIS DE SALIDA / SPAWN PRINCIPAL EN EL PATIO DEL CHÂTEAU [8.08, 6.82, -54.04] */}
      {/* ========================================================================= */}
      <group position={[8.08, 6.82, -54.04]} name="SpawnDais">
        {/* Plataforma base hexagonal de titanio oscuro */}
        <mesh receiveShadow position={[0, 0.05, 0]}>
          <cylinderGeometry args={[3.8, 4.2, 0.14, 6]} />
          <meshStandardMaterial color="#0f172a" roughness={0.35} metalness={0.8} />
        </mesh>

        {/* Anillo exterior Aurelium Gold */}
        <mesh position={[0, 0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.5, 3.75, 6]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.9} />
        </mesh>

        {/* Anillo interior cian JarBees */}
        <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.2, 2.4, 32]} />
          <meshBasicMaterial color="#55F0FF" transparent opacity={0.85} />
        </mesh>

        {/* Emblema hexagonal rotatorio JarBees */}
        <mesh ref={daisEmblemRef} position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.9, 1.15, 6]} />
          <meshBasicMaterial color="#55F0FF" transparent opacity={0.85} />
        </mesh>

        {/* Luz puntual de despliegue sobre los pies de Auren */}
        <pointLight position={[0, 0.9, 0]} color="#55F0FF" intensity={2.0} distance={8} />

        {/* Rótulo AR Holográfico flotante de bienvenida */}
        <Html position={[0, 3.2, -1.2]} center distanceFactor={20}>
          <div
            style={{
              padding: '8px 18px',
              background: 'rgba(10, 16, 26, 0.92)',
              border: '2px solid rgba(229, 169, 60, 0.85)',
              borderRadius: '10px',
              boxShadow: '0 0 25px rgba(229, 169, 60, 0.45)',
              color: '#F8FAFC',
              fontFamily: 'monospace',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '1px',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div style={{ color: '#E5A93C', fontSize: '13px', marginBottom: '3px' }}>
              ⬡ LA MANSIÓN AUREN · CUARTEL GENERAL
            </div>
            <div style={{ color: '#55F0FF', fontSize: '10px', textTransform: 'uppercase' }}>
              CHÂTEAU DE PAGES & CENTRO DE OPERACIONES DE JARBEES
            </div>
            <div style={{ color: '#94A3B8', fontSize: '9px', marginTop: '3px' }}>
              JARDINES FRANCESES · SALÓN SEÑORIAL · CATACUMBAS NEXO
            </div>
          </div>
        </Html>
      </group>

      {/* ========================================================================= */}
      {/* 3. ILUMINACIÓN ATMOSFÉRICA DEL CHÂTEAU                                    */}
      {/* ========================================================================= */}
      {/* Farola principal del patio */}
      <pointLight ref={courtyardLightRef} position={[8.08, 9.5, -54.04]} color="#FFE0B2" intensity={3.5} distance={25} />
      {/* Luz cálida en la entrada del salón */}
      <pointLight ref={fireplaceLightRef} position={[0.0, 12.0, 10.0]} color="#FFF3E0" intensity={4.0} distance={35} />
      {/* Luz ambiente en terraza exterior */}
      <pointLight position={[-15.0, 8.5, -30.0]} color="#FFD54F" intensity={2.8} distance={25} />

      {/* ========================================================================= */}
      {/* 4. SÓTANO / BODEGA NEXO: NÚCLEO CUÁNTICO & PORTAL DE MUNDOS [-15, 7.5, 25] */}
      {/* ========================================================================= */}
      <group position={[-15.0, 7.5, 25.0]} name="NexoCatacombsCore">
        {/* Pedestal de titanio oscuro */}
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[1.8, 2.2, 0.6, 8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Cristal de Aurelium levitante */}
        <mesh ref={coreMeshRef} castShadow>
          <dodecahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial
            color="#FFD700"
            roughness={0.15}
            metalness={0.95}
            emissive="#E5A93C"
            emissiveIntensity={0.65}
          />
        </mesh>

        {/* Anillos cuánticos giroscópicos */}
        <mesh ref={coreRing1Ref}>
          <torusGeometry args={[1.3, 0.05, 16, 64]} />
          <meshBasicMaterial color="#55F0FF" transparent opacity={0.85} />
        </mesh>
        <mesh ref={coreRing2Ref}>
          <torusGeometry args={[1.6, 0.05, 16, 64]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.85} />
        </mesh>

        {/* Luz cuántica omnidireccional */}
        <pointLight ref={coreLightRef} color="#55F0FF" intensity={4.5} distance={18} castShadow />

        {/* Rótulo AR de estado del Núcleo JarBees */}
        <Html position={[0, 1.8, 0]} center distanceFactor={14}>
          <div
            style={{
              background: 'rgba(6, 182, 212, 0.92)',
              color: '#042F2E',
              fontFamily: 'monospace',
              fontSize: '10px',
              fontWeight: 900,
              padding: '4px 10px',
              borderRadius: '6px',
              border: '1px solid #FFFFFF',
              boxShadow: '0 0 15px rgba(6, 182, 212, 0.8)',
              whiteSpace: 'nowrap',
            }}
          >
            ⬡ NÚCLEO CUÁNTICO JARBEES · BODEGA NEXO
          </div>
        </Html>
      </group>

      {/* PORTAL HOLOGRÁFICO SINTONIZADOR DE MUNDOS CS 1.6 */}
      <group position={[-9.0, 7.5, 25.0]} name="WorldGateway">
        {/* Marco de latón dorado */}
        <mesh>
          <torusGeometry args={[1.6, 0.1, 16, 32]} />
          <meshStandardMaterial color="#E5A93C" roughness={0.25} metalness={0.85} />
        </mesh>
        {/* Membrana vortex cian */}
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <circleGeometry args={[1.5, 32]} />
          <meshBasicMaterial color="#55F0FF" transparent opacity={0.7} />
        </mesh>
        <pointLight color="#38BDF8" intensity={2.5} distance={8} />

        {/* Botón interactivo 3D para desplegar selector de mapas */}
        <Html position={[0, 2.2, 0]} center distanceFactor={14}>
          <button
            onClick={() => setShowPortalModal(!showPortalModal)}
            style={{
              background: '#0284C7',
              border: '2px solid #BAE6FD',
              borderRadius: '8px',
              color: '#FFFFFF',
              fontFamily: 'monospace',
              fontSize: '11px',
              fontWeight: 800,
              padding: '6px 12px',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.8)',
              whiteSpace: 'nowrap',
            }}
          >
            🌌 PORTAL DE MUNDOS CS 1.6
          </button>
        </Html>
      </group>

      {/* ========================================================================= */}
      {/* 5. HUD AR FLOTANTE DE LOCALIZACIÓN EN TIEMPO REAL                         */}
      {/* ========================================================================= */}
      <Html position={[0, 1.5, 0]} style={{ pointerEvents: 'none' }}>
        <div
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.88)',
            border: `1.5px solid ${currentRoom.badgeColor || '#E5A93C'}`,
            borderRadius: '12px',
            padding: '6px 16px',
            color: '#F8FAFC',
            fontFamily: 'monospace',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '1px',
            boxShadow: `0 0 20px ${currentRoom.badgeColor || '#E5A93C'}40`,
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 100,
          }}
        >
          <span style={{ color: currentRoom.badgeColor || '#E5A93C', fontSize: '13px' }}>
            ●
          </span>
          <span>{currentRoom.name}</span>
          <span
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '9px',
              color: '#94A3B8',
            }}
          >
            {currentRoom.floor}
          </span>
        </div>
      </Html>

      {/* ========================================================================= */}
      {/* 6. MODAL INTERACTIVO DEL SINTONIZADOR DE MUNDOS SATÉLITES                 */}
      {/* ========================================================================= */}
      {showPortalModal && (
        <Html center>
          <div
            style={{
              width: '320px',
              background: 'rgba(15, 23, 42, 0.96)',
              border: '2px solid #38BDF8',
              borderRadius: '12px',
              padding: '16px',
              color: '#F8FAFC',
              fontFamily: 'monospace',
              boxShadow: '0 0 35px rgba(56, 189, 248, 0.5)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ color: '#38BDF8', fontWeight: 900, fontSize: '13px', marginBottom: '8px' }}>
              🌌 SINTONIZADOR DE MUNDOS JARBEES
            </div>
            <div style={{ fontSize: '10px', color: '#94A3B8', marginBottom: '12px' }}>
              Teletransporte directo desde el Château a las zonas de CS 1.6:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(['l4d_church', 'de_vertigo', 'cs_assault', 'de_aztec', 'de_chateau', 'de_westwood', 'de_rats3', 'fy_pool_day', 'fy_iceworld', 'cs_siege'] as CSMapId[]).map((mid) => (
                <button
                  key={mid}
                  onClick={() => {
                    setCsMap(mid)
                    setShowPortalModal(false)
                  }}
                  style={{
                    background: 'rgba(30, 41, 59, 0.85)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '6px',
                    color: '#E0F2FE',
                    padding: '8px 12px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  {CS_MAPS[mid]?.label || mid}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPortalModal(false)}
              style={{
                marginTop: '12px',
                width: '100%',
                background: '#EF4444',
                border: 'none',
                borderRadius: '6px',
                color: '#FFFFFF',
                padding: '6px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '10px',
              }}
            >
              CERRAR PORTAL
            </button>
          </div>
        </Html>
      )}
    </group>
  )
}
