/**
 * ChunkGenerator - Genera chunks de terreno desde heightmaps
 * 
 * Coordina:
 * - HeightmapProcessor para obtener datos de elevación
 * - TerrainChunk para crear geometría
 * - Pool de recursos reutilizables
 */

import * as THREE from 'three'
import { HeightmapProcessor, type HeightmapData } from './HeightmapProcessor'
import { TerrainChunk, type ChunkPosition, type ChunkConfig } from './TerrainChunk'

export interface ChunkGeneratorConfig extends ChunkConfig {
  scene: THREE.Scene
  heightmapTileSize?: number  // Tamaño de tiles de heightmap (default: 256)
}

/**
 * Genera chunks de terreno eficientemente
 */
export class ChunkGenerator {
  private config: ChunkGeneratorConfig
  private heightmapProcessor: HeightmapProcessor
  private heightmapData?: HeightmapData
  private chunks: Map<string, TerrainChunk> = new Map()
  private chunkPool: TerrainChunk[] = []
  private maxPoolSize: number = 20

  constructor(config: ChunkGeneratorConfig) {
    this.config = {
      heightmapTileSize: 256,
      ...config
    }
    this.heightmapProcessor = new HeightmapProcessor()
  }

  /**
   * Carga heightmap data para una región
   */
  async loadHeightmap(regionPath: string): Promise<void> {
    this.heightmapData = await this.heightmapProcessor.loadHeightmap(regionPath, {
      tileSize: this.config.heightmapTileSize,
      smoothing: false,
    })

    console.log('Heightmap loaded:', {
      size: `${this.heightmapData.width}x${this.heightmapData.height}`,
      elevation: `${this.heightmapData.minElevation.toFixed(0)}m - ${this.heightmapData.maxElevation.toFixed(0)}m`,
      resolution: `${this.heightmapData.resolution}m/pixel`
    })
  }

  /**
   * Genera o reutiliza un chunk
   */
  async generateChunk(position: ChunkPosition): Promise<TerrainChunk> {
    const key = this.getChunkKey(position)

    // Si ya existe, retornarlo
    const existing = this.chunks.get(key)
    if (existing) {
      existing.setVisible(true)
      existing.lastUsed = Date.now()
      return existing
    }

    // Intentar reutilizar del pool
    let chunk = this.chunkPool.pop()
    
    if (!chunk) {
      // Crear nuevo chunk
      chunk = new TerrainChunk(position, this.config, this.config.scene)
    } else {
      // Reusar chunk existente
      chunk.position = position
      chunk.worldPosition.set(
        position.x * this.config.size,
        0,
        position.z * this.config.size
      )
    }

    // Generar geometría desde heightmap
    if (this.heightmapData) {
      const heightmapTile = this.extractHeightmapForChunk(position)
      chunk.generateFromHeightmap(heightmapTile)
    }

    // Guardar en registro
    this.chunks.set(key, chunk)
    
    return chunk
  }

  /**
   * Extrae la porción del heightmap correspondiente al chunk
   */
  private extractHeightmapForChunk(position: ChunkPosition) {
    if (!this.heightmapData) {
      throw new Error('Heightmap not loaded')
    }

    const { width, height, data, resolution } = this.heightmapData
    
    // Calcular tamaño del tile en píxeles del heightmap
    const tilePixelSize = Math.floor(this.config.size / resolution)
    
    // Calcular posición inicial en el heightmap
    const startX = position.x * tilePixelSize
    const startZ = position.z * tilePixelSize
    
    // Extraer datos
    return this.heightmapProcessor.extractTile(
      this.heightmapData,
      position.x,
      position.z,
      tilePixelSize
    )
  }

