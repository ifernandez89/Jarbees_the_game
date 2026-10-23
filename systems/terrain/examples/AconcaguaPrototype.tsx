/**
 * AconcaguaPrototype - Prototipo funcional del sistema de terrenos
 * 
 * Región: Aconcagua, Argentina (20x20 km)
 * Características demostradas:
 * - Carga de terreno real con DEM
 * - LOD dinámico
 * - Streaming asíncrono
 * - Materiales procedurales
 * - Colisiones
 * - Métricas en tiempo real
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Sky, Stats } from '@react-three/drei'
import * as THREE from 'three'
import { RealTerrain, useRealTerrain } from '@/components/RealTerrain'
import { PREDEFINED_REGIONS } from '@/systems/terrain/RealTerrainSystem'

/**
 * Componente principal del prototipo
 */
export function AconcaguaPrototype() {
  const [quality, setQuality] = useState<'low' | 'medium' | 'high' | 'ultra'>('medium')
  const [showStats, setShowStats] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* UI Controls */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '20px',
        borderRadius: '8px',
        fontFamily: 'monospace'
      }}>
        <h2>🏔️ Aconcagua Prototype</h2>
        <p>Region: 20x20 km | Elevation: 2,500m - 6,962m</p>
        
        <div style={{ marginTop: 10 }}>
          <label>Quality: </label>
          <select value={quality} onChange={(e) => setQuality(e.target.value as any)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="ultra">Ultra</option>
          </select>
        </div>

        <div style={{ marginTop: 10 }}>
          <label>
            <input 
              type="checkbox" 
              checked={showStats} 
              onChange={(e) => setShowStats(e.target.checked)}
            />
            {' '}Show Stats
          </label>
        </div>

        {isLoading && (
          <div style={{ marginTop: 20, color: '#FFD700' }}>
            ⏳ Loading terrain...
          </div>
        )}

        <div style={{ marginTop: 20, fontSize: '12px', opacity: 0.7 }}>
          Controls: Mouse to rotate, Scroll to zoom
        </div>
      </div>

      {/* 3D Scene */}
      <Canvas
        camera={{ 
          position: [5000, 3000, 5000],
          fov: 60,
          far: 50000
        }}
        gl={{ 
          antialias: true,
          alpha: false 
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[10000, 10000, 5000]}
          intensity={0.8}
          castShadow
        />

        {/* Sky */}
        <Sky
          distance={450000}
          sunPosition={[10000, 10000, 5000]}
          inclination={0.6}
          azimuth={0.25}
        />

        {/* Terrain System */}
        <RealTerrain
          region={PREDEFINED_REGIONS.aconcagua}
          quality={quality}
          onLoad={() => setIsLoading(false)}
          onError={(error) => {
            console.error('Terrain error:', error)
            setIsLoading(false)
          }}
        />

        {/* Player/Camera Controller */}
        <PlayerController />

        {/* Fog */}
        <fog attach="fog" args={['#87CEEB', 10000, 30000]} />

        {/* Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={100}
          maxDistance={20000}
          maxPolarAngle={Math.PI / 2}
        />

        {/* Stats */}
        {showStats && <Stats />}
        {showStats && <TerrainStatsOverlay />}
      </Canvas>
    </div>
  )
}

/**
 * Controlador del jugador/cámara
 */
function PlayerController() {
  const { camera } = useThree()
  const { getHeightAt, isLoaded } = useRealTerrain()
  const lastPosition = useRef(new THREE.Vector3())

  useFrame(() => {
    if (!isLoaded) return

    // Mantener la cámara por encima del terreno
    const currentPos = camera.position
    
    // Solo verificar si la cámara se movió
    if (currentPos.distanceTo(lastPosition.current) > 10) {
      const terrainHeight = getHeightAt(currentPos.x, currentPos.z)
      
      if (terrainHeight !== null) {
        const minHeight = terrainHeight + 50 // 50m sobre el terreno
        if (currentPos.y < minHeight) {
          currentPos.y = minHeight
        }
      }

      lastPosition.current.copy(currentPos)
    }
  })

  return null
}

/**
 * Overlay de estadísticas del terreno
 */
function TerrainStatsOverlay() {
  const { getStats } = useRealTerrain()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      const newStats = getStats()
      if (newStats) {
        setStats(newStats)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [getStats])

  if (!stats) return null

  return (
    <Html position={[0, 0, 0]}>
      <div style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '12px',
        minWidth: '250px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Terrain Stats</h3>
        
        <div>Quality: <strong>{stats.quality}</strong></div>
        <div>Region: <strong>{stats.currentRegion}</strong></div>
        <div>Chunks: <strong>{stats.activeChunks}</strong></div>
        <div>Triangles: <strong>{formatNumber(stats.totalTriangles)}</strong></div>
        <div>Vertices: <strong>{formatNumber(stats.totalVertices)}</strong></div>
        
        <hr style={{ margin: '10px 0', opacity: 0.3 }} />
        
        <div>Cache: <strong>{stats.cacheUsageMB?.toFixed(1) || 0} MB</strong></div>
        <div>View Dist: <strong>{(stats.viewDistance / 1000).toFixed(1)} km</strong></div>
        
        {stats.lastUpdateTime && (
          <div>Update: <strong>{stats.lastUpdateTime.toFixed(2)} ms</strong></div>
        )}
      </div>
    </Html>
  )
}

// Helper component para HTML overlay (si no tienes @react-three/drei Html)
function Html({ children, position }: { children: React.ReactNode, position: [number, number, number] }) {
  return <>{children}</>
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toFixed(0)
}

/**
 * Ejemplo de uso con un personaje volador (Auren)
 */
export function AconcaguaWithAuren() {
  return (
    <Canvas camera={{ position: [0, 1000, 0], fov: 75, far: 50000 }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[10000, 10000, 5000]} intensity={0.8} />
      
      <Sky distance={450000} sunPosition={[10000, 10000, 5000]} />
      
      <RealTerrain
        region={PREDEFINED_REGIONS.aconcagua}
        quality="high"
      />
      
      {/* Aquí iría tu componente de Auren */}
      {/* <Auren /> */}
      
      <OrbitControls />
    </Canvas>
  )
}
