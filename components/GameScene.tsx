'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { Stats } from '@react-three/drei'

// Componente placeholder para la escena
// FASE 1: Aquí irá BeePlayer, terrain, sky, etc.
function Scene() {
  return (
    <>
      {/* Luz básica */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Cubo de prueba temporal */}
      <mesh position={[0, 0, -5]}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#FFD700" />
      </mesh>

      {/* Grid de referencia */}
      <gridHelper args={[100, 100, 0x444444, 0x222222]} />
    </>
  )
}

export default function GameScene() {
  const enableStats = process.env.NEXT_PUBLIC_ENABLE_STATS === 'true'

  return (
    <>
      <Canvas
        camera={{
          position: [0, 2, 5],
          fov: 75,
          near: 0.1,
          far: 1000,
        }}
        style={{
          width: '100vw',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        
        {enableStats && <Stats />}
      </Canvas>

      {/* HUD Placeholder */}
      <div className="ui-overlay" style={{ pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '15px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          color: '#FFD700',
          fontSize: '0.9rem',
        }}>
          <div>🐝 JarBees: The Game</div>
          <div style={{ marginTop: '10px', color: '#aaa' }}>
            FASE 1 - Estructura Base<br />
            Controles: WASD / Flechas<br />
            ESC: Pausa
          </div>
        </div>

        <div style={{
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '15px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          color: '#FFD700',
          fontSize: '0.9rem',
          textAlign: 'right',
        }}>
          <div>Velocidad: 0 km/h</div>
          <div>Distancia: 0 m</div>
          <div>Altitud: 2 m</div>
        </div>
      </div>
    </>
  )
}
