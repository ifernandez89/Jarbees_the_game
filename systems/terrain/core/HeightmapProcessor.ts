/**
 * HeightmapProcessor - Convierte datos DEM en heightmaps utilizables
 * 
 * Funciones:
 * - Convertir GeoTIFF a heightmap 2D
 * - Normalizar valores de elevación
 * - Generar tiles para chunks
 * - Calcular normales y metadatos
 */

export interface HeightmapData {
  width: number
  height: number
  data: Float32Array  // Elevaciones normalizadas (metros)
  minElevation: number
  maxElevation: number
  resolution: number  // Metros por píxel
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
}

export interface HeightmapTile {
  x: number  // Índice X del tile
  z: number  // Índice Z del tile
  size: number  // Tamaño en píxeles
  data: Float32Array
  minElevation: number
  maxElevation: number
}

export interface ProcessingOptions {
  tileSize?: number  // Tamaño de tiles para chunking (default: 256)
  smoothing?: boolean  // Suavizar heightmap (default: false)
  smoothingRadius?: number  // Radio de suavizado (default: 1)
  noDataValue?: number  // Valor que representa "sin datos" (default: -32768)
  fillNoData?: boolean  // Rellenar valores sin datos (default: true)
}

/**
 * Procesa datos DEM en heightmaps utilizables
 */
export class HeightmapProcessor {
  
  /**
   * Carga un heightmap desde una región DEM
   */
  async loadHeightmap(regionPath: string, options: ProcessingOptions = {}): Promise<HeightmapData> {
    const {
      smoothing = false,
      smoothingRadius = 1,
      noDataValue = -32768,
      fillNoData = true,
    } = options

    // Intentar cargar desde archivo procesado
    const processedPath = `${regionPath}/heightmap.bin`
    const metadataPath = `${regionPath}/metadata.json`

    try {
      const heightmapData = await this.loadProcessedHeightmap(processedPath, metadataPath)
      
      if (smoothing) {
        this.smoothHeightmap(heightmapData, smoothingRadius)
      }
      
      return heightmapData
    } catch (error) {
      console.warn('Could not load processed heightmap, generating procedural:', error)
      
      // Fallback: generar heightmap procedural
      return this.generateProceduralHeightmap(regionPath)
    }
  }

  /**
   * Carga un heightmap ya procesado
   */
  private async loadProcessedHeightmap(
    heightmapPath: string,
    metadataPath: string
  ): Promise<HeightmapData> {
    // En un cliente web, esto vendría de fetch o IndexedDB
    const publicHeightmapPath = heightmapPath.replace('./public', '')
    const publicMetadataPath = metadataPath.replace('./public', '')

    try {
      // Intentar cargar metadata
      const metadataResponse = await fetch(publicMetadataPath)
      if (!metadataResponse.ok) throw new Error('Metadata not found')
      
      const metadata = await metadataResponse.json()

      // Intentar cargar datos binarios
      const dataResponse = await fetch(publicHeightmapPath)
      if (!dataResponse.ok) throw new Error('Heightmap data not found')
      
      const arrayBuffer = await dataResponse.arrayBuffer()
      const data = new Float32Array(arrayBuffer)

      return {
        width: metadata.width,
        height: metadata.height,
        data,
        minElevation: metadata.minElevation,
        maxElevation: metadata.maxElevation,
        resolution: metadata.resolution,
        bounds: metadata.bounds,
      }
    } catch (error) {
      throw new Error(`Failed to load heightmap: ${error}`)
    }
  }

