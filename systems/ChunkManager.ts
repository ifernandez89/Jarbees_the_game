import * as THREE from 'three'
import { PerlinNoiseGenerator } from '@/utils/perlinNoise'
import { getAssetPath } from '@/utils/assetPath'

export type BiomeType = 'titicaca' | 'easter_island' | 'constellations' | 'aconcagua'

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
  private biome: BiomeType

  // Cache estático para el DEM satelital de Aconcagua (Float32Array 512x512 = 1MB)
  private static aconcaguaDEM: Float32Array | null = null
  private static aconcaguaLoading = false

  constructor(config: ChunkConfig, seed?: number, biome: BiomeType = 'titicaca') {
    this.config = config
    this.noiseGenerator = new PerlinNoiseGenerator(seed)
    this.biome = biome

    // Carga asíncrona del DEM satelital si se selecciona el bioma Aconcagua
    if (this.biome === 'aconcagua') {
      ChunkManager.loadAconcaguaDEM().then((dem) => {
        if (dem) {
          this.regenerateActiveChunks()
        }
      })
    }
  }

  /**
   * Cargar heightmap DEM binario de Aconcagua (Copernicus/SRTM real de satélite)
   */
  public static async loadAconcaguaDEM(): Promise<Float32Array | null> {
    if (ChunkManager.aconcaguaDEM) return ChunkManager.aconcaguaDEM
    if (typeof window === 'undefined' || ChunkManager.aconcaguaLoading) return null

    ChunkManager.aconcaguaLoading = true
    try {
      const url = getAssetPath('/terrain/data/regions/aconcagua/heightmap.bin')
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buffer = await res.arrayBuffer()
      ChunkManager.aconcaguaDEM = new Float32Array(buffer)
      console.log('🏔️ [Aconcagua DEM] Relieve satelital real activo (512x512).')
      return ChunkManager.aconcaguaDEM
    } catch (err) {
      console.warn('⚠️ No se pudo cargar heightmap.bin de Aconcagua, usando procedural:', err)
      return null
    } finally {
      ChunkManager.aconcaguaLoading = false
    }
  }

  /**
   * Regenera la geometría de los chunks activos al completar la descarga del DEM
   */
  public regenerateActiveChunks(): void {
    this.chunks.forEach((chunk, key) => {
      const [chunkX, chunkZ] = key.split('_').map(Number)
      chunk.geometry.dispose()
      chunk.geometry = this.generateChunkGeometry(chunkX, chunkZ)
    })
  }

  /**
   * Muestrea el relieve real del Aconcagua con interpolación bilineal
   * y transición suave hacia la cordillera infinita en los límites exteriores
   */
  private sampleAconcaguaDEM(worldX: number, worldZ: number): number {
    const dem = ChunkManager.aconcaguaDEM
    const procH = this.noiseGenerator.getHeight(worldX, worldZ, this.config.heightMultiplier)
    if (!dem) return procH

    // El valle de Horcones (inicio seguro) está alineado a (0, 0)
    // La cumbre máxima (6.935m) se sitúa majestuosamente al frente a (worldX=0, worldZ=-1100)
    const valleyPx = 283
    const valleyPy = 433
    const meterPerPx = 5.2

    const px = valleyPx + worldX / meterPerPx
    const py = valleyPy + worldZ / meterPerPx

    let rawElev = 2600.0
    if (px >= 0 && px <= 510 && py >= 0 && py <= 510) {
      const x0 = Math.floor(px)
      const y0 = Math.floor(py)
      const x1 = x0 + 1
      const y1 = y0 + 1
      const fx = px - x0
      const fy = py - y0

      const e00 = dem[y0 * 512 + x0]
      const e10 = dem[y0 * 512 + x1]
      const e01 = dem[y1 * 512 + x0]
      const e11 = dem[y1 * 512 + x1]

      rawElev = (e00 * (1 - fx) + e10 * fx) * (1 - fy) + (e01 * (1 - fx) + e11 * fx) * fy
    }

    // Normalizar elevación satelital (de 2600m en valle a 6935m en cumbre)
    const norm = Math.max(0, Math.min(1, (rawElev - 2600.0) / (6935.0 - 2600.0)))
    const satH = 3.0 + Math.pow(norm, 1.15) * 142.0

    // Mezcla suave (blend) hacia el relieve procedural infinito en los bordes (radio 1000m - 1500m)
    const distFromCenter = Math.hypot(worldX, worldZ + 1100)
    const innerRadius = 1000.0
    const outerRadius = 1500.0

    if (distFromCenter <= innerRadius) {
      return satH
    } else if (distFromCenter >= outerRadius) {
      return procH
    } else {
      const t = (distFromCenter - innerRadius) / (outerRadius - innerRadius)
      const blend = 0.5 * (1 + Math.cos(Math.PI * t))
      return satH * blend + procH * (1 - blend)
    }
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
    
    // Modificar altura de cada vértice según Perlin Noise o DEM real
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
      let h = 0
      if (this.biome === 'aconcagua') {
        h = this.sampleAconcaguaDEM(x, z)
      } else {
        h = this.noiseGenerator.getHeight(x, z, heightMultiplier)
      }
      positions[i + 2] = h

      // Coloración natural según altitud y bioma
      if (this.biome === 'aconcagua') {
        // Paleta realista del macizo del Aconcagua:
        // Valle andino -> Puna y estepa -> Granito / pared sur -> Morrenas y glaciares -> Cumbres nevadas
        if (h < 6.0) {
          tempColor.set('#4e6b42') // Valle y orillas de laguna Horcones
        } else if (h < 22.0) {
          const t = (h - 6.0) / 16.0
          tempColor.set('#4e6b42').lerp(new THREE.Color('#666f48'), t) // Estepa andina / ichu
        } else if (h < 55.0) {
          const t = (h - 22.0) / 33.0
          tempColor.set('#666f48').lerp(new THREE.Color('#544e45'), t) // Paredes de roca oscura y acantilados
        } else if (h < 95.0) {
          const t = (h - 55.0) / 40.0
          tempColor.set('#544e45').lerp(new THREE.Color('#78736b'), t) // Pedregales de altura y morrena glaciar
        } else if (h < 120.0) {
          const t = (h - 95.0) / 25.0
          tempColor.set('#78736b').lerp(new THREE.Color('#b8cce0'), t) // Hielo glaciar y penitentes
        } else {
          const t = Math.min(1.0, (h - 120.0) / 20.0)
          tempColor.set('#b8cce0').lerp(new THREE.Color('#ffffff'), t) // Nieve perpetua de la cumbre
        }
      } else {
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
    if (this.biome === 'aconcagua') {
      return this.sampleAconcaguaDEM(worldX, worldZ)
    }
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
