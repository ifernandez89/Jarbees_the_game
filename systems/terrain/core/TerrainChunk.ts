/**
 * TerrainChunk - Chunk individual de terreno con LOD
 * 
 * Representa un fragmento cuadrado del terreno con:
 * - Geometría generada desde heightmap
 * - Múltiples niveles de detalle (LOD)
 * - Material procedural
 * - Colisiones opcionales
 */

import * as THREE from 'three'
import type { HeightmapTile } from './HeightmapProcessor'

export interface ChunkPosition {
  x: number  // Índice X del chunk en la grid
  z: number  // Índice Z del chunk en la grid
}

export interface ChunkConfig {
  size: number  // Tamaño del chunk en metros (ej: 1000m = 1km)
  resolution: number  // Metros entre vértices (ej: 30m)
  lodLevels: number  // Número de niveles LOD (ej: 4)
  material?: THREE.Material  // Material custom
}

export interface LODMesh {
  level: number  // Nivel LOD (0 = más detalle)
  geometry: THREE.BufferGeometry
  mesh: THREE.Mesh
  vertexCount: number
  triangleCount: number
}

/**
 * Chunk de terreno con soporte para LOD y datos reales
 */
export class TerrainChunk {
  public position: ChunkPosition
  public worldPosition: THREE.Vector3
  public config: ChunkConfig
  public lodMeshes: LODMesh[] = []
  public currentLOD: number = -1
  public boundingBox: THREE.Box3
  public isVisible: boolean = true
  public lastUsed: number = Date.now()
  
  private group: THREE.Group
  private heightData?: Float32Array
  private minElevation: number = 0
  private maxElevation: number = 0

  constructor(
    position: ChunkPosition,
    config: ChunkConfig,
    scene: THREE.Scene
  ) {
    this.position = position
    this.config = config
    this.group = new THREE.Group()
    
    // Calcular posición mundial
    this.worldPosition = new THREE.Vector3(
      position.x * config.size,
      0,
      position.z * config.size
    )
    
    this.group.position.copy(this.worldPosition)
    scene.add(this.group)
    
    // Bounding box inicial
    this.boundingBox = new THREE.Box3(
      this.worldPosition,
      new THREE.Vector3(
        this.worldPosition.x + config.size,
        this.worldPosition.y + 1000, // Altura máxima temporal
        this.worldPosition.z + config.size
      )
    )
  }

  /**
   * Genera geometría desde heightmap data
   */
  generateFromHeightmap(heightmapTile: HeightmapTile): void {
    this.heightData = heightmapTile.data
    this.minElevation = heightmapTile.minElevation
    this.maxElevation = heightmapTile.maxElevation

    // Actualizar bounding box
    this.boundingBox.max.y = this.maxElevation

    // Generar todos los niveles LOD
    for (let lod = 0; lod < this.config.lodLevels; lod++) {
      this.generateLODLevel(lod)
    }

    // Mostrar LOD más detallado por defecto
    this.setLOD(0)
  }

  /**
   * Genera un nivel LOD específico
   */
  private generateLODLevel(level: number): void {
    const lodFactor = Math.pow(2, level)
    const resolution = this.config.resolution * lodFactor
    const segments = Math.floor(this.config.size / resolution)

    if (segments < 2) return // No generar LODs demasiado simples

    const geometry = this.createGeometry(segments, segments)
    
    // Aplicar heightmap si existe
    if (this.heightData) {
      this.applyHeightmapToGeometry(geometry, segments, lodFactor)
    }

    // Crear mesh
    const material = this.config.material || this.createDefaultMaterial()
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = level === 0 // Solo LOD más detallado proyecta sombras
    mesh.receiveShadow = true
    mesh.visible = false

    // Guardar LOD
    const vertexCount = (segments + 1) * (segments + 1)
    const triangleCount = segments * segments * 2

    this.lodMeshes.push({
      level,
      geometry,
      mesh,
      vertexCount,
      triangleCount
    })
  }

  /**
   * Crea geometría base del terreno
   */
  private createGeometry(segmentsX: number, segmentsZ: number): THREE.BufferGeometry {
    const geometry = new THREE.PlaneGeometry(
      this.config.size,
      this.config.size,
      segmentsX,
      segmentsZ
    )

    // Rotar para que sea horizontal
    geometry.rotateX(-Math.PI / 2)

    return geometry
  }

