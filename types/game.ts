import type * as THREE from 'three'

export interface BeeState {
  position: THREE.Vector3
  rotation: THREE.Euler
  velocity: number
  health: number
}

export interface GameControls {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  up: boolean
  down: boolean
}

export interface Biome {
  id: string
  name: string
  colors: {
    sky: string
    ground: string
    water?: string
  }
  vegetation: {
    density: number
    types: string[]
  }
}

export interface GameConfig {
  baseSpeed: number
  maxSpeed: number
  rotationSpeed: number
  cameraDistance: number
  cameraHeight: number
}

export const DEFAULT_CONFIG: GameConfig = {
  baseSpeed: 5,
  maxSpeed: 15,
  rotationSpeed: 2,
  cameraDistance: 5,
  cameraHeight: 2,
}

export const BIOMES: Record<string, Biome> = {
  titicaca: {
    id: 'titicaca',
    name: 'Lago Titicaca',
    colors: {
      sky: '#87CEEB',
      ground: '#7CFC00',
      water: '#00CED1',
    },
    vegetation: {
      density: 0.8,
      types: ['tree', 'grass', 'flower'],
    },
  },
  easter_island: {
    id: 'easter_island',
    name: 'Isla de Pascua',
    colors: {
      sky: '#FF6347',
      ground: '#8B4513',
      water: '#191970',
    },
    vegetation: {
      density: 0.3,
      types: ['rock', 'sparse_grass'],
    },
  },
  constellations: {
    id: 'constellations',
    name: 'Constelaciones',
    colors: {
      sky: '#000033',
      ground: '#1a1a2e',
    },
    vegetation: {
      density: 0.1,
      types: ['star_dust'],
    },
  },
}
