/**
 * TerrainStreamer - Sistema de carga asíncrona de chunks
 * 
 * Características:
 * - Carga chunks en background sin bloquear el render
 * - Priorización por distancia al jugador
 * - Predicción de dirección de movimiento
 * - Workers para procesamiento paralelo (opcional)
 * - Cola de carga con límite de concurrencia
 */

import * as THREE from 'three'
import type { ChunkPosition } from '../core/TerrainChunk'

export interface LoadRequest {
  position: ChunkPosition
  priority: number  // Mayor = más urgente
  distance: number
  timestamp: number
}

export interface StreamerConfig {
  maxConcurrentLoads: number  // Máximo de cargas simultáneas (default: 4)
  predictionEnabled: boolean  // Predecir chunks según movimiento (default: true)
  predictionDistance: number  // Distancia de predicción en metros (default: 2000)
  loadTimeout: number         // Timeout por chunk en ms (default: 5000)
}

export type LoadCallback = (position: ChunkPosition) => Promise<void>

/**
 * Gestiona la carga asíncrona de chunks de terreno
 */
export class TerrainStreamer {
  private config: StreamerConfig
  private loadQueue: LoadRequest[] = []
  private activeLoads: Set<string> = new Set()
  private loadedChunks: Set<string> = new Set()
  private loadCallback: LoadCallback
  private lastViewPoint: THREE.Vector3 = new THREE.Vector3()
  private velocity: THREE.Vector3 = new THREE.Vector3()
  private lastUpdateTime: number = 0

  private stats = {
    totalLoaded: 0,
    totalFailed: 0,
    averageLoadTime: 0,
    queueSize: 0,
    activeLoads: 0,
  }

  constructor(
    loadCallback: LoadCallback,
    config: Partial<StreamerConfig> = {}
  ) {
    this.loadCallback = loadCallback
    this.config = {
      maxConcurrentLoads: 4,
      predictionEnabled: true,
      predictionDistance: 2000,
      loadTimeout: 5000,
      ...config
    }
  }

  /**
   * Solicita la carga de chunks
   */
  requestChunks(
    positions: ChunkPosition[],
    viewPoint: THREE.Vector3
  ): void {
    const now = Date.now()
    
    // Calcular velocidad del jugador
    if (this.lastUpdateTime > 0) {
      const deltaTime = (now - this.lastUpdateTime) / 1000
      this.velocity.copy(viewPoint).sub(this.lastViewPoint).divideScalar(deltaTime)
    }
    
    this.lastViewPoint.copy(viewPoint)
    this.lastUpdateTime = now

    // Añadir chunks a la cola
    for (const position of positions) {
      const key = this.getChunkKey(position)
      
      // Skip si ya está cargado o en proceso
      if (this.loadedChunks.has(key) || this.activeLoads.has(key)) {
        continue
      }

      // Skip si ya está en cola
      if (this.loadQueue.some(req => this.getChunkKey(req.position) === key)) {
        continue
      }

      const chunkCenter = new THREE.Vector3(
        position.x * 1000, // Asumiendo chunks de 1km
        0,
        position.z * 1000
      )

      const distance = viewPoint.distanceTo(chunkCenter)
      const priority = this.calculatePriority(chunkCenter, viewPoint, distance)

      this.loadQueue.push({
        position,
        priority,
        distance,
        timestamp: now
      })
    }

    // Añadir chunks predichos
    if (this.config.predictionEnabled && this.velocity.length() > 0) {
      this.addPredictedChunks(viewPoint)
    }

    // Ordenar cola por prioridad
    this.loadQueue.sort((a, b) => b.priority - a.priority)

    // Actualizar estadísticas
    this.stats.queueSize = this.loadQueue.length
    this.stats.activeLoads = this.activeLoads.size

    // Procesar cola
    this.processQueue()
  }

  /**
   * Calcula prioridad de carga de un chunk
   */
  private calculatePriority(
    chunkCenter: THREE.Vector3,
    viewPoint: THREE.Vector3,
    distance: number
  ): number {
    let priority = 1000 / (distance + 1) // Base: inverso de distancia

    // Boost si está en dirección del movimiento
    if (this.velocity.length() > 0) {
      const toChunk = chunkCenter.clone().sub(viewPoint).normalize()
      const velocityDir = this.velocity.clone().normalize()
      const alignment = toChunk.dot(velocityDir)
      
      if (alignment > 0) {
        priority *= (1 + alignment) // Boost hasta 2x
      }
    }

    return priority
  }

