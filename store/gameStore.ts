import { create } from 'zustand'
import type { ChunkManager } from '@/systems/ChunkManager'
import type { CharacterId } from '@/types/characters'
import type { FlightMode, FlightRegime } from '@/systems/FlightDynamics'
import { WORLD_TARGETS, type NavigationTarget } from '@/services/NavigationService'

/** Telemetría del JARBEES FLIGHT SYSTEM sincronizada con el HUD (~10 Hz) */
export interface FlightTelemetry {
  mach: number
  speedKmh: number
  regime: FlightRegime
  thrustPct: number
  afterburner: boolean
  energy: number
  heat: number
  gLoad: number
  vertical: number
  overheated: boolean
  lowEnergy: boolean
  boomSeq: number
  boomIntensity: number
  aureliumPhase: boolean
  thermalGlow: number
  dustKick: number
  gcasActive: boolean
}

export const INITIAL_FLIGHT_TELEMETRY: FlightTelemetry = {
  mach: 0,
  speedKmh: 0,
  regime: 'hover',
  thrustPct: 0,
  afterburner: false,
  energy: 100,
  heat: 10,
  gLoad: 1,
  vertical: 0,
  overheated: false,
  lowEnergy: false,
  boomSeq: 0,
  boomIntensity: 0,
  aureliumPhase: false,
  thermalGlow: 0,
  dustKick: 0,
  gcasActive: false,
}

export type SuitActionEmote =
  | 'salute'
  | 'thumbs_up'
  | 'point'
  | 'beckon'
  | 'cheer'
  | 'flinch_torso'
  | 'flinch_head'
  | 'tactical_interact'
  | 'death_forward'
  | 'quicklook'
  | 'melee_shove'
  | 'stumble'
  | 'limp_walk'
  | 'hunter_pounce'
  | null

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
    boost: boolean
    crouch: boolean
    jump: boolean
  }
  
  // Emote o acción activa del traje
  activeEmote: SuitActionEmote
  triggerEmote: (emote: SuitActionEmote) => void
  
  // Estado del juego
  isPaused: boolean
  distanceTraveled: number
  altitude: number
  gameTime: number
  currentBiome: 'titicaca' | 'easter_island' | 'constellations' | 'aconcagua' | 'antarctica'
  
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

  // JARBEES FLIGHT SYSTEM (armadura): modo de control y telemetría
  flightMode: FlightMode
  flight: FlightTelemetry

  // Modo en tierra (caminar) vs vuelo
  isGrounded: boolean
  setGrounded: (grounded: boolean) => void

  // Aurelium Phase Veil (Velo de Fase)
  isPhaseVeilActive: boolean
  togglePhaseVeil: () => void
  setPhaseVeil: (active: boolean) => void

  // Mapa Holográfico Táctico AR Flotante
  isHoloMapActive: boolean
  toggleHoloMap: () => void
  setHoloMapActive: (active: boolean) => void

  // Auren Navigation System (ANS) - Destino activo
  navigationTarget: NavigationTarget | null
  setNavigationTarget: (target: NavigationTarget | null) => void
  cycleNavigationTarget: (direction?: 1 | -1) => void

  // Acciones
  setFlightMode: (mode: FlightMode) => void
  toggleFlightMode: () => void
  setFlightTelemetry: (flight: FlightTelemetry) => void
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
  setBiome: (biome: 'titicaca' | 'easter_island' | 'constellations' | 'aconcagua' | 'antarctica') => void
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
    boost: false,
    crouch: false,
    jump: false,
  },
  activeEmote: null as SuitActionEmote,
  isPaused: false,
  distanceTraveled: 0,
  altitude: 2,
  gameTime: 0,
  currentBiome: 'antarctica' as const,
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
  isGrounded: false,
  isPhaseVeilActive: false,
  isHoloMapActive: true,
  navigationTarget: (WORLD_TARGETS.find((t) => t.id === 'mount_erebus') || WORLD_TARGETS[0]) as NavigationTarget | null,
  flightMode: 'assist' as FlightMode,
  flight: INITIAL_FLIGHT_TELEMETRY,
}

export const useGameStore = create<GameState>((set) => ({
  ...initialState,
  
  triggerEmote: (activeEmote) => set({ activeEmote }),
  setSelectedCharacter: (selectedCharacter) =>
    set({ selectedCharacter, isIronManFlipped: false, isGrounded: false, isPhaseVeilActive: false, flight: INITIAL_FLIGHT_TELEMETRY }),
  setGrounded: (isGrounded) => set({ isGrounded }),
  togglePhaseVeil: () => set((state) => ({ isPhaseVeilActive: !state.isPhaseVeilActive })),
  setPhaseVeil: (isPhaseVeilActive) => set({ isPhaseVeilActive }),
  toggleHoloMap: () => set((state) => ({ isHoloMapActive: !state.isHoloMapActive })),
  setHoloMapActive: (isHoloMapActive) => set({ isHoloMapActive }),
  
  setNavigationTarget: (navigationTarget) => set({ navigationTarget }),
  cycleNavigationTarget: (direction = 1) =>
    set((state) => {
      const current = state.navigationTarget
      const index = current ? WORLD_TARGETS.findIndex((t) => t.id === current.id) : -1
      const nextIndex = (index + direction + WORLD_TARGETS.length) % WORLD_TARGETS.length
      return { navigationTarget: WORLD_TARGETS[nextIndex] }
    }),

  setFlightMode: (flightMode) => set({ flightMode }),
  toggleFlightMode: () =>
    set((state) => ({ flightMode: state.flightMode === 'assist' ? 'sim' : 'assist' })),
  setFlightTelemetry: (flight) => set({ flight }),
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
  
  setBiome: (currentBiome) =>
    set((state) => {
      let target = state.navigationTarget
      if (currentBiome === 'antarctica') {
        target = WORLD_TARGETS.find((t) => t.id === 'mount_erebus') || target
      } else if (currentBiome === 'aconcagua') {
        target = WORLD_TARGETS.find((t) => t.id === 'aconcagua') || target
      }
      return { currentBiome, navigationTarget: target }
    }),
  
  setWind: (wind) => set({ wind }),
  
  setDayNightEnabled: (dayNightEnabled) => set({ dayNightEnabled }),
  
  setDayNightSpeed: (dayNightSpeed) => set({ dayNightSpeed }),
  
  setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
  
  setMusicVolume: (musicVolume) => set({ musicVolume }),
  
  setSfxVolume: (sfxVolume) => set({ sfxVolume }),
  
  resetGame: () => set(initialState),
}))
