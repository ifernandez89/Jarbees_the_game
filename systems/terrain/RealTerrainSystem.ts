/**
 * RealTerrainSystem - Sistema principal de terrenos con datos reales
 * 
 * Integra todos los subsistemas:
 * - DEMDownloader: Descarga de datos
 * - ChunkGenerator: Generación de geometría
 * - Streaming: Carga dinámica
 * - LOD: Optimización por distancia
 * - Cache: Gestión de memoria
 * 
 * Uso:
 * ```typescript
 * const terrain = new RealTerrainSystem({ scene, quality: 'medium' })
 * await terrain.loadRegion(PREDEFINED_REGIONS.aconcagua)
 * 
 * // En el loop de render:
 * terrain.update(playerPosition)
 * ```
 */

import * as THREE from 'three'
import { DEMDownloader, type DEMRegion, PREDEFINED_REGIONS } from './core/DEMDownloader'
import { ChunkGenerator, type ChunkGeneratorConfig } from './core/ChunkGenerator'
import type { ChunkPosition } from './core/TerrainChunk'

export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra'

export interface TerrainSystemConfig {
  scene: THREE.Scene
  quality?: QualityPreset
  chunkSize?: number  // Tamaño de chunk en metros (default: 1000m = 1km)
  resolution?: number  // Resolución en metros (default: 30m)
  viewDistance?: number  // Distancia de renderizado en metros (default: 5000m)
  lodLevels?: number  // Número de niveles LOD (default: 4)
  cacheLimit?: number  // Límite de caché en MB (default: 2048)
  material?: THREE.Material  // Material custom
}

interface QualitySettings {
  viewDistance: number
  lodDistances: number[]
  maxChunks: number
  resolution: number
}

/**
 * Sistema completo de terrenos 3D con datos reales
 */
export class RealTerrainSystem {
  private scene: THREE.Scene
  private config: Required<TerrainSystemConfig>
  private qualitySettings: QualitySettings
  
  private demDownloader: DEMDownloader
  private chunkGenerator: ChunkGenerator
  
  private currentRegion?: DEMRegion
  private activeChunks: Set<string> = new Set()
  private lastPlayerPosition: THREE.Vector3 = new THREE.Vector3()
  private updateRadius: number = 100 // Distancia mínima para actualizar chunks
  
  private stats = {
    chunksLoaded: 0,
    chunksUnloaded: 0,
    updateCount: 0,
    lastUpdateTime: 0,
  }

  constructor(config: TerrainSystemConfig) {
    this.scene = config.scene
    
    // Configuración con defaults
    this.config = {
      quality: 'medium',
      chunkSize: 1000, // 1km
      resolution: 30,  // 30m
      viewDistance: 5000, // 5km
      lodLevels: 4,
      cacheLimit: 2048,
      ...config,
    } as Required<TerrainSystemConfig>

    // Aplicar preset de calidad
    this.qualitySettings = this.getQualitySettings(this.config.quality)
    
    // Inicializar subsistemas
    this.demDownloader = new DEMDownloader('./public/terrain/data', true)
    
    const chunkConfig: ChunkGeneratorConfig = {
      scene: this.scene,
      size: this.config.chunkSize,
      resolution: this.qualitySettings.resolution,
      lodLevels: this.config.lodLevels,
      material: this.config.material,
    }
    
    this.chunkGenerator = new ChunkGenerator(chunkConfig)
  }

  /**
   * Carga una región específica de terreno
   */
  async loadRegion(region: DEMRegion): Promise<void> {
    console.log(`Loading terrain region: ${region.name}`)
    
    this.currentRegion = region

    // Descargar/cargar datos DEM
    const regionPath = await this.demDownloader.downloadRegion(region, (progress) => {
      console.log(`Download progress: ${(progress.progress * 100).toFixed(0)}% - ${progress.message}`)
    })

    // Cargar heightmap en el generador
    await this.chunkGenerator.loadHeightmap(regionPath)

    console.log(`Region '${region.name}' loaded successfully`)
  }

  /**
   * Actualiza el sistema (llamar cada frame)
   */
  update(playerPosition: THREE.Vector3): void {
    const startTime = performance.now()

    // Solo actualizar si el jugador se movió significativamente
    const distanceMoved = playerPosition.distanceTo(this.lastPlayerPosition)
    if (distanceMoved < this.updateRadius && this.stats.updateCount > 0) {
      return
    }

    this.lastPlayerPosition.copy(playerPosition)

    // Determinar qué chunks deberían estar activos
    const requiredChunks = this.calculateRequiredChunks(playerPosition)

    // Cargar chunks nuevos
    for (const chunkPos of requiredChunks) {
      const key = this.getChunkKey(chunkPos)
      if (!this.activeChunks.has(key)) {
        this.loadChunk(chunkPos)
      }
    }

    // Descargar chunks lejanos
    const requiredSet = new Set(requiredChunks.map(p => this.getChunkKey(p)))
    for (const key of this.activeChunks) {
      if (!requiredSet.has(key)) {
        const pos = this.parseChunkKey(key)
        this.unloadChunk(pos)
      }
    }

    // Actualizar LOD de chunks activos
    this.chunkGenerator.updateLODs(playerPosition, this.qualitySettings.lodDistances)

    // Estadísticas
    this.stats.updateCount++
    this.stats.lastUpdateTime = performance.now() - startTime
  }

