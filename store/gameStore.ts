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

export type CSMapId =
  | 'fy_pool_day'
  | 'de_rats3'
  | 'de_westwood'
  | 'fy_iceworld'
  | 'cs_assault'
  | 'cs_siege'
  | 'de_aztec'
  | 'de_chateau'
  | 'de_vertigo'

export interface CSMapInfo {
  id: CSMapId
  name: string
  label: string
  bspName: string
  spawnPosition: [number, number, number]
  description: string
  skyColor: string
  fogColor: string
  isCommunity: boolean
}

export const CS_MAPS: Record<CSMapId, CSMapInfo> = {
  fy_pool_day: {
    id: 'fy_pool_day',
    name: 'Pool Day',
    label: '🏊 fy_pool_day (Squall)',
    bspName: 'fy_pool_day.bsp',
    spawnPosition: [-8.25, 11.55, 14.35],
    description: 'Piscina comunitaria legendaria creada por Squall (494 KB)',
    skyColor: '#6ba0b8',
    fogColor: '#78b0c8',
    isCommunity: true,
  },
  de_rats3: {
    id: 'de_rats3',
    name: 'Rats 3',
    label: '🧀 de_rats3 (Giles)',
    bspName: 'de_rats3.bsp',
    spawnPosition: [-18.0, 13.50, -13.0],
    description: 'Habitación gigante creada por Chris Giles Green',
    skyColor: '#b0a088',
    fogColor: '#988870',
    isCommunity: true,
  },
  de_westwood: {
    id: 'de_westwood',
    name: 'Westwood',
    label: '🤠 de_westwood (MacMan)',
    bspName: 'de_westwood.bsp',
    spawnPosition: [22.76, 9.72, 4.90],
    description: 'Pueblo del Viejo Oeste creado por Chris "MacMan" Mair',
    skyColor: '#d4a373',
    fogColor: '#bc8a5f',
    isCommunity: true,
  },
  fy_iceworld: {
    id: 'fy_iceworld',
    name: 'Iceworld',
    label: '🧊 fy_iceworld (Fan)',
    bspName: 'fy_iceworld.bsp',
    spawnPosition: [-9.80, 4.03, -17.88],
    description: 'Arena glacial de bloques de hielo clásica (180 KB)',
    skyColor: '#a0c4d8',
    fogColor: '#90b4c8',
    isCommunity: true,
  },
  cs_assault: {
    id: 'cs_assault',
    name: 'Assault',
    label: '🏢 cs_assault.bsp (Almacén)',
    bspName: 'cs_assault.bsp',
    spawnPosition: [34.54, 3.64, 21.95],
    description: 'Complejo industrial y furgoneta de asalto CT',
    skyColor: '#70889b',
    fogColor: '#8094a6',
    isCommunity: false,
  },
  cs_siege: {
    id: 'cs_siege',
    name: 'Siege',
    label: '🏜️ cs_siege.bsp (Cañón)',
    bspName: 'cs_siege.bsp',
    spawnPosition: [-52.12, 21.11, -54.86],
    description: 'Cañón rocoso, túneles subterráneos y fortaleza APC',
    skyColor: '#a89478',
    fogColor: '#968875',
    isCommunity: false,
  },
  de_aztec: {
    id: 'de_aztec',
    name: 'Aztec',
    label: '🌿 de_aztec_cz.bsp (Ruinas)',
    bspName: 'de_aztec.bsp',
    spawnPosition: [-63.20, 10.04, -2.84],
    description: 'Templos milenarios, puente colgante y canales de lluvia',
    skyColor: '#5c6b65',
    fogColor: '#607268',
    isCommunity: false,
  },
  de_chateau: {
    id: 'de_chateau',
    name: 'Château',
    label: '🏰 de_chateau.bsp (Mansión)',
    bspName: 'de_chateau.bsp',
    spawnPosition: [8.08, 6.79, -54.04],
    description: 'Gran mansión señorial, jardines franceses y catacumbas',
    skyColor: '#8ca0b3',
    fogColor: '#7f93a6',
    isCommunity: false,
  },
  de_vertigo: {
    id: 'de_vertigo',
    name: 'Vertigo',
    label: '🏗️ de_vertigo.bsp (Rascacielos)',
    bspName: 'de_vertigo.bsp',
    spawnPosition: [27.64, 20.30, -29.26],
    description: 'Rascacielos en construcción con verticalidad extrema de dos pisos',
    skyColor: '#7ba0b8',
    fogColor: '#8caebf',
    isCommunity: false,
  },
}

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

  // Escenario Mundial Activo: Santuario Infinito vs Clásicos CS 1.6
  activeWorldScenario: 'sanctuary_infinite' | 'cs_assault'
  toggleWorldScenario: () => void
  setWorldScenario: (scenario: 'sanctuary_infinite' | 'cs_assault') => void
  activeCsMap: CSMapId
  setCsMap: (map: CSMapId) => void
  cycleCsMap: () => void

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
  position: [0.0, 1.30, 10.5] as [number, number, number],
  rotation: [0, Math.PI, 0] as [number, number, number],
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
  activeWorldScenario: 'sanctuary_infinite' as const,
  activeCsMap: 'cs_assault' as CSMapId,
  flightMode: 'assist' as FlightMode,
  flight: INITIAL_FLIGHT_TELEMETRY,
}

export const useGameStore = create<GameState>((set) => ({
  ...initialState,
  
  setCsMap: (activeCsMap) =>
    set(() => {
      const mapInfo = CS_MAPS[activeCsMap]
      return {
        activeCsMap,
        activeWorldScenario: 'cs_assault',
        position: [...mapInfo.spawnPosition] as [number, number, number],
        rotation: [0, 0, 0],
        velocity: 0,
      }
    }),
  cycleCsMap: () =>
    set((state) => {
      const mapKeys: CSMapId[] = [
        'fy_pool_day',
        'de_rats3',
        'de_westwood',
        'fy_iceworld',
        'cs_assault',
        'cs_siege',
        'de_aztec',
        'de_chateau',
        'de_vertigo',
      ]
      const currentIndex = mapKeys.indexOf(state.activeCsMap)
      const nextIndex = (currentIndex + 1) % mapKeys.length
      const nextMap = mapKeys[nextIndex]
      const mapInfo = CS_MAPS[nextMap]
      return {
        activeCsMap: nextMap,
        activeWorldScenario: 'cs_assault',
        position: [...mapInfo.spawnPosition] as [number, number, number],
        rotation: [0, 0, 0],
        velocity: 0,
      }
    }),
  toggleWorldScenario: () =>
    set((state) => {
      const next = state.activeWorldScenario === 'sanctuary_infinite' ? 'cs_assault' : 'sanctuary_infinite'
      const spawn = next === 'cs_assault' ? CS_MAPS[state.activeCsMap].spawnPosition : [0.0, 1.30, 10.5]
      const rot = next === 'cs_assault' ? [0, 0, 0] : [0, Math.PI, 0]
      return {
        activeWorldScenario: next,
        position: [...spawn] as [number, number, number],
        rotation: [...rot] as [number, number, number],
        velocity: 0,
      }
    }),
  setWorldScenario: (activeWorldScenario) =>
    set((state) => {
      const spawn = activeWorldScenario === 'cs_assault' ? CS_MAPS[state.activeCsMap].spawnPosition : [0.0, 1.30, 10.5]
      const rot = activeWorldScenario === 'cs_assault' ? [0, 0, 0] : [0, Math.PI, 0]
      return {
        activeWorldScenario,
        position: [...spawn] as [number, number, number],
        rotation: [...rot] as [number, number, number],
        velocity: 0,
      }
    }),
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
