/**
 * Auren Navigation System (ANS) - NavigationService
 * 
 * Módulo desacoplado del motor de chunks encargado de:
 * 1. Resolver rumbos geodésicos absolutos y relativos (-180° a +180°).
 * 2. Calcular distancias ortodrómicas reales (Haversine) y euclidianas 3D:
 *    d_3D = sqrt(d_horiz^2 + delta_elev^2)
 * 3. Gestionar el catálogo mundial de cumbres y destinos de expedición.
 */

import { toRadians, toDegrees, EARTH_RADIUS_METERS, type GeoCoordinate } from '@/utils/geoProjection'

export interface NavigationTarget {
  id: string
  name: string
  region: string
  latitude: number
  longitude: number
  elevation: number // Metros sobre el nivel del mar
  category: 'peak' | 'volcano' | 'landmark' | 'origin'
  tagline: string
  description?: string
  color?: string
}

export interface NavigationState {
  target: NavigationTarget | null
  bearing: number             // Rumbo absoluto hacia el objetivo (0° a 360°, Norte = 0°)
  playerHeading: number       // Rumbo actual de Auren / Cámara (0° a 360°)
  relativeBearing: number     // Rumbo relativo al frente de Auren (-180° a +180°)
  horizontalDistance: number  // Distancia horizontal en metros
  directDistance: number      // Distancia directa 3D en metros
  elevationDifference: number // Desnivel en metros (Target - Auren)
  arrivalStatus: 'traveling' | 'approaching' | 'arrived'
  targetWorldPos: [number, number, number] // Posición 3D proyectada en el mundo del juego
}

/**
 * Catálogo inicial de cumbres geográficas reales
 */
export const WORLD_TARGETS: NavigationTarget[] = [
  {
    id: 'aconcagua',
    name: 'Cerro Aconcagua',
    region: 'Cordillera de los Andes (Argentina)',
    latitude: -32.6532,
    longitude: -70.0109,
    elevation: 6961,
    category: 'peak',
    tagline: 'Techo de América · Cumbre más alta fuera de Asia',
    description: 'El coloso indiscutido del hemisferio occidental y sur.',
    color: '#38bdf8',
  },
  {
    id: 'ojos_del_salado',
    name: 'Nevado Ojos del Salado',
    region: 'Andes de Atacama (Chile / Argentina)',
    latitude: -27.1092,
    longitude: -68.5414,
    elevation: 6893,
    category: 'volcano',
    tagline: 'Volcán activo más alto del planeta Tierra',
    description: 'Estratovolcán gigante que alberga el lago más alto del mundo.',
    color: '#fb923c',
  },
  {
    id: 'chimborazo',
    name: 'Volcán Chimborazo',
    region: 'Cordillera Occidental (Ecuador)',
    latitude: -1.4693,
    longitude: -78.8172,
    elevation: 6263,
    category: 'volcano',
    tagline: 'Punto más alejado del centro de la Tierra',
    description: 'Su cumbre supera al Everest en distancia desde el centro del planeta por 2.168 m.',
    color: '#f43f5e',
  },
  {
    id: 'mount_everest',
    name: 'Monte Everest (Chomolungma)',
    region: 'Himalaya (Nepal / Tíbet)',
    latitude: 27.9881,
    longitude: 86.9250,
    elevation: 8848.86,
    category: 'peak',
    tagline: 'Máxima elevación sobre el nivel del mar',
    description: 'El techo absoluto del planeta en la Zona de la Muerte.',
    color: '#a855f7',
  },
  {
    id: 'mount_erebus',
    name: 'Monte Erebus',
    region: 'Isla de Ross (Antártida)',
    latitude: -77.5333,
    longitude: 167.1667,
    elevation: 3794,
    category: 'volcano',
    tagline: 'Volcán activo más austral con lago de magma',
    description: 'Faro volcánico perpetuo en medio del continente blanco.',
    color: '#ef4444',
  },
  {
    id: 'blood_falls',
    name: 'Blood Falls (Cuna de Auren)',
    region: 'Valles Secos de McMurdo (Antártida)',
    latitude: -77.7220,
    longitude: 162.2730,
    elevation: 65,
    category: 'origin',
    tagline: 'Punto Cero de despliegue de la armadura JarBees',
    description: 'Cascada de salmuera carmesí rica en hierro que fluye del glaciar Taylor.',
    color: '#10b981',
  },
]

/**
 * Calcula el rumbo geodésico inicial (Bearing en grados 0-360) entre dos coordenadas reales
 */