  /**
   * Remueve un chunk y lo devuelve al pool
   */
  removeChunk(position: ChunkPosition): void {
    const key = this.getChunkKey(position)
    const chunk = this.chunks.get(key)
    
    if (!chunk) return

    // Ocultar
    chunk.setVisible(false)
    
    // Remover del registro
    this.chunks.delete(key)

    // Devolver al pool si hay espacio
    if (this.chunkPool.length < this.maxPoolSize) {
      this.chunkPool.push(chunk)
    } else {
      // Si el pool está lleno, liberar recursos
      chunk.dispose()
    }
  }

  /**
   * Obtiene chunk por posición (si existe)
   */
  getChunk(position: ChunkPosition): TerrainChunk | undefined {
    return this.chunks.get(this.getChunkKey(position))
  }

  /**
   * Obtiene todos los chunks activos
   */
  getActiveChunks(): TerrainChunk[] {
    return Array.from(this.chunks.values())
  }

  /**
   * Obtiene la elevación en coordenadas mundiales
   */
  getHeightAt(worldX: number, worldZ: number): number {
    // Determinar chunk que contiene estas coordenadas
    const chunkX = Math.floor(worldX / this.config.size)
    const chunkZ = Math.floor(worldZ / this.config.size)
    
    const chunk = this.getChunk({ x: chunkX, z: chunkZ })
    
    if (!chunk) {
      // Si no hay chunk, usar heightmap directamente
      return this.getHeightFromHeightmap(worldX, worldZ)
    }

    // Coordenadas locales al chunk
    const localX = worldX - chunkX * this.config.size
    const localZ = worldZ - chunkZ * this.config.size
    
    return chunk.getHeightAt(localX, localZ)
  }

  /**
   * Obtiene altura directamente del heightmap (sin chunk)
   */
  private getHeightFromHeightmap(worldX: number, worldZ: number): number {
    if (!this.heightmapData) return 0

    const { width, height, resolution } = this.heightmapData
    
    // Convertir coordenadas mundiales a coordenadas de heightmap
    // Asumiendo que el origen del heightmap está en (0, 0)
    const hx = worldX / resolution
    const hz = worldZ / resolution

    return this.heightmapProcessor.getElevationAt(
      this.heightmapData,
      hx,
      hz,
      true // interpolate
    )
  }

  /**
   * Actualiza LOD de chunks según distancia a un punto
   */
  updateLODs(viewPoint: THREE.Vector3, lodDistances: number[]): void {
    for (const chunk of this.chunks.values()) {
      const distance = chunk.distanceTo(viewPoint)
      
      // Determinar nivel LOD basado en distancia
      let lod = 0
      for (let i = 0; i < lodDistances.length; i++) {
        if (distance > lodDistances[i]) {
          lod = i + 1
        } else {
          break
        }
      }

      chunk.setLOD(Math.min(lod, this.config.lodLevels - 1))
    }
  }

  /**
   * Obtiene estadísticas generales
   */
  getStats() {
    const chunks = Array.from(this.chunks.values())
    const totalVertices = chunks.reduce((sum, c) => sum + c.getStats().vertexCount, 0)
    const totalTriangles = chunks.reduce((sum, c) => sum + c.getStats().triangleCount, 0)

    return {
      activeChunks: this.chunks.size,
      pooledChunks: this.chunkPool.length,
      totalVertices,
      totalTriangles,
      heightmapLoaded: !!this.heightmapData,
      heightmapSize: this.heightmapData 
        ? `${this.heightmapData.width}x${this.heightmapData.height}`
        : 'N/A'
    }
  }

  /**
   * Libera todos los recursos
   */
  dispose(): void {
    // Liberar chunks activos
    for (const chunk of this.chunks.values()) {
      chunk.dispose()
    }
    this.chunks.clear()

    // Liberar pool
    for (const chunk of this.chunkPool) {
      chunk.dispose()
    }
    this.chunkPool = []

    // Liberar heightmap
    this.heightmapData = undefined
  }

  /**
   * Genera key única para un chunk
   */
  private getChunkKey(position: ChunkPosition): string {
    return `${position.x},${position.z}`
  }
}
