import { create } from 'zustand'
import type { ChunkManager } from '@/systems/ChunkManager'
import type { CharacterId } from '@/types/characters'

export interface GameState {
  // Posición de la abeja
  position: [number, number, number]
  rotation: [number, number, number]
  
  // Velocidad y movimiento
  velocity: number
  baseSpeed: number
  maxSpeed: number
  
  // Controles
  controls: {
    forward: boolean
    backward: boolean
    left: boolean
    right: boolean
    up: boolean
    down: boolean
  }
  
  // Estado del juego
  isPaused: boolean
  distanceTraveled: number
  altitude: number
  gameTime: number
  currentBiome: 'titicaca' | 'easter_island' | 'constellations'
  
  // Configuración de clima y viento
  wind: {
    speed: number
    direction: [number, number, number]
  }
  
  // Configuración de día/noche
  dayNightEnabled: boolean
  dayNightSpeed: number
  
  // Configuración de audio
  audioEnabled: boolean
  musicVolume: number
  sfxVolume: number
  
  // Referencias al sistema de terreno
  terrainManager: ChunkManager | null
  
  // Personaje activo y modal de especificaciones
  selectedCharacter: CharacterId
  isSpecsModalOpen: boolean
  isIronManFlipped: boolean

  // Acciones
  setSelectedCharacter: (character: CharacterId) => void
  toggleIronManFlip: () => void
  setIronManFlipped: (flipped: boolean) => void
  setSpecsModalOpen: (open: boolean) => void
  setPosition: (position: [number, number, number]) => void
  setRotation: (rotation: [number, number, number]) => void
  setVelocity: (velocity: number) => void
  setControls: (controls: Partial<GameState['controls']>) => void
  setPaused: (isPaused: boolean) => void
  updateDistanceTraveled: (delta: number) => void
  updateAltitude: (altitude: number) => void
  updateGameTime: (delta: number) => void
  setTerrainManager: (manager: ChunkManager | null) => void
  setBiome: (biome: 'titicaca' | 'easter_island' | 'constellations') => void
  setWind: (wind: { speed: number; direction: [number, number, number] }) => void
  setDayNightEnabled: (enabled: boolean) => void
  setDayNightSpeed: (speed: number) => void
  setAudioEnabled: (enabled: boolean) => void
  setMusicVolume: (volume: number) => void
  setSfxVolume: (volume: number) => void
  resetGame: () => void
}

const initialState = {
  position: [0, 2, 0] as [number, number, number],
  rotation: [0, 0, 0] as [number, number, number],
  velocity: 0,
  baseSpeed: 0,
  maxSpeed: 15,
  controls: {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false,
  },
  isPaused: false,
  distanceTraveled: 0,
  altitude: 2,
  gameTime: 0,
  currentBiome: 'titicaca' as const,
  terrainManager: null,
  wind: {
    speed: 1.8, // Brisa suave constante permanente
    direction: [0.7, 0, -0.7] as [number, number, number],
  },
  dayNightEnabled: true,
  dayNightSpeed: 1,
  audioEnabled: true,
  musicVolume: 0.65,
  sfxVolume: 0.7,
  selectedCharacter: 'bee' as CharacterId,
  isSpecsModalOpen: false,
  isIronManFlipped: false,
}

export const useGameStore = create<GameState>((set) => ({
  ...initialState,
  
  setSelectedCharacter: (selectedCharacter) =>
    set({ selectedCharacter, isIronManFlipped: false }),
  toggleIronManFlip: () =>
    set((state) => ({ isIronManFlipped: !state.isIronManFlipped })),
  setIronManFlipped: (isIronManFlipped) => set({ isIronManFlipped }),
  setSpecsModalOpen: (isSpecsModalOpen) => set({ isSpecsModalOpen }),
  
  setPosition: (position) => set({ position }),
  
  setRotation: (rotation) => set({ rotation }),
  
  setVelocity: (velocity) => set({ velocity }),
  
  setControls: (controls) =>
    set((state) => ({
      controls: { ...state.controls, ...controls },
    })),
  
  setPaused: (isPaused) => set({ isPaused }),
  
  updateDistanceTraveled: (delta) =>
    set((state) => ({
      distanceTraveled: state.distanceTraveled + delta,
    })),
  
  updateAltitude: (altitude) => set({ altitude }),
  
  updateGameTime: (delta) =>
    set((state) => ({
      gameTime: state.gameTime + delta,
    })),
  
  setTerrainManager: (terrainManager) => set({ terrainManager }),
  
  setBiome: (currentBiome) => set({ currentBiome }),
  
  setWind: (wind) => set({ wind }),
  
  setDayNightEnabled: (dayNightEnabled) => set({ dayNightEnabled }),
  
  setDayNightSpeed: (dayNightSpeed) => set({ dayNightSpeed }),
  
  setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
  
  setMusicVolume: (musicVolume) => set({ musicVolume }),
  
  setSfxVolume: (sfxVolume) => set({ sfxVolume }),
  
  resetGame: () => set(initialState),
}))
