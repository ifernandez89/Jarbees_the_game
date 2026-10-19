import * as THREE from 'three'
import { PerlinNoiseGenerator } from '@/utils/perlinNoise'

export interface ChunkData {
  key: string
  position: [number, number, number]
  geometry: THREE.BufferGeometry
  material: THREE.Material
  mesh?: THREE.Mesh
  isActive: boolean
}

export interface ChunkConfig {
  size: number // Tamaño del chunk (ancho y profundidad)
  resolution: number // Resolución del grid (menor = más detallado)
  viewDistance: number // Distancia de renderizado
  heightMultiplier: number
  color: string
}

export class ChunkManager {
  private chunks: Map<string, ChunkData> = new Map()
  private noiseGenerator: PerlinNoiseGenerator
  private config: ChunkConfig
  private chunkPool: ChunkData[] = []

  constructor(config: ChunkConfig, seed?: number) {
    this.config = config
    this.noiseGenerator = new PerlinNoiseGenerator(seed)
  }

  /**
   * Generar clave única para un chunk basada en su posición en el grid
   */
  private getChunkKey(chunkX: number, chunkZ: number): string {
    return `${chunkX}_${chunkZ}`
  }

  /**
   * Obtener coordenadas del chunk que contiene una posición mundial
   */
  private worldToChunkCoords(worldX: number, worldZ: number): [number, number] {
    const chunkX = Math.floor(worldX / this.config.size)
    const chunkZ = Math.floor(worldZ / this.config.size)
    return [chunkX, chunkZ]
  }

  /**
   * Generar geometría del terreno para un chunk
   */
  private generateChunkGeometry(chunkX: number, chunkZ: number): THREE.BufferGeometry {
    const { size, resolution, heightMultiplier } = this.config
    
    // Posición mundial del chunk
    const worldX = chunkX * size
    const worldZ = chunkZ * size
    
    // Número de segmentos
    const segments = Math.floor(size / resolution)
    
    // Crear geometría de plano
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments)
    
    // Obtener array de posiciones
    const positions = geometry.attributes.position.array as Float32Array
    
