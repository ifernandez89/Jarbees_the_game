/**
 * DEMDownloader - Sistema de descarga de datos DEM (Digital Elevation Model)
 * 
 * Soporta:
 * - Copernicus GLO-30 (30m resolución)
 * - USGS SRTM (30m resolución)
 * - Descarga por regiones (bounding box)
 * - Conversión a formato utilizable
 */

export interface DEMRegion {
  name: string
  bounds: {
    north: number  // Latitud norte
    south: number  // Latitud sur
    east: number   // Longitud este
    west: number   // Longitud oeste
  }
  resolution: number  // Metros por píxel
  source?: 'copernicus' | 'usgs' | 'local'
}

export interface DEMMetadata {
  region: DEMRegion
  downloadDate: string
  fileSize: number
  format: 'geotiff' | 'png' | 'raw'
  dataType: 'int16' | 'float32'
  noDataValue: number
  minElevation: number
  maxElevation: number
}

export interface DownloadProgress {
  phase: 'checking' | 'downloading' | 'processing' | 'complete'
  progress: number  // 0-1
  bytesDownloaded: number
  totalBytes: number
  message: string
}

/**
 * Gestiona la descarga y procesamiento de datos DEM
 */
export class DEMDownloader {
  private dataDirectory: string
  private cacheEnabled: boolean

  constructor(dataDirectory: string = './public/terrain/data', cacheEnabled: boolean = true) {
    this.dataDirectory = dataDirectory
    this.cacheEnabled = cacheEnabled
  }

  /**
   * Descarga una región específica de DEM
   */
  async downloadRegion(
    region: DEMRegion,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    // Verificar si ya existe en caché
    const cachedPath = this.getCachedPath(region)
    if (this.cacheEnabled && await this.exists(cachedPath)) {
      onProgress?.({
        phase: 'complete',
        progress: 1,
        bytesDownloaded: 0,
        totalBytes: 0,
        message: 'Using cached data'
      })
      return cachedPath
    }

    onProgress?.({
      phase: 'checking',
      progress: 0,
      bytesDownloaded: 0,
      totalBytes: 0,
      message: 'Checking region availability...'
    })

    // Determinar fuente
    const source = region.source || 'copernicus'

    switch (source) {
      case 'copernicus':
        return await this.downloadFromCopernicus(region, onProgress)
      case 'usgs':
        return await this.downloadFromUSGS(region, onProgress)
      case 'local':
        return await this.loadLocalData(region, onProgress)
      default:
        throw new Error(`Unknown DEM source: ${source}`)
    }
  }

  /**
   * Descarga desde Copernicus Data Space
   * Nota: En producción, esto requeriría autenticación y API calls reales
   */
  private async downloadFromCopernicus(
    region: DEMRegion,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    onProgress?.({
      phase: 'downloading',
      progress: 0.1,
      bytesDownloaded: 0,
      totalBytes: 0,
      message: 'Connecting to Copernicus Data Space...'
    })

    // Por ahora, usaremos datos locales pre-descargados
    // En producción, aquí iría la llamada a la API de Copernicus
    console.warn('Copernicus download not implemented - using local fallback')
    
    return await this.loadLocalData(region, onProgress)
  }

  /**
   * Descarga desde USGS EarthExplorer
   */
  private async downloadFromUSGS(
    region: DEMRegion,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    onProgress?.({
      phase: 'downloading',
      progress: 0.1,
      bytesDownloaded: 0,
      totalBytes: 0,
      message: 'Connecting to USGS EarthExplorer...'
    })

    // Similar a Copernicus, requeriría integración con API real
    console.warn('USGS download not implemented - using local fallback')
    
    return await this.loadLocalData(region, onProgress)
  }

