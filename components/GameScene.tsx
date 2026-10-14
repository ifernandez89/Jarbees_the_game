'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import { Stats } from '@react-three/drei'
import { BeePlayer } from './BeePlayer'
import { FollowCamera } from './FollowCamera'
import { GameHUD } from './GameHUD'
import { InfiniteTerrain } from './InfiniteTerrain'
import { DynamicSky } from './DynamicSky'
import { WeatherSystem } from './WeatherSystem'
import { WaterSurface } from './WaterSurface'
import { MobileTouchControls } from './MobileTouchControls'
import { DonationButton } from './DonationButton'
import { useGameControls } from '@/hooks/useGameControls'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'

// Componente de la escena 3D
function Scene() {
  // Activar controles de teclado
  useGameControls()
  
  // Inicializar sistema de audio
  useAudio()
  
  const dayNightEnabled = useGameStore((state) => state.dayNightEnabled)
  const dayNightSpeed = useGameStore((state) => state.dayNightSpeed)
  const currentBiome = useGameStore((state) => state.currentBiome)

  return (
    <>
      {/* Sistema de cielo dinámico */}
      <DynamicSky enabled={dayNightEnabled} speed={dayNightSpeed} />
      
      {/* Sistema de clima (niebla) */}
      <WeatherSystem enabled={dayNightEnabled} />

      {/* Iluminación rica para resaltar colores originales de la abeja y el terreno */}
      <ambientLight intensity={0.85} />
      <hemisphereLight color="#ffffff" groundColor="#446835" intensity={0.75} />

      {/* Terreno infinito procedural reactivo al bioma actual */}
      <InfiniteTerrain biome={currentBiome} seed={12345} />

      {/* Superficie de agua cristalina para lagos y valles */}
      <WaterSurface waterHeight={1.4} />

      {/* Abeja jugadora */}
      <BeePlayer />

      {/* Cámara que sigue a la abeja */}
      <FollowCamera />
    </>
  )
}

export default function GameScene() {
  const enableStats = process.env.NEXT_PUBLIC_ENABLE_STATS === 'true'

  // Prevenir scroll en la página del juego
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  return (
    <>
      <Canvas
        camera={{
          position: [0, 3, 8],
          fov: 75,
          near: 0.1,
          far: 1000,
        }}
        shadows
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

      {/* HUD del juego */}
      <GameHUD />

      {/* Botón flotante de donaciones */}
      <DonationButton />

      {/* Controles táctiles para móvil */}
      <MobileTouchControls />
    </>
  )
}