  /**
   * Genera un heightmap procedural como fallback
   * Útil para desarrollo sin datos reales
   */
  private async generateProceduralHeightmap(regionPath: string): Promise<HeightmapData> {
    console.log('Generating procedural heightmap for:', regionPath)

    // Generar un heightmap procedural usando Perlin noise
    // Esto es temporal hasta tener datos DEM reales
    const width = 1024
    const height = 1024
    const data = new Float32Array(width * height)

    // Simular montañas con ruido procedural
    for (let z = 0; z < height; z++) {
      for (let x = 0; x < width; x++) {
        const index = z * width + x
        
        // Usar múltiples octavas de ruido para crear terreno interesante
        const nx = x / width
        const nz = z / height
        
        let elevation = 0
        let amplitude = 1000
        let frequency = 1
        
        // 4 octavas de ruido
        for (let octave = 0; octave < 4; octave++) {
          elevation += this.noise2D(nx * frequency, nz * frequency) * amplitude
          amplitude *= 0.5
          frequency *= 2
        }
        
        // Simular cordillera (elevación mayor en el centro)
        const centerDistance = Math.sqrt(
          Math.pow(nx - 0.5, 2) + 
          Math.pow(nz - 0.5, 2)
        )
        const centerBias = Math.max(0, 1 - centerDistance * 2)
        elevation += centerBias * 2000
        
        data[index] = Math.max(0, elevation)
      }
    }

    const minElevation = Math.min(...Array.from(data))
    const maxElevation = Math.max(...Array.from(data))

    return {
      width,
      height,
      data,
      minElevation,
      maxElevation,
      resolution: 30, // 30 metros por píxel (Copernicus GLO-30)
      bounds: {
        north: -32.553,
        south: -32.753,
        east: -69.900,
        west: -70.100,
      }
    }
  }

  /**
   * Función de ruido simple (placeholder - en producción usar simplex-noise)
   */
  private noise2D(x: number, y: number): number {
    // Simple pseudo-random noise
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
    return (n - Math.floor(n)) * 2 - 1
  }

