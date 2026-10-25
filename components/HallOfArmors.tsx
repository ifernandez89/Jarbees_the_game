'use client'

import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useSecureGLTF } from '@/utils/useSecureGLTF'
import { getAssetPath } from '@/utils/assetPath'
import { useGameStore } from '@/store/gameStore'
import type { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: { [key: string]: THREE.Mesh }
  materials: { [key: string]: THREE.Material }
}

interface ArmorPodSpec {
  id: string
  name: string
  designation: string
  modelFile: string
  position: [number, number, number]
  colorAccent: string
  reactorType: string
  specialization: string
  machRating: string
  status: string
}

const ARMOR_ROSTER: ArmorPodSpec[] = [
  {
    id: 'armor_mark7',
    name: 'Mark VII',
    designation: 'MARK VII · COMBAT HEAVY',
    modelFile: '/models/armor_mark7.glb',
    position: [13.4, 0.0, -2.2],
    colorAccent: '#EF4444',
    reactorType: 'Arc Reactor Cuántico v3',
    specialization: 'Defensa Pesada & Micro-misiles',
    machRating: 'Mach 2.2',
    status: 'EN RESERVA',
  },
  {
    id: 'armor_heartbreaker',
    name: 'Heartbreaker',
    designation: 'MARK XVII · HEARTBREAKER',
    modelFile: '/models/armor_heartbreaker.glb',
    position: [13.4, 0.0, 0.4],
    colorAccent: '#F59E0B',
    reactorType: 'Chest RT Sobredimensionado',
    specialization: 'Escudos Repulsores & Artillería',
    machRating: 'Mach 2.8',
    status: 'CARGA 100%',
  },
  {
    id: 'armor_silver_centurion',
    name: 'Silver Centurion',
    designation: 'MARK XXXIII · SILVER CENTURION',
    modelFile: '/models/armor_silver_centurion.glb',
    position: [13.4, 0.0, 3.0],
    colorAccent: '#06B6D4',
    reactorType: 'Uni-Beam Criogénico Polar',
    specialization: 'Hojas de Plasma & Clima Extremo',
    machRating: 'Mach 3.2',
    status: 'OPTIMIZADO POLAR',
  },
  {
    id: 'armor_mark42',
    name: 'Mark 42',
    designation: 'MARK XLII · AUTONOMOUS PROPULSION',
    modelFile: '/models/armor_mark42.glb',
    position: [13.4, 0.0, 5.6],
    colorAccent: '#EAB308',
    reactorType: 'Hex-Arc Descentralizado',
    specialization: 'Acoplamiento Remoto Prehensil',
    machRating: 'Mach 3.8',
    status: 'STANDBY ACTIVO',
  },
  {
    id: 'armor_war_machine',
    name: 'War Machine Mk II',
    designation: 'WAR MACHINE MK II · TACTICAL RESPONSE',
    modelFile: '/models/armor_war_machine.glb',
    position: [13.4, 0.0, 8.2],
    colorAccent: '#94A3B8',
    reactorType: 'Generador Híbrido Militar',
    specialization: 'Cañón de Hombro & Balística',
    machRating: 'Mach 2.0',
    status: 'STANDBY ARTILLADO',
  },
]

