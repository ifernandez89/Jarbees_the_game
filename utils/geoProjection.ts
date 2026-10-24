/**
 * GeoProjection - Conversión de coordenadas geográficas reales (WGS84) a coordenadas 3D de Three.js
 * 
 * Ejes en Three.js:
 * - X+: Este (Longitud positiva)
 * - X-: Oeste (Longitud negativa)
 * - Z-: Norte (Latitud positiva)
 * - Z+: Sur (Latitud negativa)
 * - Y+: Elevación sobre el terreno
 */

export interface GeoCoordinate {
  lat: number
  lon: number
  elevation?: number
}

export interface WorldPoint3D {
  x: number
  y: number
  z: number
}

// Radio medio de la Tierra en metros (WGS84)
export const EARTH_RADIUS_METERS = 6371000

/**
 * Convierte grados a radianes
 */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Convierte radianes a grados
 */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI
}

/**
 * Calcula la distancia ortodrómica real en metros (Haversine) entre dos coordenadas
 */
export function calculateHaversineDistance(
  coord1: GeoCoordinate,
  coord2: GeoCoordinate
): number {
  const dLat = toRadians(coord2.lat - coord1.lat)
  const dLon = toRadians(coord2.lon - coord1.lon)
  const lat1 = toRadians(coord1.lat)
  const lat2 = toRadians(coord2.lat)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_METERS * c
}

export class GeoProjector {
  private originLat: number
  private originLon: number
  private originRadLat: number
  private originRadLon: number
  private cosOriginLat: number
  private worldScale: number

  /**
   * @param origin Coordenada geográfica (lat, lon) que corresponderá a (x=0, z=0) en la escena 3D
   * @param worldScale Factor de escala para el mundo 3D (por defecto 1 metro real = 1 unidad Three.js)
   */
  constructor(origin: GeoCoordinate, worldScale: number = 1.0) {
    this.originLat = origin.lat
    this.originLon = origin.lon
    this.originRadLat = toRadians(origin.lat)
    this.originRadLon = toRadians(origin.lon)
    this.cosOriginLat = Math.cos(this.originRadLat)
    this.worldScale = worldScale
  }

  /**
   * Proyecta una coordenada real a coordenadas locales 3D (x, y, z)
   * @param coord Coordenada real
   * @param groundHeightProvider Función opcional para consultar la altura del terreno en (x, z)
   * @param hipOffset Altura flotante sobre el terreno / cadera (default: 1.2 metros)
   * @param maxLocalDistance Distancia máxima local para evitar que hitos a 1500km se alejen infinitamente
   */
  project(
    coord: GeoCoordinate,
    groundHeightProvider?: (x: number, z: number) => number,
    hipOffset: number = 1.2,
    maxDistanceThreshold: number = 3000
  ): WorldPoint3D {
    const dLon = toRadians(coord.lon - this.originLon)
    const dLat = toRadians(coord.lat - this.originLat)

    // Proyección cartográfica local equirrectangular (precisa para áreas locales y polares con corrección de coseno)
    let rawX = dLon * this.cosOriginLat * EARTH_RADIUS_METERS * this.worldScale
    let rawZ = -dLat * EARTH_RADIUS_METERS * this.worldScale // Norte es -Z

    // Si el punto está ultra lejano (ej. Polo Sur a 1.300 km), lo proyectamos en el horizonte táctico
    const rawDist = Math.hypot(rawX, rawZ)
    if (rawDist > maxDistanceThreshold) {
      const compression = maxDistanceThreshold + Math.log10(1 + (rawDist - maxDistanceThreshold) * 0.01) * 200
      const ratio = compression / rawDist
      rawX *= ratio
      rawZ *= ratio
    }

    const groundY = groundHeightProvider ? groundHeightProvider(rawX, rawZ) : 0
    const y = groundY + hipOffset

    return { x: rawX, y, z: rawZ }
  }

  /**
   * Desproyecta una coordenada 3D del juego (x, z) a coordenadas geográficas (lat, lon)
   */
  unproject(x: number, z: number): GeoCoordinate {
    const scaledX = x / this.worldScale
    const scaledZ = z / this.worldScale

    const dLat = -scaledZ / EARTH_RADIUS_METERS
    const dLon = scaledX / (this.cosOriginLat * EARTH_RADIUS_METERS)

    return {
      lat: this.originLat + toDegrees(dLat),
      lon: this.originLon + toDegrees(dLon),
    }
  }

  getOrigin(): GeoCoordinate {
    return { lat: this.originLat, lon: this.originLon }
  }
}