  /**
   * Añade chunks predichos según dirección de movimiento
   */
  private addPredictedChunks(viewPoint: THREE.Vector3): void {
    if (this.velocity.length() < 10) return // Movimiento muy lento

    const speed = this.velocity.length()
    const direction = this.velocity.clone().normalize()
    
    // Predecir posición futura
    const lookAheadTime = this.config.predictionDistance / speed
    const futurePoint = viewPoint.clone().add(
      direction.multiplyScalar(speed * lookAheadTime)
    )

    // Cargar chunks alrededor del punto futuro
    const chunkSize = 1000
    const futureChunkX = Math.floor(futurePoint.x / chunkSize)
    const futureChunkZ = Math.floor(futurePoint.z / chunkSize)

    const radius = 2 // Cargar 2 chunks alrededor
    for (let dz = -radius; dz <= radius; dz++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const position: ChunkPosition = {
          x: futureChunkX + dx,
          z: futureChunkZ + dz
        }

        const key = this.getChunkKey(position)
        if (
          !this.loadedChunks.has(key) &&
          !this.activeLoads.has(key) &&
          !this.loadQueue.some(req => this.getChunkKey(req.position) === key)
        ) {
          const chunkCenter = new THREE.Vector3(
            position.x * chunkSize,
            0,
            position.z * chunkSize
          )
          
          this.loadQueue.push({
            position,
            priority: 500, // Prioridad media para chunks predichos
            distance: viewPoint.distanceTo(chunkCenter),
            timestamp: Date.now()
          })
        }
      }
    }
  }

  /**
   * Procesa la cola de carga
   */
  private async processQueue(): Promise<void> {
    // Limitar cargas concurrentes
    while (
      this.activeLoads.size < this.config.maxConcurrentLoads &&
      this.loadQueue.length > 0
    ) {
      const request = this.loadQueue.shift()!
      const key = this.getChunkKey(request.position)
      
      this.activeLoads.add(key)
      this.loadChunk(request)
    }
  }

  /**
   * Carga un chunk individual
   */
  private async loadChunk(request: LoadRequest): Promise<void> {
    const key = this.getChunkKey(request.position)
    const startTime = Date.now()

    try {
      // Timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Load timeout')), this.config.loadTimeout)
      })

      // Cargar con timeout
      await Promise.race([
        this.loadCallback(request.position),
        timeoutPromise
      ])

      // Éxito
      this.loadedChunks.add(key)
      this.stats.totalLoaded++

      const loadTime = Date.now() - startTime
      this.stats.averageLoadTime = 
        (this.stats.averageLoadTime * (this.stats.totalLoaded - 1) + loadTime) /
        this.stats.totalLoaded

    } catch (error) {
      console.error(`Failed to load chunk ${key}:`, error)
      this.stats.totalFailed++
    } finally {
      this.activeLoads.delete(key)
      
      // Continuar procesando cola
      if (this.loadQueue.length > 0) {
        this.processQueue()
      }
    }
  }

  /**
   * Marca un chunk como descargado
   */
  unloadChunk(position: ChunkPosition): void {
    const key = this.getChunkKey(position)
    this.loadedChunks.delete(key)
  }

  /**
   * Limpia la cola de carga
   */
  clearQueue(): void {
    this.loadQueue = []
    this.stats.queueSize = 0
  }

  /**
   * Verifica si un chunk está cargado
   */
  isLoaded(position: ChunkPosition): boolean {
    return this.loadedChunks.has(this.getChunkKey(position))
  }

  /**
   * Verifica si un chunk está en proceso de carga
   */
  isLoading(position: ChunkPosition): boolean {
    return this.activeLoads.has(this.getChunkKey(position))
  }

  /**
   * Obtiene estadísticas del streamer
   */
  getStats() {
    return {
      ...this.stats,
      loadedChunks: this.loadedChunks.size,
      velocity: this.velocity.length(),
    }
  }

  /**
   * Reinicia el streamer
   */
  reset(): void {
    this.clearQueue()
    this.loadedChunks.clear()
    this.activeLoads.clear()
    this.velocity.set(0, 0, 0)
    this.stats = {
      totalLoaded: 0,
      totalFailed: 0,
      averageLoadTime: 0,
      queueSize: 0,
      activeLoads: 0,
    }
  }

  /**
   * Helper para generar keys de chunks
   */
  private getChunkKey(position: ChunkPosition): string {
    return `${position.x},${position.z}`
  }
}
