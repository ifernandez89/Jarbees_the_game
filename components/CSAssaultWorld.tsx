'use client'

import React, { useRef, useState, useEffect, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useSecureGLTF } from '@/utils/useSecureGLTF'
import { getAssetPath } from '@/utils/assetPath'
import { useGameStore, CS_MAPS, type CSMapId } from '@/store/gameStore'
import { setGroundCollider } from '@/systems/GroundCollisionManager'
import type { GLTF } from 'three-stdlib'

type GLTFResult = GLTF & {
  nodes: { [key: string]: THREE.Mesh }
  materials: { [key: string]: THREE.Material }
}

// =========================================================================
// 1. ESCENA CS_ASSAULT (Almacén, Puente de trenes, Ventilación y Rehenes)
// =========================================================================
function AssaultScene() {
  const gltf = useSecureGLTF(getAssetPath('/models/cs_assault.glb')) as GLTFResult

  useEffect(() => {
    if (gltf.scene) {
      setGroundCollider(gltf.scene)
    }
  }, [gltf.scene])

  const playerPos = useGameStore((state) => state.position)
  const flight = useGameStore((state) => state.flight)

  const [inHostageRoom, setInHostageRoom] = useState(false)
  const [inVentDuct, setInVentDuct] = useState(false)
  const warehouseLightRef = useRef<THREE.PointLight>(null)
  const beaconLightRef = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    const p = new THREE.Vector3(playerPos[0], playerPos[1], playerPos[2])

    const hostagePos = new THREE.Vector3(-8.53, 9.75, -39.83)
    setInHostageRoom(p.distanceTo(hostagePos) < 5.0)

    const ventPos = new THREE.Vector3(5.0, 16.5, -18.0)
    setInVentDuct(p.distanceTo(ventPos) < 4.0)

    if (warehouseLightRef.current) {
      warehouseLightRef.current.intensity = 2.5 + Math.sin(time * 6.0) * 0.8
    }
    if (beaconLightRef.current) {
      beaconLightRef.current.intensity = 3.0 + Math.sin(time * 3.0) * 1.5
    }
  })

  return (
    <group>
      <fog attach="fog" args={['#8094a6', 60, 260]} />
      <ambientLight intensity={0.8} color="#b8cad8" />
      <directionalLight position={[45, 90, 30]} intensity={1.8} color="#fff4e0" castShadow />
      <directionalLight position={[-30, 20, -40]} intensity={0.4} color="#7890a8" />

      {gltf.scene && <primitive object={gltf.scene} castShadow receiveShadow />}

      {/* Luces puntuales de almacén */}
      <pointLight position={[0, 12.0, -32.0]} color="#FFF3E0" intensity={4.0} distance={35} />
      <pointLight position={[15.0, 12.0, -32.0]} color="#FFF3E0" intensity={3.5} distance={30} />
      <pointLight position={[-15.0, 12.0, -32.0]} color="#FFF3E0" intensity={3.5} distance={30} />
      <pointLight position={[4.88, 12.5, -38.61]} color="#FFA726" intensity={3.0} distance={15} />
      <pointLight ref={warehouseLightRef} position={[-8.53, 11.0, -39.83]} color="#EF4444" intensity={2.5} distance={12} />
      <pointLight ref={beaconLightRef} position={[30.0, 14.5, -5.0]} color="#00E676" intensity={3.0} distance={20} />

      {/* Rótulos Holográficos Assault */}
      <Html position={[34.54, 4.2, 21.95]} center distanceFactor={28}>
        <div style={{ background: 'rgba(15, 23, 42, 0.94)', border: '2px solid #38BDF8', borderRadius: '6px', padding: '6px 14px', color: '#E0F2FE', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', boxShadow: '0 0 16px rgba(56, 189, 248, 0.7)', textTransform: 'uppercase', textAlign: 'center' }}>
          <div style={{ color: '#38BDF8' }}>▲ CT SPAWN // FURGONETA DE ASALTO CS 1.6</div>
          <div style={{ color: '#BAE6FD', fontSize: '9px' }}>CS_ASSAULT • ALMACÉN Y ACCESO A PUENTE ELEVADO</div>
        </div>
      </Html>

      <Html position={[0.0, 19.5, -28.0]} center distanceFactor={45}>
        <div style={{ background: 'rgba(24, 20, 15, 0.94)', border: '2px solid #E5A93C', borderRadius: '6px', padding: '8px 18px', color: '#FFF8E1', fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', boxShadow: '0 0 20px rgba(229, 169, 60, 0.7)', textTransform: 'uppercase', textAlign: 'center' }}>
          <div style={{ color: '#FFD54F', fontSize: '14px' }}>BLARCO SUPPLY DEPOT // WAREHOUSE</div>
          <div style={{ color: '#FFE082', fontSize: '10px' }}>CS_ASSAULT • ALMACÉN TÁCTICO ORIGINAL</div>
        </div>
      </Html>

      <Html position={[5.0, 18.5, -18.0]} center distanceFactor={24}>
        <div style={{ background: inVentDuct ? 'rgba(0, 230, 118, 0.95)' : 'rgba(30, 41, 59, 0.92)', border: `1px solid ${inVentDuct ? '#00E676' : '#94A3B8'}`, borderRadius: '4px', padding: '5px 12px', color: '#FFFFFF', fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
          {inVentDuct ? '✓ DENTRO DE LOS CONDUCTOS' : '▲ CONDUCTO DE VENTILACIÓN'}
        </div>
      </Html>

      {/* Monitor CRT Vigilancia */}
      <Html position={[-14.0, 11.5, -28.0]} transform rotation={[0, Math.PI / 2, 0]} distanceFactor={18}>
        <div style={{ width: '240px', background: 'rgba(5, 15, 10, 0.95)', border: '2px solid #00E676', borderRadius: '6px', padding: '10px', color: '#00E676', fontFamily: 'monospace', fontSize: '11px', boxShadow: '0 0 20px rgba(0, 230, 118, 0.6)', pointerEvents: 'none' }}>
          <div style={{ borderBottom: '1px solid #00E676', paddingBottom: '4px', marginBottom: '6px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
            <span>ASSAULT SURVEILLANCE</span>
            <span>● REC</span>
          </div>
          <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
            <div>CAM 1: PUERTA PRINCIPAL <span style={{ color: '#FFD54F' }}>[ACTIVA]</span></div>
            <div>CAM 2: CONDUCTOS TECHO <span style={{ color: '#FFD54F' }}>[ACTIVA]</span></div>
            <div>CAM 3: PASARELA SUPERIOR <span style={{ color: '#00E676' }}>[OK]</span></div>
            <div>CAM 4: SALA DE REHENES <span style={{ color: '#EF4444' }}>[ALERTA]</span></div>
          </div>
          <div style={{ marginTop: '6px', borderTop: '1px solid #00E676', paddingTop: '4px', fontSize: '9px', color: '#80E27E' }}>
            PILOTO AUREN // MACH {flight.mach.toFixed(2)}
          </div>
        </div>
      </Html>
    </group>
  )
}

// =========================================================================
// 2. ESCENA CS_SIEGE (Cañón rocoso, Túneles subterráneos y APC)
// =========================================================================
function SiegeScene() {
  const gltf = useSecureGLTF(getAssetPath('/models/cs_siege.glb')) as GLTFResult

  useEffect(() => {
    if (gltf.scene) {
      setGroundCollider(gltf.scene)
    }
  }, [gltf.scene])

  return (
    <group>
      {/* Atmósfera árida de cañón rocoso */}
      <fog attach="fog" args={['#968875', 70, 320]} />
      <ambientLight intensity={0.85} color="#c2b299" />
      <directionalLight position={[60, 95, -40]} intensity={2.0} color="#ffedd5" castShadow />
      <directionalLight position={[-40, 25, 50]} intensity={0.5} color="#8a7e70" />

      {gltf.scene && <primitive object={gltf.scene} castShadow receiveShadow />}

      {/* Luces puntuales en los túneles y garajes */}
      <pointLight position={[-52.12, 23.0, -54.86]} color="#FFE0B2" intensity={3.5} distance={30} />
      <pointLight position={[10.0, 12.0, -10.0]} color="#FFCC80" intensity={4.0} distance={40} />
      <pointLight position={[60.0, 20.0, -40.0]} color="#FF9800" intensity={3.5} distance={35} />

      {/* Rótulo CT Spawn y APC de Siege */}
      <Html position={[-52.12, 22.8, -54.86]} center distanceFactor={28}>
        <div style={{ background: 'rgba(28, 25, 23, 0.94)', border: '2px solid #F59E0B', borderRadius: '6px', padding: '6px 14px', color: '#FEF3C7', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', boxShadow: '0 0 16px rgba(245, 158, 11, 0.7)', textTransform: 'uppercase', textAlign: 'center' }}>
          <div style={{ color: '#FBBF24' }}>▲ CT SPAWN // CAÑÓN & APC DE ASALTO</div>
          <div style={{ color: '#FDE68A', fontSize: '9px' }}>CS_SIEGE • CAÑÓN ROCOSO Y ACCESO A TÚNELES</div>
        </div>
      </Html>

      {/* Rótulo Entrada al Túnel Subterráneo */}
      <Html position={[0.0, 16.0, -25.0]} center distanceFactor={35}>
        <div style={{ background: 'rgba(20, 20, 20, 0.92)', border: '1px solid #F97316', borderRadius: '4px', padding: '5px 12px', color: '#FFEDD5', fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
          TÚNELES SUBTERRÁNEOS & ZONA DE EMBOSCADA
        </div>
      </Html>
    </group>
  )
}

// =========================================================================
// 3. ESCENA DE_AZTEC (Templos milenarios, Ruinas, Puente y Canales)
// =========================================================================
function AztecScene() {
  const gltf = useSecureGLTF(getAssetPath('/models/de_aztec.glb')) as GLTFResult

  useEffect(() => {
    if (gltf.scene) {
      setGroundCollider(gltf.scene)
    }
  }, [gltf.scene])

  return (
    <group>
      {/* Atmósfera húmeda selvática con niebla verde-grisácea */}
      <fog attach="fog" args={['#607268', 60, 280]} />
      <ambientLight intensity={0.9} color="#94a89d" />
      <directionalLight position={[35, 90, 45]} intensity={1.7} color="#e0ece6" castShadow />
      <directionalLight position={[-45, 30, -35]} intensity={0.4} color="#607268" />

      {gltf.scene && <primitive object={gltf.scene} castShadow receiveShadow />}

      {/* Luces cálidas de antorchas en los templos aztecas */}
      <pointLight position={[-63.20, 12.0, -2.84]} color="#FFB74D" intensity={3.5} distance={25} />
      <pointLight position={[10.0, 14.0, 0.0]} color="#FFA726" intensity={4.0} distance={30} />
      <pointLight position={[35.0, 12.0, 20.0]} color="#FF9800" intensity={3.5} distance={25} />

      {/* Rótulo CT Spawn Aztec */}
      <Html position={[-63.20, 11.8, -2.84]} center distanceFactor={28}>
        <div style={{ background: 'rgba(15, 28, 20, 0.94)', border: '2px solid #10B981', borderRadius: '6px', padding: '6px 14px', color: '#D1FAE5', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', boxShadow: '0 0 16px rgba(16, 185, 129, 0.7)', textTransform: 'uppercase', textAlign: 'center' }}>
          <div style={{ color: '#34D399' }}>▲ CT SPAWN // PATIO DE TEMPLOS AZTECAS</div>
          <div style={{ color: '#A7F3D0', fontSize: '9px' }}>DE_AZTEC • RUINAS MILENARIAS Y PUENTE COLGANTE</div>
        </div>
      </Html>

      {/* Rótulo Puente Colgante Legendario */}
      <Html position={[0.0, 15.5, 0.0]} center distanceFactor={35}>
        <div style={{ background: 'rgba(20, 30, 24, 0.92)', border: '1px solid #10B981', borderRadius: '4px', padding: '5px 12px', color: '#ECFDF5', fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
          PUENTE COLGANTE AZTECA // SNIPER ALLEY
        </div>
      </Html>
    </group>
  )
}

// =========================================================================
// 4. ESCENA DE_CHATEAU (Mansión francesa, Jardines señoriales y Catacumbas)
// =========================================================================
function ChateauScene() {
  const gltf = useSecureGLTF(getAssetPath('/models/de_chateau.glb')) as GLTFResult

  useEffect(() => {
    if (gltf.scene) {
      setGroundCollider(gltf.scene)
    }
  }, [gltf.scene])

  return (
    <group>
      {/* Atmósfera suave campestre europea */}
      <fog attach="fog" args={['#7f93a6', 60, 300]} />
      <ambientLight intensity={0.85} color="#b4c2ce" />
      <directionalLight position={[60, 85, 20]} intensity={1.8} color="#fff1e0" castShadow />
      <directionalLight position={[-40, 30, -50]} intensity={0.45} color="#788b9c" />

      {gltf.scene && <primitive object={gltf.scene} castShadow receiveShadow />}

      {/* Farolas del patio y luces de la mansión */}
      <pointLight position={[8.08, 9.0, -54.04]} color="#FFE0B2" intensity={3.5} distance={25} />
      <pointLight position={[0.0, 12.0, 10.0]} color="#FFF3E0" intensity={4.0} distance={35} />
      <pointLight position={[-15.0, 8.0, 25.0]} color="#FFD54F" intensity={3.0} distance={25} />

      {/* Rótulo CT Spawn Château */}
      <Html position={[8.08, 8.4, -54.04]} center distanceFactor={28}>
        <div style={{ background: 'rgba(20, 28, 40, 0.94)', border: '2px solid #60A5FA', borderRadius: '6px', padding: '6px 14px', color: '#EFF6FF', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', boxShadow: '0 0 16px rgba(96, 165, 250, 0.7)', textTransform: 'uppercase', textAlign: 'center' }}>
          <div style={{ color: '#93C5FD' }}>▲ CT SPAWN // PATIO PRINCIPAL DEL CHÂTEAU</div>
          <div style={{ color: '#BFDBFE', fontSize: '9px' }}>DE_CHATEAU • MANSIÓN SEÑORIAL Y JARDINES</div>
        </div>
      </Html>

      {/* Rótulo Gran Mansión */}
      <Html position={[0.0, 16.0, 10.0]} center distanceFactor={35}>
        <div style={{ background: 'rgba(25, 30, 42, 0.92)', border: '1px solid #93C5FD', borderRadius: '4px', padding: '5px 12px', color: '#F8FAFC', fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
          CHÂTEAU MANOR // CATACUMBAS Y BODEGA SUBTERRÁNEA
        </div>
      </Html>
    </group>
  )
}

// =========================================================================
// 5. ESCENA FY_POOL_DAY (Piscina comunitaria, Trampolines y Azulejos - Squall)
// =========================================================================
function PoolDayScene() {
  const gltf = useSecureGLTF(getAssetPath('/models/fy_pool_day.glb')) as GLTFResult

  useEffect(() => {
    if (gltf.scene) {
      setGroundCollider(gltf.scene)
    }
  }, [gltf.scene])

  return (
    <group>
      <fog attach="fog" args={['#78b0c8', 35, 180]} />
      <ambientLight intensity={0.95} color="#b8e0f0" />
      <directionalLight position={[25, 80, 20]} intensity={2.0} color="#fff8e0" castShadow />
      <directionalLight position={[-25, 30, -30]} intensity={0.5} color="#6090a8" />

      {gltf.scene && <primitive object={gltf.scene} castShadow receiveShadow />}

      {/* Brillo acuático cian de la piscina */}
      <pointLight position={[-8.25, 6.0, 5.0]} color="#00E5FF" intensity={3.5} distance={20} />
      <pointLight position={[5.0, 7.0, -5.0]} color="#38BDF8" intensity={3.0} distance={18} />

      {/* Rótulos Holográficos Pool Day */}
      <Html position={[-8.25, 9.8, 14.35]} center distanceFactor={22}>
        <div style={{ background: 'rgba(12, 30, 45, 0.94)', border: '2px solid #00E5FF', borderRadius: '6px', padding: '6px 14px', color: '#E0F7FA', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', boxShadow: '0 0 16px rgba(0, 229, 255, 0.7)', textTransform: 'uppercase', textAlign: 'center' }}>
          <div style={{ color: '#00E5FF' }}>▲ SPAWN PISCINA // SQUALL'S FY_POOL_DAY</div>
          <div style={{ color: '#B2EBF2', fontSize: '9px' }}>MAPA COMUNITARIO OPEN SOURCE • TRAMPOLINES Y AGUA</div>
        </div>
      </Html>
    </group>
  )
}

// =========================================================================
// 6. ESCENA DE_RATS3 (Cocina / Habitación gigante - Chris "Giles" Green)
// =========================================================================
function Rats3Scene() {
  const gltf = useSecureGLTF(getAssetPath('/models/de_rats3.glb')) as GLTFResult

  useEffect(() => {
    if (gltf.scene) {
      setGroundCollider(gltf.scene)
    }
  }, [gltf.scene])

  return (
    <group>
      <fog attach="fog" args={['#988870', 45, 240]} />
      <ambientLight intensity={0.9} color="#b8aa90" />
      <directionalLight position={[40, 90, -10]} intensity={1.9} color="#fff2d8" castShadow />
      <directionalLight position={[-30, 25, 40]} intensity={0.4} color="#786850" />

      {gltf.scene && <primitive object={gltf.scene} castShadow receiveShadow />}

      {/* Luz cálida de lámpara de escritorio y estanterías gigantes */}
      <pointLight position={[-11.38, 22.0, -11.58]} color="#FFA726" intensity={4.0} distance={35} />
      <pointLight position={[0.0, 15.0, 0.0]} color="#FFD54F" intensity={3.5} distance={30} />

      <Html position={[-11.38, 20.8, -11.58]} center distanceFactor={26}>
        <div style={{ background: 'rgba(30, 24, 15, 0.94)', border: '2px solid #F59E0B', borderRadius: '6px', padding: '6px 14px', color: '#FEF3C7', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', boxShadow: '0 0 16px rgba(245, 158, 11, 0.7)', textTransform: 'uppercase', textAlign: 'center' }}>
          <div style={{ color: '#FBBF24' }}>▲ SPAWN RATAS // DE_RATS3 (CHRIS GILES GREEN)</div>
          <div style={{ color: '#FDE68A', fontSize: '9px' }}>HABITACIÓN GIGANTE • JUGADOR ESCALA INSECTO</div>
        </div>
      </Html>
    </group>
  )
}

// =========================================================================
// 7. ESCENA DE_WESTWOOD (Pueblo del Viejo Oeste - Chris "MacMan" Mair)
// =========================================================================
function WestwoodScene() {
  const gltf = useSecureGLTF(getAssetPath('/models/de_westwood.glb')) as GLTFResult

  useEffect(() => {
    if (gltf.scene) {
      setGroundCollider(gltf.scene)
    }
  }, [gltf.scene])

  return (
    <group>
      <fog attach="fog" args={['#bc8a5f', 55, 280]} />
      <ambientLight intensity={0.88} color="#d4a373" />
      <directionalLight position={[50, 85, 30]} intensity={2.1} color="#ffedd5" castShadow />
      <directionalLight position={[-40, 30, -40]} intensity={0.45} color="#8a5a3a" />

      {gltf.scene && <primitive object={gltf.scene} castShadow receiveShadow />}

      {/* Faroles del saloon y cárcel */}
      <pointLight position={[22.76, 12.0, 4.90]} color="#FF9800" intensity={3.5} distance={30} />
      <pointLight position={[0.0, 10.0, 0.0]} color="#FFB74D" intensity={3.0} distance={25} />

      <Html position={[22.76, 10.8, 4.90]} center distanceFactor={26}>
        <div style={{ background: 'rgba(38, 22, 12, 0.94)', border: '2px solid #EA580C', borderRadius: '6px', padding: '6px 14px', color: '#FFEDD5', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', boxShadow: '0 0 16px rgba(234, 88, 12, 0.7)', textTransform: 'uppercase', textAlign: 'center' }}>
          <div style={{ color: '#FB923C' }}>▲ PUEBLO OESTE // DE_WESTWOOD (MACMAN)</div>
          <div style={{ color: '#FED7AA', fontSize: '9px' }}>SALOON, IGLESIA Y CALLES DE TIERRA</div>
        </div>
      </Html>
    </group>
  )
}

// =========================================================================
// 8. ESCENA FY_ICEWORLD (Arena glacial de bloques de hielo - Comunidad)
// =========================================================================
function IceworldScene() {
  const gltf = useSecureGLTF(getAssetPath('/models/fy_iceworld.glb')) as GLTFResult

  useEffect(() => {
    if (gltf.scene) {
      setGroundCollider(gltf.scene)
    }
  }, [gltf.scene])

  return (
    <group>
      <fog attach="fog" args={['#90b4c8', 25, 140]} />
      <ambientLight intensity={1.0} color="#d0eef8" />
      <directionalLight position={[10, 85, 10]} intensity={2.0} color="#ffffff" castShadow />

      {gltf.scene && <primitive object={gltf.scene} castShadow receiveShadow />}

      <pointLight position={[-9.80, 5.0, -17.88]} color="#00E5FF" intensity={3.0} distance={15} />

      <Html position={[-9.80, 4.8, -17.88]} center distanceFactor={20}>
        <div style={{ background: 'rgba(10, 25, 35, 0.94)', border: '2px solid #38BDF8', borderRadius: '6px', padding: '5px 12px', color: '#E0F2FE', fontFamily: 'monospace', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap', boxShadow: '0 0 14px rgba(56, 189, 248, 0.7)', textTransform: 'uppercase', textAlign: 'center' }}>
          <div style={{ color: '#38BDF8' }}>▲ ARENA GLACIAL // FY_ICEWORLD</div>
          <div style={{ color: '#BAE6FD', fontSize: '8px' }}>BLOQUES DE HIELO • MAPA CLÁSICO ULTRA LIGERO</div>
        </div>
      </Html>
    </group>
  )
}

// =========================================================================
// 9. ESCENA DE_VERTIGO (Rascacielos en construcción con verticalidad extrema)
// =========================================================================
function VertigoScene() {
  const gltf = useSecureGLTF(getAssetPath('/models/de_vertigo.glb')) as GLTFResult

  useEffect(() => {
    if (gltf.scene) {
      setGroundCollider(gltf.scene)
    }
  }, [gltf.scene])

  return (
    <group>
      {/* Atmósfera ventosa de gran altitud en rascacielos */}
      <fog attach="fog" args={['#8caebf', 40, 240]} />
      <ambientLight intensity={0.92} color="#b4cee0" />
      <directionalLight position={[50, 95, 20]} intensity={2.1} color="#ffffff" castShadow />
      <directionalLight position={[-30, 30, -50]} intensity={0.4} color="#688a9e" />

      {gltf.scene && <primitive object={gltf.scene} castShadow receiveShadow />}

      {/* Reflectores de obra en construcción y balizas amarillas */}
      <pointLight position={[27.64, 22.0, -29.26]} color="#FBBF24" intensity={4.0} distance={30} />
      <pointLight position={[4.06, 13.5, -28.45]} color="#EF4444" intensity={3.5} distance={25} />
      <pointLight position={[0.0, 22.0, 0.0]} color="#38BDF8" intensity={3.0} distance={30} />

      {/* Rótulo Nivel Superior Vertigo */}
      <Html position={[27.64, 21.2, -29.26]} center distanceFactor={26}>
        <div style={{ background: 'rgba(25, 25, 30, 0.94)', border: '2px solid #F59E0B', borderRadius: '6px', padding: '6px 14px', color: '#FFFBEB', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', boxShadow: '0 0 16px rgba(245, 158, 11, 0.7)', textTransform: 'uppercase', textAlign: 'center' }}>
          <div style={{ color: '#FBBF24' }}>▲ CT SPAWN // PISO 51 (AZOTEA DE OBRA)</div>
          <div style={{ color: '#FDE68A', fontSize: '9px' }}>DE_VERTIGO • VERTICALIDAD EXTREMA & BOMBSITE B</div>
        </div>
      </Html>

      {/* Rótulo Nivel Inferior Vertigo */}
      <Html position={[4.06, 12.8, -28.45]} center distanceFactor={26}>
        <div style={{ background: 'rgba(20, 22, 28, 0.94)', border: '2px solid #EF4444', borderRadius: '6px', padding: '6px 14px', color: '#FEE2E2', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', boxShadow: '0 0 16px rgba(239, 68, 68, 0.7)', textTransform: 'uppercase', textAlign: 'center' }}>
          <div style={{ color: '#F87171' }}>PISO 50 // ENCOFRADO & BOMBSITE A</div>
          <div style={{ color: '#FECACA', fontSize: '9px' }}>DESNIVEL DIRECTO & RIESGO DE PRECIPICIO</div>
        </div>
      </Html>
    </group>
  )
}

// =========================================================================
// COMPONENTE PRINCIPAL: Visor Dinámico de Mapas de la Comunidad y CS
// =========================================================================
export function CSAssaultWorld() {
  const activeCsMap = useGameStore((state) => state.activeCsMap || 'fy_pool_day')

  return (
    <Suspense fallback={null}>
      {activeCsMap === 'fy_pool_day' && <PoolDayScene />}
      {activeCsMap === 'de_rats3' && <Rats3Scene />}
      {activeCsMap === 'de_westwood' && <WestwoodScene />}
      {activeCsMap === 'fy_iceworld' && <IceworldScene />}
      {activeCsMap === 'cs_siege' && <SiegeScene />}
      {activeCsMap === 'de_aztec' && <AztecScene />}
      {activeCsMap === 'de_chateau' && <ChateauScene />}
      {activeCsMap === 'cs_assault' && <AssaultScene />}
      {activeCsMap === 'de_vertigo' && <VertigoScene />}
    </Suspense>
  )
}

