/**
 * TerrainMetrics - Sistema de métricas y profiling
 * 
 * Recopila y analiza:
 * - FPS y tiempos de frame
 * - Estadísticas de chunks (activos, LOD, triángulos)
 * - Uso de memoria (VRAM, caché)
 * - Performance de carga (streaming, cache hits)
 * - Recomendaciones de optimización
 */

export interface FrameMetrics {
  fps: number
  frameTime: number  // ms
  updateTime: number  // ms
  renderTime: number  // ms
}

export interface ChunkMetrics {
  totalChunks: number
  visibleChunks: number
  lodLevels: Record<number, number>  // LOD level -> count
  totalVertices: number
  totalTriangles: number
}

export interface MemoryMetrics {
  cacheUsageMB: number
  cacheUsagePercent: number
  estimatedVRAM: number  // MB
  chunksInMemory: number
}

export interface StreamingMetrics {
  queueSize: number
  activeLoads: number
  loadedTotal: number
  failedTotal: number
  averageLoadTime: number  // ms
  cacheHitRate: number
}

export interface TerrainStats {
  frame: FrameMetrics
  chunks: ChunkMetrics
  memory: MemoryMetrics
  streaming: StreamingMetrics
  timestamp: number
}

export interface PerformanceRecommendation {
  severity: 'info' | 'warning' | 'critical'
  category: 'fps' | 'memory' | 'chunks' | 'streaming'
  message: string
  suggestion: string
}

/**
 * Sistema de métricas y análisis de performance
 */
export class TerrainMetrics {
  private history: TerrainStats[] = []
  private maxHistory: number = 60  // 60 frames de historia
  
  private lastFrameTime: number = 0
  private frameCount: number = 0
  private fpsUpdateInterval: number = 500  // Actualizar FPS cada 500ms
  private lastFPSUpdate: number = 0
  private currentFPS: number = 60

  constructor(maxHistory: number = 60) {
    this.maxHistory = maxHistory
  }

