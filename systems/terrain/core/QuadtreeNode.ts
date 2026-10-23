/**
 * QuadtreeNode - Nodo del quadtree para LOD jerárquico
 * 
 * Estructura de árbol que divide el terreno recursivamente:
 * - Nodo raíz: región completa
 * - Nodos hijos: subdivisiones 2x2
 * - Hojas: chunks renderizables
 * 
 * Optimiza renderizado mostrando solo el nivel LOD apropiado
 * según distancia al jugador.
 */

import * as THREE from 'three'
import type { ChunkPosition } from './TerrainChunk'

export interface QuadtreeBounds {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export interface QuadtreeConfig {
  minNodeSize: number  // Tamaño mínimo de nodo (ej: 1km)
  maxDepth: number     // Profundidad máxima del árbol
  lodDistances: number[]  // Distancias para cada nivel LOD
}

/**
 * Nodo del quadtree para gestión jerárquica de LOD
 */
export class QuadtreeNode {
  public bounds: QuadtreeBounds
  public center: THREE.Vector3
  public size: number
  public depth: number
  public parent?: QuadtreeNode
  public children: QuadtreeNode[] = []
  public isLeaf: boolean = true
  public chunkPosition?: ChunkPosition
  public isVisible: boolean = false
  public currentLOD: number = 0

  private config: QuadtreeConfig

  constructor(
    bounds: QuadtreeBounds,
    depth: number,
    config: QuadtreeConfig,
    parent?: QuadtreeNode
  ) {
    this.bounds = bounds
    this.depth = depth
    this.config = config
    this.parent = parent

    // Calcular centro y tamaño
    this.size = Math.max(
      bounds.maxX - bounds.minX,
      bounds.maxZ - bounds.minZ
    )
    
    this.center = new THREE.Vector3(
      (bounds.minX + bounds.maxX) / 2,
      0,
      (bounds.minZ + bounds.maxZ) / 2
    )

    // Calcular posición del chunk si es hoja
    if (this.isLeaf) {
      this.chunkPosition = {
        x: Math.floor(this.center.x / config.minNodeSize),
        z: Math.floor(this.center.z / config.minNodeSize)
      }
    }
  }

  /**
   * Subdivide el nodo en 4 hijos (2x2)
   */
  subdivide(): void {
    if (!this.isLeaf || this.depth >= this.config.maxDepth) {
      return
    }

    const { minX, maxX, minZ, maxZ } = this.bounds
    const midX = (minX + maxX) / 2
    const midZ = (minZ + maxZ) / 2

    // Crear 4 nodos hijos
    this.children = [
      // Noroeste
      new QuadtreeNode(
        { minX, maxX: midX, minZ, maxZ: midZ },
        this.depth + 1,
        this.config,
        this
      ),
      // Noreste
      new QuadtreeNode(
        { minX: midX, maxX, minZ, maxZ: midZ },
        this.depth + 1,
        this.config,
        this
      ),
      // Suroeste
      new QuadtreeNode(
        { minX, maxX: midX, minZ: midZ, maxZ },
        this.depth + 1,
        this.config,
        this
      ),
      // Sureste
      new QuadtreeNode(
        { minX: midX, maxX, minZ: midZ, maxZ },
        this.depth + 1,
        this.config,
        this
      ),
    ]

    this.isLeaf = false
    this.chunkPosition = undefined
  }

  /**
   * Colapsa el nodo eliminando sus hijos
   */
  collapse(): void {
    if (this.isLeaf) return

    // Limpiar hijos recursivamente
    for (const child of this.children) {
      if (!child.isLeaf) {
        child.collapse()
      }
    }

    this.children = []
    this.isLeaf = true
    
    // Recalcular posición del chunk
    this.chunkPosition = {
      x: Math.floor(this.center.x / this.config.minNodeSize),
      z: Math.floor(this.center.z / this.config.minNodeSize)
    }
  }

  /**
   * Actualiza el árbol según la posición del observador
   * Subdivide nodos cercanos, colapsa nodos lejanos
   */
  update(viewPoint: THREE.Vector3, viewDistance: number): void {
    const distance = this.center.distanceTo(viewPoint)
    
    // Determinar si este nodo debería estar subdividido
    const shouldSubdivide = this.shouldSubdivide(distance, viewDistance)

    if (shouldSubdivide && this.isLeaf) {
      // Subdividir si es hoja y está cerca
      if (this.size > this.config.minNodeSize) {
        this.subdivide()
      }
    } else if (!shouldSubdivide && !this.isLeaf) {
      // Colapsar si está lejos y tiene hijos
      this.collapse()
    }

    // Actualizar hijos recursivamente
    if (!this.isLeaf) {
      for (const child of this.children) {
        child.update(viewPoint, viewDistance)
      }
    }

    // Actualizar LOD si es hoja
    if (this.isLeaf) {
      this.currentLOD = this.calculateLOD(distance)
      this.isVisible = distance <= viewDistance
    }
  }

  /**
   * Determina si el nodo debería subdividirse
   */
  private shouldSubdivide(distance: number, viewDistance: number): boolean {
    // No subdividir si ya alcanzamos el tamaño mínimo
    if (this.size <= this.config.minNodeSize) {
      return false
    }

    // No subdividir si está muy lejos
    if (distance > viewDistance) {
      return false
    }

    // No subdividir si alcanzamos profundidad máxima
    if (this.depth >= this.config.maxDepth) {
      return false
    }

    // Subdividir si está cerca (dentro del primer nivel LOD)
    const firstLODDistance = this.config.lodDistances[0] || viewDistance / 4
    return distance < firstLODDistance * 2
  }

