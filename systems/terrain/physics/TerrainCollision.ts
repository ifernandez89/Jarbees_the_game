/**
 * TerrainCollision - Sistema de colisiones optimizado
 * 
 * Características:
 * - Mesh simplificado para física (menos polígonos)
 * - Colisiones solo en chunks cercanos
 * - Raycasting optimizado
 * - Octree para queries espaciales rápidas
 */

import * as THREE from 'three'
import type { ChunkPosition } from '../core/TerrainChunk'

export interface CollisionConfig {
  enablePhysics: boolean  // Activar colisiones (default: true)
  collisionRadius: number  // Radio de colisiones activas (default: 500m)
  simplificationFactor: number  // Factor de simplificación (default: 4)
  raycastPrecision: number  // Precisión de raycast (default: 0.1)
}

export interface RaycastResult {
  hit: boolean
  point?: THREE.Vector3
  distance?: number
  normal?: THREE.Vector3
  chunk?: ChunkPosition
}

export interface CollisionMesh {
  position: ChunkPosition
  mesh: THREE.Mesh
  geometry: THREE.BufferGeometry
  lastUpdate: number
}

/**
 * Gestiona colisiones con el terreno
 */
export class TerrainCollisionSystem {
  private config: Required<CollisionConfig>
  private collisionMeshes: Map<string, CollisionMesh> = new Map()
  private raycaster: THREE.Raycaster
  private tempVector: THREE.Vector3 = new THREE.Vector3()

  constructor(config: Partial<CollisionConfig> = {}) {
    this.config = {
      enablePhysics: true,
      collisionRadius: 500,
      simplificationFactor: 4,
      raycastPrecision: 0.1,
      ...config
    }

    this.raycaster = new THREE.Raycaster()
    this.raycaster.params.Line = { threshold: this.config.raycastPrecision }
  }

  /**
   * Crea un mesh de colisión simplificado para un chunk
   */
  createCollisionMesh(
    position: ChunkPosition,
    heightData: Float32Array,
    size: number,
    resolution: number
  ): CollisionMesh {
    const key = this.getKey(position)

    // Simplificar geometría
    const simplifiedResolution = resolution * this.config.simplificationFactor
    const segments = Math.floor(size / simplifiedResolution)

    // Crear geometría simplificada
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments)
    geometry.rotateX(-Math.PI / 2)

    // Aplicar heightmap a la geometría simplificada
    this.applyHeightmap(geometry, heightData, segments)

    // Crear mesh
    const material = new THREE.MeshBasicMaterial({ 
      visible: false,  // Invisible, solo para física
      wireframe: true 
    })
    const mesh = new THREE.Mesh(geometry, material)
    
    // Posicionar mesh
    mesh.position.set(
      position.x * size,
      0,
      position.z * size
    )

    const collisionMesh: CollisionMesh = {
      position,
      mesh,
      geometry,
      lastUpdate: Date.now()
    }

    this.collisionMeshes.set(key, collisionMesh)