  /**
   * Registra estadísticas de un frame
   */
  recordFrame(stats: Partial<TerrainStats>): void {
    const now = performance.now()
    
    // Calcular FPS
    this.frameCount++
    if (now - this.lastFPSUpdate > this.fpsUpdateInterval) {
      const elapsed = now - this.lastFPSUpdate
      this.currentFPS = (this.frameCount / elapsed) * 1000
      this.frameCount = 0
      this.lastFPSUpdate = now
    }

    // Calcular frame time
    const frameTime = now - this.lastFrameTime
    this.lastFrameTime = now

    // Crear estadística completa
    const fullStats: TerrainStats = {
      frame: {
        fps: this.currentFPS,
        frameTime,
        updateTime: stats.frame?.updateTime || 0,
        renderTime: stats.frame?.renderTime || 0,
      },
      chunks: stats.chunks || {
        totalChunks: 0,
        visibleChunks: 0,
        lodLevels: {},
        totalVertices: 0,
        totalTriangles: 0,
      },
      memory: stats.memory || {
        cacheUsageMB: 0,
        cacheUsagePercent: 0,
        estimatedVRAM: 0,
        chunksInMemory: 0,
      },
      streaming: stats.streaming || {
        queueSize: 0,
        activeLoads: 0,
        loadedTotal: 0,
        failedTotal: 0,
        averageLoadTime: 0,
        cacheHitRate: 0,
      },
      timestamp: now,
    }

    // Añadir a historia
    this.history.push(fullStats)
    
    // Limitar historia
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }
  }

  /**
   * Obtiene las últimas estadísticas
   */
  getLatest(): TerrainStats | null {
    return this.history[this.history.length - 1] || null
  }

  /**
   * Obtiene promedio de FPS
   */
  getAverageFPS(frames: number = 60): number {
    const recent = this.history.slice(-frames)
    if (recent.length === 0) return 0
    
    const sum = recent.reduce((acc, s) => acc + s.frame.fps, 0)
    return sum / recent.length
  }

  /**
   * Obtiene promedio de frame time
   */
  getAverageFrameTime(frames: number = 60): number {
    const recent = this.history.slice(-frames)
    if (recent.length === 0) return 0
    
    const sum = recent.reduce((acc, s) => acc + s.frame.frameTime, 0)
    return sum / recent.length
  }

  /**
   * Detecta drops de FPS
   */
  detectFPSDrops(threshold: number = 30): boolean {
    const recent = this.history.slice(-10)
    if (recent.length < 10) return false
    
    const avgFPS = recent.reduce((acc, s) => acc + s.frame.fps, 0) / recent.length
    return avgFPS < threshold
  }

  /**
   * Analiza performance y genera recomendaciones
   */
  analyze(): PerformanceRecommendation[] {
    const latest = this.getLatest()
    if (!latest) return []

    const recommendations: PerformanceRecommendation[] = []

    // --- Análisis de FPS ---
    const avgFPS = this.getAverageFPS(30)
    
    if (avgFPS < 25) {
      recommendations.push({
        severity: 'critical',
        category: 'fps',
        message: `FPS muy bajo: ${avgFPS.toFixed(1)}`,
        suggestion: 'Reducir calidad a "low" o disminuir viewDistance'
      })
    } else if (avgFPS < 40) {
      recommendations.push({
        severity: 'warning',
        category: 'fps',
        message: `FPS bajo: ${avgFPS.toFixed(1)}`,
        suggestion: 'Reducir calidad a "medium" o reducir chunks visibles'
      })
    }

    // --- Análisis de Memoria ---
    if (latest.memory.cacheUsagePercent > 90) {
      recommendations.push({
        severity: 'warning',
        category: 'memory',
        message: `Caché casi llena: ${latest.memory.cacheUsagePercent.toFixed(1)}%`,
        suggestion: 'Aumentar cacheLimitMB o reducir viewDistance'
      })
    }

    if (latest.memory.estimatedVRAM > 4000) {
      recommendations.push({
        severity: 'warning',
        category: 'memory',
        message: `VRAM alta: ${latest.memory.estimatedVRAM.toFixed(0)} MB`,
        suggestion: 'Reducir chunks activos o resolution'
      })
    }

    // --- Análisis de Chunks ---
    if (latest.chunks.visibleChunks > 100) {
      recommendations.push({
        severity: 'warning',
        category: 'chunks',
        message: `Muchos chunks visibles: ${latest.chunks.visibleChunks}`,
        suggestion: 'Reducir viewDistance o aumentar chunkSize'
      })
    }

    if (latest.chunks.totalTriangles > 5000000) {
      recommendations.push({
        severity: 'warning',
        category: 'chunks',
        message: `Muchos triángulos: ${(latest.chunks.totalTriangles / 1000000).toFixed(1)}M`,
        suggestion: 'Mejorar LOD o reducir resolution'
      })
    }

    // --- Análisis de Streaming ---
    if (latest.streaming.cacheHitRate < 0.5 && latest.streaming.loadedTotal > 20) {
      recommendations.push({
        severity: 'info',
        category: 'streaming',
        message: `Baja tasa de cache hits: ${(latest.streaming.cacheHitRate * 100).toFixed(0)}%`,
        suggestion: 'Aumentar cacheLimitMB para mejor reuso'
      })
    }

    if (latest.streaming.averageLoadTime > 1000) {
      recommendations.push({
        severity: 'warning',
        category: 'streaming',
        message: `Carga lenta: ${latest.streaming.averageLoadTime.toFixed(0)}ms`,
        suggestion: 'Optimizar heightmaps o usar datos pre-procesados'
      })
    }

    return recommendations
  }

  /**
   * Genera reporte de texto
   */
  generateReport(): string {
    const latest = this.getLatest()
    if (!latest) return 'No data available'

    const avgFPS = this.getAverageFPS(30)
    const recommendations = this.analyze()

    let report = '=== TERRAIN PERFORMANCE REPORT ===\n\n'
    
    report += `FPS: ${avgFPS.toFixed(1)} (current: ${latest.frame.fps.toFixed(1)})\n`
    report += `Frame Time: ${latest.frame.frameTime.toFixed(2)}ms\n\n`
    
    report += `Chunks: ${latest.chunks.visibleChunks} visible / ${latest.chunks.totalChunks} total\n`
    report += `Triangles: ${(latest.chunks.totalTriangles / 1000).toFixed(0)}K\n`
    report += `Vertices: ${(latest.chunks.totalVertices / 1000).toFixed(0)}K\n\n`
    
    report += `Memory: ${latest.memory.cacheUsageMB.toFixed(1)} MB (${latest.memory.cacheUsagePercent.toFixed(1)}%)\n`
    report += `Estimated VRAM: ${latest.memory.estimatedVRAM.toFixed(0)} MB\n\n`
    
    report += `Streaming: ${latest.streaming.queueSize} queued, ${latest.streaming.activeLoads} loading\n`
    report += `Cache Hit Rate: ${(latest.streaming.cacheHitRate * 100).toFixed(0)}%\n`
    report += `Avg Load Time: ${latest.streaming.averageLoadTime.toFixed(0)}ms\n\n`

    if (recommendations.length > 0) {
      report += '=== RECOMMENDATIONS ===\n\n'
      for (const rec of recommendations) {
        report += `[${rec.severity.toUpperCase()}] ${rec.message}\n`
        report += `  → ${rec.suggestion}\n\n`
      }
    } else {
      report += '✓ Performance is good!\n'
    }

    return report
  }

  /**
   * Exporta datos para gráficos
   */
  exportForCharting() {
    return {
      fps: this.history.map(s => ({ time: s.timestamp, value: s.frame.fps })),
      frameTime: this.history.map(s => ({ time: s.timestamp, value: s.frame.frameTime })),
      chunks: this.history.map(s => ({ time: s.timestamp, value: s.chunks.visibleChunks })),
      memory: this.history.map(s => ({ time: s.timestamp, value: s.memory.cacheUsageMB })),
      triangles: this.history.map(s => ({ time: s.timestamp, value: s.chunks.totalTriangles })),
    }
  }

  /**
   * Limpia historial
   */
  clear(): void {
    this.history = []
    this.frameCount = 0
    this.lastFrameTime = 0
    this.lastFPSUpdate = 0
  }
}

/**
 * Helper para formatear números grandes
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toFixed(0)
}

/**
 * Helper para formatear bytes
 */
export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  } else if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${bytes} B`
}