  /**
   * Carga datos DEM desde archivos locales
   * Esta es la implementación práctica para el prototipo
   */
  private async loadLocalData(
    region: DEMRegion,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    const regionPath = `${this.dataDirectory}/regions/${region.name}`
    
    onProgress?.({
      phase: 'checking',
      progress: 0.3,
      bytesDownloaded: 0,
      totalBytes: 0,
      message: `Looking for local data: ${region.name}`
    })

    // Verificar si existen datos locales
    const metadataPath = `${regionPath}/metadata.json`
    if (await this.exists(metadataPath)) {
      onProgress?.({
        phase: 'complete',
        progress: 1,
        bytesDownloaded: 0,
        totalBytes: 0,
        message: 'Local data found'
      })
      return regionPath
    }

    // Si no existen, generar datos procedurales como fallback
    // (útil para testing sin necesidad de descargas reales)
    onProgress?.({
      phase: 'processing',
      progress: 0.5,
      bytesDownloaded: 0,
      totalBytes: 0,
      message: 'Generating procedural fallback data...'
    })

    await this.generateProceduralFallback(region, regionPath)

    onProgress?.({
      phase: 'complete',
      progress: 1,
      bytesDownloaded: 0,
      totalBytes: 0,
      message: 'Procedural data generated'
    })

    return regionPath
  }

  /**
   * Genera datos procedurales como fallback
   * Útil para desarrollo sin descargas reales
   */
  private async generateProceduralFallback(
    region: DEMRegion,
    outputPath: string
  ): Promise<void> {
    const metadata: DEMMetadata = {
      region,
      downloadDate: new Date().toISOString(),
      fileSize: 0,
      format: 'raw',
      dataType: 'int16',
      noDataValue: -32768,
      minElevation: 0,
      maxElevation: 8000,
    }

    // Guardar metadata
    // En un cliente web, esto se manejaría diferente (IndexedDB, localStorage, etc.)
    console.log('Generated metadata:', metadata)
    
    // Marcar como generado proceduralmente
    console.warn(`Region '${region.name}' will use procedural generation`)
  }

  /**
   * Obtiene metadata de una región descargada
   */
  async getMetadata(regionName: string): Promise<DEMMetadata | null> {
    const metadataPath = `${this.dataDirectory}/regions/${regionName}/metadata.json`
    
    if (!await this.exists(metadataPath)) {
      return null
    }

    try {
      // En un cliente web, esto vendría de fetch o IndexedDB
      // Por ahora retornamos un mock
      return null
    } catch (error) {
      console.error('Error loading metadata:', error)
      return null
    }
  }

  /**
   * Lista todas las regiones disponibles localmente
   */
  async listAvailableRegions(): Promise<string[]> {
    const regionsPath = `${this.dataDirectory}/regions`
    
    // En un cliente web, esto vendría de IndexedDB o una API
    // Por ahora retornamos regiones conocidas
    return [
      'aconcagua',
      'andes_central',
      'titicaca',
      'easter_island'
    ]
  }

  /**
   * Verifica si un archivo/directorio existe
   * En cliente web, esto checks IndexedDB o localStorage
   */
  private async exists(path: string): Promise<boolean> {
    // En Next.js, podemos usar fetch para verificar archivos en /public
    try {
      const publicPath = path.replace('./public', '')
      const response = await fetch(publicPath, { method: 'HEAD' })
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Obtiene la ruta de caché para una región
   */
  private getCachedPath(region: DEMRegion): string {
    return `${this.dataDirectory}/regions/${region.name}`
  }

  /**
   * Limpia caché de regiones no usadas
   */
  async clearCache(keepRegions?: string[]): Promise<void> {
    console.log('Cache clearing not implemented in web client')
    // En producción, limpiaría IndexedDB
  }

  /**
   * Obtiene el tamaño total de datos descargados
   */
  async getCacheSize(): Promise<number> {
    // En producción, calcularía el tamaño de IndexedDB
    return 0
  }
}

/**
 * Regiones predefinidas para acceso rápido
 */
export const PREDEFINED_REGIONS: Record<string, DEMRegion> = {
  aconcagua: {
    name: 'aconcagua',
    bounds: {
      north: -32.553,
      south: -32.753,
      east: -69.900,
      west: -70.100,
    },
    resolution: 30,
    source: 'copernicus'
  },
  
  andes_central: {
    name: 'andes_central',
    bounds: {
      north: -32.000,
      south: -33.500,
      east: -69.500,
      west: -71.000,
    },
    resolution: 30,
    source: 'copernicus'
  },
  
  titicaca: {
    name: 'titicaca',
    bounds: {
      north: -15.500,
      south: -16.500,
      east: -68.500,
      west: -69.500,
    },
    resolution: 30,
    source: 'copernicus'
  },
  
  easter_island: {
    name: 'easter_island',
    bounds: {
      north: -27.000,
      south: -27.250,
      east: -109.200,
      west: -109.500,
    },
    resolution: 30,
    source: 'copernicus'
  }
}
