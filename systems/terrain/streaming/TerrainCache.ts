/**
 * TerrainCache - Sistema de caché LRU (Least Recently Used)
 * 
 * Gestiona memoria de chunks con:
 * - Límite de VRAM configurable
 * - Evicción automática de chunks antiguos
 * - Priorización por distancia y uso
 * - Métricas de rendimiento
 */

import type { ChunkPosition } from '../core/TerrainChunk'

export interface CacheEntry<T> {
  key: string
  data: T
  position: ChunkPosition
  size: number  // Bytes estimados
  lastAccess: number
  accessCount: number
  distance: number  // Última distancia conocida al jugador
}

export interface CacheConfig {
  maxSizeMB: number  // Límite de caché en MB (default: 2048)
  minSizeMB?: number  // Mínimo a mantener en MB (default: 512)
  evictionThreshold?: number  // Umbral para trigger evicción (default: 0.9)
}

/**
 * Caché LRU para chunks de terreno
 */
export class TerrainCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private config: Required<CacheConfig>
  private currentSizeBytes: number = 0
  private maxSizeBytes: number
  private minSizeBytes: number

  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalAdded: 0,
  }

  constructor(config: CacheConfig) {
    this.config = {
      minSizeMB: 512,
      evictionThreshold: 0.9,
      ...config
    }
    
    this.maxSizeBytes = this.config.maxSizeMB * 1024 * 1024
    this.minSizeBytes = this.config.minSizeMB * 1024 * 1024
  }

  /**
   * Añade o actualiza entrada en caché
   */
  set(position: ChunkPosition, data: T, estimatedSize: number): void {
    const key = this.getKey(position)
    const now = Date.now()

    // Si ya existe, actualizar
    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!
      this.currentSizeBytes -= entry.size
      entry.data = data
      entry.size = estimatedSize
      entry.lastAccess = now
      entry.accessCount++
      this.currentSizeBytes += estimatedSize
      return
    }

    // Verificar si necesitamos espacio
    if (this.needsEviction(estimatedSize)) {
      this.evict()
    }

    // Añadir nueva entrada
    const entry: CacheEntry<T> = {
      key,
      data,
      position,
      size: estimatedSize,
      lastAccess: now,
      accessCount: 1,
      distance: 0
    }

    this.cache.set(key, entry)
    this.currentSizeBytes += estimatedSize
    this.stats.totalAdded++
  }

  /**
   * Obtiene entrada del caché
   */
  get(position: ChunkPosition): T | undefined {
    const key = this.getKey(position)
    const entry = this.cache.get(key)

    if (entry) {
      entry.lastAccess = Date.now()
      entry.accessCount++
      this.stats.hits++
      return entry.data
    }

    this.stats.misses++
    return undefined
  }

  /**
   * Verifica si existe en caché
   */
  has(position: ChunkPosition): boolean {
    return this.cache.has(this.getKey(position))
  }

  /**
   * Elimina entrada del caché
   */
  delete(position: ChunkPosition): boolean {
    const key = this.getKey(position)
    const entry = this.cache.get(key)

    if (entry) {
      this.currentSizeBytes -= entry.size
      this.cache.delete(key)
      return true
    }

    return false
  }

  /**
   * Actualiza distancias de las entradas (para priorización)
   */
  updateDistances(getDistance: (pos: ChunkPosition) => number): void {
    for (const entry of this.cache.values()) {
      entry.distance = getDistance(entry.position)
    }
  }

  /**
   * Verifica si necesita evicción
   */
  private needsEviction(newEntrySize: number): boolean {
    const futureSize = this.currentSizeBytes + newEntrySize
    const threshold = this.maxSizeBytes * this.config.evictionThreshold
    return futureSize > threshold
  }

  /**
   * Evicta entradas menos usadas hasta liberar espacio
   */
  private evict(): void {
    // Calcular cuánto necesitamos liberar
    const targetSize = this.minSizeBytes
    
    // Crear array de entradas ordenadas por prioridad de evicción
    const entries = Array.from(this.cache.values())
    
    // Calcular score de evicción (menor = evictar primero)
    entries.forEach(entry => {
      const timeSinceAccess = Date.now() - entry.lastAccess
      const ageScore = timeSinceAccess / 1000 // Segundos desde último acceso
      const distanceScore = entry.distance / 1000 // Distancia en km
      const frequencyScore = 1 / (entry.accessCount + 1)
      
      // Score combinado (mayor = más probable de evictar)
      ;(entry as any).evictionScore = 
        ageScore * 0.4 +
        distanceScore * 0.4 +
        frequencyScore * 0.2
    })

    // Ordenar por score (mayor primero)
    entries.sort((a, b) => 
      (b as any).evictionScore - (a as any).evictionScore
    )

    // Evictar hasta alcanzar el tamaño objetivo
    while (this.currentSizeBytes > targetSize && entries.length > 0) {
      const entry = entries.pop()!
      this.cache.delete(entry.key)
      this.currentSizeBytes -= entry.size
      this.stats.evictions++
    }
  }

  /**
   * Limpia entradas lejanas (fuera del view distance)
   */
  cleanDistant(maxDistance: number): number {
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (entry.distance > maxDistance * 1.5) {
        this.cache.delete(key)
        this.currentSizeBytes -= entry.size
        cleaned++
      }
    }

    return cleaned
  }

  /**
   * Limpia toda la caché
   */
  clear(): void {
    this.cache.clear()
    this.currentSizeBytes = 0
  }

  /**
   * Obtiene tamaño actual en MB
   */
  getSizeMB(): number {
    return this.currentSizeBytes / (1024 * 1024)
  }

  /**
   * Obtiene uso como porcentaje
   */
  getUsagePercent(): number {
    return (this.currentSizeBytes / this.maxSizeBytes) * 100
  }

  /**
   * Obtiene tasa de aciertos
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses
    return total > 0 ? this.stats.hits / total : 0
  }

  /**
   * Obtiene estadísticas
   */
  getStats() {
    return {
      ...this.stats,
      entries: this.cache.size,
      sizeMB: this.getSizeMB(),
      usagePercent: this.getUsagePercent(),
      hitRate: this.getHitRate(),
    }
  }

  /**
   * Obtiene todas las posiciones en caché
   */
  getPositions(): ChunkPosition[] {
    return Array.from(this.cache.values()).map(e => e.position)
  }

  /**
   * Helper para generar keys
   */
  private getKey(position: ChunkPosition): string {
    return `${position.x},${position.z}`
  }
}

