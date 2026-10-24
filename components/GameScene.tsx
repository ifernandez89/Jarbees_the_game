'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import { Stats } from '@react-three/drei'
import { BeePlayer } from './BeePlayer'
import { FlightEffects } from './FlightEffects'
import { FollowCamera } from './FollowCamera'
import { GameHUD } from './GameHUD'
import { InfiniteTerrain } from './InfiniteTerrain'
import { DynamicSky } from './DynamicSky'
import { WeatherSystem } from './WeatherSystem'
import { WaterSurface } from './WaterSurface'
import { MobileTouchControls } from './MobileTouchControls'
import { useGameControls } from '@/hooks/useGameControls'
import { useGameStore } from '@/store/gameStore'
import { useAudio } from '@/hooks/useAudio'

import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useDayNightCycle } from '@/hooks/useDayNightCycle'

import { AmbientWildlife } from './AmbientWildlife'
import { HoloTacticalOverlay } from './HoloTacticalOverlay'

// Componente de la escena 3D
function Scene() {
  const { scene } = useThree()

  // Activar controles de teclado
  useGameControls()
  
  // Inicializar sistema de audio
  useAudio()
  
  const dayNightEnabled = useGameStore((state) => state.dayNightEnabled)
  const dayNightSpeed = useGameStore((state) => state.dayNightSpeed)
  const currentBiome = useGameStore((state) => state.currentBiome)
  const isPaused = useGameStore((state) => state.isPaused)
  const updateGameTime = useGameStore((state) => state.updateGameTime)

  const timeOfDay = useDayNightCycle(dayNightEnabled, dayNightSpeed)

  // Ciclo continuo de avance temporal del juego y color de fondo
  useFrame((_, delta) => {
    if (!isPaused && dayNightEnabled) {
      updateGameTime(delta)
    }
    // Sincronizar fondo del viewport con el horizonte del ciclo
    scene.background = new THREE.Color(timeOfDay.horizonColor)
  })

  return (
    <>
      {/* Sistema de cielo dinámico (Sol, Luna, Bóveda, Estrellas, Constelaciones y Nubes) */}
      <DynamicSky enabled={dayNightEnabled} speed={dayNightSpeed} />
      
      {/* Sistema de clima dinámico (niebla atmosférica y partículas de viento) */}
      <WeatherSystem enabled={dayNightEnabled} />

      {/* Terreno infinito procedural reactivo con árboles y rocas */}
      <InfiniteTerrain biome={currentBiome} seed={12345} />

      {/* Fauna voladora ambiental (Colibríes y Mariposas con animaciones reales) */}
      <AmbientWildlife />

      {/* Superficie de agua cristalina para lagos y valles */}
      <WaterSurface waterHeight={1.4} />

      {/* Abeja jugadora con fallback instantáneo y modelo 3D */}
      <BeePlayer />

      {/* Efectos audiovisuales de vuelo aerodinámico (estelas, cono Mach, ondas de choque y audio procedural) */}
      <FlightEffects />

      {/* Mapa Holográfico Táctico AR Flotante a la altura de la cadera (Guía de Rutas y Sitios Reales) */}
      <HoloTacticalOverlay />

      {/* Cámara en tercera persona */}
      <FollowCamera />
    </>
  )
}

export default function GameScene() {
  const enableStats = process.env.NEXT_PUBLIC_ENABLE_STATS === 'true'

  // Prevenir scroll y gestos del navegador móvil en la página del juego
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    return () => {
      document.body.style.overflow = 'auto'
      document.body.style.touchAction = 'auto'
    }
  }, [])

  return (
    <>
      <Canvas
        camera={{
          position: [0, 2.7, 1.8],
          fov: 65,
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
          touchAction: 'none',
        }}
      >
        {/* Fondo inicial celeste para que nunca exista pantalla negra */}
        <color attach="background" args={['#5aa2f0']} />

        <Suspense fallback={null}>
          <Scene />
        </Suspense>
        
        {enableStats && <Stats />}
      </Canvas>

      {/* HUD del juego */}
      <GameHUD />

      {/* Controles táctiles para móvil */}
      <MobileTouchControls />
    </>
  )
}