  /**
   * Calcula qué chunks deberían estar cargados
   */
  private calculateRequiredChunks(center: THREE.Vector3): ChunkPosition[] {
    const chunks: ChunkPosition[] = []
    
    // Convertir posición del jugador a coordenadas de chunk
    const centerChunkX = Math.floor(center.x / this.config.chunkSize)
    const centerChunkZ = Math.floor(center.z / this.config.chunkSize)
    
    // Calcular radio en chunks
    const chunkRadius = Math.ceil(this.qualitySettings.viewDistance / this.config.chunkSize)

    // Generar grid de chunks
    for (let dz = -chunkRadius; dz <= chunkRadius; dz++) {
      for (let dx = -chunkRadius; dx <= chunkRadius; dx++) {
        const chunkX = centerChunkX + dx
        const chunkZ = centerChunkZ + dz
        
        // Verificar si está dentro del radio (círculo, no cuadrado)
        const chunkCenter = new THREE.Vector3(
          (chunkX + 0.5) * this.config.chunkSize,
          0,
          (chunkZ + 0.5) * this.config.chunkSize
        )
        
        const distance = center.distanceTo(chunkCenter)
        if (distance <= this.qualitySettings.viewDistance) {
          chunks.push({ x: chunkX, z: chunkZ })
        }
      }
    }

    return chunks
  }

  /**
   * Carga un chunk
   */
  private async loadChunk(position: ChunkPosition): Promise<void> {
    try {
      await this.chunkGenerator.generateChunk(position)
      this.activeChunks.add(this.getChunkKey(position))
      this.stats.chunksLoaded++
    } catch (error) {
      console.error(`Failed to load chunk ${position.x},${position.z}:`, error)
    }
  }

  /**
   * Descarga un chunk
   */
  private unloadChunk(position: ChunkPosition): void {
    this.chunkGenerator.removeChunk(position)
    this.activeChunks.delete(this.getChunkKey(position))
    this.stats.chunksUnloaded++
  }

  /**
   * Obtiene la elevación del terreno en una posición
   */
  getHeightAt(worldX: number, worldZ: number): number {
    return this.chunkGenerator.getHeightAt(worldX, worldZ)
  }

  /**
   * Obtiene configuración de calidad según preset
   */
  private getQualitySettings(quality: QualityPreset): QualitySettings {
    switch (quality) {
      case 'low':
        return {
          viewDistance: 2000,  // 2km
          lodDistances: [500, 1000, 1500],
          maxChunks: 20,
          resolution: 60,  // 60m (menos detalle)
        }
      
      case 'medium':
        return {
          viewDistance: 5000,  // 5km
          lodDistances: [1000, 2500, 4000],
          maxChunks: 50,
          resolution: 30,  // 30m
        }
      
      case 'high':
        return {
          viewDistance: 10000,  // 10km
          lodDistances: [2000, 5000, 8000],
          maxChunks: 100,
          resolution: 30,  // 30m
        }
      
      case 'ultra':
        return {
          viewDistance: 20000,  // 20km
          lodDistances: [5000, 10000, 15000],
          maxChunks: 200,
          resolution: 15,  // 15m (más detalle)
        }
    }
  }

  /**
   * Cambia la calidad en tiempo real
   */
  setQuality(quality: QualityPreset): void {
    this.config.quality = quality
    this.qualitySettings = this.getQualitySettings(quality)
    
    // Forzar actualización de chunks
    this.lastPlayerPosition.set(Infinity, Infinity, Infinity)
  }

  /**
   * Obtiene estadísticas del sistema
   */
  getStats() {
    const chunkStats = this.chunkGenerator.getStats()
    
    return {
      ...this.stats,
      ...chunkStats,
      quality: this.config.quality,
      viewDistance: this.qualitySettings.viewDistance,
      currentRegion: this.currentRegion?.name || 'none',
      fps: this.stats.lastUpdateTime > 0 ? 1000 / this.stats.lastUpdateTime : 0,
    }
  }

  /**
   * Libera todos los recursos
   */
  dispose(): void {
    this.chunkGenerator.dispose()
    this.activeChunks.clear()
  }

  /**
   * Helpers para keys de chunks
   */
  private getChunkKey(pos: ChunkPosition): string {
    return `${pos.x},${pos.z}`
  }

  private parseChunkKey(key: string): ChunkPosition {
    const [x, z] = key.split(',').map(Number)
    return { x, z }
  }
}

// Re-exportar regiones predefinidas para fácil acceso
export { PREDEFINED_REGIONS, type DEMRegion }
