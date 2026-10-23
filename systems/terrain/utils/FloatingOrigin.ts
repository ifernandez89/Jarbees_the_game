/**
 * FloatingOrigin - Sistema de origen flotante para mundos grandes
 * 
 * Problema: Float precision en JavaScript/WebGL se degrada con coordenadas grandes
 * Solución: Recentrar el mundo cuando el jugador se aleja del origen
 * 
 * Cuando el jugador está a >10km del origen, todo se desplaza para mantener
 * al jugador cerca de (0,0,0) donde la precisión float es máxima.
 */

import * as THREE from 'three'

export interface FloatingOriginConfig {
  threshold: number  // Distancia para trigger recentrado (default: 10000 = 10km)
  affectObjects: boolean  // Afectar objetos de la escena (default: true)
  affectCamera: boolean  // Afectar cámara (default: true)
  debugMode: boolean  // Log recenter operations (default: false)
}

export interface TrackedEntity {
  object: THREE.Object3D
  offset?: THREE.Vector3  // Offset adicional permanente
}

/**
 * Gestiona el origen flotante para prevenir problemas de precisión float
 */
export class FloatingOrigin {
  private config: Required<FloatingOriginConfig>
  private worldOffset: THREE.Vector3 = new THREE.Vector3()
  private lastRecentered: THREE.Vector3 = new THREE.Vector3()
  private trackedEntities: Set<TrackedEntity> = new Set()
  private recenterCount: number = 0

  constructor(config: Partial<FloatingOriginConfig> = {}) {
    this.config = {
      threshold: 10000,
      affectObjects: true,
      affectCamera: true,
      debugMode: false,
      ...config
    }
  }

  /**
   * Registra una entidad para ser afectada por recenter
   */
  trackEntity(object: THREE.Object3D, offset?: THREE.Vector3): void {
    this.trackedEntities.add({ object, offset })
  }

  /**
   * Remueve una entidad del tracking
   */
  untrackEntity(object: THREE.Object3D): void {
    for (const entity of this.trackedEntities) {
      if (entity.object === object) {
        this.trackedEntities.delete(entity)
        break
      }
    }
  }

  /**
   * Verifica si necesita recenter y lo ejecuta si es necesario
   */
  update(playerPosition: THREE.Vector3): boolean {
    const distanceFromOrigin = playerPosition.length()

    if (distanceFromOrigin > this.config.threshold) {
      this.recenter(playerPosition)
      return true
    }

    return false
  }

  /**
   * Recentra el mundo alrededor del jugador
   */
  private recenter(playerPosition: THREE.Vector3): void {
    // Calcular offset de recenter
    const offset = playerPosition.clone()
    
    if (this.config.debugMode) {
      console.log('[FloatingOrigin] Recentering world', {
        playerPosition: playerPosition.toArray(),
        offset: offset.toArray(),
        distance: playerPosition.length(),
      })
    }

    // Actualizar offset mundial acumulado
    this.worldOffset.add(offset)
    this.lastRecentered.copy(playerPosition)
    this.recenterCount++

    // Desplazar todas las entidades trackeadas
    for (const entity of this.trackedEntities) {
      entity.object.position.sub(offset)
      
      // Aplicar offset adicional si existe
      if (entity.offset) {
        entity.object.position.add(entity.offset)
      }
    }
  }

  /**
   * Fuerza un recenter inmediato
   */
  forceRecenter(newCenter: THREE.Vector3): void {
    this.recenter(newCenter)
  }

  /**
   * Convierte coordenadas locales (relativas al origen actual) a mundiales
   */
  localToWorld(localPosition: THREE.Vector3): THREE.Vector3 {
    return localPosition.clone().add(this.worldOffset)
  }

  /**
   * Convierte coordenadas mundiales a locales (relativas al origen actual)
   */
  worldToLocal(worldPosition: THREE.Vector3): THREE.Vector3 {
    return worldPosition.clone().sub(this.worldOffset)
  }

  /**
   * Obtiene el offset mundial actual
   */
  getWorldOffset(): THREE.Vector3 {
    return this.worldOffset.clone()
  }

  /**
   * Obtiene la última posición de recenter
   */
  getLastRecentered(): THREE.Vector3 {
    return this.lastRecentered.clone()
  }

  /**
   * Obtiene estadísticas
   */
  getStats() {
    return {
      worldOffset: this.worldOffset.toArray(),
      recenterCount: this.recenterCount,
      trackedEntities: this.trackedEntities.size,
      currentThreshold: this.config.threshold,
    }
  }

  /**
   * Reinicia el sistema
   */
  reset(): void {
    this.worldOffset.set(0, 0, 0)
    this.lastRecentered.set(0, 0, 0)
    this.recenterCount = 0
  }

  /**
   * Libera recursos
   */
  dispose(): void {
    this.trackedEntities.clear()
  }
}

/**
 * Helper para integrar FloatingOrigin con chunks de terreno
 */
export class TerrainFloatingOriginManager {
  private floatingOrigin: FloatingOrigin
  private onRecenterCallback?: (offset: THREE.Vector3) => void

  constructor(
    config?: Partial<FloatingOriginConfig>,
    onRecenter?: (offset: THREE.Vector3) => void
  ) {
    this.floatingOrigin = new FloatingOrigin(config)
    this.onRecenterCallback = onRecenter
  }

  /**
   * Actualiza y notifica a sistemas de terreno si hay recenter
   */
  update(playerPosition: THREE.Vector3): void {
    const didRecenter = this.floatingOrigin.update(playerPosition)

    if (didRecenter && this.onRecenterCallback) {
      const offset = this.floatingOrigin.getWorldOffset()
      this.onRecenterCallback(offset)
    }
  }

  /**
   * Registra objetos del terreno
   */
  trackTerrainObject(object: THREE.Object3D): void {
    this.floatingOrigin.trackEntity(object)
  }

  /**
   * Obtiene el FloatingOrigin subyacente
   */
  getFloatingOrigin(): FloatingOrigin {
    return this.floatingOrigin
  }
}
