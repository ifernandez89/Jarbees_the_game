import { createNoise2D } from 'simplex-noise'

/**
 * Generador de ruido Perlin para terrenos procedurales
 * Basado en simplex-noise para mejor performance
 */
export class PerlinNoiseGenerator {
  private noise2D: ReturnType<typeof createNoise2D>
  private octaves: number
  private persistence: number
  private lacunarity: number
  private scale: number

  constructor(
    seed?: number,
    octaves = 4,
    persistence = 0.5,
    lacunarity = 2,
    scale = 100
  ) {
    // Crear generador con seed opcional
    this.noise2D = createNoise2D(() => seed || Math.random())
    this.octaves = octaves
    this.persistence = persistence
    this.lacunarity = lacunarity
    this.scale = scale
  }

  /**
   * Obtener valor de ruido en coordenadas X, Z
   * Retorna valor entre 0 y 1
   */
  get(x: number, z: number): number {
    let amplitude = 1
    let frequency = 1
    let noiseValue = 0
    let maxValue = 0

    // Múltiples octavas para detalle
    for (let i = 0; i < this.octaves; i++) {
      const sampleX = (x / this.scale) * frequency
      const sampleZ = (z / this.scale) * frequency

      // simplex-noise devuelve valores entre -1 y 1
      const perlinValue = this.noise2D(sampleX, sampleZ)
      
      noiseValue += perlinValue * amplitude
      maxValue += amplitude

      amplitude *= this.persistence
      frequency *= this.lacunarity
    }

    // Normalizar a rango 0-1
    return (noiseValue / maxValue + 1) / 2
  }

  /**
   * Obtener altura del terreno en coordenadas X, Z
   * Aplica curvas de altura específicas del bioma
   */
  getHeight(x: number, z: number, heightMultiplier = 10): number {
    const rawNoise = this.get(x, z)
    
    // Curva exponencial para crear colinas más pronunciadas
    const curved = Math.pow(rawNoise, 1.5)
    
    return curved * heightMultiplier
  }

  /**
   * Obtener densidad de vegetación (0-1)
   */
  getVegetationDensity(x: number, z: number): number {
    // Usar frecuencia más alta para variación más local
    const noise = this.noise2D(x / 20, z / 20)
    return (noise + 1) / 2
  }

  /**
   * Determinar si colocar un árbol en esta posición
   */
  shouldPlaceTree(x: number, z: number, threshold = 0.7): boolean {
    const density = this.getVegetationDensity(x, z)
    return density > threshold
  }

  /**
   * Generar grid de alturas para un chunk
   */
  generateHeightMap(
    startX: number,
    startZ: number,
    width: number,
    depth: number,
    resolution: number,
    heightMultiplier = 10
  ): number[][] {
    const heightMap: number[][] = []
    
    for (let z = 0; z <= depth; z += resolution) {
      const row: number[] = []
      for (let x = 0; x <= width; x += resolution) {
        const worldX = startX + x
        const worldZ = startZ + z
        const height = this.getHeight(worldX, worldZ, heightMultiplier)
        row.push(height)
      }
      heightMap.push(row)
    }
    
    return heightMap
  }
}

/**
 * Preset de configuraciones para diferentes biomas
 */
export const BIOME_NOISE_PRESETS = {
  titicaca: {
    octaves: 4,
    persistence: 0.5,
    lacunarity: 2,
    scale: 150,
    heightMultiplier: 8,
    vegetationThreshold: 0.6,
  },
  easter_island: {
    octaves: 5,
    persistence: 0.6,
    lacunarity: 2.5,
    scale: 100,
    heightMultiplier: 15,
    vegetationThreshold: 0.8,
  },
  constellations: {
    octaves: 3,
    persistence: 0.4,
    lacunarity: 2,
    scale: 200,
    heightMultiplier: 3,
    vegetationThreshold: 0.9,
  },
}