  /**
   * Aplica datos de heightmap a la geometría
   */
  private applyHeightmapToGeometry(
    geometry: THREE.BufferGeometry,
    segments: number,
    lodFactor: number
  ): void {
    const positions = geometry.attributes.position as THREE.BufferAttribute
    const heightmapSize = Math.sqrt(this.heightData!.length)

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const z = positions.getZ(i)

      // Convertir a coordenadas de heightmap (0 a heightmapSize)
      const hx = ((x + this.config.size / 2) / this.config.size) * heightmapSize
      const hz = ((z + this.config.size / 2) / this.config.size) * heightmapSize

      // Obtener elevación (con interpolación si es LOD reducido)
      const elevation = this.sampleHeightmap(hx, hz, heightmapSize)
      
      positions.setY(i, elevation)
    }

    positions.needsUpdate = true

    // Recalcular normales para iluminación correcta
    geometry.computeVertexNormals()

    // Actualizar bounding sphere
    geometry.computeBoundingSphere()
  }

  /**
   * Muestrea el heightmap con interpolación bilinear
   */
  private sampleHeightmap(x: number, z: number, size: number): number {
    const ix0 = Math.floor(x)
    const iz0 = Math.floor(z)
    const ix1 = Math.min(ix0 + 1, size - 1)
    const iz1 = Math.min(iz0 + 1, size - 1)

    if (ix0 < 0 || ix0 >= size || iz0 < 0 || iz0 >= size) {
      return 0
    }

    const fx = x - ix0
    const fz = z - iz0

    const h00 = this.heightData![iz0 * size + ix0]
    const h10 = this.heightData![iz0 * size + ix1]
    const h01 = this.heightData![iz1 * size + ix0]
    const h11 = this.heightData![iz1 * size + ix1]

    // Interpolación bilineal
    const h0 = h00 * (1 - fx) + h10 * fx
    const h1 = h01 * (1 - fx) + h11 * fx
    
    return h0 * (1 - fz) + h1 * fz
  }

  /**
   * Crea material por defecto
   */
  private createDefaultMaterial(): THREE.Material {
    return new THREE.MeshStandardMaterial({
      color: 0x7CFC00,
      roughness: 0.9,
      metalness: 0.0,
      flatShading: false,
    })
  }

  /**
   * Cambia el nivel LOD activo
   */
  setLOD(level: number): void {
    if (level === this.currentLOD || level >= this.lodMeshes.length) {
      return
    }

    // Ocultar LOD actual
    if (this.lodMeshes[this.currentLOD]) {
      this.lodMeshes[this.currentLOD].mesh.visible = false
      this.group.remove(this.lodMeshes[this.currentLOD].mesh)
    }

    // Mostrar nuevo LOD
    this.currentLOD = level
    const newLOD = this.lodMeshes[level]
    newLOD.mesh.visible = this.isVisible
    this.group.add(newLOD.mesh)

    this.lastUsed = Date.now()
  }

  /**
   * Obtiene la elevación en una coordenada local del chunk
   */
  getHeightAt(localX: number, localZ: number): number {
    if (!this.heightData) return 0

    const heightmapSize = Math.sqrt(this.heightData.length)
    const hx = (localX / this.config.size) * heightmapSize
    const hz = (localZ / this.config.size) * heightmapSize

    return this.sampleHeightmap(hx, hz, heightmapSize)
  }

  /**
   * Muestra/oculta el chunk
   */
  setVisible(visible: boolean): void {
    this.isVisible = visible
    if (this.lodMeshes[this.currentLOD]) {
      this.lodMeshes[this.currentLOD].mesh.visible = visible
    }
  }

  /**
   * Calcula la distancia al punto
   */
  distanceTo(point: THREE.Vector3): number {
    return this.worldPosition.distanceTo(point)
  }

  /**
   * Libera recursos de memoria
   */
  dispose(): void {
    for (const lod of this.lodMeshes) {
      lod.geometry.dispose()
      if (lod.mesh.material instanceof THREE.Material) {
        lod.mesh.material.dispose()
      }
      this.group.remove(lod.mesh)
    }
    
    this.lodMeshes = []
    this.group.parent?.remove(this.group)
  }

  /**
   * Obtiene estadísticas del chunk
   */
  getStats() {
    const currentLOD = this.lodMeshes[this.currentLOD]
    return {
      position: this.position,
      currentLOD: this.currentLOD,
      vertexCount: currentLOD?.vertexCount || 0,
      triangleCount: currentLOD?.triangleCount || 0,
      lodLevels: this.lodMeshes.length,
      minElevation: this.minElevation,
      maxElevation: this.maxElevation,
      isVisible: this.isVisible,
      lastUsed: this.lastUsed,
    }
  }
}