/**
 * Estimador de tamaño de chunks
 */
export class ChunkSizeEstimator {
  /**
   * Estima tamaño en bytes de un chunk según configuración
   */
  static estimate(config: {
    segmentsX: number
    segmentsZ: number
    lodLevels: number
    hasTexture: boolean
  }): number {
    const { segmentsX, segmentsZ, lodLevels, hasTexture } = config

    let totalSize = 0

    // Calcular para cada nivel LOD
    for (let lod = 0; lod < lodLevels; lod++) {
      const factor = Math.pow(2, lod)
      const lodSegmentsX = Math.floor(segmentsX / factor)
      const lodSegmentsZ = Math.floor(segmentsZ / factor)
      
      if (lodSegmentsX < 2 || lodSegmentsZ < 2) continue

      const vertices = (lodSegmentsX + 1) * (lodSegmentsZ + 1)
      const triangles = lodSegmentsX * lodSegmentsZ * 2

      // Geometry data
      totalSize += vertices * 3 * 4 // positions (Float32)
      totalSize += vertices * 3 * 4 // normals (Float32)
      totalSize += vertices * 2 * 4 // uvs (Float32)
      totalSize += triangles * 3 * 2 // indices (Uint16)

      // Texture data (si aplica)
      if (hasTexture) {
        const texSize = 512 // Asumiendo 512x512
        totalSize += texSize * texSize * 4 // RGBA
      }
    }

    // Overhead del objeto
    totalSize += 1024

    return totalSize
  }

  /**
   * Estima tamaño de un chunk típico
   */
  static estimateTypical(quality: 'low' | 'medium' | 'high' | 'ultra'): number {
    const configs = {
      low: { segmentsX: 10, segmentsZ: 10, lodLevels: 3, hasTexture: false },
      medium: { segmentsX: 20, segmentsZ: 20, lodLevels: 4, hasTexture: true },
      high: { segmentsX: 30, segmentsZ: 30, lodLevels: 4, hasTexture: true },
      ultra: { segmentsX: 50, segmentsZ: 50, lodLevels: 5, hasTexture: true },
    }

    return this.estimate(configs[quality])
  }
}
