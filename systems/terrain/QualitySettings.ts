/**
 * QualitySettings - Configuración de calidad gráfica optimizada
 */

import type { QualityPreset } from './RealTerrainSystem'

export interface DetailedQualityConfig {
  viewDistance: number
  chunkSize: number
  resolution: number
  lodLevels: number
  lodDistances: number[]
  maxConcurrentLoads: number
  cacheLimitMB: number
  maxChunks: number
  targetFPS: number
}

export const QUALITY_PRESETS: Record<QualityPreset, DetailedQualityConfig> = {
  low: {
    viewDistance: 2000,
    chunkSize: 2000,
    resolution: 60,
    lodLevels: 3,
    lodDistances: [500, 1000, 1500],
    maxConcurrentLoads: 2,
    cacheLimitMB: 512,
    maxChunks: 20,
    targetFPS: 60,
  },
  
  medium: {
    viewDistance: 5000,
    chunkSize: 1000,
    resolution: 30,
    lodLevels: 4,
    lodDistances: [1000, 2500, 4000],
    maxConcurrentLoads: 4,
    cacheLimitMB: 1024,
    maxChunks: 50,
    targetFPS: 60,
  },
  
  high: {
    viewDistance: 10000,
    chunkSize: 1000,
    resolution: 30,
    lodLevels: 4,
    lodDistances: [2000, 5000, 8000],
    maxConcurrentLoads: 6,
    cacheLimitMB: 2048,
    maxChunks: 100,
    targetFPS: 60,
  },
  
  ultra: {
    viewDistance: 20000,
    chunkSize: 1000,
    resolution: 15,
    lodLevels: 5,
    lodDistances: [3000, 7000, 12000, 17000],
    maxConcurrentLoads: 8,
    cacheLimitMB: 4096,
    maxChunks: 200,
    targetFPS: 45,
  },
}

export class QualityDetector {
  static async detectOptimalQuality(): Promise<QualityPreset> {
    const isMobile = /mobile|android|iphone|ipad/i.test(navigator.userAgent)
    if (isMobile) return 'low'
    
    const memory = (performance as any).memory
    const totalMemoryMB = memory?.jsHeapSizeLimit / (1024 * 1024) || 2048
    
    if (totalMemoryMB > 8000) return 'high'
    if (totalMemoryMB > 4000) return 'medium'
    return 'low'
  }
}