  /**
   * Calcula el nivel LOD apropiado según distancia
   */
  private calculateLOD(distance: number): number {
    for (let i = 0; i < this.config.lodDistances.length; i++) {
      if (distance <= this.config.lodDistances[i]) {
        return i
      }
    }
    return this.config.lodDistances.length
  }

  /**
   * Obtiene todas las hojas visibles (chunks a renderizar)
   */
  getVisibleLeaves(): QuadtreeNode[] {
    if (this.isLeaf) {
      return this.isVisible ? [this] : []
    }

    const leaves: QuadtreeNode[] = []
    for (const child of this.children) {
      leaves.push(...child.getVisibleLeaves())
    }
    return leaves
  }

  /**
   * Obtiene todas las hojas del árbol (visibles o no)
   */
  getAllLeaves(): QuadtreeNode[] {
    if (this.isLeaf) {
      return [this]
    }

    const leaves: QuadtreeNode[] = []
    for (const child of this.children) {
      leaves.push(...child.getAllLeaves())
    }
    return leaves
  }

  /**
   * Busca el nodo que contiene un punto
   */
  findNodeAt(x: number, z: number): QuadtreeNode | null {
    // Verificar si el punto está dentro de los bounds
    if (
      x < this.bounds.minX || x > this.bounds.maxX ||
      z < this.bounds.minZ || z > this.bounds.maxZ
    ) {
      return null
    }

    // Si es hoja, retornar este nodo
    if (this.isLeaf) {
      return this
    }

    // Buscar en hijos
    for (const child of this.children) {
      const found = child.findNodeAt(x, z)
      if (found) return found
    }

    return null
  }

  /**
   * Obtiene estadísticas del árbol
   */
  getStats(): {
    totalNodes: number
    leafNodes: number
    maxDepth: number
    visibleNodes: number
  } {
    if (this.isLeaf) {
      return {
        totalNodes: 1,
        leafNodes: 1,
        maxDepth: this.depth,
        visibleNodes: this.isVisible ? 1 : 0
      }
    }

    let stats = {
      totalNodes: 1,
      leafNodes: 0,
      maxDepth: this.depth,
      visibleNodes: 0
    }

    for (const child of this.children) {
      const childStats = child.getStats()
      stats.totalNodes += childStats.totalNodes
      stats.leafNodes += childStats.leafNodes
      stats.maxDepth = Math.max(stats.maxDepth, childStats.maxDepth)
      stats.visibleNodes += childStats.visibleNodes
    }

    return stats
  }

  /**
   * Debug: Dibuja el wireframe del quadtree
   */
  debugDraw(scene: THREE.Scene, color: number = 0xff0000): THREE.LineSegments[] {
    const lines: THREE.LineSegments[] = []

    // Crear wireframe para este nodo
    const points = [
      new THREE.Vector3(this.bounds.minX, 0, this.bounds.minZ),
      new THREE.Vector3(this.bounds.maxX, 0, this.bounds.minZ),
      new THREE.Vector3(this.bounds.maxX, 0, this.bounds.maxZ),
      new THREE.Vector3(this.bounds.minX, 0, this.bounds.maxZ),
      new THREE.Vector3(this.bounds.minX, 0, this.bounds.minZ),
    ]

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ 
      color,
      opacity: this.isLeaf ? 1.0 : 0.3,
      transparent: true
    })
    const line = new THREE.LineSegments(geometry, material)
    
    scene.add(line)
    lines.push(line)

    // Dibujar hijos recursivamente
    if (!this.isLeaf) {
      for (const child of this.children) {
        lines.push(...child.debugDraw(scene, color))
      }
    }

    return lines
  }
}

/**
 * Manager del quadtree para el terreno completo
 */
export class QuadtreeManager {
  private root: QuadtreeNode
  private config: QuadtreeConfig
  private debugLines: THREE.LineSegments[] = []

  constructor(
    worldBounds: QuadtreeBounds,
    config: QuadtreeConfig
  ) {
    this.config = config
    this.root = new QuadtreeNode(worldBounds, 0, config)
  }

  /**
   * Actualiza el quadtree completo
   */
  update(viewPoint: THREE.Vector3, viewDistance: number): void {
    this.root.update(viewPoint, viewDistance)
  }

  /**
   * Obtiene todos los chunks visibles que deberían renderizarse
   */
  getVisibleChunks(): Array<{
    position: ChunkPosition
    lod: number
    distance: number
  }> {
    const leaves = this.root.getVisibleLeaves()
    const viewPoint = new THREE.Vector3() // Se actualizará en el siguiente frame

    return leaves
      .filter(leaf => leaf.chunkPosition)
      .map(leaf => ({
        position: leaf.chunkPosition!,
        lod: leaf.currentLOD,
        distance: leaf.center.distanceTo(viewPoint)
      }))
  }

  /**
   * Obtiene estadísticas del quadtree
   */
  getStats() {
    return this.root.getStats()
  }

  /**
   * Activa/desactiva visualización debug
   */
  setDebugMode(enabled: boolean, scene?: THREE.Scene): void {
    // Limpiar líneas existentes
    for (const line of this.debugLines) {
      line.parent?.remove(line)
      line.geometry.dispose()
      if (line.material instanceof THREE.Material) {
        line.material.dispose()
      }
    }
    this.debugLines = []

    // Dibujar si está habilitado
    if (enabled && scene) {
      this.debugLines = this.root.debugDraw(scene, 0x00ff00)
    }
  }

  /**
   * Reinicia el quadtree
   */
  reset(): void {
    this.root.collapse()
  }
}