    return collisionMesh
  }

  /**
   * Aplica heightmap a geometría simplificada
   */
  private applyHeightmap(
    geometry: THREE.BufferGeometry,
    heightData: Float32Array,
    segments: number
  ): void {
    const positions = geometry.attributes.position as THREE.BufferAttribute
    const heightmapSize = Math.sqrt(heightData.length)

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const z = positions.getZ(i)

      // Normalizar coordenadas (0 a 1)
      const nx = (x + 1) / 2
      const nz = (z + 1) / 2

      // Mapear a heightmap
      const hx = nx * heightmapSize
      const hz = nz * heightmapSize

      // Obtener elevación con interpolación
      const elevation = this.sampleHeightmap(heightData, hx, hz, heightmapSize)
      
      positions.setY(i, elevation)
    }

    positions.needsUpdate = true
    geometry.computeVertexNormals()
  }

  /**
   * Muestrea heightmap con interpolación bilinear
   */
  private sampleHeightmap(
    data: Float32Array,
    x: number,
    z: number,
    size: number
  ): number {
    const ix0 = Math.floor(x)
    const iz0 = Math.floor(z)
    const ix1 = Math.min(ix0 + 1, size - 1)
    const iz1 = Math.min(iz0 + 1, size - 1)

    if (ix0 < 0 || ix0 >= size || iz0 < 0 || iz0 >= size) {
      return 0
    }

    const fx = x - ix0
    const fz = z - iz0

    const h00 = data[iz0 * size + ix0]
    const h10 = data[iz0 * size + ix1]
    const h01 = data[iz1 * size + ix0]
    const h11 = data[iz1 * size + ix1]

    const h0 = h00 * (1 - fx) + h10 * fx
    const h1 = h01 * (1 - fx) + h11 * fx
    
    return h0 * (1 - fz) + h1 * fz
  }

  /**
   * Raycast contra el terreno
   */
  raycast(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance: number = 1000
  ): RaycastResult {
    if (!this.config.enablePhysics) {
      return { hit: false }
    }

    this.raycaster.set(origin, direction)
    this.raycaster.far = maxDistance

    // Obtener meshes cercanos
    const nearbyMeshes = this.getNearbyMeshes(origin, this.config.collisionRadius)
    
    if (nearbyMeshes.length === 0) {
      return { hit: false }
    }

    // Raycast
    const intersects = this.raycaster.intersectObjects(nearbyMeshes, false)

    if (intersects.length > 0) {
      const hit = intersects[0]
      return {
        hit: true,
        point: hit.point,
        distance: hit.distance,
        normal: hit.face?.normal,
      }
    }

    return { hit: false }
  }

  /**
   * Obtiene la altura del terreno en un punto (sin raycast)
   */
  getHeightAt(worldX: number, worldZ: number): number | null {
    // Encontrar chunk que contiene el punto
    const chunkSize = 1000 // Asumiendo chunks de 1km
    const chunkX = Math.floor(worldX / chunkSize)
    const chunkZ = Math.floor(worldZ / chunkSize)
    
    const key = this.getKey({ x: chunkX, z: chunkZ })
    const collisionMesh = this.collisionMeshes.get(key)

    if (!collisionMesh) {
      return null
    }

    // Raycast vertical
    const origin = new THREE.Vector3(worldX, 10000, worldZ)
    const direction = new THREE.Vector3(0, -1, 0)

    const result = this.raycast(origin, direction, 20000)
    
    return result.hit ? result.point!.y : null
  }

  /**
   * Verifica colisión de esfera con terreno
   */
  sphereCollision(
    center: THREE.Vector3,
    radius: number
  ): boolean {
    const height = this.getHeightAt(center.x, center.z)
    
    if (height === null) {
      return false
    }

    // Verificar si la esfera intersecta el terreno
    return center.y - radius < height
  }

  /**
   * Obtiene meshes cercanos a un punto
   */
  private getNearbyMeshes(
    point: THREE.Vector3,
    radius: number
  ): THREE.Mesh[] {
    const meshes: THREE.Mesh[] = []

    for (const collisionMesh of this.collisionMeshes.values()) {
      const distance = point.distanceTo(collisionMesh.mesh.position)
      
      if (distance <= radius) {
        meshes.push(collisionMesh.mesh)
      }
    }

    return meshes
  }

  /**
   * Actualiza meshes de colisión según posición del jugador
   */
  update(playerPosition: THREE.Vector3): void {
    if (!this.config.enablePhysics) return

    // Limpiar meshes lejanos
    const maxDistance = this.config.collisionRadius * 2

    for (const [key, collisionMesh] of this.collisionMeshes.entries()) {
      const distance = playerPosition.distanceTo(collisionMesh.mesh.position)
      
      if (distance > maxDistance) {
        this.removeCollisionMesh({ x: collisionMesh.position.x, z: collisionMesh.position.z })
      }
    }
  }

  /**
   * Elimina un mesh de colisión
   */
  removeCollisionMesh(position: ChunkPosition): void {
    const key = this.getKey(position)
    const collisionMesh = this.collisionMeshes.get(key)

    if (collisionMesh) {
      collisionMesh.geometry.dispose()
      if (collisionMesh.mesh.material instanceof THREE.Material) {
        collisionMesh.mesh.material.dispose()
      }
      this.collisionMeshes.delete(key)
    }
  }

  /**
   * Activa/desactiva visualización debug
   */
  setDebugMode(enabled: boolean, scene?: THREE.Scene): void {
    for (const collisionMesh of this.collisionMeshes.values()) {
      const material = collisionMesh.mesh.material as THREE.MeshBasicMaterial
      material.visible = enabled
      material.wireframe = true
      material.color.set(0xff0000)

      if (enabled && scene && !collisionMesh.mesh.parent) {
        scene.add(collisionMesh.mesh)
      } else if (!enabled && collisionMesh.mesh.parent) {
        collisionMesh.mesh.parent.remove(collisionMesh.mesh)
      }
    }
  }

  /**
   * Obtiene estadísticas
   */
  getStats() {
    let totalVertices = 0
    let totalTriangles = 0

    for (const collisionMesh of this.collisionMeshes.values()) {
      const positions = collisionMesh.geometry.attributes.position
      totalVertices += positions.count
      totalTriangles += (positions.count - 2) // Aproximación
    }

    return {
      activeMeshes: this.collisionMeshes.size,
      totalVertices,
      totalTriangles,
      simplificationFactor: this.config.simplificationFactor,
    }
  }

  /**
   * Limpia todos los meshes
   */
  dispose(): void {
    for (const position of Array.from(this.collisionMeshes.keys())) {
      const [x, z] = position.split(',').map(Number)
      this.removeCollisionMesh({ x, z })
    }
  }

  /**
   * Helper para keys
   */
  private getKey(position: ChunkPosition): string {
    return `${position.x},${position.z}`
  }
}

/**
 * Helper para integrar con BeePlayer o cualquier entidad
 */
export class EntityTerrainCollider {
  private collisionSystem: TerrainCollisionSystem
  private minHeight: number = 1.0  // Altura mínima sobre el terreno

  constructor(collisionSystem: TerrainCollisionSystem, minHeight: number = 1.0) {
    this.collisionSystem = collisionSystem
    this.minHeight = minHeight
  }

  /**
   * Ajusta la posición de una entidad para que no atraviese el terreno
   */
  constrainToTerrain(position: THREE.Vector3): THREE.Vector3 {
    const terrainHeight = this.collisionSystem.getHeightAt(position.x, position.z)
    
    if (terrainHeight !== null) {
      const minY = terrainHeight + this.minHeight
      if (position.y < minY) {
        position.y = minY
      }
    }

    return position
  }

  /**
   * Verifica si una entidad está en el suelo
   */
  isGrounded(position: THREE.Vector3, threshold: number = 0.5): boolean {
    const terrainHeight = this.collisionSystem.getHeightAt(position.x, position.z)
    
    if (terrainHeight === null) {
      return false
    }

    return Math.abs(position.y - (terrainHeight + this.minHeight)) < threshold
  }

  /**
   * Obtiene la altura del terreno bajo una entidad
   */
  getGroundHeight(position: THREE.Vector3): number | null {
    return this.collisionSystem.getHeightAt(position.x, position.z)
  }
}