    // Modificar altura de cada vértice según Perlin Noise
    const colors = new Float32Array(positions.length)
    const colorShore = new THREE.Color('#586e42') // Orilla y valles bajos
    const colorGrass = new THREE.Color('#3f5e2d') // Pasto andino frondoso
    const colorHigh = new THREE.Color('#5d6840')  // Pastizal alto / ichu
    const colorPeak = new THREE.Color('#6d665b')  // Roca de montaña
    const tempColor = new THREE.Color()

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i] + worldX
      const z = positions[i + 1] + worldZ
      
      // Y es la altura (index i + 2)
      const h = this.noiseGenerator.getHeight(x, z, heightMultiplier)
      positions[i + 2] = h

      // Coloración natural según altitud
      if (h < 2.0) {
        tempColor.copy(colorShore)
      } else if (h < 5.0) {
        const t = (h - 2.0) / 3.0
        tempColor.copy(colorShore).lerp(colorGrass, t)
      } else if (h < 9.0) {
        const t = (h - 5.0) / 4.0
        tempColor.copy(colorGrass).lerp(colorHigh, t)
      } else {
        const t = Math.min(1.0, (h - 9.0) / 4.0)
        tempColor.copy(colorHigh).lerp(colorPeak, t)
      }

      colors[i] = tempColor.r
      colors[i + 1] = tempColor.g
      colors[i + 2] = tempColor.b
    }
    
    // Rotar para que sea horizontal
    geometry.rotateX(-Math.PI / 2)
    
    // Asignar colores de vértices
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    // Recalcular normales para iluminación correcta
    geometry.computeVertexNormals()
    
    return geometry
  }

  /**
   * Crear un nuevo chunk
   */
  private createChunk(chunkX: number, chunkZ: number): ChunkData {
    const key = this.getChunkKey(chunkX, chunkZ)
    const worldX = chunkX * this.config.size
    const worldZ = chunkZ * this.config.size
    
    // Reutilizar chunk del pool si existe
    let chunk = this.chunkPool.pop()
    
    if (chunk) {
      // Actualizar chunk existente
      chunk.key = key
      chunk.position = [worldX, 0, worldZ]
      chunk.isActive = true
      
      // Regenerar geometría
      chunk.geometry.dispose()
      chunk.geometry = this.generateChunkGeometry(chunkX, chunkZ)
    } else {
      // Crear nuevo chunk
      const geometry = this.generateChunkGeometry(chunkX, chunkZ)
      const material = new THREE.MeshStandardMaterial({
        color: this.config.color,
        vertexColors: true,
        roughness: 0.85,
        metalness: 0.05,
        flatShading: false,
      })
      
      chunk = {
        key,
        position: [worldX, 0, worldZ],
        geometry,
        material,
        isActive: true,
      }
    }
    
    return chunk
  }

  /**
   * Actualizar chunks basado en la posición del jugador.
   *
   * Parámetros opcionales para vuelo a alta velocidad (streaming anticipado):
   * @param aheadX/aheadZ  Desplazamiento (m) hacia donde viaja el jugador: se precargan chunks en esa dirección.
   * @param extraView      Metros extra de radio de carga alrededor del punto anticipado.
   * @param maxNew         Presupuesto máximo de chunks nuevos por llamada (evita tirones de CPU).
   */
  updateChunks(
    playerX: number,
    playerZ: number,
    aheadX = 0,
    aheadZ = 0,
    extraView = 0,
    maxNew = Infinity
  ): ChunkData[] {
    const [centerChunkX, centerChunkZ] = this.worldToChunkCoords(playerX, playerZ)
    const baseRadius = Math.ceil(this.config.viewDistance / this.config.size)

    // Conjunto de chunks requeridos: área alrededor del jugador + área alrededor del punto anticipado
    const required = new Map<string, { x: number; z: number; d: number }>()
    const addArea = (cx: number, cz: number, radius: number) => {
      for (let x = -radius; x <= radius; x++) {
        for (let z = -radius; z <= radius; z++) {
          const chunkX = cx + x
          const chunkZ = cz + z
          const key = this.getChunkKey(chunkX, chunkZ)
          if (required.has(key)) continue
          const dx = chunkX - centerChunkX
          const dz = chunkZ - centerChunkZ
          required.set(key, { x: chunkX, z: chunkZ, d: dx * dx + dz * dz })
        }
      }
    }

    addArea(centerChunkX, centerChunkZ, baseRadius)
    if (aheadX !== 0 || aheadZ !== 0) {
      const [aheadChunkX, aheadChunkZ] = this.worldToChunkCoords(playerX + aheadX, playerZ + aheadZ)
      addArea(aheadChunkX, aheadChunkZ, Math.ceil((this.config.viewDistance + extraView) / this.config.size))
    }

    // Crear primero los chunks más cercanos al jugador, respetando el presupuesto por frame
    const missing: Array<{ x: number; z: number; d: number }> = []
    required.forEach((entry, key) => {
      if (!this.chunks.has(key)) missing.push(entry)
    })
    missing.sort((a, b) => a.d - b.d)

    const chunksToAdd: ChunkData[] = []
    for (let i = 0; i < missing.length && chunksToAdd.length < maxNew; i++) {
      const { x, z } = missing[i]
      const chunk = this.createChunk(x, z)
      this.chunks.set(chunk.key, chunk)
      chunksToAdd.push(chunk)
    }

    // Desactivar chunks fuera de rango
    const chunksToRemove: string[] = []
    this.chunks.forEach((chunk, key) => {
      if (!required.has(key)) {
        chunk.isActive = false
        chunksToRemove.push(key)
        this.chunkPool.push(chunk)
      }
    })

    // Limpiar chunks inactivos
    chunksToRemove.forEach(key => this.chunks.delete(key))

    return chunksToAdd
  }

  /**
   * Obtener todos los chunks activos
   */
  getActiveChunks(): ChunkData[] {
    return Array.from(this.chunks.values()).filter(chunk => chunk.isActive)
  }

  /**
   * Obtener altura del terreno en una posición específica
   */
  getHeightAt(worldX: number, worldZ: number): number {
    return this.noiseGenerator.getHeight(worldX, worldZ, this.config.heightMultiplier)
  }

  /**
   * Limpiar todos los chunks
   */
  dispose() {
    this.chunks.forEach(chunk => {
      chunk.geometry.dispose()
      if (chunk.material instanceof THREE.Material) {
        chunk.material.dispose()
      }
    })
    this.chunks.clear()
    this.chunkPool = []
  }
}