export function calculateGeodesicBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = toRadians(lat1)
  const phi2 = toRadians(lat2)
  const deltaLambda = toRadians(lon2 - lon1)

  const y = Math.sin(deltaLambda) * Math.cos(phi2)
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda)

  const theta = Math.atan2(y, x)
  return (toDegrees(theta) + 360) % 360
}

/**
 * Calcula el rumbo relativo normalizado entre -180° y +180°
 * relativo al rumbo del jugador (0° = directamente al frente)
 */
export function calculateRelativeBearing(targetBearing: number, playerHeading: number): number {
  return ((targetBearing - playerHeading + 540) % 360) - 180
}

/**
 * Calcula distancia ortodrómica real en metros (Haversine)
 */
export function calculateGeodesicDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const rLat1 = toRadians(lat1)
  const rLat2 = toRadians(lat2)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(rLat1) * Math.cos(rLat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_METERS * c
}

/**
 * Servicio singleton de navegación de Auren
 */
export class NavigationService {
  private currentTarget: NavigationTarget | null = WORLD_TARGETS[0] // Aconcagua por defecto

  getCurrentTarget(): NavigationTarget | null {
    return this.currentTarget
  }

  setTarget(target: NavigationTarget | null): void {
    this.currentTarget = target
  }

  setTargetById(targetId: string): void {
    const found = WORLD_TARGETS.find((t) => t.id === targetId)
    if (found) {
      this.currentTarget = found
    }
  }

  /**
   * Resuelve el estado de navegación en tiempo real
   * @param currentLat Latitud estimada del jugador
   * @param currentLon Longitud estimada del jugador
   * @param currentAltitude Altitud actual del jugador (m)
   * @param playerHeading Rumbo actual de Auren/cámara (grados, 0 = Norte)
   * @param worldOrigin Lat/Lon del centro (x=0, z=0) de la escena actual
   */
  resolveState(
    currentLat: number,
    currentLon: number,
    currentAltitude: number,
    playerHeading: number,
    worldOrigin: GeoCoordinate = { lat: -77.722, lon: 162.273 }
  ): NavigationState {
    const target = this.currentTarget

    if (!target) {
      return {
        target: null,
        bearing: 0,
        playerHeading,
        relativeBearing: 0,
        horizontalDistance: 0,
        directDistance: 0,
        elevationDifference: 0,
        arrivalStatus: 'traveling',
        targetWorldPos: [0, 0, 0],
      }
    }

    // 1. Rumbo y Distancia Horizontal Geodésica
    const bearing = calculateGeodesicBearing(
      currentLat,
      currentLon,
      target.latitude,
      target.longitude
    )
    const relativeBearing = calculateRelativeBearing(bearing, playerHeading)
    const horizontalDistance = calculateGeodesicDistance(
      currentLat,
      currentLon,
      target.latitude,
      target.longitude
    )

    // 2. Desnivel y Distancia Directa 3D
    const elevationDifference = target.elevation - currentAltitude
    const directDistance = Math.hypot(horizontalDistance, elevationDifference)

    // 3. Estado de llegada
    let arrivalStatus: 'traveling' | 'approaching' | 'arrived' = 'traveling'
    if (directDistance <= 150) {
      arrivalStatus = 'arrived'
    } else if (directDistance <= 1200) {
      arrivalStatus = 'approaching'
    }

    // 4. Proyección a coordenadas 3D locales en el mundo Three.js
    // Usando la proyección equirrectangular corregida por latitud
    const cosOriginLat = Math.cos(toRadians(worldOrigin.lat))
    const dLon = toRadians(target.longitude - worldOrigin.lon)
    const dLat = toRadians(target.latitude - worldOrigin.lat)

    let rawX = dLon * cosOriginLat * EARTH_RADIUS_METERS
    let rawZ = -dLat * EARTH_RADIUS_METERS

    // Para objetivos a escala continental (ej. > 2.500m), comprimir suavemente la posición del vector visual
    const dist2D = Math.hypot(rawX, rawZ)
    if (dist2D > 2500) {
      const compressedDist = 2500 + Math.log10(1 + (dist2D - 2500) * 0.01) * 300
      const ratio = compressedDist / dist2D
      rawX *= ratio
      rawZ *= ratio
    }

    // Escalar altura proporcionalmente al relieve del juego (100 unidades Three.js ~ 4.000m)
    const visualY = (target.elevation / 40) + 1.5

    return {
      target,
      bearing,
      playerHeading,
      relativeBearing,
      horizontalDistance,
      directDistance,
      elevationDifference,
      arrivalStatus,
      targetWorldPos: [rawX, visualY, rawZ],
    }
  }
}

export const navigationService = new NavigationService()