  /**
   * Suaviza el heightmap usando promedio de vecinos
   */
  private smoothHeightmap(heightmap: HeightmapData, radius: number): void {
    const { width, height, data } = heightmap
    const tempData = new Float32Array(data)

    for (let z = radius; z < height - radius; z++) {
      for (let x = radius; x < width - radius; x++) {
        let sum = 0
        let count = 0

        // Promediar vecinos
        for (let dz = -radius; dz <= radius; dz++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const index = (z + dz) * width + (x + dx)
            sum += tempData[index]
            count++
          }
        }

        const index = z * width + x
        data[index] = sum / count
      }
    }
  }

  /**
   * Extrae un tile específico del heightmap
   */
  extractTile(
    heightmap: HeightmapData,
    tileX: number,
    tileZ: number,
    tileSize: number
  ): HeightmapTile {
    const { width, height, data } = heightmap
    
    const startX = tileX * tileSize
    const startZ = tileZ * tileSize
    const endX = Math.min(startX + tileSize, width)
    const endZ = Math.min(startZ + tileSize, height)
    
    const tileWidth = endX - startX
    const tileHeight = endZ - startZ
    const tileData = new Float32Array(tileWidth * tileHeight)

    let minElevation = Infinity
    let maxElevation = -Infinity

    // Copiar datos del tile
    for (let z = 0; z < tileHeight; z++) {
      for (let x = 0; x < tileWidth; x++) {
        const sourceIndex = (startZ + z) * width + (startX + x)
        const targetIndex = z * tileWidth + x
        
        const elevation = data[sourceIndex]
        tileData[targetIndex] = elevation

        minElevation = Math.min(minElevation, elevation)
        maxElevation = Math.max(maxElevation, elevation)
      }
    }

    return {
      x: tileX,
      z: tileZ,
      size: tileSize,
      data: tileData,
      minElevation,
      maxElevation,
    }
  }

  /**
   * Genera tiles del heightmap completo
   */
  generateTiles(heightmap: HeightmapData, tileSize: number = 256): HeightmapTile[] {
    const { width, height } = heightmap
    const tiles: HeightmapTile[] = []

    const tilesX = Math.ceil(width / tileSize)
    const tilesZ = Math.ceil(height / tileSize)

    for (let z = 0; z < tilesZ; z++) {
      for (let x = 0; x < tilesX; x++) {
        tiles.push(this.extractTile(heightmap, x, z, tileSize))
      }
    }

    return tiles
  }

  /**
   * Calcula normales para un heightmap
   * Útil para iluminación correcta del terreno
   */
  calculateNormals(heightmap: HeightmapData): Float32Array {
    const { width, height, data, resolution } = heightmap
    const normals = new Float32Array(width * height * 3)

    for (let z = 0; z < height; z++) {
      for (let x = 0; x < width; x++) {
        const index = z * width + x
        const normalIndex = index * 3

        // Obtener alturas vecinas (con bounds checking)
        const heightL = x > 0 ? data[index - 1] : data[index]
        const heightR = x < width - 1 ? data[index + 1] : data[index]
        const heightD = z > 0 ? data[index - width] : data[index]
        const heightU = z < height - 1 ? data[index + width] : data[index]

        // Calcular vectores tangentes
        const dx = (heightR - heightL) / (2 * resolution)
        const dz = (heightU - heightD) / (2 * resolution)

        // Normal = normalizar(-dx, 1, -dz)
        const length = Math.sqrt(dx * dx + 1 + dz * dz)
        
        normals[normalIndex + 0] = -dx / length
        normals[normalIndex + 1] = 1 / length
        normals[normalIndex + 2] = -dz / length
      }
    }

    return normals
  }

  /**
   * Obtiene la elevación en una coordenada específica (con interpolación)
   */
  getElevationAt(
    heightmap: HeightmapData,
    x: number,
    z: number,
    interpolate: boolean = true
  ): number {
    const { width, height, data } = heightmap

    if (!interpolate) {
      // Sin interpolación
      const ix = Math.floor(x)
      const iz = Math.floor(z)
      
      if (ix < 0 || ix >= width || iz < 0 || iz >= height) {
        return 0
      }
      
      return data[iz * width + ix]
    }

    // Con interpolación bilineal
    const ix0 = Math.floor(x)
    const iz0 = Math.floor(z)
    const ix1 = Math.min(ix0 + 1, width - 1)
    const iz1 = Math.min(iz0 + 1, height - 1)

    if (ix0 < 0 || ix0 >= width || iz0 < 0 || iz0 >= height) {
      return 0
    }

    const fx = x - ix0
    const fz = z - iz0

    const h00 = data[iz0 * width + ix0]
    const h10 = data[iz0 * width + ix1]
    const h01 = data[iz1 * width + ix0]
    const h11 = data[iz1 * width + ix1]

    // Interpolación bilineal
    const h0 = h00 * (1 - fx) + h10 * fx
    const h1 = h01 * (1 - fx) + h11 * fx
    
    return h0 * (1 - fz) + h1 * fz
  }

  /**
   * Genera LODs (Levels of Detail) del heightmap
   */
  generateLODs(heightmap: HeightmapData, levels: number = 4): HeightmapData[] {
    const lods: HeightmapData[] = [heightmap]

    for (let level = 1; level < levels; level++) {
      const prevLOD = lods[level - 1]
      const newWidth = Math.floor(prevLOD.width / 2)
      const newHeight = Math.floor(prevLOD.height / 2)
      const newData = new Float32Array(newWidth * newHeight)

      // Downsample usando promedio 2x2
      for (let z = 0; z < newHeight; z++) {
        for (let x = 0; x < newWidth; x++) {
          const sx = x * 2
          const sz = z * 2
          
          const i00 = sz * prevLOD.width + sx
          const i10 = sz * prevLOD.width + (sx + 1)
          const i01 = (sz + 1) * prevLOD.width + sx
          const i11 = (sz + 1) * prevLOD.width + (sx + 1)

          const avg = (
            prevLOD.data[i00] +
            prevLOD.data[i10] +
            prevLOD.data[i01] +
            prevLOD.data[i11]
          ) / 4

          newData[z * newWidth + x] = avg
        }
      }

      lods.push({
        ...prevLOD,
        width: newWidth,
        height: newHeight,
        data: newData,
        resolution: prevLOD.resolution * 2
      })
    }

    return lods
  }
}
