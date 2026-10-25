import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { AudioManager } from '@/systems/AudioManager'
import { useGameStore } from '@/store/gameStore'
import { useDayNightCycle } from '@/hooks/useDayNightCycle'
import { getAssetPath } from '@/utils/assetPath'

let globalAudioManager: AudioManager | null = null
let globalAudioListener: THREE.AudioListener | null = null

export function useAudio() {
  const { camera } = useThree()
  const audioManagerRef = useRef<AudioManager | null>(null)
  const isPaused = useGameStore((state) => state.isPaused)
  const audioEnabled = useGameStore((state) => state.audioEnabled)
  const musicVolume = useGameStore((state) => state.musicVolume)
  const sfxVolume = useGameStore((state) => state.sfxVolume)
  const dayNightEnabled = useGameStore((state) => state.dayNightEnabled)
  const dayNightSpeed = useGameStore((state) => state.dayNightSpeed)
  
  const timeInfo = useDayNightCycle(dayNightEnabled, dayNightSpeed)
  const listenerRef = useRef<THREE.AudioListener | null>(null)
  const previousPauseState = useRef<boolean>(isPaused)

  useEffect(() => {
    // Crear listener solo una vez y fijarlo a la cámara
    if (!listenerRef.current) {
      listenerRef.current = new THREE.AudioListener()
      camera.add(listenerRef.current)
      globalAudioListener = listenerRef.current
    }

    // Crear AudioManager global si no existe
    if (!globalAudioManager && listenerRef.current) {
      globalAudioManager = new AudioManager(listenerRef.current)
      audioManagerRef.current = globalAudioManager
      
      // Cargar todos los audios del juego
      loadGameAudio(globalAudioManager)
    } else {
      audioManagerRef.current = globalAudioManager
    }

    return () => {
      // No desconectar al desmontar para preservar audio de fondo continuo en navegación
    }
  }, [camera])

  // Sincronizar volúmenes de Zustand con AudioManager
  useEffect(() => {
    if (globalAudioManager) {
      globalAudioManager.setMuted(!audioEnabled)
      globalAudioManager.setMusicVolume(musicVolume)
      globalAudioManager.setSfxVolume(sfxVolume)
    }
  }, [audioEnabled, musicVolume, sfxVolume])

  // Manejar pausa del juego con efecto de sonido
  useEffect(() => {
    if (globalAudioManager) {
      if (previousPauseState.current !== isPaused) {
        // Sonido de pausa/reanudación
        globalAudioManager.playSound('pause', 0.4)
        globalAudioManager.togglePause(isPaused)
        previousPauseState.current = isPaused
      }
    }
  }, [isPaused])

  // Modulación ambiental según el ciclo Día/Noche en cada frame
  useFrame(() => {
    if (!globalAudioManager || isPaused) return

    const isNight = timeInfo.timeOfDay === 'night'
    const isDawnOrDusk = timeInfo.timeOfDay === 'dawn' || timeInfo.timeOfDay === 'dusk'

    // Viento: silenciado en reposo para evitar cualquier tipo de zumbido
    globalAudioManager.setSoundVolume('wind', 0.0)
  })

  return audioManagerRef.current
}

/**
 * Cargar todos los audios del juego e iniciar ambiente
 */
async function loadGameAudio(manager: AudioManager) {
  try {
    console.log('🎵 Iniciando carga de audios de JarBees...')

    // 1. Música ambiental orquestal de fondo
    await manager.loadMusic('ambient', getAssetPath('/audio/ambient_music.wav'))

    // 2. Efectos de sonido del juego (vuelo y fauna)
    await manager.loadSound('bee_buzz', getAssetPath('/audio/bee_buzz.wav'), { loop: true, volume: 0.08 })
    await manager.loadSound('colibri_flutter', getAssetPath('/audio/colibri_flutter.wav'), { loop: true, volume: 0.0 })
    await manager.loadSound('butterfly_flutter', getAssetPath('/audio/butterfly_flutter.wav'), { loop: true, volume: 0.0 })
    await manager.loadSound('auren_flight', getAssetPath('/audio/auren_flight.wav'), { loop: true, volume: 0.0 })
    await manager.loadSound('iron_man_thruster', getAssetPath('/audio/iron_man_thruster.wav'), { loop: true, volume: 0.0 })
    await manager.loadSound('wind', getAssetPath('/audio/wind_loop.wav'), { loop: true, volume: 0.05 })
    await manager.loadSound('pause', getAssetPath('/audio/pause.wav'), { loop: false, volume: 0.4 })

    // Iniciar bucles de efectos de sonido bajo demanda (silencio en reposo)
    manager.playLoop('bee_buzz', 0.0)
    manager.playLoop('colibri_flutter', 0.0)
    manager.playLoop('butterfly_flutter', 0.0)
    manager.playLoop('auren_flight', 0.0)
    manager.playLoop('iron_man_thruster', 0.0)
    manager.playLoop('wind', 0.0)
  } catch (error) {
    console.warn('⚠️ Nota sobre carga de audios:', error)
  }
}

/**
 * Obtener AudioManager global
 */
export function getAudioManager(): AudioManager | null {
  return globalAudioManager
}

/**
 * Obtener el AudioListener global (comparte AudioContext con el sistema de vuelo procedural)
 */
export function getAudioListener(): THREE.AudioListener | null {
  return globalAudioListener
}
