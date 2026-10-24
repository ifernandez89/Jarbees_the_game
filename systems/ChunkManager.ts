import * as THREE from 'three'
import { PerlinNoiseGenerator } from '@/utils/perlinNoise'
import { getAssetPath } from '@/utils/assetPath'

export type BiomeType = 'titicaca' | 'easter_island' | 'constellations' | 'aconcagua' | 'antarctica'

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

  constructor(config: ChunkConfig, seed?: number, biome: BiomeType = 'aconcagua') {
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
      if (chunk.mesh) {
        chunk.mesh.geometry = chunk.geometry
      }
    })
  }

  /**
   * Muestrea el relieve real del Aconcagua con interpolación bilineal,
   * domain warping geológico y transición suave hacia la cordillera infinita
   */
  private sampleAconcaguaDEM(worldX: number, worldZ: number): number {
    const dem = ChunkManager.aconcaguaDEM
    const procH = this.noiseGenerator.getHeight(worldX, worldZ, this.config.heightMultiplier)
    if (!dem) return procH

    // Cumbre real del Monte Aconcagua (6.935m) centrada al frente a (worldX=0, worldZ=-900)
    // El punto de spawn del jugador en (0, 0) queda situado suavemente sobre el valle a nivel de orilla
    const peakPx = 182
    const peakPy = 184
    const peakWorldZ = -900.0
    const meterPerPx = 6.0
    const spawnRawElev = 3614.0 // Elevación base en el punto de spawn (px: 182, py: 334)

    // Domain warping geológico continuo: quiebra la cuadrícula rígida de píxeles del satélite
    // y crea líneas de cresta, espolones y contornos rocosos naturales
    const distFromSpawn = Math.hypot(worldX, worldZ)
    const warpDamping = Math.min(1.0, distFromSpawn / 35.0) // 0 en spawn para preservar nivel perfecto de orilla
    const warpX = Math.sin(worldZ * 0.012 + worldX * 0.007) * 4.0 * warpDamping
    const warpZ = Math.cos(worldX * 0.012 + worldZ * 0.007) * 4.0 * warpDamping

    const px = Math.max(0, Math.min(510, peakPx + (worldX + warpX) / meterPerPx))
    const py = Math.max(0, Math.min(510, peakPy + ((worldZ + warpZ) - peakWorldZ) / meterPerPx))

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

    const rawElev = (e00 * (1 - fx) + e10 * fx) * (1 - fy) + (e01 * (1 - fx) + e11 * fx) * fy

    // Normalizar elevación satelital: spawn a 2.5m, cumbre a 130m
    const norm = (rawElev - spawnRawElev) / (6935.0 - spawnRawElev)
    let satH: number
    if (norm >= 0) {
      satH = 2.5 + Math.pow(norm, 1.15) * 125.0
    } else {
      satH = Math.max(1.6, 2.5 + norm * 8.0)
    }

    // Micro-detalle geológico: rugosidad de estrato rocoso y canales de escorrentía en laderas altas
    if (satH > 5.0) {
      const rockNoise = this.noiseGenerator.getHeight(worldX * 0.35, worldZ * 0.35, 1.1)
      const altitudeFactor = Math.min(1.0, (satH - 5.0) / 25.0)
      satH += rockNoise * altitudeFactor
    }

    // Mezcla suave (blend) hacia el relieve procedural infinito en los bordes (radio 1100m - 1500m)
    const distFromCenter = Math.hypot(worldX, worldZ - peakWorldZ)
    const innerRadius = 1100.0
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
  /**
   * Generar geometría del terreno para un chunk con continuidad perfecta sin costuras
   */
  private generateChunkGeometry(chunkX: number, chunkZ: number): THREE.BufferGeometry {
    const { size, resolution } = this.config
    
    // Posición mundial del origen del chunk (esquina noroeste / mínima)
    const worldX = chunkX * size
    const worldZ = chunkZ * size
    
    // Número de segmentos
    const segments = Math.floor(size / resolution)
    
    // 1. Crear geometría de plano y rotarla horizontalmente al plano XZ (Y hacia arriba)
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments)
    geometry.rotateX(-Math.PI / 2)
    // 2. Desplazar para que el origen local sea (0, 0) y los vértices se extiendan de [0, size] en X y Z
    // Esto garantiza correspondencia 1:1 con la cuadrícula de chunks y elimina desfases con rocas/árboles
    geometry.translate(size / 2, 0, size / 2)
    
    // Obtener arrays de posiciones y normales
    const positions = geometry.attributes.position.array as Float32Array
    const normals = geometry.attributes.normal.array as Float32Array
    const colors = new Float32Array(positions.length)
    
    // Paleta naturalista de materiales según altitud y pendiente (roca en acantilados, pasto en valles)
    const colorValley = new THREE.Color('#3f5a28') // Verde pradera alpina
    const colorSteppe = new THREE.Color('#58633c') // Ichu / vegetación andina de altura
    const colorCliffDark = new THREE.Color('#464038') // Granito oscuro en paredes empinadas
    const colorRockHigh = new THREE.Color('#6c665e') // Pedregal y morrena glaciar
    const colorIce = new THREE.Color('#b3c8dc') // Hielo glaciar
    const colorSnow = new THREE.Color('#f5f8fa') // Nieve perpetua
    const tempColor = new THREE.Color()

    // Paso infinitesimal para cálculo de derivadas centrales continuas de normales
    const eps = 0.4

    for (let i = 0; i < positions.length; i += 3) {
      // Tras rotateX(-PI/2) y translate(size/2, 0, size/2):
      // positions[i] = local X en [0, size]
      // positions[i + 1] = local Y (altura, inicialmente 0)
      // positions[i + 2] = local Z en [0, size]
      const localX = positions[i]
      const localZ = positions[i + 2]
      const x = localX + worldX
      const z = localZ + worldZ
      
      const h = this.getHeightAt(x, z)
      positions[i + 1] = h

      // 3. Normal analítica global: garantiza iluminación continua sin costuras visibles entre chunks
      // N = normalize(h(x - eps, z) - h(x + eps, z), 2 * eps, h(x, z - eps) - h(x, z + eps))
      const hL = this.getHeightAt(x - eps, z)
      const hR = this.getHeightAt(x + eps, z)
      const hD = this.getHeightAt(x, z - eps)
      const hU = this.getHeightAt(x, z + eps)
      const nx = hL - hR
      const ny = 2 * eps
      const nz = hD - hU
      const len = Math.hypot(nx, ny, nz) || 1.0

      const normX = nx / len
      const normY = ny / len // Pendiente (1.0 = plano, < 0.7 = acantilado)
      const normZ = nz / len

      normals[i] = normX
      normals[i + 1] = normY
      normals[i + 2] = normZ

      // 4. Coloración biológica y geológica naturalista: función conjunta de altitud Y pendiente (slope)
      const slope = 1.0 - normY // 0 = plano, > 0.3 = pendiente pronunciada, > 0.55 = pared rocosa vertical

      if (this.biome === 'aconcagua') {
        if (h < 12.0) {
          // Valle bajo / Orillas: verde pastizal en plano, roca en paredes
          if (slope > 0.38) {
            tempColor.set(colorCliffDark)
          } else {
            const t = slope / 0.38
            tempColor.copy(colorValley).lerp(colorSteppe, t * 0.5)
          }
        } else if (h < 35.0) {
          // Estepa andina / Puna
          if (slope > 0.32) {
            tempColor.set(colorCliffDark)
          } else {
            const t = (h - 12.0) / 23.0
            tempColor.copy(colorValley).lerp(colorSteppe, t)
          }
        } else if (h < 75.0) {
          // Paredes de roca y acantilados
          if (slope > 0.25) {
            tempColor.set(colorCliffDark)
          } else {
            tempColor.copy(colorSteppe).lerp(colorRockHigh, (h - 35.0) / 40.0)
          }
        } else if (h < 110.0) {
          // Morrenas y glaciares colgantes
          if (slope > 0.45) {
            tempColor.set(colorCliffDark) // Paredes donde la nieve no se sostiene
          } else {
            const t = (h - 75.0) / 35.0
            tempColor.copy(colorRockHigh).lerp(colorIce, t)
          }
        } else {
          // Cumbres nevadas del Aconcagua (>110m)
          if (slope > 0.52) {
            tempColor.set(colorCliffDark) // Acantilado vertical sin nieve
          } else {
            const t = Math.min(1.0, (h - 110.0) / 25.0)
            tempColor.copy(colorIce).lerp(colorSnow, t)
          }
        }
      } else {
        if (h < 2.0) {
          tempColor.set('#586e42')
        } else if (h < 6.0) {
          const t = (h - 2.0) / 4.0
          tempColor.set('#586e42').lerp(new THREE.Color('#3f5e2d'), t)
        } else if (h < 12.0) {
          const t = (h - 6.0) / 6.0
          tempColor.set('#3f5e2d').lerp(new THREE.Color('#5d6840'), t)
        } else {
          tempColor.set('#6d665b')
        }
      }

      colors[i] = tempColor.r
      colors[i + 1] = tempColor.g
      colors[i + 2] = tempColor.b
    }
    
    // Asignar colores de vértices
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    // Marcar buffers actualizados y calcular bounds
    geometry.attributes.position.needsUpdate = true
    geometry.attributes.normal.needsUpdate = true
    geometry.computeBoundingBox()
    geometry.computeBoundingSphere()
    
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

// Precargar inmediatamente el DEM satelital de Aconcagua en el cliente al importar el módulo
if (typeof window !== 'undefined') {
  ChunkManager.loadAconcaguaDEM()
}