// Pod Individual de Armadura con vitrina y telemetría holográfica
function ArmorPod({
  spec,
  isSelected,
  onSelect,
}: {
  spec: ArmorPodSpec
  isSelected: boolean
  onSelect: () => void
}) {
  const gltf = useSecureGLTF(getAssetPath(spec.modelFile)) as GLTFResult
  const scanBeamRef = useRef<THREE.Mesh>(null)
  const auraRef = useRef<THREE.Mesh>(null)
  const [showInfo, setShowInfo] = useState(false)

  // Animación del haz de escaneo holográfico y aura del pod
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (scanBeamRef.current) {
      // Movimiento vertical cíclico de escáner biométrico
      scanBeamRef.current.position.y = 0.95 + Math.sin(t * 1.8) * 0.85
    }
    if (auraRef.current) {
      auraRef.current.rotation.z = t * 0.4
    }
  })

  return (
    <group position={spec.position} rotation={[0, -Math.PI / 2, 0]}>
      {/* 1. Malla 3D del Traje de Iron Man / Auren */}
      {gltf.scene && (
        <primitive
          object={gltf.scene}
          position={[0, 0.15, 0]}
          onClick={(e: { stopPropagation: () => void }) => {
            e.stopPropagation()
            onSelect()
            setShowInfo(!showInfo)
          }}
        />
      )}

      {/* 2. Haz de escaneo biométrico holográfico */}
      <mesh ref={scanBeamRef} position={[0, 1.0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.05, 0.65, 32]} />
        <meshBasicMaterial
          color={spec.colorAccent}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Base / Pedestal de Titanio Oscuro (Dais Octagonal) */}
      <mesh position={[0, 0.075, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[0.85, 0.95, 0.15, 8]} />
        <meshStandardMaterial
          color="#0B0F17"
          roughness={0.25}
          metalness={0.88}
        />
      </mesh>

      {/* Anillo de energía en la base del pedestal */}
      <mesh ref={auraRef} position={[0, 0.155, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.72, 0.82, 8]} />
        <meshBasicMaterial
          color={spec.colorAccent}
          transparent
          opacity={isSelected ? 0.95 : 0.65}
        />
      </mesh>

      {/* 4. Estructura de Arco Posterior (Alcove Gantry) */}
      {/* Columna Izquierda */}
      <mesh position={[-0.8, 1.15, -0.45]} castShadow>
        <boxGeometry args={[0.1, 2.3, 0.15]} />
        <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.3} />
      </mesh>
      {/* Columna Derecha */}
      <mesh position={[0.8, 1.15, -0.45]} castShadow>
        <boxGeometry args={[0.1, 2.3, 0.15]} />
        <meshStandardMaterial color="#1E293B" metalness={0.85} roughness={0.3} />
      </mesh>
      {/* Dintel Superior */}
      <mesh position={[0, 2.3, -0.38]} castShadow>
        <boxGeometry args={[1.7, 0.12, 0.35]} />
        <meshStandardMaterial color="#0F172A" metalness={0.9} roughness={0.25} />
      </mesh>
      {/* Panel Trasero de Cristal Negro */}
      <mesh position={[0, 1.15, -0.48]}>
        <boxGeometry args={[1.5, 2.15, 0.02]} />
        <meshStandardMaterial
          color="#030712"
          roughness={0.1}
          metalness={0.6}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* 5. Luces dedicadas del Pod */}
      {/* Luz inferior (Uplight de suelo) */}
      <pointLight
        position={[0, 0.25, 0.3]}
        color={spec.colorAccent}
        intensity={isSelected ? 2.5 : 1.2}
        distance={3.5}
      />
      {/* Luz cenital (Downlight desde el dintel superior) */}
      <spotLight
        position={[0, 2.25, 0.1]}
        target-position={[0, 0.9, 0]}
        color="#F8FAFC"
        intensity={isSelected ? 3.0 : 1.8}
        angle={0.65}
        penumbra={0.7}
        distance={4.5}
      />

      {/* 6. Placa Holográfica 3D Frontal al pie del Pedestal */}
      <Html position={[0, 0.22, 0.92]} center distanceFactor={7}>
        <div
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
            setShowInfo(!showInfo)
          }}
          style={{
            cursor: 'pointer',
            background: 'rgba(15, 23, 42, 0.88)',
            border: `1.5px solid ${spec.colorAccent}`,
            borderRadius: '6px',
            padding: '3px 8px',
            color: '#F8FAFC',
            fontFamily: 'monospace',
            fontSize: '9px',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            boxShadow: `0 0 14px ${spec.colorAccent}55`,
            backdropFilter: 'blur(6px)',
            transition: 'all 0.2s ease',
            userSelect: 'none',
          }}
        >
          <span style={{ color: spec.colorAccent }}>◈ </span>
          {spec.name}
          <span style={{ opacity: 0.6, fontSize: '8px', marginLeft: '4px' }}>[INFO]</span>
        </div>
      </Html>

      {/* 7. Ficha Táctica Holográfica Flotante Expandida */}
      {(showInfo || isSelected) && (
        <Html position={[0, 2.5, 0]} center distanceFactor={8}>
          <div
            style={{
              width: '240px',
              background: 'rgba(11, 15, 25, 0.94)',
              border: `2px solid ${spec.colorAccent}`,
              borderRadius: '10px',
              padding: '12px',
              color: '#F8FAFC',
              fontFamily: 'monospace',
              fontSize: '10px',
              boxShadow: `0 0 28px ${spec.colorAccent}66`,
              backdropFilter: 'blur(12px)',
              pointerEvents: 'auto',
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ color: spec.colorAccent, fontWeight: 900, fontSize: '11px', letterSpacing: '0.05em' }}>
                {spec.designation}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowInfo(false)
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  fontWeight: 900,
                  fontSize: '11px',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', color: '#CBD5E1', fontSize: '9px' }}>
              <div><strong style={{ color: '#94A3B8' }}>Reactor:</strong> {spec.reactorType}</div>
              <div><strong style={{ color: '#94A3B8' }}>Rol:</strong> {spec.specialization}</div>
              <div><strong style={{ color: '#94A3B8' }}>Propulsión:</strong> {spec.machRating}</div>
              <div>
                <strong style={{ color: '#94A3B8' }}>Estado:</strong>{' '}
                <span style={{ color: spec.colorAccent, fontWeight: 700 }}>{spec.status}</span>
              </div>
            </div>

            <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
              <div style={{ fontSize: '8px', color: '#94A3B8' }}>
                HALL OF ARMORS · VILLA AUREN NEXO-01
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

/**
 * Salón de Armaduras de Auren (Hall of Armors)
 * Ubicado en PB_Nexo_Armor_Workshop (X: 13.4, Z: -2.2 a 8.2)
 */
export function HallOfArmors() {
  const [selectedArmor, setSelectedArmor] = useState<string>('armor_silver_centurion')

  return (
    <group name="HallOfArmors">
      {/* Rótulo Holográfico Cenital del Taller */}
      <Html position={[13.4, 3.4, 3.0]} center distanceFactor={12}>
        <div
          style={{
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1.5px solid #00F0FF',
            borderRadius: '8px',
            padding: '6px 16px',
            color: '#FFFFFF',
            fontFamily: 'monospace',
            fontSize: '11px',
            fontWeight: 900,
            letterSpacing: '0.12em',
            boxShadow: '0 0 20px rgba(0, 240, 255, 0.5)',
            backdropFilter: 'blur(8px)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          ⚡ HALL OF ARMORS · ARMERÍA Y EXOTRAJE NEXO-01
        </div>
      </Html>

      {/* Galería de los 5 Pods de Armadura */}
      {ARMOR_ROSTER.map((spec) => (
        <ArmorPod
          key={spec.id}
          spec={spec}
          isSelected={selectedArmor === spec.id}
          onSelect={() => setSelectedArmor(spec.id)}
        />
      ))}
    </group>
  )
}
